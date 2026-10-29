import { z } from 'zod';

// Field names follow MVP_PLAN §0 and the physical names in DATABASE_DESIGN.md (snake_case).
// TODO(DAV-253): DATABASE_DESIGN §2 says TypeScript properties "pueden usar camelCase", while
// MVP_PLAN §0 writes snake_case (ai_paused, agent_version_id). snake_case is used as-is until the
// owner decides the wire/property casing.

export const Id = z.uuid();

// ISO 8601 instants (timestamptz). Offsets are accepted; storage and comparison are by instant.
export const Timestamp = z.iso.datetime({ offset: true });

/** Every business contract carries a verified tenant (`organization` = workspace, ADR 0001). */
export const OrganizationId = Id;

export const ContentType = z.enum(['text', 'image', 'audio', 'document', 'unsupported']);
export type ContentType = z.infer<typeof ContentType>;

/** Who authored a message or caused an event. */
export const ActorType = z.enum(['contact', 'human', 'ai', 'system']);
export type ActorType = z.infer<typeof ActorType>;

/** MVP_PLAN §0 (AiRun): `none | partial | strong`. A category, never a percentage. */
export const EvidenceCoverage = z.enum(['none', 'partial', 'strong']);
export type EvidenceCoverage = z.infer<typeof EvidenceCoverage>;

/** MVP_PLAN §0 (AiRun): `no_evidence | intent | policy | schedule | manual`. */
export const HandoffReason = z.enum(['no_evidence', 'intent', 'policy', 'schedule', 'manual']);
export type HandoffReason = z.infer<typeof HandoffReason>;
