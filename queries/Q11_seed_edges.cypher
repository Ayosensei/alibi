// Connect adjacent rooms with directional edges carrying state and discoverer
UNWIND $edges AS e MATCH (a:Room {id: e.a}), (b:Room {id: e.b}) CREATE (a)-[:CONNECTS {state: e.state, discoveredBy: e.discoveredBy}]->(b)
