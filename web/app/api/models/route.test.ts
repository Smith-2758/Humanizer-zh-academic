import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/modelsHandler", () => ({
  handleModelsRequest: vi.fn().mockResolvedValue({
    ok: true,
    models: ["gpt-4.1-mini", "gpt-4.1"],
  }),
}));

function validPayload() {
  return {
    provider: "openai",
    presetId: "openai",
    apiKey: "sk-route-secret",
  };
}

function makeRequest(body: unknown, headers: HeadersInit = {}) {
  return new Request("https://example.com/api/models", {
    method: "POST",
    headers: {
      origin: "https://example.com",
      "x-forwarded-for": crypto.randomUUID(),
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/models", () => {
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

  it("returns normalized model list for allowed Origin", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const { POST } = await import("./route");

    const response = await POST(makeRequest(validPayload()));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, models: ["gpt-4.1-mini", "gpt-4.1"] });
  });

  it("sanitizes upstream model list errors with API Key", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    vi.doMock("@/lib/server/modelsHandler", async () => {
      const { RewriteError } = await import("@/lib/ai/errors");
      return {
        handleModelsRequest: vi
          .fn()
          .mockRejectedValue(new RewriteError("provider_error", "模型服务返回错误。", 502, "bad sk-route-secret")),
      };
    });
    const { POST } = await import("./route");

    const response = await POST(makeRequest(validPayload()));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.detail).not.toContain("sk-route-secret");
  });

  it("maps AbortError to timeout", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    vi.doMock("@/lib/server/modelsHandler", () => ({
      handleModelsRequest: vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError")),
    }));
    const { POST } = await import("./route");

    const response = await POST(makeRequest(validPayload()));
    const body = await response.json();

    expect(response.status).toBe(504);
    expect(body.errorCode).toBe("timeout");
  });
});