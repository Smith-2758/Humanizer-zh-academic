import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/rewriteHandler", () => ({
  handleRewriteRequest: vi.fn().mockResolvedValue({
    ok: true,
    output: "参数确认\n严肃度：中\n\n重写后的学术文本\n结果\n\n精简修改日志\n日志",
    provider: "openai",
    model: "gpt-4o-mini",
  }),
}));

function validPayload() {
  return {
    provider: "openai",
    presetId: "openai",
    apiKey: "sk-route-secret",
    model: "gpt-4o-mini",
    sourceText: "这是一段需要隐藏的原文内容。",
    seriousness: "中",
    role: "课程论文作者",
  };
}

function makeRequest(body: unknown, headers: HeadersInit = {}) {
  return new Request("https://example.com/api/rewrite", {
    method: "POST",
    headers: {
      origin: "https://example.com",
      "x-forwarded-for": crypto.randomUUID(),
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/rewrite", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("rejects non-allowed Origin", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const { POST } = await import("./route");

    const response = await POST(makeRequest(validPayload(), { origin: "https://evil.example" }));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({ ok: false, errorCode: "provider_error" });
  });

  it("accepts allowed Referer when Origin is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com/app/");
    const { POST } = await import("./route");

    const response = await POST(
      makeRequest(validPayload(), {
        origin: "",
        referer: "https://example.com/rewrite",
      }),
    );

    expect(response.status).toBe(200);
  });

  it("rejects mismatched Origin even if Referer looks allowed", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com/app/");
    const { POST } = await import("./route");

    const response = await POST(
      makeRequest(validPayload(), {
        origin: "https://evil.example",
        referer: "https://example.com/rewrite",
      }),
    );

    expect(response.status).toBe(403);
  });

  it("fails closed in production when no allowed origin is configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    const { POST } = await import("./route");

    const response = await POST(makeRequest(validPayload()));

    expect(response.status).toBe(403);
  });

  it("rejects oversized content-length before parsing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const { POST } = await import("./route");

    const response = await POST(makeRequest(validPayload(), { "content-length": "64001" }));
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body.errorCode).toBe("content_too_long");
  });

  it("rate limits repeated requests from the same IP", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const { POST } = await import("./route");
    const headers = { "x-forwarded-for": "203.0.113.77" };

    let response = await POST(makeRequest(validPayload(), headers));
    for (let i = 0; i < 10; i += 1) response = await POST(makeRequest(validPayload(), headers));

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({ errorCode: "rate_limited" });
  });

  it("maps AbortError to timeout", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    vi.doMock("@/lib/server/rewriteHandler", () => ({
      handleRewriteRequest: vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError")),
    }));
    const { POST } = await import("./route");

    const response = await POST(makeRequest(validPayload()));
    const body = await response.json();

    expect(response.status).toBe(504);
    expect(body.errorCode).toBe("timeout");
  });

  it("sanitizes upstream error detail with API Key and source text", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    vi.doMock("@/lib/server/rewriteHandler", async () => {
      const { RewriteError } = await import("@/lib/ai/errors");
      return {
        handleRewriteRequest: vi
          .fn()
          .mockRejectedValue(
            new RewriteError(
              "provider_error",
              "模型服务返回错误。",
              502,
              "bad sk-route-secret and 这是一段需要隐藏的原文内容。",
            ),
          ),
      };
    });
    const { POST } = await import("./route");

    const response = await POST(makeRequest(validPayload()));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.detail).not.toContain("sk-route-secret");
    expect(body.detail).not.toContain("这是一段需要隐藏的原文内容");
  });
});
