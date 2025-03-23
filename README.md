# 🐵 ApeTweet – Autonomous Tweet-to-Trade Agent on Base

Welcome to **ApeTweet**, your on-chain AI agent that lets you *ape into crypto tokens just by tagging a tweet*. Powered by [Privy](https://www.privy.io/) for seamless wallet management, ApeTweet turns social sentiment into trading action – instantly.

## 🧠 What Is ApeTweet?

ApeTweet is a crypto AI agent that enables users to **trigger onchain swaps by tagging @UseApeTweet in any tweet related to a Base token**. The ElizaOS agent reads the tweet, extracts token info, and executes a swap via your embedded **Privy wallet** using the Uniswap V3 SDK.

### ⚡️ TL;DR

- 🚀 Tag `@UseApeTweet` on a tweet about a crypto project
- 🧠 The agent parses the tweet, extracts token data
- 🔑 Uses **Privy-hosted wallets** (no MetaMask or seed phrase)
- 💸 Executes a real-time swap using the Uniswap V3 SDK on **Base**
- ✅ Returns the transaction hash as onchain proof

---

## 🗂️ Project Structure

```
ape-tweet-monorepo/
├── ape-tweet-frontend/     # React + Next.js testing UI
├── ape-tweet-agent/        # ElizaOS Agent (AI brain)
```

---

## 🧩 Tech Stack Overview

| Layer              | Stack                            |
|-------------------|----------------------------------|
| Wallets           | **Privy Hosted Wallets** 🔥       |
| Agent / AI        | ElizaOS + OpenAI (fallback)      |
| Blockchain SDK    | Viem                             |
| Swap Engine       | Uniswap V3 SDK            |
| Frontend          | React + Tailwind (Next.js)       |
| Smart Contracts   | Uniswap V3 (Base network)        |
| DB (for UI/debug) | PostgreSQL + DrizzleORM          |

---

## 🛠 Frontend App – `ape-tweet-frontend`

A minimal UI for simulating tweet parsing, wallet integration, and swap confirmation.

### 🧪 Features

- ✅ Tweet simulator for test triggers
- 🔐 Wallet login with **Privy**
- 🔄 Execute swaps via 1inch
- 📜 Show tx hash or error message
- 🗃 Transaction history (optional)

### 🧑‍💻 Tech Stack

- **Framework**: Next.js 14
- **Wallet Auth**: Privy
- **Blockchain SDK**: Viem
- **Swap Infra**: 1inch
- **Styling**: Tailwind CSS
- **ORM**: DrizzleORM + PostgreSQL

---

### 🔐 Privy Wallet Integration (Key Bounty Focus)

ApeTweet uses **Privy-hosted embedded wallets**, allowing users to swap tokens *without needing MetaMask or seed phrases*.

- Users log in with email or social auth
- Privy creates and manages a secure embedded wallet
- Transactions are signed programmatically on behalf of the user (with consent)
- Seamless onboarding and abstracted key management

This makes onchain trading from Twitter as easy as tagging a bot.

---

### 🔁 Swap Execution Flow

1. **User tags `@UseApeTweet`** on a tweet (e.g. "Just launched $BANANA on Base!")
2. **ElizaOS agent** parses the tweet, identifies token and chain
3. **Privy wallet** is retrieved for the user
4. **Swap transaction** is generated via 1inch SDK
5. **Viem client** sends the transaction to Base
6. **User receives transaction hash** back in the tweet thread or UI

---

### 🔗 Smart Contract Integration (Base)

- **SwapRouter02**: `0x2626664c2603336E57B271c5C0b26F421741e481`
- **WETH (Base)**: `0x4200000000000000000000000000000000000006`

---

## 🧠 AI Agent (WIP)

The `ape-tweet-agent` package includes ElizaOS:

- Parses tweet content for symbols, tokens, chains
- Handles fallback logic via OpenAI if parsing fails
- Can be extended to support more actions or chains

This section is still a work in progress. For now, the agentic interactions have been implemented in the app's backend.

---

## 🤝 Contributing

1. Fork this repo
2. Create a branch: `git checkout -b feature/amazing`
3. Commit changes: `git commit -m "Add feature"`
4. Push: `git push origin feature/amazing`
5. Open a PR
