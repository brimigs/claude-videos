import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";

export async function repair(
  input: string,
  output: string,
  violations: string[],
  projectContext: object
): Promise<string> {
  const template = fs.readFileSync("prompts/executor.txt", "utf-8");
  const system = template.replace("{{project_context}}", JSON.stringify(projectContext, null, 2));
  const violationList = violations.map((v, i) => `${i + 1}. ${v}`).join("\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system,
    messages: [
      { role: "user", content: input },
      { role: "assistant", content: output },
      {
        role: "user",
        content: `Your reply has the violations below. Fix only what's flagged — leave everything else unchanged.\n\nViolations:\n${violationList}`,
      },
    ],
  });
  return (response.content[0] as Anthropic.TextBlock).text;
}
