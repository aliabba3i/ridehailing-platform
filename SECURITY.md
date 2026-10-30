# Security Policy

## Supported versions

Security fixes target the latest commit on the `main` branch. Releases and container images should be considered development artifacts until explicitly verified for production deployment.

## Reporting a vulnerability

Do not disclose exploitable vulnerabilities in public issues or pull requests. Use GitHub's **Report a vulnerability** option under the repository's Security tab if private vulnerability reporting is enabled. If that option is unavailable, contact the repository owner through a private channel before disclosing details publicly. Do not post credentials, access tokens, personal locations, or private user data.

Include affected component and revision, impact, reproducible steps, and a suggested remediation when possible. Remove any live personal or payment data from reports.

## Security boundary

The mock payment endpoint is not a real payment processor. The provided implementation is an engineering starter and must be audited, hardened, and integrated with vetted identity, location, and payment providers before carrying real riders or processing real funds.
