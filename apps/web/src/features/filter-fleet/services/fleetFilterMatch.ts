import type { Robot } from '@/entities/robot';
import type { FleetFilter } from '../types/fleetFilter';

const contains = (haystack: string | null | undefined, needle: string) =>
  haystack?.toLowerCase().includes(needle) ?? false;

export function matchesFleetFilter(
  robot: Robot,
  { status, siteId, query }: FleetFilter,
  siteName: (siteId: string) => string | undefined,
): boolean {
  if (status !== 'all' && robot.status !== status) return false;
  if (siteId !== null && robot.siteId !== siteId) return false;
  if (query.status !== null && robot.status !== query.status) return false;
  if (query.batteryBelow !== null && !(robot.battery.percent < query.batteryBelow)) return false;
  if (query.vendor !== null && !contains(robot.vendor, query.vendor)) return false;
  if (
    query.site !== null &&
    !contains(robot.siteId, query.site) &&
    !contains(siteName(robot.siteId), query.site)
  ) {
    return false;
  }
  const words = query.text.toLowerCase().split(/\s+/).filter(Boolean);
  const searchable = [robot.id, robot.vendor, robot.model, robot.zone, siteName(robot.siteId)];
  return words.every((word) => searchable.some((field) => contains(field, word)));
}
