import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ensureCases, expectedTruthNodeCount, expectedPublicNodeCount } from '@/engine/seed';
import { CaseSchema } from '@/engine/schema';
import { ro, run, getGraph, closeDb, deleteGraph } from '@/engine/db';
import { Q03_node_count } from '@/engine/queries';

describe('seed.ts — ensureCases()', () => {
  const casesDir = join(process.cwd(), 'cases');
  const files = readdirSync(casesDir).filter(
    (f) => f.endsWith('.json') && !f.endsWith('.run.json')
  );

  beforeAll(async () => {
    // Clean any previous test graphs for our cases
    for (const f of files) {
      const raw = JSON.parse(readFileSync(join(casesDir, f), 'utf8'));
      await deleteGraph(`truth:${raw.id}`);
      await deleteGraph(`public:${raw.id}`);
    }
  });

  afterAll(async () => {
    await closeDb();
  });

  it('seeds all cases on first run', async () => {
    const result = await ensureCases({ casesDir });
    expect(result.seeded.length).toBe(files.length);
    expect(result.skipped.length).toBe(0);

    for (const f of files) {
      const raw = JSON.parse(readFileSync(join(casesDir, f), 'utf8'));
      const caseData = CaseSchema.parse(raw);

      // Verify node counts match case files
      const truthRes = await ro<{ count: number }>({
        graphName: `truth:${caseData.id}`,
        query: Q03_node_count,
      });
      const publicRes = await ro<{ count: number }>({
        graphName: `public:${caseData.id}`,
        query: Q03_node_count,
      });

      expect(truthRes.data[0]?.count).toBe(expectedTruthNodeCount(caseData));
      expect(publicRes.data[0]?.count).toBe(expectedPublicNodeCount(caseData));
    }
  });

  it('is a no-op on second run (idempotent)', async () => {
    const secondRun = await ensureCases({ casesDir });
    expect(secondRun.seeded.length).toBe(0);
    expect(secondRun.skipped.length).toBe(files.length);
  });

  it('self-heals if a graph has a node count mismatch', async () => {
    const raw = JSON.parse(readFileSync(join(casesDir, files[0]), 'utf8'));
    const caseData = CaseSchema.parse(raw);
    const truthGraph = `truth:${caseData.id}`;

    // Delete one node from truth graph to corrupt count
    await run({
      graphName: truthGraph,
      query: 'MATCH (c:Claim) WITH c LIMIT 1 DELETE c',
    });

    const corruptedRes = await ro<{ count: number }>({
      graphName: truthGraph,
      query: Q03_node_count,
    });
    expect(corruptedRes.data[0]?.count).toBe(expectedTruthNodeCount(caseData) - 1);

    // ensureCases should detect count mismatch and re-seed
    const healRun = await ensureCases({ casesDir });
    expect(healRun.seeded).toContain(caseData.id);

    // Verify it is fully healed
    const healedRes = await ro<{ count: number }>({
      graphName: truthGraph,
      query: Q03_node_count,
    });
    expect(healedRes.data[0]?.count).toBe(expectedTruthNodeCount(caseData));
  });

  it('preserves range indexes in public graph', async () => {
    const raw = JSON.parse(readFileSync(join(casesDir, files[0]), 'utf8'));
    const caseData = CaseSchema.parse(raw);
    const publicGraph = await getGraph(`public:${caseData.id}`);

    const explain = await publicGraph.explain('MATCH (p:Person {id: "some_id"}) RETURN p');
    const explainStr = JSON.stringify(explain);
    expect(explainStr).toContain('Node By Index Scan');
  });
});
