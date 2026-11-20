# Node.js compatibility and backend Docker upgrade

This guide documents the runtime versions used in the RideHailing Platform and the safe way to validate a backend Docker upgrade.

## Current runtime policy

| Component | Node.js runtime | Source of truth |
| --- | --- | --- |
| Local development and npm workspaces | 22 (recommended) | `.nvmrc` |
| GitHub Actions compatibility checks | 22 and 26 | `.github/workflows/ci.yml` |
| Backend Docker image | 26 LTS | `backend/Dockerfile` |
| Admin dashboard Docker image | 22 | `apps/admin/Dockerfile` |

The Docker upgrade is scoped to the backend. It does not automatically migrate the Expo rider/driver apps, the Next.js admin container, or the local development baseline. Do not change every runtime version without validating the corresponding dependencies.

## Requirements

- Docker Engine with Docker Compose
- Git and an isolated staging environment
- PostgreSQL 16 and Redis 7 (the included Compose services are suitable for local checks)
- A root `.env` populated from `.env.example`, with distinct strong JWT secrets
- No real customer data or production payment credentials in the test environment

## Automated checks

The GitHub Actions CI workflow:

1. Installs workspace dependencies on Node.js 22 and Node.js 26.
2. Builds the shared TypeScript package.
3. Generates the Prisma client.
4. Runs TypeScript checks, backend tests, and application builds.
5. Builds the backend Docker image using its declared Node.js 26 base image.

Wait for all checks to pass **on the current pull request commit** before merging. A green check from Node.js 22 alone does not validate the new Docker runtime. Be aware that the workflow currently uses `npm install` rather than a committed lockfile; it is a compatibility check, not a fully reproducible dependency audit.

## Local or staging verification

From the repository root:

```bash
cp .env.example .env
# Edit .env: set distinct strong JWT secrets and suitable DB/admin credentials.
docker compose build backend
docker compose up -d postgres redis
docker compose up -d backend
docker compose ps
curl --fail --show-error http://localhost:4000/health
```

**Important:** The backend container automatically runs `prisma migrate deploy` on startup. Use a disposable or backed-up staging database. Check logs after startup:

```bash
docker compose logs --tail=100 backend
```

Then verify, in staging, registration/login and refresh tokens, Prisma database operations, ride quote and lifecycle endpoints, authenticated Socket.IO sessions, and any external integration your deployment uses. See [backend/README.md](../backend/README.md) and [docs/api.md](api.md). Payment and OTP implementations are stubs; passing tests does not make them production-ready.

## Upgrade checklist

- [ ] Node.js 22 and 26 CI jobs both pass.
- [ ] Backend Docker image builds successfully on CI.
- [ ] Staging container starts and `/health` returns a successful response.
- [ ] Migrations are reviewed, backed up and applied successfully in staging.
- [ ] Authentication, ride dispatch/lifecycle, Redis and Socket.IO have been smoke-tested.
- [ ] The prior known-good backend image/tag and deployment configuration are retained.
- [ ] Deployment monitoring and rollback ownership are confirmed.

## Rollback

If the upgraded backend fails after deployment, redeploy the previous known-good backend image (or revert the Docker base-image change and rebuild from the previous commit), while keeping the database and Redis volumes intact. Review schema migrations separately: reverting an application image does not automatically reverse any database migration. Never run `docker compose down -v` as an upgrade rollback.

## Troubleshooting

- **Docker image build fails:** Inspect the `backend-docker-build` GitHub Actions log or run `docker compose build --no-cache backend` in staging. Check native module builds and OpenSSL/Prisma compatibility first.
- **Prisma fails to generate or migrate:** Confirm the container has OpenSSL and a valid `DATABASE_URL`; inspect migration output and the compatible Prisma version.
- **Tests pass on Node.js 22 but fail on 26:** Do not merge the runtime upgrade until the failure is reproduced and fixed. Treat platform-specific native dependencies as possible causes.
- **Health check fails:** Review `docker compose logs backend`, PostgreSQL/Redis health, the configured secrets, and port 4000.
- **Mobile app cannot reach API:** Use a reachable network IP for Expo's `EXPO_PUBLIC_API_URL`, not the device's `localhost`.

## Version maintenance

Upgrade Prisma, Node.js and the admin/mobile app toolchains in separate, reviewed changes unless their compatibility has been demonstrated together. Keep Node.js base images on actively maintained, security-patched release lines, and repeat CI plus staging checks after upgrading a major version.
