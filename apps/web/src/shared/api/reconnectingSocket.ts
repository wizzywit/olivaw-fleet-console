import { backoffDelay } from '../lib/backoff';

export type SocketStatus = 'connecting' | 'open' | 'reconnecting' | 'closed';

export interface ReconnectingSocketOptions {
  url: string;
  onOpen: (send: (data: string) => void) => void;
  onMessage: (data: string) => void;
  onStatus: (status: SocketStatus, retryInMs: number | null) => void;
  backoff?: (attempt: number) => number;
}

export function createReconnectingSocket({
  url,
  onOpen,
  onMessage,
  onStatus,
  backoff = backoffDelay,
}: ReconnectingSocketOptions) {
  let socket: WebSocket | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let attempt = 0;
  let closedByUs = false;

  function connect(): void {
    retryTimer = null;
    onStatus('connecting', null);
    const current = new WebSocket(url);
    socket = current;
    current.addEventListener('open', () => {
      attempt = 0;
      onStatus('open', null);
      onOpen((data) => {
        current.send(data);
      });
    });
    current.addEventListener('message', (event: MessageEvent) => {
      onMessage(String(event.data));
    });
    current.addEventListener('close', () => {
      if (closedByUs || socket !== current) return;
      const delay = backoff(attempt);
      attempt += 1;
      onStatus('reconnecting', delay);
      retryTimer = setTimeout(connect, delay);
    });
  }

  connect();

  return {
    retryNow(): void {
      if (retryTimer === null) return;
      clearTimeout(retryTimer);
      connect();
    },
    close(): void {
      closedByUs = true;
      if (retryTimer !== null) clearTimeout(retryTimer);
      socket?.close();
      onStatus('closed', null);
    },
  };
}

export type ReconnectingSocket = ReturnType<typeof createReconnectingSocket>;
