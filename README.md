# Meldung

[![CI](https://github.com/metaneutrons/meldung/actions/workflows/ci.yml/badge.svg)](https://github.com/metaneutrons/meldung/actions/workflows/ci.yml)
[![Release](https://github.com/metaneutrons/meldung/actions/workflows/release.yml/badge.svg)](https://github.com/metaneutrons/meldung/actions/workflows/release.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-ghcr.io-blue)](https://ghcr.io/metaneutrons/meldung)

**Meldung** is a self-hostable IT security incident reporting portal. Reporters complete a
guided, multi-language wizard; the portal produces a localized PDF, delivers the report to one
or more back-end systems (e-mail, ticketing, webhooks) in parallel, and optionally keeps an
audit trail. Classification follows the **ENISA RSIT** taxonomy and includes a **GDPR Art. 33**
personal-data-breach assessment.

---

## Table of Contents

- [Features](#features)
- [How it works](#how-it-works)
- [Quick Start](#quick-start)
- [Development](#development)
- [Configuration](#configuration)
  - [Branding](#branding)
  - [Localization](#localization)
  - [Delivery channels](#delivery-channels)
    - [E-mail (SMTP)](#e-mail-smtp)
    - [Znuny / OTRS & OTOBO](#znuny--otrs--otobo)
    - [Generic webhook](#generic-webhook)
    - [Zammad](#zammad)
  - [Anti-bot captcha](#anti-bot-captcha)
  - [Persistence (audit trail)](#persistence-audit-trail)
  - [Authentication (SSO)](#authentication-sso)
  - [Taxonomy, systems & GDPR categories](#taxonomy-systems--gdpr-categories)
  - [Reference numbers](#reference-numbers)
- [Environment variables](#environment-variables)
- [Deployment](#deployment)
- [Standards](#standards)
- [License](#license)

---

## Features

- **Guided multi-step wizard** with draft auto-save and resume (stored in the browser).
- **Six languages** — German, English, Spanish, French, Italian, Turkish — covering the full UI,
  the ENISA taxonomy, and the generated report.
- **ENISA RSIT classification** (overridable) and a **GDPR Art. 33** breach-assessment step.
- **Localized PDF report** with an automatic reference number.
- **Multi-channel delivery**, run in parallel and best-effort: e-mail, Znuny/OTRS, OTOBO,
  Zammad, and a generic signed webhook.
- **Optional audit trail** — append-only JSONL file or Postgres.
- **Bot protection** — invisible, GDPR-clean proof-of-work captcha, honeypot, and rate limiting.
- **Optional SSO** via any OIDC-compatible provider.
- **Runtime white-label branding** — colors and logos are injected as CSS variables, no rebuild
  required. Welcome page and footer are authored in Markdown.
- **Accessible, responsive, dark-mode** UI.
- **Enterprise-grade foundation** — a single Zod schema as the source of truth for the form
  (client + server), typed YAML/env configuration, and a Vercel-ready build.

## How it works

```
Wizard (draft auto-save)
        │  submit
        ▼
Server  ├─ rate limit · honeypot · invisible PoW captcha
        ├─ validate (shared Zod schema)
        ├─ build localized report → render PDF (reference number)
        ├─ deliver to every enabled channel in parallel  ── e-mail · OTRS/OTOBO · Zammad · webhook
        └─ persist to the audit trail (best-effort, optional)
        ▼
Confirmation (reference number + PDF download)
```

Delivery is the **source of truth**; persistence is a best-effort audit trail, so a database
outage never fails a submission. Each channel reports its own success/failure independently.

## Quick Start

```bash
docker compose up -d
```

The portal is then available at `http://localhost:3000`. Edit `meldung.config.yaml` (mounted into
the container) to configure delivery and branding.

## Development

Requires **Node.js 20+**.

```bash
npm install --legacy-peer-deps          # Next.js 16 peer deps
cp meldung.config.example.yaml meldung.config.yaml
npm run dev                             # http://localhost:3000
```

### Scripts

| Command          | Purpose                          |
| ---------------- | -------------------------------- |
| `npm run dev`    | Start the dev server (Turbopack) |
| `npm run build`  | Production build                 |
| `npm start`      | Serve the production build       |
| `npm run check`  | Type-check (`tsc --noEmit`)      |
| `npm run lint`   | ESLint                           |
| `npm run format` | Prettier                         |
| `npm test`       | Run the test suite (Vitest)      |

### Project structure

```
src/
  app/                 Next.js App Router — pages, /api/submit, /api/challenge
  components/          UI primitives and wizard steps
  lib/
    form/schema.ts     Zod schema — single source of truth for the form
    delivery/          Delivery channels: email, otrs, webhook, zammad (+ shared http)
    report/model.ts    Localized report model (shared by PDF, e-mail, tickets)
    pdf/               PDF generation (@react-pdf/renderer)
    config/            YAML + environment configuration loader
    persistence/       Optional audit trail (JSONL / Postgres)
  i18n/                Messages, ENISA taxonomy, routing
content/               Welcome page and footer (Markdown)
```

## Configuration

Configuration comes from two layers, with **environment variables always overriding the YAML**:

1. **`meldung.config.yaml`** — non-secret settings (branding, channel options, taxonomy). Copy it
   from [`meldung.config.example.yaml`](meldung.config.example.yaml), which documents every key.
2. **Environment variables** — secrets and deploy-specific values, so credentials never live in
   version-controlled YAML. See [`.env.example`](.env.example) and the
   [table below](#environment-variables).

### Branding

White-label the portal via the `branding:` block — values are injected as CSS variables at
runtime, so no rebuild is needed to rebrand.

| Key                           | Purpose                                                         |
| ----------------------------- | --------------------------------------------------------------- |
| `orgName`                     | Organization name (shown when no logo is set)                   |
| `logoUrl` / `logoDarkUrl`     | Web logo (SVG ok) and optional dark-mode variant                |
| `logoPdfUrl`                  | Raster logo (PNG/JPG) for the PDF — SVG cannot be embedded      |
| `favicon`                     | Browser-tab icon                                                |
| `primaryColor`                | Brand color (hex); drives buttons, accents and the PDF          |
| `brandForeground`             | Text-on-brand color (auto-derived for WCAG contrast if omitted) |
| `accentColor`                 | Secondary accent (hex)                                          |
| `appTitle` / `appDescription` | Browser-tab + PDF title and meta description                    |

Place logo and favicon assets in `public/`. The welcome page and footer are Markdown files under
`content/`.

### Localization

The UI ships in **DE, EN, ES, FR, IT, TR**. Set the default with `defaultLocale:` (one of those
codes); reporters can switch language in the header. Translations live in `src/i18n/messages/`,
with the ENISA taxonomy and report strings localized alongside.

### Delivery channels

Configure how reports are delivered after submission under `delivery:`. **Any number of channels
can be enabled simultaneously** — they run in parallel and report success independently. If all
are disabled, the report is still available as a PDF download on the confirmation screen.

> Secrets (passwords, tokens, the webhook secret) are best supplied via environment variables;
> see the [table below](#environment-variables).

#### E-mail (SMTP)

Sends the report (with the PDF attached) to one or more recipients, plus a confirmation e-mail to
the reporter.

```yaml
delivery:
  email:
    enabled: true
    smtp:
      host: 'smtp.example.com'
      port: 587
      secure: true
      user: 'noreply@example.com'
      pass: 'your-smtp-password' # prefer SMTP_PASS env
      from: 'IT-Security <it-security@example.com>'
      recipients:
        - 'cert@example.com'
        - 'dpo@example.com'
```

#### Znuny / OTRS & OTOBO

Creates a ticket through the OTRS-compatible **GenericInterface REST** connector (`/Session` →
`/Ticket`). **Znuny** and **OTOBO** are both OTRS 6 forks and share the identical connector, so
they use the same options under their respective `znuny:` / `otobo:` blocks — both can be enabled
at once. OTOBO requires the standard REST web service to be imported (exactly as for Znuny).

| Key             | Default    | Purpose                                            |
| --------------- | ---------- | -------------------------------------------------- |
| `baseUrl`       | —          | Web service base URL                               |
| `username`      | —          | API user (prefer `*_USERNAME` env)                 |
| `password`      | —          | API password (prefer `*_PASSWORD` env)             |
| `queue`         | `Security` | Target queue                                       |
| `priority`      | `3 normal` | Ticket priority                                    |
| `state`         | `new`      | Initial state                                      |
| `mappingMode`   | `minimal`  | `minimal` · `rich` · `json-attachment` (see below) |
| `fieldMappings` | —          | Form field → Dynamic Field map (used by `rich`)    |
| `timeoutMs`     | `10000`    | Request timeout                                    |

**Mapping modes**

- `minimal` — ticket title + a formatted plain-text body.
- `rich` — `minimal` plus OTRS **Dynamic Fields** populated from `fieldMappings`.
- `json-attachment` — short summary body with the full form data attached as a JSON file.

```yaml
delivery:
  otobo:
    enabled: true
    config:
      baseUrl: 'https://otobo.example.com/otobo/nph-genericinterface.pl/Webservice/GenericTicketConnectorREST'
      username: 'api-user'
      queue: 'IT-Security'
      mappingMode: 'minimal'
```

#### Generic webhook

POSTs a stable, versioned JSON payload to any URL — wire it into n8n, Make, Power Automate, a SOAR
playbook, a SIEM, or a custom endpoint. This is the most flexible channel: it integrates with any
system that can receive an HTTP request.

| Key          | Default | Purpose                                                           |
| ------------ | ------- | ----------------------------------------------------------------- |
| `url`        | —       | Destination URL                                                   |
| `method`     | `POST`  | `POST` or `PUT`                                                   |
| `headers`    | —       | Optional custom headers (e.g. an API key)                         |
| `secret`     | —       | If set, the body is signed (HMAC-SHA256); prefer `WEBHOOK_SECRET` |
| `includePdf` | `false` | Include the PDF as base64 in the payload                          |
| `timeoutMs`  | `10000` | Request timeout                                                   |

**Payload contract** (`Content-Type: application/json`):

```jsonc
{
  "version": "1",
  "event": "incident.reported",
  "referenceNumber": "INC-20260630-a3f2",
  "locale": "de",
  "submittedAt": "2026-06-30T12:34:56.000Z",
  "data": {
    /* raw form fields — stable keys, machine-parseable */
  },
  "report": {
    "title": "…",
    "category": "…",
    "meta": { "reference": "…", "generated": "…", "page": "…" },
    "sections": [{ "title": "…", "fields": [{ "label": "…", "value": "…" }] }],
  },
  "pdfBase64": "…", // only when includePdf is true
}
```

**Signature verification.** When `secret` is set, each request carries a header

```
X-Meldung-Signature: sha256=<hex(hmac_sha256(secret, rawBody))>
```

Compute the HMAC over the **raw request body** (before JSON parsing) and compare in constant time:

```js
import { createHmac, timingSafeEqual } from 'node:crypto';

function isValid(rawBody, header, secret) {
  const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(header ?? ''),
    b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
```

```yaml
delivery:
  webhook:
    enabled: true
    config:
      url: 'https://hooks.example.com/incident'
      secret: 'shared-secret' # prefer WEBHOOK_SECRET env
      includePdf: false
      headers:
        Authorization: 'Bearer your-token'
```

#### Zammad

Creates a ticket via the Zammad REST API (token auth). The report becomes the first article; the
PDF is attached when `includePdf` is enabled. Zammad auto-creates the customer from the reporter's
e-mail; `customerEmailFallback` is used when the reporter provided none.

| Key                     | Default | Purpose                                     |
| ----------------------- | ------- | ------------------------------------------- |
| `baseUrl`               | —       | Zammad base URL                             |
| `token`                 | —       | API token (prefer `ZAMMAD_TOKEN` env)       |
| `group`                 | `Users` | Target group                                |
| `customerEmailFallback` | —       | Customer e-mail when the reporter gave none |
| `includePdf`            | `true`  | Attach the PDF to the article               |
| `timeoutMs`             | `10000` | Request timeout                             |

```yaml
delivery:
  zammad:
    enabled: true
    config:
      baseUrl: 'https://zammad.example.com'
      token: 'your-api-token' # prefer ZAMMAD_TOKEN env
      group: 'IT-Security'
```

### Anti-bot captcha

Submissions are protected by an **invisible proof-of-work captcha** (ALTCHA-style): the server
issues an HMAC-signed challenge and the browser solves it transparently — no puzzles, no third
party, **GDPR-clean**. A honeypot field and per-IP rate limiting back it up.

```yaml
captcha:
  difficulty: 120000 # work factor; higher = more deterrence, slightly slower solve (usually <1s)
```

Set **`CAPTCHA_SECRET`** in the environment (it falls back to `AUTH_SECRET`). On serverless or
multi-instance deployments this is **required** so challenges issued by one instance verify on
another.

### Persistence (audit trail)

Optionally store every submission for an audit trail. This is **best-effort** — its failure never
fails a submission, because delivery is the source of truth.

```yaml
persistence:
  enabled: false
  driver: sqlite # "sqlite" (append-only JSONL file) or "postgres" (serverless)
  connectionString: './data/meldung.jsonl'
```

- **`sqlite`** — appends to a JSONL file (default `./data/meldung.jsonl`); ideal for self-hosted /
  Docker-volume setups.
- **`postgres`** — serverless-friendly (Vercel Postgres, Neon, Supabase, …); set the connection
  string via `DATABASE_URL`.

### Authentication (SSO)

Optionally require login before the form is accessible, via any OIDC-compatible provider
(Keycloak, Entra ID / Azure AD, etc.).

```yaml
auth:
  enabled: false
  provider: oidc
  # issuer / clientId / clientSecret — prefer the AUTH_* env vars
```

Set `AUTH_ENABLED=true` and `AUTH_SECRET` in the environment to activate it.

### Taxonomy, systems & GDPR categories

These default to sensible built-ins and can be fully overridden in YAML:

- **`taxonomy`** — incident classification; defaults to the built-in 9-category ENISA RSIT
  taxonomy.
- **`systems`** — the affected-systems checklist.
- **`dataCategories`** / **`personCategories`** — option lists for the GDPR breach step.

See [`meldung.config.example.yaml`](meldung.config.example.yaml) for the exact shapes.

### Reference numbers

Every report gets an identifier of the form `{prefix}-{YYYYMMDD}-{4 hex}`, e.g.
`INC-20260630-a3f2`. Change the prefix with `referencePrefix: 'INC'`.

## Environment variables

All variables override the YAML. Set them in your host or your Vercel project. Full reference in
[`.env.example`](.env.example).

| Area           | Variables                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| Authentication | `AUTH_ENABLED`, `AUTH_SECRET`, `AUTH_ISSUER`, `AUTH_CLIENT_ID`, `AUTH_CLIENT_SECRET`                               |
| E-mail         | `EMAIL_ENABLED`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_RECIPIENTS` |
| Znuny / OTRS   | `ZNUNY_ENABLED`, `ZNUNY_BASE_URL`, `ZNUNY_USERNAME`, `ZNUNY_PASSWORD`                                              |
| OTOBO          | `OTOBO_ENABLED`, `OTOBO_BASE_URL`, `OTOBO_USERNAME`, `OTOBO_PASSWORD`                                              |
| Webhook        | `WEBHOOK_ENABLED`, `WEBHOOK_URL`, `WEBHOOK_SECRET`                                                                 |
| Zammad         | `ZAMMAD_ENABLED`, `ZAMMAD_BASE_URL`, `ZAMMAD_TOKEN`                                                                |
| Persistence    | `PERSISTENCE_ENABLED`, `PERSISTENCE_DRIVER`, `DATABASE_URL`                                                        |
| Captcha        | `CAPTCHA_SECRET`                                                                                                   |

`*_RECIPIENTS` is a comma-separated list. Boolean variables expect `true` / `false`. To enable a
delivery channel via env, set its `*_ENABLED=true` **and** provide its connection details.

## Deployment

### Docker

```bash
docker pull ghcr.io/metaneutrons/meldung:latest
docker run -p 3000:3000 \
  -v ./meldung.config.yaml:/app/meldung.config.yaml \
  ghcr.io/metaneutrons/meldung:latest
```

Or use the provided [`docker-compose.yml`](docker-compose.yml):

```bash
docker compose up -d
```

### Vercel

Deploy directly from the repository. Keep these in mind:

- Set the secrets from [`.env.example`](.env.example) as project environment variables.
- **`CAPTCHA_SECRET`** (and `AUTH_SECRET`) **must** be set so proof-of-work challenges verify
  across serverless instances.
- For an audit trail, use `PERSISTENCE_DRIVER=postgres` with a `DATABASE_URL` — the serverless
  filesystem is ephemeral, so the JSONL driver is not durable there.
- `meldung.config.yaml` is bundled into the deployment automatically; provide all secrets via env.

## Standards

- [ENISA RSIT](https://www.enisa.europa.eu/publications/reference-incident-classification-taxonomy) — Incident classification taxonomy
- [NIST SP 800-61](https://csrc.nist.gov/publications/detail/sp/800-61/rev-2/final) — Computer Security Incident Handling Guide
- [GDPR Art. 33](https://gdpr-info.eu/art-33-gdpr/) — Notification of personal data breach

## License

[AGPL-3.0-or-later](LICENSE)
