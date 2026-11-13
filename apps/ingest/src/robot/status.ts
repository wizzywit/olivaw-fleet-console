import type { RobotStatus } from '@olivaw/contracts';
import { deriveAttentionReasons } from './attention';
import type { DomainConfig, RobotRecord } from './types';

export function isStale(record: Pick<RobotRecord, 'receivedAt'>, now: Date, config: DomainConfig): boolean {
  return now.getTime() - record.receivedAt.getTime() > config.staleAfterMs;
}

export function deriveStatus(record: RobotRecord, now: Date, config: DomainConfig): RobotStatus {
  if (record.connection !== 'online' || isStale(record, now, config)) return 'offline';
  if (deriveAttentionReasons(record, now, config).length > 0) return 'attention';
  if (record.charging) return 'charging';
  if (record.taskId !== null || record.driving) return 'working';
  return 'idle';
}
