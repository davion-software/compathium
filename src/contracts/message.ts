import { z } from 'zod';
import { ActorType, ContentType, Id, OrganizationId, Timestamp } from './common.ts';

// MVP_PLAN §0 names InboundMessage / OutboundMessage without listing fields. The fields below are
// taken from `messages` in DATABASE_DESIGN §6 and from the inbound flow in TECHNICAL_DESIGN.
// TODO(DAV-253): confirm that these are the intended channel-neutral fields; the plan lists none.
// TODO(DAV-253): attachments (`message_attachments`, phase 2) are not modelled because no file
// reference shape is defined. Until then "texto no vacío o al menos un adjunto"
// (DATABASE_DESIGN §6) cannot be enforced, so `body` is nullable and unchecked.
// TODO(DAV-253): DATABASE_DESIGN §6 has `messages.status`; it is left out because it is transport
// state owned by the persisted row, not part of the message handed to/from a channel adapter.

/**
 * A customer message normalised by a `ChannelAdapter`. No provider payload leaks past this contract.
 * `organization_id` is resolved server-side from a validated channel account, never from the client.
 */
export const InboundMessage = z.strictObject({
  organization_id: OrganizationId,
  channel_account_id: Id,
  /** Idempotency key for input: unique per (organization, channel account). */
  provider_message_id: z.string().min(1),
  /** The sender's identity in the channel account (`contact_identities.external_id`). */
  external_id: z.string().min(1),
  content_type: ContentType,
  body: z.string().nullable(),
  /** Original instant reported by the provider; never replaced by a retry's date. */
  provider_timestamp: Timestamp.nullable(),
  correlation_id: Id,
});
export type InboundMessage = z.infer<typeof InboundMessage>;

/** Who may author an outbound message. Contacts never do; internal notes are not outbound. */
export const OutboundSenderType = ActorType.extract(['human', 'ai', 'system']);
export type OutboundSenderType = z.infer<typeof OutboundSenderType>;

/**
 * A message to deliver to a customer. `message_id` is the internal id reused on every retry and
 * handed to the provider as the stable idempotency key (output idempotency, MVP_PLAN rules).
 */
export const OutboundMessage = z
  .strictObject({
    message_id: Id,
    organization_id: OrganizationId,
    conversation_id: Id,
    channel_account_id: Id,
    sender_type: OutboundSenderType,
    /** Present if and only if `sender_type = 'human'`. */
    author_user_id: Id.nullable(),
    /** Client-chosen id reused when the human retries; required for human output. */
    client_request_id: Id.nullable(),
    content_type: ContentType,
    body: z.string().nullable(),
    correlation_id: Id,
  })
  .superRefine((message, ctx) => {
    const isHuman = message.sender_type === 'human';
    if (isHuman !== (message.author_user_id !== null)) {
      ctx.addIssue({
        code: 'custom',
        path: ['author_user_id'],
        message: 'author_user_id must be present if and only if sender_type is human',
      });
    }
    if (isHuman && message.client_request_id === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['client_request_id'],
        message: 'client_request_id is required for human output',
      });
    }
  });
export type OutboundMessage = z.infer<typeof OutboundMessage>;
