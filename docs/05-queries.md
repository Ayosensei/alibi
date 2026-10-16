# 05 — Queries

Every query the product depends on, with id, purpose and parameters. Mirror them in `queries/*.cypher` (one file per query, one comment line each) and list them in the README: the submission must show the queries and algorithms.

## Read first

- FalkorDB implements a **subset** of OpenCypher. Check https://docs.falkordb.com (Cypher support, Known limitations, Algorithms, Clients) and **test every query in FalkorDB Browser (port 3000) before coding it.** Record PASS/FAIL, working syntax and the fallback used in `docs/spike-results.md` (task A1).
- Constructs flagged **(verify)** are the riskiest. Each has a fallback that **must produce the same result as the oracle** (`scripts/reference-engine.mjs`). A fallback that reads graph data with simple Cypher and finishes in TypeScript is acceptable; a query that does not touch the graph is not.
- Always pass `$params`; never concatenate. Reads use `roQuery`. No map-valued properties (arrays of scalars and JSON strings only). Pass `''` for absent string properties and `[]` for absent arrays (never `null`).
- Reasoning tools query the **play graph only**. Truth queries live in `ask`, `search`, `bait`, `verdict`, `seed`.

## Graph operations

| Id | Operation |
| --- | --- |
| Q00_graph_list | `GRAPH.LIST` — does `truth:{case}`, `public:{case}`, `play:{pid}:{case}`, `player:{pid}` exist? |
| Q01_graph_copy | `GRAPH.COPY public:{case} play:{pid}:{case}` (raw command) |
| Q02_graph_delete | `GRAPH.DELETE play:{pid}:{case}` (reset) |

Create range indexes on `id` for Person, Room, Claim, Evidence, Statement, Assertion before copying (verify whether `GRAPH.COPY` carries indexes; if not, create them in `startPlay`).

## Seeding (`ensureCases()`, idempotent; truth and public graphs)

Use `UNWIND $rows AS r ... CREATE` (verify list-of-maps parameters; fallback: one small query per row).

```
Q10_seed_rooms      UNWIND $rooms AS r CREATE (:Room {id: r.id, name: r.name})
Q11_seed_edges      UNWIND $edges AS e MATCH (a:Room {id: e.a}), (b:Room {id: e.b})
                    CREATE (a)-[:CONNECTS {state: e.state, discoveredBy: e.discoveredBy}]->(b)
Q12_seed_people     UNWIND $people AS p CREATE (:Person:Party {id: p.id, name: p.name, role: p.role, persona: p.persona, victim: p.victim})
Q13_seed_presence   UNWIND $presence AS x MATCH (p:Person {id: x.person}), (r:Room {id: x.room}) CREATE (p)-[:PRESENT_IN {slot: x.slot}]->(r)
Q14_seed_claims     UNWIND $claims AS c CREATE (:Claim {id: c.id, by: c.by, kind: c.kind, subject: c.subject, slot: c.slot, room: c.room,
                      detail: c.detail, relationId: c.relationId, truth: c.truth, topics: c.topics, requires: c.requires, priority: c.priority, text: c.text})
Q15_seed_evidence   UNWIND $evidence AS e CREATE (ev:Evidence {id: e.id, room: e.room, title: e.title, text: e.text, window: e.window, windowKind: e.windowKind,
                      revealsEdge: e.revealsEdge, knowers: e.knowers, actSlot: e.actSlot, actRoom: e.actRoom, actRestrictsTo: e.actRestrictsTo, relationId: e.relationId})
Q16_seed_asserts    UNWIND $asserts AS a MATCH (ev:Evidence {id: a.evidence}) CREATE (ev)-[:ASSERTS]->(:Assertion {subject: a.subject, slot: a.slot, room: a.room})
Q17_seed_relations  UNWIND $relations AS r MERGE (x:Party {id: r.from}) MERGE (y:Party {id: r.to}) CREATE (x)-[:REL {id: r.id, type: r.type, text: r.text}]->(y)
Q18_seed_facts_baits UNWIND $facts AS f CREATE (:Fact {id: f.id, text: f.text, knownBy: f.knownBy})
                    UNWIND $baits AS b MATCH (f:Fact {id: b.fact}) CREATE (:Bait {id: b.id, announcement: b.announcement, slip: b.slip, neutral: b.neutral})-[:ABOUT]->(f)
Q19_seed_case       CREATE (:Case {id: $id, level: $level, title: $title, crimeScene: $scene, solutionJson: $solutionJson})
```
`public:{case}` receives only rooms, `open`/`locked` edges, people (id, name, role, victim), slots.

