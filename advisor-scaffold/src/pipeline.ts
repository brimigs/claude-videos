import { createRuntime } from "./config.js";
import { handle, parseEscalation, finalize } from "./roles/executor.js";
import { consult } from "./roles/advisor.js";
import { evaluate } from "./roles/evaluator.js";
import { repair } from "./roles/repairer.js";
import type { PipelineOptions, PipelineResult, Runtime } from "./types.js";

export async function runAdvisorPipeline(
  task: string,
  options: PipelineOptions = {},
  runtime?: Runtime
): Promise<PipelineResult> {
  const rt = runtime ?? createRuntime();
  const emit = options.onEvent ?? (() => {});
  rt.tracker.reset();

  emit({ type: "executor_start", model: rt.config.models.executor });
  const first = await handle(rt, task);
  const question = parseEscalation(first);

  let output = first;
  let guidance: string | null = null;
  let advisorThinking: string | null = null;

  if (question) {
    emit({ type: "escalated", question });
    emit({ type: "advisor_start", model: rt.config.models.advisor });
    const advice = await consult(rt, question);
    guidance = advice.guidance;
    advisorThinking = advice.thinking || null;
    emit({ type: "advisor_guidance", guidance, thinking: advice.thinking });
    emit({ type: "finalize_start" });
    output = await finalize(rt, task, first, guidance);
  }
  emit({ type: "draft_output", output, escalated: question !== null });

  let violations: string[] = [];
  let repaired = false;
  if (options.verify !== false) {
    emit({ type: "evaluator_start", model: rt.config.models.evaluator });
    violations = await evaluate(
      rt,
      task,
      output,
      options.passCriteria ?? rt.config.defaultPassCriteria
    );
    emit({ type: "evaluator_result", violations });
    if (violations.length > 0) {
      emit({ type: "repair_start", model: rt.config.models.repairer });
      output = await repair(rt, task, output, violations);
      repaired = true;
    }
  }

  return {
    output,
    escalated: question !== null,
    escalationQuestion: question,
    guidance,
    advisorThinking,
    violations,
    repaired,
    models: rt.config.models,
    usage: rt.tracker.summarize(rt.config.models.advisor, rt.config.pricing),
  };
}
