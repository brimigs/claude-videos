import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import fs from "fs";
import path from "path";

const WALLET_DIR = ".wallets";

export function loadOrCreateKeypair(name: string): Keypair {
  const file = path.join(WALLET_DIR, `${name}.json`);
  if (fs.existsSync(file)) {
    const secret = Uint8Array.from(JSON.parse(fs.readFileSync(file, "utf-8")));
    return Keypair.fromSecretKey(secret);
  }
  fs.mkdirSync(WALLET_DIR, { recursive: true });
  const keypair = Keypair.generate();
  fs.writeFileSync(file, JSON.stringify(Array.from(keypair.secretKey)));
  return keypair;
}

export async function ensureFunded(
  connection: Connection,
  keypair: Keypair,
  minLamports: number
): Promise<void> {
  const balance = await connection.getBalance(keypair.publicKey);
  if (balance >= minLamports) return;

  console.log(`Requesting devnet airdrop for ${keypair.publicKey.toBase58()}...`);
  const signature = await connection.requestAirdrop(keypair.publicKey, LAMPORTS_PER_SOL);
  await connection.confirmTransaction(signature, "confirmed");
}

export async function printBalance(
  connection: Connection,
  label: string,
  pubkey: PublicKey
): Promise<void> {
  const balance = await connection.getBalance(pubkey);
  console.log(`${label}: ${pubkey.toBase58()} — ${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
}
