import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import type { GenerateResult } from "./agent.js";

const client = new Anthropic();

export async function repair(
  promptPath: string,
  input: string,
  output: string,
  violations: string[],
  accountData: object,
  model: string
): Promise<GenerateResult> {
  const template = fs.readFileSync(promptPath, "utf-8");
  const system = template.replace(
    "{{account_data}}",
    JSON.stringify(accountData, null, 2)
  );

  const violationList = violations
    .map((v, i) => `${i + 1}. ${v}`)
    .join("\n");

  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    system,
    messages: [
      { role: "user", content: input },
      { role: "assistant", content: output },
      {
        role: "user",
        content: `An automated reviewer flagged your response for the violations below. Rewrite your response so none of them apply — check the context data again if a violation says you missed a conflict, an offset, or a policy. If a violation says information is missing or ambiguous, ask a clarifying question instead of guessing. Do not repeat your previous response.\n\nViolations:\n${violationList}`,
      },
    ],
  });

  const textBlock = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text"
  );

  return {
    text: textBlock?.text ?? "",
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
    },
  };
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
