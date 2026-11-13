import type { ConnectionState, ErrorLevel } from '@olivaw/contracts';
import {
  parseVda5050Topic,
  vda5050ConnectionSchema,
  vda5050FactsheetSchema,
  vda5050StateSchema,
  type Vda5050ConnectionState,
  type Vda5050ErrorLevel,
  type Vda5050State,
} from '@olivaw/protocols';
import type { RobotObservation } from '../robot/types';

export type Vda5050Event =
  | { kind: 'observation'; observation: RobotObservation }
  | { kind: 'connection'; robotId: string; state: ConnectionState; at: Date }
  | { kind: 'factsheet'; robotId: string; model: string };

export interface Vda5050AdapterDeps {
  log: (message: string, data?: Record<string, unknown>) => void;
  now: () => Date;
}

type Position = NonNullable<Vda5050State['mobileRobotPosition']>;

const connectionStates: Record<Vda5050ConnectionState, ConnectionState> = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  HIBERNATING: 'offline',
  CONNECTION_BROKEN: 'broken',
};

const errorLevels: Record<Vda5050ErrorLevel, ErrorLevel> = {
  WARNING: 'warning',
  URGENT: 'urgent',
  CRITICAL: 'critical',
  FATAL: 'fatal',
};

const unknownModel = 'Unknown model';

export function createVda5050Adapter({ log, now }: Vda5050AdapterDeps) {
  const models = new Map<string, string>();
  const lastPositions = new Map<string, Position>();

  function toObservation(state: Vda5050State, raw: unknown): RobotObservation | null {
    const position = state.mobileRobotPosition ?? lastPositions.get(state.serialNumber);
    if (position === undefined) {
      log('vda5050: dropped state without a known position', { serialNumber: state.serialNumber });
      return null;
    }
    lastPositions.set(state.serialNumber, position);
    return {
      robotId: state.serialNumber,
      vendor: state.manufacturer,
      model: models.get(state.serialNumber) ?? unknownModel,
      serialNumber: state.serialNumber,
      protocol: 'vda5050',
      mapId: position.mapId,
      x: position.x,
      y: position.y,
      headingRad: position.theta,
      speedMps: Math.hypot(state.velocity?.vx ?? 0, state.velocity?.vy ?? 0),
      batteryPercent: state.powerSupply.stateOfCharge,
      charging: state.powerSupply.charging,
      operatingMode: state.operatingMode,
      driving: state.driving,
      taskId: state.orderId === '' ? null : state.orderId,
      errors: state.errors.map((error) => ({
        level: errorLevels[error.errorLevel],
        code: error.errorType,
        description: error.errorDescription ?? null,
      })),
      emergencyStop: state.safetyState.activeEmergencyStop !== 'NONE',
      receivedAt: now(),
      raw,
    };
  }

  function onMessage(topic: string, payload: Uint8Array): Vda5050Event | null {
    const parts = parseVda5050Topic(topic);
    if (parts === null || parts.subtopic === 'visualization') return null;

    let json: unknown;
    try {
      json = JSON.parse(Buffer.from(payload).toString('utf8'));
    } catch {
      log('vda5050: dropped message that is not JSON', { topic });
      return null;
    }

    const schema = {
      state: vda5050StateSchema,
      connection: vda5050ConnectionSchema,
      factsheet: vda5050FactsheetSchema,
    }[parts.subtopic];
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      log('vda5050: dropped invalid message', { topic, issues: parsed.error.issues.length });
      return null;
    }
    if (parsed.data.serialNumber !== parts.serialNumber) {
      log('vda5050: dropped message whose serial number does not match its topic', { topic });
      return null;
    }

    const data = parsed.data;
    if ('connectionState' in data) {
      return {
        kind: 'connection',
        robotId: data.serialNumber,
        state: connectionStates[data.connectionState],
        at: now(),
      };
    }
    if ('typeSpecification' in data) {
      models.set(data.serialNumber, data.typeSpecification.seriesName);
      return { kind: 'factsheet', robotId: data.serialNumber, model: data.typeSpecification.seriesName };
    }
    const observation = toObservation(data, json);
    return observation === null ? null : { kind: 'observation', observation };
  }

  return { onMessage };
}
