import type { z } from 'zod';
import { apiBaseUrl } from '../config/env';

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly reason: 'status' | 'invalid-response',
  ) {
    super(
      reason === 'status' ? `Request failed with status ${status}` : 'Response did not match the contract',
    );
    this.name = 'HttpError';
  }
}

async function parse<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  if (!response.ok) throw new HttpError(response.status, 'status');
  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) throw new HttpError(response.status, 'invalid-response');
  return parsed.data;
}

export async function httpGet<T>(
  path: string,
  schema: z.ZodType<T>,
  init: { signal?: AbortSignal } = {},
): Promise<T> {
  return parse(await fetch(`${apiBaseUrl()}${path}`, init), schema);
}

const postJson = (path: string, body: unknown) =>
  fetch(`${apiBaseUrl()}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

export async function httpPost<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
  return parse(await postJson(path, body), schema);
}

export async function httpPostNoContent(path: string, body: unknown): Promise<void> {
  const response = await postJson(path, body);
  if (!response.ok) throw new HttpError(response.status, 'status');
}
