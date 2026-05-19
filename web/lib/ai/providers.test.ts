import { describe, expect, it } from "vitest";
import { getProviderPresets, resolveProviderModelsTarget, resolveProviderTarget } from "./providers";

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

  it("normalizes a custom chat completions endpoint back to the Base URL", () => {
    expect(resolveProviderModelsTarget({ provider: "openai-compatible", baseUrl: "https://example.com/v1/chat/completions" })).toEqual({
      endpoint: "https://example.com/v1/models",
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
    const openai = getProviderPresets().find((preset) => preset.id === "openai");
    const deepseek = getProviderPresets().find((preset) => preset.id === "deepseek");
    const kimi = getProviderPresets().find((preset) => preset.id === "kimi");
    const zhipu = getProviderPresets().find((preset) => preset.id === "zhipu");
    expect(openai?.recommendedModel).toBe("gpt-5.5");
    expect(deepseek?.recommendedModel).toBe("deepseek-v4-pro");
    expect(kimi?.recommendedModel).toBe("kimi-k2.6");
    expect(zhipu?.recommendedModel).toBe("GLM-5.1");
    expect(deepseek?.label).toContain("DeepSeek");
  });
});

describe("resolveProviderModelsTarget", () => {
  it("uses the OpenAI official models endpoint", () => {
    expect(resolveProviderModelsTarget({ provider: "openai" })).toEqual({
      endpoint: "https://api.openai.com/v1/models",
      format: "openai",
    });
  });

  it("uses allowlisted OpenAI-compatible preset models endpoints", () => {
    expect(resolveProviderModelsTarget({ provider: "openai-compatible", presetId: "deepseek" })).toEqual({
      endpoint: "https://api.deepseek.com/v1/models",
      format: "openai",
    });
  });

  it("uses safe custom OpenAI-compatible Base URL models endpoints", () => {
    expect(resolveProviderModelsTarget({ provider: "openai-compatible", baseUrl: "https://example.com/v1/" })).toEqual({
      endpoint: "https://example.com/v1/models",
      format: "openai",
    });
  });

  it("does not support Anthropic model list fetching", () => {
    expect(() => resolveProviderModelsTarget({ provider: "anthropic" })).toThrow(/Anthropic/i);
  });
});