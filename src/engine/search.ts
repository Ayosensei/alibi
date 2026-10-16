import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { ACTIONS, type Envelope, type TraceStepType } from './contract';
import { CaseSchema, type CaseType } from './schema';
import { ro, run, graphExists } from './db';
import { incrementTick } from './play';
import {
  Q42_found_evidence,
  Q45_reveal_relation,
  Q50_evidence_in_room,
  Q51_add_evidence,
  Q52_add_ev_assertion,
  Q53_reveal_edge,
  Q54_set_knowers,
  Q55_log_search,
  Q56_clear_inferred,
  Q57_add_inferred,
  Q59_is_room_searched,
  Q64_map_edges,
  Q66b_all_hard_anchors,
  Q72_window,
} from './queries';
import {
  checkFeasibility,
  type MapEdgeRecord,
  type HardAnchorRecord,
} from './map';

export type SearchInput = z.input<typeof ACTIONS.search.input>;
export type SearchOutput = z.infer<typeof ACTIONS.search.output>;

interface TruthEvidenceRow {
  id: string;
  room: string;
  title: string;
  text: string;
  window?: number[];
  windowKind?: string;
  revealsEdge?: string;
  knowers?: string[];
  actSlot?: number;
  actRoom?: string;
  actRestrictsTo?: string[];
  relationId?: string;
  asserts: Array<{ subject: string; slot: number; room: string }>;
}

export async function calculateWindow(
  caseData: CaseType,
  playGraph: string
): Promise<number[] | null> {
  const windowRes = await ro<{ id: string; window: number[]; kind?: string }>({
    graphName: playGraph,
    query: Q72_window,
  });

  let selectedWindow: number[] | null = null;
  for (const row of windowRes.data) {
    if (row.kind === 'revises') {
      return row.window;
    }
    if (!selectedWindow && row.window && row.window.length > 0) {
      selectedWindow = row.window;
    }
  }

  return selectedWindow ?? caseData.publicWindow ?? null;
}

export async function eliminate(
  playGraph: string,
  caseData: CaseType,
  trace?: TraceStepType[]
): Promise<Array<{ person: string; slot: number; room: string }>> {
  // Clear previous inferred assertions
  const clearRes = await run({
    graphName: playGraph,
    query: Q56_clear_inferred,
    traceCtx: { agent: 'engine', tool: 'eliminate', queryId: 'Q56_clear_inferred' },
  });
  if (clearRes.step && trace) trace.push(clearRes.step);

  // Get currently found evidence IDs in order
  const foundRes = await ro<{ id: string }>({
    graphName: playGraph,
    query: Q42_found_evidence,
    traceCtx: { agent: 'engine', tool: 'eliminate', queryId: 'Q42_found_evidence' },
  });
  if (foundRes.step && trace) trace.push(foundRes.step);

  const foundIds = new Set(foundRes.data.map((r) => r.id));

  // Get map edges
  const mapRes = await ro<MapEdgeRecord>({
    graphName: playGraph,
    query: Q64_map_edges,
    traceCtx: { agent: 'engine', tool: 'eliminate', queryId: 'Q64_map_edges' },
  });
  if (mapRes.step && trace) trace.push(mapRes.step);
  const edges = mapRes.data;
  const rooms = caseData.rooms.map((r) => r.id);

  // Get hard anchors from play graph
  const anchorsRes = await ro<HardAnchorRecord>({
    graphName: playGraph,
    query: Q66b_all_hard_anchors,
    traceCtx: { agent: 'engine', tool: 'eliminate', queryId: 'Q66b_all_hard_anchors' },
  });
  if (anchorsRes.step && trace) trace.push(anchorsRes.step);
  const hardAnchors = [...anchorsRes.data];

  const inferredAnchors: Array<{ person: string; slot: number; room: string }> = [];

  // Filter evidence that has act and is on the board, in case file order
  const actEvidences = caseData.evidence.filter((e) => foundIds.has(e.id) && e.act);

  for (const e of actEvidences) {
    if (!e.act) continue;
    const { slot, room, restrictsTo } = e.act;
    const survivors = restrictsTo.filter((candidate) => {
      const { feasible } = checkFeasibility(
        candidate,
        slot,
        room,
        rooms,
        edges,
        hardAnchors
      );
      return feasible;
    });

    if (survivors.length === 1) {
      const survivor = survivors[0];
      const anchorSrc = `inferred:${e.id}`;
      const inferredRecord = { person: survivor, slot, room };
      inferredAnchors.push(inferredRecord);

      // Add to hard anchors list so subsequent act checks see it
      hardAnchors.push({
        src: anchorSrc,
        subject: survivor,
        slot,
        room,
      });

      // Write inferred assertion to play graph
      const addRes = await run({
        graphName: playGraph,
        query: Q57_add_inferred,
        params: {
          id: `inf_${e.id}`,
          src: anchorSrc,
          subject: survivor,
          slot,
          room,
        },
        traceCtx: { agent: 'engine', tool: 'eliminate', queryId: 'Q57_add_inferred' },
      });
      if (addRes.step && trace) trace.push(addRes.step);
    }
  }

  return inferredAnchors;
}

