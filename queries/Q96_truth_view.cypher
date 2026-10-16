-- Q96: Fetch truth presence of all people across slots for replay after level is over
MATCH (p:Person)-[r:PRESENT_IN]->(rm:Room)
RETURN p.id AS person, r.slot AS slot, rm.id AS room
