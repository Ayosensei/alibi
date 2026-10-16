import { describe, it, expect, afterAll } from 'vitest';
import {
  startPlay,
  getTick,
  incrementTick,
  saveProgress,
  getProgress,
} from '@/engine/play';
import { deleteGraph, run, ro, closeDb } from '@/engine/db';
import { POST } from '@/app/api/start/route';

describe('play.ts — Play Lifecycle and Tenant Isolation (Task A2)', () => {
  const p1 = 'player_alpha';
  const p2 = 'player_beta';
  const caseId = 'l3-blackout-dinner';

  afterAll(async () => {
    await deleteGraph(`play:${p1}:${caseId}`);
    await deleteGraph(`play:${p2}:${caseId}`);
    await deleteGraph(`player:${p1}`);
    await closeDb();
  });

  it('initializes play graphs for players and isolates tenant state', async () => {
    const res1 = await startPlay({ playerId: p1, caseId, reset: true });
    expect(res1.ok).toBe(true);

    const res2 = await startPlay({ playerId: p2, caseId, reset: true });
    expect(res2.ok).toBe(true);

    // Initial ticks are 0
    expect(await getTick(p1, caseId)).toBe(0);
    expect(await getTick(p2, caseId)).toBe(0);

    // Advance tick for p1 twice
    await incrementTick(p1, caseId);
    const tick1 = await incrementTick(p1, caseId);
    expect(tick1).toBe(2);

    // Verify p2 tick remains isolated at 0
    expect(await getTick(p2, caseId)).toBe(0);

    // Write a statement node to p1 graph
    await run({
      graphName: `play:${p1}:${caseId}`,
      query: 'CREATE (:Statement {id: "stmt_p1_only", text: "private to p1"})',
    });

    // Verify statement exists in p1
    const checkP1 = await ro<{ id: string }>({
      graphName: `play:${p1}:${caseId}`,
      query: 'MATCH (s:Statement {id: "stmt_p1_only"}) RETURN s.id AS id',
    });
    expect(checkP1.data.length).toBe(1);

    // Verify statement does NOT exist in p2 (isolation)
    const checkP2 = await ro<{ id: string }>({
      graphName: `play:${p2}:${caseId}`,
      query: 'MATCH (s:Statement {id: "stmt_p1_only"}) RETURN s.id AS id',
    });
    expect(checkP2.data.length).toBe(0);
  });

  it('reset restores tick 0 and clears board progress', async () => {
    // Current tick for p1 is 2
    expect(await getTick(p1, caseId)).toBe(2);

    // Start with reset: true
    const resetRes = await startPlay({ playerId: p1, caseId, reset: true });
    expect(resetRes.ok).toBe(true);

    // Tick must be restored to 0
    expect(await getTick(p1, caseId)).toBe(0);

    // Previously created statement must be gone
    const checkP1 = await ro<{ id: string }>({
      graphName: `play:${p1}:${caseId}`,
      query: 'MATCH (s:Statement {id: "stmt_p1_only"}) RETURN s.id AS id',
    });
    expect(checkP1.data.length).toBe(0);
  });

  it('passes the information barrier leak test on all cases', async () => {
    for (const c of ['l1-quiet-pact', 'l2-stopped-watch', 'l3-blackout-dinner']) {
      const res = await startPlay({ playerId: 'leak_tester', caseId: c, reset: true });
      expect(res.ok).toBe(true);
      if (!res.ok) continue;

      const serialized = JSON.stringify(res.data);
      const data = res.data;

      // 1. No truth object or truth properties
      expect(serialized).not.toContain('"truth"');
      expect(serialized).not.toContain('"culprits"');
      expect(serialized).not.toContain('"knownBy"');

      // 2. Hidden edges omitted
      expect(serialized).not.toContain('"hidden"');
      for (const edge of data.edges) {
        expect(['open', 'locked']).toContain(edge.state);
        expect(edge).not.toHaveProperty('discoveredBy');
      }

      // 3. Personas omitted (used only in suspect prompt)
      for (const person of data.people) {
        expect(person).not.toHaveProperty('persona');
      }

      // 4. Claims and evidence not leaked in start response
      expect(data).not.toHaveProperty('claims');
      expect(data).not.toHaveProperty('evidence');

      await deleteGraph(`play:leak_tester:${c}`);
    }
  });

  it('tracks cross-level player progress in player:{pid}', async () => {
    await saveProgress(p1, 'l1-quiet-pact', 3, 1);
    await saveProgress(p1, 'l2-stopped-watch', 2, 2);

    const progress = await getProgress(p1);
    expect(progress.length).toBe(2);

    const l1 = progress.find((p) => p.caseId === 'l1-quiet-pact');
    const l2 = progress.find((p) => p.caseId === 'l2-stopped-watch');

    expect(l1?.stars).toBe(3);
    expect(l1?.accusations).toBe(1);
    expect(l2?.stars).toBe(2);
    expect(l2?.accusations).toBe(2);
  });

  it('handles POST /api/start route handler correctly', async () => {
    const request = new Request('http://localhost:3000/api/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: p1, caseId: 'l1-quiet-pact', reset: true }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.caseId).toBe('l1-quiet-pact');
    expect(body.data.crimeScene).toBe('prop_store');
    expect(body.data.rooms.length).toBeGreaterThan(0);
    expect(body.data.edges.length).toBeGreaterThan(0);
    expect(body.trace).toBeDefined();

    await deleteGraph(`play:${p1}:l1-quiet-pact`);
  });

  it('returns UNKNOWN_CASE error envelope for non-existent case', async () => {
    const res = await startPlay({ playerId: p1, caseId: 'non-existent-case' });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe('UNKNOWN_CASE');
    }
  });
});
