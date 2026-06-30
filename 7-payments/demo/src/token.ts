import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import fs from "fs";

const MINT_FILE = ".wallets/mint.json";
export const TOKEN_DECIMALS = 6;

export async function getOrCreateTestMint(
  connection: Connection,
  authority: Keypair
): Promise<PublicKey> {
  if (fs.existsSync(MINT_FILE)) {
    return new PublicKey(JSON.parse(fs.readFileSync(MINT_FILE, "utf-8")).mint);
  }
  const mint = await createMint(connection, authority, authority.publicKey, null, TOKEN_DECIMALS);
  fs.mkdirSync(".wallets", { recursive: true });
  fs.writeFileSync(MINT_FILE, JSON.stringify({ mint: mint.toBase58() }));
  return mint;
}

export async function ensureTokenAccount(
  connection: Connection,
  payer: Keypair,
  owner: PublicKey,
  mint: PublicKey
): Promise<PublicKey> {
  const account = await getOrCreateAssociatedTokenAccount(connection, payer, mint, owner);
  return account.address;
}

export async function mintTestTokens(
  connection: Connection,
  mint: PublicKey,
  authority: Keypair,
  destination: PublicKey,
  amount: number
): Promise<void> {
  await mintTo(connection, authority, mint, destination, authority, amount);
}
