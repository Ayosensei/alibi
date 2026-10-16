import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { TOOLS, type Envelope, type TraceStepType } from './contract';
import { CaseSchema } from './schema';
import { run, graphExists } from './db';
import {
  Q80_flag,
  Q81_flag_about,
  Q82_hypothesis,
  Q83_hyp_support,
} from './queries';

export type FlagInput = z.input<typeof TOOLS.flag.input>;
export type FlagOutput = z.infer<typeof TOOLS.flag.output>;

export type HypothesizeInput = z.input<typeof TOOLS.hypothesize.input>;
export type HypothesizeOutput = z.infer<typeof TOOLS.hypothesize.output>;

export async function flag(input: FlagInput): Promise<Envelope<FlagOutput>> {
  const trace: TraceStepType[] = [];
  const parsed = TOOLS.flag.input.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'BAD_ARGS', message: 'Invalid arguments for flag' },
      trace,
    };
  }

  const { playerId, caseId, kind, refs, note, by } = parsed.data;
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

  const flagId = `flag_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Create flag
  const createRes = await run({
    graphName: playGraph,
    query: Q80_flag,
    params: {
      id: flagId,
      kind,
      refs,
      note,
      by,
    },
    traceCtx: { agent: by === 'inspector' ? 'inspector' : 'engine', tool: 'flag', queryId: 'Q80_flag' },
  });
  if (createRes.step) trace.push(createRes.step);

  // Link about
  const aboutRes = await run({
    graphName: playGraph,
    query: Q81_flag_about,
    params: {
      id: flagId,
      refs,
    },
    traceCtx: { agent: by === 'inspector' ? 'inspector' : 'engine', tool: 'flag', queryId: 'Q81_flag_about' },
  });
  if (aboutRes.step) trace.push(aboutRes.step);

  return {
    ok: true,
    data: { flagId },
    trace,
  };
}

export async function hypothesize(
  input: HypothesizeInput
): Promise<Envelope<HypothesizeOutput>> {
  const trace: TraceStepType[] = [];
  const parsed = TOOLS.hypothesize.input.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'BAD_ARGS', message: 'Invalid arguments for hypothesize' },
      trace,
    };
  }

  const { playerId, caseId, text, person, confidence, supportedBy, by } = parsed.data;
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
  if (person) {
    const personExists = caseData.people.some((p) => p.id === person);
    if (!personExists) {
      return {
        ok: false,
        error: { code: 'UNKNOWN_PERSON', message: `Unknown person: ${person}` },
        trace,
      };
    }
  }

  const hypothesisId = `hyp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Create hypothesis
  const createRes = await run({
    graphName: playGraph,
    query: Q82_hypothesis,
    params: {
      id: hypothesisId,
      text,
      person: person ?? '',
      confidence,
      by,
    },
    traceCtx: { agent: by === 'inspector' ? 'inspector' : 'engine', tool: 'hypothesize', queryId: 'Q82_hypothesis' },
  });
  if (createRes.step) trace.push(createRes.step);

  // Link supportedBy
  if (supportedBy && supportedBy.length > 0) {
    const suppRes = await run({
      graphName: playGraph,
      query: Q83_hyp_support,
      params: {
        id: hypothesisId,
        refs: supportedBy,
      },
      traceCtx: { agent: by === 'inspector' ? 'inspector' : 'engine', tool: 'hypothesize', queryId: 'Q83_hyp_support' },
    });
    if (suppRes.step) trace.push(suppRes.step);
  }

  return {
    ok: true,
    data: { hypothesisId },
    trace,
  };
}
