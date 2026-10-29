// Shared valid fixtures for contract tests. Fictitious data only.
export const uuid = () => crypto.randomUUID();

export const NOW = '2026-10-29T12:00:00.000Z';

export const inboundMessage = () => ({
  organization_id: uuid(),
  channel_account_id: uuid(),
  provider_message_id: 'wamid.fixture-1',
  external_id: 'visitor-1',
  content_type: 'text',
  body: 'Hola, ¿cuánto cuesta el delivery?',
  provider_timestamp: NOW,
  correlation_id: uuid(),
});

export const outboundMessage = () => ({
  message_id: uuid(),
  organization_id: uuid(),
  conversation_id: uuid(),
  channel_account_id: uuid(),
  sender_type: 'ai',
  author_user_id: null,
  client_request_id: null,
  content_type: 'text',
  body: 'El delivery cuesta lo indicado en la FAQ.',
  correlation_id: uuid(),
});

export const contact = () => ({
  id: uuid(),
  organization_id: uuid(),
  display_name: 'Cliente de prueba',
  email: null,
  phone_e164: null,
  notes: null,
  archived_at: null,
  created_at: NOW,
  updated_at: NOW,
});

export const contactIdentity = () => ({
  id: uuid(),
  organization_id: uuid(),
  contact_id: uuid(),
  channel_account_id: uuid(),
  external_id: 'visitor-1',
  metadata: {},
  created_at: NOW,
  updated_at: NOW,
});

export const conversation = () => ({
  id: uuid(),
  organization_id: uuid(),
  contact_id: uuid(),
  contact_identity_id: uuid(),
  channel_account_id: uuid(),
  status: 'open',
  assigned_to_user_id: null,
  ai_paused: false,
  handoff_reason: null,
  handoff_summary: null,
  last_message_at: NOW,
  last_customer_message_at: NOW,
  resolved_at: null,
  created_at: NOW,
  updated_at: NOW,
});

export const aiRun = () => ({
  id: uuid(),
  organization_id: uuid(),
  agent_version_id: uuid(),
  sources: [
    {
      chunk_id: uuid(),
      rank: 1,
      cited: true,
      title_snapshot: 'Delivery',
      excerpt_snapshot: 'El delivery cuesta...',
    },
  ],
  evidence_coverage: 'strong',
  handoff_reason: null,
  latency_ms: 850,
  cost: '0.00012000',
  cost_currency: 'USD',
});

export const domainEvent = () => ({
  id: uuid(),
  organization_id: uuid(),
  conversation_id: uuid(),
  sequence: 1,
  type: 'conversation.resolved',
  schema_version: 1,
  message_id: null,
  ai_run_id: null,
  actor_type: 'human',
  actor_user_id: uuid(),
  occurred_at: NOW,
  recorded_at: NOW,
  correlation_id: uuid(),
  dedupe_key: 'conversation.resolved:1',
  payload: {},
});
