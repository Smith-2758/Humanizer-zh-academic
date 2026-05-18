import { describe, expect, it } from "vitest";
import { RewriteError } from "@/lib/ai/errors";
import {
  assertContentLengthAllowed,
  assertRawBodyAllowed,
  getAllowedOrigins,
  getClientIp,
  sanitizeErrorDetail,
  validateOrigin,
  validateRequestOrigin,
} from "./requestGuards";

describe("request guards", () => {
  it("allows configured origins", () => {
    const allowedOrigins = getAllowedOrigins({
      NODE_ENV: "production",
      NEXT_PUBLIC_SITE_URL: "https://example.com",
      VERCEL_URL: "humanizer.vercel.app",
    });

    expect(validateOrigin("https://example.com", allowedOrigins)).toBe(true);
    expect(validateOrigin("https://humanizer.vercel.app", allowedOrigins)).toBe(true);
  });

  it("normalizes configured origins from full URLs", () => {
    const allowedOrigins = getAllowedOrigins({
      NODE_ENV: "production",
      NEXT_PUBLIC_SITE_URL: "https://example.com/app/",
    });

    expect(allowedOrigins).toEqual(["https://example.com"]);
    expect(validateOrigin("https://example.com", allowedOrigins)).toBe(true);
  });

  it("rejects unknown origins", () => {
    expect(validateOrigin("https://evil.example", ["https://example.com"])).toBe(false);
  });

  it("accepts allowed referer when origin is missing", () => {
    expect(
      validateRequestOrigin(null, "https://example.com/rewrite?from=nav", ["https://example.com"]),
    ).toBe(true);
  });

  it("rejects mismatched origin even if referer looks allowed", () => {
    expect(
      validateRequestOrigin(
        "https://evil.example",
        "https://example.com/rewrite?from=nav",
        ["https://example.com"],
      ),
    ).toBe(false);
  });

  it("rejects invalid referer fallback", () => {
    expect(validateRequestOrigin(null, "not-a-url", ["https://example.com"])).toBe(false);
  });

  it("fails closed in production when no origin is configured", () => {
    const allowedOrigins = getAllowedOrigins({ NODE_ENV: "production" });

    expect(allowedOrigins).toEqual([]);
    expect(validateOrigin("https://example.com", allowedOrigins)).toBe(false);
  });

  it("allows localhost in development", () => {
    const allowedOrigins = getAllowedOrigins({ NODE_ENV: "development" });

    expect(validateOrigin("http://localhost:3000", allowedOrigins)).toBe(true);
  });

  it("rejects oversized content-length before body is read", () => {
    const request = new Request("https://example.com/api/rewrite", {
      method: "POST",
      headers: { "content-length": "64001" },
    });

    expect(() => assertContentLengthAllowed(request)).toThrow(RewriteError);
    expect(() => assertContentLengthAllowed(request)).toThrow("请求内容过大");
  });

  it("allows missing content-length so read-time validation can run", () => {
    const request = new Request("https://example.com/api/rewrite", { method: "POST" });

    expect(() => assertContentLengthAllowed(request)).not.toThrow();
  });

  it("rejects invalid content-length before body is read", () => {
    const request = new Request("https://example.com/api/rewrite", {
      method: "POST",
      headers: { "content-length": "not-a-number" },
    });

    expect(() => assertContentLengthAllowed(request)).toThrow(RewriteError);
  });

  it("rejects oversized raw body during read-time validation", () => {
    expect(() => assertRawBodyAllowed("中".repeat(64_001))).toThrow(RewriteError);
  });

  it("redacts API Key and source text from upstream error detail", () => {
    expect(sanitizeErrorDetail("bad key sk-secret-value", "sk-secret-value", undefined)).toBe(
      "上游服务返回了包含敏感信息的错误，已隐藏详情。",
    );
    expect(sanitizeErrorDetail("bad text 这是一段需要隐藏的原文内容", undefined, "这是一段需要隐藏的原文内容")).toBe(
      "上游服务返回了包含原文片段的错误，已隐藏详情。",
    );
  });

  it("does not expose raw sensitive prefixes in sanitized detail", () => {
    const detail = sanitizeErrorDetail(
      "upstream mentions sk-secret prefix and 这是一段需要隐藏的原文",
      "sk-secret-value",
      "这是一段需要隐藏的原文内容，后面还有更多文本。",
    );

    expect(detail).not.toContain("sk-secret");
    expect(detail).not.toContain("这是一段需要隐藏的原文");
  });

  it("extracts client IP from forwarded headers", () => {
    const request = new Request("https://example.com/api/rewrite", {
      headers: { "x-forwarded-for": "203.0.113.1, 203.0.113.2" },
    });

    expect(getClientIp(request)).toBe("203.0.113.1");
  });
});
