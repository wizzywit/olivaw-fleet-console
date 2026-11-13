import { z } from 'zod';

export const robotCommandRequestSchema = z.object({ type: z.enum(['send-to-dock', 'pause']) });

export type RobotCommandRequest = z.infer<typeof robotCommandRequestSchema>;
export type RobotCommandType = RobotCommandRequest['type'];
