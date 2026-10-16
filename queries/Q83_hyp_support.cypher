// Link a hypothesis to its supporting evidence, flags, or statements
MATCH (h:Hypothesis {id: $id}), (x) WHERE x.id IN $refs AND (x:Flag OR x:Statement OR x:Evidence) CREATE (h)-[:SUPPORTED_BY]->(x)
