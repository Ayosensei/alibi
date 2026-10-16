import { describe, it, expect, afterAll } from 'vitest';
import { startPlay } from '@/engine/play';
import { search, calculateWindow, eliminate } from '@/engine/search';
import { getBoard } from '@/engine/board';
import { deleteGraph, closeDb, ro } from '@/engine/db';
import { POST } from '@/app/api/search/route';
import { CaseSchema } from '@/engine/schema';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Q64_map_edges, Q66b_all_hard_anchors } from '@/engine/queries';
import { checkFeasibility, type MapEdgeRecord, type HardAnchorRecord } from '@/engine/map';

describe('search.ts & board.ts — Board Writes, Search and Elimination (Task A3)', () => {
  const pSeq = 'player_seq_test';
  const pL2 = 'player_l2_test';

  afterAll(async () => {
    await deleteGraph(`play:${pSeq}:l3-blackout-dinner`);
    await deleteGraph(`play:${pL2}:l2-stopped-watch`);
    await closeDb();
  });

  it('verifies Level 3 sequencing guarantees (no hinge -> hinge only -> with notebook)', async () => {
    // Start Level 3 clean
    await startPlay({ playerId: pSeq, caseId: 'l3-blackout-dinner', reset: true });
    const playGraph = `play:${pSeq}:l3-blackout-dinner`;
    const casePath = join(process.cwd(), 'cases', 'l3-blackout-dinner.json');
    const caseData = CaseSchema.parse(JSON.parse(readFileSync(casePath, 'utf8')));
    const rooms = caseData.rooms.map((r) => r.id);

    // 1. Search hall (finds e3_studylock, e3_wifi: Roz and Imani @ conservatory 4)
    const hallRes = await search({ playerId: pSeq, caseId: 'l3-blackout-dinner', roomId: 'hall' });
    expect(hallRes.ok).toBe(true);

    // 2. Search drawing room (finds e3_recording: Felix @ drawing room 3, 4, 5)
    const drawRes = await search({ playerId: pSeq, caseId: 'l3-blackout-dinner', roomId: 'drawing_room' });
    expect(drawRes.ok).toBe(true);

    // 3. Search kitchen (finds e3_meter: act slot 4 kitchen for [edmund, clara, roz, felix])
    // Edmund in study, Roz in conservatory, Felix in drawing room -> Clara sole survivor!
    const kitRes = await search({ playerId: pSeq, caseId: 'l3-blackout-dinner', roomId: 'kitchen' });
    expect(kitRes.ok).toBe(true);
    if (kitRes.ok) {
      expect(kitRes.data.inferred).toEqual([
        { person: 'clara', slot: 4, room: 'kitchen' },
      ]);
    }

    // Sequence Check A: NO HINGE (nobody can reach the study)
    // The study alarm act requires slot 5 in study for [clara, tobias, roz, imani, gideon, felix]
    const mapNoHinge = await ro<MapEdgeRecord>({ graphName: playGraph, query: Q64_map_edges });
    const anchorsNoHinge = await ro<HardAnchorRecord>({ graphName: playGraph, query: Q66b_all_hard_anchors });
    const candidates = ['clara', 'tobias', 'roz', 'imani', 'gideon', 'felix'];

    const survivorsNoHinge = candidates.filter((c) => {
      const f = checkFeasibility(c, 5, 'study', rooms, mapNoHinge.data, anchorsNoHinge.data);
      return f.feasible;
    });
    // With no hinge discovered, study has 0 open edges: nobody can reach it
    expect(survivorsNoHinge).toEqual([]);

    // 4. Search library (finds e3_hinge -> reveals hidden passage, e3_libdoor: Tobias @ library 4)
    const libRes = await search({ playerId: pSeq, caseId: 'l3-blackout-dinner', roomId: 'library' });
    expect(libRes.ok).toBe(true);
    if (libRes.ok) {
      expect(libRes.data.revealedEdge).toBe(true);
    }

    // Sequence Check B: HINGE ONLY (two survivors: Tobias and Gideon)
    // Knowers not yet established (notebook e3_plan not found), so anyone can use passage
    const mapHingeOnly = await ro<MapEdgeRecord>({ graphName: playGraph, query: Q64_map_edges });
    const anchorsHingeOnly = await ro<HardAnchorRecord>({ graphName: playGraph, query: Q66b_all_hard_anchors });

    const survivorsHingeOnly = candidates.filter((c) => {
      const f = checkFeasibility(c, 5, 'study', rooms, mapHingeOnly.data, anchorsHingeOnly.data);
      return f.feasible;
    });
    // Exactly Tobias and Gideon survive!
    expect(survivorsHingeOnly).toEqual(['tobias', 'gideon']);

    // 5. Search study (finds e3_plan: notebook with knowers, and e3_alarm)
    const studyRes = await search({ playerId: pSeq, caseId: 'l3-blackout-dinner', roomId: 'study' });
    expect(studyRes.ok).toBe(true);
    if (studyRes.ok) {
      // Sequence Check C: WITH THE NOTEBOOK (Tobias only!)
      // Inferred anchors should include Clara @ kitchen 4 and Tobias @ study 5
      expect(studyRes.data.inferred).toEqual([
        { person: 'clara', slot: 4, room: 'kitchen' },
        { person: 'tobias', slot: 5, room: 'study' },
      ]);
    }

    // Verify board state via getBoard
    const boardRes = await getBoard({ playerId: pSeq, caseId: 'l3-blackout-dinner' });
    expect(boardRes.ok).toBe(true);
    if (boardRes.ok) {
      expect(boardRes.data.hiddenEdgeKnown).toBe(true);
      expect(boardRes.data.searchedRooms).toContain('hall');
      expect(boardRes.data.searchedRooms).toContain('library');
      expect(boardRes.data.searchedRooms).toContain('study');
      expect(boardRes.data.evidence.length).toBeGreaterThanOrEqual(8);
      expect(boardRes.data.tick).toBe(5); // 5 searches
    }
  });

  it('rejects duplicate searches with ALREADY_SEARCHED', async () => {
    const dupRes = await search({ playerId: pSeq, caseId: 'l3-blackout-dinner', roomId: 'hall' });
    expect(dupRes.ok).toBe(false);
    if (!dupRes.ok) {
      expect(dupRes.error.code).toBe('ALREADY_SEARCHED');
    }
  });

  it('updates dynamic window in Level 2 (suggests [5] -> revises [3])', async () => {
    await startPlay({ playerId: pL2, caseId: 'l2-stopped-watch', reset: true });
    const playGraph = `play:${pL2}:l2-stopped-watch`;
    const casePath = join(process.cwd(), 'cases', 'l2-stopped-watch.json');
    const caseData = CaseSchema.parse(JSON.parse(readFileSync(casePath, 'utf8')));

    // Initially window is publicWindow (null for L2 before evidence is found)
    const initialWindow = await calculateWindow(caseData, playGraph);
    expect(initialWindow).toBeNull();

    // Search foyer: no window change
    const s1 = await search({ playerId: pL2, caseId: 'l2-stopped-watch', roomId: 'foyer' });
    expect(s1.ok).toBe(true);
    if (s1.ok) {
      expect(s1.data.windowChanged).toBeNull();
    }

    // Search cabinet_room (holds e2_watch [5] and e2_coroner [3] with windowKind: revises)
    const s2 = await search({ playerId: pL2, caseId: 'l2-stopped-watch', roomId: 'cabinet_room' });
    expect(s2.ok).toBe(true);
    if (s2.ok) {
      expect(s2.data.windowChanged).toEqual([3]);
    }

    // Now calculateWindow returns [3]
    const revisedWindow = await calculateWindow(caseData, playGraph);
    expect(revisedWindow).toEqual([3]);
  });

  it('handles POST /api/search route handler correctly', async () => {
    const request = new Request('http://localhost:3000/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: pL2, caseId: 'l2-stopped-watch', roomId: 'main_hall' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.found).toBeDefined();
    expect(body.trace).toBeDefined();
  });
});
