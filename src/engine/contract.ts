import { z } from 'zod';

export const Id = z.string().regex(/^[a-z0-9][a-z0-9_-]{0,47}$/);
export const PlayerId = Id;
export const CaseId = Id;
export const PersonId = Id;
export const RoomId = Id;
export const Slot = z.number().int().min(1).max(8);
export const Topic = z.enum(['whereabouts', 'witness', 'motive', 'victim', 'general', 'evidence']);

export const ErrorCode = z.enum([
  'BAD_ARGS',
  'UNKNOWN_PLAY',
  'UNKNOWN_CASE',
  'UNKNOWN_PERSON',
  'UNKNOWN_ROOM',
  'UNKNOWN_EVIDENCE',
  'NO_BAITS_LEFT',
  'ALREADY_SEARCHED',
  'LEVEL_OVER',
  'LLM_UNAVAILABLE',
  'DB_UNAVAILABLE',
  'INTERNAL',
]);

export const TraceStep = z.object({
  agent: z.enum(['suspect', 'inspector', 'engine', 'verdict']),
  tool: z.string(),
  queryId: z.string().optional(), // e.g. 'Q30_contradictions'
  args: z.record(z.string(), z.unknown()), // sanitised; never keys
  rows: z.number().int(),
  ms: z.number(),
});

export type TraceStepType = z.infer<typeof TraceStep>;

export type Envelope<T> =
  | { ok: true; data: T; trace: z.infer<typeof TraceStep>[] }
  | {
      ok: false;
      error: { code: z.infer<typeof ErrorCode>; message: string; hint?: string };
      trace: z.infer<typeof TraceStep>[];
    };

// ---- shared shapes ----
export const SrcRef = z.object({
  // anything that can appear in a contradiction
  src: z.string(), // claim id, evidence id, or 'inferred:<evidenceId>'
  kind: z.enum(['statement', 'evidence', 'inferred']),
  by: z.string().optional(), // speaker for statements
  text: z.string().optional(),
});

export const PathStep = z.object({ from: RoomId, to: RoomId });
export const Violation = z.object({
  anchor: z.string().optional(),
  slot: Slot.optional(),
  room: RoomId.optional(),
  needed: z.number().optional(),
  available: z.number().optional(),
  path: z.array(RoomId).optional(),
  reason: z.string().optional(),
});

// ---- reasoning tools: play graph only ----
const base = { playerId: PlayerId, caseId: CaseId };

