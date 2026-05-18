import { beforeEach, describe, expect, it, vi } from "vitest";
import { RewriteError } from "@/lib/ai/errors";
import { handleRewriteRequest } from "./rewriteHandler";

vi.mock("@/lib/ai/callModel", () => ({
  callModel: vi.fn().mockResolvedValue({ output: "参数确认\n严肃度：中\n\n重写后的学术文本\n结果\n\n精简修改日志\n日志" }),
}));

const validPayload = {
  provider: "openai" as const,
  presetId: "openai" as const,
  apiKey: "sk-test",
  model: "gpt-4o-mini",
  sourceText: "这是原文。",
  seriousness: "中" as const,
  role: "课程论文作者" as const,
};

describe("handleRewriteRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects missing API Key", async () => {
    await expect(handleRewriteRequest({ ...validPayload, apiKey: "" })).rejects.toMatchObject({
      code: "invalid_api_key",
    } satisfies Partial<RewriteError>);
  });

  it("rejects source text over 8000 characters", async () => {
    await expect(
      handleRewriteRequest({ ...validPayload, sourceText: "中".repeat(8_001) }),
    ).rejects.toMatchObject({ code: "content_too_long" } satisfies Partial<RewriteError>);
  });

  it("rejects extra instruction over 500 characters", async () => {
    await expect(
      handleRewriteRequest({ ...validPayload, extraInstruction: "补".repeat(501) }),
    ).rejects.toMatchObject({ code: "content_too_long" } satisfies Partial<RewriteError>);
  });

  it("accepts a safe custom OpenAI-compatible Base URL", async () => {
    await expect(
      handleRewriteRequest({
        ...validPayload,
        provider: "openai-compatible",
        presetId: undefined,
        baseUrl: "https://example.com/v1",
      }),
    ).resolves.toMatchObject({
      ok: true,
      provider: "openai-compatible",
    });
  });

  it("rejects unsafe custom Base URLs", async () => {
    await expect(
      handleRewriteRequest({
        ...validPayload,
        provider: "openai-compatible",
        presetId: undefined,
        baseUrl: "https://localhost/v1",
      }),
    ).rejects.toMatchObject({ code: "unsafe_base_url" } satisfies Partial<RewriteError>);
  });

  it("returns normalized success response", async () => {
    await expect(handleRewriteRequest(validPayload)).resolves.toMatchObject({
      ok: true,
      output: expect.stringContaining("重写后的学术文本"),
      provider: "openai",
      model: "gpt-4o-mini",
    });
  });
});
