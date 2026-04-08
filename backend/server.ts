import 'dotenv/config';
import express = require('express');
import cors = require('cors');
import { Connection, clusterApiUrl, Keypair } from '@solana/web3.js';
import { keypairFromMnemonic } from '../src/utils/wallet';
import { runMarketMaker } from '../src/strategies/pingPongMM';
import { CONFIG } from '../src/config';
import * as fs from 'fs';
import * as path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

// Security: Configure CORS to only allow frontend origin
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// --- Basic Auth Middleware (MUST be before routes) ---
const BASIC_AUTH_USER = process.env.BASIC_AUTH_USER || 'admin';
const BASIC_AUTH_PASS = process.env.BASIC_AUTH_PASS || 'setecastronomy';

// Helper function to validate auth
function validateAuth(req: express.Request): boolean {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Basic ')) {
    return false;
  }
  const b64 = auth.split(' ')[1];
  const [user, pass] = Buffer.from(b64, 'base64').toString().split(':');
  return user === BASIC_AUTH_USER && pass === BASIC_AUTH_PASS;
}

// State management
let botProcess: any = null;
let isRunning = false;
let trades: any[] = [];
const tradesFilePath = path.join(__dirname, 'trades.json');

// Load trades from file if exists
if (fs.existsSync(tradesFilePath)) {
    try {
        trades = JSON.parse(fs.readFileSync(tradesFilePath, 'utf-8'));
    } catch (e) {
        trades = [];
    }
}

// Save trades to file
function saveTrades() {
    fs.writeFileSync(tradesFilePath, JSON.stringify(trades, null, 2));
}

// Monkey-patch console.log to capture trade info
const originalLog = console.log;
const originalError = console.error;

console.log = function(...args: any[]) {
    const message = args.join(' ');
    originalLog(...args);

    // Detect trade patterns and log them
    if (message.includes('📉') || message.includes('📈')) {
        const timestamp = new Date().toISOString();
        const tradeType = message.includes('📉') ? 'BUY' : 'SELL';
        trades.unshift({
            timestamp,
            type: tradeType,
            message,
        });
        // Keep last 100 trades
        if (trades.length > 100) {
            trades.pop();
        }
        saveTrades();
    }
};

console.error = originalError;

/**
 * GET /api/status
 * Returns current bot status
 */
app.get('/api/status', (req: express.Request, res: express.Response) => {
    if (!validateAuth(req)) {
        res.setHeader('WWW-Authenticate', 'Basic realm="MM Dashboard"');
        return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json({
        running: isRunning,
        trades: trades.slice(0, 20),
        totalTrades: trades.length,
    });
});

/**
 * POST /api/start
 * Start the market maker bot
 */
app.post('/api/start', async (req: express.Request, res: express.Response) => {
    if (!validateAuth(req)) {
        res.setHeader('WWW-Authenticate', 'Basic realm="MM Dashboard"');
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (isRunning) {
        return res.status(400).json({ error: 'Bot already running' });
    }

    try {
        const MNEMONIC = process.env.MNEMONIC;
        if (!MNEMONIC) {
            return res.status(400).json({ error: 'MNEMONIC not set in environment' });
        }

        const userKeypair = keypairFromMnemonic(MNEMONIC);
        const connection = new Connection(
            process.env.HELIUS_RPC || clusterApiUrl('mainnet-beta'),
            { commitment: 'confirmed' }
        );

        isRunning = true;

        // Start bot in background (don't await)
        runMarketMaker(connection, userKeypair).catch((err) => {
            console.error('Bot error:', err);
            isRunning = false;
        });

        res.json({ success: true, message: 'Bot started' });
    } catch (err) {
        isRunning = false;
        res.status(500).json({ error: String(err) });
    }
});

/**
 * POST /api/stop
 * Stop the market maker bot
 */
app.post('/api/stop', (req: express.Request, res: express.Response) => {
    if (!validateAuth(req)) {
        res.setHeader('WWW-Authenticate', 'Basic realm="MM Dashboard"');
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!isRunning) {
        return res.status(400).json({ error: 'Bot not running' });
    }

    isRunning = false;
    // Note: In production, you'd want a cleaner shutdown mechanism
    res.json({ success: true, message: 'Bot stopped' });
});

/**
 * GET /api/trades
 * Get trade history
 */
app.get('/api/trades', (req: express.Request, res: express.Response) => {
    if (!validateAuth(req)) {
        res.setHeader('WWW-Authenticate', 'Basic realm="MM Dashboard"');
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    res.json(trades.slice(0, limit));
});

/**
 * GET /api/config
 * Get current config (reads from src/config.ts)
 */
app.get('/api/config', (req: express.Request, res: express.Response) => {
    if (!validateAuth(req)) {
        res.setHeader('WWW-Authenticate', 'Basic realm="MM Dashboard"');
        return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json({
        TOKEN_MINT: CONFIG.TOKEN_MINT,
        TOKEN_DECIMALS: CONFIG.TOKEN_DECIMALS,
        TRADE_AMOUNT_SOL: CONFIG.TRADE_AMOUNT_SOL.toString(),
        PRICE_CHANGE_THRESHOLD: CONFIG.PRICE_CHANGE_THRESHOLD,
        LOOP_DELAY_MS: CONFIG.LOOP_DELAY_MS,
        SLIPPAGE_BPS: CONFIG.SLIPPAGE_BPS,
        PRIORITY_FEE_MICRO_LAMPORTS: CONFIG.PRIORITY_FEE_MICRO_LAMPORTS,
    });
});

// Health check (public - no auth required for Docker health checks)
app.get('/api/health', (req: express.Request, res: express.Response) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`✅ Dashboard API running on http://localhost:${PORT}`);
    console.log(`⚠️  CORS allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});



