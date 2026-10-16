import { describe, it, expect, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { startPlay } from '@/engine/play';
import { run, deleteGraph, closeDb } from '@/engine/db';
import { CaseSchema, type CaseType } from '@/engine/schema';
import { motivePaths, alibiSupport } from '@/engine/investigation';
import { flag, hypothesize } from '@/engine/notes';
import { getBoard } from '@/engine/board';
import {
  Q43_add_statement,
  Q44_add_assertion,
  Q45_reveal_relation,
  Q51_add_evidence,
  Q52_add_ev_assertion,
  Q53_reveal_edge,
  Q54_set_knowers,
} from '@/engine/queries';

const COLD = {
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
    if (cl.relation) {
      const rel = caseData.relations.find((r) => r.id === cl.relation);
      if (rel) {
        await run({
          graphName: playGraph,
          query: Q45_reveal_relation,
          params: { from: rel.from, to: rel.to, rid: rel.id, type: rel.type, text: rel.text },
        });
      }
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
    if (ev.relation) {
      const rel = caseData.relations.find((r) => r.id === ev.relation);
      if (rel) {
        await run({
          graphName: playGraph,
          query: Q45_reveal_relation,
          params: { from: rel.from, to: rel.to, rid: rel.id, type: rel.type, text: rel.text },
        });
      }
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
}

describe('investigation.ts & notes.ts — Motive Paths, Alibi Support, Flags, Hypotheses (Task A5)', () => {
  const pL3 = 'p_a5_l3';
  const pL1 = 'p_a5_l1';

  afterAll(async () => {
    await deleteGraph(`play:${pL3}:l3-blackout-dinner`);
    await deleteGraph(`play:${pL1}:l1-quiet-pact`);
    await closeDb();
  });

  it('demonstrates Level 3 acceptance: alibiSupport(clara, 4) is unsupported (Roz unreliable)', async () => {
    const c3 = readCase('l3-blackout-dinner');
    const cfg = COLD['l3-blackout-dinner'];
    const claimIds = c3.claims
      .filter((x) => (x.requires ?? []).every((r) => cfg.evidence.includes(r)))
      .map((x) => x.id);

    await loadBoard(pL3, c3, cfg.evidence, claimIds);

    const alibiRes = await alibiSupport({
      playerId: pL3,
      caseId: 'l3-blackout-dinner',
      person: 'clara',
      slot: 4,
    });

    expect(alibiRes.ok).toBe(true);
    if (alibiRes.ok) {
      expect(alibiRes.data.claimedRoom).toBe('dining_hall');
      expect(alibiRes.data.supported).toBe(false);
      expect(alibiRes.data.supporters).toEqual([
        {
          by: 'roz',
          claimId: 'c3_ro_saw_cl4',
          reliable: false,
          reason: 'Contradicted by physical evidence',
        },
      ]);
    }
  });

  it('demonstrates Level 3 acceptance: motivePaths(tobias) and (clara) match oracle', async () => {
    const oracle = readOracle('l3-blackout-dinner');

    // Tobias motive paths
    const tobiasRes = await motivePaths({
      playerId: pL3,
      caseId: 'l3-blackout-dinner',
      person: 'tobias',
    });
    expect(tobiasRes.ok).toBe(true);
    if (tobiasRes.ok) {
      expect(tobiasRes.data.status).toBe('known');
      expect(tobiasRes.data.paths.length).toBeGreaterThanOrEqual(1);
      // The shortest path must match oracle's motivePaths.tobias
      const shortestHopIds = tobiasRes.data.paths[0].hops.map((h) => h.relationId);
      expect(shortestHopIds).toEqual(oracle.motivePaths.tobias);
    }

    // Clara motive paths
    const claraRes = await motivePaths({
      playerId: pL3,
      caseId: 'l3-blackout-dinner',
      person: 'clara',
    });
    expect(claraRes.ok).toBe(true);
    if (claraRes.ok) {
      expect(claraRes.data.status).toBe('known');
      expect(claraRes.data.paths.length).toBeGreaterThanOrEqual(1);
      const shortestHopIds = claraRes.data.paths[0].hops.map((h) => h.relationId);
      expect(shortestHopIds).toEqual(oracle.motivePaths.clara);
    }
  });

  it('verifies Level 1 motive paths match oracle for all suspects', async () => {
    const c1 = readCase('l1-quiet-pact');
    const oracle = readOracle('l1-quiet-pact');
    const cfg = COLD['l1-quiet-pact'];
    const claimIds = c1.claims
      .filter((x) => (x.requires ?? []).every((r) => cfg.evidence.includes(r)))
      .map((x) => x.id);

    await loadBoard(pL1, c1, cfg.evidence, claimIds);

    const suspects = c1.people.filter((p) => !p.victim).map((p) => p.id);
    for (const s of suspects) {
      const res = await motivePaths({ playerId: pL1, caseId: 'l1-quiet-pact', person: s });
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.status).toBe('known');
        const shortestHops = res.data.paths[0].hops.map((h) => h.relationId);
        expect(shortestHops).toEqual(oracle.motivePaths[s]);
      }
    }
  });

  it('demonstrates board annotations: flag and hypothesize persist with "by" and reflect on board', async () => {
    // 1. Add a player flag
    const fPlayer = await flag({
      playerId: pL3,
      caseId: 'l3-blackout-dinner',
      kind: 'contradiction',
      refs: ['c3_ro_saw_cl4', 'e3_wifi'],
      note: 'Roz alibi contradicted by smart router',
      by: 'player',
    });
    expect(fPlayer.ok).toBe(true);
    let playerFlagId = '';
    if (fPlayer.ok) playerFlagId = fPlayer.data.flagId;

    // 2. Add an inspector flag
    const fInspector = await flag({
      playerId: pL3,
      caseId: 'l3-blackout-dinner',
      kind: 'inferred',
      refs: ['e3_meter'],
      note: 'Only Clara could have tripped the kitchen breaker',
      by: 'inspector',
    });
    expect(fInspector.ok).toBe(true);
    let inspectorFlagId = '';
    if (fInspector.ok) inspectorFlagId = fInspector.data.flagId;

    // 3. Add an inspector hypothesis
    const hInspector = await hypothesize({
      playerId: pL3,
      caseId: 'l3-blackout-dinner',
      text: 'Tobias used the hidden passage during the blackout',
      person: 'tobias',
      confidence: 0.9,
      supportedBy: [inspectorFlagId, 'e3_hinge'],
      by: 'inspector',
    });
    expect(hInspector.ok).toBe(true);
    let hypId = '';
    if (hInspector.ok) hypId = hInspector.data.hypothesisId;

    // 4. Verify everything persisted and is returned via getBoard
    const boardRes = await getBoard({ playerId: pL3, caseId: 'l3-blackout-dinner' });
    expect(boardRes.ok).toBe(true);
    if (boardRes.ok) {
      const boardFlags = boardRes.data.flags;
      const f1 = boardFlags.find((f) => f.id === playerFlagId);
      expect(f1).toBeDefined();
      expect(f1?.by).toBe('player');
      expect(f1?.kind).toBe('contradiction');
      expect(f1?.refs).toEqual(['c3_ro_saw_cl4', 'e3_wifi']);

      const f2 = boardFlags.find((f) => f.id === inspectorFlagId);
      expect(f2).toBeDefined();
      expect(f2?.by).toBe('inspector');
      expect(f2?.kind).toBe('inferred');

      const boardHyps = boardRes.data.hypotheses;
      const h1 = boardHyps.find((h) => h.id === hypId);
      expect(h1).toBeDefined();
      expect(h1?.by).toBe('inspector');
      expect(h1?.person).toBe('tobias');
      expect(h1?.confidence).toBe(0.9);
    }
  });

  it('validates IDs and returns appropriate error envelopes', async () => {
    // UNKNOWN_PERSON in motivePaths
    const res1 = await motivePaths({
      playerId: pL3,
      caseId: 'l3-blackout-dinner',
      person: 'unknown_suspect',
    });
    expect(res1.ok).toBe(false);
    if (!res1.ok) expect(res1.error.code).toBe('UNKNOWN_PERSON');

    // UNKNOWN_PERSON in alibiSupport
    const res2 = await alibiSupport({
      playerId: pL3,
      caseId: 'l3-blackout-dinner',
      person: 'unknown_suspect',
      slot: 1,
    });
    expect(res2.ok).toBe(false);
    if (!res2.ok) expect(res2.error.code).toBe('UNKNOWN_PERSON');

    // UNKNOWN_PERSON in hypothesize
    const res3 = await hypothesize({
      playerId: pL3,
      caseId: 'l3-blackout-dinner',
      text: 'Test hypothesis',
      person: 'unknown_suspect',
      confidence: 0.5,
      supportedBy: [],
    });
    expect(res3.ok).toBe(false);
    if (!res3.ok) expect(res3.error.code).toBe('UNKNOWN_PERSON');

    // UNKNOWN_CASE
    const res4 = await flag({
      playerId: pL3,
      caseId: 'invalid_case',
      kind: 'slip',
      refs: ['c1'],
      note: 'test note',
    });
    expect(res4.ok).toBe(false);
    if (!res4.ok) expect(res4.error.code).toBe('UNKNOWN_CASE');
  });

  it('verifies information barrier (no truth graph leaks in envelopes)', async () => {
    const res = await motivePaths({
      playerId: pL3,
      caseId: 'l3-blackout-dinner',
      person: 'clara',
    });
    expect(res.ok).toBe(true);
    const json = JSON.stringify(res);
    expect(json).not.toContain('truth:');
    expect(json).not.toContain('culprits');
    expect(json).not.toContain('knownBy');
  });
});
