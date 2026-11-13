# 0005. Embedded MQTT broker

- Status: accepted
- Date: 2026-11-13

## Context

VDA 5050 runs over MQTT. Its `connection` topic relies on the MQTT last will: the broker publishes `CONNECTION_BROKEN` on the robot's behalf when the connection drops. That is the most reliable "robot is gone" signal, and it only exists with a real broker. The project should still start with one command and no external services.

## Decision

Embed Aedes, a broker written in Node, in the ingest process (`src/transport/mqttBroker.ts`). Ingest receives every publish directly from the broker's `publish` event, passes it to the protocol adapter, and ignores `$SYS` topics. The simulator connects to it like any MQTT client and sets its last will.

## Options considered

- Embedded Aedes (chosen): real MQTT semantics including last will and retained messages, no extra process, testable in-process with random ports.
- External broker (Mosquitto or EMQX in Docker): what production would use, but adds Docker as a requirement to run the project.
- Skip MQTT, send JSON over WebSocket: simpler, but VDA 5050 would only be imitated and the last-will mechanism lost.

## Consequences

- One process to run; the integration test exercises real MQTT, including a dropped connection.
- Broker and ingest share one event loop, which limits throughput. In production the broker becomes a separate cluster (EMQX, HiveMQ, or a managed IoT broker) and ingest subscribes to `vda5050/v3/+/+/state|connection|factsheet` through shared subscriptions, so ingest can scale horizontally behind it.
