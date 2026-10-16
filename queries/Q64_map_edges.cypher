// Query map room connections and discovered hidden edges
MATCH (a:Room)-[r:CONNECTS|HIDDEN_KNOWN]->(b:Room) RETURN a.id AS a, b.id AS b, type(r) AS t, r.state AS state, r.knowers AS knowers
