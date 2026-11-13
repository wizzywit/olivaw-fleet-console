import type { Robot } from '../types/robot';

// The server decides when a battery is critical (ADR 0008); the client reads that decision instead of re-applying it.
export const isBatteryCritical = (robot: Robot): boolean =>
  robot.attentionReasons.includes('battery-critical');
