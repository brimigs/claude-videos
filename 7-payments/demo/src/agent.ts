import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { createTransferCheckedInstruction, getAssociatedTokenAddress } from "@solana/spl-token";
import { loadOrCreateKeypair } from "./wallet.js";
import { TOKEN_DECIMALS } from "./token.js";
import {
  decodeHeader,
  encodeHeader,
  PaymentPayload,
  PaymentRequiredResponse,
  SettlementResponse,
} from "./x402.js";

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:4021";
const RESOURCE_PATH = "/api/weather";

const connection = new Connection(
  process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
  "confirmed"
);
const agent = loadOrCreateKeypair("agent");

console.log(`Agent ${agent.publicKey.toBase58()}`);
console.log(`Requesting ${SERVER_URL}${RESOURCE_PATH} with no payment...\n`);

const firstAttempt = await fetch(`${SERVER_URL}${RESOURCE_PATH}`);
if (firstAttempt.status !== 402) {
  throw new Error(`Expected 402, got ${firstAttempt.status}`);
}

const requirements = (await firstAttempt.json()) as PaymentRequiredResponse;
const offer = requirements.accepts[0];
console.log(`402 Payment Required — ${offer.description}`);
console.log(`  ${offer.amount} base units of ${offer.asset} on ${offer.network}, payTo ${offer.payTo}\n`);

const mint = new PublicKey(offer.asset);
const payToOwner = new PublicKey(offer.payTo);

const agentTokenAccount = await getAssociatedTokenAddress(mint, agent.publicKey);
const sellerTokenAccount = await getAssociatedTokenAddress(mint, payToOwner);

console.log("Signing a payment (not broadcasting it — the seller settles it)...");
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

console.log("Retrying with X-PAYMENT...\n");
const secondAttempt = await fetch(`${SERVER_URL}${RESOURCE_PATH}`, {
  headers: { "X-PAYMENT": encodeHeader(payment) },
});

if (secondAttempt.status !== 200) {
  console.log(`Payment rejected (${secondAttempt.status}):`, await secondAttempt.json());
  process.exit(1);
}

const settlementHeader = secondAttempt.headers.get("x-payment-response");
const settlement = settlementHeader ? decodeHeader<SettlementResponse>(settlementHeader) : null;
const resource = await secondAttempt.json();

console.log("200 OK — paid and unlocked:");
console.log(resource);

if (settlement) {
  console.log(`\nSettled on-chain: ${settlement.transaction}`);
  if (settlement.network.includes("devnet")) {
    console.log(`https://explorer.solana.com/tx/${settlement.transaction}?cluster=devnet`);
  }
}
