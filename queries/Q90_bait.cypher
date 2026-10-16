-- Q90: Query bait text and knownBy facts from truth graph
MATCH (b:Bait {id: $bait})-[:ABOUT]->(f:Fact)
RETURN b.slip AS slip, b.neutral AS neutral, f.knownBy AS knownBy
