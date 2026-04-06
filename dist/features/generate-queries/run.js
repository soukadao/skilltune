import { generateQueries, saveQueries } from "./model.js";
export async function run(ctx) {
    console.log(`Generating ${ctx.values.count} queries from ${ctx.values["skill-file"]}...`);
    const queries = await generateQueries(ctx.values["skill-file"], ctx.values.count);
    saveQueries(queries, ctx.values.output);
    console.log(`Generated ${queries.length} queries → ${ctx.values.output}`);
}
