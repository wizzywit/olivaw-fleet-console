import { describe, expect, it } from 'vitest';
import { aRecord, t } from '../../test/builders';
import { computeAggregates } from './aggregates';
import { createAcknowledgements } from './acknowledgements';

describe('computeAggregates', () => {
  it('counts every status, per site, including zeros', () => {
    const aggregates = computeAggregates(createAcknowledgements(), [
      aRecord({ robotId: 'A', mapId: 'isar-f4', status: 'working' }),
      aRecord({ robotId: 'B', mapId: 'isar-f4', status: 'offline' }),
      aRecord({ robotId: 'C', mapId: 't2-l0', status: 'charging' }),
    ]);
    expect(aggregates.byStatus).toEqual({ working: 1, charging: 1, idle: 0, attention: 0, offline: 1 });
    expect(aggregates.bySite['hotel-isar']).toEqual({
      working: 1,
      charging: 0,
      idle: 0,
      attention: 0,
      offline: 1,
    });
    expect(aggregates.bySite['airport-t2']).toEqual({
      working: 0,
      charging: 1,
      idle: 0,
      attention: 0,
      offline: 0,
    });
    expect(aggregates.bySite['klinikum-ost']).toEqual({
      working: 0,
      charging: 0,
      idle: 0,
      attention: 0,
      offline: 0,
    });
  });

  it('groups only robots whose status is attention, by reason, largest group first', () => {
    const aggregates = computeAggregates(createAcknowledgements(), [
      aRecord({
        robotId: 'A',
        status: 'attention',
        attentionReasons: ['battery-critical'],
        batteryPercent: 9,
      }),
      aRecord({
        robotId: 'B',
        status: 'attention',
        attentionReasons: ['battery-critical'],
        batteryPercent: 4,
      }),
      aRecord({ robotId: 'C', status: 'attention', attentionReasons: ['stuck'], attentionSince: t(0) }),
      aRecord({ robotId: 'D', status: 'offline', attentionReasons: ['battery-critical'], batteryPercent: 1 }),
    ]);
    expect(aggregates.attentionGroups).toEqual([
      {
        reason: 'battery-critical',
        priority: 'high',
        count: 2,
        unacknowledgedCount: 2,
        worstRobotId: 'B',
        robotIds: ['A', 'B'],
      },
      {
        reason: 'stuck',
        priority: 'medium',
        count: 1,
        unacknowledgedCount: 1,
        worstRobotId: 'C',
        robotIds: ['C'],
      },
    ]);
  });

  it('picks the robot in attention longest as worst for non-battery reasons', () => {
    const aggregates = computeAggregates(createAcknowledgements(), [
      aRecord({
        robotId: 'A',
        status: 'attention',
        attentionReasons: ['error-reported'],
        attentionSince: t(5000),
      }),
      aRecord({
        robotId: 'B',
        status: 'attention',
        attentionReasons: ['error-reported'],
        attentionSince: t(1000),
      }),
    ]);
    expect(aggregates.attentionGroups[0]?.worstRobotId).toBe('B');
  });

  it('counts a robot with two reasons in both groups', () => {
    const aggregates = computeAggregates(createAcknowledgements(), [
      aRecord({
        robotId: 'A',
        status: 'attention',
        attentionReasons: ['emergency-stop', 'battery-critical'],
      }),
    ]);
    expect(aggregates.attentionGroups.map((group) => group.reason)).toEqual([
      'emergency-stop',
      'battery-critical',
    ]);
  });

  it('sorts high priority groups before larger medium priority groups', () => {
    const stuck = (robotId: string) =>
      aRecord({ robotId, status: 'attention', attentionReasons: ['stuck'], attentionSince: t(0) });
    const aggregates = computeAggregates(createAcknowledgements(), [
      stuck('A'),
      stuck('B'),
      stuck('C'),
      aRecord({
        robotId: 'D',
        status: 'attention',
        attentionReasons: ['battery-critical'],
        batteryPercent: 5,
      }),
    ]);
    expect(aggregates.attentionGroups.map((group) => [group.reason, group.priority])).toEqual([
      ['battery-critical', 'high'],
      ['stuck', 'medium'],
    ]);
  });

  it('reports acknowledged members, and forgets robots that left every group', () => {
    const acknowledgements = createAcknowledgements();
    const stuck = (robotId: string) => aRecord({ robotId, status: 'attention', attentionReasons: ['stuck'] });
    acknowledgements.acknowledge('stuck', ['A', 'B']);
    expect(
      computeAggregates(acknowledgements, [stuck('A'), stuck('B'), stuck('C')]).attentionGroups[0]
        ?.unacknowledgedCount,
    ).toBe(1);
    computeAggregates(acknowledgements, [stuck('C')]);
    expect(
      computeAggregates(acknowledgements, [stuck('A'), stuck('C')]).attentionGroups[0]?.unacknowledgedCount,
    ).toBe(2);
  });
});
