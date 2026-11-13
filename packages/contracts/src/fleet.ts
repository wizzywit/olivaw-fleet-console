import { z } from 'zod';
import {
  attentionPrioritySchema,
  attentionReasonSchema,
  robotStatusSchema,
  robotSummaryDtoSchema,
} from './robot';

const statusCountsSchema = z.record(robotStatusSchema, z.number().int().nonnegative());

export const fleetAggregatesDtoSchema = z.object({
  byStatus: statusCountsSchema,
  bySite: z.record(z.string(), statusCountsSchema),
  attentionGroups: z.array(
    z.object({
      reason: attentionReasonSchema,
      priority: attentionPrioritySchema,
      count: z.number().int().positive(),
      worstRobotId: z.string(),
      robotIds: z.array(z.string()),
    }),
  ),
});

const rectSchema = {
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
};

export const siteDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  maps: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      width: z.number().positive(),
      height: z.number().positive(),
      zones: z.array(z.object({ id: z.string(), name: z.string(), ...rectSchema })),
      docks: z.array(z.object({ id: z.string(), x: z.number(), y: z.number() })),
    }),
  ),
});

export const fleetConfigDtoSchema = z.object({
  staleAfterMs: z.number().int().positive(),
  criticalBatteryPercent: z.number().min(0).max(100),
  stuckAfterMs: z.number().int().positive(),
  patchIntervalMs: z.number().int().positive(),
});

export const fleetSnapshotDtoSchema = z.object({
  sequence: z.number().int().nonnegative(),
  generatedAt: z.iso.datetime(),
  config: fleetConfigDtoSchema,
  sites: z.array(siteDtoSchema),
  robots: z.array(robotSummaryDtoSchema),
  aggregates: fleetAggregatesDtoSchema,
});

export type StatusCounts = z.infer<typeof statusCountsSchema>;
export type FleetAggregatesDto = z.infer<typeof fleetAggregatesDtoSchema>;
export type AttentionGroupDto = FleetAggregatesDto['attentionGroups'][number];
export type SiteDto = z.infer<typeof siteDtoSchema>;
export type SiteMapDto = SiteDto['maps'][number];
export type FleetConfigDto = z.infer<typeof fleetConfigDtoSchema>;
export type FleetSnapshotDto = z.infer<typeof fleetSnapshotDtoSchema>;
