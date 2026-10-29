import { describe, expect, it } from 'vite-plus/test';
import { Contact, ContactIdentity } from './index.ts';
import { contact, contactIdentity, uuid } from './fixtures.ts';

describe('Contact', () => {
  it('parses a valid contact', () => {
    expect(Contact.safeParse(contact()).success).toBe(true);
  });

  it('rejects a missing organization_id: no contact exists without a tenant', () => {
    const { organization_id: _omitted, ...rest } = contact();
    expect(Contact.safeParse(rest).success).toBe(false);
  });

  it('rejects unknown keys', () => {
    expect(Contact.safeParse({ ...contact(), merged_into: uuid() }).success).toBe(false);
  });
});

describe('ContactIdentity', () => {
  it('parses a valid identity (channel account + external id)', () => {
    expect(ContactIdentity.safeParse(contactIdentity()).success).toBe(true);
  });

  it.each(['organization_id', 'contact_id', 'channel_account_id', 'external_id'])(
    'rejects a missing %s',
    (key) => {
      const { [key as keyof ReturnType<typeof contactIdentity>]: _omitted, ...rest } =
        contactIdentity();
      expect(ContactIdentity.safeParse(rest).success).toBe(false);
    },
  );

  it('rejects an empty external_id', () => {
    expect(ContactIdentity.safeParse({ ...contactIdentity(), external_id: '' }).success).toBe(
      false,
    );
  });
});
