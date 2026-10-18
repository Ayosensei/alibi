import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { ACTIONS, type Envelope, type TraceStepType } from './contract';
import { CaseSchema, type CaseType } from './schema';
import { graphExists, ro, run } from './db';
import { incrementTick, saveProgress } from './play';
import {
  Q41_asked_claims,
  Q42_found_evidence,
  Q96_truth_view,
  Q97_record_accusation,
  Q99_get_accusations,
} from './queries';

export type AccuseInput = z.input<typeof ACTIONS.accuse.input>;
export type AccuseOutput = z.infer<typeof ACTIONS.accuse.output>;

interface BoardState {
  statements: Set<string>;
  evidence: Set<string>;
  inferredSources: Set<string>;
  inferredSurvivors: Map<string, string>; // evidenceId -> survivor
  slippedBaits: Set<string>;
  relations: Set<string>;
  revisesWindow: boolean;
}

function evaluateProof(
  caseData: CaseType,
  board: BoardState
): { found: string[]; missed: string[] } {
  const found: string[] = [];
  const missed: string[] = [];
  const proof = caseData.solution.proof;

  const isPresent = (src: string): boolean => {
    if (src.startsWith('inferred:')) {
      return board.inferredSources.has(src);
    }
    if (src.startsWith('e') || caseData.evidence.some((e) => e.id === src)) {
      return board.evidence.has(src);
    }
    return board.statements.has(src);
  };

  const getSourceDesc = (src: string): string => {
    if (src.startsWith('inferred:')) {
      const eid = src.replace('inferred:', '');
      const ev = caseData.evidence.find((e) => e.id === eid);
      return `inferred anchor from ${ev?.title ?? eid}`;
    }
    const ev = caseData.evidence.find((e) => e.id === src);
    if (ev) return `${ev.title}`;
    const cl = caseData.claims.find((c) => c.id === src);
    if (cl) {
      const p = caseData.people.find((person) => person.id === cl.by);
      return `${p?.name ?? cl.by}'s statement`;
    }
    return src.replace(/_/g, ' ');
  };

  const getWhereToLook = (src: string): string => {
    if (src.startsWith('inferred:')) {
      const eid = src.replace('inferred:', '');
      const ev = caseData.evidence.find((e) => e.id === eid);
      return `Investigate "${ev?.title ?? eid}" in the ${ev?.room ?? 'crime scene'} to eliminate suspects`;
    }
    const ev = caseData.evidence.find((e) => e.id === src);
    if (ev) return `Search the ${ev.room} for "${ev.title}"`;
    const cl = caseData.claims.find((c) => c.id === src);
    if (cl) {
      const p = caseData.people.find((person) => person.id === cl.by);
      return `Question ${p?.name ?? cl.by} about their ${cl.topics[0] ?? 'whereabouts'}`;
    }
    return `Look for clues regarding ${src}`;
  };

  // 1. Contradictions
  for (const [src1, src2] of proof.contradictions) {
    const has1 = isPresent(src1);
    const has2 = isPresent(src2);
    if (has1 && has2) {
      found.push(`Contradiction established between ${getSourceDesc(src1)} and ${getSourceDesc(src2)}.`);
    } else {
      const missing = !has1 && !has2 ? `${getWhereToLook(src1)} and ${getWhereToLook(src2)}` : !has1 ? getWhereToLook(src1) : getWhereToLook(src2);
      missed.push(`Contradiction between ${getSourceDesc(src1)} and ${getSourceDesc(src2)}: ${missing}.`);
    }
  }

  // 2. Rehearsed alibis
  for (const group of proof.rehearsed) {
    const missingClaims = group.filter((c) => !board.statements.has(c));
    const who = group
      .map((cid) => {
        const cl = caseData.claims.find((c) => c.id === cid);
        const p = caseData.people.find((person) => person.id === cl?.by);
        return p?.name ?? cl?.by ?? cid;
      })
      .join(', ');

    if (missingClaims.length === 0) {
      found.push(`Rehearsed alibi identified across statements by ${who}.`);
    } else {
      missed.push(`Rehearsed alibi among ${who}: Question each suspect regarding their whereabouts.`);
    }
  }

  // 3. Impossible moves
  for (const imp of proof.impossible) {
    const p = caseData.people.find((person) => person.id === imp.person);
    const personName = p?.name ?? imp.person;
    const has1 = board.statements.has(imp.claims[0]) || board.evidence.has(imp.claims[0]);
    const has2 = board.statements.has(imp.claims[1]) || board.evidence.has(imp.claims[1]);
    if (has1 && has2) {
      found.push(`Impossible movement discovered for ${personName} between ${getSourceDesc(imp.claims[0])} and ${getSourceDesc(imp.claims[1])}.`);
    } else {
      const missing = !has1 ? getWhereToLook(imp.claims[0]) : getWhereToLook(imp.claims[1]);
      missed.push(`Impossible movement for ${personName}: ${missing}.`);
    }
  }

  // 4. Sharp baits
  for (const sb of proof.sharpBaits ?? []) {
    if (board.slippedBaits.has(sb.bait)) {
      found.push(`Sharp bait: Exposed ${sb.person}'s guilty knowledge using bait "${sb.bait}".`);
    } else {
      const baitObj = caseData.baits.find((b) => b.id === sb.bait);
      missed.push(`Sharp bait: Use bait "${baitObj?.announcement ?? sb.bait}" against ${sb.person}.`);
    }
  }

  // 5. Eliminations
  for (const elim of proof.eliminations ?? []) {
    const survivor = 'survivor' in elim ? elim.survivor : elim.survivors[0];
    const inferredSrc = `inferred:${elim.evidence}`;
    const derived = board.inferredSources.has(inferredSrc) && board.inferredSurvivors.get(elim.evidence) === survivor;
    if (derived) {
      found.push(`Elimination: Proved ${survivor} was the single feasible suspect for "${elim.evidence}".`);
    } else {
      const ev = caseData.evidence.find((e) => e.id === elim.evidence);
      missed.push(`Elimination for "${ev?.title ?? elim.evidence}": Search ${ev?.room ?? 'rooms'} to eliminate candidates.`);
    }
  }

  // 6. Window revises (if found)
  const revisesEvidence = caseData.evidence.find((e) => e.windowKind === 'revises');
  if (revisesEvidence && board.evidence.has(revisesEvidence.id)) {
    found.push(`Murder window revised by ${revisesEvidence.title}.`);
  }

  // 7. Motive relations
  if (caseData.solution.proof.motive && caseData.solution.proof.motive.length > 0) {
    for (const relId of caseData.solution.proof.motive) {
      if (board.relations.has(relId)) {
        found.push(`Motive relation established: ${relId}.`);
      } else {
        missed.push(`Motive relation missed: ${relId}.`);
      }
    }
  } else if (caseData.solution.motive) {
    for (const [culprit, relId] of Object.entries(caseData.solution.motive)) {
      if (board.relations.has(relId)) {
        found.push(`Motive established for ${culprit}.`);
      }
    }
  }

  return { found, missed };
}

