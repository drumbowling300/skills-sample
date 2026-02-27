import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { generateScriptFromAudio } from "../scripts/bk_generateScriptFromAudio";
import { SubtitleLayer } from "./components/SubtitleLayer";
import { Clause } from "./types";

const Main: React.FC = () => {
  const { fps } = useVideoConfig();

  // 🔥 テスト用ダミーデータ
  const dummySegments = [
    { start: 0, end: 3, text: "収入を増やす方法です" },
    { start: 3, end: 6, text: "副業で稼ぐ人が増えています" },
    { start: 6, end: 9, text: "今すぐ始めるべきです" },
  ];

  const script: Clause[] =
    generateScriptFromAudio(dummySegments);

  console.log("SCRIPT:", script);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {script.map((clause, index) => {
        const startFrame = Math.floor(clause.start * fps);
        const durationInFrames = Math.floor(
          (clause.end - clause.start) * fps
        );

        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={durationInFrames}
          >
            <SubtitleLayer clause={clause} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export default Main;