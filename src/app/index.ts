#!/usr/bin/env node
import { cli } from "gunshi";
import evalCmd from "../features/evaluate/index.js";
import generateQueriesCmd from "../features/generate-queries/index.js";
import optimizeCmd from "../features/optimize/index.js";
import pkg from "../../package.json" with { type: "json" };

await cli(
  process.argv.slice(2),
  { name: pkg.name },
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