function buildReplay(caseData: CaseType): { title: string; detail: string; refs: string[]; path: string[] }[] {
  const replay: { title: string; detail: string; refs: string[]; path: string[] }[] = [];
  const scene = caseData.truth.murder.room;
  const sceneObj = caseData.rooms.find((r) => r.id === scene);
  const sceneName = sceneObj?.name ?? scene.replace(/_/g, ' ');

  const getRefLabel = (src: string): string => {
    if (src.startsWith('inferred:')) {
      const eid = src.replace('inferred:', '');
      const ev = caseData.evidence.find((e) => e.id === eid);
      return `inferred elimination from ${ev?.title ?? eid}`;
    }
    const ev = caseData.evidence.find((e) => e.id === src);
    if (ev) return ev.title;
    const cl = caseData.claims.find((c) => c.id === src);
    if (cl) {
      const p = caseData.people.find((person) => person.id === cl.by);
      return `${p?.name ?? cl.by}'s statement`;
    }
    const p = caseData.people.find((person) => person.id === src);
    if (p) return p.name;
    const r = caseData.rooms.find((room) => room.id === src);
    if (r) return r.name;
    return src.replace(/_/g, ' ');
  };

  // 1. The murder window
  const revisesEv = caseData.evidence.find((e) => e.windowKind === 'revises');
  if (revisesEv) {
    replay.push({
      title: 'The Murder Window',
      detail: `The actual time of death was slot ${caseData.solution.windowFinal?.[0] ?? caseData.truth.murder.slot}, established by ${revisesEv.title}.`,
      refs: [revisesEv.id],
      path: [scene],
    });
  } else {
    replay.push({
      title: 'The Murder Window',
      detail: `The crime took place at slot ${caseData.truth.murder.slot} in the ${sceneName}.`,
      refs: caseData.evidence.filter((e) => e.window).map((e) => e.id),
      path: [scene],
    });
  }

  // 2. Lies exposed
  for (const [s1, s2] of caseData.solution.proof.contradictions) {
    replay.push({
      title: `Lie Exposed: Contradiction`,
      detail: `Incompatible evidence between ${getRefLabel(s1)} and ${getRefLabel(s2)}.`,
      refs: [s1, s2],
      path: [scene],
    });
  }
  for (const group of caseData.solution.proof.rehearsed) {
    const who = group
      .map((cid) => {
        const cl = caseData.claims.find((c) => c.id === cid);
        const p = caseData.people.find((person) => person.id === cl?.by);
        return p?.name ?? cl?.by ?? cid;
      })
      .join(', ');
    replay.push({
      title: 'Lie Exposed: Rehearsed Alibi',
      detail: `${who} each gave coordinated statements sharing identical rehearsed details.`,
      refs: group,
      path: [scene],
    });
  }
  for (const imp of caseData.solution.proof.impossible) {
    const p = caseData.people.find((person) => person.id === imp.person);
    const personName = p?.name ?? imp.person;
    replay.push({
      title: `Lie Exposed: Impossible Movement`,
      detail: `${personName} could not physically travel between ${getRefLabel(imp.claims[0])} and ${getRefLabel(imp.claims[1])} in the time available.`,
      refs: [...imp.claims],
      path: [scene],
    });
  }

  // 3. Cleared suspects
  if (caseData.solution.cleared) {
    for (const [person, info] of Object.entries(caseData.solution.cleared)) {
      const p = caseData.people.find((per) => per.id === person);
      const personName = p?.name ?? person;
      const room = caseData.rooms.find((r) => r.id === info.room);
      const roomName = room?.name ?? info.room.replace(/_/g, ' ');
      const anchorLabels = info.anchors.map(getRefLabel).join(', ');
      replay.push({
        title: `Cleared Suspect: ${personName}`,
        detail: `${personName} was proved to be outside the ${roomName} at slot ${info.slot} by verified physical record(s): ${anchorLabels}.`,
        refs: info.anchors,
        path: [info.room],
      });
    }
  }

  // 4. Culprits' motive paths
  if (caseData.solution.motive) {
    for (const [culprit, relId] of Object.entries(caseData.solution.motive)) {
      const p = caseData.people.find((per) => per.id === culprit);
      const culpritName = p?.name ?? culprit;
      const rel = caseData.relations.find((r) => r.id === relId);
      const victim = caseData.people.find((per) => per.victim)?.id ?? 'victim';
      replay.push({
        title: `Motive: ${culpritName}`,
        detail: rel?.text ?? `Established motive connecting ${culpritName} to the victim.`,
        refs: [relId],
        path: [culprit, victim],
      });
    }
  }

  // 5. Baits and slips
  for (const sb of caseData.solution.proof.sharpBaits ?? []) {
    const p = caseData.people.find((per) => per.id === sb.person);
    const personName = p?.name ?? sb.person;
    const baitObj = caseData.baits.find((b) => b.id === sb.bait);
    replay.push({
      title: `Guilty Knowledge: ${personName}`,
      detail: `${personName} slipped when confronted with announcement: "${baitObj?.announcement ?? sb.bait}".`,
      refs: [sb.bait],
      path: [sb.person],
    });
  }

  return replay;
}

