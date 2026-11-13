import type { SiteDto } from '@olivaw/contracts';

export const sites: SiteDto[] = [
  {
    id: 'airport-t2',
    name: 'Airport T2',
    maps: [
      {
        id: 't2-l0',
        name: 'Level 0',
        width: 200,
        height: 100,
        zones: [
          { id: 'hall-a', name: 'Hall A', x: 0, y: 0, width: 80, height: 40 },
          { id: 'gates-b', name: 'Gates B', x: 90, y: 0, width: 110, height: 30 },
          { id: 'gates-c', name: 'Gates C', x: 90, y: 35, width: 110, height: 30 },
          { id: 'security-lobby', name: 'Security & Lobby', x: 0, y: 50, width: 80, height: 50 },
          { id: 'docks', name: 'Docks', x: 90, y: 70, width: 40, height: 30 },
        ],
        docks: [
          { id: 't2-dock-1', x: 100, y: 85 },
          { id: 't2-dock-2', x: 110, y: 85 },
          { id: 't2-dock-3', x: 120, y: 85 },
        ],
      },
    ],
  },
  {
    id: 'hotel-isar',
    name: 'Hotel Isar',
    maps: [
      {
        id: 'isar-f4',
        name: 'Floor 4',
        width: 60,
        height: 20,
        zones: [
          { id: 'west-rooms', name: 'West rooms', x: 0, y: 0, width: 28, height: 8 },
          { id: 'east-rooms', name: 'East rooms', x: 32, y: 0, width: 28, height: 8 },
          { id: 'corridor', name: 'Corridor', x: 0, y: 8, width: 60, height: 4 },
          { id: 'service-area', name: 'Service area', x: 0, y: 12, width: 60, height: 8 },
        ],
        docks: [
          { id: 'isar-dock-1', x: 4, y: 16 },
          { id: 'isar-dock-2', x: 8, y: 16 },
        ],
      },
    ],
  },
  {
    id: 'klinikum-ost',
    name: 'Klinikum Ost',
    maps: [
      {
        id: 'ost-l0',
        name: 'Ground floor',
        width: 150,
        height: 80,
        zones: [
          { id: 'pharmacy', name: 'Pharmacy', x: 0, y: 0, width: 40, height: 30 },
          { id: 'main-hall', name: 'Main hall', x: 40, y: 0, width: 70, height: 40 },
          { id: 'car-park', name: 'Car park', x: 110, y: 0, width: 40, height: 80 },
          { id: 'ward-access', name: 'Ward access', x: 0, y: 40, width: 110, height: 40 },
        ],
        docks: [
          { id: 'ost-l0-dock-1', x: 60, y: 70 },
          { id: 'ost-l0-dock-2', x: 65, y: 70 },
        ],
      },
      {
        id: 'ost-l1',
        name: 'Level 1',
        width: 150,
        height: 80,
        zones: [
          { id: 'ward-3', name: 'Ward 3', x: 0, y: 0, width: 70, height: 40 },
          { id: 'ward-4', name: 'Ward 4', x: 80, y: 0, width: 70, height: 40 },
          { id: 'l1-corridor', name: 'Corridor', x: 0, y: 40, width: 150, height: 10 },
          { id: 'labs', name: 'Labs', x: 0, y: 50, width: 150, height: 30 },
        ],
        docks: [{ id: 'ost-l1-dock-1', x: 75, y: 45 }],
      },
    ],
  },
];
