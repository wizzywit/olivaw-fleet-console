import type { SiteMapDto } from '@olivaw/contracts';
import { sites } from './sites';

const mapsById = new Map<string, { siteId: string; map: SiteMapDto }>(
  sites.flatMap((site) => site.maps.map((map) => [map.id, { siteId: site.id, map }] as const)),
);

export function siteIdForMap(mapId: string): string | null {
  return mapsById.get(mapId)?.siteId ?? null;
}

export function mapById(mapId: string): SiteMapDto | null {
  return mapsById.get(mapId)?.map ?? null;
}

export function zoneAt(mapId: string, x: number, y: number): string | null {
  const zone = mapById(mapId)?.zones.find(
    (candidate) =>
      x >= candidate.x &&
      x < candidate.x + candidate.width &&
      y >= candidate.y &&
      y < candidate.y + candidate.height,
  );
  return zone?.name ?? null;
}
