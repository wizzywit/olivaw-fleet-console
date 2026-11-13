# What a fleet console needs, and what it does not

The challenge describes what the system is for, not what it must do: "a fleet manager who needs to know what the fleet is doing right now", with "the state of the fleet, and a single robot in more detail". This document works out the rest. Every feature in the build traces back to a need here; everything left out has a reason.

## Who uses it, and in what situation

A fleet manager or operator at a facility-management company, hotel, hospital or airport. They run a mixed fleet (cleaning, delivery, service, security robots) from several manufacturers across one or more sites. They are not watching the console all day: they glance at it between other work, and they come back when something needs them. They are not robotics engineers.

Assumptions I made (and would confirm with Olivaw):

- One manager watches hundreds to a few thousand robots across a few sites; the platform as a whole runs many such fleets.
- Most of the time most robots are fine. The value is in finding the few that are not, quickly.
- Robots report roughly once per second; the network between robots and the cloud is unreliable.
- The manager can ask a robot to do simple things (go to dock, pause), but planning and assigning tasks happens elsewhere.

## The questions the console must answer

| #   | The manager asks                                           | So the system needs                                                                                                  | Built as                                                                                                 |
| --- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Q1  | "Is everything OK right now?"                              | One glance summary: counts by status, per site                                                                       | Site tiles and status counts on the overview                                                             |
| Q2  | "What needs me, and what first?"                           | Problems detected for them, ranked, with the reason in plain words; grouped so 30 low batteries are one line, not 30 | "Needs your attention" groups, urgency-sorted table                                                      |
| Q3  | "Can I trust what I'm seeing?"                             | Every value carries its age; the console says when its own link is down; silent robots become offline on their own   | Last-report column, live status in the header, connection-lost state, server stale sweep, MQTT last will |
| Q4  | "What is wrong with this robot, where is it, how bad?"     | One robot's status, battery, mode, task, position on its site map, active errors, what it actually reported          | Robot detail page                                                                                        |
| Q5  | "Find robot X / all low-battery delivery robots at site Y" | Search and filters that are fast and shareable                                                                       | Search with filter syntax, status chips, site filter, all in the URL                                     |
| Q6  | "Do something about it"                                    | A small set of actions, disabled when the link is down                                                               | "Send to dock", "Pause" (stubbed endpoint)                                                               |
| Q7  | "I don't care who made it"                                 | One model and one vocabulary for every manufacturer; vendor is just an attribute                                     | VDA 5050 and MassRobotics adapters into one robot model                                                  |

What makes a robot "need attention" is the core business rule, so it has one owner (the server) and exact thresholds: battery below 15% and not charging; an error at level URGENT or higher; an emergency stop; stopped with a task for more than 2 minutes. A robot with no report for 3 seconds, or whose connection broke, is offline.

## What each part therefore needs

### Robot simulator

Needs to:

- Speak real protocols (VDA 5050 3.0 over MQTT; MassRobotics over WebSocket), so ingestion is tested against the formats Olivaw actually meets.
- Produce every situation the console must handle: working, charging, idle, low battery, errors, stuck, emergency stop, dropouts with a broken connection.
- Scale to thousands of robots and be deterministic (seeded), so demos and tests are repeatable.

Does not need: physics, path planning, collision avoidance, executing real orders, maps beyond simple floor outlines. These would cost time and change nothing the console shows.

### Server side

Needs to:

- Accept ~1 message per robot per second, validate it, and drop bad messages without losing the robot's last good state.
- Normalise each protocol into one model behind an adapter.
- Decide status and attention in one place, and notice silence two ways (broker last will, and a stale sweep).
- Give the console a snapshot plus small, coalesced, sequenced updates, so a reconnecting client never misses or double-applies a change.
- Keep short, downsampled history (battery, position, events) for the detail view.

Does not need:

- Every raw message stored forever: the manager needs "now" and "the last hours", not a full-rate archive. Downsampled history is enough; a time-series store is the production step.
- Exactly-once delivery: the latest state wins, and VDA 5050 itself uses QoS 0 for state. Updates are idempotent by design.
- Authentication, tenants, roles: essential in production, but they add nothing to what this exercise shows. Listed in the README as the first production gap.
- Order management, task assignment, map editing, building integrations (lifts, doors), the Skill Store: real Olivaw features, but not part of "know what the fleet is doing right now".
- Microservices: one process with clear internal boundaries (adapter, domain, store, transport) is easier to reason about; the seams are where it would split.

### User interface

Needs to:

- Put problems first and keep healthy robots as a summary.
- Stay readable and fast at 10,000+ robots: virtualized table, server-computed counts, a dense grid view that shows the whole fleet at once.
- Never move rows under the user's hands while live data arrives.
- Be honest about freshness and connection state.
- Work with keyboard and screen readers, in light and dark, and on a phone for the "on the move" check.

Does not need:

- A map of the whole fleet as the default view: 1,200 dots on site plans answer "where" but not "what's wrong"; position matters for one robot, so the map lives on the detail page.
- Animating every robot at 1 Hz: costly at scale and distracting; values update in place.
- KPI dashboards and long-term analytics (utilisation per week, cleaning coverage): useful for a different user and a different moment, not for "right now".
- Per-robot live charts for the whole fleet: one robot's battery history on its detail page is enough.
- Push notifications, alert rules editing, incident workflow: the natural next step (Olivaw lists ticketing and incident management next), deliberately out of scope.
- Editing robots, fleets or sites.

## How we know it works

- A manager can answer Q1 and Q2 within a few seconds of opening the overview.
- When the link drops, the console says so within a few seconds and greys out old values; when it returns, it catches up without a reload.
- 10,000 simulated robots at 1 Hz keep the overview interactive (input delay under 100 ms) on a laptop.
- Every screen passes automated accessibility checks in both themes and can be used with the keyboard alone.

## Questions I would ask Olivaw

- Who is the primary user: an on-site operator, a remote fleet manager, or the integrator's support team? The answer changes density and the default view.
- How many robots does one person watch today, and what is the target?
- Which actions may the console send, and which need confirmation?
- How fast must a problem show up (alert latency target)?
- Which protocols and vendors dominate today, and how is "needs attention" defined per robot type?

## Traceability

| Need                  | Spec                             | Build tier                                                   |
| --------------------- | -------------------------------- | ------------------------------------------------------ |
| Q1 summary            | §5 Fleet overview, §7 aggregates | Tier 1|
| Q2 attention          | §6 status rules                  | Tier 1|
| Q3 freshness          | §5 States, §6, §7                | Tier 1|
| Q4 detail             | §5 Robot detail                  | Tier 1 Task 16; tier 3 history                         |
| Q5 search and filters | §5                               | Tier 1 Task 13; tier 2 command palette                 |
| Q6 actions            | §5, §2 non-goals                 | Tier 1 Task 16                                         |
| Q7 vendor neutral     | §6 adapters                      | Tier 1; tier 3 MassRobotics                 |
| Scale                 | §7 scale notes, §8 performance   | Tier 1; tier 2 grid and 10k profile |
| Accessibility, themes | §3, design system                | Tier 1; tier 3 Playwright + axe            |
