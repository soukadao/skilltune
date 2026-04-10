import { runClaude, isSkillTriggered } from "../../shared/claude/index.js";
import { summarize } from "../../entities/result/index.js";
import type { Query } from "../../entities/query/index.js";
import type { QueryResult, EvalResult } from "../../entities/result/index.js";

export async function evaluateQuery(
  query: Query,
  index: number,
  skillName: string,
  runs: number
): Promise<QueryResult> {
  const outputs = await Promise.all(
    Array.from({ length: runs }, () => runClaude(query.query))
  );
  const triggers = outputs.filter((o) => isSkillTriggered(o, skillName)).length;
  const trigger_rate = triggers / runs;
  return {
    index,
    query: query.query,
    should_trigger: query.should_trigger,
    triggers,
    runs,
    trigger_rate,
  };
}

export async function evaluateAll(
  queries: Query[],
  skillName: string,
  runs: number,
  onProgress?: (result: QueryResult) => void
): Promise<EvalResult> {
  const results = await Promise.all(
    queries.map(async (query, index) => {
      const result = await evaluateQuery(query, index, skillName, runs);
      onProgress?.(result);
      return result;
    })
  );
  return summarize(results);
}
