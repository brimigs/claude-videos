export interface PaymentRequirements {
  scheme: "exact";
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  resource: string;
  description: string;
  mimeType: string;
  maxTimeoutSeconds: number;
}

export interface PaymentRequiredResponse {
  x402Version: 1;
  error: string;
  accepts: PaymentRequirements[];
}

export interface PaymentPayload {
  x402Version: 1;
  scheme: "exact";
  network: string;
  payload: { transaction: string };
}

export interface SettlementResponse {
  success: boolean;
  transaction: string;
  network: string;
  payer: string;
}

export function encodeHeader(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64");
}

export function decodeHeader<T>(header: string): T {
  return JSON.parse(Buffer.from(header, "base64").toString("utf-8")) as T;
}
