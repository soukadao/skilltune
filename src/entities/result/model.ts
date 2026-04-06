export interface QueryResult {
  query: string;
  should_trigger: boolean;
  triggers: number;
  runs: number;
  trigger_rate: number;
  passed: boolean;
}

export interface EvalResult {
  results: QueryResult[];
  pass_rate: number;
  total: number;
  passed: number;
}

export function summarize(results: QueryResult[]): EvalResult {
  const passed = results.filter((r) => r.passed).length;
  return {
    results,
    pass_rate: results.length === 0 ? 0 : passed / results.length,
    total: results.length,
    passed,
  };
}
