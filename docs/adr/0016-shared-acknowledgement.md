# 0016. Shared acknowledgement of attention groups

- Status: accepted
- Date: 2026-11-13

## Context

Operators need to know which robots in an attention group nobody has looked at yet. Tier 1 showed "N new" (members that entered attention in the last 2 minutes). That is a guess based on time: a robot that entered three minutes ago and that nobody looked at is no longer "new", and a robot looked at a second ago still is. With several consoles open, operators also cannot tell whether a colleague already took it.

Alarm management has one concept for this: an alarm is unacknowledged until an operator acknowledges it, and it becomes unacknowledged again when its condition returns. Acknowledgement is a state of the alarm on the server, so every station sees it (OPC UA Part 9, which maps the IEC 62682 states one to one).

## Decision

- Ingest owns the acknowledgements: per attention reason, the set of member robots an operator acknowledged (`apps/ingest/src/robot/acknowledgements.ts`).
- Aggregates report `unacknowledgedCount` per group. A robot that joins a group, or leaves and comes back, is unacknowledged again.
- `POST /api/attention-groups/:reason/acknowledge` takes the robot ids the operator looked at. Only current members are acknowledged, so a robot that joined in the same moment stays unacknowledged. The server sends a patch with the new aggregates to every console, even when no robot changed.
- The console shows "N unacknowledged" or "All acknowledged" and an "Acknowledge" button, disabled while the live connection is down. The 2-minute "new" marker is removed, so there is one newness concept.
- The industry term "acknowledge" is used instead of the spec's earlier "seen", so the console speaks the language of the control rooms and standards it borrows from.

## Options considered

- Acknowledgements per browser (local storage): frontend only, but two operators can chase the same robot.
- Keep both "new" and "unacknowledged": none of the sources below pairs a time-window marker with acknowledgement; two concepts make the screen harder to read.
- Shared acknowledgements in ingest (chosen).

## Consequences

- Every console agrees on what is unacknowledged; the backend owns the rule, like status and attention (ADR 0008).
- Acknowledgements live in memory and reset when ingest restarts (every group is unacknowledged again), which errs on the safe side.
- Not built: who acknowledged (no user accounts), shelving (suppressing a nuisance alarm for a time, a separate state in IEC 62682), and showing robots that left attention before anyone acknowledged them ("return to normal, unacknowledged").

## Sources

- OPC UA Part 9, Acknowledge definition (§3.1.1), condition state model (§5.7.3) and IEC 62682 mapping (Annex E): https://reference.opcfoundation.org/specs/OPC-10000-9/full, https://reference.opcfoundation.org/specs/OPC-10000-9/annex-e
- OPC UA Part 9 Annex C, EEMUA 191 terms ("accepted" = acknowledged; no "new" state): https://reference.opcfoundation.org/specs/OPC-10000-9/annex-c
- Shelving as a separate state: https://reference.opcfoundation.org/specs/OPC-10000-9/5.8.17.1
- Opsgenie and PagerDuty acknowledgement: https://support.atlassian.com/opsgenie/docs/alert-notifications-flow/, https://support.pagerduty.com/main/docs/incidents
- Not verified first hand: the ISA-18.2 / IEC 62682 texts themselves (paywalled) and EEMUA 191's guidance on indicating new alarms.
