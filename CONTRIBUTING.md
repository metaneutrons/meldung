# Contributing

Thanks for taking the time. This is a small project, so the process is short.

## Getting started

```bash
pnpm install
pnpm dev
```

Node 24 or newer and pnpm are required; the pnpm version is pinned in
`package.json` under `packageManager`. Copy `.env.example` to `.env.local` for local
secrets; `meldung.config.yaml` holds everything that is not a secret.

## Before you push

```bash
pnpm lint
pnpm typecheck
pnpm test --coverage
pnpm build
```

CI runs these plus a container build and a commit-hygiene check. The git
hooks, managed by lefthook, run a subset on commit and push.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/) are binding, for
every commit and for the pull request title. release-please derives the version
and the changelog from them, so a commit outside the scheme produces a wrong
version or a missing changelog entry. The pull request title matters because a
squash merge turns it into the subject line on `main`.

```
feat(i18n): add Ukrainian locale
fix(pdf): keep the reference number on the first page
chore(deps): bump next to 16.2.9
```

A `feat:` bumps the minor version, a `fix:` the patch version, and
`BREAKING CHANGE:` in the body bumps the major.

## Pull requests

- one topic per pull request
- describe what you changed and how you convinced yourself it works
- CI must be green before review

## Translations

Every locale needs five files: `src/i18n/messages/<locale>.json`,
`taxonomy.<locale>.json`, `report.<locale>.json` plus `content/welcome.<locale>.md`
and `content/footer.<locale>.md`. Add the code to `src/i18n/routing.ts` and to
the map in `src/lib/taxonomy/i18n.test.ts`; that test fails when a taxonomy entry
or an affected-system label is missing, which is the point.

## Licence

Contributions are licensed under AGPL-3.0-or-later, like the project.
