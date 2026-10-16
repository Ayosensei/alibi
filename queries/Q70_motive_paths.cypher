// Up to 3 shortest known relationship paths from a person to the murder victim
MATCH p = (a:Party {id: $person})-[:KNOWN_REL*1..3]-(v:Person {victim: true}) RETURN [r IN relationships(p) | { relationId: r.id, type: r.type, text: r.text }] AS hops, length(p) AS len ORDER BY len LIMIT 3
