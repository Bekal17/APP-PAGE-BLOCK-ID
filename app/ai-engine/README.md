# AI Trust Scoring Engine

Web3-ready trust scoring API (FastAPI). Fetches Solana on-chain data, analyzes wallet activity, and returns explainable trust scores. Lives inside `app/ai-engine/`.

## Run

From this folder:

```sh
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

From the `app/` folder:

```sh
npm run dev:api
```

- API: http://localhost:8000  
- Docs: http://localhost:8000/docs  

## Endpoints

- `POST /trust-score` – Body: `{ "wallet": "<Solana address>" }`. Fetches recent txs via Solana RPC, analyzes metrics, computes score, saves to DB, returns trust_score, risk_level, and metrics (tx_count, wallet_age_months, activity_score, risk_flags).
- `GET /health` – Health check.

## Config

- **SOLANA_RPC_URL** (optional) – Solana RPC endpoint. Default: `https://api.mainnet-beta.solana.com`.
