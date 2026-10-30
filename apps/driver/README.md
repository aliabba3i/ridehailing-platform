# Driver Mobile Application

Expo Router + React Native application for driver sign-in, availability, foreground location updates, nearby ride offers, and ride status progression.

## Requirements and setup

- Node.js 22 and npm 10+.
- A running backend with PostgreSQL, Redis and Prisma migrations applied.
- A driver account created in the app.
- Administrative verification of the driver profile before offers become available.

From the repository root:

1. `npm install`
2. `npm run build -w @ride/shared`
3. Configure `EXPO_PUBLIC_API_URL` to the API origin reachable by the phone, for example `http://192.168.1.10:4000`.
4. `npm run start -w @ride/driver`

## Driver workflow

1. Sign in or register with the DRIVER role.
2. An administrator verifies the driver account through the dashboard.
3. Grant foreground location access and go online.
4. The app reports location while online and in the foreground.
5. Refresh the offer list and accept an eligible nearby ride.
6. Advance the accepted trip through `ARRIVING`, `ARRIVED`, `IN_PROGRESS`, and `COMPLETED`.

`app/index.tsx` implements this demo flow; `src/session.ts` uses Expo SecureStore for access-token storage.

## Important limitations

Foreground tracking stops when the app is suspended. Real-world dispatch requires compliant background-location tracking with explicit consent, a production navigation provider, reliable offline/reconnect handling, push notifications, eligibility checks, and dedicated tests. The current offer list is polling-based, with a Socket.IO event used as an additional refresh signal. Driver earnings and payout processing are not implemented.
