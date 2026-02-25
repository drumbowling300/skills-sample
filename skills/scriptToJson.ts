import * as fs from "fs";
import * as path from "path";

// --- 設定 ---
const scenes = [
  { name: "hook", maxVideos: 3 },
  { name: "problem", maxVideos: 3 },
  { name: "solution", maxVideos: 3 },
  { name: "extra", maxVideos: 3 },
  { name: "cta", maxVideos: 3 }
];

const videoBasePath = path.join(__dirname, "public/videos");
const subtitlePath = path.join(__dirname, "public/subtitles");
const txtFile = path.join(subtitlePath, "script.txt");
const outputJsonFile = path.join(subtitlePath, "script_001.json");

// フック字幕スタイル
const hookStyle = {
  color: "#FF4500",
  fontWeight: "600",
  fontSize: "1.15em",
  fadeIn: 0.2,
  scale: 1.03
};

// --- txt 読み込み ---
const txtData = fs.readFileSync(txtFile, "utf-8");
const lines = txtData.split("\n").filter(l => l.trim() !== "");

// --- JSON生成 ---
const jsonOutput: any[] = [];
let timeCursor = 0;
let lineIdx = 0;

for (const scene of scenes) {
  const sceneDir = path.join(videoBasePath, `0${scenes.indexOf(scene)+1}_${scene.name}`);
  if (!fs.existsSync(sceneDir)) continue;

  // 動画ファイルを昇順で取得
  const videoFiles = fs.readdirSync(sceneDir)
    .filter(f => f.endsWith(".mp4"))
    .sort()
    .slice(0, scene.maxVideos); // 最大本数制限

  for (const vid of videoFiles) {
    const durationPerLine = 2.5; // 1行あたりの秒数（調整可）
    if (lineIdx >= lines.length) break;

    const subtitle: any = {
      scene: scene.name,
      video: `videos/${scene.name}/${vid}`,
      start: timeCursor,
      end: timeCursor + durationPerLine,
      text: lines[lineIdx],
      style: scene.name === "hook" ? hookStyle : {}
    };

    jsonOutput.push(subtitle);

    timeCursor += durationPerLine;
    lineIdx++;
  }
}

// --- JSON出力 ---
fs.writeFileSync(outputJsonFile, JSON.stringify(jsonOutput, null, 2));
console.log("JSON字幕生成完了:", outputJsonFile);
