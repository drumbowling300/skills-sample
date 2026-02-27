// src/components/SubtitleLayer.tsx
import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useVideoConfig,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";

// ──────────────────────────────────────────
// 型定義
// ──────────────────────────────────────────
export type ClauseType =
  | "HOOK"
  | "PROBLEM"
  | "AGITATE"
  | "SOLUTION"
  | "BENEFIT"
  | "CTA";

export type SubtitleClause = {
  text: string;
  lines?: string[];    // ✅ \\ による改行がある場合の複数行テキスト
  start: number;
  end: number;
  sceneType: ClauseType;
  highlightWords?: string[];
  ctaKeyword?: string;
};

type Props = {
  clauses: SubtitleClause[];
};

// ──────────────────────────────────────────
// 定数
// ──────────────────────────────────────────
const CTA_HIGHLIGHT_KEYWORDS = ["保存", "キャプション", "チェック"];
const BASE_COLOR = "#FFFFFF";
const HIGHLIGHT_COLOR = "#FFD600";

// ──────────────────────────────────────────
// 🎬 HOOK全体アニメーション用ラッパー
//    HOOKシーン全体の開始フレームからの相対フレームでアニメーションを制御
//    hookStartFrame：HOOKシーン最初のclauseの開始フレーム（絶対値）
//    hookTotalFrames：HOOKシーン全体のフレーム数
// ──────────────────────────────────────────
const HookSceneWrapper: React.FC<{
  children: React.ReactNode;
  yPos: number;
  hookTotalFrames: number;
}> = ({ children, yPos, hookTotalFrames }) => {
  // ✅ useCurrentFrame() はこのコンポーネントが属する Sequence の先頭からの相対フレーム
  //    HOOKシーン全体を囲む外側 Sequence 内で呼ぶことで、
  //    シーン全体を通じた連続アニメーションになる
  const frame = useCurrentFrame();

  // フェードイン：シーン全体の1/3の時間をかけてフェードイン
  const fadeFrames = Math.floor(hookTotalFrames / 3);

  const opacity = interpolate(frame, [0, fadeFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // スケール：シーン全体をかけてゆっくりズームイン（0.85→1.0）
  const scale = interpolate(frame, [0, hookTotalFrames], [0.85, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          width: "100%",
          top: yPos,
          textAlign: "center",
          fontSize: 72,
          fontWeight: 700,
          color: HIGHLIGHT_COLOR,
          textShadow: `
            0 0 20px rgba(255, 214, 0, 1.0),
            0 0 40px rgba(255, 214, 0, 0.8),
            0 0 80px rgba(255, 214, 0, 0.5),
            0 4px 16px rgba(0, 0, 0, 0.9)
          `,
          lineHeight: 1.3,
          pointerEvents: "none",
          opacity,
          transform: `scale(${scale})`,
          transformOrigin: "center top",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

// ──────────────────────────────────────────
// 💚 CTA：発光パルス（特定テキストのみ）
// ──────────────────────────────────────────
const CtaHighlightSubtitle: React.FC<{
  displayElements: React.ReactNode[];
  yPos: number;
}> = ({ displayElements, yPos }) => {
  const frame = useCurrentFrame();
  const pulse = Math.sin((frame / 50) * Math.PI * 2) * 0.5 + 0.5;

  const opacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const glowIntensity = interpolate(pulse, [0, 1], [6, 24]);
  const glowAlpha = interpolate(pulse, [0, 1], [0.55, 1.0]);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          width: "100%",
          top: yPos,
          textAlign: "center",
          fontSize: 72,
          fontWeight: 700,
          color: `rgba(0, 255, 171, ${glowAlpha})`,
          textShadow: `
            0 0 ${glowIntensity}px rgba(0,255,171,0.9),
            0 0 ${glowIntensity * 2}px rgba(0,255,171,0.4),
            0 4px 12px rgba(0,0,0,0.95)
          `,
          lineHeight: 1.3,
          pointerEvents: "none",
          opacity,
        }}
      >
        {displayElements}
      </div>
    </AbsoluteFill>
  );
};

// ──────────────────────────────────────────
// 💬 通常字幕
// ──────────────────────────────────────────
const NormalSubtitle: React.FC<{
  displayElements: React.ReactNode[];
  yPos: number;
}> = ({ displayElements, yPos }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div
      style={{
        position: "absolute",
        width: "100%",
        top: yPos,
        textAlign: "center",
        fontSize: 72,
        fontWeight: 700,
        color: BASE_COLOR,
        textShadow: "0 2px 10px rgba(0,0,0,0.75)",
        lineHeight: 1.3,
        pointerEvents: "none",
      }}
    >
      {displayElements}
    </div>
  </AbsoluteFill>
);

// ──────────────────────────────────────────
// テキスト→displayElements 変換ヘルパー
// ──────────────────────────────────────────
// 1行分のテキストをハイライト分割して返す
function buildLineElements(
  text: string,
  highlightWords: string[],
  isHook?: boolean,
): React.ReactNode[] {
  if (isHook || highlightWords.length === 0) return [text];
  const escaped = highlightWords.map((w) =>
    w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const regex = new RegExp(`(${escaped.join("|")})`, "g");
  return text.split(regex).map((word, idx) =>
    highlightWords.includes(word) ? (
      <span key={`hw-${idx}`} style={{ color: HIGHLIGHT_COLOR }}>
        {word}
      </span>
    ) : (
      word || null
    )
  );
}

// \\ 改行対応：lines がある場合は複数行、ない場合は1行
function buildDisplayElements(
  text: string,
  highlightWords: string[],
  isHook?: boolean,
  lines?: string[],
): React.ReactNode[] {
  // 複数行の場合：各行をハイライト処理して <br> で繋ぐ
  if (lines && lines.length > 1) {
    return lines.flatMap((line, i) => {
      const lineEls = buildLineElements(line, highlightWords, isHook);
      return i < lines.length - 1
        ? [...lineEls, <br key={`br-${i}`} />]
        : lineEls;
    });
  }
  // 1行の場合
  return buildLineElements(text, highlightWords, isHook);
}

// ──────────────────────────────────────────
// 🎬 メインコンポーネント
// ──────────────────────────────────────────
export const SubtitleLayer: React.FC<Props> = ({ clauses }) => {
  const { height, fps } = useVideoConfig();
  if (!clauses || clauses.length === 0) return null;

  const yPos = height * 0.42;

  // ✅ HOOKシーン全体の開始・終了フレームを算出
  const hookClauses = clauses.filter((c) => c.sceneType === "HOOK");
  const hookStartFrame =
    hookClauses.length > 0 ? Math.floor(hookClauses[0].start * fps) : 0;
  const hookEndFrame =
    hookClauses.length > 0
      ? Math.floor(hookClauses[hookClauses.length - 1].end * fps)
      : 0;
  const hookTotalFrames = Math.max(hookEndFrame - hookStartFrame, 1);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>

      {/* ✅ HOOKシーン全体を1つの Sequence で囲み、アニメーションを連続させる */}
      {hookClauses.length > 0 && (
        <Sequence from={hookStartFrame} durationInFrames={hookTotalFrames}>
          <HookSceneWrapper yPos={yPos} hookTotalFrames={hookTotalFrames}>
            {/* HOOKシーン内の各clauseテキストを、表示タイミングだけ制御する */}
            {hookClauses.map((clause, i) => {
              // 外側 Sequence（hookStartFrame基準）からの相対フレーム
              const relativeFrom = Math.floor(clause.start * fps) - hookStartFrame;
              const duration = Math.max(
                Math.floor((clause.end - clause.start) * fps),
                1
              );
              return (
                <Sequence key={i} from={relativeFrom} durationInFrames={duration} layout="none">
                  <span>
                    {clause.lines && clause.lines.length > 1
                      ? clause.lines.flatMap((line, li) =>
                          li < clause.lines!.length - 1
                            ? [line, <br key={`br-${li}`} />]
                            : [line]
                        )
                      : clause.text}
                  </span>
                </Sequence>
              );
            })}
          </HookSceneWrapper>
        </Sequence>
      )}

      {/* 通常・CTA字幕（HOOK以外） */}
      {clauses
        .filter((c) => c.sceneType !== "HOOK")
        .map((clause, i) => {
          const startFrame = Math.floor(clause.start * fps);
          const durationInFrames = Math.max(
            Math.floor((clause.end - clause.start) * fps),
            1
          );

          const isCTAHighlight =
            clause.sceneType === "CTA" &&
            CTA_HIGHLIGHT_KEYWORDS.some((kw) => clause.text.includes(kw));

          const highlightWords = clause.highlightWords ?? [];
          const displayElements = buildDisplayElements(
            clause.text,
            highlightWords,
            false,
            clause.lines,
          );

          return (
            <Sequence key={`non-hook-${i}`} from={startFrame} durationInFrames={durationInFrames}>
              {isCTAHighlight ? (
                <CtaHighlightSubtitle displayElements={displayElements} yPos={yPos} />
              ) : (
                <NormalSubtitle displayElements={displayElements} yPos={yPos} />
              )}
            </Sequence>
          );
        })}
    </AbsoluteFill>
  );
};
