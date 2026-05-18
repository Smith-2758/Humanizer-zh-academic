import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { addHistoryItem, loadHistory } from "@/lib/storage/history";
import { loadSettings, saveSettings } from "@/lib/storage/settings";
import { SettingsForm } from "./SettingsForm";

const historyArgs = {
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
  sourceText: "这是原文。",
};

describe("SettingsForm", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves model defaults, history strategy, and confirmed API Key", () => {
    render(<SettingsForm />);

    fireEvent.change(screen.getByLabelText("默认平台预设"), { target: { value: "deepseek" } });
    fireEvent.change(screen.getByLabelText("默认模型名"), { target: { value: "deepseek-chat" } });
    fireEvent.change(screen.getByLabelText("默认严肃度"), { target: { value: "高" } });
    fireEvent.change(screen.getByLabelText("默认角色"), { target: { value: "毕业设计作者" } });
    fireEvent.change(screen.getByLabelText("历史保存策略"), { target: { value: "result-only" } });
    fireEvent.click(screen.getByLabelText("记住 API Key"));
    fireEvent.change(screen.getByLabelText("API Key"), { target: { value: "sk-confirmed" } });
    fireEvent.click(screen.getByLabelText(/我理解 API Key 会保存在当前浏览器/));
    fireEvent.click(screen.getByRole("button", { name: "保存设置" }));

    expect(loadSettings()).toMatchObject({
      presetId: "deepseek",
      model: "deepseek-chat",
      defaultSeriousness: "高",
      defaultRole: "毕业设计作者",
      historyStrategy: "result-only",
      rememberApiKey: true,
      apiKeySaveConfirmed: true,
      apiKey: "sk-confirmed",
    });
    expect(screen.getByText("设置已保存。" )).toBeInTheDocument();
  });

  it("clears saved API Key, history, and all local data", () => {
    saveSettings({ rememberApiKey: true, apiKeySaveConfirmed: true, apiKey: "sk-confirmed" });
    addHistoryItem({ ...historyArgs, strategy: "full" });
    localStorage.setItem(STORAGE_KEYS.firstRunNotice, "true");

    render(<SettingsForm />);

    fireEvent.click(screen.getByRole("button", { name: "清除 API Key" }));
    expect(loadSettings().apiKey).toBeUndefined();

    fireEvent.click(screen.getByRole("button", { name: "清除历史记录" }));
    expect(loadHistory()).toEqual([]);

    saveSettings({ model: "test-model" });
    localStorage.setItem(STORAGE_KEYS.firstRunNotice, "true");
    fireEvent.click(screen.getByRole("button", { name: "清除全部本地数据" }));

    expect(localStorage.getItem(STORAGE_KEYS.settings)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.firstRunNotice)).toBeNull();
  });
});
