# 🚀 Solana Simple Market Maker (Ping-Pong Bot)

A lightweight, high-performance Solana Market Maker (MM) bot with an integrated web dashboard. This project interacts directly with the **Raydium V1/V3 API** and was created because many developers (including us) found that existing SDKs often struggle with **Token-2022** compatibility or are overly complex for simple liquidity needs.

## ✨ Features
- **Ping-Pong Strategy**: Automatic "Buy the Dip" and "Sell the Rip" logic based on a configurable price threshold.
- **Web Dashboard**: Real-time monitoring and control via a Next.js frontend
- **REST API Backend**: Control the bot, view trades, and check configuration via Express API
- **Direct API Interaction**: Calls Raydium's Transaction-V1/V3 API directly for better reliability with modern token standards.
- **Token-2022 Ready**: Specifically built to handle the nuances of Token-2022 mints, Associated Token Accounts (ATAs), and Program IDs.
- **Designed for New Tokens**: Ideal for new coins with low liquidity that may not yet be tradable on aggregators like Jupiter.
- **Automatic ATA Creation**: Automatically creates necessary token accounts if they don't exist.
- **Flexible Deployment**: Run with Docker Compose (production) or Node.js (local development)

## 🛠 Prerequisites

### For Docker (Recommended for Production)
- **Docker & Docker Compose** 
- **A Solana Wallet** (with some SOL for gas and trading)
- **A Solana RPC Endpoint** (Helius, Alchemy, QuickNode, etc.)

### For Local Node.js Development
- **Node.js** (v18+)
- **A Solana Wallet** (with some SOL for gas and trading)
- **A Solana RPC Endpoint** (Helius, Alchemy, QuickNode, etc.)

## 🚀 Deployment Options

### Option A: Docker Compose (Recommended for Production)

**Best for:** Production deployments, consistent environments, 24/7 running

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/solana-mm-bot.git
   cd solana-mm-bot
   ```

2. **Create your environment file**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your Solana wallet details:
   ```env
   MNEMONIC="your twelve word seed phrase goes here..."
   HELIUS_RPC="https://mainnet.helius-rpc.com/?api-key=your-key"
   PORT=3001
   ```

3. **Start with Docker Compose**
   ```bash
   docker compose up -d
   ```
   This will start:
   - **Frontend Dashboard**: http://localhost:3000
   - **Backend API**: http://localhost:3001/api

4. **View logs**
   ```bash
   docker compose logs -f
   ```

### Option B: Local Node.js Development

**Best for:** Local testing, development, debugging, faster iteration

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/solana-mm-bot.git
   cd solana-mm-bot
   ```

2. **Setup with script**
   ```bash
   cp setup.sh.example setup.sh
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your Solana wallet details

4. **Start development servers**
   ```bash
   npm run dev
   ```
   This runs both backend and frontend concurrently:
   - **Frontend**: http://localhost:3000
   - **Backend**: http://localhost:3001/api

**When to use local development:**
- You're a contributor or developer
- You want faster feedback loops during development
- You want to debug TypeScript code directly
- You're testing new features locally before containerizing

## 🛠 Configuration

Edit `src/config.ts` to customize bot behavior:
```typescript
TOKEN_MINT: 'your_token_mint_address_here',
TRADE_AMOUNT_SOL: new Decimal(0.01), // Size per trade
PRICE_CHANGE_THRESHOLD: 0.0015,      // 0.15% move triggers trade
LOOP_DELAY_MS: 10000,                // Check interval (10 seconds)
SLIPPAGE_BPS: 1000,                  // Max slippage (10%)
```

## 📊 Dashboard Features

The web dashboard provides:
- **Live Status**: See if the bot is running
- **Trade History**: View all executed trades with timestamps
- **Start/Stop Controls**: Manage bot execution
- **Configuration Display**: View active strategy parameters
- **Auto-refresh**: 2-second polling for real-time updates

## ⚙️ Architecture

The bot consists of three main components:

```
┌─────────────────────────┐
│  Next.js Dashboard      │
│   (localhost:3000)      │
└────────────┬────────────┘
             │
        REST API
             │
┌────────────▼────────────┐
│  Express Backend        │
│   (localhost:3001)      │
└────────────┬────────────┘
             │
      Spawns Process
             │
