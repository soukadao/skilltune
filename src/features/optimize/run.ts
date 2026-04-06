import type { CommandContext, ExtractArgs } from "gunshi";
import { loadJsonFile } from "../../shared/lib/json.js";
import { runOptimizeLoop } from "./model.js";
import { generateQueries } from "../generate-queries/model.js";
import type { Query } from "../../entities/query/index.js";
import type meta from "./meta.js";

type Ctx = CommandContext<{ args: ExtractArgs<typeof meta>; extensions: {} }>;

export async function run(ctx: Ctx): Promise<void> {
  let queries: Query[];

  if (ctx.values.queries) {
    queries = loadJsonFile<Query[]>(ctx.values.queries);
    console.log(`Loaded ${queries.length} queries from ${ctx.values.queries}`);
  } else {
    console.log(`Generating ${ctx.values.count} queries from ${ctx.values["skill-file"]}...`);
    queries = await generateQueries(ctx.values["skill-file"], ctx.values.count);
    console.log(`Generated ${queries.length} queries`);
  }

  const result = await runOptimizeLoop(
    {
      skillFile: ctx.values["skill-file"],
      skillName: ctx.values.skill,
      runs: ctx.values.runs,
      maxIterations: ctx.values["max-iterations"],
      threshold: ctx.values.threshold,
      trainRatio: ctx.values["train-ratio"],
      patience: ctx.values.patience,
    },
    queries,
    console.log
  );

  console.log(`\n=== Result ===`);
  console.log(`Best validation rate: ${(result.bestValidationRate * 100).toFixed(0)}%`);
  console.log(`Best description:\n${result.bestDescription}`);
  console.log(`\nUpdated ${ctx.values["skill-file"]}`);
}
