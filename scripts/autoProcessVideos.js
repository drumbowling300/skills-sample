const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT_DIR = path.join(__dirname, "..");

const RAW_DIR = path.join(ROOT_DIR, "public", "videos", "raw");
const OUTPUT_DIR = path.join(ROOT_DIR, "public", "videos", "converted");
const MANIFEST_PATH = path.join(
  ROOT_DIR,
  "public",
  "videos",
  "videoManifest.json"
);

const FFMPEG_OPTIONS =
  "-vf scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920 -r 30 -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -movflags +faststart";

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function convertVideos() {
  if (!fs.existsSync(RAW_DIR)) {
    console.log("⚠ raw directory not found:", RAW_DIR);
    return;
  }

  const categories = fs.readdirSync(RAW_DIR);

  categories.forEach((category) => {
    const rawCategoryPath = path.join(RAW_DIR, category);
    if (!fs.statSync(rawCategoryPath).isDirectory()) return;

    const outputCategoryPath = path.join(OUTPUT_DIR, category);
    ensureDir(outputCategoryPath);

    const files = fs.readdirSync(rawCategoryPath);

    files.forEach((file) => {
      if (!file.match(/\.(mp4|mov|MP4|MOV)$/)) return;

      const inputPath = path.join(rawCategoryPath, file);
      const outputFileName = path.parse(file).name + ".mp4";
      const outputPath = path.join(outputCategoryPath, outputFileName);

      if (fs.existsSync(outputPath)) {
        console.log(`✔ Already converted: ${category}/${outputFileName}`);
        return;
      }

      console.log(`🎬 Converting: ${category}/${file}`);

      const cmd = `ffmpeg -y -i "${inputPath}" ${FFMPEG_OPTIONS} "${outputPath}"`;
      execSync(cmd, { stdio: "inherit" });
    });
  });
}

function generateManifest() {
  ensureDir(OUTPUT_DIR);

  const manifest = {};

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify({}, null, 2));
    return;
  }

  const categories = fs.readdirSync(OUTPUT_DIR);

  categories.forEach((category) => {
    const categoryPath = path.join(OUTPUT_DIR, category);
    if (!fs.statSync(categoryPath).isDirectory()) return;

    const files = fs
      .readdirSync(categoryPath)
      .filter((f) => f.endsWith(".mp4"));

    manifest[category] = files.map(
      (file) => `videos/converted/${category}/${file}`
    );
  });

  fs.writeFileSync(
    MANIFEST_PATH,
    JSON.stringify(manifest, null, 2)
  );

  console.log("✅ videoManifest.json generated");
}

function main() {
  ensureDir(OUTPUT_DIR);
  convertVideos();
  generateManifest();
}

main();