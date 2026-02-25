// src/components/SceneBackground.tsx
import React, { useMemo } from "react";
import { useVideoConfig } from "remotion";
import { selectBackground } from "../lib/backgroundSelector";
import { BackgroundVideo } from "./BackgroundVideo";

type Props = {
  category: string;
  sceneDurationInFrames: number;
};

export const SceneBackground: React.FC<Props> = ({
  category,
  sceneDurationInFrames,
}) => {
  const { fps } = useVideoConfig();

  const requiredDuration = sceneDurationInFrames / fps;

  const selected = useMemo(() => {
    return selectBackground(category, requiredDuration);
  }, [category, requiredDuration]);

  if (!selected) return null;

  return (
    <BackgroundVideo
      src={selected.src}
      durationInSeconds={requiredDuration}
      playbackRate={selected.recommendedSpeed}
      loop={selected.needsLoop}
    />
  );
};
