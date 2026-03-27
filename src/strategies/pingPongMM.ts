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

            // 2. Decide to BUY or SELL
            if (priceChange >= CONFIG.PRICE_CHANGE_THRESHOLD && solBalance.gt(CONFIG.TRADE_AMOUNT_SOL.mul(2))) {
                // Price dropped (1 SOL buys MORE tokens) -> BUY THE DIP
                log(`📉 Price Dropped ${ (priceChange * 100).toFixed(2) }%! Buying ${CONFIG.TRADE_AMOUNT_SOL} SOL worth of tokens...`);
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
                // Price rose (1 SOL buys LESS tokens) -> SELL THE RIP
                const tokensToSell = currentTokenPerSol.mul(CONFIG.TRADE_AMOUNT_SOL);
                if (tokenBalance.gt(tokensToSell)) {
                    log(`📈 Price Rose ${ (priceChange * 100).toFixed(2) }%! Selling ${tokensToSell.toFixed(0)} tokens for SOL...`);
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
                }
            }

            await new Promise(r => setTimeout(r, CONFIG.LOOP_DELAY_MS));
        } catch (err) {
            log(`Error in MM loop (retrying in 10s): ${err}`, true);
            await new Promise(r => setTimeout(r, 10000));
        }
    }
}
