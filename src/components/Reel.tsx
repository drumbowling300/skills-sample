import React from 'react';
import { Composition, Sequence } from 'remotion';
import { Video } from 'remotion';
import { Subtitle } from './Subtitle'; // 字幕コンポーネント
import { Scene, assignVideosToScene } from '../utils/videoAssigner';

type ReelProps = {
  scenes: Scene[];
  baseVideoFolder: string;
  fps?: number;
};

export const Reel: React.FC<ReelProps> = ({ scenes, baseVideoFolder, fps = 30 }) => {
  return (
    <>
      {scenes.map(scene => {
        const videoAssignments = assignVideosToScene(scene, baseVideoFolder);

        return videoAssignments.map(({ start, end, src }) => (
          <Sequence key={`${scene.name}-${start}`} from={start} durationInFrames={end - start}>
            <Video src={src} playbackRate={1.2} />
            <Subtitle
              script={scene.script}
              startFrame={start}
              endFrame={end}
            />
          </Sequence>
        ));
      })}
    </>
  );
};
