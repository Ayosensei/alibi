// Retrieve all completed cases and scores for this anonymous player
MATCH (pl:Player {id: $pid})-[r:PLAYED]->(c:Case) RETURN c.id AS caseId, r.stars AS stars, r.accusations AS accusations, r.completedAt AS completedAt
