// Query all hard assertions known on the board for a person
MATCH (a:Assertion {subject: $person, hard: true}) RETURN a.src AS src, a.slot AS slot, a.room AS room
