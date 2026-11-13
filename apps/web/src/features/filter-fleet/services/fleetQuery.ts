import { robotStatuses } from '@olivaw/contracts';
import type { RobotStatus } from '@/entities/robot';
import type { FleetQuery } from '../types/fleetFilter';

const isRobotStatus = (value: string): value is RobotStatus =>
  (robotStatuses as readonly string[]).includes(value);

export function parseFleetQuery(input: string): FleetQuery {
  const query: FleetQuery = { text: '', site: null, vendor: null, status: null, batteryBelow: null };
  const text: string[] = [];
  for (const token of input.trim().split(/\s+/).filter(Boolean)) {
    const [key, ...rest] = token.split(':');
    const value = rest.join(':').toLowerCase();
    if (key === 'site' && value !== '') query.site = value;
    else if (key === 'vendor' && value !== '') query.vendor = value;
    else if (key === 'status' && isRobotStatus(value)) query.status = value;
    else if (key === 'battery' && /^<\d+(\.\d+)?$/.test(value)) query.batteryBelow = Number(value.slice(1));
    else text.push(token);
  }
  query.text = text.join(' ');
  return query;
}
