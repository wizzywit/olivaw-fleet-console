import { delay, http } from 'msw';
import { server } from '@/test/msw';
import { prefetchFleetSnapshot } from './prefetchFleetSnapshot';

describe('prefetchFleetSnapshot', () => {
  it('gives up on a server that never answers, so the page still renders', async () => {
    server.use(
      http.get('*/api/fleet', async () => {
        await delay('infinite');
      }),
    );
    const state = await prefetchFleetSnapshot(50);
    expect(state.queries.every((query) => query.state.status !== 'success')).toBe(true);
  });
});
