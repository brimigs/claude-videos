import type { Runtime } from "../types.js";
import { buildRoleSystem } from "../config.js";
import { assertNotRefusal, textOf } from "./response.js";

export async function repair(
  rt: Runtime,
  task: string,
  output: string,
  violations: string[]
): Promise<string> {
  const violationList = violations.map((v, i) => `${i + 1}. ${v}`).join("\n");

  const response = await rt.client.messages.create({
    model: rt.config.models.repairer,
    max_tokens: rt.config.maxTokens.repairer,
    // The repairer works under the executor persona so the fixed output keeps
    // the same voice and constraints.
    system: buildRoleSystem(rt, "executor"),
    messages: [
      { role: "user", content: task },
      { role: "assistant", content: output },
      {
        role: "user",
        content: `Your reply has the violations below. Fix only what's flagged — leave everything else unchanged.\n\nViolations:\n${violationList}`,
      },
    ],
  });
  rt.tracker.record("repairer", rt.config.models.repairer, response.usage);
  assertNotRefusal(response, "Repairer");
  return textOf(response.content).trim();
}
