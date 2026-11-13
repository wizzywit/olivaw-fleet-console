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

// The server sends a heartbeat every 5 s; three missed ones mean the connection is gone even if the socket looks open.
const idleTimeoutMs = 15_000;

export function connectFleetLive(
  handlers: FleetLiveHandlers,
  getResumePoint: () => { lastSequence: number | null; instanceId: string | null },
) {
  return createReconnectingSocket({
    url: liveUrl(),
    idleTimeoutMs,
    onOpen: (send) => {
      send(JSON.stringify({ type: 'hello', ...getResumePoint() }));
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
      else if (message.data.type === 'patch') handlers.onPatch(toFleetPatch(message.data));
    },
    onStatus: (status, retryInMs) => {
      handlers.onStatus(liveStatuses[status], retryInMs);
    },
  });
}
