import { z } from 'zod';
import { fleetAggregatesDtoSchema } from './fleet';
import { robotPatchDtoSchema } from './robot';

export const livePatchSchema = z.object({
  type: z.literal('patch'),
  sequence: z.number().int().positive(),
  robots: z.array(robotPatchDtoSchema),
  removed: z.array(z.string()),
  aggregates: fleetAggregatesDtoSchema,
});

export const liveServerMessageSchema = z.discriminatedUnion('type', [
  livePatchSchema,
  z.object({ type: z.literal('resync') }),
]);

export const liveClientMessageSchema = z.object({
  type: z.literal('hello'),
  lastSequence: z.number().int().nonnegative().nullable(),
});

export type LivePatch = z.infer<typeof livePatchSchema>;
export type LiveServerMessage = z.infer<typeof liveServerMessageSchema>;
export type LiveClientMessage = z.infer<typeof liveClientMessageSchema>;
