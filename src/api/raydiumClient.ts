import axios from "axios";
import Decimal from "decimal.js";
import BN from "bn.js";
import { getOrCreateATA } from "../utils/tokenUtils";
import { Connection, Keypair, VersionedTransaction, PublicKey } from "@solana/web3.js";
import { transactionSenderAndConfirmationWaiter } from "../utils/transactionSender";

const SWAP_HOST = "https://transaction-v1.raydium.io";

export interface SwapRequest {
    inputMint: string;
    outputMint: string;
    amount: string;
    slippageBps: number;
    inputDecimals: number;
    wrapSol?: boolean;
    unwrapSol?: boolean;
}

export class RaydiumTradeApiClient {
    constructor(private connection: Connection, private wallet: Keypair) {}

    async getSwapTx(req: SwapRequest): Promise<VersionedTransaction> {
        const {
            inputMint,
            outputMint,
            amount,
            slippageBps,
            inputDecimals,
            wrapSol = false,
            unwrapSol = false
        } = req;

        // Convert human amount to base units
        const amountBaseUnits = this.humanToBaseUnits(amount, inputDecimals);

        // Get quote
        const quoteResponse = await this.getSwapQuote(inputMint, outputMint, amountBaseUnits, slippageBps);

        // Explicitly resolve ATAs
        let inputAccount: string | undefined = undefined;
        let outputAccount: string | undefined = undefined;

        if (inputMint !== "So11111111111111111111111111111111111111112") {
            const ata = await getOrCreateATA(this.connection, this.wallet, new PublicKey(inputMint));
            inputAccount = ata.toBase58();
        }

        if (outputMint !== "So11111111111111111111111111111111111111112") {
            const ata = await getOrCreateATA(this.connection, this.wallet, new PublicKey(outputMint));
            outputAccount = ata.toBase58();
        }

        // Build tx - passing the ENTIRE quoteResponse object as swapResponse
        const builtTxs = await this.buildSwapTransactions(quoteResponse, inputAccount, outputAccount, wrapSol, unwrapSol);

        // Return as VersionedTransaction
        return this.toVersionedTx(builtTxs[0].transaction);
    }

    async executeSwap(tx: VersionedTransaction) {
        tx.sign([this.wallet]);
        const raw = Buffer.from(tx.serialize());
        const latest = await this.connection.getLatestBlockhash("finalized");
        await transactionSenderAndConfirmationWaiter({
            connection: this.connection,
            serializedTransaction: raw,
            blockhashWithExpiryBlockHeight: latest,
        });
    }

    async getSwapQuote(inputMint: string, outputMint: string, amountBaseUnits: string, slippageBps: number) {
        const url = `${SWAP_HOST}/compute/swap-base-in?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountBaseUnits}&slippageBps=${slippageBps}&txVersion=V0`;
        const { data } = await axios.get(url);
        if (!data?.success) throw new Error(`Swap quote failed: ${data?.msg || 'unknown error'}`);
        return data;
    }

    async buildSwapTransactions(
        quoteResponse: any,
        inputAccount: string | undefined,
        outputAccount: string | undefined,
        wrapSol: boolean,
        unwrapSol: boolean
    ) {
        const url = `${SWAP_HOST}/transaction/swap-base-in`;
        
        const body = {
            computeUnitPriceMicroLamports: "100000",
            // Many users report that passing the ENTIRE response object from /compute is required
            swapResponse: quoteResponse, 
            txVersion: "V0",
            wallet: this.wallet.publicKey.toBase58(),
            wrapSol,
            unwrapSol,
            inputAccount,
            outputAccount,
        };
        
        const { data } = await axios.post(url, body);
        if (!data?.success) {
            console.error("Raydium API Error Details:", JSON.stringify(data, null, 2));
            throw new Error(`Build swap transaction failed: ${data?.msg || 'unknown error'}`);
        }
        return data.data;
    }

    private toVersionedTx(base64: string): VersionedTransaction {
        const buf = Buffer.from(base64, "base64");
        return VersionedTransaction.deserialize(new Uint8Array(buf));
    }

    humanToBaseUnits(amount: string, decimals: number) {
        return new BN(new Decimal(amount).mul(new Decimal(10).pow(decimals)).toFixed(0)).toString();
    }

    async fetchTokenBalance(mint: string, decimals: number): Promise<Decimal> {
        const pubkey = this.wallet.publicKey;

        if (mint === "So11111111111111111111111111111111111111112") {
            const lamports = await this.connection.getBalance(pubkey);
            return new Decimal(lamports).div(new Decimal(10).pow(decimals));
        }

        const tokenMint = new PublicKey(mint);
        const ata = await getOrCreateATA(this.connection, this.wallet, tokenMint);

        try {
            const accountInfo = await this.connection.getTokenAccountBalance(ata);
            return new Decimal(accountInfo.value.amount).div(new Decimal(10).pow(decimals));
        } catch (e) {
            return new Decimal(0);
        }
    }
}
