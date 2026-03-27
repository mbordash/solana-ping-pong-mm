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
    TRADE_AMOUNT_SOL: new Decimal(0.01), // Size per trade in SOL
    PRICE_CHANGE_THRESHOLD: 0.0015,      // 0.15% move triggers trade
    LOOP_DELAY_MS: 30000,                // Check interval (30 seconds)
    
    // Trading Settings
    SLIPPAGE_BPS: 100,                   // 1% slippage
    PRIORITY_FEE_MICRO_LAMPORTS: "100000",
};
