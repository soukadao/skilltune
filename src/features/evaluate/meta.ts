import { define } from "gunshi/definition";

export default define({
  name: "eval",
  description: "Evaluate trigger rates for a query set",
  args: {
    skill: {
      type: "string",
      description: "Skill name (resolves to .claude/skills/<name>)",
    },
    queries: {
      type: "string",
      description: "Path to queries JSON file",
      default: "queries.json",
    },
    runs: {
      type: "number",
      description: "Number of runs per query",
      default: 3,
    },
  },
});
