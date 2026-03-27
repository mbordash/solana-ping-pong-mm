import { Connection, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";

export async function transactionSenderAndConfirmationWaiter({
                                                                 connection,
                                                                 serializedTransaction,
                                                                 blockhashWithExpiryBlockHeight,
                                                             }: {
    connection: Connection;
    serializedTransaction: Buffer;
    blockhashWithExpiryBlockHeight: { blockhash: string; lastValidBlockHeight: number };
}) {
    const txSig = await connection.sendRawTransaction(serializedTransaction, { skipPreflight: true });
    await connection.confirmTransaction(
        {
            signature: txSig,
            blockhash: blockhashWithExpiryBlockHeight.blockhash,
            lastValidBlockHeight: blockhashWithExpiryBlockHeight.lastValidBlockHeight,
        },
        "finalized"
    );
    return txSig;
}