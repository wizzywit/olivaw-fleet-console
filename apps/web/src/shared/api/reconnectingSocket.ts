import { backoffDelay } from '../lib/backoff';

export type SocketStatus = 'connecting' | 'open' | 'reconnecting' | 'closed';

export interface ReconnectingSocketOptions {
  url: string;
  onOpen: (send: (data: string) => void) => void;
  onMessage: (data: string) => void;
  onStatus: (status: SocketStatus, retryInMs: number | null) => void;
  backoff?: (attempt: number) => number;
  idleTimeoutMs?: number;
}

export function createReconnectingSocket({
  url,
  onOpen,
  onMessage,
  onStatus,
  backoff = backoffDelay,
  idleTimeoutMs,
}: ReconnectingSocketOptions) {
  let socket: WebSocket | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let attempt = 0;
  let closedByUs = false;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  function scheduleReconnect(): void {
    const delay = backoff(attempt);
    attempt += 1;
    onStatus('reconnecting', delay);
    retryTimer = setTimeout(connect, delay);
  }

  // A half-open connection (sleep, network change) can stay "open" for minutes; silence past the timeout counts as lost.
  function watchIdle(current: WebSocket): void {
    if (idleTimeoutMs === undefined) return;
    if (idleTimer !== null) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (socket !== current) return;
      socket = null;
      current.close();
      scheduleReconnect();
    }, idleTimeoutMs);
  }

  function connect(): void {
    retryTimer = null;
    onStatus(attempt === 0 ? 'connecting' : 'reconnecting', null);
    const current = new WebSocket(url);
    socket = current;
    current.addEventListener('open', () => {
      attempt = 0;
      onStatus('open', null);
      watchIdle(current);
      onOpen((data) => {
        current.send(data);
      });
    });
    current.addEventListener('message', (event: MessageEvent) => {
      watchIdle(current);
      onMessage(String(event.data));
    });
    current.addEventListener('close', () => {
      if (closedByUs || socket !== current) return;
      scheduleReconnect();
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
      if (idleTimer !== null) clearTimeout(idleTimer);
      socket?.close();
      onStatus('closed', null);
    },
  };
}

export type ReconnectingSocket = ReturnType<typeof createReconnectingSocket>;
