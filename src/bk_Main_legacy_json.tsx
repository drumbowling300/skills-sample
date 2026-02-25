import {AbsoluteFill, Sequence, Video, staticFile, Audio} from 'remotion';
import subtitlesJson from '../public/subtitles/script_001.json';

// Remotion は 30fps 想定
const FPS = 30;

export const VideoComposition = () => {
  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      {subtitlesJson.map((sub, idx) => (
        <Sequence
          key={idx}
          from={Math.floor(sub.start * FPS)}
          durationInFrames={Math.floor((sub.end - sub.start) * FPS)}
        >
          {/* 動画表示 */}
          <Video src={staticFile(sub.video)} />

          {/* 字幕表示 */}
          <div
            style={{
              position: 'absolute',
              top: '32%',
              width: '100%',
              textAlign: 'center',
              color: sub.style?.color || '#FFFFFF',
              fontWeight: sub.style?.fontWeight || '400',
              fontSize: sub.style?.fontSize || '1em',
              transform: sub.style?.scale ? `scale(${sub.style.scale})` : undefined,
              transition: sub.style?.fadeIn ? `all ${sub.style.fadeIn}s ease-in` : undefined,
              pointerEvents: 'none'
            }}
          >
            {sub.text}
          </div>
        </Sequence>
      ))}

      {/* ナレーション音声（必要であればコメントアウト解除） */}
      {/* <Audio src={staticFile('audio/narration.mp3')} /> */}
    </AbsoluteFill>
  );
};
