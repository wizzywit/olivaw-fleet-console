import { mapById, siteIdForMap } from '@olivaw/demo-world';
import { describe, expect, it } from 'vitest';
import { createFleet } from './fleet';

describe('createFleet', () => {
  it('is deterministic for a seed', () => {
    expect(createFleet(50, 42)).toEqual(createFleet(50, 42));
  });

  it('splits robots across sites in proportion 412 / 186 / 650', () => {
    const fleet = createFleet(1200, 42);
    const count = (siteId: string) => fleet.filter((robot) => siteIdForMap(robot.mapId) === siteId).length;
    expect(Math.abs(count('airport-t2') - 395)).toBeLessThanOrEqual(1);
    expect(Math.abs(count('hotel-isar') - 179)).toBeLessThanOrEqual(1);
    expect(Math.abs(count('klinikum-ost') - 626)).toBeLessThanOrEqual(1);
  });

  it('gives every robot a unique serial number with its model prefix', () => {
    const fleet = createFleet(1200, 42);
    expect(new Set(fleet.map((robot) => robot.serialNumber)).size).toBe(1200);
    expect(fleet[0]?.serialNumber).toMatch(/^[A-Z]{3}-\d{4}$/);
  });

  it('places every robot inside its map', () => {
    for (const robot of createFleet(200, 3)) {
      const map = mapById(robot.mapId);
      expect(map).not.toBeNull();
      expect(robot.x).toBeGreaterThanOrEqual(0);
      expect(robot.x).toBeLessThanOrEqual(map?.width ?? 0);
      expect(robot.y).toBeGreaterThanOrEqual(0);
      expect(robot.y).toBeLessThanOrEqual(map?.height ?? 0);
    }
  });
});
