import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

export interface Skill {
  name: string;
  description: string;
  content: string;
}

export function parseSkill(content: string): Skill {
  const nameMatch = content.match(/^name:\s*(.+)$/m);
  const descMatch = content.match(/description:\s*[>|]?\s*\n?([\s\S]*?)(?=\n\w+:|---)/);
  return {
    name: nameMatch?.[1]?.trim() ?? "",
    description: descMatch?.[1]?.trim().replace(/^\s+/gm, "") ?? "",
    content,
  };
}

export function readSkill(filePath: string): Skill {
  return parseSkill(readFileSync(filePath, "utf-8"));
}

export function applyDescriptionChange(content: string, newDescription: string): string {
  return content.replace(
    /(description:\s*)[>|]?\s*\n?[\s\S]*?(?=\n\w+:|---)/,
    `$1>\n  ${newDescription.replace(/\n/g, "\n  ")}\n`
  );
}

export function writeSkill(filePath: string, content: string): void {
  writeFileSync(filePath, content);
}

export function resolveSkillFile(skillDir: string): string {
  // If the input looks like a path (absolute, or contains a separator), treat it directly
  if (path.isAbsolute(skillDir) || skillDir.includes(path.sep) || skillDir.includes("/")) {
    const dirSkill = path.join(skillDir, "SKILL.md");
    if (existsSync(dirSkill)) return dirSkill;
    throw new Error(`SKILL.md not found in directory: ${skillDir}`);
  }
  // Name-based resolution: look under .claude/skills/<name>
  const base = path.join(".claude", "skills", skillDir);
  const dirSkill = path.join(base, "SKILL.md");
  if (existsSync(dirSkill)) return dirSkill;
  if (existsSync(base)) return base;
  const withMd = base + ".md";
  if (existsSync(withMd)) return withMd;
  throw new Error(`Skill file not found: ${base}`);
}
