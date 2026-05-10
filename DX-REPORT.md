# DX Report: Jupiter Developer Platform
**Project:** BlockID (app.blockidscore.fun)
**Track:** Consumer Apps — Colosseum Frontier Hackathon 2026
**Developer:** Solo founder, self-taught, building on Solana
**Date:** May 2026

---

## What I Built

BlockID is a Web3 identity and trust scoring platform on Solana. The core UX challenge: most users don't know how to interact with blockchain — they just want to send tokens, check prices, and swap, without copying wallet addresses or hunting for DEX UIs.

Jupiter powers two major features inside BlockID:

**1. @sage Smart Router**
@sage is a natural language AI agent. Users type things like:
> *"swap $50 USDC to JUP"*
> *"send 0.5 SOL to @bee17"*

@sage parses the intent, resolves token mint addresses, builds a swap quote via `/swap/v2/order`, and executes via `/execute` — all in one conversational flow. Referral account `8SVPrMMD5kL7yxtE8Rk8h5DTK4AvWD5QSGNQnEH4fFaY` is embedded with 95 bps fee.

**2. Cashtag System in Social Feed**
Users can write `$SOL`, `$JUP`, `$BONK` in posts. These render as interactive pills showing live price from Jupiter Price API, with a tap-to-swap bottom sheet powered by Smart Router.

---

## Endpoints Used

| Endpoint | Use Case |
|---|---|
| `GET /swap/v2/order` | Get assembled swap transaction via @sage |
| `POST /swap/v2/execute` | Execute swap with managed landing |
| `GET /tokens/v2/tag?query=verified` | Resolve `$TICKER` to mint address |
| `GET /tokens/v2/search?query={ticker}` | Cashtag autocomplete dropdown |
| `GET /price/v2?ids={mint}` | Live price display in cashtag pills |

---

## What Worked Well

**Swap V2 is genuinely unified.** The `/order` + `/execute` split is clean. I don't have to think about which router to use — Metis, JupiterZ, OKX — they all compete behind the scenes. The best price just comes back. For a solo builder, this is massive. I'd rather have one endpoint that's smart than five endpoints I have to orchestrate myself.

**Token API coverage is excellent.** The verified token list covers everything a Solana user would realistically want to swap. Searching by ticker just works. For a consumer app like BlockID, this is the foundation — users think in tickers (`$SOL`, `$USDC`), not mint addresses.

**Price API is fast and reliable.** It held up well during high-traffic moments in the hackathon. I use it for real-time cashtag price display in the social feed — it refreshes on hover without noticeable latency.

**Portal migration completed smoothly.** The new Jupiter Developer Platform (dev.jup.ag) is a significant improvement over the old portal.jup.ag. API key management is cleaner, documentation is better organized, and the dashboard gives a clear view of which APIs are enabled.

---

## Pain Points

**1. Tokens API V2 has undocumented CORS restrictions**
This was the first wall I hit. Calling `/tokens/v2/tag` and `/tokens/v2/search` directly from the React frontend throws CORS errors — no `Access-Control-Allow-Origin` header in the response. There's no mention of this anywhere in the Tokens API docs.

I had to build a proxy layer on my FastAPI backend: two new endpoints that fetch from Jupiter server-side and return results to the frontend. The fix was straightforward once I understood the problem — but diagnosing it took 2-3 hours because the browser error just says "CORS blocked," not "this API requires a server-side proxy."

A single line in the Tokens API docs page ("these endpoints cannot be called directly from browser clients, proxy via your backend") would eliminate this for every consumer dApp developer who comes after me.

**2. Portal transition period caused confusion**
When I first tried to generate an API key (early April 2026), portal.jup.ag returned an internal server error consistently. I didn't know the platform was being migrated to dev.jup.ag. There was no redirect, no banner, no status page update that explained this clearly.

I paused Jupiter integration for about 2 weeks thinking it was a temporary bug. A migration notice on the old portal or a status page update would have prevented this delay.

**3. Documentation gap: Swap V2 vs Ultra vs Metis**
When I started, there were three swap APIs: Ultra, Metis, and the new Swap V2. The docs had yellow warning banners but no clear migration guide for new integrators. The question "which one should I use?" wasn't answered directly — I had to piece it together from multiple pages.

The answer (Swap V2, start with `/order`) is simple. It just wasn't stated simply in one place.

**4. No devnet support for Swap V2**
BlockID runs on devnet during development. Jupiter Swap V2 only works on mainnet, so I couldn't end-to-end test the swap flow without switching environments. This forced me to do my final swap testing directly on mainnet with real tokens, which adds risk for a solo developer without a staging environment.

A devnet mode — even with simulated quotes and no real execution — would significantly improve the local development experience.

---

---

## Jupiter AI Stack

Honest answer: I didn't use it.

My build workflow was Cursor (AI code editor) + Claude claude.ai for architecture decisions, with the actual Jupiter integration done by reading docs manually and testing against the API directly. By the time I discovered the AI stack existed, the integration was already live.

