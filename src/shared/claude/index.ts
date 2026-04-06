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
  let stdout: string;
  try {
    ({ stdout } = await execFileAsync(
      "claude",
      ["-p", prompt, "--output-format", "stream-json", "--verbose"],
      { maxBuffer: 10 * 1024 * 1024 }
    ));
  } catch (err: any) {
    if (!err.stdout) throw err;
    stdout = err.stdout;
  }
  const events: any[] = stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const resultEvent = events.find((e) => e.type === "result");
  if (resultEvent?.is_error) {
    throw new Error(`Claude error: ${resultEvent.result}`);
  }
  const messages: Message[] = events
    .filter((e) => e.type === "assistant")
    .map((e) => e.message);
  return { messages };
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
