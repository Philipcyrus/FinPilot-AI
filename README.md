<div align="center">

# 🧭 FinPilot AI — Your Wealth Operating System

**An AI-powered financial intelligence platform that thinks like an analyst, not a spreadsheet.**

Personal CFO · Portfolio Analyst · Equity & Mutual-Fund Researcher · Risk Analyst · Behavioral Coach — all in one app.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2d3748?logo=prisma&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

</div>

---

## 📖 Introduction

Most personal-finance apps **display** information — balances, charts, a number that went up or down. **FinPilot AI explains it.** For every figure it answers four questions:

> **What happened · Why it happened · What may happen next · What you should consider doing**

FinPilot builds a **Financial Digital Twin** of you — modelling your cashflow, spending, savings, investments, risk profile, goals and behavioral patterns — and gets more personalized as more data arrives. Every conclusion ships with **supporting evidence and a confidence score**, because financial decisions deserve transparency.

It is broker-agnostic (Groww, Zerodha, AngelOne, Upstox, or manual/CSV), works with **partial data**, and stays strictly on the right side of compliance: it **analyzes, explains, simulates, educates and recommends** — it never executes trades, places orders, or guarantees returns.

> ⚠️ **Educational financial intelligence only.** FinPilot AI is **not** investment advice and **not** a registered investment adviser.

---

## ✨ Why FinPilot — Key Advantages

| | Advantage | What it means for you |
|---|---|---|
| 🧠 | **Insight-first, not dashboard-first** | Every screen leads with *what it means* and *what to do*, not just raw numbers. |
| 🔍 | **Evidence + confidence on everything** | No black-box verdicts. Open any insight to see the data and a confidence score behind it. |
| 🤖 | **Multi-agent AI research** | A team of specialist AI analysts (Business, Financial, Valuation, Risk, Bull/Bear/Base…) builds institutional-style reports on any stock or fund. |
| 🆓 | **Runs free, runs offline** | Works with **zero API keys** via a deterministic financial engine; plug in any **free** LLM (OpenRouter/Gemini/Groq/Ollama) to upgrade to conversational AI. |
| 📡 | **Live data, graceful fallback** | Pulls live NAVs, quotes and news from free sources — and never breaks when offline, falling back to cached/seeded data. |
| 🧮 | **Real financial math** | Genuine XIRR, CAGR, HHI concentration, volatility, max-drawdown, beta, Monte-Carlo goal projections — not hand-wavy estimates. |
| 🔐 | **Privacy-respecting & local-first** | Your data lives in a local SQLite database. No account, no cloud lock-in. |
| 🎨 | **Production-grade UI** | Clean, fast, responsive, dark/light, accessible — built with Tailwind v4 + Radix. |

---

## 🚀 Feature Tour

### Personal Finance Intelligence
- **Financial Health Score (0–100)** — a single headline number from savings quality, emergency-fund strength, spending discipline, goal progress, diversification, risk and liquidity — each sub-score explained.
- **Spending Intelligence** — automatic categorization, monthly trends, **lifestyle-inflation** detection, **anomaly/spike** alerts, and next-month forecasts.
- **Savings Intelligence** — savings rate, **emergency-fund** coverage, consistency and sustainability assessment.

### Portfolio Intelligence
- Value, invested, P/L, **XIRR** (money-weighted) and **CAGR**.
- **Portfolio Health Score** with diversification (HHI), concentration, sector & asset-class balance.
- **Risk Intelligence** — annualized volatility, **max drawdown**, **beta vs Nifty**, stability score and vulnerabilities.
- **Benchmark Intelligence** — alpha and relative return/risk vs Nifty 50, Sensex and Midcap.

### Universal Research Engine
- Ask about **any** stock, ETF, index or mutual fund — or **compare** them (e.g. *“TCS vs Infosys”*).
- Four depth modes: **Quick → Standard → Deep → Institutional**.
- A **multi-agent analyst team** produces an Executive Summary, Investment Thesis, full section-by-section analysis, **Bull/Bear/Base** cases, a live **agent trace**, and a **confidence breakdown**.

