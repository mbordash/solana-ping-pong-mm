import Decimal from 'decimal.js';

/**
 * Market Maker Configuration
 */
export const CONFIG = {
    // The Mint address of the token you want to market make
    TOKEN_MINT: 'DTLkUR3Sfp1LcPVZMSv8toTTK3iwU7WTdF66TawwJpKN', // IDJC
    TOKEN_DECIMALS: 9,

    // SOL settings (usually 9 decimals)
    SOL_MINT: 'So11111111111111111111111111111111111111112',
    SOL_DECIMALS: 9,

    // Strategy Settings
    // Increased trade size slightly so network fees are a smaller % of the trade.
    TRADE_AMOUNT_SOL: new Decimal(0.02), 
    
    // Increased threshold to 1.0% to ensure trades only happen on meaningful moves.
    PRICE_CHANGE_THRESHOLD: 0.01,      

    // Increased delay to 120 seconds to reduce "noise" trading.
    LOOP_DELAY_MS: 120000,                

    // Trading Settings
    // Tightened slippage to 0.5% (50 BPS) to preserve more value per trade.
    SLIPPAGE_BPS: 50,                   
    
    // Lowered priority fee to 50,000 micro-lamports (0.00005 SOL).
    PRIORITY_FEE_MICRO_LAMPORTS: "50000",
};
