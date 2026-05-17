import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "./keys";
import { addHistoryItem, clearHistory, deleteHistoryItem, loadHistory, saveHistory } from "./history";

const baseHistoryArgs = {
  rawOutput: "参数确认\n严肃度：中\n\n重写后的学术文本\n结果\n\n精简修改日志\n日志",
  parsedOutput: {
    parameterConfirmation: "严肃度：中",
    rewrittenText: "结果",
    changeLog: "日志",
    rawOutput: "raw",
  },
  provider: "openai" as const,
  presetId: "openai",
  model: "gpt-4o-mini",
  seriousness: "中" as const,
  role: "课程论文作者" as const,
  extraInstruction: "保留结构。",
  usage: { totalTokens: 12 },
  sourceText: "这是原文。",
};

describe("history storage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("saves full history with source text and metadata", () => {
    addHistoryItem({ ...baseHistoryArgs, strategy: "full" });

    const [item] = loadHistory();

    expect(item.sourceText).toBe("这是原文。");
    expect(item.model).toBe("gpt-4o-mini");
    expect(item.provider).toBe("openai");
    expect(item.seriousness).toBe("中");
    expect(item.role).toBe("课程论文作者");
    expect(item.usage?.totalTokens).toBe(12);
  });

  it("saves result-only history without source text or strategy", () => {
    addHistoryItem({ ...baseHistoryArgs, strategy: "result-only" });

    const [item] = loadHistory();
    const rawStored = localStorage.getItem(STORAGE_KEYS.history) ?? "";

    expect(item.sourceText).toBeUndefined();
    expect(item.rawOutput).toContain("重写后的学术文本");
    expect(item.model).toBe("gpt-4o-mini");
    expect(rawStored).not.toContain("sourceText");
    expect(rawStored).not.toContain("strategy");
  });

  it("does not save history when strategy is none", () => {
    addHistoryItem({ ...baseHistoryArgs, strategy: "none" });

    expect(loadHistory()).toEqual([]);
  });

  it("deletes one history item", () => {
    saveHistory([
      { ...baseHistoryArgs, id: "a", createdAt: "2026-05-17T00:00:00.000Z", sourceText: "A" },
      { ...baseHistoryArgs, id: "b", createdAt: "2026-05-17T00:01:00.000Z", sourceText: "B" },
    ]);

    deleteHistoryItem("a");

    expect(loadHistory().map((item) => item.id)).toEqual(["b"]);
  });

  it("clears history", () => {
    addHistoryItem({ ...baseHistoryArgs, strategy: "full" });

    clearHistory();

    expect(loadHistory()).toEqual([]);
  });

  it("returns empty history for invalid stored JSON", () => {
    localStorage.setItem(STORAGE_KEYS.history, "not-json");

    expect(loadHistory()).toEqual([]);
  });

  it("surfaces localStorage write failures", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    expect(() => saveHistory([])).toThrow("历史记录保存失败");
  });
});
