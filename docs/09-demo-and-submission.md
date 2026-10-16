# 09 — Demo, README, submission, judge Q&A

## Demo video (about 3 minutes; record Sunday morning from a clean state, keep a Saturday-night backup)

Prep: Present mode, 1920x1080, `pnpm demo:reset`, LLM key valid (or `ALIBI_LLM=off`), `next build && next start`, FalkorDB Browser tab open for one shot.

1. **Hook (10 s).** "Every lie leaves a path. Alibi is a detective game where a graph database catches the liars, and an AI Inspector explains how."
2. **Level 1 in 30 s.** Ask three suspects where they were at 8:20. The identical "bell rang twice" lights up as a brass rehearsed bracket on the timeline. Search the prop store: the door log puts all three there; three red threads draw. "Okoye had a motive. Could he have reached the prop store?" Ask the Inspector: `checkFeasibility` returns false with the path, so he is cleared.
3. **The Inspector (35 s).** Start Level 3 **Cold case**. The board is pre-filled. Tool calls stream in steel blue: contradictions, `whoCouldHave` (breaker -> only Clara), feasibility for the study (hidden passage, only Tobias), `alibiSupport` (Roz is unreliable, so Clara's alibi collapses), `motivePaths`. Cards and timeline cells glow as each runs. Flags and hypotheses land on the board. "Recorded run, re-executed live against the graph."
4. **Level 2's trap (25 s).** The watch says 9:40 and Dorian looks guilty. The examiner's note revises the window to 9:00; the timeline re-shades and Dorian is cleared by the gate camera; Beatrix is exposed. Use the one bait: the ring announcement; Beatrix slips.
5. **The verdict (25 s).** Accuse Clara and Tobias. The serif headline, the replay highlighting the path, "what you found / what you missed", three stars, the next arc clue.
6. **Under the hood (25 s).** Show the information barrier (truth graph vs play graph), the Cypher for contradictions and rehearsed groups, and the trace panel (query ids, rows, ms).
7. **MCP (15 s).** An outside agent (MCP Inspector or a coding agent) lists the tools and runs `findContradictions` on a level. "Any agent can reason on the same graph."
8. **Close (10 s).** "Original cases, a fixed tool catalogue, a hidden truth graph, and answers that carry their path. Built on FalkorDB."

Trim step 6 or 7 first if over time.

## README structure

1. Pitch + 15-second GIF of the thread and the timeline.
2. **Why this needs a graph** (information barrier; contradiction pattern; feasibility via shortest path; elimination; alibi chains).
3. Quickstart (5 commands; `ALIBI_LLM=off` note; the FalkorDB Browser port).
4. The three levels (no spoilers) and the Season 1 arc.
5. **Graph data model** (diagram + the three graphs from `03`).
6. **Queries and algorithms** (list the `Qnn` ids with one line each; link `queries/`).
7. The tool catalogue (table from `04`), the Inspector, and the MCP setup (client config JSON).
8. Oracle parity and how cases are validated (`node scripts/validate-cases.mjs cases`).
9. Track 01 coverage table (from `01`).
10. Demo video, live link (with the free-tier caveat).
11. **AI usage disclosure** (tools used, what you wrote and verified).
12. **Originality and credits:** "Inspired by classic closed-circle detective fiction and consultant-detective shows. All cases, characters and puzzles are original. No affiliation with any show." Licence MIT.

## Submission checklist (submit by 3 PM WAT Sunday)

- [ ] Registered on the WeMakeDevs page as a **separate team** from any other project; only you on it
- [ ] Public repo with commit history inside the event window
- [ ] README complete (12 sections); `queries/` matches the code
- [ ] Demo video (about 3 min) linked
- [ ] Live link (optional) or complete local instructions
- [ ] **Track named: Track 01**
- [ ] AI usage disclosed; no episode recaps or scripts anywhere in the repo or its history
- [ ] `node scripts/validate-cases.mjs cases` passes; tests pass; `ALIBI_LLM=off` run works
- [ ] Fresh-clone test on another machine or container
- [ ] Blog post published (side prize)

## Judge Q&A (be able to answer without notes)

1. **Why a graph and not Postgres?** The questions are traversals and pattern matches: who is placed in two rooms, who could reach this room in this many steps through which edges, which alibi depends on which witness. In FalkorDB each is a pattern, a shortest path or a variable-length path, and the answer comes with its path.
2. **If I remove FalkorDB, what breaks?** Contradiction detection, feasibility and elimination, alibi chains, motive paths, the tenant isolation (a graph per player), the information barrier and the verdict replay.
3. **Does the LLM write queries?** No. Fixed tool catalogue with zod schemas and human-written parameterised Cypher. The LLM chooses among tools (Inspector) and puts pre-authored claims in a suspect's voice.
4. **Can the Inspector cheat?** No. It can call only the reasoning tools, whose database access is the player's graph. Truth lives in a separate graph that only the verdict, suspect replies, bait and search read. A test asserts this.
5. **How do you know the cases are fair?** `validate-cases.mjs` proves each case has exactly the intended culprits, every lie is detectable, every non-culprit is provably cleared, and the sharp baits point only at culprits. The reference engine is the oracle the Cypher tools must match.
6. **How does a suspect avoid leaking?** The model sees only the claims it is cleared to convey, returns claim ids, and a firewall rejects replies that reference other claims or leak forbidden terms; the fallback is the claim's own text.
7. **What is multi-hop here?** Motive paths up to three relationships, shortest paths across the map, elimination chains (breaker -> only Clara; alarm -> only Tobias after the passage and the notebook), alibi-support chains.
8. **What does the Inspector act on?** It writes Flags and Hypotheses (with its tool trace) onto the board, and the UI highlights what it touched.
9. **What would you build next?** A case generator gated by the validator, Season 2 with an in-graph arc, voice interrogation, and confrontation (presenting a contradiction to a suspect).
10. **What did AI write?** Answer from the README disclosure; be ready to explain Q60, Q61 and Q63 line by line.
