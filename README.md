# Meldung

[![CI](https://github.com/metaneutrons/meldung/actions/workflows/ci.yml/badge.svg)](https://github.com/metaneutrons/meldung/actions/workflows/ci.yml)
[![Release](https://github.com/metaneutrons/meldung/actions/workflows/release.yml/badge.svg)](https://github.com/metaneutrons/meldung/actions/workflows/release.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-ghcr.io-blue)](https://ghcr.io/metaneutrons/meldung)

IT Security Incident Reporting Application

## Features

- Multi-step wizard for structured incident reporting
- Multi-language support (DE, EN, ES, FR, TR, IT)
- PDF report generation with automatic reference numbers
- Email delivery via SMTP and configurable channels
- GDPR Art. 33 personal data breach assessment
- ENISA RSIT taxonomy-based classification
- Dark mode, responsive design, accessibility
- Configurable branding, welcome page, and footer (Markdown)
- Draft auto-save with resume capability

## Quick Start

```bash
docker compose up -d
```

The application is available at `http://localhost:3000`.

## Development

```bash
npm install --legacy-peer-deps
cp meldung.config.example.yaml meldung.config.yaml
npm run dev
```

## Configuration

Copy [`meldung.config.example.yaml`](meldung.config.example.yaml) and adjust to your environment. The config controls branding, SMTP delivery, and incident categories.

### Branding

White-label the portal via the `branding:` block — brand values are injected as CSS variables at runtime, so no rebuild is needed to rebrand.

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

Place logo and favicon assets in `public/`. Secrets (SMTP, OIDC, DB) belong in environment variables — see [`.env.example`](.env.example).

## Deployment

### Docker

```bash
docker pull ghcr.io/metaneutrons/meldung:latest
docker run -p 3000:3000 -v ./meldung.config.yaml:/app/meldung.config.yaml ghcr.io/metaneutrons/meldung:latest
```

### Vercel

Deploy directly from the repository. Set environment variables as documented in `.env.example`.

## Standards

- [ENISA RSIT](https://www.enisa.europa.eu/publications/reference-incident-classification-taxonomy) — Incident classification taxonomy
- [NIST SP 800-61](https://csrc.nist.gov/publications/detail/sp/800-61/rev-2/final) — Computer Security Incident Handling Guide
- [GDPR Art. 33](https://gdpr-info.eu/art-33-gdpr/) — Notification of personal data breach

## License

[AGPL-3.0-or-later](LICENSE)
