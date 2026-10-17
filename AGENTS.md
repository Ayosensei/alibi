# AGENTS.md — Alibi (read this first, every session)

You are a coding agent working for **Ayo and Femi** (**Team Subaru Boys**) on **Alibi**, a detective game whose reasoning runs on **FalkorDB**, for the Graph Hacks hackathon (**Track 01: Agents That Act on Connected Data**). The hackathon closes **Oct 18, 2026, 11:59 PM IST (7:29 PM WAT)**; we submit by **3 PM WAT**. We aim to win, so correctness and a polished demo matter more than feature count.

## 0. Before you write any code

1. Read, in order: `docs/01-product-and-rules.md`, `02-architecture.md`, `03-graph-model-and-cases.md`, `04-tool-contract.md`, `06-behaviour-specs.md`. Read `05-queries.md` before touching Cypher and `07-ui-spec.md` plus `DESIGN.md` before touching any UI.
2. Read `docs/08-plan-and-tasks.md` and work **only on the task you were given**. Do not start stretch items.
3. `scripts/reference-engine.mjs` is the **oracle** for every reasoning tool. Read it. Your implementation must return exactly what it returns.

## 1. What the product is (one paragraph)

The player interrogates AI suspects. Each reply conveys pre-authored **claims**; every statement and every piece of evidence becomes nodes in the player's own graph (`play:{playerId}:{caseId}`). Reasoning tools (contradictions, rehearsed alibis, impossible moves, feasibility, elimination, alibi chains, motive paths) run on that graph; an AI Inspector calls those tools, writes Flags and Hypotheses onto the board and explains its conclusions with the path. Hidden ground truth lives in a separate graph (`truth:{caseId}`) that only the verdict, suspect replies, bait and search read.

## 2. Hard rules (violating these can disqualify us or break the demo)

