import { z } from 'zod';
import { vda5050HeaderShape } from './header';

// Only the fields the console reads are required; see ADR 0004 for why the official schema is not used as-is.
export const vda5050FactsheetSchema = z.object({
  ...vda5050HeaderShape,
  typeSpecification: z.object({
    seriesName: z.string().min(1),
    seriesDescription: z.string().optional(),
  }),
});

export type Vda5050Factsheet = z.infer<typeof vda5050FactsheetSchema>;
