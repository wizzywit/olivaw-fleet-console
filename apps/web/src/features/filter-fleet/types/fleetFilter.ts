import type { RobotStatus } from '@/entities/robot';

export interface FleetQuery {
  text: string;
  site: string | null;
  vendor: string | null;
  status: RobotStatus | null;
  batteryBelow: number | null;
}

export interface FleetFilterParams {
  status: RobotStatus | 'all';
  siteId: string | null;
  rawQuery: string;
}

export interface FleetFilter extends FleetFilterParams {
  query: FleetQuery;
}

export const emptyFleetQuery: FleetQuery = {
  text: '',
  site: null,
  vendor: null,
  status: null,
  batteryBelow: null,
};

export const defaultFleetFilter: FleetFilter = {
  status: 'all',
  siteId: null,
  rawQuery: '',
  query: emptyFleetQuery,
};
