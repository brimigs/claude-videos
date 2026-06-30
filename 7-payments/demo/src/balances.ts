import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import fs from "fs";
import { loadOrCreateKeypair } from "./wallet.js";
import { TOKEN_DECIMALS } from "./token.js";

const connection = new Connection(process.env.SOLANA_RPC_URL ?? "http://127.0.0.1:8899", "confirmed");
const seller = loadOrCreateKeypair("seller");
const agent = loadOrCreateKeypair("agent");
const mint = new PublicKey(JSON.parse(fs.readFileSync(".wallets/mint.json", "utf-8")).mint);

const sellerAta = await getAssociatedTokenAddress(mint, seller.publicKey);
const agentAta = await getAssociatedTokenAddress(mint, agent.publicKey);
const sellerAcc = await getAccount(connection, sellerAta);
const agentAcc = await getAccount(connection, agentAta);

function format(amount: bigint): string {
  return `${amount} base units (${Number(amount) / 10 ** TOKEN_DECIMALS})`;
}

console.log("seller:", format(sellerAcc.amount));
console.log("agent :", format(agentAcc.amount));
