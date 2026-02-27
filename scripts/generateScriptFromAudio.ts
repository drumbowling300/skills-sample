// scripts/generateScriptFromAudio.ts
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// ──────────────────────────────────────────
// パス設定
// ──────────────────────────────────────────
const AUDIO_PATH = "public/audio/001_full.mp3";
const TMP_DIR = "scripts/tmp";
const FINAL_JSON = "public/subtitles/script_001.json";
const WHISPER_JSON = path.join(TMP_DIR, "001_full.json");
const SCRIPT_DIR = "scripts";

// ──────────────────────────────────────────
// Whisper 設定
// ──────────────────────────────────────────
const WHISPER_MODEL = "large-v3";
const WHISPER_LANGUAGE = "ja";

// ──────────────────────────────────────────
// NG変換テーブル
// ──────────────────────────────────────────
const NG_REPLACEMENTS: Record<string, string> = {
  "アフィリエイト": "アフィ",
  "お給料": "手取り",
  "お小遣い": "お〇遣い",
  "副業": "ﾌｸｷﾞｮｳ",
  "投資": "投詩",
  "収入": "収ｴﾝ",
  "収益": "収ｴｷ",
  "報酬": "報ｼｭｳ",
  "貯金": "貯ｷﾝ",
  "稼ぐ": "ｶｾぐ",
  "売る": "ウる",
  "金": "ｶﾈ",
};

// ──────────────────────────────────────────
// 強調ワード
// ──────────────────────────────────────────
const HIGHLIGHT_WORDS: string[] = [
  "危険", "損", "損失", "リスク", "失敗", "後悔",
  "今すぐ", "今だけ", "限定", "期間限定", "絶対",
  "無料", "タダ", "得", "お得",
  "実は", "知らない", "知らないと損", "やばい",
];

// ──────────────────────────────────────────
// CTAキーワード
// ──────────────────────────────────────────
const CTA_ACTION_WORDS: string[] = [
  "保存", "フォロー", "コメント", "シェア", "チェック",
  "タップ", "クリック", "登録", "申し込み", "確認",
];

// ──────────────────────────────────────────
// マーケ構造
// ──────────────────────────────────────────
const STRUCTURE = [
  { type: "HOOK",     weight: 1 },
  { type: "PROBLEM",  weight: 2 },
  { type: "AGITATE",  weight: 2 },
  { type: "SOLUTION", weight: 2 },
  { type: "BENEFIT",  weight: 2 },
  { type: "CTA",      weight: 3 },
];

// ──────────────────────────────────────────
// 台本ファイル読み込み
// ──────────────────────────────────────────
function loadScriptFile(): string {
  const files = fs.readdirSync(SCRIPT_DIR)
    .filter((f) => f.endsWith(".txt"))
    .map((f) => path.join(SCRIPT_DIR, f));

  if (files.length === 0) {
    console.log("⚠️  台本ファイル（scripts/*.txt）が見つかりません。");
    return "";
  }

  const scriptPath = files[0];
  const content = fs.readFileSync(scriptPath, "utf-8").trim();
  console.log(`📄 台本ファイル読み込み: ${scriptPath}（${content.length}文字）`);
  return content;
}

// ──────────────────────────────────────────
// Whisperのセグメントテキストに台本の記号を転写する
// ✅ 転写対象：句読点（、。！？…）、区切り記号（|）、改行記号（\）
// ──────────────────────────────────────────

// 制御記号・句読点・空白のみ除去（数字変換は行わない）
// ✅ 全角・半角の記号を両方除去して表記ゆれを吸収する
function stripForMatch(text: string): string {
  return text
    .replace(/[、。！？…・|\\\s]/g, "")   // 全角記号・制御文字
    .replace(/[.,!?;:\s]/g, "");             // 半角記号
}

// Whisper誤変換修正テーブル（照合専用・表示テキストには影響しない）
// Whisperが誤認識しやすい漢字を台本の表記に合わせるための変換
const WHISPER_CORRECTIONS: Record<string, string> = {
  "初めて": "始めて",
  "行って": "逝って",   // 必要に応じて追加
};

// Whisperテキストを照合用に補正する（表示には使わない）
function correctWhisperText(text: string): string {
  let corrected = text;
  Object.entries(WHISPER_CORRECTIONS).forEach(([wrong, correct]) => {
    corrected = corrected.replace(new RegExp(wrong, "g"), correct);
  });
  return corrected;
}

