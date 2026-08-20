import type { Runtime } from "../types.js";
import { buildRoleSystem } from "../config.js";
import { assertNotRefusal, textOf, thinkingOf } from "./response.js";

export interface AdvisorResult {
  guidance: string;
  thinking: string;
}

export async function consult(rt: Runtime, question: string): Promise<AdvisorResult> {
  const { config } = rt;
  const request = {
    model: config.models.advisor,
    max_tokens: config.maxTokens.advisor,
    thinking: { type: "adaptive" as const, display: "summarized" as const },
    output_config: { effort: config.advisorEffort },
    system: buildRoleSystem(rt, "advisor"),
    messages: [{ role: "user" as const, content: question }],
  };

  // With a fallback model configured, a safety refusal from the advisor model
  // re-runs the same request on the fallback inside the same API call
  // (server-side refusal fallback, beta). Set advisorFallbackModel to null in
  // advisor.config.json to opt out.
  const response = config.advisorFallbackModel
    ? await rt.client.beta.messages.create({
        ...request,
        betas: ["server-side-fallback-2026-06-01"],
        fallbacks: [{ model: config.advisorFallbackModel }],
      })
    : await rt.client.messages.create(request);

  assertNotRefusal(response, "Advisor");
  return {
    guidance: textOf(response.content).trim(),
    thinking: thinkingOf(response.content).trim(),
  };
}
