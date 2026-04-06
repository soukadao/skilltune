import { define } from "gunshi/definition";

export default define({
  name: "generate-queries",
  description: "Generate eval queries from a SKILL.md using Claude",
  args: {
    "skill-file": {
      type: "string",
      description: "Path to SKILL.md",
      default: "SKILL.md",
    },
    count: {
      type: "number",
      description: "Number of queries to generate",
      default: 20,
    },
    output: {
      type: "string",
      description: "Output file path",
      default: "queries.json",
    },
  },
});
