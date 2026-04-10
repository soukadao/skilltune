import { define } from "gunshi/definition";

export default define({
  name: "optimize",
  description: "Run the full description optimization loop",
  args: {
    skill: {
      type: "string",
      description: "Skill name (resolves to .claude/skills/<name>)",
    },
    queries: {
      type: "string",
      description: "Path to queries JSON file (optional, generates if omitted)",
    },
    runs: {
      type: "number",
      description: "Number of runs per query",
      default: 3,
    },
    "max-iterations": {
      type: "number",
      description: "Max optimization iterations",
      default: 5,
    },
    "train-ratio": {
      type: "number",
      description: "Train/validation split ratio",
      default: 0.6,
    },
    count: {
      type: "number",
      description: "Number of queries to generate (if --queries omitted)",
      default: 20,
    },
    patience: {
      type: "number",
      description: "Early stopping: halt if validation does not improve for this many iterations",
      default: 3,
    },
  },
});
