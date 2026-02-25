// src/components/Scene.tsx
import React from "react";
import { AbsoluteFill } from "remotion";
import { SceneBackground } from "./SceneBackground";

type Props = {
  category: string;
  durationInFrames: number;
};

export const Scene: React.FC<Props> = ({
  category,
  durationInFrames,
  children,
}) => {
  return (
    <AbsoluteFill>
      <SceneBackground
        category={category}
        sceneDurationInFrames={durationInFrames}
      />
      {children}
    </AbsoluteFill>
  );
};
