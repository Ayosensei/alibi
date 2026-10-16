import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { ACTIONS, type Envelope, type TraceStepType } from './contract';
import { CaseSchema } from './schema';
import { graphExists, ro, run } from './db';
import { incrementTick } from './play';
import {
  Q90_bait,
  Q91_baits_left,
  Q92_bait_used,
  Q43_add_statement,
  Q80_flag,
  Q81_flag_about,
  Q99_get_accusations,
} from './queries';

export type UseBaitInput = z.input<typeof ACTIONS.useBait.input>;
export type UseBaitOutput = z.infer<typeof ACTIONS.useBait.output>;

export async function useBait(input: UseBaitInput): Promise<Envelope<UseBaitOutput>> {
  const trace: TraceStepType[] = [];
  const parsed = ACTIONS.useBait.input.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'BAD_ARGS', message: 'Invalid arguments for useBait' },
      trace,
    };
  }

  const { playerId, caseId, baitId } = parsed.data;
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

  // Check if level is already over
  const accRes = await ro<{ id: string; persons: string[]; result: string; wrong: boolean }>({
    graphName: playGraph,
    query: Q99_get_accusations,
    params: {},
    traceCtx: { agent: 'engine', tool: 'useBait', queryId: 'Q99_get_accusations' },
  });
  if (accRes.step) trace.push(accRes.step);

  const prevAccusations = accRes.data;
  const wrongCount = prevAccusations.filter((a) => a.wrong).length;
  const hasFull = prevAccusations.some((a) => a.result === 'full');
  if (hasFull || wrongCount >= 2) {
    return {
      ok: false,
      error: { code: 'LEVEL_OVER', message: 'The case is already over' },
      trace,
    };
  }

  // Check if bait has already been used
  const baitCheckRes = await ro<{ count: number }>({
    graphName: playGraph,
    query: `MATCH (u:BaitUsed {baitId: $bait}) RETURN count(u) AS count`,
    params: { bait: baitId },
    traceCtx: { agent: 'engine', tool: 'useBait', queryId: 'check_bait_already_used' },
  });
  if (baitCheckRes.step) trace.push(baitCheckRes.step);
  if ((baitCheckRes.data[0]?.count ?? 0) > 0) {
    return {
      ok: false,
      error: { code: 'BAD_ARGS', message: `Bait ${baitId} has already been used` },
      trace,
    };
  }

  // Check baits left
  const countRes = await ro<{ used: number }>({
    graphName: playGraph,
    query: Q91_baits_left,
    params: {},
    traceCtx: { agent: 'engine', tool: 'useBait', queryId: 'Q91_baits_left' },
  });
  if (countRes.step) trace.push(countRes.step);

  const usedCount = countRes.data[0]?.used ?? 0;
  const baitsAllowed = caseData.baitsAllowed ?? 0;
  const baitsLeftBefore = Math.max(0, baitsAllowed - usedCount);

  if (baitsLeftBefore <= 0) {
    return {
      ok: false,
      error: { code: 'NO_BAITS_LEFT', message: 'No baits left for this level' },
      trace,
    };
  }

  // Query truth graph for bait details
  const baitRes = await ro<{ slip: string; neutral: string; knownBy: string[] }>({
    graphName: truthGraph,
    query: Q90_bait,
    params: { bait: baitId },
    traceCtx: { agent: 'engine', tool: 'useBait', queryId: 'Q90_bait' },
  });
  if (baitRes.step) trace.push(baitRes.step);

  if (baitRes.data.length === 0) {
    return {
      ok: false,
      error: { code: 'BAD_ARGS', message: `Unknown bait: ${baitId}` },
      trace,
    };
  }

  const { slip, neutral, knownBy } = baitRes.data[0];
  const outcome: 'slip' | 'ambiguous' | 'nothing' =
    knownBy.length === 1 ? 'slip' : knownBy.length === 0 ? 'nothing' : 'ambiguous';
  const reactors = knownBy;

  // Advance game tick
  const tick = await incrementTick(playerId, caseId);

  // Record bait usage on play graph
  const usedId = `used_${baitId}_${Date.now()}`;
  const recordRes = await run({
    graphName: playGraph,
    query: Q92_bait_used,
    params: {
      id: usedId,
      bait: baitId,
      outcome,
      reactors,
      tick,
    },
    traceCtx: { agent: 'engine', tool: 'useBait', queryId: 'Q92_bait_used' },
  });
  if (recordRes.step) trace.push(recordRes.step);

  const baitsLeft = Math.max(0, baitsAllowed - (usedCount + 1));

  let reactions: { person: string; text: string; observation: string | null }[] = [];
  const newStatements: { id: string; by: string; text: string }[] = [];

  if (outcome === 'slip') {
    const knower = knownBy[0];
    const statementId = `stmt_slip_${baitId}`;

    // Write Statement on play board
    const stmtRes = await run({
      graphName: playGraph,
      query: Q43_add_statement,
      params: {
        sid: statementId,
        cid: `slip:${baitId}`,
        by: knower,
        kind: 'slip',
        subject: '',
        slot: 0,
        room: '',
        detail: '',
        text: slip,
        tick,
      },
      traceCtx: { agent: 'engine', tool: 'useBait', queryId: 'Q43_add_statement' },
    });
    if (stmtRes.step) trace.push(stmtRes.step);

    // Create Flag on play board
    const flagId = `flag_slip_${baitId}`;
    const flagRes = await run({
      graphName: playGraph,
      query: Q80_flag,
      params: {
        id: flagId,
        kind: 'slip',
        refs: [statementId],
        note: 'Slip of the tongue under questioning',
        by: 'player',
      },
      traceCtx: { agent: 'engine', tool: 'useBait', queryId: 'Q80_flag' },
    });
    if (flagRes.step) trace.push(flagRes.step);

    const flagAboutRes = await run({
      graphName: playGraph,
      query: Q81_flag_about,
      params: {
        id: flagId,
        refs: [statementId],
      },
      traceCtx: { agent: 'engine', tool: 'useBait', queryId: 'Q81_flag_about' },
    });
    if (flagAboutRes.step) trace.push(flagAboutRes.step);

    reactions = [{ person: knower, text: slip, observation: null }];
    newStatements.push({ id: statementId, by: knower, text: slip });
  } else if (outcome === 'ambiguous') {
    reactions = reactors.map((person) => ({
      person,
      text: neutral,
      observation: null,
    }));
  } else {
    // nothing
    reactions = [];
  }

  return {
    ok: true,
    data: {
      outcome,
      reactions,
      newStatements,
      baitsLeft,
    },
    trace,
  };
}