## Play lifecycle

```
Q20_create_player   CREATE (:Player {id: $pid, tick: 0, createdAt: $at})      -- inside the copied play graph
Q21_get_tick        MATCH (p:Player {id: $pid}) RETURN p.tick AS tick
Q22_set_tick        MATCH (p:Player {id: $pid}) SET p.tick = p.tick + 1 RETURN p.tick AS tick
Q23_progress_upsert MERGE (pl:Player {id: $pid}) MERGE (c:Case {id: $case}) MERGE (pl)-[r:PLAYED]->(c) SET r.stars = $stars, r.accusations = $acc, r.completedAt = $at   -- in player:{pid}
```

## Ask (truth read) and board writes (play write)

**Q40_select_claims** (truth): the next claims this suspect can make on this topic.
```
MATCH (c:Claim {by: $suspect})
WHERE $topic IN c.topics
  AND ($slot = 0 OR c.slot = $slot OR c.slot = 0)
  AND ($about = '' OR c.subject = $about OR c.kind IN ['relation', 'fact'])
  AND NOT c.id IN $askedClaimIds
  AND ALL(r IN c.requires WHERE r IN $foundEvidenceIds)
RETURN c ORDER BY c.priority, c.id LIMIT 2
```
(verify `NOT c.id IN list`, `ALL` over an array property; use `0` and `''` as "any" sentinels; seed `slot: 0` for claims without a slot. Fallback: `MATCH (c:Claim {by: $suspect}) RETURN c` and filter in TypeScript.)

```
Q41_asked_claims    MATCH (s:Statement) RETURN s.claimId AS id                      -- play
Q42_found_evidence  MATCH (e:Evidence) RETURN e.id AS id                            -- play
Q43_add_statement   CREATE (s:Statement {id: $sid, claimId: $cid, by: $by, kind: $kind, subject: $subject, slot: $slot, room: $room, detail: $detail, text: $text, tick: $tick})
Q44_add_assertion   MATCH (s:Statement {id: $sid}) CREATE (s)-[:ASSERTS]->(:Assertion {id: $aid, src: $cid, subject: $subject, slot: $slot, room: $room, hard: false})
Q45_reveal_relation MERGE (x:Party {id: $from}) MERGE (y:Party {id: $to}) MERGE (x)-[r:KNOWN_REL {id: $rid}]->(y) SET r.type = $type, r.text = $text
```
`Party` is a second label on Person and Entity nodes, so a variable-length traversal can cross persons and entities (e.g. `vale_firm`).

## Search (truth read, play write)

```
Q50_evidence_in_room  MATCH (e:Evidence {room: $room}) OPTIONAL MATCH (e)-[:ASSERTS]->(a:Assertion) RETURN e, collect(a) AS asserts            -- truth
Q51_add_evidence      CREATE (e:Evidence {id: $id, room: $room, title: $title, text: $text, window: $window, windowKind: $windowKind, actSlot: $actSlot, actRoom: $actRoom, actRestrictsTo: $actRestrictsTo})   -- play
Q52_add_ev_assertion  MATCH (e:Evidence {id: $eid}) CREATE (e)-[:ASSERTS]->(:Assertion {id: $aid, src: $eid, subject: $subject, slot: $slot, room: $room, hard: true})
Q53_reveal_edge       MATCH (a:Room {id: $a}), (b:Room {id: $b}) MERGE (a)-[h:HIDDEN_KNOWN]->(b) SET h.knowers = $knowers
Q54_set_knowers       MATCH (:Room)-[h:HIDDEN_KNOWN]->(:Room) SET h.knowers = $knowers
Q55_log_search        CREATE (:SearchLog {room: $room, tick: $tick})
Q56_clear_inferred    MATCH (a:Assertion) WHERE a.src STARTS WITH 'inferred:' DELETE a     -- before re-running elimination
Q57_add_inferred      CREATE (:Assertion {id: $id, src: $src, subject: $subject, slot: $slot, room: $room, hard: true})
```
After every evidence write: run Q56, then `eliminate` (tool logic in TypeScript calling `whoCouldHave` for each act evidence **in the order found**, writing Q57 on a single survivor).

