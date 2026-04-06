import { readFileSync, writeFileSync } from "node:fs";
import { runClaude, extractLastAssistantText } from "../../shared/claude/index.js";
import type { Query } from "../../entities/query/index.js";

export async function generateQueries(
  skillFile: string,
  count: number
): Promise<Query[]> {
  const skillContent = readFileSync(skillFile, "utf-8");
  const half = Math.round(count / 2);

  const prompt = `You are helping test a Claude Code skill. Based on the following SKILL.md, generate ${count} eval queries as a JSON array.

Each item must have:
- "query": a realistic user prompt
- "should_trigger": true or false

Generate ${half} with should_trigger:true and ${half} with should_trigger:false.

Guidelines:
- should_trigger:true: vary phrasing, explicitness, detail, complexity
- should_trigger:false: near-misses only (share keywords but need something different)
- Include file paths, personal context, casual language for realism

SKILL.md:
${skillContent}

Return ONLY a valid JSON array, no explanation.`;

  const output = await runClaude(prompt);
  const text = extractLastAssistantText(output);
  if (!text) throw new Error("No response from Claude");
  const cleaned = text.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();
  return JSON.parse(cleaned) as Query[];
}

export function saveQueries(queries: Query[], outputPath: string): void {
  writeFileSync(outputPath, JSON.stringify(queries, null, 2));
}
