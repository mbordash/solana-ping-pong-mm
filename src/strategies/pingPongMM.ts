// src/strategies/pingPongMM.ts
import { Connection, Keypair } from '@solana/web3.js';
import Decimal from 'decimal.js';
import { fetchTokenBalance } from '../utils/tokenUtils';
import { RaydiumTradeApiClient } from '../api/raydiumClient';
import { CONFIG } from '../config';

function log(message: string, isError = false) {
    const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
    const logMessage = `[${timestamp}] ${message}`;
    if (isError) {
        console.error(logMessage);
    } else {
        console.log(logMessage);
    }
}

export async function runMarketMaker(connection: Connection, userKeypair: Keypair) {
    const client = new RaydiumTradeApiClient(connection, userKeypair);
    let lastTokenPerSol: Decimal | null = null;

    log("🚀 Starting Ping-Pong Market Maker (Aggressive 0.01 SOL)...");

    while (true) {
        try {
            const solBalance = await fetchTokenBalance(client, CONFIG.SOL_MINT, CONFIG.SOL_DECIMALS);
            const tokenBalance = await fetchTokenBalance(client, CONFIG.TOKEN_MINT, CONFIG.TOKEN_DECIMALS);
            
            // 1. Get current price (How much TOKEN is 1 SOL worth?)
            const quote = await client.getSwapQuote(CONFIG.SOL_MINT, CONFIG.TOKEN_MINT, "1000000000", CONFIG.SLIPPAGE_BPS);
            const currentTokenPerSol = new Decimal(quote.data.outputAmount).div(10 ** CONFIG.TOKEN_DECIMALS);

            if (!lastTokenPerSol) {
                lastTokenPerSol = currentTokenPerSol;
                log(`Initial Price: 1 SOL = ${currentTokenPerSol.toFixed(4)} Token. Waiting for movement...`);
                await new Promise(r => setTimeout(r, CONFIG.LOOP_DELAY_MS));
                continue;
            }

            const priceChange = currentTokenPerSol.sub(lastTokenPerSol).div(lastTokenPerSol).toNumber();
            log(`Balances | SOL: ${solBalance.toFixed(4)} | Token: ${tokenBalance.toFixed(0)}`);
            log(`Price: 1 SOL = ${currentTokenPerSol.toFixed(4)} Token | Change: ${(priceChange * 100).toFixed(2)}%`);

            // Minimum sell size: equivalent to 0.001 SOL worth of tokens (avoids dust trades)
            const MIN_SELL_TOKENS = currentTokenPerSol.mul(new Decimal('0.001'));

            // 2. Decide to BUY or SELL
            if (priceChange >= CONFIG.PRICE_CHANGE_THRESHOLD && solBalance.gt(CONFIG.TRADE_AMOUNT_SOL.mul(2))) {
                // Token price dropped (1 SOL buys MORE tokens) -> BUY THE DIP
                log(`📉 Token Price Dropped ${ (priceChange * 100).toFixed(2) }%! Buying ${CONFIG.TRADE_AMOUNT_SOL} SOL worth of tokens...`);
                const tx = await client.getSwapTx({
                    inputMint: CONFIG.SOL_MINT,
                    outputMint: CONFIG.TOKEN_MINT,
                    amount: CONFIG.TRADE_AMOUNT_SOL.toFixed(CONFIG.SOL_DECIMALS),
                    slippageBps: CONFIG.SLIPPAGE_BPS, 
                    inputDecimals: CONFIG.SOL_DECIMALS,
                    wrapSol: true
                });
                await client.executeSwap(tx);
                lastTokenPerSol = currentTokenPerSol; 
             }
             else if (priceChange <= -CONFIG.PRICE_CHANGE_THRESHOLD) {
                 // Token price rose (1 SOL buys LESS tokens) -> SELL THE RIP
                 // Cap sell amount to what we actually have (up to TRADE_AMOUNT_SOL worth)
                 const idealTokensToSell = currentTokenPerSol.mul(CONFIG.TRADE_AMOUNT_SOL);
                 const tokensToSell = Decimal.min(idealTokensToSell, tokenBalance.mul(new Decimal('0.99')));

                 if (tokensToSell.gte(MIN_SELL_TOKENS)) {
                     log(`📈 Token Price Rose ${ (priceChange * 100).toFixed(2) }%! Selling ${tokensToSell.toFixed(0)} tokens for SOL...`);
                     const tx = await client.getSwapTx({
                         inputMint: CONFIG.TOKEN_MINT,
                         outputMint: CONFIG.SOL_MINT,
                         amount: tokensToSell.toFixed(CONFIG.TOKEN_DECIMALS),
                         slippageBps: CONFIG.SLIPPAGE_BPS,
                         inputDecimals: CONFIG.TOKEN_DECIMALS,
                         unwrapSol: true
                     });
                     await client.executeSwap(tx);
                     lastTokenPerSol = currentTokenPerSol;
                 } else {
                     log(`⚠️ Sell signal but token balance too low to trade (have ${tokenBalance.toFixed(0)}, min needed: ${MIN_SELL_TOKENS.toFixed(0)}). Resetting reference.`);
                     lastTokenPerSol = currentTokenPerSol;
                 }
             } else {
                 // Price change is within threshold - update reference for next comparison
                 lastTokenPerSol = currentTokenPerSol;
             }

             await new Promise(r => setTimeout(r, CONFIG.LOOP_DELAY_MS));
        } catch (err) {
            log(`Error in MM loop (retrying in 10s): ${err}`, true);
            await new Promise(r => setTimeout(r, 10000));
        }
    }
}
