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

  it("rejects custom baseUrl in V1", () => {
    expect(() =>
      resolveProviderTarget({ provider: "openai-compatible", baseUrl: "https://example.com/v1" }),
    ).toThrow("Custom Base URL is disabled in V1");
  });

  it("exposes recommended model metadata for UI", () => {
    const deepseek = getProviderPresets().find((preset) => preset.id === "deepseek");
    expect(deepseek?.recommendedModel).toBe("deepseek-chat");
    expect(deepseek?.label).toContain("DeepSeek");
  });
});
