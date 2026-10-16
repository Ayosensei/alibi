// Link a flag node to the statements, evidence, or people it references
MATCH (f:Flag {id: $id}), (x) WHERE x.id IN $refs AND (x:Statement OR x:Evidence OR x:Person) CREATE (f)-[:ABOUT]->(x)
