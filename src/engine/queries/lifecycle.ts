// Q20 to Q24: Lifecycle and progress queries for play and player graphs

// Q20: Initialize the player tenant node inside the copied play graph
export const Q20_create_player = `CREATE (:Player {id: $pid, tick: 0, createdAt: $at})`;

// Q21: Get the current turn/tick count for this player's case
export const Q21_get_tick = `MATCH (p:Player {id: $pid}) RETURN p.tick AS tick`;

// Q22: Advance and return the player's turn/tick count
export const Q22_set_tick = `MATCH (p:Player {id: $pid}) SET p.tick = p.tick + 1 RETURN p.tick AS tick`;

// Q23: Upsert case completion stars and accusations into the player's cross-level graph
export const Q23_progress_upsert = `MERGE (pl:Player {id: $pid}) MERGE (c:Case {id: $case}) MERGE (pl)-[r:PLAYED]->(c) SET r.stars = $stars, r.accusations = $acc, r.completedAt = $at`;

// Q24: Retrieve all completed cases and scores for this anonymous player
export const Q24_get_progress = `MATCH (pl:Player {id: $pid})-[r:PLAYED]->(c:Case) RETURN c.id AS caseId, r.stars AS stars, r.accusations AS accusations, r.completedAt AS completedAt`;
