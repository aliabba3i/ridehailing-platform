# System Architecture Diagram

The backend is a modular monolith with distinct rider, driver and administrative clients. PostgreSQL is the durable system of record. Redis is available for operational coordination, but the current Socket.IO deployment is single-instance.

```mermaid
flowchart TD
    Rider["Rider Expo App"] -->|"HTTPS / JWT"| API["Express API"]
    Driver["Driver Expo App"] -->|"HTTPS / JWT"| API
    Admin["Next.js Admin Dashboard"] -->|"HTTPS / Admin JWT"| API
    Rider <-->|"Socket.IO"| WS["Authenticated Socket.IO Gateway"]
    Driver <-->|"Socket.IO"| WS
    API --> AUTH["Authentication and Authorization"]
    API --> RIDES["Ride Lifecycle / Pricing / Matching"]
    API --> PAYMENT["Mock Payment Adapter"]
    AUTH --> DB[("PostgreSQL / Prisma")]
    RIDES --> DB
    PAYMENT --> DB
    RIDES --> WS
    Driver -->|"Foreground location updates"| API
    API -.-> REDIS[("Redis")]
```

## Ride lifecycle

```mermaid
stateDiagram-v2
    [*] --> REQUESTED
    REQUESTED --> SEARCHING
    REQUESTED --> CANCELLED
    SEARCHING --> ACCEPTED
    SEARCHING --> CANCELLED
    SEARCHING --> EXPIRED
    ACCEPTED --> ARRIVING
    ACCEPTED --> CANCELLED
    ARRIVING --> ARRIVED
    ARRIVING --> CANCELLED
    ARRIVED --> IN_PROGRESS
    ARRIVED --> CANCELLED
    IN_PROGRESS --> COMPLETED
    COMPLETED --> [*]
    CANCELLED --> [*]
    EXPIRED --> [*]
```

A rating is a separate record that a rider may submit after a ride reaches `COMPLETED`. It is not a new value of the `RideStatus` enum.

## Trust boundaries

- All financial amounts and state changes are calculated/validated on the server.
- JWT role claims authorize API endpoints; Socket.IO rooms require participant checks.
- PostgreSQL is the authority for ride ownership, trip state and payment records.
- Driver assignment is protected by conditional writes and a partial unique index. Operationally robust dispatch still needs centralized queueing, retries and observability.
- Do not store long-term location trails without a documented retention policy and user consent.

See [architecture.md](architecture.md), [api.md](api.md), and [security.md](security.md).
