# Changelog

## [0.2.0](https://github.com/metaneutrons/meldung/compare/v0.1.0...v0.2.0) (2026-07-01)


### Features

* **api:** harden incident submission with rate limiting and sanitized errors ([dedd7b6](https://github.com/metaneutrons/meldung/commit/dedd7b6ea07b775c4939c8c18e9ef1ed38c4ca42))
* **api:** submission, PDF download, and auth routes ([8de4d73](https://github.com/metaneutrons/meldung/commit/8de4d73c843ccb77291995564e17e96c649266a0))
* **branding:** optional logos (web/dark/pdf), config metadata and color validation ([55002fe](https://github.com/metaneutrons/meldung/commit/55002feb020191890555a1e07b9374d5a15e643c))
* configurable captcha difficulty and localized submit errors ([3e0b854](https://github.com/metaneutrons/meldung/commit/3e0b85495ed5df2459ed71a0bf4e6dc1fd250406))
* **config:** vercel-safe config loading via file tracing and env secrets ([cf4afb6](https://github.com/metaneutrons/meldung/commit/cf4afb6aeb32114688205d3f688201ab845575b2))
* **config:** Zod-validated YAML configuration system ([d811f0c](https://github.com/metaneutrons/meldung/commit/d811f0c1bdd00de6cbf0b02ccc94e54d7166a0fb))
* **delivery:** add OTRS/OTOBO, signed webhook, and Zammad channels ([4538f4c](https://github.com/metaneutrons/meldung/commit/4538f4cc69fd7737e74f4f1f13e1517afde7fc41))
* **delivery:** PDF generation + email + Znuny channels ([a2b39e5](https://github.com/metaneutrons/meldung/commit/a2b39e54ee8c62f86cf9b1598d984f03049b08c6))
* **form:** all wizard steps with WCAG AAA compliance ([fd0eef8](https://github.com/metaneutrons/meldung/commit/fd0eef89bdeb3e44a7618cd17c91ce4580020608))
* **form:** shared zod schema as client/server SSOT with length caps ([b41e4b4](https://github.com/metaneutrons/meldung/commit/b41e4b45cb737fb9f8b62f66dc9990ad86bd3471))
* **form:** split contact into separate email and phone fields ([d54d78b](https://github.com/metaneutrons/meldung/commit/d54d78ba70d55b85d05afbd095492f009e854a09))
* **i18n:** internationalization with 6 locales ([f165624](https://github.com/metaneutrons/meldung/commit/f165624ce053f189a37a2bf6f8eecc4d14b23647))
* **i18n:** locale-aware footer with translations ([bb061db](https://github.com/metaneutrons/meldung/commit/bb061db571c0c7d095f9c8f031ec6b3e4e520221))
* **i18n:** localize ENISA taxonomy and affected systems across 6 languages ([361bff9](https://github.com/metaneutrons/meldung/commit/361bff99c82d19005a943945ba4321f857ec014d))
* **persistence:** optional JSONL file-based audit trail ([7ecfea7](https://github.com/metaneutrons/meldung/commit/7ecfea7c846961d3ba550ec4a11188c3294d9104))
* **persistence:** optional serverless postgres audit-trail driver ([b42a879](https://github.com/metaneutrons/meldung/commit/b42a879a7390dba4ac1406d7d0768d10aeb1b602))
* **report:** unified localized report model for pdf, email and znuny ([7e23a79](https://github.com/metaneutrons/meldung/commit/7e23a7995708ebf608b2a4d624752f8829b99bfe))
* **store:** Zustand form state with localStorage persistence ([12e70b5](https://github.com/metaneutrons/meldung/commit/12e70b560069805502eb33855b9dcf9e186809b7))
* summary step links and a self-hosted GDPR-clean captcha ([0e75a8e](https://github.com/metaneutrons/meldung/commit/0e75a8ebb049c92cad1bd51c2b496a3c4b740fd3))
* **theme:** cookie-based SSR dark/light mode ([2959b2e](https://github.com/metaneutrons/meldung/commit/2959b2ede94257c6c1fcdbb5228c9decb0511503))
* **ui:** full-screen wizard with Framer Motion animations ([9b0328e](https://github.com/metaneutrons/meldung/commit/9b0328e45da2ee738b704c6a6ac66658da3bb2de))
* **ui:** semantic design tokens and reusable UI primitives ([95cad70](https://github.com/metaneutrons/meldung/commit/95cad7085d0c6ecc2443f56c0f184308547b8656))
* **ux:** draft banner as overlay with blur, full i18n ([a581502](https://github.com/metaneutrons/meldung/commit/a581502fe7193267dfa07f68a6df2f679e10a4df))
* **validation:** visual feedback on required fields ([0a9c45a](https://github.com/metaneutrons/meldung/commit/0a9c45afc6615e0cf6c3b26bd626c5e3d939ec46))


### Bug Fixes

* **build:** load commitlint config-conventional preset via .mjs ([ebf0aa2](https://github.com/metaneutrons/meldung/commit/ebf0aa20d7d8770cf6bbd83329368f3cb46ee3bb))
* **draft:** only offer to resume a draft that existed at page load ([4b60fec](https://github.com/metaneutrons/meldung/commit/4b60fec68adfcfac6c4d7d851b7b30ecf92dbfca))
* resolve all lint errors, strict pre-commit checks ([bfc2816](https://github.com/metaneutrons/meldung/commit/bfc281690819a59b934f3a8efb9da5e9d3e1a914))
