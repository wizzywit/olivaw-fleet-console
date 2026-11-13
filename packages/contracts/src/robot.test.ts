import { describe, expect, it } from 'vitest';
import { robotCommandRequestSchema } from './command';
import { robotDetailDtoSchema } from './detail';
import { robotSummaryDtoSchema } from './robot';

const summary = {
  id: 'DLV-0087',
  displayName: 'DLV-0087',
  vendor: 'Kairo',
  model: 'Courier K1',
  protocol: 'vda5050',
  siteId: 'hotel-isar',
  zone: 'Corridor',
  status: 'attention',
  attentionReasons: ['battery-critical'],
  attentionSince: '2026-11-13T10:38:00.000Z',
  batteryPercent: 12,
  charging: false,
  speedMps: 0.6,
  operatingMode: 'AUTOMATIC',
  taskId: 'ord-55a1',
  lastReportAt: '2026-11-13T10:41:07.120Z',
  connection: 'online',
};

const position = { x: 41.2, y: 8.7, headingRad: 1.57, mapId: 'isar-f4' };

describe('robot contracts', () => {
  it('keeps the position out of the fleet summary, because it changes every second for moving robots', () => {
    expect(Object.keys(robotSummaryDtoSchema.parse({ ...summary, position }))).not.toContain('position');
  });

  it('puts the position on the robot detail', () => {
    const extras = {
      serialNumber: 'DLV-0087',
      errors: [],
      rawMessage: { protocol: 'vda5050', receivedAt: '2026-11-13T10:41:07.120Z', payload: {} },
    };
    expect(robotDetailDtoSchema.safeParse({ ...summary, ...extras }).success).toBe(false);
    expect(robotDetailDtoSchema.parse({ ...summary, ...extras, position }).position).toEqual(position);
  });

  it('parses a robot summary', () => {
    expect(robotSummaryDtoSchema.parse(summary).status).toBe('attention');
  });

  it('rejects an unknown status', () => {
    expect(robotSummaryDtoSchema.safeParse({ ...summary, status: 'sleeping' }).success).toBe(false);
  });

  it('parses a robot detail with its raw message', () => {
    const detail = robotDetailDtoSchema.parse({
      ...summary,
      serialNumber: 'DLV-0087',
      position,
      errors: [{ level: 'urgent', code: 'BATTERY_LOW', description: null }],
      rawMessage: { protocol: 'vda5050', receivedAt: summary.lastReportAt, payload: { headerId: 1 } },
    });
    expect(detail.errors[0]?.level).toBe('urgent');
  });

  it('accepts only known commands', () => {
    expect(robotCommandRequestSchema.safeParse({ type: 'send-to-dock' }).success).toBe(true);
    expect(robotCommandRequestSchema.safeParse({ type: 'self-destruct' }).success).toBe(false);
  });
});