// Whisperテキストを台本に照合する正規表現を生成
// 数字表記ゆれ（5千/5000/5,000）を正規表現で吸収する
function buildMatchRegex(whisperText: string): RegExp {
  // ✅ 照合前にWhisper誤変換を補正（表示テキストには影響しない）
  const corrected = correctWhisperText(whisperText);
  const stripped = stripForMatch(corrected);
  const escaped = stripped.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // 数字部分を柔軟にマッチするパターンに変換
  const pattern = escaped.replace(/\d+/g, "[\\d,，千万]+");
  return new RegExp(pattern);
}

function injectPunctuation(
  whisperText: string,
  scriptLines: string[],
): string {
  if (!whisperText.trim()) return whisperText;

  // 全台本行を結合
  const fullScript = scriptLines.join("");
  const fullStripped = stripForMatch(fullScript);

  // ✅ 数字表記ゆれを正規表現で吸収して台本内の一致位置を探す
  const matchRegex = buildMatchRegex(whisperText);
  const match = matchRegex.exec(fullStripped);
  if (!match) {
    return whisperText;
  }

  // match.index は stripForMatch(fullScript) 上の位置
  // → fullScript 上の実際の開始・終了位置に変換する
  const matchIdxInStripped = match.index;
  const matchLenInStripped = match[0].length;

  let nonCtrlCount = 0;
  let startPos = -1;
  let endPos = -1;

  for (let i = 0; i < fullScript.length; i++) {
    const ch = fullScript[i];
    const isCtrl = /[、。！？…・|\\\s.,!?;:]/.test(ch);  // 全角・半角両方

    if (!isCtrl) {
      if (nonCtrlCount === matchIdxInStripped && startPos === -1) {
        startPos = i;
      }
      if (nonCtrlCount >= matchIdxInStripped && nonCtrlCount < matchIdxInStripped + matchLenInStripped) {
        endPos = i + 1;
      }
      nonCtrlCount++;
    }
  }

  if (startPos === -1 || endPos === -1) return whisperText;

  // endPos を | や \ などの制御記号の末尾まで拡張する
  // ただし 。！？ の後は次の文が始まるので拡張しない
  let extendedEnd = endPos;
  while (extendedEnd < fullScript.length) {
    const ch = fullScript[extendedEnd];
    if (/[。！？]/.test(ch)) { extendedEnd++; break; }
    if (/[、…|\\]/.test(ch)) { extendedEnd++; continue; }
    break;
  }

  const result = fullScript.slice(startPos, extendedEnd);
  console.log(`  📝 記号転写: 「${whisperText.trim()}」→「${result}」`);
  return result;
}

// ──────────────────────────────────────────
// 数字の視認性強化
// ──────────────────────────────────────────
function enhanceNumbers(text: string): string {
  text = text.replace(/(\d{4,})/g, (match) => Number(match).toLocaleString("ja-JP"));
  text = text.replace(/(\d[\d,]*)万円/g, "$1ﾏﾝｴﾝ");
  text = text.replace(/(\d[\d,]*)万/g, "$1ﾏﾝ");
  text = text.replace(/(\d[\d,]*)円/g, "$1ｴﾝ");
  return text;
}

// ──────────────────────────────────────────
// テキスト最適化
// ──────────────────────────────────────────
function optimizeText(rawText: string): string {
  let text = rawText.trim();
  text = text.replace(new RegExp("です(?=[。！？…」]|$)", "g"), "");  // 文末のみ除去
  text = text.replace(new RegExp("ます(?=[。！？…」]|$)", "g"), "");  // 文末のみ除去
  text = enhanceNumbers(text);
  Object.keys(NG_REPLACEMENTS)
    .sort((a, b) => b.length - a.length)
    .forEach((word) => {
      text = text.replace(new RegExp(word, "g"), NG_REPLACEMENTS[word]);
    });
  return text.trim();
}

// ──────────────────────────────────────────
// ① | による強制区切り処理
//    台本の | をキーにテキストを複数のchunkに分割する
//    例：「この3つのアプリ|入れていないだけで」→ 2clause に分割
// ──────────────────────────────────────────
function splitByPipe(text: string): string[] {
  if (!text.includes("|")) return [text];
  return text.split("|").map((t) => t.trim()).filter(Boolean);
}

