import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";

const client = new Anthropic();

export async function generate(
  promptPath: string,
  input: string,
  accountData: object
): Promise<string> {
  const template = fs.readFileSync(promptPath, "utf-8");
  const system = template.replace(
    "{{account_data}}",
    JSON.stringify(accountData, null, 2)
  );

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system,
    messages: [{ role: "user", content: input }],
  });

  return (response.content[0] as Anthropic.TextBlock).text;
}
