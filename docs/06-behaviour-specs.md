# 06 — Behaviour specs (exact rules)

Both the tools and the UI must agree with these. The oracle in `scripts/reference-engine.mjs` is the executable version of sections 1 to 4.

## 1. Assertions and anchors

- A **statement** of kind `location` asserts `(speaker, slot, room)`; kind `saw` asserts `(subject, slot, room)`. These are **soft** assertions. Kinds `relation` and `fact` assert no location.
- Evidence `asserts` are **hard** assertions. Elimination can add **inferred** hard assertions (`src = 'inferred:<evidenceId>'`).
- The **window** (murder slots) is: the `revises` window of any found evidence, else a `suggests` window of found evidence, else the case's `publicWindow`. (Level 2 starts at [5] from the watch and becomes [3] when the examiner's note is found.)

## 2. Contradictions, rehearsed, impossible

- **Contradiction:** two assertions with the same subject and slot but different rooms and different sources. Report each unordered pair once.
- **Rehearsed alibi:** location statements by two or more different people sharing the same `(slot, room, detail)` with a non-empty `detail`.
- **Impossible move:** two assertions about one person, `slotA < slotB`, from different sources, where `distance(roomA, roomB) > slotB - slotA` on the board map (open edges plus the hidden edge if discovered). Same-slot conflicts are contradictions, not impossible moves.

## 3. Feasibility and elimination

- **checkFeasibility(person, slot, room):** feasible iff the room is reachable on that person's usable map (open edges; the hidden edge only if discovered and the person is a knower, or knowers are unknown) **and** every hard anchor `(slotA, roomA)` of that person satisfies `distance(roomA, room) <= |slot - slotA|`. Soft assertions are ignored here (people lie).
- **whoCouldHave(evidence):** for evidence with an `act {slot, room, restrictsTo}`, run checkFeasibility for each candidate. If exactly one survives, create an **inferred anchor** for that person at `(act.slot, act.room)`. Evidence is processed **in the order found**; an earlier inferred anchor can eliminate candidates of a later act (Level 3: the breaker elimination makes Clara unable to be the person in the study).
- **Sequencing guarantees (tested):** in Level 3 without the hinge nobody can reach the study; with the hinge but without the notebook the alarm elimination leaves two survivors (Tobias and Gideon); with the notebook only Tobias remains.

## 4. Alibi support, motive paths, baits

- **alibiSupport(person, slot):** the room the person claims at that slot, plus the `saw` statements by others placing the person in that room. A supporter is **unreliable** if any hard assertion places the supporter in a different room at that slot. `supported = some supporter is reliable`.
- **motivePaths(person):** up to 3 shortest paths (max 3 hops) from the person to the victim over **known** relations only (revealed by statements or evidence). `no_path_known` is a successful answer.
- **Bait:** `knownBy.length === 1` -> `slip` (the knower slips; a Statement flagged `slip` is added); `> 1` -> `ambiguous`; `0` -> `nothing`. The number of baits used is limited by `baitsAllowed`. A slip is evidence of guilty knowledge, not a confession: it supports the accusation but never replaces the other proofs.

## 5. The ask pipeline (suspect replies)

```
ask(suspect, topic, slot?, about?)
 1. resolve play graph, suspect (UNKNOWN_*); level not over
 2. asked = Q41, found = Q42; select <= 2 claims with Q40 (priority order)
    none left -> status 'nothing_new', in-character brush-off from the persona line (template), no LLM call
 3. if ALIBI_LLM=off or call budget used: reply = claim.text(s) joined; source 'template_fallback'
 4. else prompt the LLM (structured output): {reply: string, claimIds: string[]}
 5. firewall(reply, claimIds, allowedClaimIds, forbiddenKeywords): on violation retry once with a stricter line, then fall back to claim text
 6. write Statements and Assertions (Q43, Q44), reveal relations (Q45), tick++
 7. observation: if a selected claim has a Tell, return it as a noticed behaviour ("Dee touches her lanyard"); never say whether it is reliable
```

**Prompt (assembled in code):**
```
You are {name}, {role}. {persona}
You are being questioned by the Consultant about the night {victimName} died. Reply in character in at most 40 words.
Say ONLY what the following statements say, in your own voice. Do not add facts, names, places or times. Do not confess.
STATEMENTS TO CONVEY (ids and meaning):
- [{claimId}] {claim.text}
Return JSON: {"reply": string, "claimIds": string[]}
```
- The model receives only the claims it is allowed to convey now. It never receives the truth flags, other suspects' claims or the solution. A lying suspect's false claim is conveyed exactly as authored; the model does not decide to lie.
- **Firewall violations:** `claimIds` not a subset of the allowed ids; the reply contains a **forbidden keyword** (the names of rooms, people or objects that appear in claims the suspect has *not* been cleared to say, i.e. every room name, person name and weapon/evidence title that is not present in the allowed claim texts or the question); the reply is empty or over 60 words.
- Keywords are matched case-insensitively as whole words. Allowed vocabulary = the allowed claim texts + the suspect's name/role + the topic's generic words. Keep the check conservative and unit-tested.
- Templates are the claims' own `text` (already in character). The Consultant's observation is added by the UI as a separate line.

