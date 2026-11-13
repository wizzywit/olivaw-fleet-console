import { robotStatuses } from '@olivaw/contracts';
import type { RobotStatus } from '@/entities/robot';
import type { FleetFilterParams } from '../types/fleetFilter';

const isRobotStatus = (value: string | null): value is RobotStatus =>
  value !== null && (robotStatuses as readonly string[]).includes(value);

export function fromSearchParams(params: URLSearchParams): FleetFilterParams {
  const status = params.get('status');
  return {
    status: isRobotStatus(status) ? status : 'all',
    siteId: params.get('site'),
    rawQuery: params.get('q') ?? '',
  };
}

export function toSearchParams({ status, siteId, rawQuery }: FleetFilterParams): URLSearchParams {
  const params = new URLSearchParams();
  if (status !== 'all') params.set('status', status);
  if (siteId !== null) params.set('site', siteId);
  if (rawQuery.trim() !== '') params.set('q', rawQuery);
  return params;
}
