export interface QueryResult {
  index: number;
  query: string;
  should_trigger: boolean;
  triggers: number;
  runs: number;
  trigger_rate: number;
}

export interface EvalResult {
  results: QueryResult[];
  positive_rate: number;
  misuse_rate: number;
  failed_indices: number[];
}

export function summarize(results: QueryResult[]): EvalResult {
  const trueResults = results.filter((r) => r.should_trigger);
  const falseResults = results.filter((r) => !r.should_trigger);

  const positive_rate =
    trueResults.length === 0
      ? 0
      : trueResults.reduce((sum, r) => sum + r.triggers, 0) /
        trueResults.reduce((sum, r) => sum + r.runs, 0);

  const misuse_rate =
    falseResults.length === 0
      ? 0
      : falseResults.reduce((sum, r) => sum + r.triggers, 0) /
        falseResults.reduce((sum, r) => sum + r.runs, 0);

  const failed_indices = results
    .filter((r) => (r.should_trigger ? r.triggers === 0 : r.triggers > 0))
    .map((r) => r.index);

  return {
    results,
    positive_rate,
    misuse_rate,
    failed_indices,
  };
}
