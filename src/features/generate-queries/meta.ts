import { define } from "gunshi/definition";

export default define({
  name: "generate-queries",
  description: "Generate eval queries from a skill using Claude",
  args: {
    skill: {
      type: "string",
      description: "Skill name (resolves to .claude/skills/<name>)",
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
