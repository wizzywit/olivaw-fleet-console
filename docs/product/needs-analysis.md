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

| #   | The manager asks                                           | So the system needs                                                                                                                                                                                                    | Built as                                                                                                                      |
| --- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Q1  | "Is everything OK right now?"                              | One glance summary: counts by status, per site                                                                                                                                                                         | Site tiles and status counts on the overview                                                                                  |
| Q2  | "What needs me, and what first?"                           | Problems detected for them, ranked by priority, each with the reason and the action expected; grouped so 30 low batteries are one line, not 30, with new arrivals marked                                               | "Needs your attention" groups with priority, required action and shared acknowledgement; urgency-sorted table                 |
| Q3  | "Can I trust what I'm seeing?"                             | Every robot shows when it was last heard from; stale data is marked by exception and kept as last known, never shown as current; the console says when its own link is down; silent robots become offline on their own | Last-report column, stale badge variant, live status in the header, connection-lost state, server stale sweep, MQTT last will |
| Q4  | "What is wrong with this robot, where is it, how bad?"     | One robot's status, battery, mode, task, position on its site map, active errors, what it actually reported                                                                                                            | Robot detail page                                                                                                             |
| Q5  | "Find robot X / all low-battery delivery robots at site Y" | Search and filters that are fast and shareable                                                                                                                                                                         | Search with filter syntax, status chips, site filter, all in the URL                                                          |
| Q6  | "Do something about it"                                    | A small set of actions, disabled when the link is down                                                                                                                                                                 | "Send to dock", "Pause" (stubbed endpoint)                                                                                    |
| Q7  | "I don't care who made it"                                 | One model and one vocabulary for every manufacturer; vendor is just an attribute                                                                                                                                       | VDA 5050 and MassRobotics adapters into one robot model                                                                       |

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
- Normalize each protocol into one model behind an adapter.
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

- Put problems first, each with its priority and the action expected, and keep healthy robots as counts that can be expanded, never hidden.
- Stay readable and fast at 10,000+ robots: virtualized table, server-computed counts, a dense grid view that shows the whole fleet at once.
- Never move rows under the user's hands while live data arrives; offer an explicit pause of live updates that resumes to the current state.
- Be honest about freshness: last-heard time per robot, stale values marked by exception and kept as last known, a banner when the console's own connection drops.
- Show values against their normal range (battery against its threshold) and never use color alone.
- Draw attention to what is new without moving everything: one brief cue for a new attention item, none with reduced motion.
- Work with keyboard and screen readers, in light and dark, and on a phone for the "on the move" check.

Does not need (in this build):

- A map of the whole fleet as the default view. A map answers "where", not "what's wrong", so the default is organized by attention; location is text on each row and a map on the robot detail. A fleet map can be a secondary view (tier 2 option). Note that several products (Open-RMF's dashboard, Formant, MiR) do offer a map up front; the choice here is about the question the default screen answers.
- Animating every robot at 1 Hz: motion in the periphery captures attention involuntarily and many simultaneous animations overwhelm; values update in place.
- Historical analytics and reports (utilization per week, cleaning coverage): a different user and moment. The few live numbers that answer "is the fleet OK right now" (counts per status and site) are in scope.
- Per-robot live charts for the whole fleet: one robot's battery history on its detail page is enough.
- Editing robots, fleets or sites.

Core need, deferred for scope:

- **Notifications, alert rules and incident handling.** For a user who only glances at the console, the console alone cannot tell them that something happened while they looked away; every fleet product checked ships notifications (in app, email, SMS, Slack, PagerDuty). They are left out of this build only to keep it focused. The design is ready for them: every attention group already carries a reason, a priority and a required action, which is what an alarm in the ISA-18.2 sense needs. Shared acknowledgement (tier 2, ADR 0016) is the first step.

## Evidence

Checked on 2026-11-13; quotes are short excerpts.

| Claim                                          | Evidence                                                                                                                                                                                                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Problems first                                 | InOrbit's fleet view puts robots with errors or warnings first (inorbit.ai/docs); high-performance HMI guidance (Hollifield, via the Opto 22 white paper) puts abnormal situations and top alarms on the overview.                                                 |
| No reordering under the user, pause control    | WCAG 2.2 SC 2.2.2 Pause, Stop, Hide (Level A) requires a way to pause auto-updating content; SC 3.2.5 treats significant rearranging as a change the user should start; web.dev on layout shift: unexpected movement makes users "click the wrong link or button". |
| Stale by exception                             | Ignition marks values with bad or stale quality with an overlay rather than an age on every value (docs.inductiveautomation.com); an Open-RMF dashboard thread shows why last-known values must be labelled (discourse.openrobotics.org).                          |
| Map not the default                            | Cognitive fit research (Vessey 1991; Dennis and Carte 1998): maps help adjacency questions, tables help value questions; Hollifield/Nimmo place physical layouts at the detail level.                                                                              |
| No continuous animation, one cue for new items | NN/g: peripheral movement triggers a stimulus-driven shift of attention; NN/g on change blindness: changes without a cue are often missed.                                                                                                                         |
| Live numbers, not analytics                    | NN/g separates operational from analytical dashboards; Brain Corp and Formant keep analytics apart from live operations.                                                                                                                                           |
| Alerting is core                               | InOrbit: with in-app-only notifications, incidents "can be missed"; Formant, Brain Corp, Avidbots and Meili all ship notifications; ISA-18.2 defines an alarm as a condition requiring a response.                                                                 |
| Grouping by reason                             | EEMUA 191 (via secondary sources) asks that an alarm shows its priority and source; grouping must not mix priorities or hide new members.                                                                                                                          |

## How we know it works

- A manager can answer Q1 and Q2 within a few seconds of opening the overview.
- When the link drops, the console says so within a few seconds and greys out old values; when it returns, it catches up without a reload.
- A user can pause live updates and resume to the current state, and rows never move while they are working in the list.
- 10,000 simulated robots at 1 Hz keep the overview interactive (input delay under 100 ms) on a laptop.
- Every screen passes automated accessibility checks in both themes and can be used with the keyboard alone.

## Questions I would ask Olivaw

- Who is the primary user: an on-site operator, a remote fleet manager, or the integrator's support team? The answer changes density and the default view.
- How many robots does one person watch today, and what is the target?
- Which actions may the console send, and which need confirmation?
- How fast must a problem show up (alert latency target)?
- Which protocols and vendors dominate today, and how is "needs attention" defined per robot type?

## Traceability

| Need                  | Spec                             | Build tier                                                                |
| --------------------- | -------------------------------- | ------------------------------------------------------------------------- |
| Q1 summary            | §5 Fleet overview, §7 aggregates | Tier 1                                                                    |
| Q2 attention          | §6 status rules                  | Tier 1                                                                    |
| Q3 freshness          | §5 States, §6, §7                | Tier 1                                                                    |
| Q4 detail             | §5 Robot detail                  | Tier 1; tier 3 history                                                    |
| Q5 search and filters | §5                               | Tier 1; tier 2 command palette (ADR 0017)                                 |
| Q6 actions            | §5, §2 non-goals                 | Tier 1                                                                    |
| Q7 vendor neutral     | §6 adapters                      | Tier 1; tier 3 MassRobotics                                               |
| Scale                 | §7 scale notes, §8 performance   | Tier 1; tier 2 grid and 10k profile (ADR 0011, ADR 0018, README)          |
| Accessibility, themes | §3, design system                | Tier 1; tier 3 Playwright + axe                                           |
| Alerting (deferred)   | §2 non-goals                     | Tier 2 shared acknowledgement (ADR 0016); notifications beyond this build |
