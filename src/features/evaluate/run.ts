import type { CommandContext, ExtractArgs } from "gunshi";
import { loadJsonFile } from "../../shared/lib/json.js";
import { resolveSkillFile, readSkill, parseSkill } from "../../entities/skill/index.js";
import { evaluateAll } from "./model.js";
import type { Query } from "../../entities/query/index.js";
import type { QueryResult } from "../../entities/result/index.js";
import type meta from "./meta.js";

type Ctx = CommandContext<{ args: ExtractArgs<typeof meta>; extensions: {} }>;

export async function run(ctx: Ctx): Promise<void> {
  if (!ctx.values.skill) throw new Error("--skill is required");
  const skillFile = resolveSkillFile(ctx.values.skill);
  const skillName = parseSkill(readSkill(skillFile).content).name;
  const queries = loadJsonFile<Query[]>(ctx.values.queries);

  console.log(`Evaluating skill: ${skillName} (${skillFile})`);

  const result = await evaluateAll(
    queries,
    skillName,
    ctx.values.runs,
    (r: QueryResult) =>
      console.log(
        `[${r.index}] trigger_rate=${r.trigger_rate.toFixed(2)} "${r.query.slice(0, 60)}..."`
      ),
    skillFile
  );

  console.log(`\nPositive rate: ${(result.positive_rate * 100).toFixed(0)}%`);
  console.log(`Misuse rate: ${(result.misuse_rate * 100).toFixed(0)}%`);
  console.log(
    `Failed indices: ${result.failed_indices.length > 0 ? result.failed_indices.join(", ") : "none"}`
  );
  console.log(JSON.stringify(result, null, 2));
}
