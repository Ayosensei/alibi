import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { TOOLS, type Envelope, type TraceStepType } from './contract';
import { CaseSchema } from './schema';
import { ro, graphExists } from './db';
import { Q70_motive_paths, Q71_alibi_support } from './queries';

export type MotivePathsInput = z.infer<typeof TOOLS.motivePaths.input>;
export type MotivePathsOutput = z.infer<typeof TOOLS.motivePaths.output>;

export type AlibiSupportInput = z.infer<typeof TOOLS.alibiSupport.input>;
export type AlibiSupportOutput = z.infer<typeof TOOLS.alibiSupport.output>;

export async function motivePaths(
  input: MotivePathsInput
): Promise<Envelope<MotivePathsOutput>> {
  const trace: TraceStepType[] = [];
  const parsed = TOOLS.motivePaths.input.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'BAD_ARGS', message: 'Invalid arguments for motivePaths' },
      trace,
    };
  }

  const { playerId, caseId, person } = parsed.data;
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

  const res = await ro<{
    hops: Array<{ relationId: string; type: string; text: string }>;
    len: number;
  }>({
    graphName: playGraph,
    query: Q70_motive_paths,
    params: { person },
    traceCtx: { agent: 'inspector', tool: 'motivePaths', queryId: 'Q70_motive_paths' },
  });
  if (res.step) trace.push(res.step);

  if (res.data.length === 0) {
    return {
      ok: true,
      data: {
        status: 'no_path_known',
        paths: [],
      },
      trace,
    };
  }

  const paths = res.data.map((row) => ({
    hops: row.hops,
    length: row.len,
  }));

  return {
    ok: true,
    data: {
      status: 'known',
      paths,
    },
    trace,
  };
}

export async function alibiSupport(
  input: AlibiSupportInput
): Promise<Envelope<AlibiSupportOutput>> {
  const trace: TraceStepType[] = [];
  const parsed = TOOLS.alibiSupport.input.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'BAD_ARGS', message: 'Invalid arguments for alibiSupport' },
      trace,
    };
  }

  const { playerId, caseId, person, slot } = parsed.data;
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

  const res = await ro<{
    claimed?: string;
    claimId?: string;
    supporter?: string;
    contradicted: boolean;
  }>({
    graphName: playGraph,
    query: Q71_alibi_support,
    params: { person, slot },
    traceCtx: { agent: 'inspector', tool: 'alibiSupport', queryId: 'Q71_alibi_support' },
  });
  if (res.step) trace.push(res.step);

  const claimedRoom = res.data[0]?.claimed ?? null;
  if (!claimedRoom) {
    return {
      ok: true,
      data: {
        claimedRoom: null,
        supporters: [],
        supported: false,
      },
      trace,
    };
  }

  const supporters = res.data
    .filter((r) => r.claimId && r.supporter)
    .map((r) => ({
      by: r.supporter!,
      claimId: r.claimId!,
      reliable: !r.contradicted,
      reason: r.contradicted ? 'Contradicted by physical evidence' : undefined,
    }));

  const supported = supporters.some((s) => s.reliable);

  return {
    ok: true,
    data: {
      claimedRoom,
      supporters,
      supported,
    },
    trace,
  };
}
