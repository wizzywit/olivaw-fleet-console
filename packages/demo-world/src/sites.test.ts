import { describe, expect, it } from 'vitest';
import { siteIdForMap, sites, vendors, zoneAt } from './index';

describe('demo world', () => {
  it('has three sites', () => {
    expect(sites.map((site) => site.id)).toEqual(['airport-t2', 'hotel-isar', 'klinikum-ost']);
  });

  it('uses every map id once across sites', () => {
    const mapIds = sites.flatMap((site) => site.maps.map((map) => map.id));
    expect(new Set(mapIds).size).toBe(mapIds.length);
  });

  it('finds the site that owns a map', () => {
    expect(siteIdForMap('isar-f4')).toBe('hotel-isar');
    expect(siteIdForMap('unknown-map')).toBeNull();
  });

  it('finds the zone at a position', () => {
    expect(zoneAt('isar-f4', 41.2, 8.7)).toBe('Corridor');
    expect(zoneAt('t2-l0', 120.4, 38.2)).toBe('Gates C');
  });

  it('returns null outside every zone or on an unknown map', () => {
    expect(zoneAt('t2-l0', 85, 45)).toBeNull();
    expect(zoneAt('unknown-map', 1, 1)).toBeNull();
  });

  it('has five vendors with unique id prefixes per model', () => {
    expect(vendors).toHaveLength(5);
    const prefixes = vendors.flatMap((vendor) => vendor.models.map((model) => model.idPrefix));
    expect(new Set(prefixes).size).toBe(prefixes.length);
  });
});
