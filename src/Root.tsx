import React from "react";
import { Composition } from "remotion";
import { ReelComposition } from "./ReelComposition";
import script from "../public/subtitles/script_001.json";

const FPS = 30;

type Clause = {
  text: string;
  start: number;
  end: number;
};

type Scene = {
  type: string;
  start: number;
  end: number;
  clauses: Clause[];
};

const scenes = script as Scene[];

// 🔥 音声の最後の終了時間を取得
const totalDurationInSeconds = scenes.length
  ? scenes[scenes.length - 1].end
  : 10;

const totalDurationInFrames = Math.ceil(
  totalDurationInSeconds * FPS
);

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="Reel"
        component={ReelComposition}
        durationInFrames={totalDurationInFrames}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};