import { describe, it, expect, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as R from '../../scripts/reference-engine.mjs';
import { startPlay } from '@/engine/play';
import { run, deleteGraph, closeDb } from '@/engine/db';
import { CaseSchema, type CaseType } from '@/engine/schema';
import {
  findContradictions,
  findRehearsedAlibis,
  findImpossibleMoves,
} from '@/engine/reasoning';
import { checkFeasibility, whoCouldHave } from '@/engine/feasibility';
import { eliminate } from '@/engine/search';
import {
  Q43_add_statement,
  Q44_add_assertion,
  Q51_add_evidence,
  Q52_add_ev_assertion,
  Q53_reveal_edge,
  Q54_set_knowers,
} from '@/engine/queries';

const COLD: Record<string, { evidence: string[]; claimsExcluding?: string[] }> = {
  'l1-quiet-pact': { evidence: ['e1_doorlog', 'e1_till', 'e1_lamp'], claimsExcluding: [] },
  'l2-stopped-watch': { evidence: ['e2_watch', 'e2_coroner', 'e2_cabinetlog', 'e2_tab', 'e2_gate', 'e2_vaultlog', 'e2_provenance'], claimsExcluding: [] },
  'l3-blackout-dinner': { evidence: ['e3_studylock', 'e3_wifi', 'e3_recording', 'e3_meter', 'e3_hinge', 'e3_libdoor', 'e3_message', 'e3_plan', 'e3_ledger', 'e3_alarm'], claimsExcluding: [] },
};

function readCase(caseId: string): CaseType {
  const p = join(process.cwd(), 'cases', `${caseId}.json`);
  return CaseSchema.parse(JSON.parse(readFileSync(p, 'utf8')));
}

function readOracle(caseId: string) {
  const p = join(process.cwd(), 'fixtures', `${caseId}.oracle.json`);
  return JSON.parse(readFileSync(p, 'utf8'));
}

async function loadBoard(
  playerId: string,
  caseData: CaseType,
  evidenceIds: string[],
  claimIds: string[]
) {
  const playGraph = `play:${playerId}:${caseData.id}`;
  await startPlay({ playerId, caseId: caseData.id, reset: true });

  for (const cid of claimIds) {
    const cl = caseData.claims.find((x) => x.id === cid);
    if (!cl) continue;
    await run({
      graphName: playGraph,
      query: Q43_add_statement,
      params: {
        sid: `s_${cl.id}`,
        cid: cl.id,
        by: cl.by,
        kind: cl.kind,
        subject: cl.subject ?? '',
        slot: cl.slot ?? 0,
        room: cl.room ?? '',
        detail: cl.detail ?? '',
        text: cl.text,
        tick: 1,
      },
    });
    if (cl.kind === 'location' || cl.kind === 'saw') {
      await run({
        graphName: playGraph,
        query: Q44_add_assertion,
        params: {
          sid: `s_${cl.id}`,
          aid: `a_${cl.id}`,
          cid: cl.id,
          subject: cl.subject,
          slot: cl.slot,
          room: cl.room,
        },
      });
    }
  }

  for (const eid of evidenceIds) {
    const ev = caseData.evidence.find((x) => x.id === eid);
    if (!ev) continue;
    await run({
      graphName: playGraph,
      query: Q51_add_evidence,
      params: {
        id: ev.id,
        room: ev.room,
        title: ev.title,
        text: ev.text,
        window: ev.window ?? [],
        windowKind: ev.windowKind ?? '',
        actSlot: ev.act?.slot ?? 0,
        actRoom: ev.act?.room ?? '',
        actRestrictsTo: ev.act?.restrictsTo ?? [],
        relationId: ev.relation ?? '',
        revealsEdge: ev.revealsEdge ?? '',
        knowers: ev.knowers ?? [],
      },
    });
    for (const a of ev.asserts ?? []) {
      await run({
        graphName: playGraph,
        query: Q52_add_ev_assertion,
        params: {
          eid: ev.id,
          aid: `ev_a_${ev.id}_${a.subject}_${a.slot}`,
          subject: a.subject,
          slot: a.slot,
          room: a.room,
        },
      });
    }
    if (ev.revealsEdge) {
      const he = caseData.edges.find((e) => e.state === 'hidden');
      if (he) {
        await run({
          graphName: playGraph,
          query: Q53_reveal_edge,
          params: { a: he.a, b: he.b, knowers: ev.knowers ?? [] },
        });
      }
    }
    if (ev.knowers) {
      await run({
        graphName: playGraph,
        query: Q54_set_knowers,
        params: { knowers: ev.knowers },
      });
    }
  }

  await eliminate(playGraph, caseData);
}

describe('reasoning.ts & feasibility.ts — Tools and Oracle Parity (Task A4)', () => {
  const pCold = 'p_a4_cold';
  const pEmpty = 'p_a4_empty';
  const pFull = 'p_a4_full';

  afterAll(async () => {
    for (const cid of ['l1-quiet-pact', 'l2-stopped-watch', 'l3-blackout-dinner']) {
      await deleteGraph(`play:${pCold}:${cid}`);
      await deleteGraph(`play:${pEmpty}:${cid}`);
      await deleteGraph(`play:${pFull}:${cid}`);
    }
    await closeDb();
  });

  const cases = ['l1-quiet-pact', 'l2-stopped-watch', 'l3-blackout-dinner'] as const;

  for (const caseId of cases) {
    it(`matches fixtures/${caseId}.oracle.json on cold board`, async () => {
      const c = readCase(caseId);
      const oracle = readOracle(caseId);
      const cfg = COLD[caseId];
      const claimIds = c.claims
        .filter(
          (x) =>
            !(cfg.claimsExcluding ?? []).includes(x.id) &&
            (x.requires ?? []).every((r) => cfg.evidence.includes(r))
        )
        .map((x) => x.id);

      await loadBoard(pCold, c, cfg.evidence, claimIds);

      // 1. Contradictions
      const cRes = await findContradictions({ playerId: pCold, caseId });
      expect(cRes.ok).toBe(true);
      if (cRes.ok) {
        const actualPairs = cRes.data.pairs
          .map((x) => [x.a.src, x.b.src].sort())
          .sort((x, y) => x.join('|').localeCompare(y.join('|')));
        const expectedPairs = (oracle.contradictions as string[][])
          .map((x) => [...x].sort())
          .sort((x, y) => x.join('|').localeCompare(y.join('|')));
        expect(actualPairs).toEqual(expectedPairs);
      }

      // 2. Rehearsed
      const rRes = await findRehearsedAlibis({ playerId: pCold, caseId });
      expect(rRes.ok).toBe(true);
      if (rRes.ok) {
        const actualRehearsed = rRes.data.groups
          .map((g) => [...g.claimIds].sort())
          .sort((x, y) => x.join('|').localeCompare(y.join('|')));
        const expectedRehearsed = (oracle.rehearsed as string[][])
          .map((g) => [...g].sort())
          .sort((x, y) => x.join('|').localeCompare(y.join('|')));
        expect(actualRehearsed).toEqual(expectedRehearsed);
      }

      // 3. Impossible
      const iRes = await findImpossibleMoves({ playerId: pCold, caseId });
      expect(iRes.ok).toBe(true);
      if (iRes.ok) {
        const actualMoves = iRes.data.moves
          .map((m) => ({
            person: m.person,
            from: m.from.src,
            to: m.to.src,
            needed: m.needed,
            available: m.available,
          }))
          .sort((a, b) => (a.from + a.to).localeCompare(b.from + b.to));
        const expectedMoves = (
          oracle.impossible as Array<{
            person: string;
            from: string;
            to: string;
            needed: number;
            available: number;
          }>
        )
          .map((m) => ({
            person: m.person,
            from: m.from,
            to: m.to,
            needed: m.needed,
            available: m.available,
          }))
          .sort((a, b) => (a.from + a.to).localeCompare(b.from + b.to));
        expect(actualMoves).toEqual(expectedMoves);
      }

      // 4. Feasibility
      const suspects = c.people.filter((x) => !x.victim).map((x) => x.id);
      for (const s of suspects) {
        const fRes = await checkFeasibility({
          playerId: pCold,
          caseId,
          person: s,
          slot: oracle.window[0],
          room: oracle.crimeScene,
        });
        expect(fRes.ok).toBe(true);
        if (fRes.ok) {
          expect(fRes.data.feasible).toBe(oracle.feasibility[s]);
        }
      }

      // 5. Acts
      for (const evId of Object.keys(oracle.acts)) {
        const actRes = await whoCouldHave({ playerId: pCold, caseId, evidenceId: evId });
        expect(actRes.ok).toBe(true);
        if (actRes.ok) {
          expect([...actRes.data.survivors].sort()).toEqual([...oracle.acts[evId]].sort());
        }
      }
    });

    it(`matches reference engine on empty board for ${caseId}`, async () => {
      const c = readCase(caseId);
      await startPlay({ playerId: pEmpty, caseId, reset: true });

      const cRes = await findContradictions({ playerId: pEmpty, caseId });
      expect(cRes.ok).toBe(true);
      if (cRes.ok) expect(cRes.data.pairs).toEqual([]);

      const rRes = await findRehearsedAlibis({ playerId: pEmpty, caseId });
      expect(rRes.ok).toBe(true);
      if (rRes.ok) expect(rRes.data.groups).toEqual([]);

      const iRes = await findImpossibleMoves({ playerId: pEmpty, caseId });
      expect(iRes.ok).toBe(true);
      if (iRes.ok) expect(iRes.data.moves).toEqual([]);

      // Feasibility on empty board matches reference engine
      const emptyB = R.emptyBoard();
      for (const p of c.people.filter((x) => !x.victim)) {
        const fRes = await checkFeasibility({
          playerId: pEmpty,
          caseId,
          person: p.id,
          slot: 1,
          room: c.rooms[0].id,
        });
        expect(fRes.ok).toBe(true);
        if (fRes.ok) {
          const ref = R.couldBeAt(c, emptyB, p.id, 1, c.rooms[0].id);
          expect(fRes.data.feasible).toBe(ref.feasible);
        }
      }

      // WhoCouldHave on empty board returns not_an_act because evidence is not found
      if (c.evidence.length > 0) {
        const wRes = await whoCouldHave({ playerId: pEmpty, caseId, evidenceId: c.evidence[0].id });
        expect(wRes.ok).toBe(true);
        if (wRes.ok) {
          expect(wRes.data.status).toBe('not_an_act');
          expect(wRes.data.survivors).toEqual([]);
        }
      }
    });

    it(`matches reference engine on full board for ${caseId}`, async () => {
      const c = readCase(caseId);
      const allClaimIds = c.claims.map((x) => x.id);
      const allEvidenceIds = c.evidence.map((x) => x.id);

      await loadBoard(pFull, c, allEvidenceIds, allClaimIds);
      const fullB = R.fullBoard(c);

      // Contradictions
      const cRes = await findContradictions({ playerId: pFull, caseId });
      expect(cRes.ok).toBe(true);
      if (cRes.ok) {
        const actualPairs = cRes.data.pairs
          .map((x) => [x.a.src, x.b.src].sort())
          .sort((x, y) => x.join('|').localeCompare(y.join('|')));
        const refPairs = R.findContradictions(c, fullB)
          .map((x: string[]) => [...x].sort())
          .sort((x: string[], y: string[]) => x.join('|').localeCompare(y.join('|')));
        expect(actualPairs).toEqual(refPairs);
      }

      // Rehearsed
      const rRes = await findRehearsedAlibis({ playerId: pFull, caseId });
      expect(rRes.ok).toBe(true);
      if (rRes.ok) {
        const actualRehearsed = rRes.data.groups
          .map((g) => [...g.claimIds].sort())
          .sort((x, y) => x.join('|').localeCompare(y.join('|')));
        const refRehearsed = R.findRehearsed(c, fullB)
          .map((g: string[]) => [...g].sort())
          .sort((x: string[], y: string[]) => x.join('|').localeCompare(y.join('|')));
        expect(actualRehearsed).toEqual(refRehearsed);
      }

      // Impossible moves
      const iRes = await findImpossibleMoves({ playerId: pFull, caseId });
      expect(iRes.ok).toBe(true);
      if (iRes.ok) {
        const actualMoves = iRes.data.moves
          .map((m) => ({
            person: m.person,
            from: m.from.src,
            to: m.to.src,
            needed: m.needed,
            available: m.available,
          }))
          .sort((a, b) => (a.from + a.to).localeCompare(b.from + b.to));
        const refMoves = R.findImpossibleMoves(c, fullB)
          .map((m: { person: string; from: string; to: string; needed: number; available: number }) => ({
            person: m.person,
            from: m.from,
            to: m.to,
            needed: m.needed,
            available: m.available,
          }))
          .sort((a: { from: string; to: string }, b: { from: string; to: string }) =>
            (a.from + a.to).localeCompare(b.from + b.to)
          );
        expect(actualMoves).toEqual(refMoves);
      }
    });
  }

  it('validates IDs and returns appropriate error envelopes', async () => {
    // UNKNOWN_PLAY
    const res1 = await findContradictions({ playerId: 'non_existent_player', caseId: 'l1-quiet-pact' });
    expect(res1.ok).toBe(false);
    if (!res1.ok) expect(res1.error.code).toBe('UNKNOWN_PLAY');

    // UNKNOWN_CASE
    const res2 = await findContradictions({ playerId: pCold, caseId: 'non_existent_case' });
    expect(res2.ok).toBe(false);
    if (!res2.ok) expect(res2.error.code).toBe('UNKNOWN_CASE');

    // UNKNOWN_PERSON
    const res3 = await checkFeasibility({
      playerId: pCold,
      caseId: 'l1-quiet-pact',
      person: 'sherlock_holmes',
      slot: 1,
      room: 'green_room',
    });
    expect(res3.ok).toBe(false);
    if (!res3.ok) expect(res3.error.code).toBe('UNKNOWN_PERSON');

    // UNKNOWN_ROOM
    const res4 = await checkFeasibility({
      playerId: pCold,
      caseId: 'l1-quiet-pact',
      person: 'dee',
      slot: 1,
      room: 'baker_street',
    });
    expect(res4.ok).toBe(false);
    if (!res4.ok) expect(res4.error.code).toBe('UNKNOWN_ROOM');

    // UNKNOWN_EVIDENCE
    const res5 = await whoCouldHave({
      playerId: pCold,
      caseId: 'l1-quiet-pact',
      evidenceId: 'fake_evidence_id',
    });
    expect(res5.ok).toBe(false);
    if (!res5.ok) expect(res5.error.code).toBe('UNKNOWN_EVIDENCE');
  });

  it('verifies information barrier (no truth graph leaks in tool envelopes)', async () => {
    const res = await findContradictions({ playerId: pCold, caseId: 'l1-quiet-pact' });
    expect(res.ok).toBe(true);
    const json = JSON.stringify(res);
    expect(json).not.toContain('truth:');
    expect(json).not.toContain('culprits');
    expect(json).not.toContain('knownBy');
  });
});
