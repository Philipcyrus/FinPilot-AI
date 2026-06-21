# Contributing to FinPilot AI

Thanks for your interest in improving FinPilot AI! 🎉

## Getting set up

```bash
npm install
npm run db:seed
npm run dev
```

## Before you open a PR

Please make sure all checks pass:

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
npm run build       # production build
```

## Project conventions

- **Engines are deterministic and pure** (`src/lib/engines`). Keep them free of I/O and React — they take a `FinancialPicture` (or sub-data) and return analysis with **evidence + a confidence/score**. Add unit-friendly functions, not side effects.
- **The AI layer narrates, it doesn't compute** (`src/lib/ai`). Numbers come from engines; the LLM explains them. Always provide a **deterministic fallback** so features work with no API key.
- **Providers fail gracefully** (`src/lib/providers`). Every live fetch must fall back to cached/seeded data and surface its `source` (`live` / `cached` / `demo`).
- **No financial advice.** Keep prompts and copy in the *analyze / explain / simulate / educate / recommend* space. Never place orders or guarantee returns.
- **UI is insight-first.** Lead with meaning and a recommended action; attach evidence and confidence.
- Match the surrounding code style (TypeScript strict, Tailwind tokens via CSS variables, Radix primitives).

## Commit & branches

- Branch off `main`, use clear conventional-style messages (e.g. `feat: add fund ranking`, `fix: xirr edge case`).
- Keep PRs focused; describe the *why*, not just the *what*.

## Reporting issues

Open a GitHub issue with steps to reproduce, expected vs actual behavior, and your environment. For data-source flakiness, note whether the badge showed `live`, `cached` or `demo`.
