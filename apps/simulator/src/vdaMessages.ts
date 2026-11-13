import type {
  Vda5050Connection,
  Vda5050ConnectionState,
  Vda5050Error,
  Vda5050Factsheet,
  Vda5050State,
} from '@olivaw/protocols';
import type { SimRobot } from './robotModel';

const protocolVersion = '3.0.0';
const lowBatteryWarningPercent = 20;

const header = (robot: SimRobot, headerId: number, now: Date) => ({
  headerId,
  timestamp: now.toISOString(),
  version: protocolVersion,
  manufacturer: robot.manufacturer,
  serialNumber: robot.serialNumber,
});

function reportedErrors(robot: SimRobot): Vda5050Error[] {
  if (robot.charging || robot.batteryPercent >= lowBatteryWarningPercent) return robot.errors;
  return [
    ...robot.errors,
    { errorType: 'BATTERY_LOW', errorLevel: 'WARNING', errorDescription: 'Battery below 20%' },
  ];
}

export function toVda5050State(robot: SimRobot, headerId: number, now: Date): Vda5050State {
  return {
    ...header(robot, headerId, now),
    orderId: robot.orderId ?? '',
    orderUpdateId: 0,
    lastNodeId: '',
    lastNodeSequenceId: 0,
    nodeStates: [],
    edgeStates: [],
    driving: robot.speedMps > 0,
    paused: false,
    actionStates: [],
    instantActionStates: [],
    powerSupply: { stateOfCharge: Math.round(robot.batteryPercent * 10) / 10, charging: robot.charging },
    operatingMode: 'AUTOMATIC',
    errors: reportedErrors(robot),
    safetyState: {
      activeEmergencyStop: robot.mode === 'estopped' ? 'REMOTE' : 'NONE',
      fieldViolation: false,
    },
    mobileRobotPosition: {
      x: robot.x,
      y: robot.y,
      theta: robot.headingRad,
      mapId: robot.mapId,
      localized: true,
    },
    velocity: { vx: robot.speedMps, vy: 0, omega: 0 },
  };
}

export function toVda5050Connection(
  robot: SimRobot,
  connectionState: Vda5050ConnectionState,
  headerId: number,
  now: Date,
): Vda5050Connection {
  return { ...header(robot, headerId, now), connectionState };
}

export function toVda5050Factsheet(robot: SimRobot, headerId: number, now: Date): Vda5050Factsheet {
  return {
    ...header(robot, headerId, now),
    typeSpecification: {
      seriesName: robot.seriesName,
      seriesDescription: `${robot.manufacturer} ${robot.seriesName}`,
    },
  };
}
