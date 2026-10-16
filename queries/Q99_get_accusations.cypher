-- Q99: Retrieve all accusations made by the player in this session
MATCH (a:Accusation)
RETURN a.id AS id, a.persons AS persons, a.result AS result, a.wrong AS wrong, a.tick AS tick
ORDER BY a.tick
