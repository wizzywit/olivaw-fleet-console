import { describe, expect, it } from 'vitest';
import { aRecord, t, testConfig } from '../../test/builders';
import { deriveStatus } from './status';

describe('deriveStatus', () => {
  it('is offline only after more than staleAfterMs without a report', () => {
    expect(deriveStatus(aRecord({ receivedAt: t(0) }), t(3000), testConfig)).toBe('working');
    expect(deriveStatus(aRecord({ receivedAt: t(0) }), t(3001), testConfig)).toBe('offline');
  });

  it('is offline when the connection is broken, even with a fresh report', () => {
    expect(deriveStatus(aRecord({ connection: 'broken' }), t(0), testConfig)).toBe('offline');
    expect(deriveStatus(aRecord({ connection: 'offline' }), t(0), testConfig)).toBe('offline');
  });

  it('puts attention before charging', () => {
    const record = aRecord({ charging: true, emergencyStop: true });
    expect(deriveStatus(record, t(0), testConfig)).toBe('attention');
  });

  it('puts charging before working', () => {
    expect(deriveStatus(aRecord({ charging: true, taskId: 'ord-1' }), t(0), testConfig)).toBe('charging');
  });

  it('is working with a task or while driving', () => {
    expect(deriveStatus(aRecord({ taskId: 'ord-1', driving: false }), t(0), testConfig)).toBe('working');
    expect(deriveStatus(aRecord({ taskId: null, driving: true }), t(0), testConfig)).toBe('working');
  });

  it('is idle without a task and not driving', () => {
    expect(deriveStatus(aRecord({ taskId: null, driving: false }), t(0), testConfig)).toBe('idle');
  });
});
