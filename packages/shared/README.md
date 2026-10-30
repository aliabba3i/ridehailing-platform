# Shared Contracts and HTTP Client

The `@ride/shared` workspace provides DTO-style TypeScript types, geographic helpers and an HTTP client shared by the backend and mobile clients.

## Public exports

- `Role`, `RideStatus`, `Point`, `RideQuote`, `LoginResult`, and `Ride` types.
- `distanceKm(a, b)` for Haversine straight-line distance.
- `validPoint(point)` for latitude and longitude validation.
- `ApiClient` for authenticated JSON API requests and rider workflows.

## Development

From the repository root, run `npm run build -w @ride/shared` before building dependent workspaces. The output is written to `packages/shared/dist/` and must not be committed. Run `npm run typecheck -w @ride/shared` to check types without output.

## Compatibility

Client contracts must be versioned alongside backend changes. Never use client-provided fares or user roles as authoritative backend input. `distanceKm` is an approximation and must not substitute for a road routing or pricing provider in a commercial dispatch system.
