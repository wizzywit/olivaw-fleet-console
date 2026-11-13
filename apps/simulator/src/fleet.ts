import { sites, vendors } from '@olivaw/demo-world';
import { between, createRng, type Rng } from './rng';
import { randomPointOnMap, type SimMode, type SimRobot } from './robotModel';

// Relative fleet size per site, so any robot count keeps the same proportions.
const siteWeights: Record<string, number> = { 'airport-t2': 412, 'hotel-isar': 186, 'klinikum-ost': 650 };

const models = vendors.flatMap((vendor) =>
  vendor.models.map((model) => ({ manufacturer: vendor.manufacturer, ...model })),
);

function splitByWeight(total: number): { siteId: string; count: number }[] {
  const weightSum = sites.reduce((sum, site) => sum + (siteWeights[site.id] ?? 0), 0);
  const shares = sites.map((site) => {
    const exact = (total * (siteWeights[site.id] ?? 0)) / weightSum;
    return { siteId: site.id, count: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  let left = total - shares.reduce((sum, share) => sum + share.count, 0);
  for (const share of [...shares].sort((a, b) => b.remainder - a.remainder)) {
    if (left === 0) break;
    share.count += 1;
    left -= 1;
  }
  return shares.map(({ siteId, count }) => ({ siteId, count }));
}

function initialMode(rng: Rng): SimMode {
  const roll = rng();
  if (roll < 0.7) return 'working';
  if (roll < 0.85) return 'charging';
  return 'idle';
}

export function createFleet(count: number, seed: number): SimRobot[] {
  const rng = createRng(seed);
  const serialsPerPrefix = new Map<string, number>();
  const robots: SimRobot[] = [];

  for (const { siteId, count: siteCount } of splitByWeight(count)) {
    const site = sites.find((candidate) => candidate.id === siteId);
    if (site === undefined) continue;
    for (let i = 0; i < siteCount; i += 1) {
      const map = site.maps[i % site.maps.length];
      const model = models[robots.length % models.length];
      if (map === undefined || model === undefined) continue;
      const serial = (serialsPerPrefix.get(model.idPrefix) ?? 0) + 1;
      serialsPerPrefix.set(model.idPrefix, serial);
      const serialNumber = `${model.idPrefix}-${String(serial).padStart(4, '0')}`;
      const mode = initialMode(rng);
      const position = randomPointOnMap(map.id, rng);
      robots.push({
        serialNumber,
        manufacturer: model.manufacturer,
        seriesName: model.seriesName,
        mapId: map.id,
        ...position,
        headingRad: between(rng, -Math.PI, Math.PI),
        speedMps: 0,
        batteryPercent: between(rng, 25, 100),
        charging: mode === 'charging',
        mode,
        orderId: mode === 'working' ? `ord-${serialNumber.toLowerCase()}-1` : null,
        orderCount: mode === 'working' ? 1 : 0,
        target: mode === 'working' ? randomPointOnMap(map.id, rng) : null,
        // Some robots are configured to return late, so a few reach critical battery like real fleets do.
        returnAtPercent: between(rng, 12, 22),
        errors: [],
        recoverAtMs: null,
        dropoutUntilMs: null,
      });
    }
  }
  return robots;
}
