import { loadJsonFile } from "../../shared/lib/json.js";
import { evaluateAll } from "./model.js";
export async function run(ctx) {
    const queries = loadJsonFile(ctx.values.queries);
    const result = await evaluateAll(queries, ctx.values.skill, ctx.values.runs, ctx.values.threshold, (r) => console.log(`[${r.passed ? "PASS" : "FAIL"}] rate=${r.trigger_rate.toFixed(2)} "${r.query.slice(0, 60)}..."`));
    console.log(`\nPass rate: ${result.passed}/${result.total} (${(result.pass_rate * 100).toFixed(0)}%)`);
    console.log(JSON.stringify(result, null, 2));
}
