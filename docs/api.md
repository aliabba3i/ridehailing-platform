# API Overview

Base URL: `http://localhost:4000`. All protected endpoints require `Authorization: Bearer <JWT>`.

| Method | Endpoint | Role |
| --- | --- | --- |
| POST | /auth/register | Public |
| POST | /auth/login | Public |
| POST | /auth/refresh | Public |
| POST | /auth/logout | Authenticated |
| GET | /users/me | Authenticated |
| POST | /rides/quote | Rider |
| POST | /rides | Rider |
| GET | /rides | Authenticated |
| GET | /rides/:id | Ride participant or admin |
| POST | /rides/:id/accept | Driver |
| POST | /rides/:id/status | Assigned driver |
| POST | /rides/:id/cancel | Rider or assigned driver |
| POST | /rides/:id/rating | Rider, completed ride |
| POST | /drivers/availability | Driver |
| POST | /drivers/location | Driver |
| GET | /drivers/offers | Driver |
| POST | /payments/:rideId/pay | Rider (mock provider only) |
| GET | /payments/:rideId | Participant or admin |
| GET | /admin/summary | Admin |
| GET | /admin/users | Admin |
| GET | /admin/rides | Admin |
| POST | /admin/drivers/:id/verify | Admin |

Coordinates: `{ "lat": 35.6892, "lng": 51.3890 }`. Ride request: `{ "pickup": {...}, "dropoff": {...} }`.

Sockets: `io(baseURL, { auth: { token } })`; emit `ride:join` with a ride UUID; listen for `ride:updated`, `ride:created`, `ride:offer`, `driver:location`. User-room and ride-room access are enforced on the server.

## Authentication payloads

`POST /auth/register` accepts a JSON object containing `name`, `phone`, `password` (at least 12 characters), and `role` (`RIDER` or `DRIVER`). `POST /auth/login` accepts `phone` and `password`. On success both return `user`, `accessToken`, and `refreshToken`. `POST /auth/refresh` accepts `refreshToken` and returns new access and refresh tokens.

## Ride state changes

A newly requested ride enters `SEARCHING`. Verified nearby drivers may accept it with `POST /rides/:id/accept` while online. The assigned driver calls `POST /rides/:id/status` with a JSON `status` field following `ARRIVING` → `ARRIVED` → `IN_PROGRESS` → `COMPLETED`.

Riders submit a rating after completion using `POST /rides/:id/rating` with `{"score":5,"comment":"On time"}`. Payment is currently a non-financial mock operation available only for a completed ride.

## Driver and admin payloads

- `POST /drivers/availability`: `{"online":true}`.
- `POST /drivers/location`: `{"lat":35.6892,"lng":51.3890}`.
- `POST /admin/drivers/:id/verify`: `{"verified":true}`.

## Error responses

Requests may return a JSON `error` message. Common HTTP codes: `400` invalid input, `401` unauthorized, `403` forbidden, `404` not found, `409` state/uniqueness conflict, and `500` unexpected server error.

`GET /health` provides a basic liveness check and `GET /ready` verifies that PostgreSQL is queryable. These endpoints do not require a bearer token. For the integration model and deployment requirements, see [architecture-diagram.md](architecture-diagram.md) and [deployment.md](deployment.md).
