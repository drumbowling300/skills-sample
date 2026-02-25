// src/lib/videoRegistry.ts
import backgroundMeta from "../data/backgroundMeta.json";

export type BackgroundVideoMeta = {
  id: string;
  src: string;
  duration: number; // seconds
  recommendedSpeed: number;
  loopable: boolean;
};

export type BackgroundCategory =
  keyof typeof backgroundMeta;

export const getVideosByCategory = (
  category: string
): BackgroundVideoMeta[] => {
  return (backgroundMeta as Record<string, BackgroundVideoMeta[]>)[
    category
  ] || [];
};
