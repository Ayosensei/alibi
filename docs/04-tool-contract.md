# 04 — Tool contract (source of truth)

Two kinds of operations, kept strictly apart:

1. **Reasoning tools** (`TOOLS`): read the **play graph only** (plus the two board writes `flag` and `hypothesize`). The Inspector and the MCP server may call these and nothing else. They never read the truth graph.
2. **Game actions** (`ACTIONS`): `start`, `ask`, `search`, `useBait`, `accuse`. These read the truth graph (they must: suspects speak from claims, rooms hold evidence, baits resolve against knowledge, the verdict scores against the solution). Only the UI/API calls them. **Never expose actions to the Inspector or MCP.**

Copy the schemas below to `src/engine/contract.ts`. Changes are deliberate edits to this file and the code together.

## Conventions

- Every call returns an envelope: `{ ok: true, data, trace }` or `{ ok: false, error: { code, message, hint? }, trace }`. Never throw to callers.
- `trace` is an array of `TraceStep` for each query that ran (agent, tool, queryId, args, rows, ms). The UI and the Inspector panel render it.
- Ids are lowercase slugs matching the case file. Slots are integers 1 to 8.
- "No path / nothing known" is a **successful** response with a status field, never an error. Unknown ids are errors.
- Nothing in any response may contain `truth`, `culprits`, claim truth flags or `knownBy`. A test enforces this.

## Schemas

