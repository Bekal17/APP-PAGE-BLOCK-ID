# BlockID — Wallet Trust Intelligence

> AI-powered on-chain identity and trust scoring for the Solana ecosystem.

**Live App:** [app.blockidscore.fun](https://app.blockidscore.fun) · **API Dashboard:** [api.blockidscore.fun](https://api.blockidscore.fun)

---

## What is BlockID?

BlockID is a trust intelligence platform that analyzes Solana wallets using on-chain data, behavioral signals, and AI clustering to produce a real-time **Trust Score** (0–100). It helps users, protocols, and businesses identify risky wallets, scam clusters, and suspicious activity before it's too late.

---

## Key Features

### 🔍 Wallet Trust Scoring
Every wallet gets a score from 0–100 based on transaction history, counterparty risk, cluster membership, and behavioral patterns. Scores are computed in real-time and stored in PostgreSQL for fast retrieval.

### 🕸️ AI Investigation Graph
Visualize wallet relationships as an interactive network graph. Trace money flows, identify scam clusters, and follow connections across the Solana network — similar to Arkham Intelligence but purpose-built for trust analysis.

### 📊 Real-time Analytics
Track wallet activity over time with timeline events, counterparty analysis, token flow heatmaps, and behavioral fingerprinting. All data updates automatically as new on-chain activity is detected.

### 🔌 B2B API
Integrate BlockID trust scoring directly into your product via REST API. Built for exchanges, DeFi protocols, wallets, and compliance teams.

```
GET  /v1/score/{wallet}         → Single wallet score
POST /v1/score/batch            → Up to 50 wallets at once
```

API keys are managed via the [API Dashboard](https://api.blockidscore.fun) with usage tracking and quota management.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| Backend | FastAPI (Python) + asyncpg |
| Database | PostgreSQL (Railway) |
| Auth | Supabase (Google OAuth) |
| Blockchain | Solana Web3.js + Helius RPC |
| Deployment | Vercel (frontend) + Railway (backend) |

---

## Architecture

```
app.blockidscore.fun          api.blockidscore.fun
  (Consumer App)                (B2B API Dashboard)
        │                               │
        └──────────┬────────────────────┘
                   │
     Railway FastAPI Backend
                   │
          PostgreSQL Database
                   │
         Solana RPC (Helius)
```

---

## Quick Start (Local Dev)

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL

### Frontend
```sh
git clone https://github.com/Bekal17/APP-PAGE-BLOCK-ID
cd APP-PAGE-BLOCK-ID/app
cp .env.example .env   # fill in your values
npm install
npm run dev
```

### Environment Variables
```env
VITE_TRUST_API_URL=https://blockid-backend-production.up.railway.app
VITE_EXPLORER_API_URL=https://blockid-backend-production.up.railway.app
```

### Backend
```sh
git clone https://github.com/Bekal17/BACKEND-BLOCK-ID
cd BACKEND-BLOCK-ID
pip install -r requirements.txt
uvicorn backend_blockid.api_server.server:app --host 0.0.0.0 --port 8001 --reload
```

---

## B2B API Plans

| Plan | Price | Requests/month |
|---|---|---|
| Free | $0 | 100 |
| Pro | $29/mo | 50,000 |
| Enterprise | $199/mo | Unlimited |

Get your API key at [api.blockidscore.fun](https://api.blockidscore.fun).

---

## Roadmap

- [ ] Webhook notifications for risk events
- [ ] Paddle billing integration
- [ ] Multi-chain support (Ethereum, Base)
- [ ] SDK (TypeScript + Python)
- [ ] On-chain trust score oracle (Solana program)

---

## License

Proprietary — © 2026 BlockID. All rights reserved.
