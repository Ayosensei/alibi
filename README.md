# Alibi — documentation pack

Copy everything in this folder into the project repository root (`AGENTS.md`, `DESIGN.md`, `docs/`, `cases/`, `scripts/`, `fixtures/`, `.githooks/`, `docker-compose.yml`, `.env.example`), then run `chmod +x .githooks/*`.

| File | Purpose |
| --- | --- |
| `AGENTS.md` | Rules for every coding agent (read first, every session). Includes the commit discipline |
| `DESIGN.md` | The design system (case-file noir) in Google DESIGN.md format |
| `docs/01` to `09` | Product and rules, architecture, graph model and cases (spoilers), tool contract, queries, behaviour specs, UI spec, plan and tasks, demo and submission |
| `cases/*.json` | The three validated Season 1 cases (original, fictional); `*.run.json` are the recorded cold-case runs |
| `fixtures/*.oracle.json` | Golden tool outputs from the oracle (parity tests and UI mock data) |
| `scripts/reference-engine.mjs` | The oracle: pure-JS implementation of every reasoning tool |
| `scripts/validate-cases.mjs` | Proves each case is fair and has exactly the intended culprits |
| `scripts/make-fixtures.mjs` | Regenerates fixtures and recorded runs from the oracle |
| `scripts/check-design.mjs` | Design-system guard for `src/app` |

Quick checks (no database needed):

```
node scripts/validate-cases.mjs cases     # All cases valid.
node scripts/make-fixtures.mjs            # regenerates fixtures/ and cases/*.run.json
```

**Spoiler warning:** `docs/03-graph-model-and-cases.md` and the case files contain the solutions.