// ──────────────────────────────────────────
// \ による改行処理
//    台本の \ をキーに1clause内で複数行表示するためのlines配列を生成
//    例：「この3つのアプリ\入れていないだけで」→ lines: ["この3つのアプリ", "入れていないだけで"]
// ──────────────────────────────────────────
function splitByLineBreak(text: string): string[] {
  if (!text.includes("\\")) return [text];
  return text.split("\\").map((t) => t.trim()).filter(Boolean);
}

// ──────────────────────────────────────────
// 字幕区切り（句読点優先）
// ──────────────────────────────────────────
const MAX_CHARS = 13;

function splitIntoChunks(text: string): string[] {
  // ✅ 句読点がある場合はそこで分割（台本転写が効いていれば自然に分割される）
  const hasPunct = /[、。！？…]/.test(text);
  if (hasPunct) {
    const parts = text
      .split(/(?<=[、。！？…])/)  // 句読点の後ろで分割（句読点を保持）
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 1) return parts;
  }

  // 句読点がない場合は文字数ベースで分割
  if (text.length <= MAX_CHARS) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= MAX_CHARS) {
      chunks.push(remaining);
      break;
    }

    const win = remaining.slice(0, MAX_CHARS + 1);

    // 助詞の後ろで分割
    const particlePattern = /[はがをにでもとへよね](?=\S)/g;
    let lastIdx = -1;
    let m: RegExpExecArray | null;
    while ((m = particlePattern.exec(win)) !== null) {
      if (m.index >= MAX_CHARS / 2 && m.index <= MAX_CHARS) {
        lastIdx = m.index + 1;
      }
    }
    if (lastIdx > 0) {
      chunks.push(remaining.slice(0, lastIdx).trim());
      remaining = remaining.slice(lastIdx).trim();
      continue;
    }

    // 強制分割
    chunks.push(remaining.slice(0, MAX_CHARS));
    remaining = remaining.slice(MAX_CHARS).trim();
  }

  return chunks.filter(Boolean);
}

// ──────────────────────────────────────────
// タイムコード再分配
// ──────────────────────────────────────────
function redistributeTiming(
  chunks: string[],
  segStart: number,
  segEnd: number,
): { text: string; start: number; end: number }[] {
  // 句読点を除いた文字数でタイムコードを按分する
  const charCounts = chunks.map((c) => c.replace(/[、。！？…]/g, "").length);
  const totalChars = charCounts.reduce((s, c) => s + c, 0);
  const totalDur = Math.max(segEnd - segStart, 0.5);
  let cur = segStart;

  return chunks.map((text, i) => {
    const ratio = totalChars > 0 ? charCounts[i] / totalChars : 1 / chunks.length;
    const dur = Math.max(totalDur * ratio, 0.3);
    const start = cur;
    const end = i === chunks.length - 1 ? segEnd : Math.min(cur + dur, segEnd);
    cur = end;
    return {
      text,
      start: Math.round(start * 1000) / 1000,
      end: Math.round(end * 1000) / 1000,
    };
  });
}

// ──────────────────────────────────────────
// ハイライトワード検出
// ──────────────────────────────────────────
function detectHighlightWords(text: string): string[] {
  return HIGHLIGHT_WORDS.filter((w) => text.includes(w));
}

// CTAキーワード検出
function detectCtaKeyword(text: string): string | undefined {
  const quoted = text.match(/「(.+?)」/);
  if (quoted) return quoted[1];
  return CTA_ACTION_WORDS.find((w) => text.includes(w));
}

