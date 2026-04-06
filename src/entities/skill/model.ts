import { readFileSync, writeFileSync } from "node:fs";

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
