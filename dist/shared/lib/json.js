import { readFileSync } from "node:fs";
export function loadJsonFile(filePath) {
    return JSON.parse(readFileSync(filePath, "utf-8"));
}
