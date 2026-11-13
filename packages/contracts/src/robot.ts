import { z } from 'zod';

export const robotStatuses = ['working', 'charging', 'idle', 'attention', 'offline'] as const;
export const attentionReasons = ['battery-critical', 'error-reported', 'emergency-stop', 'stuck'] as const;

export const attentionPriorities = ['high', 'medium'] as const;

export const robotStatusSchema = z.enum(robotStatuses);
export const attentionReasonSchema = z.enum(attentionReasons);
export const attentionPrioritySchema = z.enum(attentionPriorities);
export const connectionStateSchema = z.enum(['online', 'offline', 'broken']);
export const robotProtocolSchema = z.enum(['vda5050', 'massrobotics']);

export const robotSummaryDtoSchema = z.object({
  id: z.string().min(1),
  displayName: z.string(),
  vendor: z.string(),
  model: z.string(),
  protocol: robotProtocolSchema,
  siteId: z.string(),
  zone: z.string().nullable(),
  status: robotStatusSchema,
  attentionReasons: z.array(attentionReasonSchema),
  attentionSince: z.iso.datetime().nullable(),
  batteryPercent: z.number().min(0).max(100),
  charging: z.boolean(),
  speedMps: z.number().nonnegative(),
  operatingMode: z.string(),
  taskId: z.string().nullable(),
  lastReportAt: z.iso.datetime(),
  connection: connectionStateSchema,
});

// Position is not part of the fleet summary: it changes every second for every moving robot and only the robot detail
// shows it, so it travels with the detail (ADR 0018).
export const robotPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  headingRad: z.number(),
  mapId: z.string(),
});

export const robotPatchDtoSchema = robotSummaryDtoSchema.partial().extend({ id: z.string().min(1) });

export type RobotStatus = z.infer<typeof robotStatusSchema>;
export type AttentionReason = z.infer<typeof attentionReasonSchema>;
export type AttentionPriority = z.infer<typeof attentionPrioritySchema>;
export type ConnectionState = z.infer<typeof connectionStateSchema>;
export type RobotProtocol = z.infer<typeof robotProtocolSchema>;
export type RobotSummaryDto = z.infer<typeof robotSummaryDtoSchema>;
export type RobotPatchDto = z.infer<typeof robotPatchDtoSchema>;
export type RobotPosition = z.infer<typeof robotPositionSchema>;