## Reasoning tools (play graph only)

**Q60_contradictions**: pairs of assertions about the same person and slot in different rooms.
```
MATCH (a:Assertion), (b:Assertion)
WHERE a.subject = b.subject AND a.slot = b.slot AND a.room <> b.room AND a.src < b.src
RETURN a.src AS srcA, a.hard AS hardA, b.src AS srcB, b.hard AS hardB, a.subject AS subject, a.slot AS slot, a.room AS roomA, b.room AS roomB
```
(verify the string comparison `a.src < b.src`; fallback: drop it and dedupe in TypeScript.) Join srcs back to statements/evidence for text.

**Q61_rehearsed**: the same detail, slot and room claimed by different people.
```
MATCH (s:Statement) WHERE s.kind = 'location' AND s.detail <> ''
WITH s.slot AS slot, s.room AS room, s.detail AS detail, collect(DISTINCT s.by) AS people, collect(s.claimId) AS claimIds
WHERE size(people) >= 2
RETURN slot, room, detail, people, claimIds
```

**Q62_assertion_pairs** (for impossible moves): ordered pairs of assertions about one person.
```
MATCH (a:Assertion), (b:Assertion)
WHERE a.subject = b.subject AND a.slot < b.slot AND a.src <> b.src
RETURN a.src AS fromSrc, a.subject AS person, a.slot AS slotA, a.room AS roomA, b.src AS toSrc, b.slot AS slotB, b.room AS roomB
```
Then, for each distinct room pair, call Q63; flag the pair when `distance > slotB - slotA`.

