// projectRoot/scripts/convertVideos.ts
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const projectRoot = process.cwd();

// 元動画と変換後動画のディレクトリ
const rawBaseDir = path.join(projectRoot, "public", "videos", "raw");
const convertedBaseDir = path.join(projectRoot, "public", "videos", "converted");

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Remotion 再生用に変換する関数
function convertVideo(inputPath: string, outputPath: string) {
  console.log("🎬 Converting:");
  console.log("   input :", inputPath);
  console.log("   output:", outputPath);

  // Remotion 推奨設定
  const ffmpegArgs = [
    "-y",
    "-i",
    inputPath,
    "-vf",
    "scale=1080:1920,fps=30", // 1080x1920 + 30fps に正規化
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-profile:v",
    "high",
    "-level",
    "4.1",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart", // ストリーミング対応
    "-an", // 音声なし。音声ある場合は別トラック管理
    outputPath,
  ];

  const result = spawnSync("ffmpeg", ffmpegArgs, { stdio: "pipe" });

  if (result.error) {
    console.error("❌ spawn error:", result.error);
    return false;
  }

  if (result.status !== 0) {
    console.error("❌ FFmpeg failed");
    console.error(result.stderr?.toString());
    return false;
  }

  console.log("✅ Success");
  return true;
}

// カテゴリごとの処理
function processCategory(category: string) {
  const rawDir = path.join(rawBaseDir, category);
  const convertedDir = path.join(convertedBaseDir, category);

  if (!fs.existsSync(rawDir)) {
    console.log(`⚠ raw folder not found: ${rawDir}`);
    return;
  }

  ensureDir(convertedDir);

  const files = fs
    .readdirSync(rawDir)
    .filter((file) => file.toLowerCase().endsWith(".mp4"));

  const metadata: any[] = [];

  for (const file of files) {
    const inputPath = path.join(rawDir, file);
    const outputPath = path.join(convertedDir, file);

    const success = convertVideo(inputPath, outputPath);

    if (success) {
      metadata.push({
        fileName: file,
        path: `/videos/converted/${category}/${file}`,
      });
    }
  }

  const metadataPath = path.join(convertedDir, "metadata.json");
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log("📝 metadata created:", metadataPath);
}

// メイン処理
function main() {
  if (!fs.existsSync(rawBaseDir)) {
    console.error("❌ raw base folder not found:", rawBaseDir);
    return;
  }

  const categories = fs
    .readdirSync(rawBaseDir)
    .filter((item) => fs.statSync(path.join(rawBaseDir, item)).isDirectory());

  for (const category of categories) {
    console.log(`\n📁 Processing category: ${category}`);
    processCategory(category);
  }

  console.log("\n🎉 All done.");
}

main();