import {Composition} from "remotion";
import {ReelComposition} from "./ReelComposition";

export const Root: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={ReelComposition}
      durationInFrames={300} // ← 最終で音声長に更新
      fps={30}
      width={1080}
      height={1920}
    />
  );
};