// ──────────────────────────────────────────
// メイン処理
// ──────────────────────────────────────────
function main() {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }

  // ① 台本ファイル読み込み
  const scriptContent = loadScriptFile();
  const scriptLines = scriptContent
    ? scriptContent.split(/[\n\r]+/).map((l) => l.trim()).filter(Boolean)
    : [];

  // ② Whisper 実行
  const basePrompt = "インスタグラム、リール、フォロワー、保存、キャプション";
  const initialPrompt = scriptContent
    ? `${scriptContent.slice(0, 500)}。${basePrompt}`
    : basePrompt;

  console.log(`🎙 Running Whisper (model: ${WHISPER_MODEL})...`);
  execSync(
    `whisper "${AUDIO_PATH}" --model ${WHISPER_MODEL} --language ${WHISPER_LANGUAGE} --initial_prompt "${initialPrompt}" --output_dir "${TMP_DIR}" --output_format json`,
    { stdio: "inherit" }
  );
  console.log("✅ Whisper complete");

  // ③ Whisper JSON 読み込み
  const whisperOutput = JSON.parse(fs.readFileSync(WHISPER_JSON, "utf-8"));
  const segments: { start: number; end: number; text: string }[] =
    whisperOutput.segments;
  const totalSegments = segments.length;
  console.log(`📊 Total segments: ${totalSegments}`);

  // ④ マーケ構造への割り振り
  const totalWeight = STRUCTURE.reduce((sum, s) => sum + s.weight, 0);
  const counts: number[] = STRUCTURE.map((s) =>
    Math.round((s.weight / totalWeight) * totalSegments)
  );
  let assigned = counts.reduce((a, b) => a + b, 0);
  while (assigned !== totalSegments) {
    if (assigned > totalSegments) { counts[counts.length - 1]--; assigned--; }
    else { counts[counts.length - 1]++; assigned++; }
  }

  // ⑤ Scene[] 構造で生成
  type ClauseOut = {
    text: string;
    lines?: string[];   // ✅ \ による改行がある場合に複数行テキストを格納
    start: number;
    end: number;
    highlightWords: string[];
    ctaKeyword?: string;
  };
  type SceneOut = {
    type: string;
    start: number;
    end: number;
    clauses: ClauseOut[];
  };

  const finalScript: SceneOut[] = [];
  let pointer = 0;

  console.log("📝 句読点転写処理:");

  STRUCTURE.forEach((block, idx) => {
    const count = counts[idx];
    const sceneClauses: ClauseOut[] = [];

    const sceneSegments: { start: number; end: number; text: string }[] = [];
    for (let i = 0; i < count; i++) {
      const seg = segments[pointer];
      if (!seg) break;
      sceneSegments.push(seg);
      pointer++;
    }

    if (sceneSegments.length === 0) return;

    const sceneStart = sceneSegments[0].start;
    const sceneEnd = sceneSegments[sceneSegments.length - 1].end;

    sceneSegments.forEach((seg) => {
      // ✅ 台本との照合で句読点を転写してから最適化
      const withPunct = scriptLines.length > 0
        ? injectPunctuation(seg.text, scriptLines)
        : seg.text;

      const optimized = optimizeText(withPunct);

      // ✅ ① | による強制区切りを最優先で処理
      const pipeSplit = splitByPipe(optimized);

      // pipe分割された各チャンクをさらに句読点・文字数で分割
      const allChunks: { text: string; lines?: string[] }[] = [];
      pipeSplit.forEach((pipeChunk) => {
        // ✅ \ による改行チェック（区切りはしないが複数行表示）
        const lineBreaks = splitByLineBreak(pipeChunk);
        if (lineBreaks.length > 1) {
          // \ がある場合は1clauseとして lines に格納
          const cleanLines = lineBreaks.map((l) => l.replace(/[、。！？…]/g, "").trim());
          allChunks.push({ text: cleanLines.join(" "), lines: cleanLines });
        } else {
          // \ がない場合は通常の句読点・文字数分割
          const subChunks = splitIntoChunks(pipeChunk);
          subChunks.forEach((c) => allChunks.push({ text: c }));
        }
      });

      const chunkTexts = allChunks.map((c) => c.text);
      const timed = redistributeTiming(chunkTexts, seg.start, seg.end);

      timed.forEach(({ text, start, end }, i) => {
        const chunkInfo = allChunks[i];
        // 表示用テキストは句読点を除去
        const displayText = text.replace(/[、。！？…]/g, "").trim();
        const displayLines = chunkInfo.lines?.map((l) => l.replace(/[、。！？…]/g, "").trim());
        const highlightWords = detectHighlightWords(displayText);
        const ctaKeyword = block.type === "CTA"
          ? detectCtaKeyword(displayText)
          : undefined;

        sceneClauses.push({
          text: displayText,
          ...(displayLines ? { lines: displayLines } : {}),
          start,
          end,
          highlightWords,
          ctaKeyword,
        });
      });
    });

    finalScript.push({
      type: block.type,
      start: sceneStart,
      end: sceneEnd,
      clauses: sceneClauses,
    });
  });

  // ⑥ JSON出力
  fs.mkdirSync(path.dirname(FINAL_JSON), { recursive: true });
  fs.writeFileSync(FINAL_JSON, JSON.stringify(finalScript, null, 2), "utf-8");

  console.log("\n✅ script_001.json generated");
  console.log("📊 Scene distribution:");
  STRUCTURE.forEach((s, i) => {
    console.log(`  ${s.type}: ${counts[i]} segments`);
  });
}

main();
