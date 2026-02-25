import fs from 'fs';
import path from 'path';

type VideoMetadata = {
  [fileName: string]: {
    lastUsed: number | null;
  };
};

/**
 * metadata.json を読み込む
 * 無ければ新規作成
 */
export function loadMetadata(categoryFolder: string): VideoMetadata {
  const metadataPath = path.join(categoryFolder, 'metadata.json');
  if (!fs.existsSync(metadataPath)) {
    fs.writeFileSync(metadataPath, JSON.stringify({}, null, 2));
    return {};
  }
  return JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
}

/**
 * metadata.json に書き込む
 */
export function saveMetadata(categoryFolder: string, metadata: VideoMetadata) {
  const metadataPath = path.join(categoryFolder, 'metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
}

/**
 * 新規素材追加時に metadata に登録
 */
export function syncNewVideos(categoryFolder: string) {
  const files = fs.readdirSync(categoryFolder).filter(f => f.endsWith('.mp4'));
  const metadata = loadMetadata(categoryFolder);

  let updated = false;
  files.forEach(file => {
    if (!metadata[file]) {
      metadata[file] = { lastUsed: null };
      updated = true;
    }
  });

  if (updated) saveMetadata(categoryFolder, metadata);
}

/**
 * 連続使用回避しつつ次の動画を選択
 */
export function getNextVideo(
  sceneName: string,
  categoryFolder: string,
  lastVideo: string | null = null
): string {
  const metadata = loadMetadata(categoryFolder);
  const files = Object.keys(metadata);

  // lastVideo を除外して選択候補
  const candidates = files.filter(f => f !== lastVideo);
  if (candidates.length === 0) candidates.push(lastVideo!); // 1本だけの場合

  // 最終使用が古い順にソートして先頭を選択
  candidates.sort((a, b) => {
    const lastA = metadata[a].lastUsed ?? 0;
    const lastB = metadata[b].lastUsed ?? 0;
    return lastA - lastB;
  });

  const selected = candidates[0];
  metadata[selected].lastUsed = Date.now();
  saveMetadata(categoryFolder, metadata);

  return path.join(categoryFolder, selected);
}
