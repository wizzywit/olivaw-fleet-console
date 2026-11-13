import { z } from 'zod';
import { robotPositionSchema, robotProtocolSchema, robotSummaryDtoSchema } from './robot';

export const errorLevelSchema = z.enum(['warning', 'urgent', 'critical', 'fatal']);

export const robotDetailDtoSchema = robotSummaryDtoSchema.extend({
  serialNumber: z.string(),
  position: robotPositionSchema,
  errors: z.array(
    z.object({ level: errorLevelSchema, code: z.string(), description: z.string().nullable() }),
  ),
  rawMessage: z.object({
    protocol: robotProtocolSchema,
    receivedAt: z.iso.datetime(),
    payload: z.unknown(),
  }),
});

export type ErrorLevel = z.infer<typeof errorLevelSchema>;
export type RobotDetailDto = z.infer<typeof robotDetailDtoSchema>;
