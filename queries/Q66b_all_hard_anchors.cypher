// Query all hard assertions on the board across all people
MATCH (a:Assertion {hard: true}) RETURN a.src AS src, a.subject AS subject, a.slot AS slot, a.room AS room