**Q63_distance**: shortest path between two rooms on the usable map.
```
MATCH (a:Room {id: $from}), (b:Room {id: $to})
MATCH p = shortestPath((a)-[:CONNECTS|HIDDEN_KNOWN*..8]-(b))
WHERE ALL(r IN relationships(p) WHERE (type(r) = 'CONNECTS' AND r.state = 'open') OR (type(r) = 'HIDDEN_KNOWN' AND $useHidden))
RETURN length(p) AS d, [n IN nodes(p) | n.id] AS path
```
`$useHidden` is computed in TypeScript per person: hidden edge discovered **and** (`knowers` is empty or the person is in `knowers`). (verify: filtering inside `shortestPath`, multiple relationship types, `type(r)`. **Fallback:** `Q64_map_edges` returns the tiny map and a TypeScript BFS computes distance; the result must equal the oracle's `dist`.) Locked edges are never used on the board; the truth map treats them as passable.

```
Q64_map_edges        MATCH (a:Room)-[r:CONNECTS|HIDDEN_KNOWN]->(b:Room) RETURN a.id AS a, b.id AS b, type(r) AS t, r.state AS state, r.knowers AS knowers
Q66_hard_anchors     MATCH (a:Assertion {subject: $person, hard: true}) RETURN a.src AS src, a.slot AS slot, a.room AS room
Q67_room_degree      MATCH (r:Room {id: $room})-[x:CONNECTS|HIDDEN_KNOWN]-() WHERE x.state = 'open' OR type(x) = 'HIDDEN_KNOWN' RETURN count(x) AS usable
Q68_evidence_act     MATCH (e:Evidence {id: $eid}) RETURN e.actSlot AS slot, e.actRoom AS room, e.actRestrictsTo AS candidates
```
**checkFeasibility(person, slot, room)** = reachable (Q67 > 0 for this person's usable edges) AND for every hard anchor (Q66) `Q63(anchor.room, room) <= |slot - anchor.slot|`. Violations list the anchors and paths. **whoCouldHave(evidence)** = Q68 then checkFeasibility for each candidate; a single survivor yields an inferred anchor (Q57).

**Q70_motive_paths**: up to 3 shortest known relationship paths to the victim.
```
MATCH p = (a:Party {id: $person})-[:KNOWN_REL*1..3]-(v:Person {victim: true})
RETURN [r IN relationships(p) | r.id] AS relationIds, length(p) AS len
ORDER BY len LIMIT 3
```
(verify list comprehension over `relationships(p)`; fallback: BFS in TypeScript over `MATCH ()-[r:KNOWN_REL]->() RETURN ...`.)

**Q71_alibi_support**
```
MATCH (c:Statement {kind: 'location', by: $person, slot: $slot})
OPTIONAL MATCH (sup:Statement {kind: 'saw', subject: $person, slot: $slot, room: c.room})
OPTIONAL MATCH (h:Assertion {hard: true, subject: sup.by, slot: $slot}) WHERE h.room <> sup.room
RETURN c.room AS claimed, sup.claimId AS claimId, sup.by AS supporter, count(h) > 0 AS contradicted
```
(verify OPTIONAL MATCH referencing earlier variables; fallback: three simple queries joined in TypeScript.) A supporter is *reliable* when no hard assertion places them in a different room at that slot.

```
Q72_window     MATCH (e:Evidence) WHERE size(e.window) > 0 RETURN e.id AS id, e.window AS window, e.windowKind AS kind     -- 'revises' wins, else 'suggests', else the case's public window
Q80_flag       CREATE (f:Flag {id: $id, kind: $kind, refs: $refs, note: $note, by: $by})
Q81_flag_about MATCH (f:Flag {id: $id}), (x) WHERE x.id IN $refs AND (x:Statement OR x:Evidence OR x:Person) CREATE (f)-[:ABOUT]->(x)
Q82_hypothesis CREATE (h:Hypothesis {id: $id, text: $text, person: $person, confidence: $confidence, by: $by})
Q83_hyp_support MATCH (h:Hypothesis {id: $id}), (x) WHERE x.id IN $refs AND (x:Flag OR x:Statement OR x:Evidence) CREATE (h)-[:SUPPORTED_BY]->(x)
Q84_get_board  (several MATCH ... RETURN queries assembled into getBoard)
```

## Bait (truth read, play write)

```
Q90_bait        MATCH (b:Bait {id: $bait})-[:ABOUT]->(f:Fact) RETURN b.slip AS slip, b.neutral AS neutral, f.knownBy AS knownBy
Q91_baits_left  MATCH (u:BaitUsed) RETURN count(u) AS used                                  -- play; allowed = case.baitsAllowed
Q92_bait_used   CREATE (:BaitUsed {id: $id, baitId: $bait, outcome: $outcome, reactors: $reactors})
```
Outcome: `knownBy` size 1 -> `slip` (that person's `slip` text becomes a Statement flagged `slip`, plus a Flag); size > 1 -> `ambiguous` (neutral reactions for all; the reactors react in the same way, no discrimination); size 0 -> `nothing`.

## Verdict (truth read)

```
Q95_solution    MATCH (c:Case {id: $case}) RETURN c.solutionJson AS solutionJson
Q96_truth_view  MATCH (p:Person)-[r:PRESENT_IN]->(rm:Room) RETURN p.id AS person, r.slot AS slot, rm.id AS room     -- for the replay only, after the level is over
```
Proof items are checked **on the player's board** by calling the same reasoning functions the tools use, so "found" and "missed" are exactly what the player (or the Inspector) could have derived.

## Test checklist per query

- Runs against a real FalkorDB with the three cases loaded.
- Returns the documented columns; returns zero rows (not an error) when nothing matches.
- Reasoning queries equal the oracle on three boards: empty, partial (scripted), full.
- No query run by a reasoning tool references `truth:*`.
