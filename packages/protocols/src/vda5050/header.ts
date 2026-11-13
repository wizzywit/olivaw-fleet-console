import { z } from 'zod';

export const vda5050HeaderShape = {
  headerId: z.number().int().nonnegative(),
  timestamp: z.iso.datetime(),
  version: z.string(),
  manufacturer: z.string().min(1),
  serialNumber: z.string().min(1),
};
