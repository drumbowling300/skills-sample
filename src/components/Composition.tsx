// Composition.tsx
import React from "react";
import { Sequence } from "remotion";
import { selectBackground } from "./backgroundSelector";
import { SceneBackground } from "./SceneBackground";

// 仮のシーン定義
const scenes = [
  { category: "daily", duration: 90 },
  { category: "work", duration: 120 },
  { category: "daily", duration: 90 },
];

export const MyComposition: React.FC = () => {
  const usedVideos: string[] = [];

  let currentFrame = 0;

  return (
    <>
      {scenes.map((scene, index) => {
        const bg = selectBackground(scene.category, usedVideos);

        usedVideos.push(bg.src);

        const sequence = (
          <Sequence
            key={index}
            from={currentFrame}
            durationInFrames={scene.duration}
          >
            <SceneBackground
              background={{
                ...bg,
                durationInFrames: 300, // ← 本来は素材ごとに取得
              }}
              sceneDurationInFrames={scene.duration}
            />
          </Sequence>
        );

        currentFrame += scene.duration;

        return sequence;
      })}
    </>
  );
};
