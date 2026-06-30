import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";

const client = new Anthropic();

export async function evaluate(
  input: string,
  output: string,
  passCriteria: string
): Promise<string[]> {
  const template = fs.readFileSync("prompts/evaluator.txt", "utf-8");
  const prompt = template
    .replace("{{pass_criteria}}", passCriteria)
    .replace("{{input}}", input)
    .replace("{{output}}", output);

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = (response.content[0] as Anthropic.TextBlock).text;

  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return [`Could not parse evaluator response`];
    const parsed = JSON.parse(match[0]) as { violations: string[] };
    return parsed.violations ?? [];
  } catch {
    return [`Could not parse evaluator response: ${text.slice(0, 100)}`];
  }
}
