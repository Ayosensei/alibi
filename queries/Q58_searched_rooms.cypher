// Retrieve list of all rooms searched by the player
MATCH (s:SearchLog) RETURN collect(s.room) AS rooms
