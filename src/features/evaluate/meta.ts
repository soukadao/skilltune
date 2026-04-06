import { define } from "gunshi/definition";

export default define({
  name: "eval",
  description: "Evaluate trigger rates for a query set",
  args: {
    queries: {
      type: "string",
      description: "Path to queries JSON file",
      default: "queries.json",
    },
    skill: {
      type: "string",
      description: "Skill name to check for",
      default: "my-skill",
    },
    runs: {
      type: "number",
      description: "Number of runs per query",
      default: 3,
    },
    threshold: {
      type: "number",
      description: "Trigger rate threshold (0.0-1.0)",
      default: 0.5,
    },
  },
});
