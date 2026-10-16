// Rehearsed alibis sharing identical slot, room, and detail across different suspects
MATCH (s:Statement) WHERE s.kind = 'location' AND s.detail <> '' WITH s.slot AS slot, s.room AS room, s.detail AS detail, collect(DISTINCT s.by) AS people, collect(s.claimId) AS claimIds WHERE size(people) >= 2 RETURN slot, room, detail, people, claimIds
