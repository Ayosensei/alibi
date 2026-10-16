-- Q91: Count baits used so far on the player board
MATCH (u:BaitUsed)
RETURN count(u) AS used
