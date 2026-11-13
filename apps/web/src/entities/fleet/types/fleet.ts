import type {
  AttentionGroupDto,
  FleetAggregatesDto,
  FleetConfigDto,
  RobotPatchDto,
  SiteDto,
  SiteMapDto,
} from '@olivaw/contracts';
import type { Robot } from '@/entities/robot/@x/fleet';

// Where the domain shape equals the wire shape, the contract type is reused instead of copied (ADR 0007).
export type FleetConfig = FleetConfigDto;
export type FleetAggregates = FleetAggregatesDto;
export type AttentionGroup = AttentionGroupDto;
export type Site = SiteDto;
export type SiteMap = SiteMapDto;

export type LiveStatus = 'connecting' | 'live' | 'reconnecting' | 'offline';

export interface FleetSnapshot {
  instanceId: string;
  sequence: number;
  generatedAt: Date;
  config: FleetConfig;
  sites: Site[];
  robots: Map<string, Robot>;
  aggregates: FleetAggregates;
}

export interface FleetPatch {
  sequence: number;
  robots: RobotPatchDto[];
  removed: string[];
  aggregates: FleetAggregates;
}
