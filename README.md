# Meldung

[![CI](https://github.com/metaneutrons/meldung/actions/workflows/ci.yml/badge.svg)](https://github.com/metaneutrons/meldung/actions/workflows/ci.yml)
[![Release](https://github.com/metaneutrons/meldung/actions/workflows/release.yml/badge.svg)](https://github.com/metaneutrons/meldung/actions/workflows/release.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-ghcr.io-blue)](https://ghcr.io/metaneutrons/meldung)

**Meldung** — German for a _report_ or _notification_ — is a self-hostable IT security incident
reporting portal. Reporters complete a guided, multi-language wizard; the portal produces a
localized PDF, delivers the report to one or more back-end systems (e-mail, ticketing, webhooks)
in parallel, and optionally keeps an audit trail. Classification follows the **ENISA RSIT**
taxonomy and includes a **GDPR Art. 33** personal-data-breach assessment.

---

## Table of Contents

- [Features](#features)
- [How it works](#how-it-works)
- [Quick Start](#quick-start)
- [Development](#development)
- [Configuration](#configuration)
  - [Branding](#branding)
  - [Localization](#localization)
  - [Texts](#texts)
  - [Delivery channels](#delivery-channels)
    - [E-mail (SMTP)](#e-mail-smtp)
    - [Znuny / OTRS & OTOBO](#znuny--otrs--otobo)
    - [Generic webhook](#generic-webhook)
    - [Zammad](#zammad)
  - [Anti-bot captcha](#anti-bot-captcha)
  - [Persistence (audit trail)](#persistence-audit-trail)
  - [Authentication (SSO)](#authentication-sso)
  - [Preliminary priority](#preliminary-priority)
  - [Reference numbers](#reference-numbers)
- [Environment variables](#environment-variables)
- [Deployment](#deployment)
- [Standards](#standards)
- [License](#license)

---

## Features

- **Guided multi-step wizard** with draft auto-save and resume (stored in the browser).
- **Eight languages** — German, English, Spanish, French, Italian, Turkish, Russian, Ukrainian —
  covering the full UI, the ENISA taxonomy, and the generated report.
- **ENISA RSIT classification** (wording customizable) and a **GDPR Art. 33** breach-assessment step.
- **Localized PDF report** with an automatic reference number.
- **Multi-channel delivery**, run in parallel and best-effort: e-mail, Znuny/OTRS, OTOBO,
  Zammad, and a generic signed webhook.
- **Optional audit trail** — append-only JSONL file or Postgres.
- **Bot protection** — invisible, GDPR-clean proof-of-work captcha, honeypot, and rate limiting.
- **Optional SSO** via any OIDC-compatible provider.
- **Runtime white-label branding** — colors and logos are injected as CSS variables, no rebuild
  required. Every text, in every language, can be overridden per deployment.
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

The portal is then available at `http://localhost:3000`. Edit `meldung.config.yaml` to configure
delivery and branding, and put your own texts into `custom/` (see [Texts](#texts)). Both are
mounted into the container.

## Development

Requires **Node.js 24+** and **pnpm**; the exact pnpm version is pinned in
`package.json` under `packageManager`.

```bash
pnpm install
pnpm dev                                # http://localhost:3000
```

The checked-in `meldung.config.yaml` is the neutral demo configuration that also backs the public
demo. [`meldung.config.example.yaml`](meldung.config.example.yaml) documents every key.

### Scripts

| Command          | Purpose                                                |
| ---------------- | ------------------------------------------------------ |
| `pnpm dev`       | Start the dev server (Turbopack)                       |
| `pnpm build`     | Production build                                       |
| `pnpm start`     | Serve the production build                             |
| `pnpm typecheck` | Generate route types, then `tsc --noEmit`              |
| `pnpm lint`      | Generate route types, then ESLint; warnings are errors |
| `pnpm format`    | Prettier                                               |
| `pnpm test`      | Run the test suite (Vitest)                            |

### Project structure

```
src/
  app/                 Next.js App Router — pages, /api/submit, /api/challenge, /api/health, /api/auth
  components/          UI primitives and wizard steps
  lib/
    form/schema.ts     Zod schema — single source of truth for the form
    delivery/          Delivery channels: email, otrs, webhook, zammad (+ shared http)
    report/model.ts    Localized report model (shared by PDF, e-mail, tickets)
    texts.ts           Per-deployment text overrides (custom/)
    pdf/               PDF generation (@react-pdf/renderer)
    config/            YAML + environment configuration loader
    persistence/       Optional audit trail (JSONL / Postgres)
  i18n/                Messages, ENISA taxonomy, routing
content/               Default welcome page and footer (Markdown)
custom/                Per-deployment text overrides (git-ignored, see Texts)
```

## Configuration

Configuration comes from two layers, with **environment variables always overriding the YAML**:

1. **`meldung.config.yaml`** — non-secret settings (branding, channels, persistence, auth). Start
   from [`meldung.config.example.yaml`](meldung.config.example.yaml), which documents every key.
2. **Environment variables** — secrets and deploy-specific values, so credentials never live in
   version-controlled YAML. See [`.env.example`](.env.example) and the
   [table below](#environment-variables).

### Branding

White-label the portal via the `branding:` block — values are injected as CSS variables at
runtime, so no rebuild is needed to rebrand.

| Key                           | Purpose                                                             |
| ----------------------------- | ------------------------------------------------------------------- |
| `orgName`                     | Organization name (shown when no logo is set)                       |
| `logoUrl` / `logoDarkUrl`     | Web logo (SVG ok) and optional dark-mode variant                    |
| `logoPdfUrl`                  | Raster logo (PNG/JPG) for the PDF — SVG cannot be embedded          |
| `favicon`                     | Browser-tab icon                                                    |
| `primaryColor`                | Brand color (hex); drives buttons, accents and the PDF              |
| `brandForeground`             | Text-on-brand color (auto-derived for WCAG contrast if omitted)     |
| `accentColor`                 | Secondary accent (hex)                                              |
| `appTitle` / `appDescription` | Fixed title and description for all languages (see [Texts](#texts)) |

Place logo and favicon assets in `public/`. All wording, including the welcome page and footer, is
covered under [Texts](#texts).

### Localization

The UI ships in **DE, EN, ES, FR, IT, TR, RU, UK**. Set the default with `defaultLocale:` (one of
those codes); reporters can switch language in the header.

### Texts

Every text the portal shows or sends has a neutral default in all eight languages, and every one
of them can be replaced per deployment without rebuilding the image. That covers the welcome page
and footer, every label, hint and error in the form, the classification, the PDF and the e-mails.

Overrides live in a **custom directory**, `./custom` by default (`MELDUNG_CUSTOM_DIR` to move it).
It mirrors where the defaults live:

| File in `custom/`                 | Replaces                                         | Defaults in          |
| --------------------------------- | ------------------------------------------------ | -------------------- |
| `content/welcome.<locale>.md`     | the welcome page, completely                     | `content/`           |
| `content/footer.<locale>.md`      | the footer, completely                           | `content/`           |
| `messages/<locale>.json`          | UI texts, only the keys you list                 | `src/i18n/messages/` |
| `messages/taxonomy.<locale>.json` | classification labels and descriptions           | `src/i18n/messages/` |
| `messages/report.<locale>.json`   | PDF, report e-mail, confirmation e-mail, tickets | `src/i18n/messages/` |

A Markdown page without a language suffix (`custom/content/welcome.md`) serves every language
that has no page of its own. `{orgName}` in a page is replaced with `branding.orgName`. A Markdown
quote (`> …`) renders as a highlighted note.

A JSON override names only what it changes; everything else keeps its default. To reword the
submit button and the German confirmation e-mail:

`custom/messages/de.json`:

```json
{ "common": { "submit": "Meldung absenden" } }
```

`custom/messages/report.de.json`:

```json
{
  "confirmationMail": {
    "subject": "Ihre Meldung {reference} bei {orgName}",
    "body": "Guten Tag {name},\n\nwir haben Ihre Meldung erhalten.\n\nReferenznummer: {reference}"
  }
}
```

Overrides are checked when they are loaded. A key the defaults do not have, a text where the
default has a group of texts, or a placeholder the default does not offer is rejected with the
file and the key, for example `custom/messages/de.json: common.sumbit does not exist in the default
texts`. Look up the available keys and placeholders in the default file of the same name. Edited
files take effect on the next request; no restart is needed.

The footer default only links to the source code. Replace it with your own legal notice and
privacy policy, and keep a link to the source if you change the code: the AGPL-3.0 requires
offering it to the people who use the portal over a network.

With Docker, mount the directory (the [compose file](docker-compose.yml) does this). On Vercel,
commit it to your deployment's repository; it is bundled into the build.

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

The confirmation to the reporter is sent in the language the report was filed in, after the
helpdesk channels, so it can quote their ticket numbers. Its subject and body are ordinary texts
(`report.confirmationMail`, see [Texts](#texts)) with the placeholders `{reference}`, `{name}`,
`{orgName}` and, in the body, `{ticketLine}`.

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
| `priority`      | —          | Fixed priority for every ticket (overrides below)  |
| `priorities`    | see below  | Priority per triage level                          |
| `state`         | `new`      | Initial state                                      |
| `mappingMode`   | `minimal`  | `minimal` · `rich` · `json-attachment` (see below) |
| `fieldMappings` | —          | Form field → Dynamic Field map (used by `rich`)    |
| `timeoutMs`     | `10000`    | Request timeout                                    |

Without a fixed `priority`, the triage level picks it: `5 very high` (P1), `4 high` (P2),
`3 normal` (P3), `2 low` (P4). The title starts with the level, and the article starts with the
reasons.

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
  "referenceNumber": "INC-20260630-a3f29c",
  "locale": "de",
  "submittedAt": "2026-06-30T12:34:56.000Z",
  "data": {/* raw form fields — stable keys, machine-parseable */},
  "report": {
    "title": "…",
    "category": "…",
    "meta": { "reference": "…", "generated": "…", "page": "…" },
    "sections": [{ "title": "…", "fields": [{ "label": "…", "value": "…" }] }],
  },
  "triage": { "level": "P2", "reasons": ["attackOrBreach"], "orientation72h": null, "version": 1 },
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

Creates a ticket via the Zammad REST API (token auth). The report becomes the first article, sent
as the customer; the PDF is attached when `includePdf` is enabled.

The reporter's e-mail is passed as `customer_id: guess:<e-mail>`. Zammad links the ticket to an
existing user with that address, or **creates a new customer account** for it. Every reporter who is
not yet known to Zammad therefore ends up as a user there; plan your retention rules accordingly.

The token needs the `ticket.agent` permission for the target group. With a customer-level token
Zammad ignores the given customer and files every ticket under the token's own user.

Zammad ships a trigger, "auto reply (on new tickets)", that answers every new customer web ticket
with its own English e-mail and a link to its customer portal. meldung already confirms in the
reporter's language, so it marks the article to skip that trigger. Set `autoReply: true` to let
Zammad's reply go out as well. The marker needs the agent-level token; with a customer-level token
Zammad drops it.

The ticket title starts with the triage level (`[P1] [INC-…]`). `priorities` maps the levels to
Zammad priority names; the defaults `3 high` (P1, P2), `2 normal` (P3) and `1 low` (P4) are those
of a fresh installation. A name Zammad does not know fails the ticket with HTTP 422. The reasons go
into an internal note on the ticket.

| Key          | Default   | Purpose                               |
| ------------ | --------- | ------------------------------------- |
| `baseUrl`    | —         | Zammad base URL                       |
| `token`      | —         | API token (prefer `ZAMMAD_TOKEN` env) |
| `group`      | `Users`   | Target group                          |
| `includePdf` | `true`    | Attach the PDF to the article         |
| `timeoutMs`  | `10000`   | Request timeout                       |
| `autoReply`  | `false`   | Let Zammad send its own auto reply    |
| `priorities` | see above | Zammad priority per triage level      |

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

### Preliminary priority

Reporters are not asked how critical they think an incident is. They answer what they observed:
whether it is still going on, whether work has stopped, which information is affected and what
happened to it, signs of an attack, roughly how many people are affected and whether lost data was
encrypted. Every question offers "don't know".

From these answers meldung computes a preliminary priority for the team. The rules are applied
top to bottom and every rule that matches adds its reason:

| Level | When                                                                                                                      |
| ----- | ------------------------------------------------------------------------------------------------------------------------- |
| P1    | attack possibly in progress; work stopped with a security link; disclosure of sensitive data, credentials or > 100 people |
| P2    | attack or data incident not in progress; personal data of many people or sensitive categories; unencrypted device lost    |
| P3    | personal data possibly affected; any other security link                                                                  |
| P4    | nothing of the above                                                                                                      |

"Don't know" never lowers a report: it counts as ongoing, as possibly personal and as unencrypted.
When personal data may be involved, the team also sees submission time plus 72 hours as an
orientation. The legal deadline under Art. 33 GDPR runs from the controller's awareness and is the
data protection officer's call.

The priority goes to the team only: as `[P1 · INC-…]` at the start of the report e-mail with the
reasons above the report, as the ticket priority and an internal note in Zammad, as the ticket
priority and the top of the article in Znuny/OTOBO, as `triage` in the webhook payload and in the
audit trail. The reporter never sees it. When an attack may be in progress or work has stopped, the
summary step asks the reporter to stop working on the device and wait for instructions. With an
emergency number configured, it also asks them to call it:

```yaml
contact:
  emergencyPhone: '+49 511 000000'
```

`emergencyPhone` is optional. Without it, the hint leaves out the call and nothing else changes. The
number is shown exactly as written and becomes a `tel:` link, so it can be tapped on a phone, as long
as it consists only of digits, spaces, `-`, `/`, `.` and a leading `+`. Anything else, such as
`+49 511 1234 (24/7)` or `+49 (0)511 1234`, is shown as plain text, because dialling only its digits
would reach a different number. Write the number in international form to make it dialable from
abroad and from mobile phones. Pick a line that is answered when the hint appears, which includes
evenings and weekends. When you reword `steps.summary.emergencyCall`, keep `<call>{phone}</call>`
around the number, otherwise it stays text.

The team-facing texts are written in `defaultLocale` and can be reworded like any other text
(`report.triage`, see [Texts](#texts)).

### Reference numbers

Every report gets an identifier of the form `{prefix}-{YYYYMMDD}-{6 hex}`, e.g.
`INC-20260630-a3f29c`. Change the prefix with `referencePrefix: 'INC'`. The number exists before any
delivery, so it is the same in the PDF, every e-mail and every channel.

When a helpdesk channel (Zammad, Znuny, OTOBO) creates a ticket, its ticket number is shown on the
confirmation screen and quoted in the confirmation e-mail (`{ticketLine}` in
`report.confirmationMail.body`), and it is kept with the delivery results in the audit trail.

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
| Texts          | `MELDUNG_CUSTOM_DIR`                                                                                               |

`*_RECIPIENTS` is a comma-separated list. Boolean variables expect `true` / `false`. To enable a
delivery channel via env, set its `*_ENABLED=true` **and** provide its connection details.

## Deployment

### Docker

```bash
docker pull ghcr.io/metaneutrons/meldung:latest
docker run -p 3000:3000 \
  -v ./meldung.config.yaml:/app/meldung.config.yaml:ro \
  -v ./custom:/app/custom:ro \
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
- `meldung.config.yaml` and the `custom/` directory are bundled into the deployment automatically;
  provide all secrets via env. `custom/` is git-ignored in this repository, so keep it in your own
  deployment repository.

## Standards

- [ENISA RSIT](https://www.enisa.europa.eu/publications/reference-incident-classification-taxonomy) — Incident classification taxonomy
- [NIST SP 800-61](https://csrc.nist.gov/publications/detail/sp/800-61/rev-2/final) — Computer Security Incident Handling Guide
- [GDPR Art. 33](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng#art_33) — Notification of a personal data breach (official text on EUR-Lex)

## License

[AGPL-3.0-or-later](LICENSE)

The PDF report embeds [Noto Sans](https://notofonts.github.io/) so that every supported language,
including Cyrillic and Turkish, renders and can be copied and searched. The font files in
`public/fonts/` are licensed under the [SIL Open Font License 1.1](public/fonts/OFL.txt).
