import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

interface ContentBlock {
  type: "text" | "tool_use" | "tool_result";
  text?: string;
  name?: string;
  input?: Record<string, unknown>;
}

interface Message {
  role: "user" | "assistant";
  content: ContentBlock[] | string;
}

export interface ClaudeOutput {
  messages: Message[];
}

export async function runClaude(prompt: string): Promise<ClaudeOutput> {
  const { stdout } = await execFileAsync(
    "claude",
    ["-p", prompt, "--output-format", "json"],
    { maxBuffer: 10 * 1024 * 1024 }
  );
  return JSON.parse(stdout) as ClaudeOutput;
}

export function isSkillTriggered(output: ClaudeOutput, skillName: string): boolean {
  for (const message of output.messages) {
    const content = Array.isArray(message.content) ? message.content : [];
    for (const item of content) {
      if (
        item.type === "tool_use" &&
        item.name === "Skill" &&
        item.input?.["skill"] === skillName
      ) {
        return true;
      }
    }
  }
  return false;
}

export function extractLastAssistantText(output: ClaudeOutput): string | undefined {
  const last = [...output.messages].reverse().find((m) => m.role === "assistant");
  if (!last) return undefined;
  if (Array.isArray(last.content)) {
    return last.content.find((c) => c.type === "text")?.text;
  }
  return last.content;
}
