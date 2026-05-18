import { describe, expect, it } from "vitest";
import { getProviderPresets, resolveProviderTarget } from "./providers";

describe("resolveProviderTarget", () => {
  it("uses fixed OpenAI official endpoint", () => {
    expect(resolveProviderTarget({ provider: "openai" })).toEqual({
      endpoint: "https://api.openai.com/v1/chat/completions",
      format: "openai",
    });
  });

  it("uses fixed Anthropic endpoint", () => {
    expect(resolveProviderTarget({ provider: "anthropic" })).toEqual({
      endpoint: "https://api.anthropic.com/v1/messages",
      format: "anthropic",
    });
  });

  it("resolves allowlisted OpenAI-compatible presets", () => {
    expect(resolveProviderTarget({ provider: "openai-compatible", presetId: "deepseek" })).toEqual({
      endpoint: "https://api.deepseek.com/v1/chat/completions",
      format: "openai",
    });
  });

  it("resolves a safe custom OpenAI-compatible Base URL", () => {
    expect(resolveProviderTarget({ provider: "openai-compatible", baseUrl: "https://example.com/v1/" })).toEqual({
      endpoint: "https://example.com/v1/chat/completions",
      format: "openai",
    });
  });

  it("rejects unsafe custom Base URLs", () => {
    expect(() =>
      resolveProviderTarget({ provider: "openai-compatible", baseUrl: "http://example.com/v1" }),
    ).toThrow(/HTTPS/i);
    expect(() =>
      resolveProviderTarget({ provider: "openai-compatible", baseUrl: "https://localhost/v1" }),
    ).toThrow(/private|local/i);
    expect(() =>
      resolveProviderTarget({ provider: "openai-compatible", baseUrl: "https://192.168.1.10/v1" }),
    ).toThrow(/private|local/i);
    expect(() =>
      resolveProviderTarget({ provider: "openai-compatible", baseUrl: "https://example.com/v1?token=1" }),
    ).toThrow(/query|fragment/i);
  });

  it("exposes recommended model metadata for UI", () => {
    const deepseek = getProviderPresets().find((preset) => preset.id === "deepseek");
    expect(deepseek?.recommendedModel).toBe("deepseek-chat");
    expect(deepseek?.label).toContain("DeepSeek");
  });
});
