import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { fleetLiveStore } from '@/entities/fleet/repository/fleetLiveStore';
import { server } from './msw';

// jsdom has no layout engine, so every element measures 0×0 and virtualized lists would render no rows.
const viewport = { x: 0, y: 0, top: 0, left: 0, width: 1280, height: 800, right: 1280, bottom: 800 };
if (typeof Element !== 'undefined') {
  Element.prototype.getBoundingClientRect = () => ({ ...viewport, toJSON: () => viewport });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get: () => viewport.height,
  });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => viewport.width,
  });
}

// jsdom has no media queries either; tests run as a light-scheme system unless a test stubs matchMedia itself.
if (typeof window !== 'undefined') {
  window.matchMedia = (query: string) => {
    const list: MediaQueryList = Object.assign(new EventTarget(), {
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
    });
    return list;
  };
}

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});
afterEach(() => {
  cleanup();
  fleetLiveStore.getState().reset();
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});
