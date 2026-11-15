# Agav project instructions — Goan Craving Delivery Agent Dashboard

## Project role
This repository is the delivery-agent interface for assignments created by the Goan Craving Order Management Dashboard.

## Non-negotiable safety rules
- Begin with read-only inspection of current login, session, route, model, UI, map, and Socket.IO behavior.
- Preserve the existing agent ID/password login and shared session integration unless a task explicitly changes it.
- Never expose or commit .env values, session secrets, database credentials, map keys, or customer data.
- Never let an agent query or mutate another agent's assignments.
- Never delete order or delivery history. Use backward-compatible changes.
- Work on a feature branch; do not push to main, force-push, merge, or deploy without approval.
- Ask before changing authentication, authorization, location privacy, or data migrations.

## Delivery state rules
- An assignment must have a stable assignmentId and the original Goan Craving orderId.
- Agent actions are reports, not final order decisions.
- Supported agent reports: accepted, rejected, delivered, returned, unable_to_reach.
- Require a reason for rejected, returned, and unable_to_reach outcomes.
- Delivered must include an appropriate confirmation record; the employee in Order Management verifies final completion.
- Prevent duplicate or stale actions using assignment state, version checks, and idempotency.
- Record actor, timestamp, previous state, new state, reason, and optional evidence metadata in an audit history.
- An agent may only see their own assigned orders and the minimum customer data needed to perform the delivery.

## Location and privacy
- Request explicit browser/device location permission.
- Track only while the agent is online/on duty and the feature is enabled.
- Store lastUpdatedAt with every location; treat stale coordinates as unavailable.
- Stop updates when the agent goes offline or ends the shift.
- Restrict location access to authorized order-management employees and the relevant customer tracking view.
- Never fabricate location, route distance, or ETA.

## Delivery dashboard roadmap
1. Audit agent authentication, assignment APIs, order model, map integration, and real-time events.
2. Build an agent home page with availability and assigned orders.
3. Display pickup/drop address, restaurant/customer details, instructions, and navigation.
4. Implement accept/reject and delivery outcome reporting with reason capture.
5. Add pickup and in-transit milestones where supported by the operational workflow.
6. Add permission-based live location and stale-location handling.
7. Add delivery history and agent performance summaries.
8. Synchronize all assignment and status changes with Order Management using authenticated APIs and Socket.IO.

## Required workflow for each task
1. Inspect current behavior and contracts before editing.
2. Plan model, route, UI, event, and acceptance-test changes.
3. Make the smallest compatible implementation.
4. Test agent isolation, duplicate actions, rejected assignments, returned orders, unreachable customers, location denial, and reconnect behavior.
5. Run available tests and inspect git diff.
6. Summarize changes, test evidence, privacy/security risks, and rollout notes.
7. Leave changes on the feature branch for human review; do not merge or deploy.
