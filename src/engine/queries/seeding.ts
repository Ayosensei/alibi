// Q10 to Q19: Seeding queries for truth:{caseId} and public:{caseId}

// Q10: Seed all room nodes in the case map
export const Q10_seed_rooms = `UNWIND $rooms AS r CREATE (:Room {id: r.id, name: r.name})`;

// Q11: Connect adjacent rooms with directional edges carrying state and discoverer
export const Q11_seed_edges = `UNWIND $edges AS e MATCH (a:Room {id: e.a}), (b:Room {id: e.b}) CREATE (a)-[:CONNECTS {state: e.state, discoveredBy: e.discoveredBy}]->(b)`;

// Q12: Seed suspect and victim person nodes with both Person and Party labels
export const Q12_seed_people = `UNWIND $people AS p CREATE (:Person:Party {id: p.id, name: p.name, role: p.role, persona: p.persona, victim: p.victim})`;

// Q13: Record ground-truth presence of people in rooms across all 8 time slots
export const Q13_seed_presence = `UNWIND $presence AS x MATCH (p:Person {id: x.person}), (r:Room {id: x.room}) CREATE (p)-[:PRESENT_IN {slot: x.slot}]->(r)`;

// Q13b: Seed slot nodes with time labels for public board inspection
export const Q13b_seed_slots = `UNWIND $slots AS s CREATE (:Slot {n: s.n, label: s.label})`;

// Q14: Seed authored suspect claims with conditions, topics, truth value and metadata
export const Q14_seed_claims = `UNWIND $claims AS c CREATE (:Claim {id: c.id, by: c.by, kind: c.kind, subject: c.subject, slot: c.slot, room: c.room, detail: c.detail, relationId: c.relationId, truth: c.truth, topics: c.topics, requires: c.requires, priority: c.priority, text: c.text})`;

// Q15: Seed physical evidence items discovered in rooms with act and window properties
export const Q15_seed_evidence = `UNWIND $evidence AS e CREATE (ev:Evidence {id: e.id, room: e.room, title: e.title, text: e.text, window: e.window, windowKind: e.windowKind, revealsEdge: e.revealsEdge, knowers: e.knowers, actSlot: e.actSlot, actRoom: e.actRoom, actRestrictsTo: e.actRestrictsTo, relationId: e.relationId})`;

// Q16: Attach hard assertions proven by physical evidence items
export const Q16_seed_asserts = `UNWIND $asserts AS a MATCH (ev:Evidence {id: a.evidence}) CREATE (ev)-[:ASSERTS]->(:Assertion {subject: a.subject, slot: a.slot, room: a.room})`;

// Q17: Seed relationship graph edges between people or entities
export const Q17_seed_relations = `UNWIND $relations AS r MERGE (x:Party {id: r.from}) MERGE (y:Party {id: r.to}) CREATE (x)-[:REL {id: r.id, type: r.type, text: r.text}]->(y)`;

// Q18a: Seed background case facts and who knows them for bait evaluation
export const Q18a_seed_facts = `UNWIND $facts AS f CREATE (:Fact {id: f.id, text: f.text, knownBy: f.knownBy})`;

// Q18b: Seed bait options linking to their corresponding truth facts
export const Q18b_seed_baits = `UNWIND $baits AS b MATCH (f:Fact {id: b.fact}) CREATE (:Bait {id: b.id, announcement: b.announcement, slip: b.slip, neutral: b.neutral})-[:ABOUT]->(f)`;

// Q19: Seed case metadata, crime scene, and serialized solution in the truth graph
export const Q19_seed_case = `CREATE (:Case {id: $id, level: $level, title: $title, crimeScene: $scene, solutionJson: $solutionJson})`;

// Q03: Return total count of all nodes in a graph
export const Q03_node_count = `MATCH (n) RETURN count(n) AS count`;
