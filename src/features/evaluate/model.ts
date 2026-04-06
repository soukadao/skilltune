import { runClaude, isSkillTriggered } from "../../shared/claude/index.js";
import { summarize } from "../../entities/result/index.js";
import type { Query } from "../../entities/query/index.js";
import type { QueryResult, EvalResult } from "../../entities/result/index.js";

export async function evaluateQuery(
  query: Query,
  skillName: string,
  runs: number,
  threshold: number
): Promise<QueryResult> {
  const outputs = await Promise.all(
    Array.from({ length: runs }, () => runClaude(query.query))
  );
  const triggers = outputs.filter((o) => isSkillTriggered(o, skillName)).length;
  const trigger_rate = triggers / runs;
  const passed = query.should_trigger
    ? trigger_rate >= threshold
    : trigger_rate < threshold;
  return {
    query: query.query,
    should_trigger: query.should_trigger,
    triggers,
    runs,
    trigger_rate,
    passed,
  };
}

export async function evaluateAll(
  queries: Query[],
  skillName: string,
  runs: number,
  threshold: number,
  onProgress?: (result: QueryResult) => void
): Promise<EvalResult> {
  const results = await Promise.all(
    queries.map(async (query) => {
      const result = await evaluateQuery(query, skillName, runs, threshold);
      onProgress?.(result);
      return result;
    })
  );
  return summarize(results);
}
