# BlockID: The Human Interface for Blockchain

> On-chain identity, trust scoring, and social layer for the Solana ecosystem.

**Live App:** [app.blockidscore.fun](https://app.blockidscore.fun) · **Landing Page:** [blockidscore.fun](https://blockidscore.fun)

---

## What is BlockID?

BlockID is a consumer platform that makes Solana accessible to everyone, not just crypto natives.

Every Solana wallet gets a **Trust Score (0–100)** derived from real on-chain behavior, wallet age, transaction history, DeFi activity, CEX/DEX fingerprints, and ML classification trained on known scam wallets. Users claim **@handle NFT identities**, post on a **trust-gated social feed**, send crypto via **natural language commands**, and access **token-gated communities** automatically based on NFT holdings.

Built on Solana mainnet. Powered by Helius, Jupiter, Daemon Protocol, and Metaplex.

---

## Key Features

### 🔍 ML Trust Scoring
Every wallet scores 0–100 based on on-chain behavioral analysis. RandomForest model trained on 135 labeled wallets including known exploiters and scam addresses. Enriched by Daemon Protocol Cyclops risk intelligence.

### 🪪 @Handle NFT Identity
Claim a soul-bound @handle NFT tied permanently to your wallet. Supports SNS (.sol) and ANS (.abc) domain display. Handles are transferable NFTs tradeable on Magic Eden and Tensor.

### 📱 Trust-Gated Social Layer
Twitter-style social feed where every post is tied to an on-chain identity. Content moderation via 3-layer system (custom word list + better-profanity + OpenAI Moderation API). NFT profile pictures via Helius DAS API.

### 🤖 @sage — AI Smart Router
On-chain AI agent with its own Solana wallet and trust score 95. Type natural language commands in the social feed: `@sage send 0.5 SOL to @bee17`. @sage resolves handles, checks recipient trust scores, and generates transaction links for Phantom confirmation. Supports 7 languages.

### 🏘️ Token-Gated Communities
Communities auto-unlock based on NFT holdings detected via Helius DAS API. No manual joining, no approval process. Your wallet is your membership card.

### 🔭 Wallet Explorer
Scan any Solana wallet in real time. View trust score, risk level, behavioral fingerprint, and full transaction analysis before you transact.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Backend | FastAPI (Python) + PostgreSQL |
| ML Pipeline | scikit-learn (RandomForest) + Daemon Protocol |
| Blockchain | Solana Web3.js + Helius DAS API + Jupiter Swap V2 |
| NFT | Metaplex Core (soul-bound identity NFTs) |
| Storage | Cloudflare R2 |
| Deployment | Vercel (frontend) + Railway (backend) |
| AI | GPT-4o-mini (NLP parsing) + OpenAI Moderation API |

---

## Repository Structure

This is the **frontend repository** (React/TypeScript).

| Repo | Description |
|---|---|
| [APP-PAGE-BLOCK-ID](https://github.com/Bekal17/APP-PAGE-BLOCK-ID) | Frontend (this repo) |
| [BACKEND-BLOCK-ID](https://github.com/Bekal17/BACKEND-BLOCK-ID) | Backend FastAPI/Python |
| [LANDING-PAGE-BLOCK-ID](https://github.com/Bekal17/LANDING-PAGE-BLOCK-ID)) | [Landing Page] (https://www.blockidscore.fun/) |

BlockID development started on **February 13, 2026**. All hackathon-period work tracked via Git commits from April 6, 2026 onwards.

---

## Quick Start (Local Dev)

### Prerequisites
- Node.js 18+
- A Solana wallet (Phantom, Solflare, or Backpack)

### Frontend
```sh
git clone https://github.com/Bekal17/APP-PAGE-BLOCK-ID
cd APP-PAGE-BLOCK-ID
cp .env.example .env
npm install
npm run dev
```

### Environment Variables
```env
VITE_TRUST_API_URL=https://blockid-backend-production.up.railway.app
VITE_EXPLORER_API_URL=https://blockid-backend-production.up.railway.app
```

### Access
Connect any Solana wallet to access the full platform. No signup or credentials needed. Identity NFT is auto-minted on first login.

---

- Live on Solana mainnet at [app.blockidscore.fun](https://app.blockidscore.fun)
- Solo founder, self-taught, building from Jakarta, Indonesia
- Active in Superteam Indonesia ecosystem

---

## License

Proprietary © 2026 BlockID. All rights reserved.

---