That said, I did try to use it retroactively after submission, and here's what I found:

**Agent Skills:** The concept is right. A structured context file that tells Cursor exactly how Jupiter's APIs work, what errors to expect, and how to handle edge cases — that's exactly what I needed during the CORS debugging session. I spent 2-3 hours figuring out that Token API requires a backend proxy. An Agent Skill that says "DO NOT call these endpoints from browser clients, proxy via your backend" would have saved that time immediately.

**Docs MCP:** Didn't find out this existed until reading the bounty brief. Not discoverable from the main developers.jup.ag landing page. It's listed under "Jupiter AI Stack" but there's no prominent entry point from the getting-started flow. If this existed and was surfaced during onboarding, I would have used it.

**Jupiter CLI:** Not relevant for my use case — I'm building a consumer dApp, not an agent pipeline. But I can see the value for bot builders.

**llms.txt:** Good idea in principle, but I didn't know it existed. Again, discoverability is the issue.

The AI stack feels like it was built for developers who already know Jupiter well and want to go faster. What would actually help solo builders new to Jupiter is having the AI stack be the *default* onboarding path, not a section you find after reading the bounty brief.

---

## How I Would Rebuild developers.jup.ag

The current platform gives you everything. The problem is it gives you everything at once.

When I landed on developers.jup.ag for the first time, the question in my head was: "I'm building a consumer app on Solana that needs swaps. Where do I start?" That question is not answered clearly on the landing page. I had to read across multiple sections to piece together: use Swap V2, start with `/order`, proxy the token endpoints, get an API key first.

Here's how I'd rebuild the onboarding:

**1. Intent-based entry points.** Instead of listing all APIs upfront, ask what the developer is building. "Swap integration," "price display," "limit orders," "DCA," "perps." Route them to a tailored getting-started guide. A consumer dApp builder and an arbitrage bot builder need completely different first steps.

**2. Make the first API call happen on the landing page.** The fastest way to trust an API is to call it yourself. Put a live code snippet on the landing page — paste your key, run it, see a swap quote in 30 seconds. No docs reading required. This is the moment developers decide whether to continue.

**3. Surface the AI Stack during onboarding, not after.** Right now the AI Stack is a section in the docs. It should be step 2 of the getting-started flow: "Using Cursor or Claude Code? Install this Agent Skill and it will handle the rest." Make it opt-out, not opt-in.

**4. Add a CORS warning to the Tokens API page.** This is the endpoint consumer dApp developers will try to call from the browser first. A red warning box at the top: "This endpoint cannot be called from browser clients due to CORS restrictions. See the proxy pattern guide." Link to a copy-paste FastAPI/Express proxy snippet. This is a first-day wall for every frontend developer building on Solana.

**5. Consolidate the swap API decision into one page.** Right now there are pages for Ultra (deprecated), Metis, and Swap V2, plus migration guides. A new developer doesn't know which to read. One page titled "Which swap API should I use?" with a two-sentence answer and a link to Swap V2 would eliminate this confusion entirely.

---

## What I Wish Existed

**1. Devnet support for Swap V2.** This is the biggest missing piece for consumer dApp builders. I had to test my full swap flow on mainnet with real tokens because Swap V2 doesn't work on devnet. A simulation mode — even returning mocked quote data with realistic structure — would let developers validate their entire UX without mainnet risk.

**2. A server-side proxy template in the docs.** Official copy-paste proxy snippets for FastAPI, Express, and Next.js API routes that handle CORS for Token and Price endpoints. Would have saved me 2-3 hours and is a 30-minute addition to the docs.

**3. Sandbox/testnet environment for Trigger and Lend.** If I want to add limit orders or lending to BlockID, I have no safe way to test the full flow end-to-end. A devnet-equivalent for these APIs would meaningfully lower the barrier to integrating them.

**4. Webhook support for swap status.** Right now I have to poll or rely on the user's wallet to confirm execution. A webhook that fires when an `/execute` transaction lands onchain would make it much easier to build reliable UX around swap confirmation.

**5. An official JS/TS SDK.** REST works, but a typed SDK with built-in error handling, retry logic, and CORS handling would significantly reduce integration time for frontend-heavy consumer apps. The AI Agent Skills are a good start, but a proper SDK is a different category of DX improvement.

---

## Overall

Jupiter is the right choice for any Solana consumer app that touches swaps or token data. The APIs are powerful, the data quality is high, and Swap V2's unified routing genuinely delivers better prices without extra complexity.

The integration friction I hit — CORS, portal transition, API selection — is fixable with documentation improvements, not architectural changes. The core product is solid.

The AI stack has the right idea but needs to be part of the default onboarding path, not a feature developers discover from a bounty brief.

**Would I use Jupiter again?** Already planning to keep it as the default swap layer for BlockID post-hackathon.

---

*BlockID — The Human Interface for Blockchain*
