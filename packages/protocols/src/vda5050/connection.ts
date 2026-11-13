import { z } from 'zod';
import { vda5050HeaderShape } from './header';

export const vda5050ConnectionSchema = z.object({
  ...vda5050HeaderShape,
  connectionState: z.enum(['ONLINE', 'OFFLINE', 'HIBERNATING', 'CONNECTION_BROKEN']),
});

export type Vda5050Connection = z.infer<typeof vda5050ConnectionSchema>;
export type Vda5050ConnectionState = Vda5050Connection['connectionState'];
