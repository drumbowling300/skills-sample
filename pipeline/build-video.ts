import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';

// エントリーポイント（Remotion の Root）
const entry = path.join(process.cwd(), 'src/index.ts');

// manifest.json の読み込み
const manifestPath = path.join(__dirname, 'cache', 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('manifest.json が存在しません:', manifestPath);
  process.exit(1);
}
const manifestJson = JSON.parse(
  fs.readFileSync(manifestPath, 'utf-8')
);

// 出力先ディレクトリ作成
const outDir = path.join(process.cwd(), 'out');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
const outPath = path.join(outDir, 'video.mp4');

(async () => {
  try {
    console.log('バンドル開始...');

    // ① Remotion プロジェクトをバンドル
    const bundleLocation = await bundle({
      entryPoint: entry,
      webpackOverride: (config) => config,
    });

    console.log('Composition 取得中...');

    // ② Composition を取得（ここが重要）
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'Main',
      inputProps: {
        manifest: manifestJson,
      },
    });

    console.log('レンダリング開始...');

    // ③ VideoConfig を渡して render
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outPath,
      inputProps: {
        manifest: manifestJson,
      },
    });

    console.log('レンダリング完了:', outPath);
  } catch (err) {
    console.error('レンダリング中にエラー:', err);
    process.exit(1);
  }
})();