-- Q95: Fetch solution JSON stored in the case node
MATCH (c:Case {id: $case})
RETURN c.solutionJson AS solutionJson
