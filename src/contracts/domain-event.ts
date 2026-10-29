import { z } from 'zod';
import { ActorType, Id, OrganizationId, Timestamp } from './common.ts';

// MVP_PLAN §0 lists the event types. The envelope comes from `domain_events` in DATABASE_DESIGN §7.
// TODO(DAV-253): DATABASE_DESIGN §7 also lists conversation.created, conversation.ai_paused,
// conversation.ai_resumed and conversation.handed_off ("necesarios para explicar sus métricas";
// the Handoffs KPI needs the manual one). They are NOT in §0, so they are not accepted here.
// TODO(DAV-253): §7 describes payloads only in prose ("Usuario anterior/nuevo", "Run, motivo,
// resumen"), without field names. `payload` stays an open record rather than guessing a schema
// per type.

export const DomainEventType = z.enum([
  'message.received',
  'message.sent',
  'message.delivered',
  'message.failed',
  'conversation.assigned',
  'conversation.resolved',
  'ai.run.completed',
  'ai.run.handed_off',
]);
export type DomainEventType = z.infer<typeof DomainEventType>;

export const DomainEvent = z
  .strictObject({
    id: Id,
    organization_id: OrganizationId,
    conversation_id: Id,
    /** Per-conversation, strictly positive, assigned under the conversation lock. */
    sequence: z.number().int().positive(),
    type: DomainEventType,
    schema_version: z.number().int().positive(),
    message_id: Id.nullable(),
    ai_run_id: Id.nullable(),
    actor_type: ActorType,
    actor_user_id: Id.nullable(),
    occurred_at: Timestamp,
    recorded_at: Timestamp,
    correlation_id: Id,
    /** Idempotency key: repeating the same command must not create a second event. */
    dedupe_key: z.string().min(1),
    payload: z.record(z.string(), z.unknown()),
  })
  .superRefine((event, ctx) => {
    if (event.type.startsWith('message.') && event.message_id === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['message_id'],
        message: `${event.type} requires message_id`,
      });
    }
    if (event.type.startsWith('ai.run.') && event.ai_run_id === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['ai_run_id'],
        message: `${event.type} requires ai_run_id`,
      });
    }
  });
export type DomainEvent = z.infer<typeof DomainEvent>;
