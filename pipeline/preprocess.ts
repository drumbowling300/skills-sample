import fs from "fs";
import path from "path";

const projectRoot = process.cwd();
const videosRoot = path.join(projectRoot, "public", "videos", "converted");
const audioRoot = path.join(projectRoot, "public", "audio");
const outputPath = path.join(projectRoot, "pipeline", "cache", "manifest.json");

// シーンとカテゴリは固定
const categories = ["work", "nature", "daily"];
const scenesCount = 6;
const fps = 30;

// ------------------------
// シーンごとの動画を選択
// ------------------------
type Scene = {
  durationFrames: number;
  videos: { src: string }[];
};

const scenes: Scene[] = [];

for (let i = 0; i < scenesCount; i++) {
  // ランダムカテゴリ選択
  const category = categories[i % categories.length];
  const categoryPath = path.join(videosRoot, category);
  const videoFiles = fs.readdirSync(categoryPath).filter((f) => f.endsWith(".mp4"));

  if (videoFiles.length === 0) {
    console.error(`❌ No mp4 found in ${categoryPath}`);
    process.exit(1);
  }

  // ランダム動画1本選択
  const selectedVideo = videoFiles[Math.floor(Math.random() * videoFiles.length)];
  scenes.push({
    durationFrames: fps * 26, // 固定26秒、後で自動取得も可能
    videos: [{ src: `/videos/converted/${category}/${selectedVideo}` }],
  });
}

// ------------------------
// 音声選択（基本1ファイル）
const audioFile = fs.existsSync(audioRoot)
  ? fs.readdirSync(audioRoot).find((f) => f.endsWith(".mp3") || f.endsWith(".wav"))
  : null;

// ------------------------
// manifest 作成
const manifest = {
  scriptHash: "prod",
  duration: 26.6, // 秒
  fps,
  totalFrames: fps * 26,
  scenes,
  audio: audioFile ? { src: `/audio/${audioFile}` } : undefined,
};

// 書き込み
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

console.log("✅ manifest generated at", outputPath);