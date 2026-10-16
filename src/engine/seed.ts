import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CaseSchema, type CaseType } from './schema';
import { getGraph, graphExists, deleteGraph, ro, run } from './db';
import {
  Q10_seed_rooms,
  Q11_seed_edges,
  Q12_seed_people,
  Q13_seed_presence,
  Q13b_seed_slots,
  Q14_seed_claims,
  Q15_seed_evidence,
  Q16_seed_asserts,
  Q17_seed_relations,
  Q18a_seed_facts,
  Q18b_seed_baits,
  Q19_seed_case,
  Q03_node_count,
} from './queries';

export function expectedTruthNodeCount(c: CaseType): number {
  const people = new Set(c.people.map((p) => p.id));
  const extraEntities = new Set<string>();
  for (const r of c.relations) {
    if (!people.has(r.from)) extraEntities.add(r.from);
    if (!people.has(r.to)) extraEntities.add(r.to);
  }
  const asserts = c.evidence.flatMap((e) => e.asserts ?? []);
  return (
    1 + // (:Case)
    c.rooms.length +
    c.people.length +
    extraEntities.size +
    c.claims.length +
    c.evidence.length +
    asserts.length +
    c.facts.length +
    c.baits.length
  );
}

export function expectedPublicNodeCount(c: CaseType): number {
  return c.rooms.length + c.people.length + 8; // 8 slots
}

export async function seedTruthCase(c: CaseType): Promise<void> {
  const graphName = `truth:${c.id}`;
  await deleteGraph(graphName);

  // Q10: Rooms
  await run({
    graphName,
    query: Q10_seed_rooms,
    params: { rooms: c.rooms },
    traceCtx: { agent: 'engine', tool: 'seed', queryId: 'Q10_seed_rooms' },
  });

  // Q11: Edges
  await run({
    graphName,
    query: Q11_seed_edges,
    params: {
      edges: c.edges.map((e) => ({
        a: e.a,
        b: e.b,
        state: e.state,
        discoveredBy: e.discoveredBy ?? '',
      })),
    },
    traceCtx: { agent: 'engine', tool: 'seed', queryId: 'Q11_seed_edges' },
  });

  // Q12: People
  await run({
    graphName,
    query: Q12_seed_people,
    params: {
      people: c.people.map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        persona: p.persona ?? '',
        victim: p.victim ?? false,
      })),
    },
    traceCtx: { agent: 'engine', tool: 'seed', queryId: 'Q12_seed_people' },
  });

  // Q13: Presence
  const presence = Object.entries(c.truth.presence).flatMap(([person, rooms]) =>
    rooms.map((room, idx) => ({ person, slot: idx + 1, room }))
  );
  await run({
    graphName,
    query: Q13_seed_presence,
    params: { presence },
    traceCtx: { agent: 'engine', tool: 'seed', queryId: 'Q13_seed_presence' },
  });

  // Q14: Claims
  await run({
    graphName,
    query: Q14_seed_claims,
    params: {
      claims: c.claims.map((cl) => ({
        id: cl.id,
        by: cl.by,
        kind: cl.kind,
        subject: cl.subject ?? '',
        slot: cl.slot ?? 0,
        room: cl.room ?? '',
        detail: cl.detail ?? '',
        relationId: cl.relation ?? '',
        truth: typeof cl.truth === 'boolean' ? cl.truth : false,
        topics: cl.topics,
        requires: cl.requires ?? [],
        priority: cl.priority ?? 99,
        text: cl.text,
      })),
    },
    traceCtx: { agent: 'engine', tool: 'seed', queryId: 'Q14_seed_claims' },
  });

  // Q15: Evidence
  await run({
    graphName,
    query: Q15_seed_evidence,
    params: {
      evidence: c.evidence.map((e) => ({
        id: e.id,
        room: e.room,
        title: e.title,
        text: e.text,
        window: e.window ?? [],
        windowKind: e.windowKind ?? '',
        revealsEdge: e.revealsEdge ?? '',
        knowers: e.knowers ?? [],
        actSlot: e.act?.slot ?? 0,
        actRoom: e.act?.room ?? '',
        actRestrictsTo: e.act?.restrictsTo ?? [],
        relationId: e.relation ?? '',
      })),
    },
    traceCtx: { agent: 'engine', tool: 'seed', queryId: 'Q15_seed_evidence' },
  });

  // Q16: Asserts
  const asserts = c.evidence.flatMap((e) =>
    (e.asserts ?? []).map((a) => ({
      evidence: e.id,
      subject: a.subject,
      slot: a.slot,
      room: a.room,
    }))
  );
  if (asserts.length > 0) {
    await run({
      graphName,
      query: Q16_seed_asserts,
      params: { asserts },
      traceCtx: { agent: 'engine', tool: 'seed', queryId: 'Q16_seed_asserts' },
    });
  }

  // Q17: Relations
  if (c.relations.length > 0) {
    await run({
      graphName,
      query: Q17_seed_relations,
      params: { relations: c.relations },
      traceCtx: { agent: 'engine', tool: 'seed', queryId: 'Q17_seed_relations' },
    });
  }

  // Q18a: Facts
  if (c.facts.length > 0) {
    await run({
      graphName,
      query: Q18a_seed_facts,
      params: { facts: c.facts },
      traceCtx: { agent: 'engine', tool: 'seed', queryId: 'Q18a_seed_facts' },
    });
  }

  // Q18b: Baits
  if (c.baits.length > 0) {
    await run({
      graphName,
      query: Q18b_seed_baits,
      params: { baits: c.baits },
      traceCtx: { agent: 'engine', tool: 'seed', queryId: 'Q18b_seed_baits' },
    });
  }

  // Q19: Case
  await run({
    graphName,
    query: Q19_seed_case,
    params: {
      id: c.id,
      level: c.level,
      title: c.title,
      scene: c.truth.murder.room,
      solutionJson: JSON.stringify(c.solution),
    },
    traceCtx: { agent: 'engine', tool: 'seed', queryId: 'Q19_seed_case' },
  });
}

