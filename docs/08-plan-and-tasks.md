# 08 — Plan, tasks, checkpoints

Solo build. Available: about 5 to 8 hours a day. Deadline: **submit by Sun Oct 18, 3 PM WAT** (hard close 7:29 PM WAT).

## Honest budget

Nominal agent-assisted work: about 19 h engine and agents + 13 h UI + 5 h README/video = 37 h. You have roughly 25 h (about 3 tonight, 8 Friday, 8 Saturday, 6 Sunday morning). **It fits only if you compress**, using the three levers below. The checkpoints say when to start cutting.

**Compression levers**
1. **Two agent sessions in parallel** from Friday morning: an *engine* session (tasks A) and a *UI* session (tasks U) on separate branches. The interface is `docs/04-tool-contract.md` plus the golden fixtures.
2. **Fixtures from the oracle.** `fixtures/*.oracle.json` are the expected outputs of every tool on a full board and double as mock API data for the UI (the UI never waits for the engine). Regenerate with `node scripts/make-fixtures.mjs`.
3. **Cases are done and validated.** Content is data; do not rewrite cases. If you change one, run `node scripts/validate-cases.mjs cases` and `node scripts/make-fixtures.mjs`.

## Timeline (WAT)

| When | Goal | Checkpoint (exit check) |
| --- | --- | --- |
| **Thu Oct 15 night (~3 h)** | A0, A1, A2. Repo, hooks, tokens, Docker, seeding of the three cases, play graph via GRAPH.COPY, spike results | **C1:** `pnpm typecheck` green; `docker compose up -d falkordb` works; `/api/start` returns Level 1; spike results written |
| **Fri Oct 16 (~8 h)** | Engine: A3 to A7. UI in parallel: U0 to U3. Level 1 playable end to end without LLM | **C2 (night):** Level 1 playable: ask (templates), search, timeline with contradictions and rehearsed flag, accuse, verdict. If C2 slips more than 3 h, start cutting (below) |
| **Sat Oct 17 (~8 h)** | A8 to A10 (Inspector, cold case, LLM replies), U4 to U6, Levels 2 and 3 playable, MCP (M1) if C2 was on time | **C3 (midday):** Inspector streams on Level 1. **C4 (night): FEATURE FREEZE.** All three levels playable; cold case works |
| **Sun Oct 18 (~6 h)** | Bugs only, U7 polish, README, demo video, blog post. **Submit by 3 PM WAT** | **C5:** submission checklist in `09-demo-and-submission.md` complete |

## Cut order (when behind)

1. Landing page (L1). 2. MCP server (M1). 3. LLM-driven Inspector (keep the deterministic plan and narrate from templates). 4. Board drag-and-drop polish (keep cards and threads). 5. SVG mini map (keep the rooms list). 6. Level 1 tutorial hints. **Never cut:** the three cases, the timeline, the verdict replay, the cold-case demo, the README and the video.

## Tasks

### A0 — Bootstrap (Thu, 1.5 h)
`create-next-app` (TypeScript, Tailwind, App Router), `shadcn init`, fonts, tokens generated from `DESIGN.md` into `globals.css`/`lib/tokens.ts`, `scripts/check-design.mjs`, `.githooks/` (copy from the pack; `prepare` script sets `core.hooksPath`), `docker-compose.yml`, `.env.example`, vitest, scripts `typecheck`, `test`, `dev`, `mcp`, `check:design`, `cases:validate`. Copy `cases/`, `scripts/`, `fixtures/` from the pack. Run `node scripts/validate-cases.mjs cases` (must print "All cases valid.").
**Accept:** clean clone builds; typecheck, check:design and validator green; first commit uses the commit format.

