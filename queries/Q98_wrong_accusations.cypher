-- Q98: Count wrong accusations on the player board
MATCH (a:Accusation {wrong: true})
RETURN count(a) AS count
