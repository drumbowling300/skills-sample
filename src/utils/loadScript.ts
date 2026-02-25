// utils/loadScript.ts
import fs from "fs";
import path from "path";

export const loadScriptBlocks = (fileName: string) => {
  const filePath = path.resolve(`scripts/${fileName}`);
  const raw = fs.readFileSync(filePath, "utf-8");

  const blocks = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (blocks.length !== 6) {
    throw new Error(
      `台本は6ブロック必要です。現在: ${blocks.length}ブロック`
    );
  }

  return blocks;
};