### Funds, SIP, Goals & Scenarios
- **Mutual-Fund Intelligence** with **overlap detection** & hidden-concentration analysis.
- **SIP Intelligence** — adequacy (*“am I investing enough?”*), style mix, goal alignment, overlap.
- **Goal Intelligence** — progress, required monthly SIP, and **Monte-Carlo success probability**.
- **Scenario Simulator** — stress-test market crashes, sector shocks, rate hikes, inflation, job loss and big purchases → see portfolio, cashflow & goal impact.

### News & AI Co-pilot
- **News Intelligence** — live headlines auto-classified by likely impact (positive / neutral / negative).
- **AI Co-pilot** — a Personal-CFO chat grounded in your live financial data, with memory that adapts over time.

---

## 🏗️ Architecture

```
Next.js 16 App Router (RSC + route handlers)
 ├─ Engines   (src/lib/engines)    Deterministic financial math — always available
 ├─ AI        (src/lib/ai)         Provider-agnostic free-LLM client + multi-agent research/chat
 ├─ Providers (src/lib/providers)  Live free data (mfapi.in, Yahoo Finance, Google News) + fallback
 └─ Data      (prisma + SQLite)    Digital twin, market caches & AI memory
```

**Design principle:** the deterministic **engines are the source of truth and always work**. The **AI layer narrates and synthesizes** on top of engine outputs and live evidence. With no LLM key and no network, the entire app still functions (deterministic narratives + seeded/cached data).

---

## ⚡ Quick Start

```bash
# 1. Install
npm install

# 2. Create the local SQLite DB + a realistic demo user
npm run db:seed

# 3. Run
npm run dev      # → http://localhost:3000
```

The app runs **fully on the seeded demo — no keys required.**

### Optional · Enable conversational AI (free)
Copy `.env.example` → `.env.local` and add **any one** free key, then restart:

| Provider | Free option | Get a key |
|---|---|---|
| **OpenRouter** | Free Llama / Gemini models | <https://openrouter.ai/keys> |
| **Google Gemini** | Generous free tier | <https://aistudio.google.com/app/apikey> |
| **Groq** | Fast free inference | <https://console.groq.com/keys> |
| **Ollama** | 100% local & offline | run `ollama serve` |

The active provider is auto-detected and shown in **Settings**. Without a key, research & chat use the built-in deterministic engine.

### Optional · Live market data
No keys needed — mutual-fund NAVs (mfapi.in), equity/index quotes (Yahoo Finance) and news (Google News RSS) are fetched live, with automatic fallback to cached/seeded data when offline or rate-limited.

---

## 🛠️ Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` / `npm start` | Production build & serve |
| `npm run db:seed` | Push schema + seed the demo user |
| `npm run db:reset` | Wipe & reseed the database |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm run lint` | ESLint |

---

## 🧱 Tech Stack

**Next.js 16** (App Router, Turbopack, React 19) · **TypeScript** · **Tailwind CSS v4** · **Prisma + SQLite** · **Recharts** · **Radix UI** · **TanStack Query** · **Zod**.

---

## 🗺️ Roadmap

- [ ] Live broker sync via Groww MCP (read-only)
- [ ] Streaming research reports (token-by-token)
- [ ] Multi-user auth & cloud sync
- [ ] PDF / institutional report export
- [ ] Earnings-call and filings ingestion
- [ ] Configurable goals & risk-profile onboarding wizard

---

## 🔒 Compliance & Privacy

FinPilot is a **financial intelligence and research** tool. It does **not** execute trades, place orders, guarantee returns, or act as a registered investment adviser. Every recommendation carries evidence, confidence and alternatives. Your data stays in a **local SQLite database** — there is no account or mandatory cloud service.

---

## 📄 License

Released under the [MIT License](LICENSE).

<div align="center">
<sub>Built to make people understand their entire financial life in minutes — explained, not just displayed.</sub>
</div>
