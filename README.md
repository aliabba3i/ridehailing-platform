# RideHailing Platform

A TypeScript monorepo for a ride-hailing product: Express/Prisma API, Socket.IO location broadcasts, Expo rider and driver applications, and a Next.js admin dashboard. Currency is **IRR**; money is stored in integer units.

## Layout

- `backend/`: REST API, JWT authentication, driver dispatch, lifecycle, pricing, payments stub and Prisma database
- `apps/rider/`: passenger mobile client
- `apps/driver/`: driver mobile client
- `apps/admin/`: operations dashboard
- `packages/shared/`: shared contracts and HTTP client
- `docs/`: architecture and API notes
- `.github/workflows/`: CI

## Start locally

Requires Node 22, npm 10, PostgreSQL 16 and Redis 7 (or Docker).

1. `cp .env.example .env`; replace JWT secrets and the bootstrap password.
2. `npm install`
3. `docker compose up -d postgres redis`
4. `npm run db:generate`
5. `npm run db:migrate`
6. `npm run db:seed` (optional demo admin; never run on public production data)
7. `npm run dev`; API is available at `http://localhost:4000`.
8. `npm run dev -w @ride/admin` for the dashboard.
9. `npm run start -w @ride/rider` and `npm run start -w @ride/driver` for Expo.

For physical phones set `EXPO_PUBLIC_API_URL` to your computer's reachable LAN URL, not localhost.

`docker compose up --build` starts PostgreSQL, Redis, backend and dashboard. Its backend runs Prisma migrations at boot (suitable for a single instance; use a serialized deployment job for replicas).

## Roles and ride flow

RIDER requests a trip, DRIVER receives an offer and accepts it, advances through ARRIVING → ARRIVED → IN_PROGRESS → COMPLETED, then RIDER rates the completed ride. The service validates roles and transitions. Driver matching uses recent locations and nearest available drivers. Real-time rooms are authenticated. Quotes support a configured surge multiplier and duration/distance components.

## Safety and limitations

This is an **engineering starter, not a certified production taxi service**. Payments and OTP are development stubs; routing uses supplied coordinates and straight-line distance rather than a licensed routing provider. Production requires verified identity, vehicle onboarding, robust geolocation permissions/background tracking, external maps, payment reconciliation, abuse controls, provider integration, full end-to-end testing, TLS, secret management, monitoring, backups, legal/privacy review and independent security assessment. Do not expose the default seed admin password or use these endpoints with live payments.

## Quality

`npm run build`, `npm run typecheck`, `npm test`. GitHub Actions runs dependency installation, Prisma generation, TypeScript checks and unit/API tests. See `backend/README.md` and `docs/`.