## 6. Search

`search(room)`: all evidence in that room not yet found is added to the board (Q51, Q52); relations revealed (Q45); a hidden edge is revealed (Q53) and `knowers` set when given (Q54); the window may change; then clear inferred anchors (Q56) and re-run elimination (Q57); log the search (Q55). Searching the same room twice returns `ALREADY_SEARCHED`. Searching costs a tick but no budget.

## 7. Accusation and verdict

- `accuse(persons)`: compare to `solution.culprits`. `full` = exact set. `partial` = non-empty proper subset of the culprits and no non-culprits. `wrong` = anyone not guilty included. Each wrong accusation reduces `wrongLeft` (start at 2). Level ends on `full`, or when `wrongLeft` reaches 0. A `partial` does not cost a life but is reported ("You have the hand, not the head").
- **Stars** (only on `full`): 1 for solving, +1 if **all** proof items were derivable from the player's board when they accused (`found` covers `solution.proof`), +1 if no wrong accusation was used.
- **Replay (the verdict screen):** an ordered list of steps rebuilt from the solution: (1) the murder window and how it was established, (2) the lies exposed (contradictions, rehearsed groups, impossible moves with their paths), (3) the cleared suspects and the reason (the anchor and path that rules them out), (4) the culprits' motive paths, (5) baits and slips. Each step carries `refs` (statement/evidence ids) and `path` (room ids or person ids) so the UI can highlight them on the board and map.
- **found / missed:** each proof item is *found* if the player's board derives it (both contradiction sources present, the rehearsed group's claims present, both impossible-move claims present, the elimination evidence present and its survivor derived, the sharp bait used and slipped, the window revision found, the motive relations known). Missed items are listed with where to look ("Search the library").
- Truth is revealed (culprits, method, weapon) only when the level is over.

## 8. The Inspector

**Contract:** it can call only `TOOLS` (reasoning tools plus the board writes `flag` and `hypothesize`). Its database access is the play graph. It never sees truth or claim truth flags. Every conclusion it states must cite tool results (statement/evidence ids, paths) and is written to the board as a Flag or Hypothesis with `by: 'inspector'`.

**System prompt (assembled in code):**
```
You are the Inspector, a methodical assistant to the Consultant. You reason ONLY from the tools. Never guess a fact the tools did not return.
Each step: choose one tool; after results, either call another tool or finish. At most 8 tool calls.
Write a Flag for each solid finding and a Hypothesis (with confidence 0..1) for each theory, citing the ids that support it.
If the board does not support a conclusion, say what is missing and what the Consultant should ask or search next.
Finish with 3 to 6 plain sentences: what does not add up, who is cleared and why, and the strongest hypothesis.
```
**Modes:** `assist` answers the player's question ("What doesn't add up?", "Could Okoye have done it?"); `cold_case` runs the recorded run for the level.

**Deterministic fallback plan (also used when the LLM errors or the cap is hit):** `getBoard` -> `findContradictions` -> `findRehearsedAlibis` -> `findImpossibleMoves` -> `whoCouldHave` for every found evidence with an act -> `checkFeasibility(person, window slot, crimeScene)` for every suspect -> `alibiSupport(person, s)` for each person who claimed a location at a window slot -> `motivePaths` for every non-cleared person. Then write one Flag per finding. Hypothesis confidence = `min(0.95, 0.35 + 0.15 x number of independent supporting findings)` where independent findings are: an exposed lie, a failed alibi chain, sole feasibility survivor, a known motive path, a slip. Narration is templated from the findings when the LLM is off.

**Cold case:** `cases/<id>.run.json` holds `{board: {claims[], evidence[]}, steps: [{tool, args, say}]}`. The loader applies the board through the normal write path (so inferred anchors and edges are real), then re-executes each step live and streams the real results with the `say` line. The UI labels it "Recorded run, re-executed live against the graph". A test fails if a re-executed result differs from the recorded expectation.

## 9. Tells (the Consultant's reads)

A tell is a short observation attached to a claim ("touches her lanyard", "laughs a little too quickly"). It is shown when that claim is made. Some tells are reliable (the claim is false) and some are red herrings (nervous but truthful). The UI must never colour or label a tell as reliable; the player learns that tells are hints, not proof, and the verdict never counts them as proof.

## 10. Progress and limits

Progress is per anonymous player: stars per level and accusations used, stored in `player:{playerId}`. Per session limits: 60 LLM calls; one in-flight request per play graph; the player can reset a level (`start` with `reset: true`).