┌────────────▼────────────┐
│  Market Maker Bot       │
│  (Trading Loop)         │
└─────────────────────────┘
```

## ⚖️ How the Strategy Works (Ping-Pong)

This bot uses a **Price-Sensitive Baseline**:
1. It gets an initial quote to establish the **"Target Price"**.
2. **BUY**: If 1 SOL buys **0.15% MORE** tokens than before (price dropped), it buys tokens.
3. **SELL**: If 1 SOL buys **0.15% LESS** tokens than before (price rose), it sells tokens back for SOL.
4. **UPDATE**: Every time a trade succeeds, the **Target Price** is updated to the current market rate.

## 🔌 API Endpoints

The backend exposes the following endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/status` | Get bot status and recent trades |
| POST | `/api/start` | Start the trading bot |
| POST | `/api/stop` | Stop the trading bot |
| GET | `/api/config` | Get current configuration |
| GET | `/api/trades?limit=20` | Get recent trades |

## 🚢 Deployment

### Docker Compose (Recommended)

The project includes optimized Dockerfiles for both backend and frontend:

```bash
# Build and start containers
docker compose up -d

# View logs
docker compose logs -f

# Stop containers
docker compose down
```

**Container Details:**
- **Backend** (`Dockerfile.backend`): Node.js + TypeScript compilation
- **Frontend** (`Dockerfile.frontend`): Next.js static build + Node.js server
- **Network**: Both containers communicate via internal Docker network

### Deployment Scripts

For deploying to EC2 or other remote servers, use the provided templates:

```bash
# 1. Copy the deployment script template
cp deploy.sh.example deploy.sh

# 2. Edit with your server details (host, user, SSH key path)
nano deploy.sh

# 3. Run deployment
./deploy.sh

# 4. To monitor logs, similarly setup logs script
cp logs-prod.sh.example logs-prod.sh
nano logs-prod.sh
./logs-prod.sh
```

**Note:** `deploy.sh`, `logs-prod.sh`, and `setup.sh` are in `.gitignore` to protect your personal deployment configuration and SSH keys. Only the `.example` templates are tracked in git.

## 🐛 Troubleshooting

### Dashboard not connecting to API?
- Check that backend is running: `curl http://localhost:3001/api/health`
- Verify `NEXT_PUBLIC_API_URL` environment variable in frontend
- Check Docker network connectivity: `docker network inspect mmnet`

### Bot not starting?
- Verify `.env` file has valid `MNEMONIC` and `HELIUS_RPC`
- Check bot logs: `docker compose logs backend`
- Ensure wallet has sufficient SOL for trading and gas fees

### Out of memory in Docker?
- Increase Docker memory limits in Docker Desktop settings
- Or add memory limits to `docker-compose.yml`:
  ```yaml
  services:
    backend:
      mem_limit: 2g
  ```

### "No space left on device" during Docker build?
- Docker build cache and unused images are consuming disk space
- Run the cleanup script:
  ```bash
  cp docker-prune.sh.example docker-prune.sh
  chmod +x docker-prune.sh
  ./docker-prune.sh
  ```
- Or manually clean:
  ```bash
  docker system prune -f --volumes  # Remove unused containers, images, volumes
  docker image prune -a -f          # Remove all unused images
  docker builder prune -f           # Remove build cache
  ```
- Check Docker disk usage:
  ```bash
  docker system df
  ```

## 📚 Project Structure

```
solana-mm-bot/
├── src/                          # Core bot logic
│   ├── config.ts                 # Strategy configuration
│   ├── index.ts                  # Standalone entry point
│   ├── strategies/pingPongMM.ts  # Trading logic
│   ├── api/raydiumClient.ts      # Raydium API client
│   └── utils/                    # Utilities (wallet, transactions)
│
├── backend/
│   └── server.ts                 # Express API server
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Dashboard component
│   └── package.json
│
├── docker-compose.yml            # Container orchestration
├── Dockerfile.backend            # Backend container
├── Dockerfile.frontend           # Frontend container
├── setup.sh                       # Local development setup
└── deploy.sh                      # Remote deployment script
```

## ⚠️ Compliance & Disclaimer
**Ethical Use Only**: This bot is intended for providing organic liquidity and maintaining a healthy spread for new tokens. It is **NOT** intended for, and should not be used for, illegal activities such as wash trading, "pump and dump" schemes, or artificial volume manipulation. Users are responsible for ensuring their activities comply with all applicable local and international financial regulations.

**Risk Warning**: Trading on Solana involves significant risk. This is an open-source template provided for educational purposes. We are not responsible for any financial losses or regulatory issues incurred. Always test with small amounts first!

## 📜 License
GPLv3
