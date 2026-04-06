import { define } from "gunshi/definition";
export default define({
    name: "optimize",
    description: "Run the full description optimization loop",
    args: {
        "skill-file": {
            type: "string",
            description: "Path to SKILL.md",
            default: "SKILL.md",
        },
        skill: {
            type: "string",
            description: "Skill name to check for",
            default: "my-skill",
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
        threshold: {
            type: "number",
            description: "Trigger rate threshold (0.0-1.0)",
            default: 0.5,
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
    },
});
