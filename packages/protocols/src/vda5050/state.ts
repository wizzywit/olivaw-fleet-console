import { z } from 'zod';
import { vda5050HeaderShape } from './header';

export const vda5050ErrorLevels = ['WARNING', 'URGENT', 'CRITICAL', 'FATAL'] as const;
export const vda5050OperatingModes = [
  'STARTUP',
  'AUTOMATIC',
  'SEMIAUTOMATIC',
  'INTERVENED',
  'MANUAL',
  'SERVICE',
  'TEACH_IN',
] as const;

const referenceSchema = z.object({ referenceKey: z.string(), referenceValue: z.string() });

const nodeStateSchema = z.object({
  nodeId: z.string(),
  sequenceId: z.number().int(),
  released: z.boolean(),
  nodeDescriptor: z.string().optional(),
});

const edgeStateSchema = z.object({
  edgeId: z.string(),
  sequenceId: z.number().int(),
  released: z.boolean(),
  edgeDescriptor: z.string().optional(),
});

const actionStateSchema = z.object({
  actionId: z.string(),
  actionStatus: z.enum(['WAITING', 'INITIALIZING', 'RUNNING', 'PAUSED', 'RETRIABLE', 'FINISHED', 'FAILED']),
  actionType: z.string().optional(),
  actionDescriptor: z.string().optional(),
  actionResult: z.string().optional(),
});

export const vda5050ErrorSchema = z.object({
  errorType: z.string(),
  errorLevel: z.enum(vda5050ErrorLevels),
  errorReferences: z.array(referenceSchema).optional(),
  errorDescription: z.string().optional(),
  errorHint: z.string().optional(),
});

export const vda5050StateSchema = z.object({
  ...vda5050HeaderShape,
  orderId: z.string(),
  orderUpdateId: z.number().int().nonnegative(),
  lastNodeId: z.string(),
  lastNodeSequenceId: z.number().int().nonnegative(),
  nodeStates: z.array(nodeStateSchema),
  edgeStates: z.array(edgeStateSchema),
  driving: z.boolean(),
  paused: z.boolean().optional(),
  actionStates: z.array(actionStateSchema),
  instantActionStates: z.array(actionStateSchema),
  powerSupply: z.object({
    stateOfCharge: z.number().min(0).max(100),
    charging: z.boolean(),
    batteryVoltage: z.number().optional(),
    batteryCurrent: z.number().optional(),
    batteryHealth: z.number().min(0).max(100).optional(),
    range: z.number().nonnegative().optional(),
  }),
  operatingMode: z.enum(vda5050OperatingModes),
  errors: z.array(vda5050ErrorSchema),
  safetyState: z.object({
    activeEmergencyStop: z.enum(['MANUAL', 'REMOTE', 'NONE']),
    fieldViolation: z.boolean(),
  }),
  mobileRobotPosition: z
    .object({
      x: z.number(),
      y: z.number(),
      theta: z.number(),
      mapId: z.string(),
      localized: z.boolean(),
      localizationScore: z.number().min(0).max(1).optional(),
      deviationRange: z.number().nonnegative().optional(),
    })
    .optional(),
  velocity: z
    .object({ vx: z.number().optional(), vy: z.number().optional(), omega: z.number().optional() })
    .optional(),
  information: z
    .array(
      z.object({
        infoType: z.string(),
        infoLevel: z.enum(['INFO', 'DEBUG']),
        infoDescriptor: z.string().optional(),
        infoReferences: z.array(referenceSchema).optional(),
      }),
    )
    .optional(),
});

export type Vda5050State = z.infer<typeof vda5050StateSchema>;
export type Vda5050Error = z.infer<typeof vda5050ErrorSchema>;
export type Vda5050ErrorLevel = (typeof vda5050ErrorLevels)[number];
export type Vda5050OperatingMode = (typeof vda5050OperatingModes)[number];
