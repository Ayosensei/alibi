import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { TOOLS, SrcRef, type Envelope, type TraceStepType } from './contract';
import { CaseSchema } from './schema';
import { ro, graphExists } from './db';
import {
  Q60_contradictions,
  Q61_rehearsed,
  Q62_assertion_pairs,
  Q64_map_edges,
  Q84a_get_statements,
  Q84b_get_evidence,
} from './queries';
import { buildAdjacency, shortestPath, type MapEdgeRecord } from './map';

export type FindContradictionsInput = z.infer<typeof TOOLS.findContradictions.input>;
export type FindContradictionsOutput = z.infer<typeof TOOLS.findContradictions.output>;

export type FindRehearsedAlibisInput = z.infer<typeof TOOLS.findRehearsedAlibis.input>;
export type FindRehearsedAlibisOutput = z.infer<typeof TOOLS.findRehearsedAlibis.output>;

export type FindImpossibleMovesInput = z.infer<typeof TOOLS.findImpossibleMoves.input>;
export type FindImpossibleMovesOutput = z.infer<typeof TOOLS.findImpossibleMoves.output>;

interface StatementInfo {
  by: string;
  text: string;
}

interface EvidenceInfo {
  text: string;
}

export function buildSrcRef(
  src: string,
  stmtsMap: Map<string, StatementInfo>,
  evMap: Map<string, EvidenceInfo>
): z.infer<typeof SrcRef> {
  if (src.startsWith('inferred:')) {
    return {
      src,
      kind: 'inferred',
      text: 'Inferred by single-survivor elimination',
    };
  }
  const s = stmtsMap.get(src);
  if (s) {
    return {
      src,
      kind: 'statement',
      by: s.by,
      text: s.text,
    };
  }
  const e = evMap.get(src);
  if (e) {
    return {
      src,
      kind: 'evidence',
      text: e.text,
    };
  }
  return {
    src,
    kind: 'evidence',
  };
}

export async function findContradictions(
  input: FindContradictionsInput
): Promise<Envelope<FindContradictionsOutput>> {
  const trace: TraceStepType[] = [];
  const parsed = TOOLS.findContradictions.input.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'BAD_ARGS', message: 'Invalid arguments for findContradictions' },
      trace,
    };
  }

  const { playerId, caseId } = parsed.data;
  const playGraph = `play:${playerId}:${caseId}`;

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

  // Fetch statements and evidence to resolve SrcRef
  const stmtsRes = await ro<{ claimId: string; by: string; text: string }>({
    graphName: playGraph,
    query: Q84a_get_statements,
    traceCtx: { agent: 'inspector', tool: 'findContradictions', queryId: 'Q84a_get_statements' },
  });
  if (stmtsRes.step) trace.push(stmtsRes.step);
  const stmtsMap = new Map<string, StatementInfo>(
    stmtsRes.data.map((s) => [s.claimId, { by: s.by, text: s.text }])
  );

  const evRes = await ro<{ id: string; text: string }>({
    graphName: playGraph,
    query: Q84b_get_evidence,
    traceCtx: { agent: 'inspector', tool: 'findContradictions', queryId: 'Q84b_get_evidence' },
  });
  if (evRes.step) trace.push(evRes.step);
  const evMap = new Map<string, EvidenceInfo>(
    evRes.data.map((e) => [e.id, { text: e.text }])
  );

  // Query contradictions
  const contraRes = await ro<{
    srcA: string;
    hardA: boolean;
    srcB: string;
    hardB: boolean;
    subject: string;
    slot: number;
    roomA: string;
    roomB: string;
  }>({
    graphName: playGraph,
    query: Q60_contradictions,
    traceCtx: { agent: 'inspector', tool: 'findContradictions', queryId: 'Q60_contradictions' },
  });
  if (contraRes.step) trace.push(contraRes.step);

  const seen = new Set<string>();
  const pairs: FindContradictionsOutput['pairs'] = [];

  for (const row of contraRes.data) {
    const key = [row.srcA, row.srcB].sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);

    pairs.push({
      a: buildSrcRef(row.srcA, stmtsMap, evMap),
      b: buildSrcRef(row.srcB, stmtsMap, evMap),
      subject: row.subject,
      slot: row.slot,
      roomA: row.roomA,
      roomB: row.roomB,
    });
  }

  return {
    ok: true,
    data: { pairs },
    trace,
  };
}

