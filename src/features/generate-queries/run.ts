import type { CommandContext, ExtractArgs } from "gunshi";
import { generateQueries, saveQueries } from "./model.js";
import { resolveSkillFile } from "../../entities/skill/index.js";
import type meta from "./meta.js";

type Ctx = CommandContext<{ args: ExtractArgs<typeof meta>; extensions: {} }>;

export async function run(ctx: Ctx): Promise<void> {
  if (!ctx.values.skill) throw new Error("--skill is required");
  const skillFile = resolveSkillFile(ctx.values.skill);
  console.log(`Generating ${ctx.values.count} queries from ${skillFile}...`);

  const queries = await generateQueries(skillFile, ctx.values.count);
  saveQueries(queries, ctx.values.output);

  console.log(`Generated ${queries.length} queries → ${ctx.values.output}`);
}
