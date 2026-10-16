// Get the current turn/tick count for this player's case
MATCH (p:Player {id: $pid}) RETURN p.tick AS tick
