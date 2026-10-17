import { FalkorDB, Graph } from 'falkordb';
import type { TraceStepType } from './contract';

export interface TraceContext {
  agent: TraceStepType['agent'];
  tool: string;
  queryId?: string;
}

export interface QueryResult<T> {
  data: T[];
  step?: TraceStepType;
}

let dbInstance: FalkorDB | null = null;

export async function getDb(): Promise<FalkorDB> {
  if (!dbInstance) {
    const url = process.env.FALKORDB_URL ?? 'redis://localhost:6379';
    dbInstance = await FalkorDB.connect({ url });
  }
  return dbInstance;
}

export async function closeDb(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}

export async function getGraph(graphName: string): Promise<Graph> {
  const db = await getDb();
  return db.selectGraph(graphName);
}

export async function listGraphs(): Promise<string[]> {
  const db = await getDb();
  return db.list();
}

export async function graphExists(graphName: string): Promise<boolean> {
  const names = await listGraphs();
  return names.includes(graphName);
}

export async function deleteGraph(graphName: string): Promise<boolean> {
  const exists = await graphExists(graphName);
  if (!exists) {
    return false;
  }
  const graph = await getGraph(graphName);
  await graph.delete();
  return true;
}

export async function copyGraph(sourceGraph: string, destGraph: string): Promise<void> {
  const src = await getGraph(sourceGraph);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await src.copy(destGraph);
      return;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('could not fork') && attempt < 2) {
        await new Promise((r) => setTimeout(r, 100));
        continue;
      }
      throw err;
    }
  }
}

export async function ro<T>(options: {
  graphName: string;
  query: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any>;
  traceCtx?: TraceContext;
}): Promise<QueryResult<T>> {
  const { graphName, query, params, traceCtx } = options;
  const start = performance.now();
  let data: T[] = [];

  try {
    const graph = await getGraph(graphName);
    const reply = await graph.roQuery<T>(query, params ? { params } : undefined);
    data = (reply.data ?? []) as T[];
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes('ERR Invalid graph operation on empty key') ||
      message.includes('Encountered an empty key when opened key')
    ) {
      // Non-existent graph key in FalkorDB behaves as empty
      data = [];
    } else {
      throw err;
    }
  }

  const elapsed = Math.round((performance.now() - start) * 100) / 100;
  let step: TraceStepType | undefined;

  if (traceCtx) {
    step = {
      agent: traceCtx.agent,
      tool: traceCtx.tool,
      queryId: traceCtx.queryId,
      args: (params ?? {}) as Record<string, unknown>,
      rows: data.length,
      ms: elapsed,
    };
  }

  return { data, step };
}

export async function run<T>(options: {
  graphName: string;
  query: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any>;
  traceCtx?: TraceContext;
}): Promise<QueryResult<T>> {
  const { graphName, query, params, traceCtx } = options;
  const start = performance.now();
  const graph = await getGraph(graphName);
  const reply = await graph.query<T>(query, params ? { params } : undefined);
  const data = (reply.data ?? []) as T[];

  const elapsed = Math.round((performance.now() - start) * 100) / 100;
  let step: TraceStepType | undefined;

  if (traceCtx) {
    step = {
      agent: traceCtx.agent,
      tool: traceCtx.tool,
      queryId: traceCtx.queryId,
      args: (params ?? {}) as Record<string, unknown>,
      rows: data.length,
      ms: elapsed,
    };
  }

  return { data, step };
}
