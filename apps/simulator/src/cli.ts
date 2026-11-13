import { parseArgs } from 'node:util';
import { waitForBroker } from './brokerReady';
import { createFleet } from './fleet';
import { runVdaFleet } from './vdaPublisher';

const { values } = parseArgs({
  options: {
    robots: { type: 'string', default: '1200' },
    seed: { type: 'string', default: '42' },
    broker: { type: 'string', default: 'mqtt://127.0.0.1:1883' },
    interval: { type: 'string', default: '1000' },
  },
});

function positiveInteger(name: string, value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0)
    throw new Error(`--${name} must be a positive integer, got "${value}"`);
  return parsed;
}

const log = (message: string) => {
  console.log(`[simulator] ${message}`);
};

const seed = positiveInteger('seed', values.seed);
const robots = createFleet(positiveInteger('robots', values.robots), seed);
log(`simulating ${String(robots.length)} robots (seed ${values.seed})`);

await waitForBroker(values.broker, { log });
const fleet = await runVdaFleet(robots, {
  brokerUrl: values.broker,
  intervalMs: positiveInteger('interval', values.interval),
  seed,
  log,
});

const shutdown = () => {
  void fleet.stop().then(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
