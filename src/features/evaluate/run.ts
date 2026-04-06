import type { CommandContext, ExtractArgs } from "gunshi";
import { loadJsonFile } from "../../shared/lib/json.js";
import { evaluateAll } from "./model.js";
import type { Query } from "../../entities/query/index.js";
import type { QueryResult } from "../../entities/result/index.js";
import type meta from "./meta.js";

type Ctx = CommandContext<{ args: ExtractArgs<typeof meta>; extensions: {} }>;

export async function run(ctx: Ctx): Promise<void> {
  const queries = loadJsonFile<Query[]>(ctx.values.queries);

  const result = await evaluateAll(
    queries,
    ctx.values.skill,
    ctx.values.runs,
    ctx.values.threshold,
    (r: QueryResult) =>
      console.log(
        `[${r.passed ? "PASS" : "FAIL"}] rate=${r.trigger_rate.toFixed(2)} "${r.query.slice(0, 60)}..."`
      )
  );

  console.log(
    `\nPass rate: ${result.passed}/${result.total} (${(result.pass_rate * 100).toFixed(0)}%)`
  );
  console.log(JSON.stringify(result, null, 2));
}
