import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import { createScriptHash } from "./createScriptHash";

const entry = path.resolve("./src/index.ts");
const out = path.resolve("./out/video.mp4");
const manifestPath = path.resolve("./cache/manifest.json");
const scriptPath = path.resolve("./script.json");

// ===== 必須ファイル存在チェック =====

if (!fs.existsSync(manifestPath)) {
  throw new Error("❌ manifest.json が存在しません。preprocessを実行してください。");
}

if (!fs.existsSync(scriptPath)) {
  throw new Error("❌ script.json が存在しません。");
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
const script = JSON.parse(fs.readFileSync(scriptPath, "utf-8"));

// ===== scriptHash再計算検証（設計固定） =====

const recalculatedHash = createScriptHash(script);

if (manifest.scriptHash !== recalculatedHash) {
  throw new Error("❌ scriptHash mismatch。preprocessを再実行してください。");
}

// ===== manifest schema保証（変更なし） =====

if (typeof manifest.duration !== "number") {
  throw new Error("❌ manifest.duration が不正です。");
}

if (!Array.isArray(manifest.materials) || manifest.materials.length !== 1) {
  throw new Error("❌ materialsは1件である必要があります。");
}

if (!manifest.materials[0].src) {
  throw new Error("❌ material.src が未定義です。");
}

// ===== Render =====

const run = async () => {
  const bundleLocation = await bundle(entry);

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "Main",
    inputProps: { manifest },
  });

  await renderMedia({
    composition: {
      ...composition,
      durationInFrames: manifest.duration, // build側で強制
      fps: 30,
      width: 1080,
      height: 1920,
    },
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: out,
    inputProps: { manifest },
  });

  console.log("✅ Render completed:", out);
};

run();