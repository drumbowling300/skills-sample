const FILLER_WORDS = [
  "実は",
  "ちなみに",
  "というのも",
  "なんですが",
  "と思います",
  "になります",
  "ことができます",
];

const MAX_LINE_LENGTH = 15;
const MAX_TOTAL_LENGTH = 30;

export const optimizeForCaption = (
  type: string,
  rawText: string
): string => {
  let text = rawText.trim();

  /**
   * ① 冗長語削除
   */
  FILLER_WORDS.forEach((word) => {
    text = text.replaceAll(word, "");
  });

  text = text.trim();

  /**
   * ② HOOKは1行優先（20文字まで許容）
   */
  if (type === "hook") {
    if (text.length <= 20) return text;
  }

  /**
   * ③ 最大30文字制限
   */
  if (text.length > MAX_TOTAL_LENGTH) {
    text = text.slice(0, MAX_TOTAL_LENGTH) + "…";
  }

  /**
   * ④ 2行分割ロジック
   */
  if (text.length <= MAX_LINE_LENGTH) {
    return text;
  }

  // 優先1：読点で分割
  const commaIndex = text.indexOf("、");
  if (commaIndex !== -1 && commaIndex < MAX_LINE_LENGTH) {
    return (
      text.slice(0, commaIndex + 1) +
      "\n" +
      text.slice(commaIndex + 1).trim()
    );
  }

  // 優先2：中央で分割
  const mid = Math.floor(text.length / 2);
  const firstLine = text.slice(0, mid);
  const secondLine = text.slice(mid);

  return firstLine + "\n" + secondLine;
};
