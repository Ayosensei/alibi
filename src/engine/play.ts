import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { ACTIONS, type Envelope, type TraceStepType } from './contract';
import { CaseSchema } from './schema';
import { ensureCases } from './seed';
import {
  copyGraph,
  deleteGraph,
  graphExists,
  ro,
  run,
} from './db';
import {
  Q20_create_player,
  Q21_get_tick,
  Q22_set_tick,
  Q23_progress_upsert,
  Q24_get_progress,
} from './queries';

export type StartInput = z.input<typeof ACTIONS.start.input>;
export type StartOutput = z.infer<typeof ACTIONS.start.output>;

export interface PlayerProgress {
  caseId: string;
  stars: number;
  accusations: number;
  completedAt: string;
}

export async function startPlay(input: StartInput): Promise<Envelope<StartOutput>> {
  const trace: TraceStepType[] = [];
  const parsedInput = ACTIONS.start.input.safeParse(input);
  if (!parsedInput.success) {
    return {
      ok: false,
      error: {
        code: 'BAD_ARGS',
        message: 'Invalid arguments for start',
        hint: parsedInput.error.message,
      },
      trace,
    };
  }

  const { playerId, caseId, reset } = parsedInput.data;
  const caseFilePath = join(process.cwd(), 'cases', `${caseId}.json`);

  if (!existsSync(caseFilePath)) {
    return {
      ok: false,
      error: {
        code: 'UNKNOWN_CASE',
        message: `Unknown case id: ${caseId}`,
      },
      trace,
    };
  }

  // Ensure case data is loaded into FalkorDB
  await ensureCases();

  const playGraph = `play:${playerId}:${caseId}`;
  const publicGraph = `public:${caseId}`;

  if (reset) {
    await deleteGraph(playGraph);
  }

  const alreadyExists = await graphExists(playGraph);
  if (!alreadyExists) {
    await copyGraph(publicGraph, playGraph);

    const playerRes = await run<{ id: string }>({
      graphName: playGraph,
      query: Q20_create_player,
      params: { pid: playerId, at: new Date().toISOString() },
      traceCtx: {
        agent: 'engine',
        tool: 'startPlay',
        queryId: 'Q20_create_player',
      },
    });
    if (playerRes.step) {
      trace.push(playerRes.step);
    }
  }

  const rawCase = JSON.parse(readFileSync(caseFilePath, 'utf8'));
  const caseData = CaseSchema.parse(rawCase);

  // Return public case data: strictly filtered to preserve the information barrier
  const publicEdges = caseData.edges
    .filter((e) => e.state === 'open' || e.state === 'locked')
    .map((e) => ({
      a: e.a,
      b: e.b,
      state: e.state as 'open' | 'locked',
    }));

  const publicPeople = caseData.people.map((p) => ({
    id: p.id,
    name: p.name,
    role: p.role,
    victim: p.victim ?? false,
  }));

  const data: StartOutput = {
    caseId: caseData.id,
    level: caseData.level,
    title: caseData.title,
    tagline: caseData.tagline,
    briefing: caseData.briefing,
    hints: caseData.hints,
    slots: caseData.slots,
    rooms: caseData.rooms.map((r) => ({ id: r.id, name: r.name })),
    edges: publicEdges,
    people: publicPeople,
    crimeScene: caseData.truth.murder.room,
    publicWindow: caseData.publicWindow ?? [caseData.truth.murder.slot],
    baitsAllowed: caseData.baitsAllowed,
    arcClue: caseData.arcClue ?? null,
  };

  return { ok: true, data, trace };
}

export async function getTick(playerId: string, caseId: string): Promise<number> {
  const playGraph = `play:${playerId}:${caseId}`;
  const res = await ro<{ tick: number }>({
    graphName: playGraph,
    query: Q21_get_tick,
    params: { pid: playerId },
  });
  return res.data[0]?.tick ?? 0;
}

export async function incrementTick(playerId: string, caseId: string): Promise<number> {
  const playGraph = `play:${playerId}:${caseId}`;
  const res = await run<{ tick: number }>({
    graphName: playGraph,
    query: Q22_set_tick,
    params: { pid: playerId },
  });
  return res.data[0]?.tick ?? 0;
}

export async function saveProgress(
  playerId: string,
  caseId: string,
  stars: number,
  accusations: number
): Promise<void> {
  const playerGraph = `player:${playerId}`;
  await run({
    graphName: playerGraph,
    query: Q23_progress_upsert,
    params: {
      pid: playerId,
      case: caseId,
      stars,
      acc: accusations,
      at: new Date().toISOString(),
    },
  });
}

export async function getProgress(playerId: string): Promise<PlayerProgress[]> {
  const playerGraph = `player:${playerId}`;
  const res = await ro<PlayerProgress>({
    graphName: playerGraph,
    query: Q24_get_progress,
    params: { pid: playerId },
  });
  return res.data;
}
