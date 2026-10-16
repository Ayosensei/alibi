// Q90 to Q92: Bait queries

// Q90: Query bait text and knownBy facts from truth graph
export const Q90_bait = `MATCH (b:Bait {id: $bait})-[:ABOUT]->(f:Fact) RETURN b.slip AS slip, b.neutral AS neutral, f.knownBy AS knownBy`;

// Q91: Count baits used so far on the player board
export const Q91_baits_left = `MATCH (u:BaitUsed) RETURN count(u) AS used`;

// Q92: Record that a bait was used on the player board
export const Q92_bait_used = `CREATE (:BaitUsed {id: $id, baitId: $bait, outcome: $outcome, reactors: $reactors, tick: $tick})`;
