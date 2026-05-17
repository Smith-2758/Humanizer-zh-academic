import type { CustomRole, Provider, RewriteRole, Seriousness, Usage } from "@/lib/ai/types";
import type { ParsedRewriteOutput } from "@/lib/output/parseRewriteOutput";
import { STORAGE_KEYS } from "./keys";
import type { HistoryStrategy } from "./settings";

export type HistoryItem = {
  id: string;
  createdAt: string;
  sourceText?: string;
  rawOutput: string;
  parsedOutput: ParsedRewriteOutput;
  provider: Provider;
  presetId?: string;
  model: string;
  seriousness: Seriousness;
  role: RewriteRole;
  customRole?: CustomRole;
  extraInstruction?: string;
  usage?: Usage;
};

export type AddHistoryItemArgs = Omit<HistoryItem, "id" | "createdAt" | "sourceText"> & {
  strategy: HistoryStrategy;
  sourceText: string;
};

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.history);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(items.slice(0, 100)));
  } catch {
    throw new Error("历史记录保存失败，可能是浏览器隐私模式或存储空间不足。");
  }
}

export function addHistoryItem(args: AddHistoryItemArgs) {
  const { strategy, sourceText, ...rest } = args;
  if (strategy === "none") return;

  const item: HistoryItem = {
    ...rest,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...(strategy === "full" ? { sourceText } : {}),
  };

  saveHistory([item, ...loadHistory()]);
}

export function deleteHistoryItem(id: string) {
  saveHistory(loadHistory().filter((item) => item.id !== id));
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEYS.history);
}