```ts
import { z } from 'zod';

export const Id = z.string().regex(/^[a-z0-9][a-z0-9_-]{0,47}$/);
export const PlayerId = Id; export const CaseId = Id; export const PersonId = Id; export const RoomId = Id;
export const Slot = z.number().int().min(1).max(8);
export const Topic = z.enum(['whereabouts', 'witness', 'motive', 'victim', 'general']);

export const ErrorCode = z.enum([
  'BAD_ARGS', 'UNKNOWN_PLAY', 'UNKNOWN_CASE', 'UNKNOWN_PERSON', 'UNKNOWN_ROOM', 'UNKNOWN_EVIDENCE',
  'NO_BAITS_LEFT', 'ALREADY_SEARCHED', 'LEVEL_OVER', 'LLM_UNAVAILABLE', 'DB_UNAVAILABLE', 'INTERNAL',
]);

export const TraceStep = z.object({
  agent: z.enum(['suspect', 'inspector', 'engine', 'verdict']),
  tool: z.string(),
  queryId: z.string().optional(),            // e.g. 'Q30_contradictions'
  args: z.record(z.string(), z.unknown()),   // sanitised; never keys
  rows: z.number().int(),
  ms: z.number(),
});
export type Envelope<T> =
  | { ok: true; data: T; trace: z.infer<typeof TraceStep>[] }
  | { ok: false; error: { code: z.infer<typeof ErrorCode>; message: string; hint?: string }; trace: z.infer<typeof TraceStep>[] };

// ---- shared shapes ----
export const SrcRef = z.object({            // anything that can appear in a contradiction
  src: z.string(),                          // claim id, evidence id, or 'inferred:<evidenceId>'
  kind: z.enum(['statement', 'evidence', 'inferred']),
  by: z.string().optional(),                // speaker for statements
  text: z.string().optional(),
});
export const PathStep = z.object({ from: RoomId, to: RoomId });
export const Violation = z.object({
  anchor: z.string().optional(), slot: Slot.optional(), room: RoomId.optional(),
  needed: z.number().optional(), available: z.number().optional(),
  path: z.array(RoomId).optional(), reason: z.string().optional(),
});

// ---- reasoning tools: play graph only ----
const base = { playerId: PlayerId, caseId: CaseId };
export const TOOLS = {
  getBoard: {
    input: z.object({ ...base }),
    output: z.object({
      tick: z.number().int(), window: z.array(Slot).nullable(),
      statements: z.array(z.object({ id: z.string(), claimId: z.string(), by: PersonId, kind: z.string(), subject: PersonId.optional(), slot: Slot.optional(), room: RoomId.optional(), text: z.string(), tick: z.number() })),
      evidence: z.array(z.object({ id: z.string(), room: RoomId, title: z.string(), text: z.string() })),
      flags: z.array(z.object({ id: z.string(), kind: z.string(), refs: z.array(z.string()), note: z.string(), by: z.enum(['player', 'inspector']) })),
      hypotheses: z.array(z.object({ id: z.string(), text: z.string(), person: PersonId.optional(), confidence: z.number(), by: z.enum(['player', 'inspector']) })),
      knownRelations: z.array(z.object({ id: z.string(), from: z.string(), to: z.string(), type: z.string(), text: z.string() })),
      hiddenEdgeKnown: z.boolean(), baitsLeft: z.number().int(), searchedRooms: z.array(RoomId),
    }),
  },
  findContradictions: {
    input: z.object({ ...base }),
    output: z.object({ pairs: z.array(z.object({ a: SrcRef, b: SrcRef, subject: PersonId, slot: Slot, roomA: RoomId, roomB: RoomId })) }),
  },
  findRehearsedAlibis: {
    input: z.object({ ...base }),
    output: z.object({ groups: z.array(z.object({ slot: Slot, room: RoomId, detail: z.string(), people: z.array(PersonId), claimIds: z.array(z.string()) })) }),
  },
  findImpossibleMoves: {
    input: z.object({ ...base }),
    output: z.object({ moves: z.array(z.object({ person: PersonId, from: SrcRef, to: SrcRef, needed: z.number(), available: z.number(), path: z.array(RoomId) })) }),
  },
  checkFeasibility: {     // could this person have been in this room at this slot? (hard anchors + map only)
    input: z.object({ ...base, person: PersonId, slot: Slot, room: RoomId }),
    output: z.object({ feasible: z.boolean(), reachable: z.boolean(), violations: z.array(Violation) }),
  },
  whoCouldHave: {         // elimination: who could have performed the act described by this evidence?
    input: z.object({ ...base, evidenceId: z.string() }),
    output: z.object({
      status: z.enum(['ok', 'not_an_act']),
      candidates: z.array(z.object({ person: PersonId, feasible: z.boolean(), violations: z.array(Violation) })),
      survivors: z.array(PersonId),
      inferredAnchor: z.object({ person: PersonId, slot: Slot, room: RoomId }).nullable(),
    }),
  },
  motivePaths: {          // up to 3 shortest relationship paths from a person to the victim over KNOWN relations
    input: z.object({ ...base, person: PersonId }),
    output: z.object({ status: z.enum(['known', 'no_path_known']), paths: z.array(z.object({ hops: z.array(z.object({ relationId: z.string(), type: z.string(), text: z.string() })), length: z.number() })) }),
  },
  alibiSupport: {         // who vouches for the room this person claims at this slot, and are they reliable?
    input: z.object({ ...base, person: PersonId, slot: Slot }),
    output: z.object({ claimedRoom: RoomId.nullable(), supporters: z.array(z.object({ by: PersonId, claimId: z.string(), reliable: z.boolean(), reason: z.string().optional() })), supported: z.boolean() }),
  },
  flag: {                 // board write
    input: z.object({ ...base, kind: z.enum(['contradiction', 'rehearsed', 'impossible', 'cleared', 'inferred', 'slip']), refs: z.array(z.string()).min(1), note: z.string().max(300), by: z.enum(['player', 'inspector']).default('player') }),
    output: z.object({ flagId: z.string() }),
  },
  hypothesize: {          // board write
    input: z.object({ ...base, text: z.string().max(300), person: PersonId.optional(), confidence: z.number().min(0).max(1), supportedBy: z.array(z.string()), by: z.enum(['player', 'inspector']).default('player') }),
    output: z.object({ hypothesisId: z.string() }),
  },
} as const;

// ---- game actions: read the truth graph; UI/API only ----
export const ACTIONS = {
  start: {
    input: z.object({ playerId: PlayerId, caseId: CaseId, reset: z.boolean().default(false) }),
    output: z.object({
      caseId: CaseId, level: z.number(), title: z.string(), tagline: z.string(), briefing: z.string(), hints: z.array(z.string()),
      slots: z.array(z.string()).length(8),
      rooms: z.array(z.object({ id: RoomId, name: z.string() })),
      edges: z.array(z.object({ a: RoomId, b: RoomId, state: z.enum(['open', 'locked']) })),     // hidden edges never sent
      people: z.array(z.object({ id: PersonId, name: z.string(), role: z.string(), victim: z.boolean() })),
      crimeScene: RoomId, publicWindow: z.array(Slot), baitsAllowed: z.number().int(), arcClue: z.string().nullable(),
    }),
  },
  ask: {
    input: z.object({ playerId: PlayerId, caseId: CaseId, suspectId: PersonId, topic: Topic, slot: Slot.optional(), about: PersonId.optional() }),
    output: z.object({
      reply: z.string(), source: z.enum(['llm', 'template_fallback']),
      firewall: z.object({ passed: z.boolean(), violations: z.array(z.string()) }),
      newStatements: z.array(z.object({ id: z.string(), claimId: z.string(), by: PersonId, kind: z.string(), subject: PersonId.optional(), slot: Slot.optional(), room: RoomId.optional(), text: z.string() })),
      observation: z.string().nullable(),     // a tell, phrased as something the Consultant noticed (never says if it is reliable)
      status: z.enum(['answered', 'nothing_new']),
    }),
  },
  search: {
    input: z.object({ playerId: PlayerId, caseId: CaseId, roomId: RoomId }),
    output: z.object({
      found: z.array(z.object({ id: z.string(), title: z.string(), text: z.string() })),
      revealedEdge: z.boolean(), windowChanged: z.array(Slot).nullable(), inferred: z.array(z.object({ person: PersonId, slot: Slot, room: RoomId })),
    }),
  },
  useBait: {
    input: z.object({ playerId: PlayerId, caseId: CaseId, baitId: z.string() }),
    output: z.object({
      outcome: z.enum(['slip', 'ambiguous', 'nothing']),
      reactions: z.array(z.object({ person: PersonId, text: z.string(), observation: z.string().nullable() })),
      newStatements: z.array(z.object({ id: z.string(), by: PersonId, text: z.string() })),
      baitsLeft: z.number().int(),
    }),
  },
  accuse: {
    input: z.object({ playerId: PlayerId, caseId: CaseId, persons: z.array(PersonId).min(1).max(4) }),
    output: z.object({
      result: z.enum(['full', 'partial', 'wrong']), wrongLeft: z.number().int(), levelOver: z.boolean(), stars: z.number().int().min(0).max(3),
      revealed: z.object({ culprits: z.array(PersonId), method: z.string(), weapon: z.string() }).nullable(),   // only when the level is over
      replay: z.array(z.object({ title: z.string(), detail: z.string(), refs: z.array(z.string()), path: z.array(z.string()) })),
      found: z.array(z.string()), missed: z.array(z.string()),       // proof items, as human sentences
    }),
  },
} as const;

// ---- Inspector stream events (SSE) ----
export const InspectorEvent = z.discriminatedUnion('type', [
  z.object({ type: z.literal('tool_call'), tool: z.string(), args: z.record(z.string(), z.unknown()) }),
  z.object({ type: z.literal('tool_result'), tool: z.string(), summary: z.string(), rows: z.number(), ms: z.number(), highlight: z.array(z.string()) }),
  z.object({ type: z.literal('flag'), flagId: z.string(), kind: z.string(), note: z.string() }),
  z.object({ type: z.literal('hypothesis'), hypothesisId: z.string(), text: z.string(), confidence: z.number() }),
  z.object({ type: z.literal('message'), text: z.string() }),
  z.object({ type: z.literal('done'), steps: z.number(), source: z.enum(['llm', 'deterministic', 'recorded']) }),
]);
```

