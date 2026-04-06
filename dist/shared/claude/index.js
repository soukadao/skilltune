import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);
export async function runClaude(prompt) {
    const { stdout } = await execFileAsync("claude", ["-p", prompt, "--output-format", "json"], { maxBuffer: 10 * 1024 * 1024 });
    return JSON.parse(stdout);
}
export function isSkillTriggered(output, skillName) {
    for (const message of output.messages) {
        const content = Array.isArray(message.content) ? message.content : [];
        for (const item of content) {
            if (item.type === "tool_use" &&
                item.name === "Skill" &&
                item.input?.["skill"] === skillName) {
                return true;
            }
        }
    }
    return false;
}
export function extractLastAssistantText(output) {
    const last = [...output.messages].reverse().find((m) => m.role === "assistant");
    if (!last)
        return undefined;
    if (Array.isArray(last.content)) {
        return last.content.find((c) => c.type === "text")?.text;
    }
    return last.content;
}