export async function accuse(input: AccuseInput): Promise<Envelope<AccuseOutput>> {
  const trace: TraceStepType[] = [];
  const parsed = ACTIONS.accuse.input.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'BAD_ARGS', message: 'Invalid arguments for accuse' },
      trace,
    };
  }

  const { playerId, caseId, persons } = parsed.data;
  const playGraph = `play:${playerId}:${caseId}`;
  const truthGraph = `truth:${caseId}`;

  const casePath = join(process.cwd(), 'cases', `${caseId}.json`);
  if (!existsSync(casePath)) {
    return {
      ok: false,
      error: { code: 'UNKNOWN_CASE', message: `Unknown case: ${caseId}` },
      trace,
    };
  }

  const exists = await graphExists(playGraph);
  if (!exists) {
    return {
      ok: false,
      error: { code: 'UNKNOWN_PLAY', message: `No active play session for ${playerId}` },
      trace,
    };
  }

  const caseData = CaseSchema.parse(JSON.parse(readFileSync(casePath, 'utf8')));

  // Check prior accusations
  const accRes = await ro<{ id: string; persons: string[]; result: string; wrong: boolean }>({
    graphName: playGraph,
    query: Q99_get_accusations,
    params: {},
    traceCtx: { agent: 'verdict', tool: 'accuse', queryId: 'Q99_get_accusations' },
  });
  if (accRes.step) trace.push(accRes.step);

  const prevAccusations = accRes.data;
  const prevWrong = prevAccusations.filter((a) => a.wrong).length;
  const hasFull = prevAccusations.some((a) => a.result === 'full');
  if (hasFull || prevWrong >= 2) {
    return {
      ok: false,
      error: { code: 'LEVEL_OVER', message: 'The case is already over' },
      trace,
    };
  }

  // Calculate accusation result
  const culprits = caseData.solution.culprits;
  const accusedSet = new Set(persons);
  const culpritsSet = new Set(culprits);

  const hasNonCulprit = persons.some((p) => !culpritsSet.has(p));
  let result: 'full' | 'partial' | 'wrong';

  if (hasNonCulprit) {
    result = 'wrong';
  } else if (accusedSet.size === culpritsSet.size) {
    result = 'full';
  } else {
    result = 'partial';
  }

  // Advance tick
  const tick = await incrementTick(playerId, caseId);

  const isWrong = result === 'wrong';
  const newWrongCount = prevWrong + (isWrong ? 1 : 0);
  const wrongLeft = Math.max(0, 2 - newWrongCount);
  const levelOver = result === 'full' || wrongLeft === 0;

  // Record accusation
  const accId = `acc_${Date.now()}`;
  const recordRes = await run({
    graphName: playGraph,
    query: Q97_record_accusation,
    params: {
      id: accId,
      persons,
      result,
      wrong: isWrong,
      tick,
    },
    traceCtx: { agent: 'verdict', tool: 'accuse', queryId: 'Q97_record_accusation' },
  });
  if (recordRes.step) trace.push(recordRes.step);

  let revealed: { culprits: string[]; method: string; weapon: string } | null = null;
  let replay: { title: string; detail: string; refs: string[]; path: string[] }[] = [];
  let found: string[] = [];
  let missed: string[] = [];
  let stars = 0;

  if (levelOver) {
    // Truth view query for replay
    const truthRes = await ro<{ person: string; slot: number; room: string }>({
      graphName: truthGraph,
      query: Q96_truth_view,
      params: {},
      traceCtx: { agent: 'verdict', tool: 'accuse', queryId: 'Q96_truth_view' },
    });
    if (truthRes.step) trace.push(truthRes.step);

    // Read board state
    const stmtRes = await ro<{ id: string }>({
      graphName: playGraph,
      query: Q41_asked_claims,
      params: {},
      traceCtx: { agent: 'verdict', tool: 'accuse', queryId: 'Q41_asked_claims' },
    });
    if (stmtRes.step) trace.push(stmtRes.step);

    const evRes = await ro<{ id: string }>({
      graphName: playGraph,
      query: Q42_found_evidence,
      params: {},
      traceCtx: { agent: 'verdict', tool: 'accuse', queryId: 'Q42_found_evidence' },
    });
    if (evRes.step) trace.push(evRes.step);

    const infRes = await ro<{ src: string; subject: string }>({
      graphName: playGraph,
      query: `MATCH (a:Assertion) WHERE a.src STARTS WITH 'inferred:' RETURN a.src AS src, a.subject AS subject`,
      params: {},
      traceCtx: { agent: 'verdict', tool: 'accuse', queryId: 'get_inferred_assertions' },
    });
    if (infRes.step) trace.push(infRes.step);

    const baitRes = await ro<{ baitId: string }>({
      graphName: playGraph,
      query: `MATCH (u:BaitUsed {outcome: 'slip'}) RETURN u.baitId AS baitId`,
      params: {},
      traceCtx: { agent: 'verdict', tool: 'accuse', queryId: 'get_slipped_baits' },
    });
    if (baitRes.step) trace.push(baitRes.step);

    const relRes = await ro<{ id: string }>({
      graphName: playGraph,
      query: `MATCH ()-[r:KNOWN_REL]->() RETURN r.id AS id`,
      params: {},
      traceCtx: { agent: 'verdict', tool: 'accuse', queryId: 'get_board_relations' },
    });
    if (relRes.step) trace.push(relRes.step);

    const revRes = await ro<{ id: string }>({
      graphName: playGraph,
      query: `MATCH (e:Evidence {windowKind: 'revises'}) RETURN e.id AS id`,
      params: {},
      traceCtx: { agent: 'verdict', tool: 'accuse', queryId: 'get_window_revises' },
    });
    if (revRes.step) trace.push(revRes.step);

    const boardState: BoardState = {
      statements: new Set(stmtRes.data.map((s) => s.id)),
      evidence: new Set(evRes.data.map((e) => e.id)),
      inferredSources: new Set(infRes.data.map((i) => i.src)),
      inferredSurvivors: new Map(infRes.data.map((i) => [i.src.replace('inferred:', ''), i.subject])),
      slippedBaits: new Set(baitRes.data.map((b) => b.baitId)),
      relations: new Set(relRes.data.map((r) => r.id)),
      revisesWindow: revRes.data.length > 0,
    };

    const evalResult = evaluateProof(caseData, boardState);
    found = evalResult.found;
    missed = evalResult.missed;

    if (result === 'full') {
      const allProofDerivable = missed.length === 0;
      const noWrongAccusationUsed = prevWrong === 0;
      stars = 1 + (allProofDerivable ? 1 : 0) + (noWrongAccusationUsed ? 1 : 0);
    } else {
      stars = 0;
    }

    revealed = {
      culprits: caseData.solution.culprits,
      method: caseData.truth.murder.method,
      weapon: caseData.truth.murder.weapon,
    };

    replay = buildReplay(caseData);

    // Persist progress to player graph
    const totalAccusations = prevAccusations.length + 1;
    await saveProgress(playerId, caseId, stars, totalAccusations);
  }

  return {
    ok: true,
    data: {
      result,
      wrongLeft,
      levelOver,
      stars,
      revealed,
      replay,
      found,
      missed,
    },
    trace,
  };
}
