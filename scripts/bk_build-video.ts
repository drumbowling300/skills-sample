// scripts/build-video.ts

import path from "path";
import fs from "fs";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

interface Scene {
  sceneId: string;
  start: number;
  end: number;
  speed: number;
  category: string;
  materials: string[];
}

interface ManifestEntry {
  sceneId: string;
  outputFiles: string[];
}

const ENTRY_POINT = path.resolve(__dirname, "../src/index.ts");
const SCRIPT_PATH = path.resolve(__dirname, "./script.json");
const MANIFEST_PATH = path.resolve(__dirname, "../public/videos/videoManifest.json");
const CACHE_DIR = path.resolve(__dirname, "../public/videos/cache");

const OUTPUT_DIR = path.resolve(__dirname, "../dist");
const OUTPUT_PATH = path.resolve(OUTPUT_DIR, "output.mp4");

const COMPOSITION_ID = "MainComposition";
const FPS = 30;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`ValidationError: ${message}`);
}

function validateScript(script: unknown): Scene[] {
  assert(Array.isArray(script), "script must be array");
  assert(script.length > 0, "script empty");

  const scenes = script as Scene[];
  const idSet = new Set<string>();

  scenes.forEach((s) => {
    assert(!idSet.has(s.sceneId), `duplicate sceneId: ${s.sceneId}`);
    idSet.add(s.sceneId);

    assert(s.end > s.start, `invalid time range: ${s.sceneId}`);
    assert(s.speed > 0, `invalid speed: ${s.sceneId}`);
    assert(Array.isArray(s.materials) && s.materials.length > 0, `no materials: ${s.sceneId}`);
  });

  return scenes;
}

function validateCache(script: Scene[]) {
  assert(fs.existsSync(MANIFEST_PATH), "videoManifest.json missing");

  const manifestRaw = fs.readFileSync(MANIFEST_PATH, "utf-8");
  const manifest = JSON.parse(manifestRaw) as ManifestEntry[];

  script.forEach((scene) => {
    const entry = manifest.find((m) => m.sceneId === scene.sceneId);
    assert(entry, `manifest missing scene: ${scene.sceneId}`);

    entry.outputFiles.forEach((file) => {
      const filePath = path.join(CACHE_DIR, file);
      assert(fs.existsSync(filePath), `cache missing: ${file}`);
    });
  });
}

function calculateDuration(script: Scene[]): number {
  const maxEnd = Math.max(...script.map((s) => s.end));
  return Math.ceil(maxEnd * FPS);
}

async function build() {
  try {
    const rawScript = fs.readFileSync(SCRIPT_PATH, "utf-8");
    const parsed = JSON.parse(rawScript);

    const script = validateScript(parsed);
    validateCache(script);

    const durationInFrames = calculateDuration(script);

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const bundleLocation = await bundle({
      entryPoint: ENTRY_POINT,
      webpackOverride: (config) => config,
    });

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: COMPOSITION_ID,
      inputProps: { script },
    });

    await renderMedia({
      composition: {
        ...composition,
        durationInFrames,
      },
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation: OUTPUT_PATH,
      inputProps: { script },
    });

    console.log("Render complete:", OUTPUT_PATH);
  } catch (err) {
    console.error("Build failed:");
    console.error(err);
    process.exit(1);
  }
}

build();