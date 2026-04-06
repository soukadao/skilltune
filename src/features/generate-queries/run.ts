import type { CommandContext, ExtractArgs } from "gunshi";
import { generateQueries, saveQueries } from "./model.js";
import type meta from "./meta.js";

type Ctx = CommandContext<{ args: ExtractArgs<typeof meta>; extensions: {} }>;

export async function run(ctx: Ctx): Promise<void> {
  console.log(`Generating ${ctx.values.count} queries from ${ctx.values["skill-file"]}...`);

  const queries = await generateQueries(ctx.values["skill-file"], ctx.values.count);
  saveQueries(queries, ctx.values.output);

  console.log(`Generated ${queries.length} queries → ${ctx.values.output}`);
}
