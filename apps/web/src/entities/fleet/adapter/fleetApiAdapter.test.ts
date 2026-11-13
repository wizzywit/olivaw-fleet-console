import { http, HttpResponse } from 'msw';
import { aRobotDto, aSnapshotDto } from '@/test/fleetFixtures';
import { server } from '@/test/msw';
import { applyRobotPatch, fetchFleetSnapshotDto, toFleetSnapshot, toRobot } from './fleetApiAdapter';

describe('fleet api adapter', () => {
  it('maps a robot summary to the domain with dates and grouped battery', () => {
    const robot = toRobot(aRobotDto({ attentionSince: '2026-11-13T09:58:00.000Z' }));
    expect(robot.lastReportAt).toEqual(new Date('2026-11-13T10:00:00.000Z'));
    expect(robot.attentionSince).toEqual(new Date('2026-11-13T09:58:00.000Z'));
    expect(robot.battery).toEqual({ percent: 78, charging: false });
  });

  it('maps a snapshot and keys robots by id', () => {
    const snapshot = toFleetSnapshot(aSnapshotDto());
    expect(snapshot.robots.get('DLV-0087')?.status).toBe('attention');
    expect(snapshot.generatedAt).toEqual(new Date('2026-11-13T10:00:00.000Z'));
  });

  it('merges a partial patch into a known robot', () => {
    const merged = applyRobotPatch(toRobot(aRobotDto()), { id: 'CLN-0142', batteryPercent: 50 });
    expect(merged?.battery.percent).toBe(50);
    expect(merged?.model).toBe('Scrubber S2');
  });

  it('creates a robot that first appears in a patch with all fields', () => {
    expect(applyRobotPatch(undefined, aRobotDto({ id: 'NEW-0001' }))?.id).toBe('NEW-0001');
  });

  it('refuses an incomplete patch for a robot it has never seen', () => {
    expect(applyRobotPatch(undefined, { id: 'NEW-0002', batteryPercent: 50 })).toBeNull();
  });

  it('fetches the snapshot from the console api', async () => {
    server.use(http.get('*/api/fleet', () => HttpResponse.json(aSnapshotDto())));
    await expect(fetchFleetSnapshotDto()).resolves.toMatchObject({ sequence: 10 });
  });
});
