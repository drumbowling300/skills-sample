// utils/formatSubtitle.ts

const MAX_CHARS_PER_LINE = 22;

export const formatSubtitle = (text: string): string => {
  if (text.length <= MAX_CHARS_PER_LINE) {
    return text;
  }

  // 句読点優先で改行候補探す
  const punctuationIndex = text.lastIndexOf("、", MAX_CHARS_PER_LINE) 
    || text.lastIndexOf("。", MAX_CHARS_PER_LINE);

  let splitIndex = -1;

  if (punctuationIndex > 0) {
    splitIndex = punctuationIndex + 1;
  } else {
    splitIndex = MAX_CHARS_PER_LINE;
  }

  const firstLine = text.slice(0, splitIndex).trim();
  const secondLine = text.slice(splitIndex).trim();

  if (secondLine.length > MAX_CHARS_PER_LINE) {
    throw new Error("3行以上になる可能性があります。文章を短くしてください。");
  }

  return `${firstLine}\n${secondLine}`;
};
