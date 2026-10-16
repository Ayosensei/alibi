// Record ground-truth presence of people in rooms across all 8 time slots
UNWIND $presence AS x MATCH (p:Person {id: x.person}), (r:Room {id: x.room}) CREATE (p)-[:PRESENT_IN {slot: x.slot}]->(r)
