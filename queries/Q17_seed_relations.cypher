// Seed relationship graph edges between people or entities
UNWIND $relations AS r MERGE (x:Party {id: r.from}) MERGE (y:Party {id: r.to}) CREATE (x)-[:REL {id: r.id, type: r.type, text: r.text}]->(y)
