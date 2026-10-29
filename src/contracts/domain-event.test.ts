import { describe, expect, it } from 'vite-plus/test';
import { DomainEvent, DomainEventType } from './index.ts';
import { domainEvent, uuid } from './fixtures.ts';

describe('DomainEvent', () => {
  it('parses a valid event', () => {
    expect(DomainEvent.safeParse(domainEvent()).success).toBe(true);
  });

  it('accepts exactly the event types listed in MVP_PLAN §0', () => {
    expect(DomainEventType.options).toEqual([
      'message.received',
      'message.sent',
      'message.delivered',
      'message.failed',
      'conversation.assigned',
      'conversation.resolved',
      'ai.run.completed',
      'ai.run.handed_off',
    ]);
  });

  it('rejects an unknown type', () => {
    expect(DomainEvent.safeParse({ ...domainEvent(), type: 'conversation.created' }).success).toBe(
      false,
    );
  });

  it.each([
    'organization_id',
    'conversation_id',
    'sequence',
    'type',
    'correlation_id',
    'dedupe_key',
  ])('rejects a missing %s', (key) => {
    const { [key as keyof ReturnType<typeof domainEvent>]: _omitted, ...rest } = domainEvent();
    expect(DomainEvent.safeParse(rest).success).toBe(false);
  });

  it('rejects a non-positive sequence', () => {
    expect(DomainEvent.safeParse({ ...domainEvent(), sequence: 0 }).success).toBe(false);
  });

  it('requires message_id for message.* events', () => {
    const event = { ...domainEvent(), type: 'message.sent', actor_type: 'ai', actor_user_id: null };
    expect(DomainEvent.safeParse(event).success).toBe(false);
    expect(DomainEvent.safeParse({ ...event, message_id: uuid() }).success).toBe(true);
  });

  it('requires ai_run_id for ai.run.* events', () => {
    const event = {
      ...domainEvent(),
      type: 'ai.run.handed_off',
      actor_type: 'ai',
      actor_user_id: null,
    };
    expect(DomainEvent.safeParse(event).success).toBe(false);
    expect(DomainEvent.safeParse({ ...event, ai_run_id: uuid() }).success).toBe(true);
  });

  it('rejects unknown envelope keys', () => {
    expect(DomainEvent.safeParse({ ...domainEvent(), confidence: 0.5 }).success).toBe(false);
  });
});