### A1 — Data layer, seeding and the spike (Thu, 2 h)
`db.ts` (connect, `run`/`ro` helpers recording a `TraceStep`; read the Node client's real API and result shape once and wrap it), `schema.ts` (zod `CaseSchema` per `03`), `seed.ts` (`ensureCases()`: idempotent, creates `truth:{case}` and `public:{case}` with the queries in `05`; self-heals). **Spike (write `docs/spike-results.md`):** test in FalkorDB Browser: UNWIND with list-of-maps params, `ALL(... IN array)`, `NOT x IN list`, string comparison, `shortestPath` with a relationship-type alternation and a WHERE, list comprehension over `relationships(p)`, `OPTIONAL MATCH` chains, `GRAPH.COPY` carrying indexes, null-vs-sentinel parameters. Record the fallback chosen for each.
**Accept:** `ensureCases()` twice is a no-op; counts of nodes match the case files; spike file committed.

### A2 — Play lifecycle (Thu, 1 h)
`startPlay(playerId, caseId, reset)` via GRAPH.COPY + Q20; `player:{pid}` progress; `POST /api/start` returns the public case (no hidden edge, no truth).
**Accept:** two players are isolated; reset restores tick 0; response passes the leak test.

### A3 — Board writes, search and elimination (Fri, 2 h)
Q41 to Q45, Q50 to Q57, `eliminate`, window logic, `getBoard`.
**Accept:** Level 3 sequencing tests from `06` section 3 (no hinge: nobody can reach the study; hinge only: two survivors; with the notebook: Tobias only).

### A4 — Contradictions, rehearsed, impossible, feasibility, whoCouldHave (Fri, 3 h)
Tools per `04` with the queries in `05` and the fallbacks recorded in A1.
**Accept (oracle parity):** for all three cases, on empty, partial and full boards, each tool equals `fixtures/<case>.oracle.json` and the reference engine.

### A5 — motivePaths, alibiSupport, flag, hypothesize (Fri, 1.5 h)
**Accept:** Level 3 `alibiSupport(clara, 4)` is unsupported (Roz unreliable); `motivePaths(tobias)` and `(clara)` match the oracle; Flags and Hypotheses persist with `by`.

### A6 — Ask pipeline (Fri, 2.5 h)
`ask.ts`, `suspect.ts`, `firewall.ts`, `llm.ts` per `06` section 5; tells as observations; limits and cache.
**Accept:** with a fake LLM that leaks, the firewall retries then falls back; `ALIBI_LLM=off` returns claim text; unlocked claims appear only after their evidence; nothing in a response carries truth.

### A7 — Bait, accuse, verdict (Fri night / Sat, 2.5 h)
**Accept:** all three cases: the full solution is accepted; a subset is `partial`; a wrong set costs a life; the verdict `found`/`missed` lists are correct for a scripted partial board; truth is revealed only when the level is over.

### A8 — Inspector (Sat, 2.5 h)
Tool loop (max 8), deterministic plan, SSE stream, writes with `by: 'inspector'`.
**Accept:** deterministic plan reaches the oracle's conclusions on each case; the LLM path never calls a tool outside `TOOLS`; a test proves the Inspector's database access cannot read `truth:*`.

### A9 — Cold-case runs (Sat, 1 h)
Load `cases/*.run.json`; apply the board through the normal write path; re-execute steps live.
**Accept:** each re-executed result equals `expect`; the UI label is shown.

### M1 — MCP server (Sat, 1.5 h; SHOULD)
**Accept:** the MCP Inspector lists the 8 read tools and a call returns the oracle result.

### U0 to U7 — See `docs/07-ui-spec.md` section 13 (13 h nominal)
Run in a second agent session from Friday morning against `fixtures/` mock data.

### D1 — Demo assets (Sun, 4 h)
README, demo video (follow `09`), screenshots, blog post. Rehearse the video once on Saturday night.

## Per-task discipline (every task)

Read `AGENTS.md`. Commit every 15 to 30 minutes (rules in `AGENTS.md` 3b). Run `pnpm typecheck && pnpm test` before saying done. Update `docs/screens/` for UI tasks. At the end of each session, write three lines: what changed, what is verified, what is next.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Cypher syntax surprises | A1 spike with fallbacks that must match the oracle |
| Free LLM quota or latency | claim text is the fallback; deterministic Inspector; cache; call budget |
| Solo bandwidth | two agent sessions, fixtures, cut order |
| Demo failure | cold case re-executes locally; `ALIBI_LLM=off` path rehearsed; pre-recorded backup video |
| Spoilers in a public repo | acceptable for a hackathon; truth stays server-side at runtime |
| IP | all content original; no recaps in the repo; README states inspiration only |
