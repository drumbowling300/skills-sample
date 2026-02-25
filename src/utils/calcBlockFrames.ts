// utils/calcBlockFrames.ts

export const FPS = 30;

// HOOK, PROBLEM, AGITATE, SOLUTION, BENEFIT, CTA
const WEIGHTS = [0.8, 1.0, 1.0, 1.2, 1.3, 1.7];

export const calcBlockFrames = (audioDuration: number) => {
  const totalWeight = WEIGHTS.reduce((a, b) => a + b, 0);

  const totalFrames = Math.floor(audioDuration * FPS);

  const baseUnit = audioDuration / totalWeight;

  const secondsPerBlock = WEIGHTS.map((w) => w * baseUnit);

  const framesPerBlock = secondsPerBlock.map((sec) =>
    Math.floor(sec * FPS)
  );

  // 誤差吸収（最後のCTAへ）
  const usedFrames = framesPerBlock.reduce((a, b) => a + b, 0);
  const diff = totalFrames - usedFrames;

  framesPerBlock[framesPerBlock.length - 1] += diff;

  return {
    totalFrames,
    framesPerBlock,
  };
};
