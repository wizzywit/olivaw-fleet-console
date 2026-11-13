import { aPatch, aRobotDto, aSnapshotDto } from '@/test/fleetFixtures';
import { toFleetPatch, toFleetSnapshot } from '../adapter/fleetApiAdapter';
import { createFleetLiveStore } from './fleetLiveStore';

function setup(hidden = false) {
  const scheduled: (() => void)[] = [];
  const state = { hidden };
  const store = createFleetLiveStore({
    schedule: (run) => scheduled.push(run),
    isHidden: () => state.hidden,
    now: () => new Date('2026-11-13T10:00:05.000Z'),
  });
  store.getState().seed(toFleetSnapshot(aSnapshotDto()));
  const runFrames = () => {
    while (scheduled.length > 0) scheduled.shift()?.();
  };
  return { store, runFrames, state };
}

const battery = (store: ReturnType<typeof setup>['store'], id: string) =>
  store.getState().robots.get(id)?.battery.percent;

describe('fleet live store', () => {
  it('applies queued patches in order on the next frame', () => {
    const { store, runFrames } = setup();
    store.getState().queuePatch(toFleetPatch(aPatch(11, [{ id: 'CLN-0142', batteryPercent: 70 }])));
    store.getState().queuePatch(toFleetPatch(aPatch(12, [{ id: 'CLN-0142', batteryPercent: 69 }])));
    expect(battery(store, 'CLN-0142')).toBe(78);
    runFrames();
    expect(battery(store, 'CLN-0142')).toBe(69);
    expect(store.getState().sequence).toBe(12);
    expect(store.getState().live.lastPatchAt).toEqual(new Date('2026-11-13T10:00:05.000Z'));
  });

  it('ignores patches it has already seen', () => {
    const { store, runFrames } = setup();
    store.getState().queuePatch(toFleetPatch(aPatch(10, [{ id: 'CLN-0142', batteryPercent: 1 }])));
    runFrames();
    expect(battery(store, 'CLN-0142')).toBe(78);
  });

  it('adds a robot that joins after the snapshot', () => {
    const { store, runFrames } = setup();
    store.getState().queuePatch(toFleetPatch(aPatch(11, [aRobotDto({ id: 'NEW-0001' })])));
    runFrames();
    expect(store.getState().robots.has('NEW-0001')).toBe(true);
  });

  it('holds patches while the tab is hidden and applies them when it is visible again', () => {
    const { store, runFrames, state } = setup(true);
    store.getState().queuePatch(toFleetPatch(aPatch(11, [{ id: 'CLN-0142', batteryPercent: 70 }])));
    runFrames();
    expect(battery(store, 'CLN-0142')).toBe(78);
    state.hidden = false;
    store.getState().flush();
    expect(battery(store, 'CLN-0142')).toBe(70);
  });

  it('freezes while paused and resumes to the current state', () => {
    const { store, runFrames } = setup();
    store.getState().pause();
    store.getState().queuePatch(toFleetPatch(aPatch(11, [{ id: 'CLN-0142', batteryPercent: 70 }])));
    store.getState().queuePatch(toFleetPatch(aPatch(12, [{ id: 'CLN-0142', batteryPercent: 60 }])));
    runFrames();
    expect(battery(store, 'CLN-0142')).toBe(78);
    expect(store.getState().pendingCount).toBe(2);
    store.getState().resume();
    expect(battery(store, 'CLN-0142')).toBe(60);
    expect(store.getState().isPaused).toBe(false);
  });

  it('replaces everything when reseeded after a resync, even with a lower sequence', () => {
    const { store } = setup();
    store
      .getState()
      .seed(toFleetSnapshot(aSnapshotDto({ sequence: 2, robots: [aRobotDto({ batteryPercent: 33 })] })));
    expect(store.getState().sequence).toBe(2);
    expect(store.getState().robots.size).toBe(1);
    expect(battery(store, 'CLN-0142')).toBe(33);
  });
});
