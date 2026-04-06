import { runClaude, isSkillTriggered } from "../../shared/claude/index.js";
import { summarize } from "../../entities/result/index.js";
export async function evaluateQuery(query, skillName, runs, threshold) {
    const outputs = await Promise.all(Array.from({ length: runs }, () => runClaude(query.query)));
    const triggers = outputs.filter((o) => isSkillTriggered(o, skillName)).length;
    const trigger_rate = triggers / runs;
    const passed = query.should_trigger
        ? trigger_rate >= threshold
        : trigger_rate < threshold;
    return {
        query: query.query,
        should_trigger: query.should_trigger,
        triggers,
        runs,
        trigger_rate,
        passed,
    };
}
export async function evaluateAll(queries, skillName, runs, threshold, onProgress) {
    const results = [];
    for (const query of queries) {
        const result = await evaluateQuery(query, skillName, runs, threshold);
        results.push(result);
        onProgress?.(result);
    }
    return summarize(results);
}
