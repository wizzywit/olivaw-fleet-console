import type { AttentionReason } from '@olivaw/contracts';
import type { DomainConfig, RobotRecord } from './types';

export const attentionReasonOrder: readonly AttentionReason[] = [
  'emergency-stop',
  'error-reported',
  'battery-critical',
  'stuck',
];

type AttentionInput = Pick<
  RobotRecord,
  'emergencyStop' | 'errors' | 'batteryPercent' | 'charging' | 'stoppedWithTaskSince'
>;

const checks: Record<AttentionReason, (record: AttentionInput, now: Date, config: DomainConfig) => boolean> =
  {
    'emergency-stop': (record) => record.emergencyStop,
    'error-reported': (record) => record.errors.some((error) => error.level !== 'warning'),
    'battery-critical': (record, _now, config) =>
      !record.charging && record.batteryPercent < config.criticalBatteryPercent,
    stuck: (record, now, config) =>
      record.stoppedWithTaskSince !== null &&
      now.getTime() - record.stoppedWithTaskSince.getTime() > config.stuckAfterMs,
  };

export function deriveAttentionReasons(
  record: AttentionInput,
  now: Date,
  config: DomainConfig,
): AttentionReason[] {
  return attentionReasonOrder.filter((reason) => checks[reason](record, now, config));
}
