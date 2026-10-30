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
