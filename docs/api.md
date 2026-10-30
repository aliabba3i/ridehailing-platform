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
