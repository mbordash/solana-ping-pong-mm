import 'dotenv/config';
import { Connection, clusterApiUrl } from "@solana/web3.js";
import { keypairFromMnemonic } from "./utils/wallet";
import { runMarketMaker } from "./strategies/pingPongMM";

const MNEMONIC = process.env.MNEMONIC;
if (!MNEMONIC) throw new Error("MNEMONIC not set in .env");

// 1. Derive Keypair from mnemonic
const userKeypair = keypairFromMnemonic(MNEMONIC);

// 2. Connect to your Solana RPC
const connection = new Connection(process.env.HELIUS_RPC || clusterApiUrl("mainnet-beta"), {
    commitment: "confirmed",
});

// 3. Start market maker loop
runMarketMaker(connection, userKeypair);
