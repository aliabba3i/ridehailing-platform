# System Architecture

The platform is a modular monolith. PostgreSQL is the source of truth for users, rides, events and payments. Redis is available for future distributed dispatch and Socket.IO adapter deployment. The current implementation uses a single Node server for real-time broadcasts.

## Authentication
Access JWTs expire after 15 minutes; opaque refresh tokens are SHA-256 hashed in PostgreSQL and rotated transactionally. Authorization is evaluated per endpoint and socket room. Admin accounts are provisioned through explicit seeding.

## Dispatch
Nearby verified, online drivers with location timestamps under one minute old are eligible. Riders create a SEARCHING ride, and nearby drivers can poll offers. Acceptance atomically checks the SEARCHING state. A partial unique PostgreSQL index prevents one driver from holding more than one active assignment. For high contention or multi-region dispatch, add an atomic lock/queue and explicit retries.

## Ride state
REQUESTED → SEARCHING → ACCEPTED → ARRIVING → ARRIVED → IN_PROGRESS → COMPLETED. Cancellation allowed until a trip starts; ratings are a separate resource attached only to completed trips. Terminal ride states never reenter the workflow.

## Production extensions
Replace straight-line travel estimate with road-routing provider, add automatic offer expiry, payment reconciliation, geofence-based safety controls, driver background location permission handling, user consent flows, audit streams, centralized telemetry and managed infrastructure.
