import { beforeEach, describe, expect, it, vi } from "vitest";
import { RewriteError } from "./errors";
import { callModel } from "./callModel";
import { listOpenAICompatibleModels } from "./openai";

const baseArgs = {
  endpoint: "https://api.example.com/v1/chat/completions",
  apiKey: "sk-test",
  model: "test-model",
  messages: {
    system: "系统提示词",
    user: "用户提示词",
  },
};

function mockJsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

describe("callModel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("maps OpenAI-compatible success payload and usage", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockJsonResponse({
        choices: [{ message: { content: "改写结果" } }],
        usage: { prompt_tokens: 11, completion_tokens: 22, total_tokens: 33 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await callModel({ ...baseArgs, format: "openai" });

    expect(result).toEqual({
      output: "改写结果",
      usage: { inputTokens: 11, outputTokens: 22, totalTokens: 33 },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      baseArgs.endpoint,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer sk-test" }),
        redirect: "error",
      }),
    );

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body).toMatchObject({
      model: "test-model",
      temperature: 0.7,
      max_tokens: 4000,
      stream: false,
      messages: [
        { role: "system", content: "系统提示词" },
        { role: "user", content: "用户提示词" },
      ],
    });
  });

  it("maps Anthropic success payload and usage", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockJsonResponse({
        content: [{ type: "text", text: "Claude 改写结果" }],
        usage: { input_tokens: 12, output_tokens: 34 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await callModel({
      ...baseArgs,
      endpoint: "https://api.anthropic.com/v1/messages",
      format: "anthropic",
    });

    expect(result).toEqual({
      output: "Claude 改写结果",
      usage: { inputTokens: 12, outputTokens: 34, totalTokens: 46 },
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body).toMatchObject({
      model: "test-model",
      system: "系统提示词",
      temperature: 0.7,
      max_tokens: 4000,
      stream: false,
      messages: [{ role: "user", content: "用户提示词" }],
    });
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({
      "x-api-key": "sk-test",
      "anthropic-version": "2023-06-01",
    });
  });

  it("does not produce NaN when Anthropic usage is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockJsonResponse({ content: [{ type: "text", text: "结果" }] })),
    );

    const result = await callModel({
      ...baseArgs,
      endpoint: "https://api.anthropic.com/v1/messages",
      format: "anthropic",
    });

    expect(result.usage).toBeUndefined();
  });

  it.each([
    [401, "invalid_api_key"],
    [403, "invalid_api_key"],
    [404, "model_not_found"],
    [429, "rate_limited"],
  ] as const)("maps HTTP %s to %s", async (status, code) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockJsonResponse({ error: { message: "upstream error" } }, { status })));

    await expect(callModel({ ...baseArgs, format: "openai" })).rejects.toMatchObject({ code });
  });

  it("maps quota-like upstream errors to quota_exceeded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockJsonResponse({ error: { message: "insufficient quota" } }, { status: 400 })),
    );

    await expect(callModel({ ...baseArgs, format: "openai" })).rejects.toMatchObject({ code: "quota_exceeded" });
  });

  it("maps unknown upstream errors to provider_error with detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockJsonResponse({ error: { message: "strange upstream failure" } }, { status: 500 })),
    );

    await expect(callModel({ ...baseArgs, format: "openai" })).rejects.toMatchObject({
      code: "provider_error",
      detail: "strange upstream failure",
    } satisfies Partial<RewriteError>);
  });
});

describe("listOpenAICompatibleModels", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads and normalizes OpenAI-compatible model IDs", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockJsonResponse({
        data: [
          { id: "gpt-4.1-mini" },
          { id: "gpt-4.1-mini" },
          { id: "gpt-4.1" },
          { id: "" },
          { object: "model" },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(listOpenAICompatibleModels({ endpoint: "https://api.example.com/v1/models", apiKey: "sk-test" })).resolves.toEqual([
      "gpt-4.1-mini",
      "gpt-4.1",
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/models",
      expect.objectContaining({
        method: "GET",
        redirect: "error",
        headers: expect.objectContaining({ Authorization: "Bearer sk-test" }),
      }),
    );
  });

  it("maps model list upstream auth failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockJsonResponse({ error: { message: "bad key" } }, { status: 401 })));

    await expect(listOpenAICompatibleModels({ endpoint: "https://api.example.com/v1/models", apiKey: "bad" })).rejects.toMatchObject({
      code: "invalid_api_key",
    });
  });

  it("rejects empty model list payloads", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockJsonResponse({ data: [] })));

    await expect(listOpenAICompatibleModels({ endpoint: "https://api.example.com/v1/models", apiKey: "sk-test" })).rejects.toMatchObject({
      code: "provider_error",
    });
  });
});