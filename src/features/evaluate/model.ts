import { checkSkillTriggered } from "../../shared/claude/index.js";
import { summarize } from "../../entities/result/index.js";
import type { Query } from "../../entities/query/index.js";
import type { QueryResult, EvalResult } from "../../entities/result/index.js";

export async function evaluateQuery(
  query: Query,
  index: number,
  skillName: string,
  runs: number,
  skillFile: string
): Promise<QueryResult> {
  const results = await Promise.all(
    Array.from({ length: runs }, () => checkSkillTriggered(query.query, skillFile, skillName))
  );
  const triggers = results.filter(Boolean).length;
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
  onProgress?: (result: QueryResult) => void,
  skillFile: string = ""
): Promise<EvalResult> {
  const results = await Promise.all(
    queries.map(async (query, index) => {
      const result = await evaluateQuery(query, index, skillName, runs, skillFile);
      onProgress?.(result);
      return result;
    })
  );
  return summarize(results);
}
