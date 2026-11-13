import { describe, expect, it } from 'vitest';
import factsheet from './fixtures/factsheet.json';
import { vda5050FactsheetSchema } from './factsheet';

describe('vda5050FactsheetSchema', () => {
  it('reads the series name', () => {
    expect(vda5050FactsheetSchema.parse(factsheet).typeSpecification.seriesName).toBe('Scrubber S2');
  });

  it('accepts a factsheet that omits the sections we do not use', () => {
    const minimal = { ...factsheet, typeSpecification: { seriesName: 'Scrubber S2' } };
    expect(vda5050FactsheetSchema.safeParse(minimal).success).toBe(true);
  });
});
