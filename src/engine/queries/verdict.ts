// Q95 to Q99: Verdict and solution queries

// Q95: Fetch solution JSON stored in the case node
export const Q95_solution = `MATCH (c:Case {id: $case}) RETURN c.solutionJson AS solutionJson`;

// Q96: Fetch truth presence of all people across slots for replay after level is over
export const Q96_truth_view = `MATCH (p:Person)-[r:PRESENT_IN]->(rm:Room) RETURN p.id AS person, r.slot AS slot, rm.id AS room`;

// Q97: Record an accusation attempt on the player board
export const Q97_record_accusation = `CREATE (:Accusation {id: $id, persons: $persons, result: $result, wrong: $wrong, tick: $tick})`;

// Q98: Count wrong accusations on the player board
export const Q98_wrong_accusations = `MATCH (a:Accusation {wrong: true}) RETURN count(a) AS count`;

// Q99: Retrieve all accusations made by the player in this session
export const Q99_get_accusations = `MATCH (a:Accusation) RETURN a.id AS id, a.persons AS persons, a.result AS result, a.wrong AS wrong, a.tick AS tick ORDER BY a.tick`;
