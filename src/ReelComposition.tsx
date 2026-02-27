// src/ReelComposition.tsx
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
import { SubtitleLayer, SubtitleClause, ClauseType } from "./components/SubtitleLayer";

const FPS = 30;

type ClauseRaw = {
  text?: string;
  displayText?: string;
  rawText?: string;
  lines?: string[];
  start: number;
  end: number;
  type?: ClauseType;
  highlightWords?: string[];
  ctaKeyword?: string;
};

type Scene = {
  type: ClauseType;
  start: number;
  end: number;
  clauses: ClauseRaw[];
};

const scenes = script as unknown as Scene[];
const manifest = videoManifest as Record<string, string[]>;

function getPlaybackRate(type: string): number {
  switch (type) {
    case "HOOK":     return 1.18;
    case "PROBLEM":  return 1.08;
    case "AGITATE":  return 1.03;
    case "SOLUTION": return 1.1;
    case "BENEFIT":  return 1.12;
    case "CTA":      return 1.08;
    default:         return 1.0;
  }
}

function createVideoSelector() {
  const used = new Set<string>();
  const history: string[] = [];

  return function getVideo(category?: string): string | null {
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
    if (!pool.length) return null;

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    used.add(chosen);
    history.push(chosen);
    if (history.length > 2) history.shift();
    return chosen;
  };
}

function toSubtitleClause(clause: ClauseRaw, sceneType: ClauseType): SubtitleClause {
  return {
    text: clause.displayText ?? clause.text ?? clause.rawText ?? "",
    lines: clause.lines,
    start: clause.start,
    end: clause.end,
    sceneType: clause.type ?? sceneType,
    highlightWords: clause.highlightWords ?? [],
    ctaKeyword: clause.ctaKeyword,
  };
}

export const ReelComposition: React.FC = () => {
  const { width, height } = useVideoConfig();
  const getVideo = useMemo(() => createVideoSelector(), []);

  if (!scenes.length) return <AbsoluteFill />;

  // ✅ 1clause = 1動画 で配置
  //    ギャップ（clause間・scene間の無音区間）は次のclauseの開始まで延ばして埋める
  const videoSegments = useMemo(() => {
    // 全clauseをフラットに展開（sceneTypeと一緒に）
    const allClauses: {
      sceneType: ClauseType;
      start: number;
      end: number;
    }[] = scenes.flatMap((scene) =>
      scene.clauses.map((clause) => ({
        sceneType: scene.type,
        start: clause.start,
        end: clause.end,
      }))
    );

    // 各clauseの動画配置範囲を算出
    // ✅ 次のclauseの開始まで延ばしてギャップを埋める
    return allClauses.map((clause, i) => {
      const nextClause = allClauses[i + 1];
      const videoEnd = nextClause ? nextClause.start : clause.end;
      return {
        sceneType: clause.sceneType,
        start: clause.start,
        end: videoEnd,
        startFrame: Math.floor(clause.start * FPS),
        frames: Math.floor(videoEnd * FPS) - Math.floor(clause.start * FPS),
      };
    });
  }, []);

  const subtitleClauses: SubtitleClause[] = useMemo(
    () =>
      scenes.flatMap((scene) =>
        scene.clauses.map((clause) => toSubtitleClause(clause, scene.type))
      ),
    []
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/* 🎙 音声 */}
      <Audio src={staticFile("audio/001_full.mp3")} />

      {/* 🎥 1clause = 1動画
          ✅ clause単位で動画を配置
          ✅ 次のclause開始までギャップを埋めて黒画面を防ぐ
      */}
      {videoSegments.map((seg, i) => {
        if (seg.frames <= 0) return null;
        const videoSrc = getVideo(seg.sceneType);
        if (!videoSrc) return null;

        return (
          <Sequence
            key={`clause-${i}`}
            from={seg.startFrame}
            durationInFrames={seg.frames}
          >
            <Video
              src={staticFile(videoSrc)}
              style={{ width, height, objectFit: "cover" }}
              playbackRate={getPlaybackRate(seg.sceneType)}
            />
          </Sequence>
        );
      })}

      {/* 💬 字幕レイヤー */}
      <SubtitleLayer clauses={subtitleClauses} />
    </AbsoluteFill>
  );
};
