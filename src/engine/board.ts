import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { TOOLS, type Envelope, type TraceStepType } from './contract';
import { CaseSchema } from './schema';
import { ro, graphExists } from './db';
import { calculateWindow } from './search';
import {
  Q21_get_tick,
  Q58_searched_rooms,
  Q66b_all_hard_anchors,
  Q84a_get_statements,
  Q84b_get_evidence,
  Q84c_get_flags,
  Q84d_get_hypotheses,
  Q84e_get_relations,
  Q84f_hidden_edge_known,
  Q84g_baits_used,
} from './queries';

export type GetBoardInput = z.infer<typeof TOOLS.getBoard.input>;
export type GetBoardOutput = z.infer<typeof TOOLS.getBoard.output>;

export async function getBoard(input: GetBoardInput): Promise<Envelope<GetBoardOutput>> {
  const trace: TraceStepType[] = [];
  const parsed = TOOLS.getBoard.input.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'BAD_ARGS', message: 'Invalid arguments for getBoard' },
      trace,
    };
  }

  const { playerId, caseId } = parsed.data;
  const playGraph = `play:${playerId}:${caseId}`;

  const exists = await graphExists(playGraph);
  if (!exists) {
    return {
      ok: false,
      error: { code: 'UNKNOWN_PLAY', message: `No active play session for ${playerId}` },
      trace,
    };
  }

  const casePath = join(process.cwd(), 'cases', `${caseId}.json`);
  if (!existsSync(casePath)) {
    return {
      ok: false,
      error: { code: 'UNKNOWN_CASE', message: `Unknown case ${caseId}` },
      trace,
    };
  }

  const caseData = CaseSchema.parse(JSON.parse(readFileSync(casePath, 'utf8')));

  // Tick
  const tickRes = await ro<{ tick: number }>({
    graphName: playGraph,
    query: Q21_get_tick,
    params: { pid: playerId },
    traceCtx: { agent: 'engine', tool: 'getBoard', queryId: 'Q21_get_tick' },
  });
  if (tickRes.step) trace.push(tickRes.step);
  const tick = tickRes.data[0]?.tick ?? 0;

  // Window
  const window = await calculateWindow(caseData, playGraph);

  // Statements
  const stmtsRes = await ro<{
    id: string;
    claimId: string;
    by: string;
    kind: string;
    subject?: string;
    slot?: number;
    room?: string;
    text: string;
    tick: number;
  }>({
    graphName: playGraph,
    query: Q84a_get_statements,
    traceCtx: { agent: 'engine', tool: 'getBoard', queryId: 'Q84a_get_statements' },
  });
  if (stmtsRes.step) trace.push(stmtsRes.step);

  const statements = stmtsRes.data.map((s) => ({
    id: s.id,
    claimId: s.claimId,
    by: s.by,
    kind: s.kind,
    subject: s.subject && s.subject !== '' ? s.subject : undefined,
    slot: s.slot && s.slot > 0 ? s.slot : undefined,
    room: s.room && s.room !== '' ? s.room : undefined,
    text: s.text,
    tick: s.tick,
  }));

  // Evidence
  const evRes = await ro<{ id: string; room: string; title: string; text: string }>({
    graphName: playGraph,
    query: Q84b_get_evidence,
    traceCtx: { agent: 'engine', tool: 'getBoard', queryId: 'Q84b_get_evidence' },
  });
  if (evRes.step) trace.push(evRes.step);

  // Hard Anchors
  const anchorsRes = await ro<{ src: string; subject: string; slot: number; room: string }>({
    graphName: playGraph,
    query: Q66b_all_hard_anchors,
    traceCtx: { agent: 'engine', tool: 'getBoard', queryId: 'Q66b_all_hard_anchors' },
  });
  if (anchorsRes.step) trace.push(anchorsRes.step);

  // Flags
  const flagsRes = await ro<{
    id: string;
    kind: string;
    refs: string[];
    note: string;
    by: 'player' | 'inspector';
  }>({
    graphName: playGraph,
    query: Q84c_get_flags,
    traceCtx: { agent: 'engine', tool: 'getBoard', queryId: 'Q84c_get_flags' },
  });
  if (flagsRes.step) trace.push(flagsRes.step);

  // Hypotheses
  const hypRes = await ro<{
    id: string;
    text: string;
    person?: string;
    confidence: number;
    by: 'player' | 'inspector';
  }>({
    graphName: playGraph,
    query: Q84d_get_hypotheses,
    traceCtx: { agent: 'engine', tool: 'getBoard', queryId: 'Q84d_get_hypotheses' },
  });
  if (hypRes.step) trace.push(hypRes.step);

  const hypotheses = hypRes.data.map((h) => ({
    id: h.id,
    text: h.text,
    person: h.person && h.person !== '' ? h.person : undefined,
    confidence: h.confidence,
    by: h.by,
  }));

  // Known Relations
  const relRes = await ro<{
    id: string;
    from: string;
    to: string;
    type: string;
    text: string;
  }>({
    graphName: playGraph,
    query: Q84e_get_relations,
    traceCtx: { agent: 'engine', tool: 'getBoard', queryId: 'Q84e_get_relations' },
  });
  if (relRes.step) trace.push(relRes.step);

  // Hidden Edge Known
  const hiddenRes = await ro<{ known: boolean }>({
    graphName: playGraph,
    query: Q84f_hidden_edge_known,
    traceCtx: { agent: 'engine', tool: 'getBoard', queryId: 'Q84f_hidden_edge_known' },
  });
  if (hiddenRes.step) trace.push(hiddenRes.step);
  const hiddenEdgeKnown = hiddenRes.data[0]?.known ?? false;

  // Baits used
  const baitsRes = await ro<{ count: number }>({
    graphName: playGraph,
    query: Q84g_baits_used,
    traceCtx: { agent: 'engine', tool: 'getBoard', queryId: 'Q84g_baits_used' },
  });
  if (baitsRes.step) trace.push(baitsRes.step);
  const usedBaits = baitsRes.data[0]?.count ?? 0;
  const baitsLeft = Math.max(0, caseData.baitsAllowed - usedBaits);

  // Searched Rooms
  const searchedRes = await ro<{ rooms: string[] }>({
    graphName: playGraph,
    query: Q58_searched_rooms,
    traceCtx: { agent: 'engine', tool: 'getBoard', queryId: 'Q58_searched_rooms' },
  });
  if (searchedRes.step) trace.push(searchedRes.step);
  const searchedRooms = searchedRes.data[0]?.rooms ?? [];

  return {
    ok: true,
    data: {
      tick,
      window,
      statements,
      evidence: evRes.data,
      hardAnchors: anchorsRes.data,
      flags: flagsRes.data,
      hypotheses,
      knownRelations: relRes.data,
      hiddenEdgeKnown,
      baitsLeft,
      searchedRooms,
    },
    trace,
  };
}
