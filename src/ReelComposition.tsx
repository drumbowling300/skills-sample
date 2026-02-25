import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Sequence,
  Video,
  Audio,
  staticFile,
  useVideoConfig,
} from "remotion";

import script from "../public/subtitles/script_001.json";
import videoManifest from "../public/videos/videoManifest.json";

const FPS = 30;

type Clause = {
  text: string;
  start: number;
  end: number;
};

type Scene = {
  type: string;
  start: number;
  end: number;
  clauses: Clause[];
};

const scenes = script as Scene[];
const manifest = videoManifest as Record<string, string[]>;

// 🔥 シーン別再生速度
function getPlaybackRate(type: string) {
  switch (type) {
    case "HOOK":
      return 1.18;
    case "PROBLEM":
      return 1.08;
    case "AGITATE":
      return 1.03;
    case "SOLUTION":
      return 1.10;
    case "BENEFIT":
      return 1.12;
    case "CTA":
      return 1.08;
    default:
      return 1.0;
  }
}

// 🔥 重複回避エンジン
function createVideoSelector() {
  const used = new Set<string>();
  const history: string[] = [];

  return function getVideo(category?: string) {
    const categories = Object.keys(manifest);
    if (!categories.length) return null;

    const selectedCategory =
      category && manifest[category]?.length
        ? category
        : categories[Math.floor(Math.random() * categories.length)];

    const candidates = manifest[selectedCategory] || [];

    const filtered = candidates.filter(
      (v) => !used.has(v) && !history.includes(v)
    );

    const pool = filtered.length > 0 ? filtered : candidates;
    const chosen = pool[Math.floor(Math.random() * pool.length)];

    used.add(chosen);
    history.push(chosen);

    if (history.length > 2) history.shift();

    return chosen;
  };
}

export const ReelComposition: React.FC = () => {
  const { width, height } = useVideoConfig();
  const getVideo = useMemo(() => createVideoSelector(), []);

  if (!scenes.length) return <AbsoluteFill />;

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/* 🎙 音声は全体再生 */}
      <Audio src={staticFile("audio/001_full.mp3")} />

      {scenes.map((scene, sceneIndex) =>
        scene.clauses.map((clause, clauseIndex) => {
          const duration = clause.end - clause.start;
          const frames = Math.floor(duration * FPS);

          if (frames <= 0) return null;

          const videoSrc = getVideo(scene.type);
          if (!videoSrc) return null;

          const playbackRate = getPlaybackRate(scene.type);

          return (
            <Sequence
              key={`${sceneIndex}-${clauseIndex}`}
              from={Math.floor(clause.start * FPS)}
              durationInFrames={frames}
            >
              <Video
                src={staticFile(videoSrc)}
                style={{
                  width,
                  height,
                  objectFit: "cover",
                }}
                playbackRate={playbackRate}
              />
            </Sequence>
          );
        })
      )}
    </AbsoluteFill>
  );
};