import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";

const client = new Anthropic();

export interface Usage {
  input_tokens: number;
  output_tokens: number;
}

export interface GenerateResult {
  text: string;
  usage: Usage;
}

export interface GenerateOptions {
  model: string;
  /** Adaptive thinking — what the API now calls "extended thinking". */
  thinking?: boolean;
  effort?: "low" | "medium" | "high" | "max";
}

export async function generate(
  promptPath: string,
  input: string,
  accountData: object,
  options: GenerateOptions
): Promise<GenerateResult> {
  const template = fs.readFileSync(promptPath, "utf-8");
  const system = template.replace(
    "{{account_data}}",
    JSON.stringify(accountData, null, 2)
  );

  const response = await client.messages.create({
    model: options.model,
    max_tokens: options.thinking ? 8192 : 1024,
    system,
    ...(options.thinking
      ? {
          thinking: { type: "adaptive" as const },
          output_config: { effort: options.effort ?? "high" },
        }
      : {}),
    messages: [{ role: "user", content: input }],
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
