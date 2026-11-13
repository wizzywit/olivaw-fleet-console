import { isRobotStatus } from '@/entities/robot';
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

// Native replaceState updates the URL and Next's useSearchParams without a router navigation on every keystroke.
export function replaceFilterInUrl(pathname: string, params: FleetFilterParams): void {
  const query = toSearchParams(params).toString();
  window.history.replaceState(null, '', query === '' ? pathname : `${pathname}?${query}`);
}
