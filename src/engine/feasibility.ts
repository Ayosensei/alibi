import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { TOOLS, type Envelope, type TraceStepType } from './contract';
import { CaseSchema } from './schema';
import { ro, graphExists } from './db';
import {
  Q64_map_edges,
  Q66_hard_anchors,
  Q66b_all_hard_anchors,
  Q68_evidence_act,
} from './queries';
import {
  checkFeasibility as runFeasibilityCheck,
  type MapEdgeRecord,
  type HardAnchorRecord,
} from './map';

export type CheckFeasibilityInput = z.infer<typeof TOOLS.checkFeasibility.input>;
export type CheckFeasibilityOutput = z.infer<typeof TOOLS.checkFeasibility.output>;

export type WhoCouldHaveInput = z.infer<typeof TOOLS.whoCouldHave.input>;
export type WhoCouldHaveOutput = z.infer<typeof TOOLS.whoCouldHave.output>;

export async function checkFeasibility(
  input: CheckFeasibilityInput
): Promise<Envelope<CheckFeasibilityOutput>> {
  const trace: TraceStepType[] = [];
  const parsed = TOOLS.checkFeasibility.input.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'BAD_ARGS', message: 'Invalid arguments for checkFeasibility' },
      trace,
    };
  }

  const { playerId, caseId, person, slot, room } = parsed.data;
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
  const personExists = caseData.people.some((p) => p.id === person);
  if (!personExists) {
    return {
      ok: false,
      error: { code: 'UNKNOWN_PERSON', message: `Unknown person: ${person}` },
      trace,
    };
  }

  const roomExists = caseData.rooms.some((r) => r.id === room);
  if (!roomExists) {
    return {
      ok: false,
      error: { code: 'UNKNOWN_ROOM', message: `Unknown room: ${room}` },
      trace,
    };
  }

  const rooms = caseData.rooms.map((r) => r.id);

  // Get map edges
  const mapRes = await ro<MapEdgeRecord>({
    graphName: playGraph,
    query: Q64_map_edges,
    traceCtx: { agent: 'inspector', tool: 'checkFeasibility', queryId: 'Q64_map_edges' },
  });
  if (mapRes.step) trace.push(mapRes.step);

  // Get hard anchors for this person
  const anchorsRes = await ro<HardAnchorRecord>({
    graphName: playGraph,
    query: Q66_hard_anchors,
    params: { person },
    traceCtx: { agent: 'inspector', tool: 'checkFeasibility', queryId: 'Q66_hard_anchors' },
  });
  if (anchorsRes.step) trace.push(anchorsRes.step);

  const anchors = anchorsRes.data.map((a) => ({
    ...a,
    subject: person,
  }));

  const result = runFeasibilityCheck(person, slot, room, rooms, mapRes.data, anchors);

  return {
    ok: true,
    data: {
      feasible: result.feasible,
      reachable: result.reachable,
      violations: result.violations,
    },
    trace,
  };
}

export async function whoCouldHave(
  input: WhoCouldHaveInput
): Promise<Envelope<WhoCouldHaveOutput>> {
  const trace: TraceStepType[] = [];
  const parsed = TOOLS.whoCouldHave.input.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'BAD_ARGS', message: 'Invalid arguments for whoCouldHave' },
      trace,
    };
  }

  const { playerId, caseId, evidenceId } = parsed.data;
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
  const evMeta = caseData.evidence.find((e) => e.id === evidenceId);
  if (!evMeta) {
    return {
      ok: false,
      error: { code: 'UNKNOWN_EVIDENCE', message: `Unknown evidence: ${evidenceId}` },
      trace,
    };
  }

  // Query evidence act from play graph
  const actRes = await ro<{ slot: number; room: string; candidates: string[] }>({
    graphName: playGraph,
    query: Q68_evidence_act,
    params: { eid: evidenceId },
    traceCtx: { agent: 'inspector', tool: 'whoCouldHave', queryId: 'Q68_evidence_act' },
  });
  if (actRes.step) trace.push(actRes.step);

  const actRow = actRes.data[0];
  if (!actRow || !actRow.slot || actRow.slot === 0 || !actRow.candidates || actRow.candidates.length === 0) {
    return {
      ok: true,
      data: {
        status: 'not_an_act',
        candidates: [],
        survivors: [],
        inferredAnchor: null,
      },
      trace,
    };
  }

  const rooms = caseData.rooms.map((r) => r.id);

  // Get map edges
  const mapRes = await ro<MapEdgeRecord>({
    graphName: playGraph,
    query: Q64_map_edges,
    traceCtx: { agent: 'inspector', tool: 'whoCouldHave', queryId: 'Q64_map_edges' },
  });
  if (mapRes.step) trace.push(mapRes.step);

  // Get all hard anchors on the board
  const anchorsRes = await ro<HardAnchorRecord>({
    graphName: playGraph,
    query: Q66b_all_hard_anchors,
    traceCtx: { agent: 'inspector', tool: 'whoCouldHave', queryId: 'Q66b_all_hard_anchors' },
  });
  if (anchorsRes.step) trace.push(anchorsRes.step);

  const candidates = actRow.candidates.map((cand) => {
    const f = runFeasibilityCheck(
      cand,
      actRow.slot,
      actRow.room,
      rooms,
      mapRes.data,
      anchorsRes.data
    );
    return {
      person: cand,
      feasible: f.feasible,
      violations: f.violations,
    };
  });

  const survivors = candidates.filter((c) => c.feasible).map((c) => c.person);
  const inferredAnchor =
    survivors.length === 1
      ? { person: survivors[0], slot: actRow.slot, room: actRow.room }
      : null;

  return {
    ok: true,
    data: {
      status: 'ok',
      candidates,
      survivors,
      inferredAnchor,
    },
    trace,
  };
}
