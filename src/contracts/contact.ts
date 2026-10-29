import { z } from 'zod';
import { Id, OrganizationId, Timestamp } from './common.ts';

// Fields from `contacts` and `contact_identities` in DATABASE_DESIGN §5. MVP_PLAN §0 only says
// "Contact + ContactIdentity (canal + id externo)".

export const Contact = z.strictObject({
  id: Id,
  organization_id: OrganizationId,
  display_name: z.string().nullable(),
  /** Declared data. Never used to merge contacts automatically. */
  email: z.string().nullable(),
  phone_e164: z.string().nullable(),
  notes: z.string().nullable(),
  archived_at: Timestamp.nullable(),
  created_at: Timestamp,
  updated_at: Timestamp,
});
export type Contact = z.infer<typeof Contact>;

// TODO(DAV-253): `email` is `z.string()` and `phone_e164` is unchecked because the docs define no
// format or normalisation for declared contact data.

/** A contact's identity in one channel account: channel account + external id. */
export const ContactIdentity = z.strictObject({
  id: Id,
  organization_id: OrganizationId,
  contact_id: Id,
  channel_account_id: Id,
  /** Unique per (organization, channel account). Never a webchat token. */
  external_id: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()),
  created_at: Timestamp,
  updated_at: Timestamp,
});
export type ContactIdentity = z.infer<typeof ContactIdentity>;
