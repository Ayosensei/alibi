# 01 — Product, hackathon rules, scope

## Pitch

**Alibi** is a detective game where every lie leaves a path. You interrogate AI suspects. Every statement becomes a node in a FalkorDB graph. Graph queries expose contradictions, rehearsed alibis, impossible journeys and the one person who could have reached a locked room. An AI **Inspector** works the same graph through a fixed set of tools (also exposed over MCP), writes its flags and hypotheses onto your board, and explains every conclusion with the path that produced it.

Tagline: **Every lie leaves a path.**

Season 1 has three levels, each teaching one family of graph reasoning:

| Level | Case | Mechanics taught | Graph capability |
| --- | --- | --- | --- |
| 1 | The Quiet Pact | contradictions; rehearsed alibis; clearing someone by impossibility | contradiction pattern match, grouping, shortest path |
| 2 | The Stopped Watch | the obvious time is wrong; impossible moves; baiting a slip | window revision, feasibility vs hard anchors, knowledge asymmetry |
| 3 | The Blackout Dinner | a locked study; a hidden passage; alibi chains; head and hand; two baits | hidden edge discovery, elimination by feasibility, alibi-support chains |

## Hackathon facts

- Graph Hacks 2026 (WeMakeDevs x FalkorDB), online, Oct 15 to Oct 18; submissions close **Oct 18, 11:59 PM IST = 7:29 PM WAT**. Target submission: **3 PM WAT**.
- We enter **Track 01: Agents That Act on Connected Data.** Focus points: multi-hop reasoning, graph queries and algorithms as agent tools, tool selection through MCP, actions based on what the graph shows, explainable results.
- **Separate team and repository from any other project** (each participant can be on only one team; this is a solo team).

## Rules that shape the build

1. FalkorDB is the primary graph database and supports a central part of the product.
2. **The graph must do real work.** If the product still works with FalkorDB removed, it does not qualify. Our tests must prove the reasoning tools read the graph.
3. Data must be public, synthetic, or our own. **All content is original and fictional.**
4. Main work happens during the event. Commit history must show that.
5. AI coding assistants are allowed but must be disclosed, and the participant must understand and be able to explain the code and queries.
6. Submission needs: public repo; README with setup and the graph data model; the Cypher queries or algorithms the product depends on; demo video; live deployment or complete local setup instructions; track named.

## What judges reward (from the organisers' reference article)

- The graph does work the agent could not do without it.
- The agent does not write its own queries: fixed tool catalogue, human-written parameterised Cypher, arguments validated against the graph.
- Answers carry the **path** that produced them.
- Honest abstention: "no path" shown differently from "nothing happened".
- Memory is more nodes: the Inspector writes Flag and Hypothesis nodes onto the board.
- A tenant is a graph, not a WHERE clause.

## Track 01 coverage

| Focus point | How we cover it |
| --- | --- |
| Multi-hop reasoning | motive paths (up to 3 hops), alibi-support chains, elimination via feasibility, shortest path across the map |
| Graph queries and algorithms as agent tools | 10 tools in one registry (8 read tools, 2 board writes; `04-tool-contract.md`); shortest path and variable-length traversal run in FalkorDB |
| Tool selection through MCP | `pnpm mcp` exposes the read tools; an outside agent solves a level through them |
| Actions based on what the graph shows | the Inspector writes Flags and Hypotheses to the board; the Bait is resolved by a knowledge query; the verdict is computed from the truth graph |
| Explainable results | every Inspector conclusion carries its tool trace and path; the verdict replays the deduction with what you missed |

## The information barrier (the design idea to remember)

- `truth:{caseId}` is hidden ground truth. Only the verdict, the suspect-reply selector and the Bait evaluator read it. The client never receives it.
- `play:{playerId}:{caseId}` holds only what the player has discovered (statements, evidence, flags, hypotheses) plus the public map. The Inspector and the MCP tools can read **only** this graph, so the Inspector cannot cheat. A test asserts no truth data reaches the client or the Inspector.

## Scope

**MUST (this is the product):** three cases loaded and validated; interrogation with claim-based replies and the knowledge firewall; Search rooms for evidence; evidence board and timeline grid; tools `getBoard`, `findContradictions`, `findRehearsedAlibis`, `findImpossibleMoves`, `checkFeasibility`, `whoCouldHave`, `motivePaths`, `alibiSupport`, `flag`, `hypothesize` (the Bait is a game action, not an Inspector tool); Inspector assistant with visible tool calls; Bait; accusation and explained verdict; cold-case demo mode; README, video.

**SHOULD:** MCP server; polish (Present mode, sound off, subtle animation); landing page.

**STRETCH (do not start before MUST is demo-ready):** confrontation mechanic; LLM case generator with the validator as a gate; more levels or Season 2; voice.

**Cut order if behind:** landing page, then Level 2 polish, then MCP, then Level 1 tutorial hints.

## Originality and IP (non-negotiable)

- Cases, characters, settings and puzzles are original. The game was *inspired by* the genre of consultant-detective shows and classic closed-circle mysteries; puzzle mechanics are generic ideas.
- **Do not** use any show's title, character names, episode plots (even renamed or "simplified"), logos or art. **Do not** paste episode recaps or scripts into this repository or into an agent's context.
- The README may say the project is inspired by detective fiction. It must not imply any affiliation with a show or its rights holders.

## Non-goals

No accounts, no multiplayer, no voice, no payments, no mobile-first design, no localisation (English only, PG-13, non-graphic).

## Names

Product: **Alibi**. Graph names: `truth:{caseId}`, `play:{playerId}:{caseId}`, `player:{playerId}`. Protagonist: the Consultant, a former casino pit boss who reads tells (original). Season 1 arc: each level hands you one clue toward "The Auditor" (a text hook only).
