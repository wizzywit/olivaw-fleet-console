import { robotDetailDtoSchema } from '@olivaw/contracts';
import { z } from 'zod';
import { HttpError, httpGet, httpPost } from '@/shared/api';
import type { RobotCommandType, RobotDetailExtras } from '../types/robotDetail';

const robotPath = (robotId: string) => `/api/robots/${encodeURIComponent(robotId)}`;

// The live summary comes from the fleet stream; this adapter maps only what the detail adds.
export async function fetchRobotDetail(robotId: string): Promise<RobotDetailExtras | null> {
  try {
    const { serialNumber, errors, rawMessage } = await httpGet(robotPath(robotId), robotDetailDtoSchema);
    return {
      serialNumber,
      errors,
      rawMessage: { ...rawMessage, receivedAt: new Date(rawMessage.receivedAt) },
    };
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) return null;
    throw error;
  }
}

export async function sendRobotCommand(robotId: string, type: RobotCommandType): Promise<void> {
  await httpPost(`${robotPath(robotId)}/commands`, { type }, z.object({ accepted: z.literal(true) }));
}
