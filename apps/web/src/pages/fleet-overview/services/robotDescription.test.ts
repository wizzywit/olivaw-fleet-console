import { describeRobot } from './robotDescription';

describe('describeRobot', () => {
  it('says where the robot is in the list, who it is, its status and battery', () => {
    expect(
      describeRobot(
        { id: 'DLV-0087', status: 'attention', batteryPercent: 12, isStale: false },
        'Row 3 of 60',
      ),
    ).toBe('Row 3 of 60: DLV-0087, Needs attention, battery 12%');
  });

  it('says when the values are last known', () => {
    expect(
      describeRobot(
        { id: 'CLN-0142', status: 'working', batteryPercent: 78, isStale: true },
        'Hotel, 1 of 2',
      ),
    ).toBe('Hotel, 1 of 2: CLN-0142, Working (last known), battery 78%');
  });
});
