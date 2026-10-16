// Q41 to Q59, Q64, Q66, Q72, Q84: Board writes, search, map, and getBoard queries

// Q41: Retrieve all claim IDs that have already been made into statements
export const Q41_asked_claims = `MATCH (s:Statement) RETURN s.claimId AS id`;

// Q42: Retrieve all evidence IDs found by the player so far
export const Q42_found_evidence = `MATCH (e:Evidence) RETURN e.id AS id`;

// Q43: Record a suspect statement on the player's evidence board
export const Q43_add_statement = `CREATE (s:Statement {id: $sid, claimId: $cid, by: $by, kind: $kind, subject: $subject, slot: $slot, room: $room, detail: $detail, text: $text, tick: $tick})`;

// Q44: Attach a soft assertion to a player board statement
export const Q44_add_assertion = `MATCH (s:Statement {id: $sid}) CREATE (s)-[:ASSERTS]->(:Assertion {id: $aid, src: $cid, subject: $subject, slot: $slot, room: $room, hard: false})`;

// Q45: Reveal a relationship edge between two parties on the player's board
export const Q45_reveal_relation = `MERGE (x:Party {id: $from}) MERGE (y:Party {id: $to}) MERGE (x)-[r:KNOWN_REL {id: $rid}]->(y) SET r.type = $type, r.text = $text`;

// Q50: Query truth evidence and its proven assertions located inside a specific room
export const Q50_evidence_in_room = `MATCH (e:Evidence {room: $room}) OPTIONAL MATCH (e)-[:ASSERTS]->(a:Assertion) RETURN e.id AS id, e.room AS room, e.title AS title, e.text AS text, e.window AS window, e.windowKind AS windowKind, e.revealsEdge AS revealsEdge, e.knowers AS knowers, e.actSlot AS actSlot, e.actRoom AS actRoom, e.actRestrictsTo AS actRestrictsTo, e.relationId AS relationId, [x IN collect(a) WHERE x IS NOT NULL | {subject: x.subject, slot: x.slot, room: x.room}] AS asserts`;

// Q51: Add discovered evidence item to the player's board graph
export const Q51_add_evidence = `CREATE (e:Evidence {id: $id, room: $room, title: $title, text: $text, window: $window, windowKind: $windowKind, actSlot: $actSlot, actRoom: $actRoom, actRestrictsTo: $actRestrictsTo, relationId: $relationId, revealsEdge: $revealsEdge, knowers: $knowers})`;

// Q52: Attach hard assertion proven by physical evidence to player board
export const Q52_add_ev_assertion = `MATCH (e:Evidence {id: $eid}) CREATE (e)-[:ASSERTS]->(:Assertion {id: $aid, src: $eid, subject: $subject, slot: $slot, room: $room, hard: true})`;

// Q53: Reveal hidden secret passage between two rooms on the player board
export const Q53_reveal_edge = `MATCH (a:Room {id: $a}), (b:Room {id: $b}) MERGE (a)-[h:HIDDEN_KNOWN]->(b) MERGE (b)-[h2:HIDDEN_KNOWN]->(a) SET h.knowers = $knowers, h2.knowers = $knowers`;

// Q54: Update list of people who know of the hidden passage
export const Q54_set_knowers = `MATCH (:Room)-[h:HIDDEN_KNOWN]->(:Room) SET h.knowers = $knowers`;

// Q55: Record that a room was searched at a specific game tick
export const Q55_log_search = `CREATE (:SearchLog {room: $room, tick: $tick})`;

// Q56: Clear all previously inferred assertions before re-running elimination
export const Q56_clear_inferred = `MATCH (a:Assertion) WHERE a.src STARTS WITH 'inferred:' DELETE a`;

// Q57: Add single-survivor inferred hard assertion to player board
export const Q57_add_inferred = `CREATE (:Assertion {id: $id, src: $src, subject: $subject, slot: $slot, room: $room, hard: true})`;

// Q58: Retrieve list of all rooms searched by the player
export const Q58_searched_rooms = `MATCH (s:SearchLog) RETURN collect(s.room) AS rooms`;

// Q59: Check if a specific room has already been searched
export const Q59_is_room_searched = `MATCH (s:SearchLog {room: $room}) RETURN count(s) AS count`;

// Q64: Query map room connections and discovered hidden edges
export const Q64_map_edges = `MATCH (a:Room)-[r:CONNECTS|HIDDEN_KNOWN]->(b:Room) RETURN a.id AS a, b.id AS b, type(r) AS t, r.state AS state, r.knowers AS knowers`;

// Q66: Query all hard assertions known on the board for a person
export const Q66_hard_anchors = `MATCH (a:Assertion {subject: $person, hard: true}) RETURN a.src AS src, a.slot AS slot, a.room AS room`;

// Q66b: Query all hard assertions on the board across all people
export const Q66b_all_hard_anchors = `MATCH (a:Assertion {hard: true}) RETURN a.src AS src, a.subject AS subject, a.slot AS slot, a.room AS room`;

// Q67: Count usable open connections from a room
export const Q67_room_degree = `MATCH (r:Room {id: $room})-[x:CONNECTS|HIDDEN_KNOWN]-() WHERE x.state = 'open' OR type(x) = 'HIDDEN_KNOWN' RETURN count(x) AS usable`;

// Q68: Query act requirements for an evidence item
export const Q68_evidence_act = `MATCH (e:Evidence {id: $eid}) RETURN e.actSlot AS slot, e.actRoom AS room, e.actRestrictsTo AS candidates`;

// Q72: Find all found evidence with murder window clues
export const Q72_window = `MATCH (e:Evidence) WHERE size(e.window) > 0 RETURN e.id AS id, e.window AS window, e.windowKind AS kind`;

// Q84a: Get all statements for getBoard
export const Q84a_get_statements = `MATCH (s:Statement) RETURN s.id AS id, s.claimId AS claimId, s.by AS by, s.kind AS kind, s.subject AS subject, s.slot AS slot, s.room AS room, s.text AS text, s.tick AS tick ORDER BY s.tick`;

// Q84b: Get all evidence for getBoard
export const Q84b_get_evidence = `MATCH (e:Evidence) RETURN e.id AS id, e.room AS room, e.title AS title, e.text AS text ORDER BY e.id`;

// Q84c: Get all flags for getBoard
export const Q84c_get_flags = `MATCH (f:Flag) RETURN f.id AS id, f.kind AS kind, f.refs AS refs, f.note AS note, f.by AS by ORDER BY f.id`;

// Q84d: Get all hypotheses for getBoard
export const Q84d_get_hypotheses = `MATCH (h:Hypothesis) RETURN h.id AS id, h.text AS text, h.person AS person, h.confidence AS confidence, h.by AS by ORDER BY h.id`;

// Q84e: Get all known relations for getBoard
export const Q84e_get_relations = `MATCH (x:Party)-[r:KNOWN_REL]->(y:Party) RETURN r.id AS id, x.id AS from, y.id AS to, r.type AS type, r.text AS text ORDER BY r.id`;

// Q84f: Check if hidden passage is known
export const Q84f_hidden_edge_known = `MATCH (:Room)-[h:HIDDEN_KNOWN]->(:Room) RETURN count(h) > 0 AS known`;

// Q84g: Count baits used
export const Q84g_baits_used = `MATCH (u:BaitUsed) RETURN count(u) AS count`;
