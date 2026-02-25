// pipeline/preprocess.ts
import fs from "fs";
import path from "path";

const projectRoot = process.cwd();
const videosRoot = path.join(projectRoot, "public", "videos", "converted");
const audioRoot = path.join(projectRoot, "public", "audio");
const outputPath = path.join(projectRoot, "pipeline", "cache", "manifest.json");

const categories = ["work", "nature", "daily"];

// シーン時間比率
const sceneWeights = [1,2,2,2,2,3];
const sceneNames = ["HOOK","PROBLEM","AGITATE","SOLUTION","BENEFIT","CTA"];
const sceneSpeed = [1.15,1.08,1.03,1.10,1.12,1.08]; // 倍速

// ------------------------
// 🎥 ランダム動画選択
// ------------------------
function pickRandomVideos(category: string, count: number) {
  const dir = path.join(videosRoot, category);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f=>f.endsWith(".mp4"));
  // 同一動画重複なし
  const shuffled = files.sort(()=>Math.random()-0.5);
  return shuffled.slice(0,count).map(f=>({src: `/videos/converted/${category}/${f}`}));
}

// ------------------------
// 🔊 音声取得
// ------------------------
let audioFile: string | undefined;
if (fs.existsSync(audioRoot)) {
  const audios = fs.readdirSync(audioRoot).filter(f=>f.endsWith(".mp3")||f.endsWith(".wav"));
  if (audios.length>0) audioFile = `/audio/${audios[0]}`;
}

// ------------------------
// ⏱ duration（固定 or ffmpegで後から自動取得可）
// ------------------------
const durationSeconds = 26.6;

const scenes = sceneNames.map((name,i)=>({
  name,
  durationFrames: Math.floor(durationSeconds * sceneWeights[i] / sceneWeights.reduce((a,b)=>a+b,0) * 30),
  videos: pickRandomVideos(categories[i%categories.length], 1)
}));

const manifest = {
  scriptHash: "prod",
  duration: durationSeconds,
  fps: 30,
  totalFrames: Math.floor(durationSeconds*30),
  scenes,
  audio: audioFile ? {src: audioFile} : undefined
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(manifest,null,2));
console.log("✅ manifest生成完了");