export const TOOLS = {
  getBoard: {
    input: z.object({ ...base }),
    output: z.object({
      tick: z.number().int(),
      window: z.array(Slot).nullable(),
      statements: z.array(
        z.object({
          id: z.string(),
          claimId: z.string(),
          by: PersonId,
          kind: z.string(),
          subject: PersonId.optional(),
          slot: Slot.optional(),
          room: RoomId.optional(),
          text: z.string(),
          tick: z.number(),
        })
      ),
      evidence: z.array(
        z.object({ id: z.string(), room: RoomId, title: z.string(), text: z.string() })
      ),
      flags: z.array(
        z.object({
          id: z.string(),
          kind: z.string(),
          refs: z.array(z.string()),
          note: z.string(),
          by: z.enum(['player', 'inspector']),
        })
      ),
      hypotheses: z.array(
        z.object({
          id: z.string(),
          text: z.string(),
          person: PersonId.optional(),
          confidence: z.number(),
          by: z.enum(['player', 'inspector']),
        })
      ),
      knownRelations: z.array(
        z.object({
          id: z.string(),
          from: z.string(),
          to: z.string(),
          type: z.string(),
          text: z.string(),
        })
      ),
      hiddenEdgeKnown: z.boolean(),
      baitsLeft: z.number().int(),
      searchedRooms: z.array(RoomId),
    }),
  },
  findContradictions: {
    input: z.object({ ...base }),
    output: z.object({
      pairs: z.array(
        z.object({
          a: SrcRef,
          b: SrcRef,
          subject: PersonId,
          slot: Slot,
          roomA: RoomId,
          roomB: RoomId,
        })
      ),
    }),
  },
  findRehearsedAlibis: {
    input: z.object({ ...base }),
    output: z.object({
      groups: z.array(
        z.object({
          slot: Slot,
          room: RoomId,
          detail: z.string(),
          people: z.array(PersonId),
          claimIds: z.array(z.string()),
        })
      ),
    }),
  },
  findImpossibleMoves: {
    input: z.object({ ...base }),
    output: z.object({
      moves: z.array(
        z.object({
          person: PersonId,
          from: SrcRef,
          to: SrcRef,
          needed: z.number(),
          available: z.number(),
          path: z.array(RoomId),
        })
      ),
    }),
  },
  checkFeasibility: {
    // could this person have been in this room at this slot? (hard anchors + map only)
    input: z.object({ ...base, person: PersonId, slot: Slot, room: RoomId }),
    output: z.object({
      feasible: z.boolean(),
      reachable: z.boolean(),
      violations: z.array(Violation),
    }),
  },
  whoCouldHave: {
    // elimination: who could have performed the act described by this evidence?
    input: z.object({ ...base, evidenceId: z.string() }),
    output: z.object({
      status: z.enum(['ok', 'not_an_act']),
      candidates: z.array(
        z.object({ person: PersonId, feasible: z.boolean(), violations: z.array(Violation) })
      ),
      survivors: z.array(PersonId),
      inferredAnchor: z.object({ person: PersonId, slot: Slot, room: RoomId }).nullable(),
    }),
  },
  motivePaths: {
    // up to 3 shortest relationship paths from a person to the victim over KNOWN relations
    input: z.object({ ...base, person: PersonId }),
    output: z.object({
      status: z.enum(['known', 'no_path_known']),
      paths: z.array(
        z.object({
          hops: z.array(
            z.object({ relationId: z.string(), type: z.string(), text: z.string() })
          ),
          length: z.number(),
        })
      ),
    }),
  },
  alibiSupport: {
    // who vouches for the room this person claims at this slot, and are they reliable?
    input: z.object({ ...base, person: PersonId, slot: Slot }),
    output: z.object({
      claimedRoom: RoomId.nullable(),
      supporters: z.array(
        z.object({
          by: PersonId,
          claimId: z.string(),
          reliable: z.boolean(),
          reason: z.string().optional(),
        })
      ),
      supported: z.boolean(),
    }),
  },
  flag: {
    // board write
    input: z.object({
      ...base,
      kind: z.enum(['contradiction', 'rehearsed', 'impossible', 'cleared', 'inferred', 'slip']),
      refs: z.array(z.string()).min(1),
      note: z.string().max(300),
      by: z.enum(['player', 'inspector']).default('player'),
    }),
    output: z.object({ flagId: z.string() }),
  },
  hypothesize: {
    // board write
    input: z.object({
      ...base,
      text: z.string().max(300),
      person: PersonId.optional(),
      confidence: z.number().min(0).max(1),
      supportedBy: z.array(z.string()),
      by: z.enum(['player', 'inspector']).default('player'),
    }),
    output: z.object({ hypothesisId: z.string() }),
  },
} as const;

