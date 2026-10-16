// Reveal hidden secret passage between two rooms on the player board
MATCH (a:Room {id: $a}), (b:Room {id: $b}) MERGE (a)-[h:HIDDEN_KNOWN]->(b) MERGE (b)-[h2:HIDDEN_KNOWN]->(a) SET h.knowers = $knowers, h2.knowers = $knowers
