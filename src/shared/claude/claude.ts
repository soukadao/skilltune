import { mkdirSync, mkdtempSync, writeFileSync, rmSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { query } from "@anthropic-ai/claude-agent-sdk";

function getOauthToken(): string {
  const token = process.env.CLAUDE_CODE_OAUTH_TOKEN;
  if (!token) throw new Error("CLAUDE_CODE_OAUTH_TOKEN environment variable is required");
  return token;
}

let _claudePath: string | undefined;

function getClaudePath(): string {
  if (_claudePath) return _claudePath;
  const cmd = process.platform === "win32" ? "where" : "which";
  try {
    const result = execFileSync(cmd, ["claude"], { encoding: "utf-8" });
    _claudePath = result.trim().split("\n")[0];
    return _claudePath;
  } catch {
    throw new Error("claude executable not found in PATH. Please ensure Claude Code is installed.");
  }
}

export async function runClaude(prompt: string, cwd: string): Promise<string> {
  for await (const message of query({
    prompt,
    options: {
      cwd,
      settingSources: [], // Do not load CLAUDE.md so the agent runs without project-level system prompt
      pathToClaudeCodeExecutable: getClaudePath(),
      env: { CLAUDE_CODE_OAUTH_TOKEN: getOauthToken() },
    },
  })) {
    if ("result" in message && message.result) {
      return message.result as string;
    }
  }
  return "";
}

export interface SessionResult {
  result: string;
  sessionId?: string;
}

export async function runClaudeWithSession(
  prompt: string,
  cwd: string,
  sessionId?: string
): Promise<SessionResult> {
  let capturedSessionId: string | undefined;

  for await (const message of query({
    prompt,
    options: {
      cwd,
      settingSources: [],
      ...(sessionId ? { resume: sessionId } : {}),
      pathToClaudeCodeExecutable: getClaudePath(),
      env: { CLAUDE_CODE_OAUTH_TOKEN: getOauthToken() },
    },
  })) {
    if (message.type === "system" && (message as any).subtype === "init") {
      capturedSessionId = (message as any).session_id;
    }
    if ("result" in message && message.result) {
      return { result: message.result as string, sessionId: capturedSessionId };
    }
  }
  return { result: "", sessionId: capturedSessionId };
}

export async function checkSkillTriggered(
  prompt: string,
  skillFile: string,
  skillName: string
): Promise<boolean> {
  // Create an isolated eval directory under .skilltune/ so that
  // settingSources: ["project"] only loads this skill, not the project's CLAUDE.md
  const skilltuneDirBase = path.join(process.cwd(), ".skilltune");
  mkdirSync(skilltuneDirBase, { recursive: true });
  const evalDir = mkdtempSync(path.join(skilltuneDirBase, "eval-"));

  try {
    const skillDestDir = path.join(evalDir, ".claude", "skills", skillName);
    mkdirSync(skillDestDir, { recursive: true });
    writeFileSync(path.join(skillDestDir, "SKILL.md"), readFileSync(skillFile, "utf-8"));

    for await (const message of query({
      prompt,
      options: {
        cwd: evalDir,
        settingSources: ["project"],
        permissionMode: "dontAsk",
        pathToClaudeCodeExecutable: getClaudePath(),
        env: { CLAUDE_CODE_OAUTH_TOKEN: getOauthToken() },
      },
    })) {
      if (message.type === "assistant") {
        const content: unknown[] = (message as any).message?.content ?? [];
        for (const block of content) {
          if (
            typeof block === "object" &&
            block !== null &&
            "name" in block &&
            (block as any).name === "Skill" &&
            (block as any).input?.skill === skillName
          ) {
            return true;
          }
        }
      }
    }
    return false;
  } finally {
    rmSync(evalDir, { recursive: true, force: true });
  }
}


