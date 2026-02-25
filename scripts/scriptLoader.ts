import fs from 'fs';
import path from 'path';
import { Scene } from '../utils/videoAssigner';

type BaseScript = {
  name: string;        // シーン名: HOOK, PROBLEM, など
  content: string;     // 台本テキスト
  category: 'daily' | 'work' | 'nature';
};

/**
 * ベース台本ファイルを読み込み、Scene配列に変換
 * - 改行ごとに字幕分割
 * - 字幕フレーム数は音声長に応じて自動計算
 */
export function loadScriptFile(
  filePath: string,
  category: 'daily' | 'work' | 'nature',
  audioDurationInSeconds: number,
  fps: number = 30
): Scene {
  const content = fs.readFileSync(filePath, 'utf-8').trim();

  // 改行ごとに字幕分割
  const lines = content.split(/\r?\n/).filter(Boolean);
  const totalFrames = Math.ceil(audioDurationInSeconds * fps);
  const framesPerLine = Math.floor(totalFrames / lines.length);

  const subtitleFrames = lines.map((_, index) => ({
    start: index * framesPerLine,
    end: index === lines.length - 1 ? totalFrames : (index + 1) * framesPerLine,
  }));

  return {
    name: path.basename(filePath, path.extname(filePath)),
    category,
    script: content,
    subtitleFrames,
  };
}

/**
 * 複数台本をまとめて読み込む
 */
export function loadScripts(
  scriptsDir: string,
  audioDurations: Record<string, number>,
  fps: number = 30
): Scene[] {
  const files = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.txt'));
  const scenes: Scene[] = [];

  files.forEach(file => {
    const filePath = path.join(scriptsDir, file);
    const sceneName = path.basename(file, '.txt');

    // カテゴリはファイル名や別管理で指定
    // ここでは例として sceneName をカテゴリマップで変換
    const categoryMap: Record<string, 'daily' | 'work' | 'nature'> = {
      HOOK: 'daily',
      PROBLEM: 'work',
      AGITATE: 'nature',
      SOLUTION: 'daily',
      BENEFIT: 'work',
      CTA: 'nature',
    };
    const category = categoryMap[sceneName] ?? 'daily';

    const duration = audioDurations[sceneName] ?? 5; // デフォルト5秒
    const scene = loadScriptFile(filePath, category, duration, fps);
    scenes.push(scene);
  });

  return scenes;
}
