import type {
  AttentionReason,
  ConnectionState,
  ErrorLevel,
  RobotProtocol,
  RobotStatus,
} from '@olivaw/contracts';

export interface NormalisedError {
  level: ErrorLevel;
  code: string;
  description: string | null;
}

export interface RobotObservation {
  robotId: string;
  vendor: string;
  model: string;
  serialNumber: string;
  protocol: RobotProtocol;
  mapId: string;
  x: number;
  y: number;
  headingRad: number;
  speedMps: number;
  batteryPercent: number;
  charging: boolean;
  operatingMode: string;
  driving: boolean;
  taskId: string | null;
  errors: NormalisedError[];
  emergencyStop: boolean;
  receivedAt: Date;
  raw: unknown;
}

export interface RobotRecord extends RobotObservation {
  connection: ConnectionState;
  stoppedWithTaskSince: Date | null;
  attentionSince: Date | null;
  status: RobotStatus;
  attentionReasons: AttentionReason[];
}

export interface DomainConfig {
  staleAfterMs: number;
  criticalBatteryPercent: number;
  stuckAfterMs: number;
}