export async function findRehearsedAlibis(
  input: FindRehearsedAlibisInput
): Promise<Envelope<FindRehearsedAlibisOutput>> {
  const trace: TraceStepType[] = [];
  const parsed = TOOLS.findRehearsedAlibis.input.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'BAD_ARGS', message: 'Invalid arguments for findRehearsedAlibis' },
      trace,
    };
  }

  const { playerId, caseId } = parsed.data;
  const playGraph = `play:${playerId}:${caseId}`;

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

  const reheRes = await ro<{
    slot: number;
    room: string;
    detail: string;
    people: string[];
    claimIds: string[];
  }>({
    graphName: playGraph,
    query: Q61_rehearsed,
    traceCtx: { agent: 'inspector', tool: 'findRehearsedAlibis', queryId: 'Q61_rehearsed' },
  });
  if (reheRes.step) trace.push(reheRes.step);

  const groups = reheRes.data.map((row) => ({
    slot: row.slot,
    room: row.room,
    detail: row.detail,
    people: [...row.people].sort(),
    claimIds: [...row.claimIds].sort(),
  }));

  return {
    ok: true,
    data: { groups },
    trace,
  };
}

export async function findImpossibleMoves(
  input: FindImpossibleMovesInput
): Promise<Envelope<FindImpossibleMovesOutput>> {
  const trace: TraceStepType[] = [];
  const parsed = TOOLS.findImpossibleMoves.input.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'BAD_ARGS', message: 'Invalid arguments for findImpossibleMoves' },
      trace,
    };
  }

  const { playerId, caseId } = parsed.data;
  const playGraph = `play:${playerId}:${caseId}`;

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
  const rooms = caseData.rooms.map((r) => r.id);

  // Fetch statements and evidence to resolve SrcRef
  const stmtsRes = await ro<{ claimId: string; by: string; text: string }>({
    graphName: playGraph,
    query: Q84a_get_statements,
    traceCtx: { agent: 'inspector', tool: 'findImpossibleMoves', queryId: 'Q84a_get_statements' },
  });
  if (stmtsRes.step) trace.push(stmtsRes.step);
  const stmtsMap = new Map<string, StatementInfo>(
    stmtsRes.data.map((s) => [s.claimId, { by: s.by, text: s.text }])
  );

  const evRes = await ro<{ id: string; text: string }>({
    graphName: playGraph,
    query: Q84b_get_evidence,
    traceCtx: { agent: 'inspector', tool: 'findImpossibleMoves', queryId: 'Q84b_get_evidence' },
  });
  if (evRes.step) trace.push(evRes.step);
  const evMap = new Map<string, EvidenceInfo>(
    evRes.data.map((e) => [e.id, { text: e.text }])
  );

  // Get map edges
  const mapRes = await ro<MapEdgeRecord>({
    graphName: playGraph,
    query: Q64_map_edges,
    traceCtx: { agent: 'inspector', tool: 'findImpossibleMoves', queryId: 'Q64_map_edges' },
  });
  if (mapRes.step) trace.push(mapRes.step);
  const adj = buildAdjacency(rooms, mapRes.data);

  // Get assertion pairs
  const pairsRes = await ro<{
    fromSrc: string;
    person: string;
    slotA: number;
    roomA: string;
    toSrc: string;
    slotB: number;
    roomB: string;
  }>({
    graphName: playGraph,
    query: Q62_assertion_pairs,
    traceCtx: { agent: 'inspector', tool: 'findImpossibleMoves', queryId: 'Q62_assertion_pairs' },
  });
  if (pairsRes.step) trace.push(pairsRes.step);

  const seen = new Set<string>();
  const moves: FindImpossibleMovesOutput['moves'] = [];

  for (const row of pairsRes.data) {
    const key = `${row.fromSrc}|${row.toSrc}`;
    if (seen.has(key)) continue;

    const available = row.slotB - row.slotA;
    const { distance: needed, path } = shortestPath(adj, row.roomA, row.roomB);

    if (needed > available) {
      seen.add(key);
      moves.push({
        person: row.person,
        from: buildSrcRef(row.fromSrc, stmtsMap, evMap),
        to: buildSrcRef(row.toSrc, stmtsMap, evMap),
        needed,
        available,
        path,
      });
    }
  }

  return {
    ok: true,
    data: { moves },
    trace,
  };
}
