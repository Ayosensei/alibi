import { describe, it, expect, beforeAll } from 'vitest';
import { ensureCases } from '@/engine/seed';
import { startPlay, getProgress } from '@/engine/play';
import { search } from '@/engine/search';
import { ask } from '@/engine/ask';
import { useBait } from '@/engine/bait';
import { accuse } from '@/engine/verdict';
import { POST as baitPost } from '@/app/api/bait/route';
import { POST as accusePost } from '@/app/api/accuse/route';

describe('Bait, Accuse, and Verdict (Task A7)', () => {
  beforeAll(async () => {
    await ensureCases();
  });

  describe('useBait action', () => {
    it('handles sharp bait (b2_ring) with slip, writes statement and flag, and decrements baitsLeft', async () => {
      const pid = 'test_bait_player_sharp';
      await startPlay({ playerId: pid, caseId: 'l2-stopped-watch', reset: true });

      const res = await useBait({
        playerId: pid,
        caseId: 'l2-stopped-watch',
        baitId: 'b2_ring',
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.data.outcome).toBe('slip');
      expect(res.data.baitsLeft).toBe(0); // Level 2 allows 1 bait
      expect(res.data.reactions).toHaveLength(1);
      expect(res.data.reactions[0].person).toBe('beatrix');
      expect(res.data.reactions[0].text).toContain('In the planter? Nonsense');
      expect(res.data.newStatements).toHaveLength(1);
      expect(res.data.newStatements[0].by).toBe('beatrix');

      // Attempting to reuse the same bait returns BAD_ARGS
      const retrySame = await useBait({
        playerId: pid,
        caseId: 'l2-stopped-watch',
        baitId: 'b2_ring',
      });
      expect(retrySame.ok).toBe(false);
      if (!retrySame.ok) {
        expect(retrySame.error.code).toBe('BAD_ARGS');
      }

      // Attempting to use another bait when baitsLeft is 0 returns NO_BAITS_LEFT
      const retryOther = await useBait({
        playerId: pid,
        caseId: 'l2-stopped-watch',
        baitId: 'b2_gate',
      });
      expect(retryOther.ok).toBe(false);
      if (!retryOther.ok) {
        expect(retryOther.error.code).toBe('NO_BAITS_LEFT');
      }
    });

    it('handles ambiguous bait (b2_gate) with multiple reactors and neutral reactions', async () => {
      const pid = 'test_bait_player_ambig';
      await startPlay({ playerId: pid, caseId: 'l2-stopped-watch', reset: true });

      const res = await useBait({
        playerId: pid,
        caseId: 'l2-stopped-watch',
        baitId: 'b2_gate',
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.data.outcome).toBe('ambiguous');
      expect(res.data.baitsLeft).toBe(0);
      expect(res.data.reactions).toHaveLength(2);
      const reactors = res.data.reactions.map((r) => r.person).sort();
      expect(reactors).toEqual(['dorian', 'rufus']);
      expect(res.data.reactions[0].text).toContain('The camera? I could not say.');
      expect(res.data.newStatements).toHaveLength(0);
    });

    it('handles inert bait (b2_second) with outcome nothing and no reactions', async () => {
      const pid = 'test_bait_player_nothing';
      await startPlay({ playerId: pid, caseId: 'l2-stopped-watch', reset: true });

      const res = await useBait({
        playerId: pid,
        caseId: 'l2-stopped-watch',
        baitId: 'b2_second',
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.data.outcome).toBe('nothing');
      expect(res.data.baitsLeft).toBe(0);
      expect(res.data.reactions).toHaveLength(0);
      expect(res.data.newStatements).toHaveLength(0);
    });

    it('returns BAD_ARGS for invalid baitId', async () => {
      const pid = 'test_bait_player_unknown';
      await startPlay({ playerId: pid, caseId: 'l2-stopped-watch', reset: true });

      const res = await useBait({
        playerId: pid,
        caseId: 'l2-stopped-watch',
        baitId: 'nonexistent_bait',
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('BAD_ARGS');
      }
    });
  });

  describe('accuse and verdict — Level 1 (l1-quiet-pact)', () => {
    it('evaluates subset accusation as partial without consuming lives or leaking truth', async () => {
      const pid = 'test_l1_partial';
      await startPlay({ playerId: pid, caseId: 'l1-quiet-pact', reset: true });

      // Dee and Kofi are culprits, but Hana is also a culprit
      const res = await accuse({
        playerId: pid,
        caseId: 'l1-quiet-pact',
        persons: ['dee', 'kofi'],
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.data.result).toBe('partial');
      expect(res.data.wrongLeft).toBe(2); // no life lost
      expect(res.data.levelOver).toBe(false);
      expect(res.data.revealed).toBeNull(); // no leak
      expect(res.data.replay).toHaveLength(0);
      expect(res.data.found).toHaveLength(0);
      expect(res.data.missed).toHaveLength(0);
      expect(res.data.stars).toBe(0);
    });

    it('evaluates wrong accusations, decrements wrongLeft, and ends level when lives hit 0', async () => {
      const pid = 'test_l1_wrong';
      await startPlay({ playerId: pid, caseId: 'l1-quiet-pact', reset: true });

      // First wrong accusation: Okoye is innocent
      const r1 = await accuse({
        playerId: pid,
        caseId: 'l1-quiet-pact',
        persons: ['okoye'],
      });
      expect(r1.ok).toBe(true);
      if (!r1.ok) return;
      expect(r1.data.result).toBe('wrong');
      expect(r1.data.wrongLeft).toBe(1);
      expect(r1.data.levelOver).toBe(false);
      expect(r1.data.revealed).toBeNull();

      // Second wrong accusation: Dee (culprit) + Okoye (innocent)
      const r2 = await accuse({
        playerId: pid,
        caseId: 'l1-quiet-pact',
        persons: ['dee', 'okoye'],
      });
      expect(r2.ok).toBe(true);
      if (!r2.ok) return;
      expect(r2.data.result).toBe('wrong');
      expect(r2.data.wrongLeft).toBe(0);
      expect(r2.data.levelOver).toBe(true);
      expect(r2.data.stars).toBe(0);
      expect(r2.data.revealed).not.toBeNull();
      expect(r2.data.revealed?.culprits.sort()).toEqual(['dee', 'hana', 'kofi']);
      expect(r2.data.replay.length).toBeGreaterThan(0);

      // Cannot accuse again after level is over
      const r3 = await accuse({
        playerId: pid,
        caseId: 'l1-quiet-pact',
        persons: ['dee', 'kofi', 'hana'],
      });
      expect(r3.ok).toBe(false);
      if (!r3.ok) {
        expect(r3.error.code).toBe('LEVEL_OVER');
      }
    });

    it('accepts full solution on cold board with 2 stars (solving + 0 wrong accusations, but proof missing)', async () => {
      const pid = 'test_l1_full_cold';
      await startPlay({ playerId: pid, caseId: 'l1-quiet-pact', reset: true });

      const res = await accuse({
        playerId: pid,
        caseId: 'l1-quiet-pact',
        persons: ['dee', 'kofi', 'hana'],
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.data.result).toBe('full');
      expect(res.data.wrongLeft).toBe(2);
      expect(res.data.levelOver).toBe(true);
      expect(res.data.stars).toBe(2); // 1 (solve) + 0 (proof incomplete) + 1 (0 wrong accusations)
      expect(res.data.revealed).not.toBeNull();
      expect(res.data.revealed?.culprits.sort()).toEqual(['dee', 'hana', 'kofi']);
      expect(res.data.revealed?.method).toContain('blow to the head');

      // On cold board, none of the proof items are found
      expect(res.data.found).toHaveLength(0);
      expect(res.data.missed.length).toBeGreaterThan(0);

      // Verify progress was recorded in player graph
      const progress = await getProgress(pid);
      expect(progress).toHaveLength(1);
      expect(progress[0].caseId).toBe('l1-quiet-pact');
      expect(progress[0].stars).toBe(2);
      expect(progress[0].accusations).toBe(1);
    });

    it('accepts full solution on scripted board with 3 stars when all proof is derived', async () => {
      const pid = 'test_l1_full_3stars';
      await startPlay({ playerId: pid, caseId: 'l1-quiet-pact', reset: true });

      // Gather proof items:
      // 1. Evidence: e1_doorlog in prop_store
      await search({ playerId: pid, caseId: 'l1-quiet-pact', roomId: 'prop_store' });

      // 2. Claims: whereabouts at slot 5 for Dee, Kofi, Hana
      await ask({ playerId: pid, caseId: 'l1-quiet-pact', suspectId: 'dee', topic: 'whereabouts', slot: 5 });
      await ask({ playerId: pid, caseId: 'l1-quiet-pact', suspectId: 'kofi', topic: 'whereabouts', slot: 5 });
      await ask({ playerId: pid, caseId: 'l1-quiet-pact', suspectId: 'hana', topic: 'whereabouts', slot: 5 });

      // Accuse full culprits
      const res = await accuse({
        playerId: pid,
        caseId: 'l1-quiet-pact',
        persons: ['hana', 'kofi', 'dee'],
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.data.result).toBe('full');
      expect(res.data.stars).toBe(3); // 1 solve + 1 all proof + 1 zero wrong
      expect(res.data.missed).toHaveLength(0);
      expect(res.data.found.length).toBeGreaterThanOrEqual(4); // 3 contradictions + 1 rehearsed
    });
  });

  describe('accuse and verdict — Level 2 (l2-stopped-watch) and Level 3 (l3-blackout-dinner)', () => {
    it('demonstrates Level 2 accusation and proof evaluation with sharp bait and window revises', async () => {
      const pid = 'test_l2_accuse';
      await startPlay({ playerId: pid, caseId: 'l2-stopped-watch', reset: true });

      // Use sharp bait
      await useBait({ playerId: pid, caseId: 'l2-stopped-watch', baitId: 'b2_ring' });

      // Search cabinet_room (finds e2_coroner with revises window, e2_watch, e2_cabinetlog)
      await search({ playerId: pid, caseId: 'l2-stopped-watch', roomId: 'cabinet_room' });

      // Search main_hall (finds e2_tab)
      await search({ playerId: pid, caseId: 'l2-stopped-watch', roomId: 'main_hall' });

      // Ask Beatrix at slot 3
      await ask({ playerId: pid, caseId: 'l2-stopped-watch', suspectId: 'beatrix', topic: 'whereabouts', slot: 3 });

      // Accuse Beatrix
      const res = await accuse({
        playerId: pid,
        caseId: 'l2-stopped-watch',
        persons: ['beatrix'],
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.data.result).toBe('full');
      expect(res.data.levelOver).toBe(true);
      expect(res.data.revealed?.culprits).toEqual(['beatrix']);

      // Sharp bait b2_ring should be in found
      const baitFound = res.data.found.some((f) => f.includes('b2_ring'));
      expect(baitFound).toBe(true);

      // Window revised should be in found
      const windowFound = res.data.found.some((f) => f.includes('window revised') || f.includes('Medical examiner'));
      expect(windowFound).toBe(true);
    });

    it('demonstrates Level 3 subset accusation (clara only) is partial', async () => {
      const pid = 'test_l3_partial';
      await startPlay({ playerId: pid, caseId: 'l3-blackout-dinner', reset: true });

      // Level 3 culprits: Clara and Tobias
      const res = await accuse({
        playerId: pid,
        caseId: 'l3-blackout-dinner',
        persons: ['clara'],
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.data.result).toBe('partial');
      expect(res.data.wrongLeft).toBe(2);
      expect(res.data.levelOver).toBe(false);
      expect(res.data.revealed).toBeNull();
    });

    it('demonstrates Level 3 full accusation (clara and tobias)', async () => {
      const pid = 'test_l3_full';
      await startPlay({ playerId: pid, caseId: 'l3-blackout-dinner', reset: true });

      const res = await accuse({
        playerId: pid,
        caseId: 'l3-blackout-dinner',
        persons: ['clara', 'tobias'],
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.data.result).toBe('full');
      expect(res.data.levelOver).toBe(true);
      expect(res.data.revealed?.culprits.sort()).toEqual(['clara', 'tobias']);
      expect(res.data.replay.length).toBeGreaterThan(0);
    });
  });

  describe('HTTP Route Handlers for bait and accuse', () => {
    it('POST /api/bait handles request via route handler', async () => {
      const pid = 'test_http_bait';
      await startPlay({ playerId: pid, caseId: 'l2-stopped-watch', reset: true });

      const req = new Request('http://localhost:3001/api/bait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: pid,
          caseId: 'l2-stopped-watch',
          baitId: 'b2_ring',
        }),
      });

      const res = await baitPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.outcome).toBe('slip');
    });

    it('POST /api/accuse handles request via route handler', async () => {
      const pid = 'test_http_accuse';
      await startPlay({ playerId: pid, caseId: 'l1-quiet-pact', reset: true });

      const req = new Request('http://localhost:3001/api/accuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: pid,
          caseId: 'l1-quiet-pact',
          persons: ['dee', 'kofi'],
        }),
      });

      const res = await accusePost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.result).toBe('partial');
    });
  });
});
