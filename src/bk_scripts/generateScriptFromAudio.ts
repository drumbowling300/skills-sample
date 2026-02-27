// src/scripts/generateScriptFromAudio.ts
// ✅ 外部型ファイルへの依存を排除 - 型をこのファイル内で直接定義

// ──────────────────────────────────────────
// 型定義（このファイル内で完結）
// ──────────────────────────────────────────
export type ClauseType =
  | "HOOK"
  | "PROBLEM"
  | "AGITATE"
  | "SOLUTION"
  | "BENEFIT"
  | "CTA";

export type Clause = {
  start: number;
  end: number;
  rawText: string;
  displayText: string;
  type: ClauseType;
  highlightWords: string[];
  ctaKeyword?: string;
};

// ──────────────────────────────────────────
// 定数
// ──────────────────────────────────────────
const HIGHLIGHT_WORDS: string[] = [
  "危険", "損", "知らない", "今すぐ", "無料", "限定", "絶対",
];

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

const MAX_CHARS = 18;

// ──────────────────────────────────────────
// シーンタイプ自動検出
// ──────────────────────────────────────────
function detectType(index: number, total: number): ClauseType {
  if (index === 0) return "HOOK";
  if (index === total - 1) return "CTA";
  const ratio = index / total;
  if (ratio < 0.25) return "PROBLEM";
  if (ratio < 0.45) return "AGITATE";
  if (ratio < 0.75) return "SOLUTION";
  return "BENEFIT";
}

// ──────────────────────────────────────────
// 自然な字幕区切り
// ──────────────────────────────────────────
function splitIntoDisplayUnits(text: string): string[] {
  if (text.length <= MAX_CHARS) return [text];
  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= MAX_CHARS) { chunks.push(remaining); break; }

    const win = remaining.slice(0, MAX_CHARS + 1);

    // ① 読点・句点
    const punctIdx = Math.max(
      win.lastIndexOf("、"), win.lastIndexOf("。"),
      win.lastIndexOf("！"), win.lastIndexOf("？"), win.lastIndexOf("…"),
    );
    if (punctIdx > 0) {
      chunks.push(remaining.slice(0, punctIdx + 1).trim());
      remaining = remaining.slice(punctIdx + 1).trim();
      continue;
    }

    // ② 助詞の後ろ
    const particlePattern = /[はがをにでもとへよね](?=\S)/g;
    let lastIdx = -1;
    let m: RegExpExecArray | null;
    while ((m = particlePattern.exec(win)) !== null) {
      if (m.index <= MAX_CHARS) lastIdx = m.index + 1;
    }
    if (lastIdx > MAX_CHARS / 2) {
      chunks.push(remaining.slice(0, lastIdx).trim());
      remaining = remaining.slice(lastIdx).trim();
      continue;
    }

    // ③ 強制分割
    chunks.push(remaining.slice(0, MAX_CHARS));
    remaining = remaining.slice(MAX_CHARS).trim();
  }
  return chunks.filter(Boolean);
}

// ──────────────────────────────────────────
// タイムコード再分配
// ──────────────────────────────────────────
function redistributeTiming(
  chunks: string[], segStart: number, segEnd: number,
): { text: string; start: number; end: number }[] {
  const totalChars = chunks.reduce((s, c) => s + c.length, 0);
  const totalDur = segEnd - segStart;
  let cur = segStart;

  return chunks.map((text, i) => {
    const ratio = totalChars > 0 ? text.length / totalChars : 1 / chunks.length;
    const dur = Math.max(totalDur * ratio, 0.35);
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
// 字幕最適化（NG変換・丁寧語除去・ハイライト検出）
// ──────────────────────────────────────────
function optimizeSubtitle(rawText: string, type: ClauseType) {
  let text = rawText;
  text = text.replace(/です(?![^\s])/g, "");
  text = text.replace(/ます(?![^\s])/g, "");
  text = text.replace(/[。、]/g, "");
  text = text.replace(/(\d+)万/g, "$1ﾏﾝ");
  text = text.replace(/(\d+)円/g, "$1ｴﾝ");

  Object.keys(NG_REPLACEMENTS)
    .sort((a, b) => b.length - a.length)
    .forEach((w) => {
      text = text.replace(new RegExp(w, "g"), NG_REPLACEMENTS[w]);
    });

  const highlightWords = HIGHLIGHT_WORDS.filter((w) => text.includes(w));
  let ctaKeyword: string | undefined;
  if (type === "CTA") {
    const match = text.match(/「(.+?)」/);
    if (match) ctaKeyword = match[1];
  }
  return { displayText: text.trim(), highlightWords, ctaKeyword };
}

// ──────────────────────────────────────────
// メインエクスポート
// ──────────────────────────────────────────
export function generateScriptFromAudio(
  segments: { start: number; end: number; text: string }[]
): Clause[] {
  const result: Clause[] = [];
  const tempTypes = segments.map((_, i) => detectType(i, segments.length));

  segments.forEach((seg, index) => {
    const rawText = seg.text.trim();
    if (!rawText) return;
    const type = tempTypes[index];
    const segEnd = seg.start + Math.max(seg.end - seg.start, 0.8);
    const chunks = splitIntoDisplayUnits(rawText);
    const timed = redistributeTiming(chunks, seg.start, segEnd);

    timed.forEach(({ text, start, end }) => {
      const { displayText, highlightWords, ctaKeyword } = optimizeSubtitle(text, type);
      result.push({ start, end, rawText: text, displayText, type, highlightWords, ctaKeyword });
    });
  });

  return result;
}
