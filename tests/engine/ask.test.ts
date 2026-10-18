import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import { startPlay } from '@/engine/play';
import { ask } from '@/engine/ask';
import { search } from '@/engine/search';
import { setCustomLLM, resetLLMCallCount } from '@/engine/llm';
import { deleteGraph, closeDb } from '@/engine/db';
import { POST } from '@/app/api/ask/route';

describe('ask.ts, suspect.ts, firewall.ts, llm.ts — Ask Pipeline (Task A6)', () => {
  const pOff = 'p_ask_off';
  const pLeak = 'p_ask_leak';
  const pRoute = 'p_ask_route';

  beforeEach(() => {
    setCustomLLM(null);
    resetLLMCallCount();
  });

  afterAll(async () => {
    await deleteGraph(`play:${pOff}:l1-quiet-pact`);
    await deleteGraph(`play:${pOff}:l2-stopped-watch`);
    await deleteGraph(`play:${pLeak}:l1-quiet-pact`);
    await deleteGraph(`play:${pRoute}:l1-quiet-pact`);
    await closeDb();
  });

  it('with ALIBI_LLM=off, returns authored claim text and attaches tell observation', async () => {
    process.env.ALIBI_LLM = 'off';
    await startPlay({ playerId: pOff, caseId: 'l1-quiet-pact', reset: true });

    // Ask Dee about whereabouts at slot 5
    const res = await ask({
      playerId: pOff,
      caseId: 'l1-quiet-pact',
      suspectId: 'dee',
      topic: 'whereabouts',
      slot: 5,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.status).toBe('answered');
      expect(res.data.source).toBe('template_fallback');
      expect(res.data.newStatements.length).toBeGreaterThanOrEqual(1);

      // Verify claim c1_dee_loc5 text
      const loc5Stmt = res.data.newStatements.find((s) => s.claimId === 'c1_dee_loc5');
      expect(loc5Stmt).toBeDefined();
      expect(res.data.reply).toContain('green room');

      // Dee has a tell attached to c1_dee_loc5: "Touches her lanyard while mentioning the bell."
      expect(res.data.observation).toBe('Touches her lanyard while mentioning the bell.');
      // Ensure observation does NOT state whether it is reliable
      expect(JSON.stringify(res.data.observation)).not.toContain('reliable');
    }

    // Asking again when claims on that topic and slot are exhausted returns nothing_new
    const res2 = await ask({
      playerId: pOff,
      caseId: 'l1-quiet-pact',
      suspectId: 'dee',
      topic: 'whereabouts',
      slot: 5,
    });

    expect(res2.ok).toBe(true);
    if (res2.ok) {
      expect(res2.data.status).toBe('nothing_new');
      expect(res2.data.newStatements).toEqual([]);
      expect(res2.data.reply).toContain('already told you');
    }
  });

  it('unlocked claims appear only after their required evidence is found', async () => {
    process.env.ALIBI_LLM = 'off';
    await startPlay({ playerId: pOff, caseId: 'l2-stopped-watch', reset: true });

    // In Level 2, Rufus has claim c2_r_saw_beatrix: requires e2_tab, topic: witness
    // Before finding e2_tab, asking Rufus on topic 'witness' should find no claims requiring e2_tab
    const beforeSearch = await ask({
      playerId: pOff,
      caseId: 'l2-stopped-watch',
      suspectId: 'rufus',
      topic: 'witness',
    });

    expect(beforeSearch.ok).toBe(true);
    if (beforeSearch.ok) {
      const rSawBefore = beforeSearch.data.newStatements.find((s) => s.claimId === 'c2_r_saw_beatrix');
      expect(rSawBefore).toBeUndefined();
    }

    // Now search main_hall (which finds e2_tab in L2)
    const searchRes = await search({
      playerId: pOff,
      caseId: 'l2-stopped-watch',
      roomId: 'main_hall',
    });
    expect(searchRes.ok).toBe(true);

    // Now ask Rufus on topic 'witness' -> c2_r_saw_beatrix is unlocked!
    const afterSearch = await ask({
      playerId: pOff,
      caseId: 'l2-stopped-watch',
      suspectId: 'rufus',
      topic: 'witness',
    });

    expect(afterSearch.ok).toBe(true);
    if (afterSearch.ok) {
      const rSawAfter = afterSearch.data.newStatements.find((s) => s.claimId === 'c2_r_saw_beatrix');
      expect(rSawAfter).toBeDefined();
      expect(rSawAfter?.claimId).toBe('c2_r_saw_beatrix');
    }
  });

  it('firewall retries when fake LLM leaks forbidden keyword, then falls back to template', async () => {
    process.env.ALIBI_LLM = 'live';
    await startPlay({ playerId: pLeak, caseId: 'l1-quiet-pact', reset: true });

    let callAttempts = 0;
    // Fake LLM always leaks "box office" (which is a forbidden keyword for this claim)
    setCustomLLM(async ({ prompt, isRetry }) => {
      callAttempts++;
      if (isRetry) {
        expect(prompt).toContain('IMPORTANT: Your previous reply contained unauthorized information');
      }
      return {
        reply: 'I was running lines in the green room but I also saw the box office lock was open.',
        claimIds: ['c1_dee_loc5'],
      };
    });

    const res = await ask({
      playerId: pLeak,
      caseId: 'l1-quiet-pact',
      suspectId: 'dee',
      topic: 'whereabouts',
      slot: 5,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      // It should have called the LLM twice (initial + 1 retry)
      expect(callAttempts).toBe(2);
      // Firewall detected the leak
      expect(res.data.firewall.passed).toBe(false);
      expect(res.data.firewall.violations.some((v) => v.includes('Forbidden keyword'))).toBe(true);
      // Fell back to template text safely
      expect(res.data.source).toBe('template_fallback');
      expect(res.data.reply).not.toContain('box office');
    }
  });

  it('firewall retries and succeeds if second LLM response cleans up the violation', async () => {
    process.env.ALIBI_LLM = 'live';
    await startPlay({ playerId: pLeak, caseId: 'l1-quiet-pact', reset: true });

    let callAttempts = 0;
    setCustomLLM(async ({ isRetry }) => {
      callAttempts++;
      if (!isRetry) {
        // First try leaks
        return {
          reply: 'I was in the green room and saw someone near the box office.',
          claimIds: ['c1_dee_loc5'],
        };
      }
      // Second try is clean
      return {
        reply: 'I was in the green room with Kofi and Hana, running our lines.',
        claimIds: ['c1_dee_loc5'],
      };
    });

    const res = await ask({
      playerId: pLeak,
      caseId: 'l1-quiet-pact',
      suspectId: 'dee',
      topic: 'whereabouts',
      slot: 5,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(callAttempts).toBe(2);
      expect(res.data.firewall.passed).toBe(true);
      expect(res.data.source).toBe('llm');
      expect(res.data.reply).toBe('I was in the green room with Kofi and Hana, running our lines.');
    }
  });

  it('enforces information barrier: nothing in response or play graph carries truth', async () => {
    process.env.ALIBI_LLM = 'off';
    const res = await ask({
      playerId: pOff,
      caseId: 'l1-quiet-pact',
      suspectId: 'hana',
      topic: 'whereabouts',
      slot: 5,
    });

    expect(res.ok).toBe(true);
    const json = JSON.stringify(res);
    expect(json).not.toContain('truth:');
    expect(json).not.toContain('culprits');
    expect(json).not.toContain('knownBy');
  });

  it('returns in-character contextual responses for routine time, unencountered witnesses, and missing evidence', async () => {
    process.env.ALIBI_LLM = 'off';
    await startPlay({ playerId: pOff, caseId: 'l1-quiet-pact', reset: true });

    // 1. Asking Kofi about routine hour (slot 1: 7:00) where he has no authored alibi
    const routineRes = await ask({
      playerId: pOff,
      caseId: 'l1-quiet-pact',
      suspectId: 'kofi',
      topic: 'whereabouts',
      slot: 1,
    });
    expect(routineRes.ok).toBe(true);
    if (routineRes.ok) {
      expect(routineRes.data.status).toBe('nothing_new');
      expect(routineRes.data.newStatements).toEqual([]);
      // Should give in-character reply about the early hour rather than "already told you"
      expect(routineRes.data.reply).toContain('control board');
      expect(routineRes.data.reply).not.toContain('already told you');
    }

    // 2. Asking Dee if she saw Okoye at slot 5 (she only saw Kofi and Hana)
    const witnessRes = await ask({
      playerId: pOff,
      caseId: 'l1-quiet-pact',
      suspectId: 'dee',
      topic: 'witness',
      slot: 5,
      about: 'okoye',
    });
    expect(witnessRes.ok).toBe(true);
    if (witnessRes.ok) {
      expect(witnessRes.data.status).toBe('nothing_new');
      expect(witnessRes.data.reply).toContain('Okoye');
    }

    // 3. Asking Rufus in L2 at slot 3 about Beatrix before finding e2_tab (claim requires e2_tab)
    await startPlay({ playerId: pOff, caseId: 'l2-stopped-watch', reset: true });
    const lockedRes = await ask({
      playerId: pOff,
      caseId: 'l2-stopped-watch',
      suspectId: 'rufus',
      topic: 'witness',
      slot: 3,
      about: 'beatrix',
    });
    expect(lockedRes.ok).toBe(true);
    if (lockedRes.ok) {
      expect(lockedRes.data.status).toBe('nothing_new');
      expect(lockedRes.data.reply).toContain("you've actually got");
    }
  });

  it('handles POST /api/ask route handler', async () => {
    process.env.ALIBI_LLM = 'off';
    await startPlay({ playerId: pRoute, caseId: 'l1-quiet-pact', reset: true });

    const request = new Request('http://localhost:3000/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: pRoute,
        caseId: 'l1-quiet-pact',
        suspectId: 'dee',
        topic: 'whereabouts',
        slot: 5,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.data.status).toBe('answered');
  });
});
