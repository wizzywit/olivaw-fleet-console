import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import {
  attentionReasonSchema,
  robotCommandRequestSchema,
  acknowledgeRequestSchema,
  type FleetSnapshotDto,
  type SiteDto,
} from '@olivaw/contracts';
import Fastify, { type FastifyInstance } from 'fastify';
import type { IngestConfig } from '../config';
import type { PatchLog } from '../store/patchLog';
import type { RobotStore } from '../store/robotStore';
import type { LiveHub } from './liveSocket';

export interface HttpAppDeps {
  config: IngestConfig;
  store: RobotStore;
  patchLog: PatchLog;
  liveHub: LiveHub;
  sites: SiteDto[];
  instanceId: string;
  now: () => Date;
  log: (message: string, data?: Record<string, unknown>) => void;
}

export async function buildHttpApp(deps: HttpAppDeps): Promise<FastifyInstance> {
  const { config, store, patchLog, liveHub, sites, instanceId, now, log } = deps;
  const app = Fastify();
  await app.register(cors, { origin: config.corsOrigin });
  await app.register(websocket);

  app.get('/api/fleet', (): FleetSnapshotDto => ({
    instanceId,
    sequence: patchLog.latestSequence(),
    generatedAt: now().toISOString(),
    config: { ...config.domain, patchIntervalMs: config.patchIntervalMs },
    sites,
    ...store.snapshot(),
  }));

  app.get<{ Params: { id: string } }>('/api/robots/:id', async (request, reply) => {
    const detail = store.detail(request.params.id);
    if (detail === undefined) return reply.code(404).send({ error: 'not-found' });
    return detail;
  });

  app.post<{ Params: { id: string } }>('/api/robots/:id/commands', async (request, reply) => {
    if (store.detail(request.params.id) === undefined) return reply.code(404).send({ error: 'not-found' });
    const command = robotCommandRequestSchema.safeParse(request.body);
    if (!command.success) return reply.code(400).send({ error: 'invalid-command' });
    log('command accepted (stub, not forwarded to the robot)', {
      robotId: request.params.id,
      command: command.data.type,
    });
    return reply.code(202).send({ accepted: true });
  });

  app.post<{ Params: { reason: string } }>(
    '/api/attention-groups/:reason/acknowledge',
    async (request, reply) => {
      const reason = attentionReasonSchema.safeParse(request.params.reason);
      const body = acknowledgeRequestSchema.safeParse(request.body);
      if (!reason.success || !body.success) return reply.code(400).send({ error: 'invalid-acknowledgement' });
      store.acknowledge(reason.data, body.data.robotIds);
      return reply.code(204).send();
    },
  );

  app.get('/live', { websocket: true }, (socket) => {
    liveHub.accept(socket);
  });

  return app;
}