export async function search(input: SearchInput): Promise<Envelope<SearchOutput>> {
  const trace: TraceStepType[] = [];
  const parsed = ACTIONS.search.input.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'BAD_ARGS', message: 'Invalid arguments for search' },
      trace,
    };
  }

  const { playerId, caseId, roomId } = parsed.data;
  const playGraph = `play:${playerId}:${caseId}`;
  const truthGraph = `truth:${caseId}`;

  const playExists = await graphExists(playGraph);
  if (!playExists) {
    return {
      ok: false,
      error: { code: 'UNKNOWN_PLAY', message: `No active game for player: ${playerId}` },
      trace,
    };
  }

  const casePath = join(process.cwd(), 'cases', `${caseId}.json`);
  if (!existsSync(casePath)) {
    return {
      ok: false,
      error: { code: 'UNKNOWN_CASE', message: `Unknown case: ${caseId}` },
      trace,
    };
  }

  const caseData = CaseSchema.parse(JSON.parse(readFileSync(casePath, 'utf8')));
  const roomExists = caseData.rooms.some((r) => r.id === roomId);
  if (!roomExists) {
    return {
      ok: false,
      error: { code: 'UNKNOWN_ROOM', message: `Unknown room: ${roomId}` },
      trace,
    };
  }

  // Check if room has already been searched
  const alreadySearchedRes = await ro<{ count: number }>({
    graphName: playGraph,
    query: Q59_is_room_searched,
    params: { room: roomId },
    traceCtx: { agent: 'engine', tool: 'search', queryId: 'Q59_is_room_searched' },
  });
  if (alreadySearchedRes.step) trace.push(alreadySearchedRes.step);

  if ((alreadySearchedRes.data[0]?.count ?? 0) > 0) {
    return {
      ok: false,
      error: { code: 'ALREADY_SEARCHED', message: `Room ${roomId} was already searched` },
      trace,
    };
  }

  // Window before search
  const oldWindow = await calculateWindow(caseData, playGraph);

  // Advance tick and log search
  const newTick = await incrementTick(playerId, caseId);
  const logRes = await run({
    graphName: playGraph,
    query: Q55_log_search,
    params: { room: roomId, tick: newTick },
    traceCtx: { agent: 'engine', tool: 'search', queryId: 'Q55_log_search' },
  });
  if (logRes.step) trace.push(logRes.step);

  // Read evidence in room from truth graph
  const evRes = await ro<TruthEvidenceRow>({
    graphName: truthGraph,
    query: Q50_evidence_in_room,
    params: { room: roomId },
    traceCtx: { agent: 'engine', tool: 'search', queryId: 'Q50_evidence_in_room' },
  });
  if (evRes.step) trace.push(evRes.step);

  let revealedEdge = false;
  const foundItems: Array<{ id: string; title: string; text: string }> = [];

  for (const item of evRes.data) {
    foundItems.push({
      id: item.id,
      title: item.title,
      text: item.text,
    });

    // Q51: Add evidence to play graph
    const addEvRes = await run({
      graphName: playGraph,
      query: Q51_add_evidence,
      params: {
        id: item.id,
        room: item.room,
        title: item.title,
        text: item.text,
        window: item.window ?? [],
        windowKind: item.windowKind ?? '',
        actSlot: item.actSlot ?? 0,
        actRoom: item.actRoom ?? '',
        actRestrictsTo: item.actRestrictsTo ?? [],
        relationId: item.relationId ?? '',
        revealsEdge: item.revealsEdge ?? '',
        knowers: item.knowers ?? [],
      },
      traceCtx: { agent: 'engine', tool: 'search', queryId: 'Q51_add_evidence' },
    });
    if (addEvRes.step) trace.push(addEvRes.step);

    // Q52: Add asserts
    if (item.asserts && item.asserts.length > 0) {
      for (const raw of item.asserts) {
        if (!raw) continue;
        const a = (raw as Record<string, unknown>).properties
          ? ((raw as Record<string, unknown>).properties as { subject?: string; slot?: number; room?: string })
          : (raw as { subject?: string; slot?: number; room?: string });
        if (!a || !a.subject) continue;
        const addAssRes = await run({
          graphName: playGraph,
          query: Q52_add_ev_assertion,
          params: {
            eid: item.id,
            aid: `ev_ass_${item.id}_${a.subject}_${a.slot}`,
            subject: a.subject,
            slot: Number(a.slot),
            room: a.room ?? '',
          },
          traceCtx: { agent: 'engine', tool: 'search', queryId: 'Q52_add_ev_assertion' },
        });
        if (addAssRes.step) trace.push(addAssRes.step);
      }
    }

    // Reveal relation if present
    if (item.relationId) {
      const rel = caseData.relations.find((r) => r.id === item.relationId);
      if (rel) {
        const relRes = await run({
          graphName: playGraph,
          query: Q45_reveal_relation,
          params: {
            from: rel.from,
            to: rel.to,
            rid: rel.id,
            type: rel.type,
            text: rel.text,
          },
          traceCtx: { agent: 'engine', tool: 'search', queryId: 'Q45_reveal_relation' },
        });
        if (relRes.step) trace.push(relRes.step);
      }
    }

    // Reveal edge if present
    if (item.revealsEdge) {
      const hiddenEdge = caseData.edges.find((e) => e.state === 'hidden');
      if (hiddenEdge) {
        revealedEdge = true;
        const edgeRes = await run({
          graphName: playGraph,
          query: Q53_reveal_edge,
          params: {
            a: hiddenEdge.a,
            b: hiddenEdge.b,
            knowers: item.knowers ?? [],
          },
          traceCtx: { agent: 'engine', tool: 'search', queryId: 'Q53_reveal_edge' },
        });
        if (edgeRes.step) trace.push(edgeRes.step);
      }
    }

    // Set knowers if present
    if (item.knowers && item.knowers.length > 0) {
      const knowersRes = await run({
        graphName: playGraph,
        query: Q54_set_knowers,
        params: { knowers: item.knowers },
        traceCtx: { agent: 'engine', tool: 'search', queryId: 'Q54_set_knowers' },
      });
      if (knowersRes.step) trace.push(knowersRes.step);
    }
  }

  // Dynamic window check
  const newWindow = await calculateWindow(caseData, playGraph);
  let windowChanged: number[] | null = null;
  if (JSON.stringify(oldWindow) !== JSON.stringify(newWindow)) {
    windowChanged = newWindow;
  }

  // Elimination
  const inferred = await eliminate(playGraph, caseData, trace);

  return {
    ok: true,
    data: {
      found: foundItems,
      revealedEdge,
      windowChanged,
      inferred,
    },
    trace,
  };
}
