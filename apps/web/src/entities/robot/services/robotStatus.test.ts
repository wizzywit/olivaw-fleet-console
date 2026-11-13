import { isRobotStatus } from './robotStatus';

describe('isRobotStatus', () => {
  it('accepts the five statuses and nothing else', () => {
    expect(['working', 'charging', 'idle', 'attention', 'offline'].every(isRobotStatus)).toBe(true);
    expect(isRobotStatus('sleeping')).toBe(false);
    expect(isRobotStatus(null)).toBe(false);
  });
});
