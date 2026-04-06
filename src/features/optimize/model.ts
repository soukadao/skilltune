import { writeFileSync } from "node:fs";
import { runClaude, extractLastAssistantText } from "../../shared/claude/index.js";
import { splitQueries } from "../../entities/query/index.js";
import { readSkill, parseSkill, applyDescriptionChange } from "../../entities/skill/index.js";
import { evaluateAll } from "../evaluate/model.js";
import type { Query } from "../../entities/query/index.js";
import type { QueryResult } from "../../entities/result/index.js";

interface DescriptionAttempt {
  description: string;
  trainPassRate: number;
}

function extractDescription(text: string, fallback: string): string {
  const match = text.match(/<description>\s*([\s\S]*?)\s*<\/description>/);
  return match?.[1]?.trim() ?? fallback;
}

async function shortenDescription(desc: string): Promise<string> {
  const prompt = `This skill description exceeds 1024 characters (current: ${desc.length}).
Rewrite it to be under 1024 characters while preserving the core trigger conditions.

Description:
${desc}

Wrap the result in <description> tags.`;

  const output = await runClaude(prompt);
  const text = extractLastAssistantText(output) ?? "";
  return extractDescription(text, desc);
}

async function proposeDescription(
  currentDesc: string,
  failures: QueryResult[],
  skillContent: string,
  history: DescriptionAttempt[]
): Promise<string> {
  const shouldFail = failures.filter((f) => f.should_trigger);
  const shouldNotFail = failures.filter((f) => !f.should_trigger);

  const historySection =
    history.length > 0
      ? `\nPrevious attempts (do not repeat these):
${history
  .map(
    (h, i) =>
      `Attempt ${i + 1} (train pass rate: ${(h.trainPassRate * 100).toFixed(0)}%):\n${h.description}`
  )
  .join("\n\n")}
`
      : "";

  const prompt = `Optimize this Claude Code skill description for better trigger accuracy.

Current description:
${currentDesc}

SKILL.md:
${skillContent}
${historySection}
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
- Be slightly "pushy": Claude tends to undertrigger skills, so lean toward broader trigger conditions rather than narrow ones
- Apply Theory of Mind: briefly explain *why* this skill is the right tool (e.g. "Use this skill when X, because it provides Y") — this helps Claude reason about intent rather than match keywords

Wrap the new description in <description> tags like this:
<description>
Your new description here
</description>`;

  const output = await runClaude(prompt);
  const text = extractLastAssistantText(output) ?? "";
  let description = extractDescription(text, currentDesc);

  if (description.length > 1024) {
    description = await shortenDescription(description);
  }

  return description;
}

export interface OptimizeLoopConfig {
  skillFile: string;
  skillName: string;
  runs: number;
  maxIterations: number;
  threshold: number;
  trainRatio: number;
  patience: number;
}

export interface OptimizeResult {
  bestDescription: string;
  bestValidationRate: number;
  totalIterations: number;
}

export async function runOptimizeLoop(
  config: OptimizeLoopConfig,
  queries: Query[],
  onProgress: (msg: string) => void
): Promise<OptimizeResult> {
  const { skillFile, skillName, runs, maxIterations, threshold, trainRatio, patience } = config;
  const { train, validation } = splitQueries(queries, trainRatio);
  onProgress(`Split: ${train.length} train / ${validation.length} validation`);

  let skillContent = readSkill(skillFile).content;
  let best: { validationRate: number; description: string; content: string } | undefined;
  let noImprovementCount = 0;
  let totalIterations = maxIterations;
  const history: DescriptionAttempt[] = [];

  for (let iter = 1; iter <= maxIterations; iter++) {
    const { description } = parseSkill(skillContent);
    onProgress(`\n=== Iteration ${iter}/${maxIterations} ===`);
    onProgress(`Description (${description.length} chars):\n${description}`);

    const [trainResult, valResult] = await Promise.all([
      evaluateAll(train, skillName, runs, threshold, (r) => {
        onProgress(
          `[TRAIN][${r.passed ? "PASS" : "FAIL"}] rate=${r.trigger_rate.toFixed(2)} "${r.query.slice(0, 60)}..."`
        );
      }),
      evaluateAll(validation, skillName, runs, threshold),
    ]);

    onProgress(
      `Train: ${trainResult.passed}/${trainResult.total} (${(trainResult.pass_rate * 100).toFixed(0)}%)`
    );
    onProgress(
      `Validation: ${valResult.passed}/${valResult.total} (${(valResult.pass_rate * 100).toFixed(0)}%)`
    );

    if (best === undefined || valResult.pass_rate > best.validationRate) {
      best = { validationRate: valResult.pass_rate, description, content: skillContent };
      noImprovementCount = 0;
    } else {
      noImprovementCount++;
    }

    if (trainResult.pass_rate === 1.0 || iter === maxIterations) {
      totalIterations = iter;
      break;
    }

    if (noImprovementCount >= patience) {
      totalIterations = iter;
      onProgress(`Early stopping: validation has not improved for ${patience} iterations`);
      break;
    }

    const failures = trainResult.results.filter((r) => !r.passed);
    const newDesc = await proposeDescription(description, failures, skillContent, history);
    history.push({ description, trainPassRate: trainResult.pass_rate });
    skillContent = applyDescriptionChange(skillContent, newDesc);
    writeFileSync(skillFile, skillContent);
  }

  const finalBest = best!;
  writeFileSync(skillFile, finalBest.content);
  return {
    bestDescription: finalBest.description,
    bestValidationRate: finalBest.validationRate,
    totalIterations,
  };
}
