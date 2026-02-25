import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "usage.json");

const MAX_HISTORY = 3;

// データディレクトリ保証
const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
  }
};

// usage.json 初期化
const ensureFile = () => {
  ensureDataDir();

  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify([]));
  }
};

// 直近使用取得
export const getRecentlyUsed = (): string[] => {
  ensureFile();

  const raw = fs.readFileSync(FILE_PATH, "utf-8");
  const history: string[] = JSON.parse(raw);

  return history.slice(-MAX_HISTORY);
};

// 使用保存
export const saveUsage = (videoPath: string) => {
  ensureFile();

  const raw = fs.readFileSync(FILE_PATH, "utf-8");
  let history: string[] = JSON.parse(raw);

  history.push(videoPath);

  // 古い履歴削除
  if (history.length > 50) {
    history = history.slice(-50);
  }

  fs.writeFileSync(FILE_PATH, JSON.stringify(history, null, 2));
};
