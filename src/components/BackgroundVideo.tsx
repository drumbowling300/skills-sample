// src/components/BackgroundVideo.tsx
import React from "react";
import { Video, Sequence, useVideoConfig } from "remotion";

type Props = {
  src: string;
  durationInSeconds: number;
  playbackRate: number;
  loop: boolean;
};

export const BackgroundVideo: React.FC<Props> = ({
  src,
  durationInSeconds,
  playbackRate,
  loop,
}) => {
  const { fps } = useVideoConfig();
  const durationInFrames = Math.floor(durationInSeconds * fps);

  if (!loop) {
    return (
      <Video
        src={src}
        playbackRate={playbackRate}
        startFrom={0}
        endAt={durationInFrames}
        muted   // 🔇 ここを追加
      />
    );
  }

  const loopCount = 5;

  return (
    <>
      {Array.from({ length: loopCount }).map((_, i) => (
        <Sequence
          key={i}
          from={i * durationInFrames}
          durationInFrames={durationInFrames}
        >
          <Video
            src={src}
            playbackRate={playbackRate}
            muted   // 🔇 ループ側も必須
          />
        </Sequence>
      ))}
    </>
  );
};
