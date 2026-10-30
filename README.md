[![CI](https://img.shields.io/github/actions/workflow/status/aliabba3i/ridehailing-platform/ci.yml?branch=main&label=CI)](https://github.com/aliabba3i/ridehailing-platform/actions/workflows/ci.yml)
[![Latest Release](https://img.shields.io/github/v/release/aliabba3i/ridehailing-platform?label=release)](https://github.com/aliabba3i/ridehailing-platform/releases/latest)
[![MIT License](https://img.shields.io/github/license/aliabba3i/ridehailing-platform)](https://github.com/aliabba3i/ridehailing-platform/blob/main/LICENSE)
[![GHCR](https://img.shields.io/badge/GHCR-published-blue?logo=github)](https://github.com/aliabba3i/ridehailing-platform/pkgs/container/ridehailing-platform)

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

Requires **Node.js 22+**, **npm 10+**, and **Docker with Docker Compose** (or separately installed PostgreSQL 16 and Redis 7). All commands below run from the **repository root**, unless otherwise stated.

1. Copy `.env.example` to `.env` (`cp .env.example .env` on macOS/Linux; `Copy-Item .env.example .env` in PowerShell).
2. Replace both `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` with **different, random secrets of at least 32 characters**. Set a strong `ADMIN_PASSWORD` (12+ characters) and your intended `ADMIN_EMAIL` before seeding. Never commit `.env`.
3. Install dependencies with `npm install`.
4. Start the databases with `docker compose up -d postgres redis` (PostgreSQL on `localhost:5432`; Redis on `localhost:6379`).
5. Build the shared package: `npm run build -w @ride/shared`.
6. Generate the Prisma client: `npm run db:generate`.
7. Apply development migrations: `npm run db:migrate`.
8. Optionally create the admin login with `npm run db:seed`. The seed stores `ADMIN_EMAIL` as the login identifier in the user's `phone` field. This step is required to sign in to the admin dashboard, but not to register riders or drivers.
9. Start the API with `npm run dev`; its base URL is **http://localhost:4000** and its liveness endpoint is `http://localhost:4000/health`.
10. In a second terminal, start the admin dashboard with `npm run dev -w @ride/admin`; open **http://localhost:3000**.
11. For mobile development, start `npm run start -w @ride/rider` and `npm run start -w @ride/driver` in separate terminals. The applications use Expo.

The backend and Prisma workspace scripts read the **root `.env`** file. Expo and Next.js load their own app-local environment files: to override the API origin, put `EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:4000` in both `apps/rider/.env.local` and `apps/driver/.env.local`, and put `NEXT_PUBLIC_API_URL=http://localhost:4000` in `apps/admin/.env.local` if necessary. Restart the development servers after changing these files. For physical phones, use your computer's reachable LAN address rather than `localhost`. The API origin should **not** include `/api/v1`; endpoints in this repository are rooted directly at `/auth`, `/rides`, etc.

**Docker-only alternative:** After configuring root `.env`, run `docker compose up --build -d` to start PostgreSQL, Redis, the backend on port 4000, and the admin dashboard on port 3000. The backend runs committed Prisma migrations during container startup; it **does not** automatically seed an admin account. Use `npm run db:seed` from the host after installing npm dependencies and configuring database access if an admin account is required. Container startup migrations are intended for a single instance; use a dedicated migration job in replicated deployments.

## Roles and ride flow

RIDER requests a trip, DRIVER receives an offer and accepts it, advances through ARRIVING → ARRIVED → IN_PROGRESS → COMPLETED, then RIDER rates the completed ride. The service validates roles and transitions. Driver matching uses recent locations and nearest available drivers. Real-time rooms are authenticated. Quotes support a configured surge multiplier and duration/distance components.

## Safety and limitations

This is an **engineering starter, not a certified production taxi service**. Payments and OTP are development stubs; routing uses supplied coordinates and straight-line distance rather than a licensed routing provider. Production requires verified identity, vehicle onboarding, robust geolocation permissions/background tracking, external maps, payment reconciliation, abuse controls, provider integration, full end-to-end testing, TLS, secret management, monitoring, backups, legal/privacy review and independent security assessment. Do not expose the default seed admin password or use these endpoints with live payments.

## Quality

`npm run build`, `npm run typecheck`, `npm test`. GitHub Actions runs dependency installation, Prisma generation, TypeScript checks and unit/API tests. See `backend/README.md` and `docs/`.

## Documentation

- [Backend development guide](backend/README.md)
- [Rider application guide](apps/rider/README.md)
- [Driver application guide](apps/driver/README.md)
- [Admin dashboard guide](apps/admin/README.md)
- [Shared package guide](packages/shared/README.md)
- [Architecture diagram](docs/architecture-diagram.md)
- [API reference](docs/api.md)
- [Database and seed data](docs/seed-data.md)
- [Deployment](docs/deployment.md)
- [Releases and GHCR images](docs/release.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Security policy](SECURITY.md)

## Troubleshooting

For local database connection errors, unreachable Expo API URLs, driver verification, token expiry, WebSocket room membership and Docker startup problems, see [docs/troubleshooting.md](docs/troubleshooting.md).

## Publishing backend images

Publishing a semantic-version GitHub Release triggers the GHCR publishing workflow, creating versioned and `latest` backend Docker image tags. See [docs/release.md](docs/release.md) for requirements, validation and deployment precautions.