1. **The graph must do real work.** If a feature would still work with FalkorDB removed, it does not count. Reasoning tools must read the graph.
2. **The LLM never writes Cypher and never receives Cypher.** All Cypher lives in `src/engine/queries/` as named, parameterised constants (`Qnn_...`, see `05`). Never build queries by string concatenation. Always pass `$params`.
3. **The information barrier.** Reasoning tools, the Inspector and the MCP server may read **only** the play graph. Nothing from `truth:*` (truth flags, `culprits`, `knownBy`, hidden edges before discovery) may appear in any client-bound response or Inspector context. The leak test must stay green.
4. **Suspects only convey authored claims.** The suspect LLM returns claim ids and a reply; the firewall validates it; the fallback is the claim's own text. The model never decides what is true or invents facts.
5. **Resolve ids against the graph** (person, room, evidence, bait) before running queries; unknown ids return the `UNKNOWN_*` error and run nothing else.
6. **Reads use `roQuery`.** Writes are deliberate and live in the action or tool that owns them.
7. **The oracle wins.** If a Cypher or TypeScript result differs from `reference-engine.mjs` or `fixtures/*.oracle.json`, your code is wrong, unless `docs/06-behaviour-specs.md` is wrong; then fix the spec and the oracle together and tell Ayo.
8. **Cases are validated.** After any change to `cases/*.json` run `node scripts/validate-cases.mjs cases` (must print "All cases valid.") and `node scripts/make-fixtures.mjs`.
9. **Do not invent FalkorDB or Cypher features.** FalkorDB implements a subset of OpenCypher. If unsure, test in FalkorDB Browser (http://localhost:3000) or read https://docs.falkordb.com (Cypher support, Known limitations, Algorithms, Clients). Record surprises and fallbacks in `docs/spike-results.md`.
10. **No map-valued properties**; use scalars, arrays of scalars or JSON strings. Use sentinels (`''`, `0`, `[]`), never `null`, for absent parameter values.
11. **No secrets in git.** Use `.env` (gitignored); keep `.env.example` current. Synthetic data only.
12. **Originality (IP).** All cases, characters and puzzles are original. Never add third-party plots, episode recaps, scripts, character names, titles or art to the repo, the docs or your context, even "simplified" or renamed. The README may say the game is inspired by detective fiction and must not imply any affiliation.
13. **Tests hit a real FalkorDB** (`docker compose up -d falkordb`), never a mocked database. Use a fake LLM in tests. Every query has at least one test and every reasoning tool has an oracle-parity test.
14. **Spoilers.** The UI never shows truth before the verdict. Do not log truth data to the browser console or network responses.
15. **Dependencies:** prefer what is already in the stack; justify any addition in the commit body.

## 2b. Fixed tech stack (do not substitute)

Node LTS (>= 20), TypeScript `strict`, pnpm, a single Next.js app (App Router, route handlers only), shadcn/ui + Tailwind themed from `DESIGN.md`, `@xyflow/react` (board), Zustand, `lucide-react`, FalkorDB official Node client `falkordb`, Vercel AI SDK with Gemini Flash (free tier; model from `GEMINI_MODEL`, never hardcoded), `@modelcontextprotocol/sdk`, zod, vitest. After installing, **read the installed versions' docs** for the AI SDK, MCP SDK and FalkorDB client: signatures in the docs are intent, not copy-paste.

## 3. Conventions

- TypeScript: no `any`, no non-null assertions without a comment, named exports, small functions, files under ~250 lines.
- Every tool and action returns the envelope from `docs/04-tool-contract.md` and never throws to callers. Every query records a `TraceStep` (agent, tool, queryId, args, rows, ms).
- Query ids are stable (`Q60_contradictions`); docs and tests refer to them. Comments explain **why**, one line per query saying what question it answers (judges will ask).
- Commits and pushes: section 3b, mandatory.

## 3b. Commit discipline (mandatory for every agent and human)

Goal: history that lets us roll back anything, shows steady progress inside the event window, and makes each teammate's work visible within minutes.

1. **Commit early, commit often.** Commit after every green micro-step: a query verified in Browser, a function plus its test, a component rendered on the styleguide, a doc updated. Target 15 to 30 minutes between commits. Never go more than 45 minutes of work without one. If you have changed more than ~150 lines or touched more than ~5 files without committing, stop and commit now (split by intent).
2. **One logical change per commit.** No "misc fixes", no "updates". Do not mix formatting with behaviour, or a refactor with a feature.
3. **Every commit compiles.** `pnpm typecheck` must pass at each commit (and `pnpm check:design` for anything in `apps/web`). The `pre-commit` hook enforces this; never bypass it with `--no-verify`. Tests for what you touched must pass before you push; the full suite must pass before you merge to `main`. Work-in-progress commits are allowed on your own branch only if they compile, and are prefixed `wip`.
4. **Message format (enforced by the `commit-msg` hook):** `<area>(<task>): <imperative summary>`, at most 72 characters.
   - Areas: `engine`, `agents`, `web`, `mcp`, `cases`, `docs`, `infra`, `test`, `chore`, `wip`.
   - Task: the id from `docs/08-plan-and-tasks.md` (`A4`, `U3`, `M1`) or a short topic.
   - Examples: `engine(A4): add contradictions query`, `web(U4): draw thread between flagged cards`, `docs(A1): record query spike results`.
   - Add a body when the why is not obvious: what problem, what you verified (test names, query ids, screenshot path). Keep lines under 100 characters.
   - **AI disclosure trailer** on every agent-written commit: `Assisted-by: <tool and model>` (for example `Assisted-by: Claude Code`). This feeds the README's AI-usage section.
5. **Stage deliberately.** Use `git add <paths>` or `git add -p`. Read `git status` and `git diff --staged` before every commit. Never commit `.env`, keys, `node_modules`, build output or large binaries. Do not use `git add -A` without checking what it will add.
6. **Push often.** Push after every commit, and no less than every three commits or every hour. Run `git pull --rebase origin main` at least hourly and before starting any task. On conflict keep both sides' intent and never discard a teammate's change. If the conflict is in `docs/04-tool-contract.md` or `cases/`, stop and ask Ayo.
7. **Merge to `main`** as soon as a task's acceptance criteria pass (typecheck + tests). Do not leave a finished task unmerged overnight. `main` must always run the demo.
8. **Checkpoint tags.** At each checkpoint (C1 to C4) tag `main` (`git tag c1 && git push --tags`). Tag `final` just before submission. Never move or delete a tag.
9. **Never rewrite shared history.** No force-push to `main`. Never amend, squash or rebase commits that are already pushed. On your own unpushed branch you may amend or rebase freely.
10. **Before risky operations** (dependency upgrades, large refactors, query or schema rewrites, mass renames, deleting files) commit the clean state first so rollback is one command.
11. **Commit what you describe.** Spike results, screenshots, doc edits and fixtures go in the same commit as the change they document.
12. **End-of-session ritual (agents):** before you stop, run `pnpm typecheck && pnpm test`, commit every intended change, push, then reply with three lines: what changed, what you verified, what is next. Leave no uncommitted work behind.

Hooks live in `.githooks/` (copied in task A0). `pnpm i` runs `git config core.hooksPath .githooks` through the `prepare` script.

## 3c. UI work in `src/app`: the design system is mandatory

- Read `DESIGN.md` (the design system) and `docs/07-ui-spec.md` (screens, components, copy, states) completely before touching any UI. `DESIGN.md` wins on colour, type, shape, depth, motion and craft rules; `07-ui-spec.md` wins on layout and behaviour.
- Use only shadcn/ui components, Tailwind semantic classes and the generated tokens. No hard-coded colours, sizes or fonts; no new UI, icon or animation libraries. Paper is for evidence cards only; thread red is for conflict only; never label a tell as reliable.
- Every new or changed component appears on `/styleguide` in all states, in the same commit.
- If you change `DESIGN.md`, run `npx @google/design.md lint DESIGN.md` and fix findings; regenerate tokens instead of hand-typing values.
- `pnpm check:design` must pass before every commit that touches `src/app`.
- Save a 1440x900 screenshot to `docs/screens/` after each UI task and commit it.

## 4. Definition of done (any task)

- Acceptance criteria in `docs/08-plan-and-tasks.md` are met and demonstrated (test output or screenshot).
- `pnpm typecheck` and `pnpm test` pass; the validator passes if cases changed.
- The work is committed and pushed following section 3b.
- Ayo can explain what you wrote. Keep code simple; comment any non-obvious trick.
- Nothing in section 2 is violated.

## 5. AI-use disclosure

The hackathon requires AI coding assistant use to be disclosed and requires the participant to understand and explain the code, queries and architecture. Do not generate large opaque blocks. Prefer clear, boring code. The README has an "AI usage" section maintained by Ayo. Add `Assisted-by:` trailers to commits.

## 6. When you are stuck

Re-read the relevant doc; test the query in Browser; check the FalkorDB docs; compare with the oracle. If the docs or the oracle are wrong or ambiguous, do not improvise: write the problem in `docs/open-questions.md` and tell Ayo.

## 7. Commands (set up in task A0)

```
docker compose up -d falkordb      # FalkorDB on 6379, Browser on 3000
pnpm i
pnpm typecheck
pnpm check:design                  # design-system guard (src/app)
pnpm cases:validate                # node scripts/validate-cases.mjs cases
pnpm test                          # needs FalkorDB running
pnpm dev                           # Next.js on port 3001 (Browser uses 3000)
pnpm mcp                           # MCP server (stdio)
pnpm demo:reset                    # reset the demo player to a known state
```
