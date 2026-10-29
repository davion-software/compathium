import { z } from 'zod';
import { HandoffReason, Id, OrganizationId, Timestamp } from './common.ts';

// MVP_PLAN §0: "Conversation + estados + ai_paused + assigned_to". Remaining fields come from
// `conversations` in DATABASE_DESIGN §6.
// TODO(DAV-253): §0 writes `assigned_to`; TECHNICAL_DESIGN says the detailed model uses
// `assigned_to_user_id` and that the plan's abbreviated names add no columns. The long name is used.
// TODO(DAV-253): the `pending` status is a design proposal (OPEN_QUESTIONS Q-06), not an accepted
// decision. §0 does not list the states; open | pending | resolved is the proposal's set.
// TODO(DAV-253): `automation_epoch` and `event_sequence` exist in DATABASE_DESIGN §6 but are
// concurrency internals, and the epoch design is still open (Q-07). Left out of the contract.

export const ConversationStatus = z.enum(['open', 'pending', 'resolved']);
export type ConversationStatus = z.infer<typeof ConversationStatus>;

export const Conversation = z
  .strictObject({
    id: Id,
    organization_id: OrganizationId,
    contact_id: Id,
    contact_identity_id: Id,
    channel_account_id: Id,
    status: ConversationStatus,
    assigned_to_user_id: Id.nullable(),
    ai_paused: z.boolean(),
    handoff_reason: HandoffReason.nullable(),
    /** Context for the person who takes the conversation. */
    handoff_summary: z.string().nullable(),
    last_message_at: Timestamp.nullable(),
    /** Anchor of the 24h WhatsApp window. */
    last_customer_message_at: Timestamp.nullable(),
    resolved_at: Timestamp.nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .superRefine((conversation, ctx) => {
    // DATA_MODEL invariant: assigned, handed-off or resolved conversations keep the AI paused.
    if (!conversation.ai_paused) {
      const reasons: [boolean, string, string][] = [
        [conversation.assigned_to_user_id !== null, 'assigned_to_user_id', 'assigned'],
        [conversation.handoff_reason !== null, 'handoff_reason', 'handed off'],
        [conversation.status === 'resolved', 'status', 'resolved'],
      ];
      for (const [applies, path, label] of reasons) {
        if (applies) {
          ctx.addIssue({
            code: 'custom',
            path: [path],
            message: `ai_paused must be true when the conversation is ${label}`,
          });
        }
      }
    }
    // DATABASE_DESIGN §6: resolved_at is present if and only if status = 'resolved'.
    if ((conversation.status === 'resolved') !== (conversation.resolved_at !== null)) {
      ctx.addIssue({
        code: 'custom',
        path: ['resolved_at'],
        message: 'resolved_at must be present if and only if status is resolved',
      });
    }
  });
export type Conversation = z.infer<typeof Conversation>;
