# 0016. Shared seen marks on attention groups

- Status: accepted
- Date: 2026-11-13

## Context

Operators need to know which robots in an attention group nobody has looked at yet. Tier 1 showed "N new" (members that entered attention in the last 2 minutes). That is a guess based on time: a robot that entered three minutes ago and that nobody saw is no longer "new", and a robot seen a second ago still is. With several consoles open, operators also cannot tell whether a colleague already took a look.

Alarm management has one concept for this: an alarm is unacknowledged until an operator acknowledges it, and it becomes unacknowledged again when its condition returns. Acknowledgement is a state of the alarm on the server, so every station sees it (OPC UA Part 9, which maps IEC 62682 states one to one).

## Decision

- Ingest owns the marks: per attention reason, the set of member robots an operator marked seen (`apps/ingest/src/robot/seenMarks.ts`).
- Aggregates report `unseenCount` per group. A robot that joins a group, or leaves and comes back, is unseen again.
- `POST /api/attention-groups/:reason/seen` takes the robot ids the operator saw. Only current members are marked, so a robot that joined in the same moment stays unseen. The server sends a patch with the new aggregates to every console, even when no robot changed.
- The console shows "N unseen" or "All seen" and a "Mark seen" button, disabled while the live connection is down. The 2-minute "new" marker is removed, so there is one newness concept.

## Options considered

- Marks per browser (local storage): frontend only, but two operators can chase the same robot.
- Keep both "new" and "unseen": none of the sources below pairs a time-window marker with acknowledgement; two concepts make the screen harder to read.
- Shared marks in ingest (chosen).

## Consequences

- Every console agrees on what is unseen; the backend owns the rule, like status and attention (ADR 0008).
- Marks live in memory and reset when ingest restarts (every group is unseen again), which errs on the safe side.
- Not built: who marked it (no user accounts), shelving (suppressing a nuisance alarm for a time, a separate concept in IEC 62682), and showing robots that left attention before anyone saw them ("return to normal, unacknowledged").
- The wording is "seen" as in the spec; "acknowledged" is the industry term and a rename is cheap if reviewers prefer it.

## Sources

- OPC UA Part 9, Acknowledge definition (§3.1.1), condition state model (§5.7.3) and IEC 62682 mapping (Annex E): https://reference.opcfoundation.org/specs/OPC-10000-9/full, https://reference.opcfoundation.org/specs/OPC-10000-9/annex-e
- OPC UA Part 9 Annex C, EEMUA 191 terms ("accepted" = acknowledged; no "new" state): https://reference.opcfoundation.org/specs/OPC-10000-9/annex-c
- Shelving as a separate state: https://reference.opcfoundation.org/specs/OPC-10000-9/5.8.17.1
- Opsgenie and PagerDuty acknowledgement: https://support.atlassian.com/opsgenie/docs/alert-notifications-flow/, https://support.pagerduty.com/main/docs/incidents
- Not verified first hand: the ISA-18.2 / IEC 62682 texts themselves (paywalled) and EEMUA 191's guidance on indicating new alarms.
