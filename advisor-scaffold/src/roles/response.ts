// Shared response helpers. Written against the structural shape of content
// blocks so they work for both the stable and beta message namespaces.

interface BlockLike {
  type: string;
}

export function textOf(content: ReadonlyArray<BlockLike>): string {
  let out = "";
  for (const block of content) {
    if (block.type === "text" && "text" in block) {
      out += (block as { text: string }).text;
    }
  }
  return out;
}

export function thinkingOf(content: ReadonlyArray<BlockLike>): string {
  let out = "";
  for (const block of content) {
    if (block.type === "thinking" && "thinking" in block) {
      out += (block as { thinking: string }).thinking;
    }
  }
  return out;
}

export function assertNotRefusal(
  response: { stop_reason: string | null },
  role: string
): void {
  if (response.stop_reason !== "refusal") return;
  const details = (response as { stop_details?: { explanation?: string } }).stop_details;
  const suffix = details?.explanation ? `: ${details.explanation}` : ".";
  throw new Error(`${role} request was refused by the model${suffix}`);
}
