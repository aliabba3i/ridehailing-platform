# Security Checklist

The sample payment provider is NOT a real payment gateway. Do not use it for cash transfers.

Production tasks: enforce TLS, rotate secrets, move credentials to a secret vault, enable database backups and restoration drills, add distributed rate limits, enforce phone ownership via trusted OTP, introduce driver KYC and document checks, retain minimal location data under an explicit consent/retention policy, review CORS, restrict admin access with MFA, apply webhook signatures and idempotency keys, monitor fraud, run vulnerability scans, and complete a third-party security review.

Driver verification requires an admin action. Public registration cannot create an admin. Redis and PostgreSQL development ports bind to loopback. Seed credentials must be changed before public deployment.
