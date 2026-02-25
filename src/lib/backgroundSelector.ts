// src/lib/backgroundSelector.ts
import { getVideosByCategory, BackgroundVideoMeta } from "./videoRegistry";

export type SelectedBackground = BackgroundVideoMeta & {
  adjustedDuration: number;
  needsLoop: boolean;
};

export const selectBackground = (
  category: string,
  requiredDuration: number // seconds
): SelectedBackground | null => {
  const videos = getVideosByCategory(category);

  if (!videos.length) return null;

  // ① 必要秒数を満たす動画
  const candidates = videos.filter(
    (video) => video.duration >= requiredDuration
  );

  let selected: BackgroundVideoMeta;

  if (candidates.length > 0) {
    selected =
      candidates[Math.floor(Math.random() * candidates.length)];
  } else {
    // ② fallback：最も長い動画を選ぶ
    selected = videos.sort(
      (a, b) => b.duration - a.duration
    )[0];
  }

  const needsLoop = selected.duration < requiredDuration;

  return {
    ...selected,
    adjustedDuration: requiredDuration,
    needsLoop,
  };
};
