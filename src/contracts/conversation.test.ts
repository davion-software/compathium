import { describe, expect, it } from 'vite-plus/test';
import { Conversation } from './index.ts';
import { conversation, NOW, uuid } from './fixtures.ts';

describe('Conversation', () => {
  it('parses an open conversation with the AI active', () => {
    expect(Conversation.safeParse(conversation()).success).toBe(true);
  });

  it.each(['open', 'pending', 'resolved'])('accepts status %s', (status) => {
    const base = { ...conversation(), ai_paused: true };
    const extra = status === 'resolved' ? { resolved_at: NOW } : {};
    expect(Conversation.safeParse({ ...base, ...extra, status }).success).toBe(true);
  });

  it('rejects an unknown status', () => {
    expect(Conversation.safeParse({ ...conversation(), status: 'closed' }).success).toBe(false);
  });

  it('rejects a missing ai_paused or status', () => {
    const { ai_paused: _a, ...noPause } = conversation();
    const { status: _s, ...noStatus } = conversation();
    expect(Conversation.safeParse(noPause).success).toBe(false);
    expect(Conversation.safeParse(noStatus).success).toBe(false);
  });

  it('accepts an assigned conversation only with the AI paused', () => {
    const assigned = { ...conversation(), status: 'pending', assigned_to_user_id: uuid() };
    expect(Conversation.safeParse({ ...assigned, ai_paused: true }).success).toBe(true);
    expect(Conversation.safeParse({ ...assigned, ai_paused: false }).success).toBe(false);
  });

  it('requires the AI paused when a handoff reason is set', () => {
    const handedOff = {
      ...conversation(),
      status: 'pending',
      handoff_reason: 'intent',
      handoff_summary: 'Pide una persona',
    };
    expect(Conversation.safeParse({ ...handedOff, ai_paused: true }).success).toBe(true);
    expect(Conversation.safeParse({ ...handedOff, ai_paused: false }).success).toBe(false);
  });

  it('rejects an unknown handoff reason', () => {
    expect(
      Conversation.safeParse({
        ...conversation(),
        ai_paused: true,
        handoff_reason: 'low_confidence',
      }).success,
    ).toBe(false);
  });

  it('requires resolved_at if and only if status is resolved, with the AI paused', () => {
    const resolved = { ...conversation(), status: 'resolved', ai_paused: true };
    expect(Conversation.safeParse({ ...resolved, resolved_at: NOW }).success).toBe(true);
    expect(Conversation.safeParse({ ...resolved, resolved_at: null }).success).toBe(false);
    expect(Conversation.safeParse({ ...conversation(), resolved_at: NOW }).success).toBe(false);
    expect(
      Conversation.safeParse({ ...resolved, resolved_at: NOW, ai_paused: false }).success,
    ).toBe(false);
  });
});
