// Reveal a relationship edge between two parties on the player's board
MERGE (x:Party {id: $from}) MERGE (y:Party {id: $to}) MERGE (x)-[r:KNOWN_REL {id: $rid}]->(y) SET r.type = $type, r.text = $text
