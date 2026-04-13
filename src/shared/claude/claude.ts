import { query } from "@anthropic-ai/claude-agent-sdk";

function getOauthToken(): string {
  const token = process.env.CLAUDE_CODE_OAUTH_TOKEN;
  if (!token) throw new Error("CLAUDE_CODE_OAUTH_TOKEN environment variable is required");
  return token;
}

export async function runClaude(prompt: string, cwd: string): Promise<string> {
  for await (const message of query({
    prompt,
    options: {
      cwd,
      settingSources: [], // Do not load CLAUDE.md so the agent runs without project-level system prompt
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
  cwd: string,
  skillName: string
): Promise<boolean> {
  for await (const message of query({
    prompt,
    options: {
      cwd,
      settingSources: ["project"], // Load skills so Claude can trigger them
      permissionMode: "dontAsk",
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
}


