import { describe, expect, it } from 'vitest';
import { parseVda5050Topic, vda5050Topic } from './topic';

describe('vda5050 topics', () => {
  it('builds a v3 topic', () => {
    expect(vda5050Topic('Kairo', 'DLV-0087', 'state')).toBe('vda5050/v3/Kairo/DLV-0087/state');
  });

  it('parses a v3 topic', () => {
    expect(parseVda5050Topic('vda5050/v3/Kairo/DLV-0087/state')).toEqual({
      manufacturer: 'Kairo',
      serialNumber: 'DLV-0087',
      subtopic: 'state',
    });
  });

  it('ignores other major versions', () => {
    expect(parseVda5050Topic('vda5050/v2/Kairo/DLV-0087/state')).toBeNull();
  });

  it('ignores subtopics the console does not consume', () => {
    expect(parseVda5050Topic('vda5050/v3/Kairo/DLV-0087/order')).toBeNull();
  });

  it('ignores topics with the wrong number of levels', () => {
    expect(parseVda5050Topic('vda5050/v3/Kairo/state')).toBeNull();
    expect(parseVda5050Topic('vda5050/v3/Kairo/a/b/state')).toBeNull();
  });
});
