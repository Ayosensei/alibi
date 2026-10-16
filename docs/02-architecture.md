# 02 — Architecture and stack

## Fixed stack (do not substitute)

| Layer | Choice |
| --- | --- |
| Runtime | Node LTS (>= 20), TypeScript `strict`, pnpm, **single Next.js app** (App Router), not a monorepo |
| UI | shadcn/ui + Tailwind, themed from `DESIGN.md` (noir); `@xyflow/react` (React Flow) for the evidence board; Zustand for client state; `lucide-react` icons |
| DB | FalkorDB, official Node client `falkordb`; local Docker with a volume is primary |
| LLM | Vercel AI SDK with Google Gemini Flash (free tier); model name from `GEMINI_MODEL`; structured output for suspect replies; tool loop for the Inspector |
| MCP | `@modelcontextprotocol/sdk` (TypeScript), stdio transport, `pnpm mcp` |
| Validation | zod everywhere (tool contract, case schema, API) |
| Tests | vitest against a real FalkorDB |

Version policy: install current stable versions, then **read the installed versions' docs** for the AI SDK, MCP SDK and FalkorDB client. These APIs change between versions and the signatures in this pack are intent, not copy-paste. Pin versions after install.

## Repo layout

```
AGENTS.md  DESIGN.md
docs/
cases/                    level JSON files (validated by scripts/validate-cases.mjs)
scripts/
  reference-engine.mjs    ORACLE: pure-JS implementation of every reasoning tool
  validate-cases.mjs      proves cases are fair and have exactly the intended culprits
  check-design.mjs        design-system guard for src/app
src/
  engine/                 graph access + tools (the product)
    db.ts                 connect, run/ro helpers with trace capture
    schema.ts             zod CaseSchema (mirrors docs/03)
    seed.ts               ensureCases(): idempotent seeding of truth and public graphs
    play.ts               startPlay(), copy graphs, progress (player graph)
    queries/              named, parameterised Cypher constants (Qnn_...)
    tools/                one file per tool; registry.ts exports TOOLS (zod) + implementations
    verdict.ts            accusation scoring and path replay (reads truth)
    bait.ts  search.ts  ask.ts
  agents/
    llm.ts                Gemini wrapper (structured output, retry, cache, limits)
    suspect.ts            ask pipeline: select claims -> verbalise -> firewall -> template fallback
    inspector.ts          tool loop (max 8 steps) + deterministic fallback plan + recorded runs
    firewall.ts           reply validation (pure, unit-tested)
  app/                    Next.js routes and UI (see 07-ui-spec.md)
mcp/server.ts             MCP server over the same registry (read tools only)
tests/                    golden tests per level; oracle parity; leak tests
docker-compose.yml  .env.example  .githooks/
```

## Graphs and the information barrier

```
truth:{caseId}              hidden. Persons (with persona), Rooms, CONNECTS (open|locked|hidden),
                            Presence, Claims (with truth flag), Evidence (+asserts), Relations,
                            Facts (knownBy), Baits, Tells, Solution.  READ ONLY by: ask, search, bait, verdict.
public:{caseId}             template for the tenant graph: Rooms, CONNECTS (open|locked only), Persons (public fields), Slots.
play:{playerId}:{caseId}    created with GRAPH.COPY from public:{caseId}. Grows as the player plays:
                            Statement, Evidence (found), Assertion, KnownRelation, HIDDEN_KNOWN edge, Flag, Hypothesis,
                            BaitUsed, SearchLog, AccusationLog.  The Inspector and MCP tools read ONLY this graph.
player:{playerId}           progress across levels (stars, accusations), no accounts.
```

Why this matters: the Inspector cannot cheat because it has no path to `truth:*`; tenants are graphs, not WHERE clauses; the verdict can show "what you missed" by diffing the truth against the play graph.

## Core flows

