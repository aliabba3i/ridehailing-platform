# Admin Dashboard

Next.js 15 + React + Tailwind dashboard for managing rider/driver accounts, verifying drivers, viewing aggregate ride statistics and browsing recent trips.

## Development

From the repository root:

1. `npm install`
2. `npm run build -w @ride/shared`
3. Start the backend with database migrations applied.
4. Set `NEXT_PUBLIC_API_URL=http://localhost:4000` in the root `.env` or your shell.
5. `npm run dev -w @ride/admin`
6. Open `http://localhost:3000`.

## Admin credentials

The bootstrap account is created only by running `npm run db:seed` with `ADMIN_EMAIL` and a secure `ADMIN_PASSWORD`. The backend stores the bootstrap email value in the account's `phone` field, which also accepts the login identifier. Public registration cannot create administrator accounts.

## Features

- Dashboard totals for users, drivers, rides and completed trips.
- User list and driver verification/revocation.
- Recent trips table.
- Protected admin API calls requiring a JWT with ADMIN role.

## Production considerations

The sample stores an access JWT in browser session storage and has no refresh-token flow. For production, use a secure session strategy, short-lived credentials, CSRF protections where applicable, MFA, auditable privileged actions, fine-grained permissions and a reverse proxy with HTTPS. Never expose the admin dashboard as a production control plane without an independent security review.
