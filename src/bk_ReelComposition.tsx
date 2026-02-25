import React from "react";
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
const MIN_VIDEO_SECONDS = 1.5;

type Scene = {
  type: string;
  start: number;
  end: number;
  text?: string;
};

const scenes = script as Scene[];
const manifest = videoManifest as Record<string, string[]>;

// ランダムで動画を選択する関数
function getRandomVideo(category?: string) {
  const categories = Object.keys(manifest);
  if (categories.length === 0) return null;

  const selectedCategory =
    category && manifest[category]?.length
      ? category
      : categories[Math.floor(Math.random() * categories.length)];

  const videos = manifest[selectedCategory];
  return videos[Math.floor(Math.random() * videos.length)];
}

// シーンタイプごとの再生速度
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

export const ReelComposition: React.FC = () => {
  const { width, height } = useVideoConfig();

  if (!scenes.length) return <AbsoluteFill />;

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/* ナレーション音声 */}
      <Audio src={staticFile("audio/001_full.mp3")} />

      {scenes.map((scene, i) => {
        const sceneDuration = scene.end - scene.start;
        const sceneFrames = Math.floor(sceneDuration * FPS);

        if (sceneFrames <= 0) return null;

        // シーン内で順番に再生する動画の数
        let videoCount = 1;
        if (sceneDuration >= 3) videoCount = 2;
        if (sceneDuration < MIN_VIDEO_SECONDS) videoCount = 1;

        const perVideoFrames = Math.floor(sceneFrames / videoCount);
        const playbackRate = getPlaybackRate(scene.type);

        // 各動画を順番に配置
        return Array.from({ length: videoCount }).map((_, vIndex) => {
          const videoSrc = getRandomVideo(scene.type);
          if (!videoSrc) return null;

          return (
            <Sequence
              key={`${i}-${vIndex}`}
              from={Math.floor(scene.start * FPS + vIndex * perVideoFrames)}
              durationInFrames={perVideoFrames}
            >
              <Video
                src={staticFile(videoSrc)}
                style={{ width, height, objectFit: "cover" }}
                playbackRate={playbackRate}
              />
            </Sequence>
          );
        });
      })}
    </AbsoluteFill>
  );
};