## HTTP

`POST /api/tool/{name}` for `TOOLS` (validates with `TOOLS[name].input`, returns an envelope, HTTP 200 for any envelope). Actions have their own routes (`/api/ask`, `/api/search`, `/api/bait`, `/api/accuse`, `/api/start`). `POST /api/inspector` takes `{playerId, caseId, mode: 'assist' | 'cold_case', question?}` and streams `InspectorEvent`s.

## MCP

`mcp/server.ts` registers one MCP tool per entry of `TOOLS` **except the board writes** (`flag`, `hypothesize` are disabled by default; enable with `ALIBI_MCP_WRITE=1`), using the same zod input schemas. Plain one-sentence descriptions:

| Tool | Description |
| --- | --- |
| getBoard | Return everything the player has discovered in a case. |
| findContradictions | List pairs of statements or evidence that cannot both be true. |
| findRehearsedAlibis | Find statements from different people that share identical details. |
| findImpossibleMoves | Find people whose placements require travelling faster than the map allows. |
| checkFeasibility | Could this person have been in this room at this time, given hard evidence and the map? |
| whoCouldHave | Of the people allowed to do an act, who could physically have done it? |
| motivePaths | Show known relationship paths from a person to the victim. |
| alibiSupport | Who vouches for this person's claimed location, and are they reliable? |

An MCP session starts with `{playerId, caseId}` from the client config (`ALIBI_MCP_PLAYER`, `ALIBI_MCP_CASE`) so the external agent only reads that one play graph. Document the client config JSON in the README.

## The recorded cold-case run

`cases/<case>.run.json` is an array of `{tool, args}` steps plus the narration lines. Cold-case mode loads a pre-filled board (a saved list of claim ids and evidence ids, applied through the normal write path), then **re-executes each recorded tool call live** and streams the real results. The UI labels it "Recorded run, re-executed live against the graph". If a re-executed result differs from the recording, the test suite must fail (this is an oracle-parity check).
