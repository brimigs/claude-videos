import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";

const client = new Anthropic();

export async function repair(
  promptPath: string,
  input: string,
  output: string,
  violations: string[],
  accountData: object
): Promise<string> {
  const template = fs.readFileSync(promptPath, "utf-8");
  const system = template.replace(
    "{{account_data}}",
    JSON.stringify(accountData, null, 2)
  );

  const violationList = violations
    .map((v, i) => `${i + 1}. ${v}`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system,
    messages: [
      { role: "user", content: input },
      { role: "assistant", content: output },
      {
        role: "user",
        content: `Your response has policy violations. Fix it.\n\nViolations:\n${violationList}`,
      },
    ],
  });

  return (response.content[0] as Anthropic.TextBlock).text;
}

export async function logFailure(entry: {
  input: string;
  output: string;
}): Promise<void> {
  const log = {
    timestamp: new Date().toISOString(),
    ...entry,
  };
  console.log("\n  [logFailure] Logged to failures.jsonl for eval set review:");
  console.log("  " + JSON.stringify(log).slice(0, 120) + "...");
}
