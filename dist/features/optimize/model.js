import { writeFileSync } from "node:fs";
import { runClaude, extractLastAssistantText } from "../../shared/claude/index.js";
import { splitQueries } from "../../entities/query/index.js";
import { readSkill, parseSkill, applyDescriptionChange } from "../../entities/skill/index.js";
import { evaluateAll } from "../evaluate/model.js";
async function proposeDescription(currentDesc, failures, skillContent) {
    const shouldFail = failures.filter((f) => f.should_trigger);
    const shouldNotFail = failures.filter((f) => !f.should_trigger);
    const prompt = `Optimize this Claude Code skill description for better trigger accuracy.

Current description:
${currentDesc}

SKILL.md:
${skillContent}

Training failures:
- Should have triggered but didn't (${shouldFail.length}):
${shouldFail.map((f) => `  - "${f.query}"`).join("\n")}
- Should NOT have triggered but did (${shouldNotFail.length}):
${shouldNotFail.map((f) => `  - "${f.query}"`).join("\n")}

Rules:
- Use imperative phrasing ("Use this skill when...")
- Focus on user intent, not implementation
- Under 1024 characters
- Do NOT overfit to specific failed queries — generalize the pattern

Return ONLY the new description text, no explanation.`;
    const output = await runClaude(prompt);
    return extractLastAssistantText(output)?.trim() ?? currentDesc;
}
export async function runOptimizeLoop(config, queries, onProgress) {
    const { skillFile, skillName, runs, maxIterations, threshold, trainRatio } = config;
    const { train, validation } = splitQueries(queries, trainRatio);
    onProgress(`Split: ${train.length} train / ${validation.length} validation`);
    let skillContent = readSkill(skillFile).content;
    let best;
    for (let iter = 1; iter <= maxIterations; iter++) {
        const { description } = parseSkill(skillContent);
        onProgress(`\n=== Iteration ${iter}/${maxIterations} ===`);
        onProgress(`Description (${description.length} chars):\n${description}`);
        const [trainResult, valResult] = await Promise.all([
            evaluateAll(train, skillName, runs, threshold, (r) => {
                onProgress(`[TRAIN][${r.passed ? "PASS" : "FAIL"}] rate=${r.trigger_rate.toFixed(2)} "${r.query.slice(0, 60)}..."`);
            }),
            evaluateAll(validation, skillName, runs, threshold),
        ]);
        onProgress(`Train: ${trainResult.passed}/${trainResult.total} (${(trainResult.pass_rate * 100).toFixed(0)}%)`);
        onProgress(`Validation: ${valResult.passed}/${valResult.total} (${(valResult.pass_rate * 100).toFixed(0)}%)`);
        if (best === undefined || valResult.pass_rate > best.validationRate) {
            best = { validationRate: valResult.pass_rate, description, content: skillContent };
        }
        if (trainResult.pass_rate === 1.0 || iter === maxIterations)
            break;
        const failures = trainResult.results.filter((r) => !r.passed);
        const newDesc = await proposeDescription(description, failures, skillContent);
        skillContent = applyDescriptionChange(skillContent, newDesc);
        writeFileSync(skillFile, skillContent);
    }
    const finalBest = best;
    writeFileSync(skillFile, finalBest.content);
    return {
        bestDescription: finalBest.description,
        bestValidationRate: finalBest.validationRate,
        totalIterations: maxIterations,
    };
}
