import path from 'path';
import fs from 'fs';
import { getNextVideo, syncNewVideos } from './metadataManager';

export type Scene = {
  name: string;
  category: 'daily' | 'work' | 'nature';
  script: string;
  subtitleFrames: { start: number; end: number }[];
};

/**
 * 各シーンにフレーム単位で動画を割当
 */
export function assignVideosToScene(
  scene: Scene,
  baseFolder: string
): { start: number; end: number; src: string }[] {
  const categoryFolder = path.join(baseFolder, scene.category);
  // 新素材追加時に metadata.json を同期
  syncNewVideos(categoryFolder);

  const selectedVideos: { start: number; end: number; src: string }[] = [];
  let lastVideo: string | null = null;

  scene.subtitleFrames.forEach(range => {
    const nextVideo = getNextVideo(scene.name, categoryFolder, lastVideo);
    selectedVideos.push({ start: range.start, end: range.end, src: nextVideo });
    lastVideo = nextVideo;
  });

  return selectedVideos;
}

/**
 * カテゴリ別素材動画を取得（metadata.json に登録済みの動画）
 */
export function getCategoryVideos(baseFolder: string, category: 'daily' | 'work' | 'nature') {
  const categoryFolder = path.join(baseFolder, category);
  syncNewVideos(categoryFolder);
  const metadataPath = path.join(categoryFolder, 'metadata.json');
  if (!fs.existsSync(metadataPath)) return [];
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  return Object.keys(metadata).map(f => path.join(categoryFolder, f));
}
