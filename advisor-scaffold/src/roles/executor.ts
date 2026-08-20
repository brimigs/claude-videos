import type Anthropic from "@anthropic-ai/sdk";
import type { Runtime } from "../types.js";
import { buildRoleSystem } from "../config.js";
import { assertNotRefusal, textOf } from "./response.js";

async function complete(rt: Runtime, messages: Anthropic.MessageParam[]): Promise<string> {
  const response = await rt.client.messages.create({
    model: rt.config.models.executor,
    max_tokens: rt.config.maxTokens.executor,
    system: buildRoleSystem(rt, "executor"),
    messages,
  });
  assertNotRefusal(response, "Executor");
  return textOf(response.content).trim();
}

export async function handle(rt: Runtime, task: string): Promise<string> {
  return complete(rt, [{ role: "user", content: task }]);
}

export function parseEscalation(text: string): string | null {
  const match = text.match(/^NEEDS_ADVISOR:\s*(.+)$/m);
  return match ? match[1].trim() : null;
}

export async function finalize(
  rt: Runtime,
  task: string,
  escalation: string,
  guidance: string
): Promise<string> {
  return complete(rt, [
    { role: "user", content: task },
    { role: "assistant", content: escalation },
    {
      role: "user",
      content: `Senior engineering guidance: ${guidance}\n\nWrite the final engineering-facing output using this guidance.`,
    },
  ]);
}
