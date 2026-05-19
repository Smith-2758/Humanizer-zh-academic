import { beforeEach, describe, expect, it, vi } from "vitest";
import { RewriteError } from "@/lib/ai/errors";
import { handleModelsRequest } from "./modelsHandler";

const listOpenAICompatibleModels = vi.fn().mockResolvedValue(["gpt-4.1-mini", "gpt-4.1"]);

vi.mock("@/lib/ai/openai", () => ({
  listOpenAICompatibleModels: (...args: unknown[]) => listOpenAICompatibleModels(...args),
}));

const validPayload = {
  provider: "openai" as const,
  presetId: "openai" as const,
  apiKey: "sk-test",
};

describe("handleModelsRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listOpenAICompatibleModels.mockResolvedValue(["gpt-4.1-mini", "gpt-4.1"]);
  });

  it("rejects missing API Key", async () => {
    await expect(handleModelsRequest({ ...validPayload, apiKey: "" })).rejects.toMatchObject({
      code: "invalid_api_key",
    } satisfies Partial<RewriteError>);
  });

  it("returns normalized model list for OpenAI official", async () => {
    await expect(handleModelsRequest(validPayload)).resolves.toEqual({
      ok: true,
      models: ["gpt-4.1-mini", "gpt-4.1"],
    });
    expect(listOpenAICompatibleModels).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "https://api.openai.com/v1/models",
        apiKey: "sk-test",
      }),
    );
  });

  it("uses safe custom Base URL models endpoint", async () => {
    await handleModelsRequest({
      provider: "openai-compatible",
      presetId: undefined,
      baseUrl: "https://example.com/v1",
      apiKey: "sk-test",
    });

    expect(listOpenAICompatibleModels).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: "https://example.com/v1/models" }),
    );
  });

  it("rejects unsafe custom Base URLs", async () => {
    await expect(
      handleModelsRequest({
        provider: "openai-compatible",
        presetId: undefined,
        baseUrl: "https://localhost/v1",
        apiKey: "sk-test",
      }),
    ).rejects.toMatchObject({ code: "unsafe_base_url" } satisfies Partial<RewriteError>);
  });

  it("rejects Anthropic model list fetching", async () => {
    await expect(
      handleModelsRequest({ provider: "anthropic", presetId: "anthropic", apiKey: "sk-test" }),
    ).rejects.toMatchObject({ code: "provider_error" } satisfies Partial<RewriteError>);
  });
});