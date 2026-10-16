import { describe, it, expect, afterAll } from 'vitest';
import { run, ro, closeDb, deleteGraph, graphExists, listGraphs, copyGraph } from '@/engine/db';

describe('db.ts FalkorDB data layer', () => {
  const testGraph = 'test_db_layer';
  const copyDest = 'test_db_layer_copy';

  afterAll(async () => {
    await deleteGraph(testGraph);
    await deleteGraph(copyDest);
    await closeDb();
  });

  it('handles read-only queries on non-existent graph gracefully', async () => {
    await deleteGraph(testGraph);
    const res = await ro<{ id: string }>({
      graphName: testGraph,
      query: 'MATCH (n:NoSuchNode) RETURN n.id AS id',
      traceCtx: { agent: 'engine', tool: 'testTool', queryId: 'Q_test' },
    });
    expect(res.data).toEqual([]);
    expect(res.step).toBeDefined();
    expect(res.step?.rows).toBe(0);
    expect(res.step?.agent).toBe('engine');
    expect(res.step?.tool).toBe('testTool');
  });

  it('runs write query and records TraceStep', async () => {
    const res = await run<{ id: string }>({
      graphName: testGraph,
      query: 'CREATE (n:Person {id: $id, name: $name}) RETURN n.id AS id',
      params: { id: 'p1', name: 'Holmes' },
      traceCtx: { agent: 'inspector', tool: 'writePerson', queryId: 'Q_write' },
    });
    expect(res.data).toEqual([{ id: 'p1' }]);
    expect(res.step).toBeDefined();
    expect(res.step?.rows).toBe(1);
    expect(res.step?.agent).toBe('inspector');
    expect(res.step?.args).toEqual({ id: 'p1', name: 'Holmes' });
  });

  it('runs roQuery on existing graph', async () => {
    const res = await ro<{ id: string; name: string }>({
      graphName: testGraph,
      query: 'MATCH (n:Person {id: $id}) RETURN n.id AS id, n.name AS name',
      params: { id: 'p1' },
      traceCtx: { agent: 'engine', tool: 'readPerson', queryId: 'Q_read' },
    });
    expect(res.data).toEqual([{ id: 'p1', name: 'Holmes' }]);
    expect(res.step?.rows).toBe(1);
  });

  it('checks graph existence and lists graphs', async () => {
    const exists = await graphExists(testGraph);
    expect(exists).toBe(true);

    const list = await listGraphs();
    expect(list).toContain(testGraph);
  });

  it('copies graph with copyGraph and deletes with deleteGraph', async () => {
    await copyGraph(testGraph, copyDest);
    const copiedExists = await graphExists(copyDest);
    expect(copiedExists).toBe(true);

    const res = await ro<{ name: string }>({
      graphName: copyDest,
      query: 'MATCH (n:Person {id: "p1"}) RETURN n.name AS name',
    });
    expect(res.data).toEqual([{ name: 'Holmes' }]);

    const deleted = await deleteGraph(copyDest);
    expect(deleted).toBe(true);
    expect(await graphExists(copyDest)).toBe(false);
  });
});
