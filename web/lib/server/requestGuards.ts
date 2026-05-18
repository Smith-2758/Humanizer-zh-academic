import { RewriteError } from "@/lib/ai/errors";

const MAX_BODY_BYTES = 64_000;

function normalizeOrigin(value?: string) {
  if (!value) return undefined;

  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

export function getAllowedOrigins(env = process.env) {
  const origins = [
    normalizeOrigin(env.NEXT_PUBLIC_SITE_URL),
    normalizeOrigin(env.VERCEL_URL ? `https://${env.VERCEL_URL}` : undefined),
  ].filter(Boolean) as string[];

  if (env.NODE_ENV !== "production") origins.push("http://localhost:3000");

  return [...new Set(origins)];
}

export function validateOrigin(origin: string | null, allowedOrigins: string[]) {
  if (!origin) return false;
  if (allowedOrigins.length === 0) return false;
  return allowedOrigins.includes(origin);
}

export function validateRequestOrigin(
  origin: string | null,
  referer: string | null,
  allowedOrigins: string[],
) {
  if (origin) return validateOrigin(origin, allowedOrigins);

  const refererOrigin = normalizeOrigin(referer ?? undefined);
  if (!refererOrigin) return false;

  return validateOrigin(refererOrigin, allowedOrigins);
}

export function assertContentLengthAllowed(request: Request) {
  const value = request.headers.get("content-length");
  if (!value) return;

  const size = Number(value);
  if (!Number.isFinite(size) || size > MAX_BODY_BYTES) {
    throw new RewriteError("content_too_long", "请求内容过大，请缩短文本后再试。", 413);
  }
}

export function assertRawBodyAllowed(raw: string) {
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    throw new RewriteError("content_too_long", "请求内容过大，请缩短文本后再试。", 413);
  }
}

export function sanitizeErrorDetail(detail: string, apiKey?: string, sourceText?: string) {
  if (apiKey && detail.includes(apiKey)) {
    return "上游服务返回了包含敏感信息的错误，已隐藏详情。";
  }

  if (sourceText && detail.includes(sourceText)) {
    return "上游服务返回了包含原文片段的错误，已隐藏详情。";
  }

  let sanitized = detail;

  if (apiKey && apiKey.length >= 8) {
    sanitized = sanitized.replaceAll(apiKey.slice(0, 8), "[redacted-api-key-prefix]");
  }

  if (sourceText && sourceText.length >= 8) {
    sanitized = sanitized.replaceAll(sourceText.slice(0, 20), "[redacted-source-text-prefix]");
    sanitized = sanitized.replaceAll(sourceText.slice(0, 10), "[redacted-source-text-prefix]");
  }

  return sanitized.slice(0, 500);
}

export function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
