import { liveClientMessageSchema, type LiveServerMessage } from '@olivaw/contracts';
import type { WebSocket } from '@fastify/websocket';
import type { PatchLog } from '../store/patchLog';

export function createLiveHub(patchLog: PatchLog, instanceId: string) {
  const subscribers = new Set<WebSocket>();

  const send = (socket: WebSocket, message: LiveServerMessage) => {
    if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
  };

  return {
    // Patches are only broadcast to sockets that said hello, so a client never sees a patch before its catch-up.
    accept(socket: WebSocket): void {
      socket.once('message', (data: Buffer) => {
        let hello;
        try {
          hello = liveClientMessageSchema.safeParse(JSON.parse(data.toString('utf8')));
        } catch {
          socket.close(1003, 'expected hello');
          return;
        }
        if (!hello.success) {
          socket.close(1003, 'expected hello');
          return;
        }
        const { lastSequence, instanceId: clientInstanceId } = hello.data;
        if (lastSequence !== null) {
          const missed = clientInstanceId === instanceId ? patchLog.since(lastSequence) : 'resync';
          if (missed === 'resync') {
            send(socket, { type: 'resync' });
          } else {
            for (const patch of missed) send(socket, patch);
          }
        }
        subscribers.add(socket);
      });
      socket.on('close', () => subscribers.delete(socket));
    },

    broadcast(message: LiveServerMessage): void {
      for (const socket of subscribers) send(socket, message);
    },

    closeAll(): void {
      for (const socket of subscribers) socket.close(1001, 'server shutting down');
      subscribers.clear();
    },
  };
}

export type LiveHub = ReturnType<typeof createLiveHub>;