export async function seedPublicCase(c: CaseType): Promise<void> {
  const graphName = `public:${c.id}`;
  await deleteGraph(graphName);

  // Q10: Rooms
  await run({
    graphName,
    query: Q10_seed_rooms,
    params: { rooms: c.rooms },
    traceCtx: { agent: 'engine', tool: 'seed', queryId: 'Q10_seed_rooms' },
  });

  // Q11: Only open/locked edges
  const publicEdges = c.edges.filter((e) => e.state === 'open' || e.state === 'locked');
  await run({
    graphName,
    query: Q11_seed_edges,
    params: {
      edges: publicEdges.map((e) => ({
        a: e.a,
        b: e.b,
        state: e.state,
        discoveredBy: '',
      })),
    },
    traceCtx: { agent: 'engine', tool: 'seed', queryId: 'Q11_seed_edges' },
  });

  // Q12: People
  await run({
    graphName,
    query: Q12_seed_people,
    params: {
      people: c.people.map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        persona: p.persona ?? '',
        victim: p.victim ?? false,
      })),
    },
    traceCtx: { agent: 'engine', tool: 'seed', queryId: 'Q12_seed_people' },
  });

  // Q13b: Slots
  const slots = c.slots.map((label, idx) => ({ n: idx + 1, label }));
  await run({
    graphName,
    query: Q13b_seed_slots,
    params: { slots },
    traceCtx: { agent: 'engine', tool: 'seed', queryId: 'Q13b_seed_slots' },
  });

  // Range indexes on id for Person, Room, Claim, Evidence, Statement, Assertion
  const graph = await getGraph(graphName);
  for (const label of ['Person', 'Room', 'Claim', 'Evidence', 'Statement', 'Assertion']) {
    try {
      await graph.createNodeRangeIndex(label, 'id');
    } catch {
      // Index creation safe fallback
    }
  }
}

export async function ensureCases(options?: {
  force?: boolean;
  casesDir?: string;
}): Promise<{ seeded: string[]; skipped: string[] }> {
  const dir = options?.casesDir ?? join(process.cwd(), 'cases');
  const files = readdirSync(dir).filter(
    (f) => f.endsWith('.json') && !f.endsWith('.run.json')
  );

  const seeded: string[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    const raw = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    const caseData = CaseSchema.parse(raw);
    const truthGraph = `truth:${caseData.id}`;
    const publicGraph = `public:${caseData.id}`;

    const truthExists = await graphExists(truthGraph);
    const publicExists = await graphExists(publicGraph);

    let needsSeed = !truthExists || !publicExists || (options?.force ?? false);

    if (!needsSeed) {
      // Verify node counts match (self-healing on corrupt/incomplete graph)
      const truthCountRes = await ro<{ count: number }>({
        graphName: truthGraph,
        query: Q03_node_count,
      });
      const publicCountRes = await ro<{ count: number }>({
        graphName: publicGraph,
        query: Q03_node_count,
      });

      const actualTruth = truthCountRes.data[0]?.count ?? 0;
      const actualPublic = publicCountRes.data[0]?.count ?? 0;

      if (
        actualTruth !== expectedTruthNodeCount(caseData) ||
        actualPublic !== expectedPublicNodeCount(caseData)
      ) {
        needsSeed = true;
      }
    }

    if (needsSeed) {
      await seedTruthCase(caseData);
      await seedPublicCase(caseData);
      seeded.push(caseData.id);
    } else {
      skipped.push(caseData.id);
    }
  }

  return { seeded, skipped };
}
