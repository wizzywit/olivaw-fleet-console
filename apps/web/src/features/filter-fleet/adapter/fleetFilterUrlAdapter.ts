import { isRobotStatus } from '@/entities/robot';
import { replaceSearchParams } from '@/shared/lib';
import type { FleetFilterParams } from '../types/fleetFilter';

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

export function replaceFilterInUrl(params: FleetFilterParams): void {
  replaceSearchParams(['status', 'site', 'q'], toSearchParams(params));
}
