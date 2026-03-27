# 🚀 Solana Simple Market Maker (Ping-Pong Bot)

A lightweight, high-performance Solana Market Maker (MM) bot that interacts directly with the **Raydium V1/V3 API**. This project was created because many developers (including us) found that existing SDKs often struggle with **Token-2022** compatibility or are overly complex for simple liquidity needs.

## ✨ Features
- **Ping-Pong Strategy**: Automatic "Buy the Dip" and "Sell the Rip" logic based on a configurable price threshold.
- **Direct API Interaction**: Calls Raydium's Transaction-V1/V3 API directly for better reliability with modern token standards.
- **Token-2022 Ready**: Specifically built to handle the nuances of Token-2022 mints, Associated Token Accounts (ATAs), and Program IDs.
- **Designed for New Tokens**: Ideal for new coins with low liquidity that may not yet be tradable on aggregators like Jupiter.
- **Automatic ATA Creation**: Automatically creates necessary token accounts if they don't exist.

## 🛠 Prerequisites
- **Node.js** (v18+)
- **A Solana Wallet** (with some SOL for gas and trading)
- **A Solana RPC Endpoint** (Helius, Alchemy, QuickNode, etc.)

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/solana-mm-bot.git
   cd solana-mm-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure your environment**
   Create a `.env` file in the root directory:
   ```env
   MNEMONIC="your twelve word seed phrase goes here..."
   HELIUS_RPC="https://mainnet.helius-rpc.com/?api-key=your-key"
   ```

4. **Customize the strategy**
   Open `src/config.ts` and adjust your settings:
   ```typescript
   TOKEN_MINT: 'your_token_mint_address_here',
   TRADE_AMOUNT_SOL: new Decimal(0.01), // Size per trade
   PRICE_CHANGE_THRESHOLD: 0.0015,      // 0.15% move triggers trade
   ```

### Option A: Run with Node.js
```bash
npm start
```

### Option B: Run with Docker (Recommended for 24/7)
```bash
docker build -t solana-mm-bot .
docker run -d --name solana-mm-bot --restart always solana-mm-bot
```

## ⚖️ How the Strategy Works (Ping-Pong)
This bot uses a **Price-Sensitive Baseline**:
1. It gets an initial quote to establish the **"Target Price"**.
2. **BUY**: If 1 SOL buys **0.15% MORE** tokens than before (price dropped), it buys tokens.
3. **SELL**: If 1 SOL buys **0.15% LESS** tokens than before (price rose), it sells tokens back for SOL.
4. **UPDATE**: Every time a trade succeeds, the **Target Price** is updated to the current market rate.

## ⚠️ Compliance & Disclaimer
**Ethical Use Only**: This bot is intended for providing organic liquidity and maintaining a healthy spread for new tokens. It is **NOT** intended for, and should not be used for, illegal activities such as wash trading, "pump and dump" schemes, or artificial volume manipulation. Users are responsible for ensuring their activities comply with all applicable local and international financial regulations.

**Risk Warning**: Trading on Solana involves significant risk. This is an open-source template provided for educational purposes. We are not responsible for any financial losses or regulatory issues incurred. Always test with small amounts first!

## 📜 License
GPLv3
