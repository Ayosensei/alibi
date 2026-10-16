// Upsert case completion stars and accusations into the player's cross-level graph
MERGE (pl:Player {id: $pid}) MERGE (c:Case {id: $case}) MERGE (pl)-[r:PLAYED]->(c) SET r.stars = $stars, r.accusations = $acc, r.completedAt = $at
