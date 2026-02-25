import React from "react";
import { AbsoluteFill } from "remotion";

type Props = {
  text: string;
};

export const CaptionLayer: React.FC<Props> = ({ text }) => {
  const lines = text.split("\n");

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 220, // 下から少し上
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.75)", // 半透明黒
          padding: "28px 40px",
          borderRadius: 16,
          maxWidth: "85%",
          textAlign: "center",
        }}
      >
        {lines.map((line, index) => (
          <div
            key={index}
            style={{
              color: "white",
              fontSize: 60,
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: 1,
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
