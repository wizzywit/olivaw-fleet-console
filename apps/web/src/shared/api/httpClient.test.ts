import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import { server } from '@/test/msw';
import { HttpError, httpGet, httpPost, httpPostNoContent } from './httpClient';

const schema = z.object({ ok: z.literal(true) });

describe('httpGet', () => {
  it('returns parsed data', async () => {
    server.use(http.get('*/api/thing', () => HttpResponse.json({ ok: true })));
    await expect(httpGet('/api/thing', schema)).resolves.toEqual({ ok: true });
  });

  it('rejects a non-2xx response with its status', async () => {
    server.use(http.get('*/api/thing', () => new HttpResponse(null, { status: 503 })));
    await expect(httpGet('/api/thing', schema)).rejects.toMatchObject({ status: 503, reason: 'status' });
  });

  it('rejects a response that does not match the contract', async () => {
    server.use(http.get('*/api/thing', () => HttpResponse.json({ ok: 'yes' })));
    const error = await httpGet('/api/thing', schema).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ reason: 'invalid-response' });
  });
});

describe('httpPost', () => {
  it('sends JSON and parses the reply', async () => {
    server.use(
      http.post('*/api/robots/X/commands', async ({ request }) => {
        const body = (await request.json()) as unknown;
        return HttpResponse.json({ ok: true, echoed: body }, { status: 202 });
      }),
    );
    await expect(httpPost('/api/robots/X/commands', { type: 'pause' }, schema)).resolves.toEqual({
      ok: true,
    });
  });
});

describe('httpPostNoContent', () => {
  it('sends JSON and accepts an empty 204 reply', async () => {
    let received: unknown;
    server.use(
      http.post('*/api/thing', async ({ request }) => {
        received = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await expect(httpPostNoContent('/api/thing', { robotIds: ['A'] })).resolves.toBeUndefined();
    expect(received).toEqual({ robotIds: ['A'] });
  });

  it('rejects a non-2xx response with its status', async () => {
    server.use(http.post('*/api/thing', () => new HttpResponse(null, { status: 400 })));
    await expect(httpPostNoContent('/api/thing', {})).rejects.toMatchObject({
      status: 400,
      reason: 'status',
    });
  });
});
