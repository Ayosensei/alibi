// Advance and return the player's turn/tick count
MATCH (p:Player {id: $pid}) SET p.tick = p.tick + 1 RETURN p.tick AS tick
