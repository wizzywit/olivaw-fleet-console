const countFormat = new Intl.NumberFormat('en-US');

export function formatRelativeTime(from: Date, now: Date): string {
  const seconds = Math.floor((now.getTime() - from.getTime()) / 1000);
  if (seconds < 2) return 'just now';
  if (seconds < 60) return `${seconds} s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)} h ago`;
}

export const formatCount = (value: number): string => countFormat.format(value);

export const formatPercent = (value: number): string => `${Math.round(value)}%`;

export const formatClockTime = (date: Date): string =>
  [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
