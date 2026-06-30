import http from "http";
import { Connection, Transaction } from "@solana/web3.js";
import { decodeTransferCheckedInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { loadOrCreateKeypair } from "./wallet.js";
import { getOrCreateTestMint } from "./token.js";
import {
  decodeHeader,
  encodeHeader,
  PaymentPayload,
  PaymentRequiredResponse,
  SettlementResponse,
} from "./x402.js";

const PORT = Number(process.env.SERVER_PORT ?? 4021);
const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const NETWORK = process.env.X402_NETWORK ?? (RPC_URL.includes("devnet") ? "solana-devnet" : "solana-localnet");
const RESOURCE_PATH = "/api/weather";
const PRICE = 10_000n; // 0.01 of the demo token at 6 decimals — a sub-cent price, same idea as a real x402 API call

const connection = new Connection(RPC_URL, "confirmed");
const seller = loadOrCreateKeypair("seller");
const mint = await getOrCreateTestMint(connection, seller);
const sellerTokenAccount = await getAssociatedTokenAddress(mint, seller.publicKey);

function paymentRequiredBody(error: string): PaymentRequiredResponse {
  return {
    x402Version: 1,
    error,
    accepts: [
      {
        scheme: "exact",
        network: NETWORK,
        amount: PRICE.toString(),
        asset: mint.toBase58(),
        payTo: seller.publicKey.toBase58(),
        resource: `http://localhost:${PORT}${RESOURCE_PATH}`,
        description: "Current weather for San Francisco",
        mimeType: "application/json",
        maxTimeoutSeconds: 60,
      },
    ],
  };
}

type SettleResult = { ok: true; signature: string; payer: string } | { ok: false; reason: string };

async function settlePayment(header: string): Promise<SettleResult> {
  let envelope: PaymentPayload;
  try {
    envelope = decodeHeader<PaymentPayload>(header);
  } catch {
    return { ok: false, reason: "X-PAYMENT header is not valid base64 JSON" };
  }

  let tx: Transaction;
  try {
    tx = Transaction.from(Buffer.from(envelope.payload.transaction, "base64"));
  } catch {
    return { ok: false, reason: "payload.transaction is not a valid serialized transaction" };
  }

  if (!tx.verifySignatures()) {
    return { ok: false, reason: "transaction signature verification failed" };
  }

  const tokenIx = tx.instructions.find((ix) => ix.programId.equals(TOKEN_PROGRAM_ID));
  if (!tokenIx) {
    return { ok: false, reason: "no SPL token instruction in the payment transaction" };
  }

  let decoded;
  try {
    decoded = decodeTransferCheckedInstruction(tokenIx);
  } catch {
    return { ok: false, reason: "token instruction is not a valid TransferChecked" };
  }

  if (!decoded.keys.mint.pubkey.equals(mint)) {
    return { ok: false, reason: "payment is in the wrong token" };
  }
  if (!decoded.keys.destination.pubkey.equals(sellerTokenAccount)) {
    return { ok: false, reason: "payment does not go to this seller" };
  }
  if (decoded.data.amount < PRICE) {
    return { ok: false, reason: `payment of ${decoded.data.amount} is less than the required ${PRICE}` };
  }

  try {
    const signature = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(signature, "confirmed");
    return { ok: true, signature, payer: decoded.keys.owner.pubkey.toBase58() };
  } catch (err) {
    return { ok: false, reason: `settlement failed: ${(err as Error).message}` };
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url !== RESOURCE_PATH) {
    res.writeHead(404).end();
    return;
  }

  const paymentHeader = req.headers["x-payment"];
  if (!paymentHeader || typeof paymentHeader !== "string") {
    res
      .writeHead(402, { "Content-Type": "application/json" })
      .end(JSON.stringify(paymentRequiredBody("X-PAYMENT header is required")));
    return;
  }

  const result = await settlePayment(paymentHeader);
  if (!result.ok) {
    res.writeHead(402, { "Content-Type": "application/json" }).end(JSON.stringify(paymentRequiredBody(result.reason)));
    return;
  }

  const settlement: SettlementResponse = {
    success: true,
    transaction: result.signature,
    network: NETWORK,
    payer: result.payer,
  };

  console.log(`Paid: ${result.payer} → ${result.signature}`);

  res.writeHead(200, {
    "Content-Type": "application/json",
    "X-PAYMENT-RESPONSE": encodeHeader(settlement),
  });
  res.end(
    JSON.stringify({
      city: "San Francisco",
      forecast: "Fog clearing by noon, high 64°F",
      generatedAt: new Date().toISOString(),
    })
  );
});

server.listen(PORT, () => {
  console.log(`x402 paywalled server listening on http://localhost:${PORT}${RESOURCE_PATH}`);
  console.log(`network=${NETWORK} mint=${mint.toBase58()} payTo=${sellerTokenAccount.toBase58()}`);
});
