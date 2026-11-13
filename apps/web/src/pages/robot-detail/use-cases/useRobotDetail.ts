'use client';

import {
  isLastKnownValue,
  isLive,
  useFleetConfig,
  useFleetRepository,
  useFleetRobot,
  useFleetSites,
  useLiveStatus,
  type SiteMap,
} from '@/entities/fleet';
import { isBatteryCritical, type AttentionReason, type RobotStatus } from '@/entities/robot';
import { formatPercent, formatRelativeTime, useNow } from '@/shared/lib';
import { useRobotCommandRepository, useRobotDetailRepository } from '../repository/robotDetailRepository';
import { toMapPercent } from '../services/mapPosition';
import type { ErrorLevel, RobotCommandType } from '../types/robotDetail';

const protocolLabels = { vda5050: 'VDA 5050 3.0', massrobotics: 'MassRobotics' } as const;
const errorLevelLabels: Record<ErrorLevel, string> = {
  warning: 'Warning',
  urgent: 'Urgent',
  critical: 'Critical',
  fatal: 'Fatal',
};

export interface RobotAlertView {
  reason: AttentionReason;
  batteryLabel: string;
  errorText: string | null;
  taskId: string | null;
}

export interface LocationMapView {
  name: string;
  zones: (SiteMap['zones'][number] & {
    left: number;
    top: number;
    widthPercent: number;
    heightPercent: number;
  })[];
  docks: { id: string; left: number; top: number }[];
  robot: { left: number; top: number; headingDeg: number };
  description: string;
}

const sentLabels: Record<RobotCommandType, string> = {
  'send-to-dock': 'Sent to dock',
  pause: 'Pause requested',
};

// One message at a time for the reserved feedback line: a failure first, then what was sent, then why commands are off.
function commandFeedback(
  command: { failed: boolean; sent: RobotCommandType | null },
  isConnected: boolean,
): { text: string; isError: boolean } | null {
  if (command.failed) return { text: 'The command was not accepted. Try again.', isError: true };
  if (command.sent !== null) return { text: sentLabels[command.sent], isError: false };
  if (!isConnected)
    return { text: 'Commands are disabled until the live connection is back', isError: false };
  return null;
}

export function useRobotDetail(robotId: string) {
  const robot = useFleetRobot(robotId);
  const sites = useFleetSites();
  const config = useFleetConfig();
  const live = useLiveStatus();
  const fleet = useFleetRepository();
  const { detail, isLoading, error, retry } = useRobotDetailRepository(robotId);
  const command = useRobotCommandRepository(robotId);
  const now = useNow(1000);

  if (robot === undefined) {
    let state: 'loading' | 'not-found' | 'error' = 'not-found';
    if (isLoading || fleet.isLoading) state = 'loading';
    else if (detail === undefined && error !== null) state = 'error';
    return { state, robotId, retry };
  }

  const site = sites.find((candidate) => candidate.id === robot.siteId);
  const map = site?.maps.find((candidate) => candidate.id === robot.position.mapId);
  const firstUrgentError = detail?.errors.find((candidate) => candidate.level !== 'warning');
  const [reason] = robot.attentionReasons;
  const canSend = isLive(live.status) && !command.isPending;

  const locationMap: LocationMapView | null =
    map === undefined
      ? null
      : {
          name: `${site?.name ?? robot.siteId} · ${map.name}`,
          zones: map.zones.map((zone) => ({
            ...zone,
            ...toMapPercent(zone, map),
            widthPercent: (zone.width / map.width) * 100,
            heightPercent: (zone.height / map.height) * 100,
          })),
          docks: map.docks.map((dock) => ({ id: dock.id, ...toMapPercent(dock, map) })),
          robot: {
            ...toMapPercent(robot.position, map),
            headingDeg: (robot.position.headingRad * 180) / Math.PI,
          },
          description: `${map.name} map. The robot is ${robot.zone === null ? 'outside the named zones' : `in ${robot.zone}`}, at x ${robot.position.x} m, y ${robot.position.y} m.`,
        };

  return {
    state: 'ready' as const,
    robotId,
    header: {
      id: robot.id,
      status: robot.status satisfies RobotStatus,
      isStale: isLastKnownValue(robot.status, live.status),
      subtitle: [
        `${robot.vendor} ${robot.model}`,
        detail === undefined || detail === null ? null : `serial ${detail.serialNumber}`,
        [site?.name ?? robot.siteId, robot.zone].filter(Boolean).join(', '),
      ]
        .filter(Boolean)
        .join(' · '),
    },
    alert:
      reason === undefined
        ? null
        : ({
            reason,
            batteryLabel: formatPercent(robot.battery.percent),
            errorText:
              firstUrgentError === undefined
                ? null
                : `${firstUrgentError.code}${firstUrgentError.description === null ? '' : `: ${firstUrgentError.description}`}`,
            taskId: robot.taskId,
          } satisfies RobotAlertView),
    battery: {
      percent: robot.battery.percent,
      charging: robot.battery.charging,
      isCritical: isBatteryCritical(robot),
      criticalPercent: config?.criticalBatteryPercent ?? 15,
    },
    tiles: [
      { label: 'Mode', value: robot.operatingMode, hint: `${robot.speedMps} m/s` },
      {
        label: 'Current task',
        value: robot.taskId ?? 'None',
        hint: robot.taskId === null ? 'idle' : 'order in progress',
      },
      { label: 'Last report', value: formatRelativeTime(robot.lastReportAt, now), hint: robot.connection },
    ],
    locationMap,
    errors:
      detail === undefined && error !== null
        ? null
        : (detail?.errors ?? []).map((item) => ({
            key: `${item.level}-${item.code}`,
            levelLabel: errorLevelLabels[item.level],
            code: item.code,
            description: item.description,
          })),
    retryDetail: retry,
    raw:
      detail === undefined || detail === null
        ? null
        : {
            protocolLabel: protocolLabels[detail.rawMessage.protocol],
            receivedLabel: formatRelativeTime(detail.rawMessage.receivedAt, now),
            json: JSON.stringify(detail.rawMessage.payload, null, 2),
          },
    commands: {
      canSend,
      feedback: commandFeedback(command, isLive(live.status)),
      send: (type: RobotCommandType) => {
        command.send(type);
      },
    },
  } as const;
}
