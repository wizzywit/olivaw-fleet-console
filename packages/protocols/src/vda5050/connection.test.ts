import { describe, expect, it } from 'vitest';
import broken from './fixtures/connection.broken.json';
import { vda5050ConnectionSchema } from './connection';

describe('vda5050ConnectionSchema', () => {
  it('parses a broken connection message', () => {
    expect(vda5050ConnectionSchema.parse(broken).connectionState).toBe('CONNECTION_BROKEN');
  });

  it('rejects an unknown connection state', () => {
    expect(vda5050ConnectionSchema.safeParse({ ...broken, connectionState: 'LOST' }).success).toBe(false);
  });
});
