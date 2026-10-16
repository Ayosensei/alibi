// Q60, Q61, Q62: Reasoning queries for contradictions, rehearsed alibis, and impossible moves

// Q60: Pairs of conflicting assertions about the same person and slot in different rooms
export const Q60_contradictions = `MATCH (a:Assertion), (b:Assertion) WHERE a.subject = b.subject AND a.slot = b.slot AND a.room <> b.room AND a.src < b.src RETURN a.src AS srcA, a.hard AS hardA, b.src AS srcB, b.hard AS hardB, a.subject AS subject, a.slot AS slot, a.room AS roomA, b.room AS roomB`;

// Q61: Rehearsed alibis sharing identical slot, room, and detail across different suspects
export const Q61_rehearsed = `MATCH (s:Statement) WHERE s.kind = 'location' AND s.detail <> '' WITH s.slot AS slot, s.room AS room, s.detail AS detail, collect(DISTINCT s.by) AS people, collect(s.claimId) AS claimIds WHERE size(people) >= 2 RETURN slot, room, detail, people, claimIds`;

// Q62: Chronologically ordered pairs of assertions for a person to check travel feasibility
export const Q62_assertion_pairs = `MATCH (a:Assertion), (b:Assertion) WHERE a.subject = b.subject AND a.slot < b.slot AND a.src <> b.src RETURN a.src AS fromSrc, a.subject AS person, a.slot AS slotA, a.room AS roomA, b.src AS toSrc, b.slot AS slotB, b.room AS roomB`;
