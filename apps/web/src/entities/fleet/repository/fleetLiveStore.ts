import { createStore } from 'zustand/vanilla';
import type { Robot } from '@/entities/robot/@x/fleet';
import { applyRobotPatch } from '../adapter/fleetApiAdapter';
import type {
  FleetAggregates,
  FleetConfig,
  FleetPatch,
  FleetSnapshot,
  LiveStatus,
  Site,
} from '../types/fleet';

export interface FleetLiveState {
  robots: Map<string, Robot>;
  aggregates: FleetAggregates | null;
  sites: Site[];
  config: FleetConfig | null;
  sequence: number | null;
  live: { status: LiveStatus; retryInMs: number | null; lastPatchAt: Date | null };
  isPaused: boolean;
  pendingCount: number;
  seed: (snapshot: FleetSnapshot) => void;
  queuePatch: (patch: FleetPatch) => void;
  flush: () => void;
  setLive: (status: LiveStatus, retryInMs: number | null) => void;
  pause: () => void;
  resume: () => void;
  retryLive: () => void;
  setRetryLive: (retry: () => void) => void;
  reset: () => void;
}

export interface FleetLiveStoreDeps {
  schedule: (run: () => void) => void;
  isHidden: () => boolean;
  now: () => Date;
}

export function createFleetLiveStore({ schedule, isHidden, now }: FleetLiveStoreDeps) {
  let pending: FleetPatch[] = [];
  let frameRequested = false;

  return createStore<FleetLiveState>()((set, get) => {
    const initialState = () => ({
      robots: new Map<string, Robot>(),
      aggregates: null,
      sites: [],
      config: null,
      sequence: null,
      live: { status: 'connecting' as LiveStatus, retryInMs: null, lastPatchAt: null },
      isPaused: false,
      pendingCount: 0,
      retryLive: () => undefined,
    });

    const requestFrame = () => {
      if (frameRequested || get().isPaused || isHidden()) return;
      frameRequested = true;
      schedule(() => {
        frameRequested = false;
        get().flush();
      });
    };

    return {
      ...initialState(),

      seed(snapshot) {
        pending = pending.filter((patch) => patch.sequence > snapshot.sequence);
        set({
          robots: new Map(snapshot.robots),
          aggregates: snapshot.aggregates,
          sites: snapshot.sites,
          config: snapshot.config,
          sequence: snapshot.sequence,
          pendingCount: pending.length,
        });
        if (pending.length > 0) requestFrame();
      },

      queuePatch(patch) {
        const { sequence } = get();
        if (sequence === null) return;
        const latest = Math.max(sequence, pending.at(-1)?.sequence ?? sequence);
        if (patch.sequence <= latest) return;
        pending.push(patch);
        set({ pendingCount: pending.length });
        requestFrame();
      },

      flush() {
        if (get().isPaused || pending.length === 0) return;
        const robots = new Map(get().robots);
        for (const patch of pending) {
          for (const robotPatch of patch.robots) {
            const next = applyRobotPatch(robots.get(robotPatch.id), robotPatch);
            if (next !== null) robots.set(next.id, next);
          }
          for (const id of patch.removed) robots.delete(id);
        }
        const last = pending.at(-1);
        pending = [];
        set((state) => ({
          robots,
          aggregates: last?.aggregates ?? state.aggregates,
          sequence: last?.sequence ?? state.sequence,
          pendingCount: 0,
          live: { ...state.live, lastPatchAt: now() },
        }));
      },

      setLive(status, retryInMs) {
        set((state) => ({ live: { ...state.live, status, retryInMs } }));
      },

      pause() {
        set({ isPaused: true });
      },

      resume() {
        set({ isPaused: false });
        get().flush();
      },

      setRetryLive(retry) {
        set({ retryLive: retry });
      },

      reset() {
        pending = [];
        frameRequested = false;
        set(initialState());
      },
    };
  });
}

export type FleetLiveStore = ReturnType<typeof createFleetLiveStore>;

const browserDeps: FleetLiveStoreDeps = {
  schedule: (run) => {
    requestAnimationFrame(run);
  },
  isHidden: () => typeof document !== 'undefined' && document.visibilityState === 'hidden',
  now: () => new Date(),
};

// One store for the app, imported directly. It is only written on the client (seeding happens in an effect),
// so the server never shares fleet state between requests.
export const fleetLiveStore = createFleetLiveStore(browserDeps);
