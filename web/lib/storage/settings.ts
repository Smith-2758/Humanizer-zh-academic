import { STORAGE_KEYS } from "./keys";

export type HistoryStrategy = "full" | "result-only" | "none";

export type Settings = {
  provider?: string;
  presetId?: string;
  model?: string;
  rememberApiKey?: boolean;
  apiKeySaveConfirmed?: boolean;
  apiKey?: string;
  defaultSeriousness?: string;
  defaultRole?: string;
  historyStrategy?: HistoryStrategy;
};

const DEFAULT_SETTINGS: Settings = { historyStrategy: "full", rememberApiKey: false };

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings) {
  const next = { ...loadSettings(), ...settings };
  if (!next.rememberApiKey || !next.apiKeySaveConfirmed) delete next.apiKey;

  try {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(next));
  } catch {
    throw new Error("本地设置保存失败，可能是浏览器隐私模式或存储空间不足。");
  }
}

export function clearApiKey() {
  const next = loadSettings();
  delete next.apiKey;
  next.rememberApiKey = false;
  next.apiKeySaveConfirmed = false;
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(next));
}

export function clearAllLocalData() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}
