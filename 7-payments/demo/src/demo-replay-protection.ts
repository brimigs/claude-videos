import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { createTransferCheckedInstruction, getAssociatedTokenAddress } from "@solana/spl-token";
import { loadOrCreateKeypair } from "./wallet.js";
import { TOKEN_DECIMALS } from "./token.js";
import { encodeHeader, PaymentPayload, PaymentRequiredResponse } from "./x402.js";

console.log(
  "A signed payment is single-use — this signs one payment, then sends the exact\nsame bytes to the server twice.\n"
);

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:4021";
const connection = new Connection(process.env.SOLANA_RPC_URL ?? "http://127.0.0.1:8899", "confirmed");
const agent = loadOrCreateKeypair("agent");

const firstAttempt = await fetch(`${SERVER_URL}/api/weather`);
const requirements = (await firstAttempt.json()) as PaymentRequiredResponse;
const offer = requirements.accepts[0];

const mint = new PublicKey(offer.asset);
const payToOwner = new PublicKey(offer.payTo);
const agentTokenAccount = await getAssociatedTokenAddress(mint, agent.publicKey);
const sellerTokenAccount = await getAssociatedTokenAddress(mint, payToOwner);

const { blockhash } = await connection.getLatestBlockhash();
const tx = new Transaction({ recentBlockhash: blockhash, feePayer: agent.publicKey }).add(
  createTransferCheckedInstruction(
    agentTokenAccount,
    mint,
    sellerTokenAccount,
    agent.publicKey,
    BigInt(offer.amount),
    TOKEN_DECIMALS
  )
);
tx.sign(agent);

const payment: PaymentPayload = {
  x402Version: 1,
  scheme: "exact",
  network: offer.network,
  payload: { transaction: tx.serialize().toString("base64") },
};
const header = encodeHeader(payment);

console.log("First use of this signed payment:");
const r1 = await fetch(`${SERVER_URL}/api/weather`, { headers: { "X-PAYMENT": header } });
console.log(`  status=${r1.status} — ${r1.status === 200 ? "paid" : "rejected"}`);

console.log("\nReplaying the exact same signed payment a second time:");
const r2 = await fetch(`${SERVER_URL}/api/weather`, { headers: { "X-PAYMENT": header } });
const body2 = (await r2.json()) as PaymentRequiredResponse;
console.log(`  status=${r2.status} — ${r2.status === 200 ? "paid again (BUG)" : "rejected, as expected"}`);
console.log(`  reason: ${body2.error}`);
