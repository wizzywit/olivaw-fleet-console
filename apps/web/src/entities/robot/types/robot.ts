import type {
  AttentionPriority,
  AttentionReason,
  ConnectionState,
  RobotProtocol,
  RobotStatus,
} from '@olivaw/contracts';

export type { AttentionPriority, AttentionReason, ConnectionState, RobotProtocol, RobotStatus };

export interface Robot {
  id: string;
  displayName: string;
  vendor: string;
  model: string;
  protocol: RobotProtocol;
  siteId: string;
  zone: string | null;
  status: RobotStatus;
  attentionReasons: AttentionReason[];
  attentionSince: Date | null;
  battery: { percent: number; charging: boolean };
  speedMps: number;
  operatingMode: string;
  taskId: string | null;
  lastReportAt: Date;
  connection: ConnectionState;
}
