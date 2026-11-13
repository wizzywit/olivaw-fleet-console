import { describe, expect, it } from 'vitest';
import { loadConfig } from './config';

describe('loadConfig', () => {
  it('uses the spec defaults', () => {
    const config = loadConfig({});
    expect(config.domain).toEqual({ staleAfterMs: 3000, criticalBatteryPercent: 15, stuckAfterMs: 120_000 });
    expect(config.patchIntervalMs).toBe(500);
    expect(config.sweepIntervalMs).toBe(1000);
  });

  it('derives the stale threshold from the report interval', () => {
    expect(loadConfig({ REPORT_INTERVAL_MS: '2000' }).domain.staleAfterMs).toBe(6000);
  });

  it('keeps a minute of patches so a client away up to 60 s resumes without a resync', () => {
    expect(loadConfig({}).patchLogCapacity).toBe(120);
    expect(loadConfig({ PATCH_INTERVAL_MS: '1000' }).patchLogCapacity).toBe(60);
  });

  it('rejects a non-numeric port', () => {
    expect(() => loadConfig({ HTTP_PORT: 'eighty' })).toThrow();
  });
});
