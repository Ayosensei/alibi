# 03 — Graph model and case format

## Time, map and movement rules (the whole reasoning model)

- Every case has **8 time slots** numbered 1 to 8 (labels in `slots`). A person is in exactly one room per slot (their `truth.presence` row).
- Moving between rooms costs **1 slot per edge**. Staying is free. So a person can be in room B at slot j after being in room A at slot i only if `distance(A, B) <= j - i` (j > i).
- Edges have a state: `open` (anyone), `locked` (blocked on the board map; the truth map treats it as passable earlier in the evening), `hidden` (unknown until a piece of evidence reveals it; then usable only by persons allowed to know it, if the evidence lists `knowers`).
- **Hard assertions** (anchors) come from evidence and from inferred eliminations. **Soft assertions** come from statements (claims). Feasibility (`checkFeasibility`) uses only hard anchors; contradiction and impossible-move detection use both.

## Case JSON (`cases/*.json`)

Authoritative example: `cases/l3-blackout-dinner.json`. Every field below is validated by `src/engine/schema.ts` (zod) and by `scripts/validate-cases.mjs`.

| Field | Meaning |
| --- | --- |
| `id, level, title, tagline, briefing, hints[], arcClue` | presentation; `hints` power the tutorial; `arcClue` is the Season 1 hook |
| `publicWindow` | murder slots known from the start (`[5]`); a level may override via evidence. The crime scene (`truth.murder.room`) is public: the body is found there |
| `baitsAllowed` | how many baits the player may use |
| `slots[8]` | time labels |
| `rooms[]`, `edges[]` | map; edge `{a, b, state, discoveredBy?}` |
| `people[]` | `{id, name, role, persona, victim?}` (persona is used in the suspect prompt) |
| `truth.murder` | `{slot, room, weapon, method}` |
| `truth.presence` | per person, an 8-element array of room ids |
| `truth.culprits`, `truth.motive` | guilty set (heads and hands); motive flags |
| `facts[]` | `{id, text, knownBy[]}`; knowledge for baits |
| `relations[]` | `{id, from, to, type, text}` public relationships, discovered through claims or evidence |
| `claims[]` | what suspects can say (below) |
| `evidence[]` | what rooms hold (below) |
| `baits[]` | `{id, announcement, fact, slip, neutral}` |
| `tells[]` | `{claim, text, reliable}` behavioural beats; some are red herrings |
| `solution` | `{culprits, windowFinal, proof, cleared, motive}` used by tests and the verdict |

**Claim:** `{id, by, kind, text, topics[], ...}`. `kind` is `location` (the speaker says where they were: `slot`, `room`, optional `detail`), `saw` (the speaker says they saw `subject` in `room` at `slot`), `relation` (reveals `relation`), or `fact` (a general statement with a boolean `truth`). Optional `requires: [evidenceIds]` (the claim only becomes available after those are found) and `priority` (lower first). The truth of `location`/`saw` claims is **derived** from `truth.presence`; `fact` and `relation` claims carry `truth`.

**Evidence:** `{id, room, title, text, ...}` with optional `asserts[{subject, slot, room}]` (hard anchors), `window` + `windowKind` (`suggests` or `revises` the murder window), `relation`, `revealsEdge`, `knowers[]`, and `act {slot, room, restrictsTo[]}` (an act that only some persons could have performed; elimination by feasibility narrows it; a single survivor becomes an inferred hard anchor).

**Authoring rules (enforced by the validator):** every false location/sighting claim must be exposed by something derivable (a contradiction, a rehearsed group, an impossible move or an inferred anchor); every non-culprit must be provably cleared on the full board; sharp baits (exactly one knower) must point at culprits; the final window equals the true murder slot; truth movement is feasible on the true map.

## Graph schema

### `truth:{caseId}` (hidden)

```
(:Case {id, level, title, crimeScene, solutionJson})
(:Person {id, name, role, persona, victim})
(:Room {id, name})  -[:CONNECTS {state, discoveredBy}]- (:Room)
(:Person)-[:PRESENT_IN {slot}]->(:Room)
(:Claim {id, by, kind, subject, slot, room, detail, relationId, truth, topics[], requires[], priority, text})
(:Evidence {id, room, title, text, window[], windowKind, revealsEdge, knowers[], actSlot, actRoom, actRestrictsTo[]})
(:Evidence)-[:ASSERTS]->(:Assertion {subject, slot, room})
(:Person|:Entity)-[:REL {id, type, text}]->(:Person|:Entity)
(:Fact {id, text, knownBy[]})   (:Bait {id, announcement, slip, neutral})-[:ABOUT]->(:Fact)
(:Tell {claimId, text, reliable})
```
No map-valued properties anywhere: arrays of scalars are fine; anything else is a JSON string.

### `public:{caseId}` (template copied per player)

`(:Room)`, `(:Room)-[:CONNECTS {state:'open'|'locked'}]-(:Room)` (hidden edges omitted), `(:Person {id,name,role,victim})`, `(:Slot {n,label})`.

### `play:{playerId}:{caseId}` (the tenant)

