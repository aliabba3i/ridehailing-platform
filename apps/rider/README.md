# Rider Mobile Application

Expo Router + React Native application for rider onboarding, fare quotes, ride requests, live ride state, trip cancellation, ratings, and mock payment completion.

## Requirements

Node.js 22, npm 10+, a reachable running backend, and an Android/iOS simulator or supported physical device.

## Start

From the repository root:

1. Install workspaces with `npm install`.
2. Build shared contracts: `npm run build -w @ride/shared`.
3. Start the backend and its database dependencies as described in the root README.
4. Configure `EXPO_PUBLIC_API_URL` (for example `http://192.168.1.10:4000` on a trusted LAN).
5. Run `npm run start -w @ride/rider` and follow the Expo terminal instructions.

The API base URL does **not** include `/api/v1` in this implementation. `localhost` on a physical device refers to the phone, not the development computer.

## Screens and behavior

- `app/index.tsx` authenticates a rider, selects pickup/destination coordinates, quotes a fare and lists past rides.
- `app/ride/[id].tsx` displays the current ride, listens for Socket.IO ride status events, and supports cancellation, completion rating and the payment stub.
- `src/session.ts` stores an access token in Expo SecureStore and configures the shared HTTP client.

## Current limitations

The pickup/destination UI uses coordinate inputs rather than a map picker and navigation. Socket.IO requires a valid JWT and a ride participant identity. The current mobile client does not automatically refresh expired access tokens; add refresh-token storage, rotation and expiry handling before production. The mock payment endpoint marks test payments successful without charging real money.

Background geolocation, permissions, notifications, accessibility and store compliance require additional platform-specific work before release.
