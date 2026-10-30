# Backend API

Express 5, Prisma/PostgreSQL, JWT access and refresh sessions, Argon2 passwords and Socket.IO.

## Run
From repository root: `npm install`, `docker compose up -d postgres redis`, `npm run db:generate`, `npm run db:migrate`, `npm run dev`.

## Routes
- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`
- `GET /users/me`
- `POST /rides/quote`, `POST /rides`, `GET /rides`, `GET /rides/:id`
- `POST /rides/:id/accept`, `POST /rides/:id/status`, `POST /rides/:id/cancel`, `POST /rides/:id/rating`
- `POST /drivers/location`, `POST /drivers/availability`, `GET /drivers/offers`
- `POST /payments/:rideId/pay`, `GET /payments/:rideId`
- `GET /admin/summary`, `GET /admin/users`, `GET /admin/rides`

Use `Authorization: Bearer <accessToken>`. Socket.IO accepts `auth: {token}` and validates ride membership for room access.

## Notes
Money is integer IRR. The stub payment endpoint marks a payment as succeeded without a real transfer and MUST be replaced before taking payments. The initial matching algorithm is straight-line and first-fit; integrate routing and queue orchestration for production. Public driver registration is supported; operational verification is required before real launch.

## Request and response behavior

Coordinates are JSON objects with numeric `lat` and `lng` members. The quote route and ride creation route take `{"pickup":{"lat":35.6892,"lng":51.3890},"dropoff":{"lat":35.7,"lng":51.4}}`. The quote response contains `currency`, `total`, `distanceKm`, `durationMin` and `surge`.

The `POST /rides/:id/status` endpoint accepts `{"status":"ARRIVING"}`, `{"status":"ARRIVED"}`, `{"status":"IN_PROGRESS"}`, or `{"status":"COMPLETED"}` from the assigned driver, subject to the state machine. Riders rate completed rides with `{"score":5,"comment":"Optional feedback"}`. New drivers require administrator verification before receiving offers.

Errors are JSON objects with an `error` string. Expected status codes include `400` for invalid input, `401` for missing or invalid tokens, `403` for insufficient permissions, `404` for absent records and `409` for ride or uniqueness conflicts.

## Local testing

From the repository root run `npm run build -w @ride/shared`, `npm run db:generate`, `npm run typecheck`, and `npm test`. Unit tests do not replace database integration, socket, payment and concurrency testing.

## Data initialization

See [seed data](../docs/seed-data.md). The seed creates only an explicit administrator account, not riders, drivers or test rides. Verify credential strength before running the seed command.

## System diagrams and support

See [architecture diagram](../docs/architecture-diagram.md), [API reference](../docs/api.md), [troubleshooting](../docs/troubleshooting.md), and [security](../docs/security.md).
