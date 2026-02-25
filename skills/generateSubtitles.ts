import * as fs from "fs";
import * as path from "path";

// ----------------- 設定 -----------------
const scenes = [
  { name: "hook", maxVideos: 3 },
  { name: "problem", maxVideos: 3 },
  { name: "solution", maxVideos: 3 },
  { name: "extra", maxVideos: 3 },
  { name: "cta", maxVideos: 3 }
];

const basePath = __dirname;
const videoBasePath = path.join(basePath, "public/videos");
const subtitlePath = path.join(basePath, "public/subtitles");
const txtFile = path.join(subtitlePath, "script.txt"); // 台本ファイル
const outputJsonFile = path.join(subtitlePath, "script_001.json");

// Hook字幕スタイル
const hookStyle = {
  color: "#FF4500",
  fontWeight: "600",
  fontSize: "1.15em",
  fadeIn: 0.2,
  scale: 1.03
};

// 1行あたりの秒数（素材や尺に応じて調整可）
const durationPerLine = 2.5;

// ----------------- 台本読み込み -----------------
if (!fs.existsSync(txtFile)) {
  console.error("台本ファイルが存在しません:", txtFile);
  process.exit(1);
}

const txtData = fs.readFileSync(txtFile, "utf-8");
const lines = txtData.split("\n").filter(l => l.trim() !== "");

// ----------------- JSON生成 -----------------
const jsonOutput: any[] = [];
let timeCursor = 0;
let lineIdx = 0;

for (const scene of scenes) {
  const sceneDir = path.join(videoBasePath, `0${scenes.indexOf(scene) + 1}_${scene.name}`);
  if (!fs.existsSync(sceneDir)) {
    console.warn("動画フォルダが存在しません:", sceneDir);
    continue;
  }

  const videoFiles = fs.readdirSync(sceneDir)
    .filter(f => f.endsWith(".mp4"))
    .sort()
    .slice(0, scene.maxVideos);

  for (const vid of videoFiles) {
    if (lineIdx >= lines.length) break;

    jsonOutput.push({
      scene: scene.name,
      video: `videos/${scene.name}/${vid}`,
      start: timeCursor,
      end: timeCursor + durationPerLine,
      text: lines[lineIdx],
      style: scene.name === "hook" ? hookStyle : {}
    });

    timeCursor += durationPerLine;
    lineIdx++;
  }
}

// ----------------- JSON出力 -----------------
fs.writeFileSync(outputJsonFile, JSON.stringify(jsonOutput, null, 2));
console.log("✅ JSON字幕生成完了:", outputJsonFile);
