// Seed bait options linking to their corresponding truth facts
UNWIND $baits AS b MATCH (f:Fact {id: b.fact}) CREATE (:Bait {id: b.id, announcement: b.announcement, slip: b.slip, neutral: b.neutral})-[:ABOUT]->(f)
