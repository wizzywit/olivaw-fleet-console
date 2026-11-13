import type { LiveStatus } from '../types/fleet';

export const isLive = (status: LiveStatus): boolean => status === 'live';
