// Check if a specific room has already been searched
MATCH (s:SearchLog {room: $room}) RETURN count(s) AS count
