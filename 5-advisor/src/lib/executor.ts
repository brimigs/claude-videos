import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";

function buildSystem(accountData: object): string {
  const template = fs.readFileSync("prompts/executor.txt", "utf-8");
  return template.replace("{{account_data}}", JSON.stringify(accountData, null, 2));
}

export async function handle(input: string, accountData: object): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: buildSystem(accountData),
    messages: [{ role: "user", content: input }],
  });
  return (response.content[0] as Anthropic.TextBlock).text;
}

export function parseEscalation(text: string): string | null {
  const match = text.match(/^NEEDS_ADVISOR:\s*(.+)$/m);
  return match ? match[1].trim() : null;
}

export async function finalize(
  input: string,
  accountData: object,
  escalation: string,
  guidance: string
): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: buildSystem(accountData),
    messages: [
      { role: "user", content: input },
      { role: "assistant", content: escalation },
      {
        role: "user",
        content: `Advisor guidance: ${guidance}\n\nWrite the final customer-facing reply using this guidance.`,
      },
    ],
  });
  return (response.content[0] as Anthropic.TextBlock).text;
}
