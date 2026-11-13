import type { ErrorLevel, RobotCommandType, RobotProtocol } from '@olivaw/contracts';

export type { ErrorLevel, RobotCommandType };

export interface RobotDetailExtras {
  serialNumber: string;
  errors: { level: ErrorLevel; code: string; description: string | null }[];
  rawMessage: { protocol: RobotProtocol; receivedAt: Date; payload: unknown };
}
