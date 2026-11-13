# simulator

Simulates a mixed fleet that speaks VDA 5050 3.0 over MQTT, so ingest and the console are exercised against a real protocol.

```bash
pnpm --filter simulator start -- --robots 1200 --seed 42 --broker mqtt://127.0.0.1:1883 --interval 1000
```

- `fleet.ts`: deterministic fleet from a seed: sites in proportion 412 / 186 / 650, five vendors, unique serial numbers.
- `robotModel.ts`: one pure step per robot. Working robots drive between points and drain 0.9% per minute; below their return threshold (12–22%, set per robot) they drive to the nearest dock and charge at 2% per minute. Small per-second chances put a robot into a fault (urgent error), an emergency stop, a stuck state, or a connection dropout of 20–60 s.
- `vdaMessages.ts`: builds `state`, `connection` and `factsheet` messages; adds a `BATTERY_LOW` warning below 20%.
- `vdaPublisher.ts`: one MQTT client per robot with a `CONNECTION_BROKEN` last will; a dropout destroys the socket so the broker publishes the will, and the robot reconnects when the dropout ends.

Not simulated on purpose: physics, path planning, collisions, real order execution.
