# entities/robot

The robot as the console sees it, independent of vendor or protocol.

## Rules owned

| Rule                                                                                               | Where                                         |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Urgency order for lists (attention, offline, charging, working, idle; then lower battery; then id) | `services/robotUrgency.ts` `compareByUrgency` |
| Plain-language label per status                                                                    | `ui/RobotStatusBadge`                         |

Status, attention reasons and priority are decided by the server (ADR 0008); this entity only presents them.
