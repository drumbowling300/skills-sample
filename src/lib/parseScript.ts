type Scene = {
  type: string;
  text: string;
};

const TYPE_MAP: Record<string, string> = {
  HOOK: "hook",
  PROBLEM: "problem",
  AGITATE: "agitate",
  SOLUTION: "solution",
  BENEFIT: "benefit",
  CTA: "cta",
};

export const parseScript = (raw: string): Scene[] => {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const scenes: Scene[] = [];

  for (const line of lines) {
    const [rawType, ...textParts] = line.split("|");

    if (!rawType || textParts.length === 0) continue;

    const type = TYPE_MAP[rawType.toUpperCase()];
    if (!type) continue;

    const text = textParts.join("|").trim();

    scenes.push({
      type,
      text,
    });
  }

  return scenes;
};
