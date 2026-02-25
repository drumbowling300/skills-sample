import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";

type Props = {
  text: string;
};

export const HookText: React.FC<Props> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 軽いスケールアニメーション
  const scale = spring({
    frame,
    fps,
    from: 0.9,
    to: 1,
    durationInFrames: 15,
  });

  // フェードイン
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 80px",
      }}
    >
      <div
        style={{
          color: "white",
          fontSize: 90,
          fontWeight: 800,
          textAlign: "center",
          lineHeight: 1.2,
          transform: `scale(${scale})`,
          opacity,
          textShadow: "0 4px 20px rgba(0,0,0,0.6)",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
