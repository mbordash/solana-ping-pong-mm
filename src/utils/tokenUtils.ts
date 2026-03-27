// src/utils/tokenUtils.ts
import { Connection, PublicKey, Keypair, Transaction } from "@solana/web3.js";
import {
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

export const SOL_MINT_ADDRESS = "So11111111111111111111111111111111111111112";

import { RaydiumTradeApiClient } from "../api/raydiumClient";
import Decimal from "decimal.js";

export async function fetchTokenBalance(
    client: RaydiumTradeApiClient,
    mint: string,
    decimals: number
): Promise<Decimal> {
    return client.fetchTokenBalance(mint, decimals);
}

export async function getOrCreateATA(
    connection: Connection,
    wallet: Keypair,
    mint: PublicKey
): Promise<PublicKey> {
    // Determine the correct token program ID based on the mint
    let tokenProgramId = TOKEN_PROGRAM_ID;
    
    // Check if the mint is Token-2022
    const mintAccountInfo = await connection.getAccountInfo(mint);
    if (mintAccountInfo && mintAccountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
        tokenProgramId = TOKEN_2022_PROGRAM_ID;
    }

    const ata = await getAssociatedTokenAddress(
        mint, 
        wallet.publicKey, 
        false, 
        tokenProgramId
    );

    const accountInfo = await connection.getAccountInfo(ata);
    if (accountInfo) return ata; // ATA already exists

    // Build transaction to create ATA
    const tx = new Transaction().add(
        createAssociatedTokenAccountInstruction(
            wallet.publicKey, // payer
            ata,              // ATA to create
            wallet.publicKey, // owner
            mint,             // token mint
            tokenProgramId    // token program ID
        )
    );

    const latest = await connection.getLatestBlockhash("finalized");
    tx.recentBlockhash = latest.blockhash;
    tx.feePayer = wallet.publicKey;

    tx.sign(wallet);
    const raw = tx.serialize();
    await connection.sendRawTransaction(raw, { skipPreflight: false, preflightCommitment: "confirmed" });

    return ata;
}
