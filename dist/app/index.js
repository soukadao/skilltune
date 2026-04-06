#!/usr/bin/env node
import { cli } from "gunshi";
import evalCmd from "../features/evaluate/index.js";
import generateQueriesCmd from "../features/generate-queries/index.js";
import optimizeCmd from "../features/optimize/index.js";
await cli(process.argv.slice(2), { name: "skilltune" }, {
    name: "skilltune",
    description: "Optimize Claude skill descriptions for reliable triggering",
    version: "0.1.0",
    subCommands: {
        eval: evalCmd,
        "generate-queries": generateQueriesCmd,
        optimize: optimizeCmd,
    },
});
