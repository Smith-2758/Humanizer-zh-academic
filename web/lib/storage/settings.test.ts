import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "./keys";
import { clearApiKey, loadSettings, saveSettings } from "./settings";

describe("settings storage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("does not persist API Key when rememberApiKey is false", () => {
    saveSettings({ rememberApiKey: false, apiKeySaveConfirmed: true, apiKey: "sk-test" });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) ?? "{}");

    expect(stored.apiKey).toBeUndefined();
    expect(loadSettings().apiKey).toBeUndefined();
  });

  it("persists API Key only when rememberApiKey and confirmation are both true", () => {
    saveSettings({ rememberApiKey: true, apiKeySaveConfirmed: false, apiKey: "sk-no-confirm" });
    expect(loadSettings().apiKey).toBeUndefined();

    saveSettings({ rememberApiKey: true, apiKeySaveConfirmed: true, apiKey: "sk-confirmed" });

    expect(loadSettings().apiKey).toBe("sk-confirmed");
  });

  it("clears a saved API Key and disables future persistence", () => {
    saveSettings({ rememberApiKey: true, apiKeySaveConfirmed: true, apiKey: "sk-confirmed" });

    clearApiKey();

    expect(loadSettings()).toMatchObject({ rememberApiKey: false, apiKeySaveConfirmed: false });
    expect(loadSettings().apiKey).toBeUndefined();
  });

  it("returns defaults for invalid stored JSON", () => {
    localStorage.setItem(STORAGE_KEYS.settings, "not-json");

    expect(loadSettings()).toEqual({ historyStrategy: "full", rememberApiKey: false });
  });

  it("surfaces localStorage write failures", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    expect(() => saveSettings({ model: "test-model" })).toThrow("本地设置保存失败");
  });
});
