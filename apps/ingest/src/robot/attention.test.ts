import { describe, expect, it } from 'vitest';
import { aRecord, t, testConfig } from '../../test/builders';
import { deriveAttentionReasons } from './attention';

const now = t(0);

describe('deriveAttentionReasons', () => {
  it('finds nothing for a healthy robot', () => {
    expect(deriveAttentionReasons(aRecord(), now, testConfig)).toEqual([]);
  });

  it('flags battery below the critical threshold, not at it', () => {
    expect(deriveAttentionReasons(aRecord({ batteryPercent: 15 }), now, testConfig)).toEqual([]);
    expect(deriveAttentionReasons(aRecord({ batteryPercent: 14.9 }), now, testConfig)).toEqual([
      'battery-critical',
    ]);
  });

  it('does not flag a low battery while charging', () => {
    expect(deriveAttentionReasons(aRecord({ batteryPercent: 5, charging: true }), now, testConfig)).toEqual(
      [],
    );
  });

  it('ignores warnings but flags urgent, critical and fatal errors', () => {
    const error = (level: 'warning' | 'urgent' | 'critical' | 'fatal') => [
      { level, code: 'X', description: null },
    ];
    expect(deriveAttentionReasons(aRecord({ errors: error('warning') }), now, testConfig)).toEqual([]);
    for (const level of ['urgent', 'critical', 'fatal'] as const) {
      expect(deriveAttentionReasons(aRecord({ errors: error(level) }), now, testConfig)).toEqual([
        'error-reported',
      ]);
    }
  });

  it('flags an active emergency stop', () => {
    expect(deriveAttentionReasons(aRecord({ emergencyStop: true }), now, testConfig)).toEqual([
      'emergency-stop',
    ]);
  });

  it('flags a robot stopped with a task only after the stuck threshold', () => {
    const stopped = aRecord({ driving: false, stoppedWithTaskSince: t(0) });
    expect(deriveAttentionReasons(stopped, t(120_000), testConfig)).toEqual([]);
    expect(deriveAttentionReasons(stopped, t(120_001), testConfig)).toEqual(['stuck']);
  });

  it('lists several reasons in a fixed order', () => {
    const record = aRecord({
      batteryPercent: 3,
      emergencyStop: true,
      errors: [{ level: 'fatal', code: 'X', description: null }],
      stoppedWithTaskSince: t(0),
    });
    expect(deriveAttentionReasons(record, t(200_000), testConfig)).toEqual([
      'emergency-stop',
      'error-reported',
      'battery-critical',
      'stuck',
    ]);
  });
});
