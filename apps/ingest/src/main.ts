import { loadConfig } from './config';
import { startIngest } from './server';

const log = (message: string, data?: Record<string, unknown>) => {
  console.log(`[ingest] ${message}`, data ?? '');
};

const ingest = await startIngest(loadConfig(), { log });
log(`http ${ingest.httpUrl} · live ${ingest.wsUrl}/live · mqtt ${ingest.mqttUrl}`);

const shutdown = () => {
  void ingest.close().then(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