**Ask a suspect** (`POST /api/ask`): validate input -> `ask.ts` selects allowed claims from `truth:{caseId}` for (suspect, topic, slot, about) respecting `requires` (evidence found) and "not already asked" (play graph) -> LLM verbalises the chosen claims in character (structured output returns `{reply, claimIds}`) -> firewall checks `claimIds` subset and keyword leaks -> on failure retry once, then template fallback (the claim's own `text`) -> write `Statement` + `Assertion` nodes to the play graph -> return reply, new statements, tells, trace.

**Search a room** (`search`): reveal all evidence in that room not yet found; copy as `Evidence` + `Assertion` nodes; if the evidence reveals an edge or knowers, update `HIDDEN_KNOWN`; run `eliminate` (derived anchors) and recompute flags.

**Inspector** (`POST /api/inspector`, SSE): LLM tool loop over the play-graph tools (<= 8 steps), each call streamed to the UI as a trace event; conclusions are written as `Flag`/`Hypothesis` nodes with the path that justifies them. If the LLM fails or exceeds the step cap, a deterministic plan runs the same tools in a fixed order. **Cold case mode** replays a recorded run (`cases/*.run.json`) by re-executing its tool calls live against the loaded board.

**Bait** (`bait`): the player picks one prepared announcement; `bait.ts` queries `Fact.knownBy` in the truth graph: one knower -> a slip statement is added to the board; several -> ambiguous reactions; none -> nothing. Baits are limited per level (`baitsAllowed`).

**Accuse** (`accuse`): the set of persons is scored against `solution.culprits` using the truth graph. The verdict returns the path replay, the proofs the player found, the proofs missed, stars. Two wrong accusations fail the level.

## API routes (route handlers only; no server actions)

`POST /api/tool/[name]` (read tools and board writes), `POST /api/ask`, `POST /api/search`, `POST /api/bait`, `POST /api/accuse`, `POST /api/inspector` (SSE), `POST /api/start` (create play graph), `GET /api/season` (levels and progress).

## Environment

```
FALKORDB_HOST=localhost
FALKORDB_PORT=6379
FALKORDB_PASSWORD=
GEMINI_API_KEY=
GEMINI_MODEL=        # a current Flash model from Google AI Studio
ALIBI_LLM=live            # live | off  (off forces claim-text replies and the deterministic Inspector plan)
ALIBI_MAX_LLM_CALLS=60    # per session
```

## LLM limits and caching (free tier)

One LLM call per suspect question; the Inspector uses at most 8 tool-choice steps plus one narration call. Cache by `(caseId, suspectId, claimIds, questionHash)` for 10 minutes. Exponential backoff with jitter on 429. If anything fails, templates keep the game playable and the demo alive.

## Testing and oracle parity

- `scripts/reference-engine.mjs` is the oracle. For every case, a vitest suite loads the case into a real FalkorDB, plays a scripted full-knowledge board, and asserts **each tool returns exactly the oracle's result** (contradictions, rehearsed groups, impossible moves, feasibility, elimination survivors, alibi support, motive paths, bait outcomes).
- Golden tests per level: the proof items in `solution.proof` are all derivable; non-culprits are cleared; the culprit set is exactly right.
- Leak tests: no truth field (`truth`, `culprits`, claim `truth` flags, `knownBy`) in any client-bound response; the Inspector's database role/graph is the play graph only.
- Firewall unit tests: unknown claim id, keyword leak, clean reply.

## Deployment ($0)

Primary: local Docker FalkorDB (named volume) + `pnpm dev` + demo video. Optional: Vercel + FalkorDB Cloud free tier (no persistence, may be wiped): `ensureCases()` runs on first request and self-heals; the UI recreates the play graph on `UNKNOWN_PLAY`. Do a 30-minute spike on Day 1 to confirm a Vercel function can reach FalkorDB Cloud; if not, drop the live link. Judges can always follow the README local setup.

## Non-functional targets

Tool calls under 100 ms locally; first load under 2.5 s; no console errors on the demo path; the demo works with `ALIBI_LLM=off`.
