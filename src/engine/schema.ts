import { z } from 'zod';
import { CaseId, PersonId, RoomId, Slot, Topic } from './contract';

export const RoomSchema = z.object({
  id: RoomId,
  name: z.string(),
});

export const EdgeSchema = z.object({
  a: RoomId,
  b: RoomId,
  state: z.enum(['open', 'locked', 'hidden']),
  discoveredBy: z.string().optional(),
});

export const PersonSchema = z.object({
  id: PersonId,
  name: z.string(),
  role: z.string(),
  persona: z.string().optional(),
  victim: z.boolean().optional(),
});

export const TruthMurderSchema = z.object({
  slot: Slot,
  room: RoomId,
  weapon: z.string(),
  method: z.string(),
});

export const TruthSchema = z.object({
  murder: TruthMurderSchema,
  presence: z.record(PersonId, z.array(RoomId).length(8)),
  culprits: z.array(PersonId).min(1),
  motive: z.record(PersonId, z.boolean()),
});

export const RelationSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  type: z.string(),
  text: z.string(),
});

export const ClaimSchema = z.object({
  id: z.string(),
  by: PersonId,
  kind: z.enum(['location', 'saw', 'relation', 'fact']),
  text: z.string(),
  subject: PersonId.optional(),
  slot: Slot.optional(),
  room: RoomId.optional(),
  detail: z.string().optional(),
  relation: z.string().optional(),
  truth: z.boolean().optional(),
  topics: z.array(Topic),
  requires: z.array(z.string()).optional(),
  priority: z.number().int().optional(),
});

export const EvidenceAssertSchema = z.object({
  subject: PersonId,
  slot: Slot,
  room: RoomId,
});

export const EvidenceActSchema = z.object({
  slot: Slot,
  room: RoomId,
  restrictsTo: z.array(PersonId),
});

export const EvidenceSchema = z.object({
  id: z.string(),
  room: RoomId,
  title: z.string(),
  text: z.string(),
  asserts: z.array(EvidenceAssertSchema).optional(),
  window: z.array(Slot).optional(),
  windowKind: z.enum(['suggests', 'revises']).optional(),
  relation: z.string().optional(),
  revealsEdge: z.string().optional(),
  knowers: z.array(PersonId).optional(),
  act: EvidenceActSchema.optional(),
});

export const FactSchema = z.object({
  id: z.string(),
  text: z.string(),
  knownBy: z.array(PersonId),
});

export const BaitSchema = z.object({
  id: z.string(),
  announcement: z.string(),
  fact: z.string(),
  slip: z.string(),
  neutral: z.string(),
});

export const TellSchema = z.object({
  claim: z.string(),
  text: z.string(),
  reliable: z.boolean(),
});

export const SolutionClearedEntrySchema = z.object({
  slot: Slot,
  room: RoomId,
  anchors: z.array(z.string()),
});

export const SolutionEliminationEntrySchema = z.union([
  z.object({
    evidence: z.string(),
    survivor: PersonId,
  }),
  z.object({
    evidence: z.string(),
    survivors: z.array(PersonId),
  }),
]);

export const SolutionProofSchema = z
  .object({
    contradictions: z.array(z.tuple([z.string(), z.string()])),
    rehearsed: z.array(z.array(z.string())),
    impossible: z.array(
      z.object({
        person: PersonId,
        claims: z.tuple([z.string(), z.string()]),
      })
    ),
    sharpBaits: z
      .array(
        z.object({
          bait: z.string(),
          person: PersonId,
        })
      )
      .optional(),
    eliminations: z.array(SolutionEliminationEntrySchema).optional(),
    motive: z.array(z.string()).optional(),
  })
  .passthrough();

export const SolutionSchema = z.object({
  culprits: z.array(PersonId),
  windowFinal: z.array(Slot).optional(),
  proof: SolutionProofSchema,
  cleared: z.record(PersonId, SolutionClearedEntrySchema).optional(),
  motive: z.record(PersonId, z.string()).optional(),
});

export const CaseSchema = z.object({
  schema: z.number().optional(),
  id: CaseId,
  level: z.number().int().min(1),
  title: z.string(),
  tagline: z.string(),
  briefing: z.string(),
  publicWindow: z.array(Slot).optional(),
  hints: z.array(z.string()),
  arcClue: z.string().nullable().optional(),
  baitsAllowed: z.number().int().min(0),
  slots: z.array(z.string()).length(8),
  rooms: z.array(RoomSchema),
  edges: z.array(EdgeSchema),
  people: z.array(PersonSchema),
  truth: TruthSchema,
  relations: z.array(RelationSchema),
  claims: z.array(ClaimSchema),
  evidence: z.array(EvidenceSchema),
  facts: z.array(FactSchema),
  baits: z.array(BaitSchema),
  tells: z.array(TellSchema).optional(),
  solution: SolutionSchema,
});

export type CaseType = z.infer<typeof CaseSchema>;
export type RoomType = z.infer<typeof RoomSchema>;
export type EdgeType = z.infer<typeof EdgeSchema>;
export type PersonType = z.infer<typeof PersonSchema>;
export type ClaimType = z.infer<typeof ClaimSchema>;
export type EvidenceType = z.infer<typeof EvidenceSchema>;
export type FactType = z.infer<typeof FactSchema>;
export type BaitType = z.infer<typeof BaitSchema>;
export type RelationType = z.infer<typeof RelationSchema>;
