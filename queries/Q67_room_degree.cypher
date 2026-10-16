// Count usable open connections from a room
MATCH (r:Room {id: $room})-[x:CONNECTS|HIDDEN_KNOWN]-() WHERE x.state = 'open' OR type(x) = 'HIDDEN_KNOWN' RETURN count(x) AS usable
