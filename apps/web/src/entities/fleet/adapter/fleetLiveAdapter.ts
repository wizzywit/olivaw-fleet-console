import { liveServerMessageSchema } from '@olivaw/contracts';
import { createReconnectingSocket, type SocketStatus } from '@/shared/api';
import { liveUrl } from '@/shared/config';
import type { FleetPatch, LiveStatus } from '../types/fleet';
import { toFleetPatch } from './fleetApiAdapter';

export interface FleetLiveHandlers {
  onPatch: (patch: FleetPatch) => void;
  onResync: () => void;
  onStatus: (status: LiveStatus, retryInMs: number | null) => void;
}

const liveStatuses: Record<SocketStatus, LiveStatus> = {
  connecting: 'connecting',
  open: 'live',
  reconnecting: 'reconnecting',
  closed: 'offline',
};

export function connectFleetLive(handlers: FleetLiveHandlers, getLastSequence: () => number | null) {
  return createReconnectingSocket({
    url: liveUrl(),
    onOpen: (send) => {
      send(JSON.stringify({ type: 'hello', lastSequence: getLastSequence() }));
    },
    onMessage: (data) => {
      let json: unknown;
      try {
        json = JSON.parse(data);
      } catch {
        return;
      }
      const message = liveServerMessageSchema.safeParse(json);
      if (!message.success) return;
      if (message.data.type === 'resync') handlers.onResync();
      else handlers.onPatch(toFleetPatch(message.data));
    },
    onStatus: (status, retryInMs) => {
      handlers.onStatus(liveStatuses[status], retryInMs);
    },
  });
}
