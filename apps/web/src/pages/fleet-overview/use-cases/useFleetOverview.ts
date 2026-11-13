'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import {
  isLastKnownValue,
  isLive,
  totalOf,
  useFleetAggregates,
  useFleetConfig,
  useFleetRepository,
  useFleetRobots,
  useFleetSites,
  useLiveStatus,
  type StatusCounts,
} from '@/entities/fleet';
import {
  compareByUrgency,
  isBatteryCritical,
  type AttentionPriority,
  type AttentionReason,
  type Robot,
  type RobotStatus,
} from '@/entities/robot';
import { matchesFleetFilter, useFleetFilter } from '@/features/filter-fleet';
import { formatCount, formatPercent, useNow } from '@/shared/lib';
import { describeRobot } from '../services/robotDescription';
import { reconcileOrder } from '../services/stableOrder';

const emptyCounts: StatusCounts = { working: 0, charging: 0, idle: 0, attention: 0, offline: 0 };

export interface SiteTileView {
  id: string;
  name: string;
  totalLabel: string;
  detail: string;
  counts: StatusCounts;
  isSelected: boolean;
}

export interface AttentionGroupView {
  reason: AttentionReason;
  priority: AttentionPriority;
  count: number;
  countLabel: string;
  unacknowledgedCount: number;
  robotIds: readonly string[];
  worstHref: string;
  worstLabel: string;
}

export interface RobotRowView {
  id: string;
  href: string;
  vendorModel: string;
  siteId: string;
  siteZone: string;
  status: RobotStatus;
  isStale: boolean;
  isBatteryCritical: boolean;
  batteryPercent: number;
  charging: boolean;
  lastReportAt: Date;
}

interface OrderState {
  order: string[];
  pendingChanges: number;
  sortedIds: string[];
  isHeld: boolean;
  resetKey: string;
  resortCount: number;
}

// Keeps the previous order in state and reconciles during render when inputs change (React's
// "storing information from previous renders" pattern), so rows never jump while the user works in the list.
function useStableOrder(sortedIds: string[], resetKey: string) {
  const [isHeld, setHeld] = useState(false);
  const [resortCount, setResortCount] = useState(0);
  const [state, setState] = useState<OrderState>({
    order: sortedIds,
    pendingChanges: 0,
    sortedIds,
    isHeld,
    resetKey,
    resortCount,
  });
  let current = state;
  if (
    state.sortedIds !== sortedIds ||
    state.isHeld !== isHeld ||
    state.resetKey !== resetKey ||
    state.resortCount !== resortCount
  ) {
    const userAskedForNewOrder = state.resetKey !== resetKey || state.resortCount !== resortCount;
    const reconciled = reconcileOrder(state.order, sortedIds, isHeld && !userAskedForNewOrder);
    current = { ...reconciled, sortedIds, isHeld, resetKey, resortCount };
    setState(current);
  }
  return {
    order: current.order,
    pendingChanges: current.pendingChanges,
    setHeld,
    resort: () => {
      setResortCount((count) => count + 1);
    },
  };
}

export function useFleetOverview() {
  const repository = useFleetRepository();
  const robots = useFleetRobots();
  const aggregates = useFleetAggregates();
  const sites = useFleetSites();
  const config = useFleetConfig();
  const live = useLiveStatus();
  const { filter, isActive, toggleSite, clear } = useFleetFilter();
  const router = useRouter();
  const now = useNow(1000);
  const isLastKnown = !isLive(live.status);

  const siteName = useCallback((siteId: string) => sites.find((site) => site.id === siteId)?.name, [sites]);

  const sortedIds = useMemo(
    () =>
      [...robots.values()]
        .filter((robot) => matchesFleetFilter(robot, filter, siteName))
        .sort(compareByUrgency)
        .map((robot) => robot.id),
    [robots, filter, siteName],
  );
  const filterKey = `${filter.status}|${filter.siteId ?? ''}|${filter.rawQuery}`;
  const { order, pendingChanges, setHeld, resort } = useStableOrder(sortedIds, filterKey);

  const toRow = (robot: Robot): RobotRowView => ({
    id: robot.id,
    href: `/robots/${encodeURIComponent(robot.id)}`,
    vendorModel: `${robot.vendor} ${robot.model}`,
    siteId: robot.siteId,
    siteZone: [siteName(robot.siteId) ?? robot.siteId, robot.zone].filter(Boolean).join(' · '),
    status: robot.status,
    isStale: isLastKnownValue(robot.status, live.status),
    isBatteryCritical: isBatteryCritical(robot),
    batteryPercent: robot.battery.percent,
    charging: robot.battery.charging,
    lastReportAt: robot.lastReportAt,
  });

  const rows = order.flatMap((id) => {
    const robot = robots.get(id);
    return robot === undefined ? [] : [toRow(robot)];
  });

  const attentionGroups: AttentionGroupView[] = (aggregates?.attentionGroups ?? []).map((group) => {
    const worst = robots.get(group.worstRobotId);
    const worstLabel =
      worst === undefined
        ? group.worstRobotId
        : `${worst.id} · ${siteName(worst.siteId) ?? worst.siteId}${worst.zone === null ? '' : `, ${worst.zone}`} · battery ${formatPercent(worst.battery.percent)}`;
    return {
      reason: group.reason,
      priority: group.priority,
      count: group.count,
      countLabel: `${formatCount(group.count)} ${group.count === 1 ? 'robot' : 'robots'}`,
      unacknowledgedCount: group.unacknowledgedCount,
      robotIds: group.robotIds,
      worstHref: `/robots/${encodeURIComponent(group.worstRobotId)}`,
      worstLabel,
    };
  });

  const siteTiles: SiteTileView[] = sites.map((site) => {
    const counts = aggregates?.bySite[site.id] ?? emptyCounts;
    const total = totalOf(counts);
    return {
      id: site.id,
      name: site.name,
      totalLabel: `${formatCount(total)} robots`,
      detail: `${formatCount(counts.attention)} need attention · ${formatCount(counts.offline)} offline`,
      counts,
      isSelected: filter.siteId === site.id,
    };
  });

  let state: 'loading' | 'error' | 'ready' = 'ready';
  if (repository.isLoading) state = 'loading';
  else if (repository.error !== null && robots.size === 0) state = 'error';

  return {
    state,
    retry: repository.refetch,
    siteTiles,
    toggleSite,
    sites,
    attentionGroups,
    attentionTotal: aggregates?.byStatus.attention ?? 0,
    statusCounts: aggregates?.byStatus ?? emptyCounts,
    statusTotal: totalOf(aggregates?.byStatus ?? emptyCounts),
    rows,
    totalRobots: robots.size,
    isFiltered: isActive,
    clearFilters: clear,
    pendingChanges,
    resort,
    setHeld,
    isLastKnown,
    criticalBatteryPercent: config?.criticalBatteryPercent ?? 15,
    now,
    describeRow: describeRobot,
    openRobot: (href: string) => {
      router.push(href);
    },
  };
}
