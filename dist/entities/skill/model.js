import { readFileSync, writeFileSync } from "node:fs";
export function parseSkill(content) {
    const nameMatch = content.match(/^name:\s*(.+)$/m);
    const descMatch = content.match(/description:\s*[>|]?\s*\n?([\s\S]*?)(?=\n\w+:|---)/);
    return {
        name: nameMatch?.[1]?.trim() ?? "",
        description: descMatch?.[1]?.trim().replace(/^\s+/gm, "") ?? "",
        content,
    };
}
export function readSkill(filePath) {
    return parseSkill(readFileSync(filePath, "utf-8"));
}
export function applyDescriptionChange(content, newDescription) {
    return content.replace(/(description:\s*)[>|]?\s*\n?[\s\S]*?(?=\n\w+:|---)/, `$1>\n  ${newDescription.replace(/\n/g, "\n  ")}\n`);
}
export function writeSkill(filePath, content) {
    writeFileSync(filePath, content);
}
