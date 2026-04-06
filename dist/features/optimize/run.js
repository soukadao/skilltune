import { loadJsonFile } from "../../shared/lib/json.js";
import { runOptimizeLoop } from "./model.js";
import { generateQueries } from "../generate-queries/model.js";
export async function run(ctx) {
    let queries;
    if (ctx.values.queries) {
        queries = loadJsonFile(ctx.values.queries);
        console.log(`Loaded ${queries.length} queries from ${ctx.values.queries}`);
    }
    else {
        console.log(`Generating ${ctx.values.count} queries from ${ctx.values["skill-file"]}...`);
        queries = await generateQueries(ctx.values["skill-file"], ctx.values.count);
        console.log(`Generated ${queries.length} queries`);
    }
    const result = await runOptimizeLoop({
        skillFile: ctx.values["skill-file"],
        skillName: ctx.values.skill,
        runs: ctx.values.runs,
        maxIterations: ctx.values["max-iterations"],
        threshold: ctx.values.threshold,
        trainRatio: ctx.values["train-ratio"],
    }, queries, console.log);
    console.log(`\n=== Result ===`);
    console.log(`Best validation rate: ${(result.bestValidationRate * 100).toFixed(0)}%`);
    console.log(`Best description:\n${result.bestDescription}`);
    console.log(`\nUpdated ${ctx.values["skill-file"]}`);
}
