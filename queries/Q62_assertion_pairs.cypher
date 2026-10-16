// Chronologically ordered pairs of assertions for a person to check travel feasibility
MATCH (a:Assertion), (b:Assertion) WHERE a.subject = b.subject AND a.slot < b.slot AND a.src <> b.src RETURN a.src AS fromSrc, a.subject AS person, a.slot AS slotA, a.room AS roomA, b.src AS toSrc, b.slot AS slotB, b.room AS roomB
