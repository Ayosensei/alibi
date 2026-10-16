// Pairs of conflicting assertions about the same person and slot in different rooms
MATCH (a:Assertion), (b:Assertion) WHERE a.subject = b.subject AND a.slot = b.slot AND a.room <> b.room AND a.src < b.src RETURN a.src AS srcA, a.hard AS hardA, b.src AS srcB, b.hard AS hardB, a.subject AS subject, a.slot AS slot, a.room AS roomA, b.room AS roomB
