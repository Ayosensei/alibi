// Attach a soft assertion to a player board statement
MATCH (s:Statement {id: $sid}) CREATE (s)-[:ASSERTS]->(:Assertion {id: $aid, src: $cid, subject: $subject, slot: $slot, room: $room, hard: false})
