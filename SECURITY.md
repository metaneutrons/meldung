# Security Policy

Meldung receives IT security incident reports and GDPR Art. 33 breach
assessments. A weakness here can expose exactly the data a reporter submitted in
confidence, so security reports are welcome and treated with priority.

## Supported versions

Only the latest release receives fixes. There are no maintained release
branches.

| Version        | Supported |
| -------------- | --------- |
| latest release | yes       |
| anything older | no        |

## Reporting a vulnerability

Report privately through GitHub's
[private vulnerability reporting](https://github.com/metaneutrons/meldung/security/advisories/new).
Please do not open a public issue, and do not disclose the finding before a fix
is available.

Useful in a report:

- affected version or commit, and the deployment mode (Docker, Vercel, other)
- which configuration was active, in particular the delivery channels and
  whether authentication or persistence was enabled
- reproduction steps, and the impact you were able to demonstrate

Reports are acknowledged as soon as possible; this is a small project without a
staffed on-call rotation. You will be credited in the advisory unless you prefer
otherwise.

## Out of scope

- findings that require an attacker to already control the host or the
  configuration file
- missing hardening headers without a demonstrated impact
- automated scanner output submitted without a working reproduction

## Operator responsibilities

Some guarantees depend on deployment, not on the code:

- `CAPTCHA_SECRET` and `AUTH_SECRET` must be set and stable across instances.
  Without them the proof-of-work challenges fall back to a well-known value.
- The file persistence driver stores reports unencrypted on the volume. On
  serverless platforms use the `postgres` driver; the filesystem is ephemeral
  there.
- Delivery credentials belong in environment variables, never in
  `meldung.config.yaml`, which is version controlled.
