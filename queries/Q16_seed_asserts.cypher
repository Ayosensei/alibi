// Attach hard assertions proven by physical evidence items
UNWIND $asserts AS a MATCH (ev:Evidence {id: a.evidence}) CREATE (ev)-[:ASSERTS]->(:Assertion {subject: a.subject, slot: a.slot, room: a.room})