```
(:Player {id, tick})
(:Statement {id, claimId, by, kind, subject, slot, room, detail, text, tick})-[:ASSERTS]->(:Assertion {id, src, subject, slot, room, hard})
(:Evidence {id, room, title, text, window[], windowKind, actSlot, actRoom, actRestrictsTo[]})-[:ASSERTS]->(:Assertion)
(:Party)-[:KNOWN_REL {id, type, text}]->(:Party)   revealed by a Statement or Evidence (Party = Person or Entity)
(:Room)-[:HIDDEN_KNOWN {knowers[]}]-(:Room)        added when evidence reveals an edge
(:Assertion {hard:true, src:'inferred:<evidenceId>'})   derived by elimination
(:Flag {id, kind, refs[], note, by})-[:ABOUT]->(:Statement|:Evidence|:Person)       kind: contradiction|rehearsed|impossible|cleared|inferred|slip
(:Hypothesis {id, text, person, confidence, by})-[:SUPPORTED_BY]->(:Flag|:Statement|:Evidence)
(:BaitUsed {id, baitId, outcome, reactors[]})   (:SearchLog {room, tick})   (:Accusation {persons[], correct, tick})
```

`by` on Flags and Hypotheses is `'player'` or `'inspector'`: the Inspector visibly acts on the board.

### `player:{playerId}`

`(:Player {id})-[:PLAYED {stars, accusations, completedAt}]->(:Case {id})`. Anonymous id stored in the browser.

## The three cases (SPOILERS: developers only)

### Level 1: The Quiet Pact (`l1-quiet-pact`)
Theatre; victim Walter Ames, prop store, slot 5 (8:20). **Culprits: Dee, Kofi, Hana** (all present; they pre-agreed a story). Okoye has a motive and a perfect-looking story but is **cleared by impossibility**: his till receipts put him in the box office at slots 4 and 6, four rooms from the prop store.
Key proofs: all three claim the green room at slot 5 with the identical detail "bell-twice" (rehearsed group); the prop-store door log puts all three in the prop store (three contradictions); `checkFeasibility(okoye, 5, prop_store)` is false.

### Level 2: The Stopped Watch (`l2-stopped-watch`)
Auction house; victim Alistair Penhallow, cabinet room. The smashed watch says 9:40 (slot 5, `suggests`); the examiner's note **revises** the window to 9:00 (slot 3). Under the wrong window **Dorian** looks guilty (Rufus saw him enter the cabinet room at 9:40, and Dorian lied about the cloakroom). Under the right window Dorian's gate-camera still (courtyard at 9:00) clears him, and **Beatrix** (culprit) is exposed: the door log puts her in the cabinet room at 9:00, Rufus (once his bar tab breaks his vault story) saw her go in, and her own desk alibi contradicts both.
Other flags: **Rufus's own statements are an impossible move** (vault at slot 3 and main hall at slot 4 are two edges apart); Dorian's courtyard-then-cloakroom claims are also impossible.
Bait: three baits, **one allowed**. `b2_ring` is the only sharp one (only Beatrix knows where the ring is hidden); `b2_gate` is ambiguous (two knowers); `b2_second` produces nothing.

### Level 3: The Blackout Dinner (`l3-blackout-dinner`)
Estate dinner; victim Edmund Vale, study, slot 5 (9:30), during a blackout at slots 4 and 5. The study door is locked from inside, so on the visible map nobody can reach it. **Culprits: Clara (head) and Tobias (hand).**
Chain of deduction (each step is a tool):
1. `e3_hinge` reveals the hidden library-study passage (a **hidden edge** appears).
2. `e3_plan` says only family and Tobias know of it (**knowers** restrict who may use it).
3. `e3_wifi` and `e3_recording` pin Roz, Imani and Felix far from the study; `checkFeasibility` for slot 5 in the study excludes them. Gideon is excluded because he is not a knower. `e3_alarm` ("someone was in the study at 9:30") then leaves only **Tobias** (the elimination makes an inferred anchor, which exposes his false library alibi).
4. `e3_meter` ("breaker thrown by hand with the family code at 9:15") starts as {Edmund, Clara, Roz, Felix}; elimination leaves only **Clara**, an inferred anchor in the kitchen at slot 4, which exposes her false "I never left my chair" and Roz's false "I could feel her beside me".
5. `alibiSupport(clara, 4)`: her only voucher is Roz, whose own location is contradicted by the network log, so the alibi collapses (an alibi **chain** breaking).
6. `e3_message` and `e3_ledger` give the coercion and the motive path (Clara -> Tobias -> Edmund).
Baits: three, **two allowed**. `b3_breaker` makes Clara slip; `b3_window` makes Tobias slip; `b3_passage` is ambiguous (three knowers).
Red herrings: Roz and Imani lie about being in the conservatory (an affair, not a murder); Gideon is blunt but clear; Felix has the strongest motive but the best alibi.

Season 1 hooks (`arcClue`): tag "1/3" on Walter's keyring; lot 2 of "The Auditor's Collection"; a ledger page headed "The Auditor" listing three crossed-out names, one of which is Walter Ames.

## Validator usage

```
node scripts/validate-cases.mjs cases     # must print "All cases valid." before any case change is merged
```
Run it after every edit to a case file. If it fails, fix the case, not the validator. Add the validator to the pre-commit hook when `cases/` changes.
