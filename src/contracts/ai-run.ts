import { z } from 'zod';
import { EvidenceCoverage, HandoffReason, Id, OrganizationId } from './common.ts';

// MVP_PLAN §0 defines AiRun as: agent_version_id, sources[], evidence_coverage, handoff_reason,
// latency_ms, cost. There is deliberately NO numeric `confidence`: handoff is decided by intent,
// evidence and schedule (ADR 0004), never by a self-reported number. The object is strict so a
// `confidence` key is rejected instead of silently stripped.
//
// Only `id` and `organization_id` are added to those six (identity and verified tenant).
// TODO(DAV-253): DATABASE_DESIGN §9 `ai_runs` has more columns (mode, status, conversation_id,
// trigger_message_id, response_message_id, token counts, provider/model, correlation_id, ...).
// They are omitted because §0 does not list them. Without `mode`/`status` the live-vs-simulation
// and completed/handed_off rules cannot be expressed here; confirm the intended cut.

/**
 * One source evidence entry. §0 only says `sources[]`.
 * TODO(DAV-253): shape taken from `ai_run_sources` (DATABASE_DESIGN §9). `retrieval_score` is
 * deliberately left out: it is a numeric similarity and the simulator must show sources, coverage
 * and reason, "no un porcentaje". Confirm whether it belongs in the contract.
 */
export const AiRunSource = z.strictObject({
  chunk_id: Id,
  rank: z.number().int().positive(),
  cited: z.boolean(),
  title_snapshot: z.string(),
  excerpt_snapshot: z.string(),
});
export type AiRunSource = z.infer<typeof AiRunSource>;

// TODO(DAV-253): `cost` is a decimal string, not a number, because DATABASE_DESIGN §2 forbids float
// money (numeric(18,8)) and JSON numbers are floats. The string form and `cost_currency` (required
// by "la moneda acompaña cualquier importe presente", §9) are not in §0; confirm both.
const Cost = z
  .string()
  .regex(/^\d{1,10}(\.\d{1,8})?$/, 'cost must be a non-negative decimal with up to 8 decimals');

export const AiRun = z
  .strictObject({
    id: Id,
    organization_id: OrganizationId,
    /** TODO(DAV-253): nullable as in `ai_runs`, where a simulation may run a draft snapshot instead. */
    agent_version_id: Id.nullable(),
    sources: z.array(AiRunSource),
    /** Null until evidence has been evaluated, or when intent/policy cut the run before retrieval. */
    evidence_coverage: EvidenceCoverage.nullable(),
    handoff_reason: HandoffReason.nullable(),
    /** Unknown latency is null, not 0. */
    latency_ms: z.number().int().nonnegative().nullable(),
    /** Unknown cost is null, not 0. */
    cost: Cost.nullable(),
    cost_currency: z.string().min(1).nullable(),
  })
  .superRefine((run, ctx) => {
    if ((run.cost === null) !== (run.cost_currency === null)) {
      ctx.addIssue({
        code: 'custom',
        path: ['cost_currency'],
        message: 'cost and cost_currency must be both present or both null',
      });
    }
  });
export type AiRun = z.infer<typeof AiRun>;
