const defaultIngestUrl = 'http://127.0.0.1:4000';
const defaultLiveUrl = 'ws://127.0.0.1:4000/live';

// In the browser, API calls go to our own origin and Next rewrites /api/* to ingest; on the server they go to ingest directly.
export function apiBaseUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return process.env.INGEST_URL ?? defaultIngestUrl;
}

export function liveUrl(): string {
  return process.env.NEXT_PUBLIC_LIVE_URL ?? defaultLiveUrl;
}
