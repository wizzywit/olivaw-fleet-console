import { vda5050Topic } from '@olivaw/protocols';
import mqtt, { type MqttClient } from 'mqtt';
import { createRng } from './rng';
import { stepRobot, type SimRobot } from './robotModel';
import { toVda5050Connection, toVda5050Factsheet, toVda5050State } from './vdaMessages';

export interface VdaFleetOptions {
  brokerUrl: string;
  intervalMs: number;
  seed: number;
  log: (message: string) => void;
}

interface SimulatedConnection {
  robot: SimRobot;
  client: MqttClient | null;
  connecting: boolean;
  headerId: number;
}

const connectBatchSize = 100;

export async function runVdaFleet(robots: SimRobot[], options: VdaFleetOptions) {
  const { brokerUrl, intervalMs, log } = options;
  const rng = createRng(options.seed + 1);
  const connections: SimulatedConnection[] = robots.map((robot) => ({
    robot,
    client: null,
    connecting: false,
    headerId: 0,
  }));

  const nextHeaderId = (connection: SimulatedConnection) => {
    connection.headerId += 1;
    return connection.headerId;
  };

  async function connect(connection: SimulatedConnection): Promise<void> {
    const { robot } = connection;
    const topic = (subtopic: 'state' | 'connection' | 'factsheet') =>
      vda5050Topic(robot.manufacturer, robot.serialNumber, subtopic);
    connection.connecting = true;
    try {
      const will = toVda5050Connection(robot, 'CONNECTION_BROKEN', nextHeaderId(connection), new Date());
      const client = await mqtt.connectAsync(brokerUrl, {
        clientId: robot.serialNumber,
        reconnectPeriod: 0,
        will: {
          topic: topic('connection'),
          payload: Buffer.from(JSON.stringify(will)),
          qos: 1,
          retain: true,
        },
      });
      client.on('error', (error) => {
        log(`${robot.serialNumber}: ${error.message}`);
      });
      const now = new Date();
      await client.publishAsync(
        topic('connection'),
        JSON.stringify(toVda5050Connection(robot, 'ONLINE', nextHeaderId(connection), now)),
        { qos: 1, retain: true },
      );
      await client.publishAsync(
        topic('factsheet'),
        JSON.stringify(toVda5050Factsheet(robot, nextHeaderId(connection), now)),
        { qos: 1, retain: true },
      );
      connection.client = client;
    } catch (error) {
      log(
        `${robot.serialNumber}: could not connect (${error instanceof Error ? error.message : String(error)})`,
      );
    } finally {
      connection.connecting = false;
    }
  }

  for (let i = 0; i < connections.length; i += connectBatchSize) {
    await Promise.all(connections.slice(i, i + connectBatchSize).map(connect));
  }
  log(`${String(connections.filter((c) => c.client !== null).length)} robots connected to ${brokerUrl}`);

  const timer = setInterval(() => {
    const now = new Date();
    for (const connection of connections) {
      connection.robot = stepRobot(connection.robot, intervalMs, rng, now.getTime());
      const inDropout = connection.robot.dropoutUntilMs !== null;
      if (inDropout && connection.client !== null) {
        // Destroying the socket without a clean disconnect makes the broker publish the last will.
        connection.client.stream.destroy();
        connection.client = null;
        continue;
      }
      if (!inDropout && connection.client === null && !connection.connecting) {
        void connect(connection);
        continue;
      }
      connection.client?.publish(
        vda5050Topic(connection.robot.manufacturer, connection.robot.serialNumber, 'state'),
        JSON.stringify(toVda5050State(connection.robot, nextHeaderId(connection), now)),
      );
    }
  }, intervalMs);

  return {
    async stop(): Promise<void> {
      clearInterval(timer);
      await Promise.all(
        connections.map(async (connection) => {
          const { client, robot } = connection;
          if (client === null) return;
          const offline = toVda5050Connection(robot, 'OFFLINE', nextHeaderId(connection), new Date());
          await client.publishAsync(
            vda5050Topic(robot.manufacturer, robot.serialNumber, 'connection'),
            JSON.stringify(offline),
            { qos: 1, retain: true },
          );
          await client.endAsync();
        }),
      );
    },
  };
}
