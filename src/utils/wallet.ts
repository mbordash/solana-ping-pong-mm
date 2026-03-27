import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";

/**
 * Derive a Solana Keypair from a BIP39 mnemonic.
 * Defaults to the standard Solana derivation path m/44'/501'/0'/0'
 */
export function keypairFromMnemonic(mnemonic: string, account = 0, change = 0): Keypair {
    if (!bip39.validateMnemonic(mnemonic)) throw new Error("Invalid mnemonic");

    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const derivationPath = `m/44'/501'/${account}'/${change}'`;
    const { key } = derivePath(derivationPath, seed.toString("hex"));

    return Keypair.fromSeed(key);
}