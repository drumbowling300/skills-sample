const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const AUDIO_PATH = "public/audio/001_full.mp3";
const OUTPUT_DIR = "scripts/tmp";
const FINAL_JSON = "public/subtitles/script_001.json";

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log("🎙 Running Whisper...");

execSync(
  `whisper ${AUDIO_PATH} --model base --language Japanese --output_dir ${OUTPUT_DIR} --output_format json`,
  { stdio: "inherit" }
);

const whisperOutput = JSON.parse(
  fs.readFileSync(
    path.join(OUTPUT_DIR, "001_full.json"),
    "utf-8"
  )
);

const segments = whisperOutput.segments;
const totalSegments = segments.length;

// -------------------------------
// 🔥 マーケ構造比率
// -------------------------------
const structure = [
  { type: "HOOK", weight: 1 },
  { type: "PROBLEM", weight: 2 },
  { type: "AGITATE", weight: 2 },
  { type: "SOLUTION", weight: 2 },
  { type: "BENEFIT", weight: 2 },
  { type: "CTA", weight: 3 }
];

const totalWeight = structure.reduce((sum, s) => sum + s.weight, 0);

let assigned = 0;

structure.forEach((s) => {
  const ratio = s.weight / totalWeight;
  s.count = Math.round(ratio * totalSegments);
  assigned += s.count;
});

// 端数補正
while (assigned !== totalSegments) {
  if (assigned > totalSegments) {
    structure[structure.length - 1].count--;
    assigned--;
  } else {
    structure[structure.length - 1].count++;
    assigned++;
  }
}

// -------------------------------
// 🔥 clauses構造で生成
// -------------------------------
let pointer = 0;
const finalScript = [];

structure.forEach((block) => {
  const sceneSegments = [];

  for (let i = 0; i < block.count; i++) {
    const seg = segments[pointer];
    if (!seg) break;

    sceneSegments.push({
      text: seg.text.trim(),
      start: seg.start,
      end: seg.end
    });

    pointer++;
  }

  if (sceneSegments.length > 0) {
    finalScript.push({
      type: block.type,
      start: sceneSegments[0].start,
      end: sceneSegments[sceneSegments.length - 1].end,
      clauses: sceneSegments
    });
  }
});

fs.writeFileSync(
  FINAL_JSON,
  JSON.stringify(finalScript, null, 2)
);

console.log("✅ script_001.json generated (clauses structure)");