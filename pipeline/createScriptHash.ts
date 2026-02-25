import crypto from "crypto";

/**
 * script.json から安定した hash を生成する
 * - script内部にhashは含めない
 * - key順を安定化させて文字列化する
 */
export const createScriptHash = (script: unknown): string => {
  const stableStringify = (obj: any): string => {
    if (obj === null || typeof obj !== "object") {
      return JSON.stringify(obj);
    }

    if (Array.isArray(obj)) {
      return `[${obj.map(stableStringify).join(",")}]`;
    }

    const keys = Object.keys(obj).sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`)
      .join(",")}}`;
  };

  const normalized = stableStringify(script);

  return crypto.createHash("sha256").update(normalized).digest("hex");
};