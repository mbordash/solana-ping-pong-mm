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
   Edit `.env` with your configuration:
   ```env
   # Your Solana wallet mnemonic (KEEP THIS SECRET!)
   MNEMONIC="your twelve word seed phrase goes here..."
   HELIUS_RPC="https://mainnet.helius-rpc.com/?api-key=your-key"
   
   # Backend configuration
   PORT=3001
   BASIC_AUTH_USER=admin
   BASIC_AUTH_PASS=your-secure-dashboard-password
   
   # CORS - set to your frontend URL
   ALLOWED_ORIGINS=http://localhost:3000
   
   # Frontend configuration
   FRONTEND_API_URL=http://localhost:3001/api
   FRONTEND_API_PASSWORD=your-secure-dashboard-password
   ```

3. **Create docker-compose.yml**
   ```bash
   cp docker-compose.yml.example docker-compose.yml
   ```
   The file will automatically use values from `.env`

4. **Start with Docker Compose**
   ```bash
   docker compose up -d
   ```
   This will start:
   - **Frontend Dashboard**: http://localhost:3000 (requires password login)
   - **Backend API**: http://localhost:3001/api (requires Basic Auth)

5. **View logs**
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

## 🛡️ Security

### Environment Variable Protection
- **`.env` file is NOT tracked in git** - This protects your mnemonic, API keys, and passwords
- **Only `.env.example` is in git** - It serves as a template for setting up new deployments
- Use `.gitignore` entries to ensure sensitive files aren't accidentally committed

### Dashboard Authentication
- **Frontend**: Simple password prompt (shows on page load if `NEXT_PUBLIC_API_PASSWORD` is set)
- **Backend API**: All endpoints require HTTP Basic Authentication with `Authorization: Basic <credentials>`
  - Username: Configured in `.env` (default: `admin`)
  - Password: Configured in `.env` (default: from `BASIC_AUTH_PASS`)
- **Health check endpoint** (`/api/health`) is the only public endpoint

### CORS (Cross-Origin Resource Sharing)
- Backend only allows requests from frontend URL specified in `ALLOWED_ORIGINS` environment variable
- If you see CORS errors in browser console:
  1. Check what URL your frontend is running on (e.g., `http://52.211.208.155:3000`)
  2. Update `ALLOWED_ORIGINS` in `.env` to match
  3. Restart backend: `docker compose restart backend`

### For Production Deployments
- Use **HTTPS** instead of HTTP (requires SSL certificate)
- Change default credentials in `.env` to strong, random passwords
- Consider using a reverse proxy (nginx) with additional authentication layers
- Restrict the server's firewall to only allow access from trusted IPs
- Store `.env` securely on the server (appropriate file permissions: `chmod 600 .env`)

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

### CORS Error: "No 'Access-Control-Allow-Origin' header"
- This error appears in the browser when the frontend can't reach the backend API
- **Solution**: Update `ALLOWED_ORIGINS` in `.env` to match your frontend URL (e.g., `http://52.211.208.155:3000`)
- Restart the backend: `docker compose restart backend`
- **Note**: For production, ensure your frontend IP/domain matches exactly in `ALLOWED_ORIGINS`

### Dashboard Password Prompt Not Appearing
- If you see the dashboard without a login screen, `NEXT_PUBLIC_API_PASSWORD` is not set
- **Solution**: 
  1. Ensure `FRONTEND_API_PASSWORD` is set in `.env` (not empty)
  2. Rebuild frontend: `docker compose up -d --build frontend`
  3. Refresh browser (force refresh with Ctrl+Shift+R or Cmd+Shift+R)

### Dashboard connected but API returns 401 Unauthorized
- The frontend is sending incorrect credentials to the backend
- **Solution**: Ensure `BASIC_AUTH_PASS` in `.env` matches the password you entered on the login screen
- Both values must be identical for authentication to work

### Dashboard not connecting to API?
- Check that backend is running: `curl http://localhost:3001/api/health`
- Verify `FRONTEND_API_URL` environment variable in frontend
- Check Docker network connectivity: `docker network inspect mmnet`
- Check backend logs: `docker compose logs backend`

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
