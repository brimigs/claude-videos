import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAccount } from "@solana/spl-token";
import { loadOrCreateKeypair, ensureFunded, printBalance } from "./wallet.js";
import { getOrCreateTestMint, ensureTokenAccount, mintTestTokens, TOKEN_DECIMALS } from "./token.js";

const connection = new Connection(
  process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
  "confirmed"
);

const seller = loadOrCreateKeypair("seller");
const agent = loadOrCreateKeypair("agent");

console.log("Wallets (created under .wallets/ on first run):\n");
await printBalance(connection, "seller", seller.publicKey);
await printBalance(connection, "agent ", agent.publicKey);

await ensureFunded(connection, seller, 0.5 * LAMPORTS_PER_SOL);
await ensureFunded(connection, agent, 0.1 * LAMPORTS_PER_SOL);

console.log("\nSetting up the demo token (a mock stablecoin, so the price is denominated like a real x402 payment instead of native SOL)...");
const mint = await getOrCreateTestMint(connection, seller);
console.log(`mint: ${mint.toBase58()}`);

const sellerTokenAccount = await ensureTokenAccount(connection, seller, seller.publicKey, mint);
const agentTokenAccount = await ensureTokenAccount(connection, agent, agent.publicKey, mint);

const agentAccount = await getAccount(connection, agentTokenAccount);
if (agentAccount.amount < 100_000n) {
  console.log("Minting test tokens to the agent...");
  await mintTestTokens(connection, mint, seller, agentTokenAccount, 1_000_000);
}

console.log("\nReady:");
await printBalance(connection, "seller", seller.publicKey);
await printBalance(connection, "agent ", agent.publicKey);
const finalAgentAccount = await getAccount(connection, agentTokenAccount);
console.log(
  `agent test-token balance: ${Number(finalAgentAccount.amount) / 10 ** TOKEN_DECIMALS} (${finalAgentAccount.amount} base units)`
);
