# Release and Container Publishing

The workflow in `.github/workflows/publish-ghcr.yml` runs when a GitHub Release is **published**. It builds the backend image using the root repository as the build context and `backend/Dockerfile` as the Dockerfile.

## Release tags

Use semantic versions, with or without a leading `v`:

- `1.0.0` becomes `ghcr.io/aliabba3i/ridehailing-platform:1.0.0`.
- `v1.0.0` becomes `ghcr.io/aliabba3i/ridehailing-platform:1.0.0`.
- Each published release also updates `ghcr.io/aliabba3i/ridehailing-platform:latest`.

Publishing a prerelease updates `latest` as well. Do not publish prereleases unless this is intended; adjust the workflow if stable-only `latest` tagging is required.

## How to publish

1. Ensure the target revision passes the repository CI workflow.
2. Create a semantic version tag for the verified commit.
3. Publish a GitHub Release pointing to that tag.
4. Open the Actions tab and inspect the **Publish Backend to GHCR** run.
5. Verify both container tags in the repository Packages area.

The workflow logs in to GHCR as `github.actor` using the ephemeral `GITHUB_TOKEN`, with job permissions `contents: read` and `packages: write`. No personal access token should be stored in the repository for this job.

## Pulling the image

```bash
docker pull ghcr.io/aliabba3i/ridehailing-platform:1.0.0
```

GHCR package visibility may initially be private, even for a public source repository. Configure the package visibility and access according to your deployment policy.

## Deploying safely

The published image contains the backend and Prisma migration tools; it does not include a PostgreSQL server or Redis instance. Supply production environment variables and use a managed or protected database and Redis service. Run database migrations once per deployment, not concurrently across replicas. Back up the database and verify rollback plans before applying schema changes.

The current payment integration is a mock. Shipping a container image does not certify the application for real passenger transport or real payments.
