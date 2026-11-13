import { beforeEach, describe, expect, it, vi } from 'vitest';
import { anObservation, t, testConfig } from '../../test/builders';
import { createRobotStore } from './robotStore';

describe('robot store', () => {
  const log = vi.fn();
  let store: ReturnType<typeof createRobotStore>;

  beforeEach(() => {
    log.mockReset();
    store = createRobotStore(testConfig, { log });
  });

  it('ignores an observation on a map that belongs to no site', () => {
    store.applyObservation(anObservation({ mapId: 'unknown-map' }), t(0));
    expect(store.snapshot().robots).toEqual([]);
    expect(log).toHaveBeenCalledTimes(1);
  });

  it('reports a new robot with every summary field', () => {
    store.applyObservation(anObservation(), t(0));
    const [robot] = store.drainChanges().changed;
    expect(robot).toEqual({
      id: 'DLV-0087',
      displayName: 'DLV-0087',
      vendor: 'Kairo',
      model: 'Courier K1',
      protocol: 'vda5050',
      siteId: 'hotel-isar',
      zone: 'Corridor',
      status: 'working',
      attentionReasons: [],
      attentionSince: null,
      batteryPercent: 64,
      charging: false,
      speedMps: 0.6,
      operatingMode: 'AUTOMATIC',
      taskId: 'ord-55a1',
      lastReportAt: t(0).toISOString(),
      connection: 'online',
    });
  });

  it('reports nothing when an identical observation arrives', () => {
    store.applyObservation(anObservation(), t(0));
    store.drainChanges();
    store.applyObservation(anObservation(), t(0));
    expect(store.drainChanges().changed).toEqual([]);
  });

  it('reports only the fields that changed', () => {
    store.applyObservation(anObservation(), t(0));
    store.drainChanges();
    store.applyObservation(anObservation({ batteryPercent: 63, receivedAt: t(1000) }), t(1000));
    expect(store.drainChanges().changed).toEqual([
      { id: 'DLV-0087', batteryPercent: 63, lastReportAt: t(1000).toISOString() },
    ]);
  });

  it('does not send a robot whose only change is a new report', () => {
    store.applyObservation(anObservation(), t(0));
    store.drainChanges();
    store.applyObservation(anObservation({ receivedAt: t(1000), x: 45 }), t(1000));
    expect(store.drainChanges().changed).toEqual([]);
  });

  it('sends the time of the last report when a robot goes silent and turns offline', () => {
    store.applyObservation(anObservation(), t(0));
    store.drainChanges();
    store.applyObservation(anObservation({ receivedAt: t(1000) }), t(1000));
    store.drainChanges();
    store.sweep(t(4001));
    expect(store.drainChanges().changed).toEqual([
      { id: 'DLV-0087', status: 'offline', lastReportAt: t(1000).toISOString() },
    ]);
  });

  it('floors battery and rounds motion values so tiny changes do not flood patches', () => {
    store.applyObservation(anObservation({ batteryPercent: 14.97, speedMps: 0.6123, x: 41.234 }), t(0));
    const [robot] = store.drainChanges().changed;
    expect(robot?.batteryPercent).toBe(14);
    expect(robot?.speedMps).toBe(0.6);
    expect(store.detail('DLV-0087')?.position).toEqual({
      x: 41.2,
      y: 8.7,
      headingRad: 1.57,
      mapId: 'isar-f4',
    });
  });

  it('turns a silent robot offline on the sweep after the stale threshold', () => {
    store.applyObservation(anObservation(), t(0));
    store.drainChanges();
    store.sweep(t(3000));
    expect(store.drainChanges().changed).toEqual([]);
    store.sweep(t(3001));
    expect(store.drainChanges().changed).toEqual([{ id: 'DLV-0087', status: 'offline' }]);
  });

  it('skips the diff work for robots a sweep left unchanged', () => {
    store.applyObservation(anObservation(), t(0));
    store.drainChanges();
    store.sweep(t(1000));
    const stringify = vi.spyOn(JSON, 'stringify');
    expect(store.drainChanges().changed).toEqual([]);
    expect(stringify).not.toHaveBeenCalled();
    stringify.mockRestore();
  });

  it('turns a robot offline when its connection breaks and online again on its next state', () => {
    store.applyObservation(anObservation(), t(0));
    store.applyConnection('DLV-0087', 'broken', t(500));
    expect(store.detail('DLV-0087')?.status).toBe('offline');
    store.applyObservation(anObservation({ receivedAt: t(9000) }), t(9000));
    expect(store.detail('DLV-0087')?.connection).toBe('online');
    expect(store.detail('DLV-0087')?.status).toBe('working');
  });

  it('ignores a connection event for an unknown robot', () => {
    store.applyConnection('NOPE', 'broken', t(0));
    expect(store.snapshot().robots).toEqual([]);
  });

  it('sets attentionSince when entering attention and clears it when leaving', () => {
    store.applyObservation(anObservation({ batteryPercent: 10 }), t(0));
    expect(store.detail('DLV-0087')?.attentionSince).toBe(t(0).toISOString());
    store.applyObservation(anObservation({ batteryPercent: 9, receivedAt: t(1000) }), t(1000));
    expect(store.detail('DLV-0087')?.attentionSince).toBe(t(0).toISOString());
    store.applyObservation(
      anObservation({ batteryPercent: 9, charging: true, receivedAt: t(2000) }),
      t(2000),
    );
    expect(store.detail('DLV-0087')?.attentionSince).toBeNull();
  });

  it('detects a robot stuck with a task through the sweep', () => {
    store.applyObservation(anObservation({ driving: false, receivedAt: t(0) }), t(0));
    for (let ms = 1000; ms <= 121_000; ms += 1000) {
      store.applyObservation(anObservation({ driving: false, receivedAt: t(ms) }), t(ms));
    }
    expect(store.detail('DLV-0087')?.attentionReasons).toEqual(['stuck']);
  });

  it('serves a detail with errors and the raw message', () => {
    store.applyObservation(
      anObservation({
        errors: [{ level: 'urgent', code: 'BATTERY_LOW', description: null }],
        raw: { headerId: 9 },
      }),
      t(0),
    );
    const detail = store.detail('DLV-0087');
    expect(detail?.errors).toEqual([{ level: 'urgent', code: 'BATTERY_LOW', description: null }]);
    expect(detail?.rawMessage).toEqual({
      protocol: 'vda5050',
      receivedAt: t(0).toISOString(),
      payload: { headerId: 9 },
    });
    expect(store.detail('UNKNOWN')).toBeUndefined();
  });

  it('acknowledges only current members, and reports the aggregates as changed', () => {
    store.applyObservation(anObservation({ batteryPercent: 10 }), t(0));
    store.drainChanges();
    expect(store.aggregates().attentionGroups[0]?.unacknowledgedCount).toBe(1);
    store.acknowledge('battery-critical', ['DLV-0087', 'NOT-A-MEMBER']);
    expect(store.drainChanges().aggregatesChanged).toBe(true);
    expect(store.aggregates().attentionGroups[0]?.unacknowledgedCount).toBe(0);
    expect(store.drainChanges().aggregatesChanged).toBe(false);
  });

  it('includes aggregates in the snapshot', () => {
    store.applyObservation(anObservation(), t(0));
    expect(store.snapshot().aggregates.byStatus.working).toBe(1);
  });
});
