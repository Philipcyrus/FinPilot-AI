# Changelog

All notable changes to **FinPilot AI** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Planned
- Live broker sync via Groww MCP (read-only).
- Streaming (token-by-token) research reports.
- Multi-user auth and cloud sync.
- PDF / institutional report export.
- Earnings-call and filings ingestion.

## [1.0.0] — 2026-06-21
First complete, runnable release of the FinPilot AI platform.

### Added
- **Financial Digital Twin** data model (Prisma + SQLite) with a realistic seeded demo user.
- **Deterministic financial engines** (`src/lib/engines`): portfolio (XIRR, CAGR, allocation),
  risk (volatility, max drawdown, beta, stability), portfolio health (HHI concentration),
  spending (auto-categorization, lifestyle-inflation & anomaly detection, forecasts),
  savings, mutual-fund overlap, SIP, benchmark/alpha, goals (Monte-Carlo success probability),
  behavioral analysis and a recommendation engine.
- **Financial Health Score** (0–100) with explained sub-scores and evidence.
- **Universal Research Engine** with a multi-agent analyst team, four depth modes
  (Quick / Standard / Deep / Institutional), compare mode, agent trace and confidence breakdown.
- **Provider-agnostic free-LLM client** (`src/lib/ai`) supporting OpenRouter, Google Gemini,
  Groq and Ollama, with a deterministic fallback so the app works with **no API key**.
- **Live free data providers** (`src/lib/providers`): mutual-fund NAV (mfapi.in),
  equity/index quotes (Yahoo Finance) and news (Google News RSS), each with graceful fallback.
- **AI Co-pilot** chat grounded in live financial data, with memory.
- **Full UI**: Overview, Portfolio, Spending, Savings, Goals, Recommendations, Research,
  Funds, SIP, Scenarios, News, Chat, Import and Settings — dark/light, responsive,
  insight-first design system (Tailwind v4 + Radix + Recharts).
- **CSV import** with automatic transaction categorization.
- **Scenario simulator** for market crashes, rate hikes, income shocks and major purchases.
- Compliance guardrails, evidence + confidence on every conclusion, and a persistent disclaimer.

### Technical
- Built on Next.js 16 (App Router, Turbopack, React 19) and TypeScript (strict).
- Pinned Prisma to v6 (v7 removed the `url` field from `schema.prisma`).
- Clean production build, type-check and lint.

[Unreleased]: https://github.com/Philipcyrus/FinPilot-AI/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Philipcyrus/FinPilot-AI/releases/tag/v1.0.0
