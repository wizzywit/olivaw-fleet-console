export interface DemoVendor {
  manufacturer: string;
  models: { seriesName: string; idPrefix: string }[];
}

export const vendors: DemoVendor[] = [
  { manufacturer: 'Nordbot', models: [{ seriesName: 'Scrubber S2', idPrefix: 'CLN' }] },
  {
    manufacturer: 'Kairo',
    models: [
      { seriesName: 'Courier K1', idPrefix: 'DLV' },
      { seriesName: 'Server K3', idPrefix: 'SRV' },
    ],
  },
  {
    manufacturer: 'Brightline',
    models: [
      { seriesName: 'Vac V5', idPrefix: 'VAC' },
      { seriesName: 'Patrol P1', idPrefix: 'SEC' },
    ],
  },
  { manufacturer: 'Lumen', models: [{ seriesName: 'Tug L2', idPrefix: 'TUG' }] },
  { manufacturer: 'Vectra', models: [{ seriesName: 'Shuttle X2', idPrefix: 'SHT' }] },
];
