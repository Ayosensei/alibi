// Q70, Q71, Q80-Q83: Motive paths, alibi support, and board annotations (flags & hypotheses)

// Q70: Up to 3 shortest known relationship paths from a person to the murder victim
export const Q70_motive_paths = `MATCH p = (a:Party {id: $person})-[:KNOWN_REL*1..3]-(v:Person {victim: true}) RETURN [r IN relationships(p) | { relationId: r.id, type: r.type, text: r.text }] AS hops, length(p) AS len ORDER BY len LIMIT 3`;

// Q71: Alibi support query checking location statements against witness saw statements and hard assertions
export const Q71_alibi_support = `MATCH (c:Statement {kind: 'location', by: $person, slot: $slot}) OPTIONAL MATCH (sup:Statement {kind: 'saw', subject: $person, slot: $slot, room: c.room}) OPTIONAL MATCH (h:Assertion {hard: true, subject: sup.by, slot: $slot}) WHERE h.room <> sup.room RETURN c.room AS claimed, sup.claimId AS claimId, sup.by AS supporter, count(h) > 0 AS contradicted`;

// Q80: Record an analytical flag on the player's evidence board
export const Q80_flag = `CREATE (f:Flag {id: $id, kind: $kind, refs: $refs, note: $note, by: $by})`;

// Q81: Link a flag node to the statements, evidence, or people it references
export const Q81_flag_about = `MATCH (f:Flag {id: $id}), (x) WHERE x.id IN $refs AND (x:Statement OR x:Evidence OR x:Person) CREATE (f)-[:ABOUT]->(x)`;

// Q82: Record an investigative hypothesis with confidence score on the player board
export const Q82_hypothesis = `CREATE (h:Hypothesis {id: $id, text: $text, person: $person, confidence: $confidence, by: $by})`;

// Q83: Link a hypothesis to its supporting evidence, flags, or statements
export const Q83_hyp_support = `MATCH (h:Hypothesis {id: $id}), (x) WHERE x.id IN $refs AND (x:Flag OR x:Statement OR x:Evidence) CREATE (h)-[:SUPPORTED_BY]->(x)`;
