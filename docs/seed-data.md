# Database Setup and Seed Data

## Prerequisites

- PostgreSQL 16 running locally or through Docker Compose.
- A root `.env` file containing a valid `DATABASE_URL`.
- Node.js 22 and installed npm workspaces.

## Initialize the database

Run from the repository root:

```bash
npm install
docker compose up -d postgres redis
npm run build -w @ride/shared
npm run db:generate
npm run db:migrate
```

Development migrations use `prisma migrate dev`. Production and staging should use `npm run db:deploy` to apply committed migrations; never generate new migrations on production servers.

## Bootstrap administrator

The seed script lives at `backend/prisma/seed.ts`. It creates an administrator account only when you explicitly call:

```bash
npm run db:seed
```

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` first. The password must contain at least 12 characters, and must not be the sample placeholder. The seed uses `ADMIN_EMAIL` as the login identifier stored in the `phone` column. Login at `POST /auth/login` using the same identifier as `phone`.

Running the seed a second time leaves an existing administrator unchanged; it does not reset the password. Rotate an existing administrator credential using an approved administrative process rather than assuming reseeding changes it.

## Rider and driver records

- Create a rider through `POST /auth/register` with role `RIDER`.
- Create a driver through the same route with role `DRIVER`.
- Newly registered drivers have `verified = false`; an administrator must call `POST /admin/drivers/:id/verify` with `{"verified": true}`.
- Drivers must be online and report recent coordinates to receive nearby requests.

No preloaded rider accounts, driver accounts, trips, payments or GPS records are inserted by the seed script. This avoids publishing predictable user credentials.

## Data safety

Do not run destructive database reset commands against production. Use backups before migration operations, restrict database access, and keep bootstrap credentials out of logs and source control.
