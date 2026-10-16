// Attach hard assertion proven by physical evidence to player board
MATCH (e:Evidence {id: $eid}) CREATE (e)-[:ASSERTS]->(:Assertion {id: $aid, src: $eid, subject: $subject, slot: $slot, room: $room, hard: true})
