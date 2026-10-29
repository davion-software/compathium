import { describe, expect, it } from 'vite-plus/test';
import { InboundMessage, OutboundMessage } from './index.ts';
import { inboundMessage, outboundMessage, uuid } from './fixtures.ts';

describe('InboundMessage', () => {
  it('parses a valid message', () => {
    expect(InboundMessage.safeParse(inboundMessage()).success).toBe(true);
  });

  it.each([
    'organization_id',
    'channel_account_id',
    'provider_message_id',
    'external_id',
    'correlation_id',
  ])('rejects a missing %s', (key) => {
    const { [key as keyof ReturnType<typeof inboundMessage>]: _omitted, ...rest } =
      inboundMessage();
    expect(InboundMessage.safeParse(rest).success).toBe(false);
  });

  it('requires a non-empty provider_message_id (input idempotency key)', () => {
    expect(InboundMessage.safeParse({ ...inboundMessage(), provider_message_id: '' }).success).toBe(
      false,
    );
  });

  it('rejects an unknown content_type and a malformed timestamp', () => {
    expect(InboundMessage.safeParse({ ...inboundMessage(), content_type: 'video' }).success).toBe(
      false,
    );
    expect(
      InboundMessage.safeParse({ ...inboundMessage(), provider_timestamp: 'yesterday' }).success,
    ).toBe(false);
  });

  it('rejects unknown keys such as a raw provider payload', () => {
    expect(InboundMessage.safeParse({ ...inboundMessage(), raw_payload: {} }).success).toBe(false);
  });
});

describe('OutboundMessage', () => {
  it('parses an AI message without author', () => {
    expect(OutboundMessage.safeParse(outboundMessage()).success).toBe(true);
  });

  it('parses a human message with author and client_request_id', () => {
    const human = {
      ...outboundMessage(),
      sender_type: 'human',
      author_user_id: uuid(),
      client_request_id: uuid(),
    };
    expect(OutboundMessage.safeParse(human).success).toBe(true);
  });

  it('rejects contact as sender: customers do not receive their own messages', () => {
    expect(
      OutboundMessage.safeParse({ ...outboundMessage(), sender_type: 'contact' }).success,
    ).toBe(false);
  });

  it('requires author_user_id if and only if the sender is human', () => {
    const humanWithoutAuthor = {
      ...outboundMessage(),
      sender_type: 'human',
      client_request_id: uuid(),
    };
    const aiWithAuthor = { ...outboundMessage(), author_user_id: uuid() };
    expect(OutboundMessage.safeParse(humanWithoutAuthor).success).toBe(false);
    expect(OutboundMessage.safeParse(aiWithAuthor).success).toBe(false);
  });

  it('requires client_request_id for human output', () => {
    const human = { ...outboundMessage(), sender_type: 'human', author_user_id: uuid() };
    expect(OutboundMessage.safeParse(human).success).toBe(false);
  });

  it('requires the internal message_id used as provider idempotency key', () => {
    const { message_id: _omitted, ...rest } = outboundMessage();
    expect(OutboundMessage.safeParse(rest).success).toBe(false);
    expect(
      OutboundMessage.safeParse({ ...outboundMessage(), message_id: 'not-a-uuid' }).success,
    ).toBe(false);
  });
});
