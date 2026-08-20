import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";

const client = new Anthropic();
const MODEL = "claude-opus-4-8";

export interface AdvisorResult {
  guidance: string;
  thinking: string;
}

export async function consult(question: string, projectContext: object): Promise<AdvisorResult> {
  const template = fs.readFileSync("prompts/advisor.txt", "utf-8");
  const system = template.replace("{{project_context}}", JSON.stringify(projectContext, null, 2));

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1536,
    thinking: { type: "adaptive", display: "summarized" },
    output_config: { effort: "high" },
    system,
    messages: [{ role: "user", content: question }],
  });

  let thinking = "";
  let guidance = "";
  for (const block of response.content) {
    if (block.type === "thinking") thinking += block.thinking;
    else if (block.type === "text") guidance += block.text;
  }
  return { guidance: guidance.trim(), thinking: thinking.trim() };
}
