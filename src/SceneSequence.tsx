import React, { useEffect, useMemo, useState } from "react";
import {
  Video,
  staticFile,
  Sequence,
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from "remotion";

const FPS = 30;

const SCENE_CONFIG = [
  { key: "HOOK", duration: 66, clips: 1 },
  { key: "PROBLEM", duration: 114, clips: 2 },
  { key: "AGITATE", duration: 120, clips: 2 },
  { key: "SOLUTION", duration: 138, clips: 2 },
  { key: "BENEFIT", duration: 162, clips: 2 },
  { key: "CTA", duration: 198, clips: 3 },
];

const baseScript = [
  "実はこれ、知らないだけで少しもったいないかもしれません。",
  "この3つのアプリを入れていないだけで、月5,000円以上差が出ることもあります。",
  "毎日なんとなくSNSを30分見ている時間、そのままにしていませんか？",
  "そのうち5分を、このアプリに変えるだけです。",
  "実際にママ友は1週間で数千円。「もっと早く知りたかった」と言っていました。",
  "やり方をまとめたので、この投稿を保存してキャプションをチェックしてください。",
];

const getPlaybackRate = (category: string) => {
  if (category === "nature") return 1.15;
  return 1.2;
};

export const SceneSequence: React.FC = () => {
  const [videoFiles, setVideoFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const categories = ["daily", "work", "nature"];

    const loadMetadata = async () => {
      const results = await Promise.all(
        categories.map(async (cat) => {
          const res = await fetch(
            staticFile(`videos/converted/${cat}/metadata.json`)
          );
          const json = await res.json();
          return json.map((item: any) => ({
            file: `${cat}/${item.fileName}`,
            category: cat,
          }));
        })
      );

      setVideoFiles(results.flat());
      setLoading(false);
    };

    loadMetadata();
  }, []);

  const scenesWithVideos = useMemo(() => {
    if (videoFiles.length === 0) return [];

    return SCENE_CONFIG.map((scene) => {
      const selected = [];
      for (let i = 0; i < scene.clips; i++) {
        const random =
          videoFiles[Math.floor(Math.random() * videoFiles.length)];
        selected.push(random);
      }
      return selected;
    });
  }, [videoFiles]);

  if (loading) {
    return <div style={{ color: "white" }}>Loading...</div>;
  }

  let accumulatedFrames = 0;

  return (
    <>
      {SCENE_CONFIG.map((scene, sceneIndex) => {
        const sceneStart = accumulatedFrames;
        accumulatedFrames += scene.duration;

        const clips = scenesWithVideos[sceneIndex];
        const clipDuration = Math.floor(scene.duration / scene.clips);

        return (
          <Sequence
            key={sceneIndex}
            from={sceneStart}
            durationInFrames={scene.duration}
          >
            <AbsoluteFill>
              {clips.map((clip, i) => (
                <Sequence
                  key={i}
                  from={i * clipDuration}
                  durationInFrames={clipDuration}
                >
                  <Video
                    src={staticFile(`videos/converted/${clip.file}`)}
                    playbackRate={getPlaybackRate(clip.category)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Sequence>
              ))}

              <Subtitle text={baseScript[sceneIndex]} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </>
  );
};

const Subtitle: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 150,
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "24px 48px",
          borderRadius: 24,
          fontSize: 52,
          fontWeight: "bold",
          textAlign: "center",
          maxWidth: "85%",
          lineHeight: 1.4,
          opacity,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
