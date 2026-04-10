import type { CommandContext, ExtractArgs } from "gunshi";
import { loadJsonFile } from "../../shared/lib/json.js";
import { runOptimizeLoop } from "./model.js";
import { generateQueries } from "../generate-queries/model.js";
import { resolveSkillFile } from "../../entities/skill/index.js";
import type { Query } from "../../entities/query/index.js";
import type meta from "./meta.js";

type Ctx = CommandContext<{ args: ExtractArgs<typeof meta>; extensions: {} }>;

export async function run(ctx: Ctx): Promise<void> {
  if (!ctx.values.skill) throw new Error("--skill is required");
  const skillFile = resolveSkillFile(ctx.values.skill);
  let queries: Query[];

  if (ctx.values.queries) {
    queries = loadJsonFile<Query[]>(ctx.values.queries);
    console.log(`Loaded ${queries.length} queries from ${ctx.values.queries}`);
  } else {
    console.log(`Generating ${ctx.values.count} queries from ${skillFile}...`);
    queries = await generateQueries(skillFile, ctx.values.count);
    console.log(`Generated ${queries.length} queries`);
  }

  const result = await runOptimizeLoop(
    {
      skillFile,
      runs: ctx.values.runs,
      maxIterations: ctx.values["max-iterations"],
      trainRatio: ctx.values["train-ratio"],
      patience: ctx.values.patience,
    },
    queries,
    console.log
  );

  console.log(`\n=== Result ===`);
  console.log(`Best validation score: ${(result.bestValidationScore * 100).toFixed(0)}%`);
  console.log(`Best description:\n${result.bestDescription}`);
  console.log(`\nUpdated ${skillFile}`);
}
