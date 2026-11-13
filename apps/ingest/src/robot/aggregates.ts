import type { AttentionGroupDto, AttentionReason, FleetAggregatesDto, StatusCounts } from '@olivaw/contracts';
import { siteIdForMap, sites } from '@olivaw/demo-world';
import { attentionReasonOrder } from './attention';
import type { RobotRecord } from './types';

const emptyCounts = (): StatusCounts => ({ working: 0, charging: 0, idle: 0, attention: 0, offline: 0 });

function worstOf(reason: AttentionReason, records: RobotRecord[]): RobotRecord {
  const sinceMs = (record: RobotRecord) => record.attentionSince?.getTime() ?? Number.POSITIVE_INFINITY;
  return records.reduce((worst, record) => {
    if (reason === 'battery-critical') return record.batteryPercent < worst.batteryPercent ? record : worst;
    return sinceMs(record) < sinceMs(worst) ? record : worst;
  });
}

function groupAttention(records: RobotRecord[]): AttentionGroupDto[] {
  const inAttention = records.filter((record) => record.status === 'attention');
  return attentionReasonOrder
    .map((reason) => ({ reason, members: inAttention.filter((r) => r.attentionReasons.includes(reason)) }))
    .flatMap(({ reason, members }) => {
      if (members.length === 0) return [];
      return [
        {
          reason,
          count: members.length,
          worstRobotId: worstOf(reason, members).robotId,
          robotIds: members.map((member) => member.robotId),
        },
      ];
    })
    .sort((a, b) => b.count - a.count);
}

export function computeAggregates(records: Iterable<RobotRecord>): FleetAggregatesDto {
  const all = [...records];
  const byStatus = emptyCounts();
  const bySite: Record<string, StatusCounts> = Object.fromEntries(
    sites.map((site) => [site.id, emptyCounts()]),
  );
  for (const record of all) {
    byStatus[record.status] += 1;
    const siteId = siteIdForMap(record.mapId);
    const siteCounts = siteId === null ? undefined : bySite[siteId];
    if (siteCounts) siteCounts[record.status] += 1;
  }
  return { byStatus, bySite, attentionGroups: groupAttention(all) };
}
