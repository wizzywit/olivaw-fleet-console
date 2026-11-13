import { z } from 'zod';
import type { DomainConfig } from './robot/types';

const envSchema = z.object({
  MQTT_PORT: z.coerce.number().int().positive().default(1883),
  HTTP_PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  REPORT_INTERVAL_MS: z.coerce.number().int().positive().default(1000),
  CRITICAL_BATTERY_PERCENT: z.coerce.number().min(0).max(100).default(15),
  STUCK_AFTER_MS: z.coerce.number().int().positive().default(120_000),
  PATCH_INTERVAL_MS: z.coerce.number().int().positive().default(500),
  SWEEP_INTERVAL_MS: z.coerce.number().int().positive().default(1000),
});

export interface IngestConfig {
  mqttPort: number;
  httpPort: number;
  corsOrigin: string;
  patchIntervalMs: number;
  sweepIntervalMs: number;
  domain: DomainConfig;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): IngestConfig {
  const parsed = envSchema.parse(env);
  return {
    mqttPort: parsed.MQTT_PORT,
    httpPort: parsed.HTTP_PORT,
    corsOrigin: parsed.CORS_ORIGIN,
    patchIntervalMs: parsed.PATCH_INTERVAL_MS,
    sweepIntervalMs: parsed.SWEEP_INTERVAL_MS,
    domain: {
      staleAfterMs: 3 * parsed.REPORT_INTERVAL_MS,
      criticalBatteryPercent: parsed.CRITICAL_BATTERY_PERCENT,
      stuckAfterMs: parsed.STUCK_AFTER_MS,
    },
  };
}