// ---- game actions: read the truth graph; UI/API only ----
export const ACTIONS = {
  start: {
    input: z.object({
      playerId: PlayerId,
      caseId: CaseId,
      reset: z.boolean().default(false),
    }),
    output: z.object({
      caseId: CaseId,
      level: z.number(),
      title: z.string(),
      tagline: z.string(),
      briefing: z.string(),
      hints: z.array(z.string()),
      slots: z.array(z.string()).length(8),
      rooms: z.array(z.object({ id: RoomId, name: z.string() })),
      edges: z.array(
        z.object({ a: RoomId, b: RoomId, state: z.enum(['open', 'locked']) })
      ), // hidden edges never sent
      people: z.array(
        z.object({ id: PersonId, name: z.string(), role: z.string(), victim: z.boolean() })
      ),
      crimeScene: RoomId,
      publicWindow: z.array(Slot),
      baitsAllowed: z.number().int(),
      arcClue: z.string().nullable(),
    }),
  },
  ask: {
    input: z.object({
      playerId: PlayerId,
      caseId: CaseId,
      suspectId: PersonId,
      topic: Topic,
      slot: Slot.optional(),
      about: PersonId.optional(),
    }),
    output: z.object({
      reply: z.string(),
      source: z.enum(['llm', 'template_fallback']),
      firewall: z.object({ passed: z.boolean(), violations: z.array(z.string()) }),
      newStatements: z.array(
        z.object({
          id: z.string(),
          claimId: z.string(),
          by: PersonId,
          kind: z.string(),
          subject: PersonId.optional(),
          slot: Slot.optional(),
          room: RoomId.optional(),
          text: z.string(),
        })
      ),
      observation: z.string().nullable(), // a tell, phrased as something the Consultant noticed (never says if it is reliable)
      status: z.enum(['answered', 'nothing_new']),
    }),
  },
  search: {
    input: z.object({ playerId: PlayerId, caseId: CaseId, roomId: RoomId }),
    output: z.object({
      found: z.array(z.object({ id: z.string(), title: z.string(), text: z.string() })),
      revealedEdge: z.boolean(),
      windowChanged: z.array(Slot).nullable(),
      inferred: z.array(z.object({ person: PersonId, slot: Slot, room: RoomId })),
    }),
  },
  useBait: {
    input: z.object({ playerId: PlayerId, caseId: CaseId, baitId: z.string() }),
    output: z.object({
      outcome: z.enum(['slip', 'ambiguous', 'nothing']),
      reactions: z.array(
        z.object({ person: PersonId, text: z.string(), observation: z.string().nullable() })
      ),
      newStatements: z.array(z.object({ id: z.string(), by: PersonId, text: z.string() })),
      baitsLeft: z.number().int(),
    }),
  },
  accuse: {
    input: z.object({
      playerId: PlayerId,
      caseId: CaseId,
      persons: z.array(PersonId).min(1).max(4),
    }),
    output: z.object({
      result: z.enum(['full', 'partial', 'wrong']),
      wrongLeft: z.number().int(),
      levelOver: z.boolean(),
      stars: z.number().int().min(0).max(3),
      revealed: z
        .object({ culprits: z.array(PersonId), method: z.string(), weapon: z.string() })
        .nullable(), // only when the level is over
      replay: z.array(
        z.object({
          title: z.string(),
          detail: z.string(),
          refs: z.array(z.string()),
          path: z.array(z.string()),
        })
      ),
      found: z.array(z.string()),
      missed: z.array(z.string()), // proof items, as human sentences
    }),
  },
} as const;

// ---- Inspector stream events (SSE) ----
export const InspectorEvent = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('tool_call'),
    tool: z.string(),
    args: z.record(z.string(), z.unknown()),
  }),
  z.object({
    type: z.literal('tool_result'),
    tool: z.string(),
    summary: z.string(),
    rows: z.number(),
    ms: z.number(),
    highlight: z.array(z.string()),
  }),
  z.object({
    type: z.literal('flag'),
    flagId: z.string(),
    kind: z.string(),
    note: z.string(),
  }),
  z.object({
    type: z.literal('hypothesis'),
    hypothesisId: z.string(),
    text: z.string(),
    confidence: z.number(),
  }),
  z.object({ type: z.literal('message'), text: z.string() }),
  z.object({
    type: z.literal('done'),
    steps: z.number(),
    source: z.enum(['llm', 'deterministic', 'recorded']),
  }),
]);
