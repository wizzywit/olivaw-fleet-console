import type { AttentionGroupDto, AttentionReason, FleetAggregatesDto, StatusCounts } from '@olivaw/contracts';
import { siteIdForMap, sites } from '@olivaw/demo-world';
import { attentionPriority, attentionReasonOrder, isInAttentionGroup } from './attention';
import type { SeenMarks } from './seenMarks';
import type { RobotRecord } from './types';

const emptyCounts = (): StatusCounts => ({ working: 0, charging: 0, idle: 0, attention: 0, offline: 0 });

const priorityRank: Record<AttentionGroupDto['priority'], number> = { high: 0, medium: 1 };

function worstOf(reason: AttentionReason, records: RobotRecord[]): RobotRecord {
  const sinceMs = (record: RobotRecord) => record.attentionSince?.getTime() ?? Number.POSITIVE_INFINITY;
  return records.reduce((worst, record) => {
    if (reason === 'battery-critical') return record.batteryPercent < worst.batteryPercent ? record : worst;
    return sinceMs(record) < sinceMs(worst) ? record : worst;
  });
}

function groupAttention(marks: SeenMarks, records: RobotRecord[]): AttentionGroupDto[] {
  return attentionReasonOrder
    .map((reason) => {
      const members = records.filter((record) => isInAttentionGroup(record, reason));
      const memberIds = members.map((member) => member.robotId);
      marks.keepOnly(reason, memberIds);
      return { reason, members, memberIds };
    })
    .flatMap(({ reason, members, memberIds }) => {
      if (members.length === 0) return [];
      return [
        {
          reason,
          priority: attentionPriority[reason],
          count: members.length,
          unseenCount: marks.unseenIn(reason, memberIds),
          worstRobotId: worstOf(reason, members).robotId,
          robotIds: memberIds,
        },
      ];
    })
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || b.count - a.count);
}

export function computeAggregates(marks: SeenMarks, records: Iterable<RobotRecord>): FleetAggregatesDto {
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
  return { byStatus, bySite, attentionGroups: groupAttention(marks, all) };
}
