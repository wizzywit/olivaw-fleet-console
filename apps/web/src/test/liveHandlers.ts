import { http, HttpResponse, ws } from 'msw';
import type { FleetSnapshotDto } from '@olivaw/contracts';
import { aSnapshotDto } from './fleetFixtures';

export const liveLink = ws.link('ws://127.0.0.1:4000/live');

export const fleetHandlers = (snapshot: FleetSnapshotDto = aSnapshotDto()) => [
  http.get('*/api/fleet', () => HttpResponse.json(snapshot)),
  liveLink.addEventListener('connection', () => undefined),
];
