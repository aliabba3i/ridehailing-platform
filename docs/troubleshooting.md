# Troubleshooting

Common failures for local development and single-host staging.

## Dependency installation fails

Use Node.js 22 and npm 10 or later (`node --version`, `npm --version`). From the repository root run `npm install`. If you add a lockfile, commit it and use `npm ci` in automated environments.

## Shared imports cannot be resolved

Build the shared workspace before dependent applications:

```bash
npm run build -w @ride/shared
```

Do not commit generated `dist/` artifacts.

## Prisma cannot connect to PostgreSQL

Check `DATABASE_URL`, confirm that `docker compose ps` shows a healthy `postgres` service, and use `localhost:5432` from the host. Containers must connect to the Compose service hostname `postgres`, not localhost. Run `npm run db:generate` and `npm run db:migrate` after dependencies are installed.

## Prisma migration errors

Check that the configured database exists and is writable. Do not manually modify an applied migration. For a real deployment, repair migrations using documented Prisma migration procedures and restore backups if necessary.

## API returns 401 or 403

Pass `Authorization: Bearer <accessToken>`. Access tokens expire after 15 minutes. Use `POST /auth/refresh` with a valid refresh token. `403` usually indicates a role or ride ownership mismatch. Drivers cannot receive offers until verified.

## Physical phone cannot reach the backend

`localhost` on the phone is not the development machine. Set `EXPO_PUBLIC_API_URL` to an IP and port reachable on your trusted local network, and restart Expo after changing client environment variables. Verify firewall permissions and HTTP development policies; use HTTPS outside a private development network.

## Driver cannot see ride offers

Verify that the account has role `DRIVER`, the administrator has set `verified = true`, the driver is online, and a fresh location update was posted within the last minute. Only searching rides within the configured pickup radius are returned. Driver tracking in this MVP is foreground-only.

## Socket.IO location tracking does not update

Confirm that socket authentication includes the access JWT, the client has emitted `ride:join` with a valid ride ID, and the user participates in that ride. Location broadcasts are only emitted for assigned active rides.

## Dashboard does not load data

Ensure that the backend responds at `/health`, that `NEXT_PUBLIC_API_URL` points to the API origin (without `/api/v1`), and that the signed-in user has the `ADMIN` role. The dashboard public URL is compiled at build time for its browser bundle.

## Docker image build or startup fails

Check the current `backend/Dockerfile`, `apps/admin/Dockerfile`, and `docker-compose.yml`. Prisma schema and migrations must be present in the backend image. Check `docker compose logs backend` and `docker compose logs admin`. Default published ports are backend 4000 and dashboard 3000.

## CI fails

Inspect the failing workflow step in the repository Actions tab. The CI workflow installs workspace dependencies, builds shared types, generates Prisma, runs type checks and tests, and builds applications. Do not infer production readiness from a passing unit-test build.

## GitHub Container Registry permissions fail

Confirm release publishing triggered the GHCR workflow, that `packages: write` permission is granted, and that the repository's GitHub Actions policy allows package publishing. Review package access configuration if the target package previously existed under another owner. See [release.md](release.md).

## Need further help

Record the component, reproduction steps, operating system, Node/npm versions, and the error message with all tokens, passwords and personal data removed.
