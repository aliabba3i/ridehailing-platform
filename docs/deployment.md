# Deployment Guide

Use PostgreSQL 16, Redis 7 and Node 22. Docker Compose is designed for single-host staging, not a high-availability production cluster.

1. Copy `.env.example` to `.env`, assign unique strong JWT secrets and a secure admin bootstrap password.
2. Provision durable PostgreSQL/Redis volumes and establish verified backup/restore operations.
3. Run `docker compose up --build -d`; backend startup deploys Prisma migrations before accepting traffic.
4. Terminate HTTPS at a reverse proxy; restrict database/Redis ports and protect the admin dashboard.
5. Use a dedicated migration task for multi-instance deployment rather than racing migrations on API replica startup.
6. Add health checks, alerting, structured logs, centralized audit records and rollout/rollback plans.

The demo payment provider, geospatial approximations and simulated routing **must not** be used for a paid production taxi business. Integrate a regulated payment provider, consent/privacy workflow, verified driver onboarding, background location SDK and road routing before any real launch.

## Container registry

A published GitHub Release triggers the backend image build and GHCR push using `backend/Dockerfile`. Version tags and `latest` are published to `ghcr.io/aliabba3i/ridehailing-platform`. See [release.md](release.md) for the exact publishing and security prerequisites.
