#!/usr/bin/env node
import { cli } from "gunshi";
import type { CommandContext } from "gunshi";
import evalCmd from "../features/evaluate/index.js";
import generateQueriesCmd from "../features/generate-queries/index.js";
import optimizeCmd from "../features/optimize/index.js";
import { resolveSkillFile } from "../entities/skill/index.js";
import { runOptimizeLoop } from "../features/optimize/model.js";
import { generateQueries } from "../features/generate-queries/model.js";
import pkg from "../../package.json" with { type: "json" };

await cli(
  process.argv.slice(2),
  {
    name: pkg.name,
    run: async (ctx: CommandContext) => {
      const skillDir = ctx.positionals[0];
      if (!skillDir) return; // fall through to help

      const skillFile = resolveSkillFile(skillDir); // throws if SKILL.md not found

      console.log(`Generating queries from ${skillFile}...`);
      const queries = await generateQueries(skillFile, 20);
      console.log(`Generated ${queries.length} queries`);

      const result = await runOptimizeLoop(
        { skillFile, runs: 3, maxIterations: 5, trainRatio: 0.6, patience: 3 },
        queries,
        console.log
      );

      const improvement = result.bestValidationScore - result.initialValidationScore;
      console.log(`\n=== Result ===`);
      console.log(`Initial: ${(result.initialValidationScore * 100).toFixed(0)}%`);
      console.log(`Best:    ${(result.bestValidationScore * 100).toFixed(0)}% (${improvement >= 0 ? "+" : ""}${(improvement * 100).toFixed(0)}%)`);
      console.log(`Best description:\n${result.bestDescription}`);
      console.log(`\nUpdated ${skillFile}`);
    },
  },
  {
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    subCommands: {
      eval: evalCmd,
      "generate-queries": generateQueriesCmd,
      optimize: optimizeCmd,
    },
  }
);
