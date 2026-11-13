# 0004. VDA 5050 3.0 and a second protocol behind adapters

- Status: accepted
- Date: 2026-11-13

## Context

Olivaw's thesis is a vendor-neutral layer: robots from different manufacturers, each with its own software, operated from one console. The simulated robots should therefore speak real protocols, and the rest of the system should not care which one.

Candidates (checked on 2026-11-13):

- **VDA 5050** (github.com/VDA5050/VDA5050). Version 3.0.0 is current (tag `3.0.0`, commit e9ba560; the tag message says release on 19 March 2026, the VDA press release is dated 20 April 2026). It is the first version that covers freely navigating mobile robots, the kind Olivaw manages. Transport is MQTT on `vda5050/v3/{manufacturer}/{serialNumber}/{topic}`.
- **Open-RMF** (`rmf_fleet_msgs`): ROS 2 based coordination framework; not a wire protocol for a cloud console.
- **MassRobotics AMR Interoperability Standard**: status messages as JSON over WebSocket. Version 1.0 (2021); no confirmation found that a version 2 was finalised.

## Decision

- Robots speak VDA 5050 3.0 (`state`, `connection`, `factsheet`) over MQTT. A second protocol, MassRobotics over WebSocket, is added in tier 3.
- Each protocol has one adapter in `apps/ingest/src/protocols/`. It is the only code that knows the wire format, validates every message with zod, and maps it to the vendor-neutral `RobotObservation`. Invalid messages are dropped and logged; the robot keeps its last good state.
- Message types live in `packages/protocols`, shared by the simulator and ingest. Fixtures in that package come from valid 3.0 examples.

3.0 renamed fields that 2.x clients know (compared against the official `2.1.0` `state.schema`). The adapter uses the 3.0 names:

| 2.1                                                         | 3.0                                                            |
| ----------------------------------------------------------- | -------------------------------------------------------------- |
| `batteryState.batteryCharge`                                | `powerSupply.stateOfCharge`                                    |
| `batteryState.reach`                                        | `powerSupply.range`                                            |
| `agvPosition` (`positionInitialized`)                       | `mobileRobotPosition` (`localized`)                            |
| `safetyState.eStop` (`AUTOACK`, `MANUAL`, `REMOTE`, `NONE`) | `safetyState.activeEmergencyStop` (`MANUAL`, `REMOTE`, `NONE`) |
| `errorLevel` WARNING, FATAL                                 | `errorLevel` WARNING, URGENT, CRITICAL, FATAL                  |

Mapping decisions:

- `receivedAt` is the ingest clock, not the robot's `timestamp`, so robot clock drift cannot hide a silent robot.
- A state without `mobileRobotPosition` keeps the last known position; a robot's first state without one is dropped.
- A message whose `serialNumber` differs from its topic is dropped.
- Connection `HIBERNATING` counts as `offline`; `CONNECTION_BROKEN` (the MQTT last will) as `broken`.

## Findings in the official 3.0.0 schemas

- `json_schemas/factsheet.schema` is not valid JSON (trailing commas, for example after `"unit": "m"` in `minimumHeight`).
- In the same file, `typeSpecification.required` lists `mobileRobotKinematic`, while the property is named `mobileRobotKinematics`.

The factsheet reader therefore requires only the header and `typeSpecification.seriesName`, the one field the console shows. The VDA PDF is authoritative where it differs from GitHub.

## Options considered

- One protocol (VDA 5050 only): less work; the vendor-neutral claim stays a claim.
- Own JSON format: fastest; throws away the most relevant domain signal.
- Two real protocols behind adapters (chosen): the claim is shown in running code; each new protocol is one adapter with fixture tests.

## Consequences

- A field rename in a protocol changes one adapter and its fixtures.
- The robot domain, store, API and console are protocol-agnostic.
- Wire-format quirks (such as the schema bugs above) are contained and documented in one place.
