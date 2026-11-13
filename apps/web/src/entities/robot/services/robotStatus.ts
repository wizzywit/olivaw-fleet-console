import { robotStatusSchema } from '@olivaw/contracts';
import type { RobotStatus } from '../types/robot';

export const isRobotStatus = (value: string | null): value is RobotStatus =>
  robotStatusSchema.safeParse(value).success;
