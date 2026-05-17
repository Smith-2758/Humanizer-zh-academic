import { RewriteError } from "@/lib/ai/errors";
import type { RewriteRequest } from "@/lib/ai/types";
import { assertContentLengthAllowed, assertRawBodyAllowed, getAllowedOrigins, getClientIp, sanitizeErrorDetail, validateOrigin } from "@/lib/server/requestGuards";
import { rewriteRateLimiter } from "@/lib/server/rateLimit";
import { handleRewriteRequest } from "@/lib/server/rewriteHandler";

const REQUEST_TIMEOUT_MS = 60_000;

type ErrorResponse = {
  ok: false;
  errorCode: string;
  message: string;
  detail?: string;
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function errorJson(error: ErrorResponse, status: number) {
  return json(error, status);
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export async function POST(request: Request) {
  let payload: Partial<RewriteRequest> | undefined;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const allowedOrigins = getAllowedOrigins();
    if (!validateOrigin(request.headers.get("origin"), allowedOrigins)) {
      throw new RewriteError("provider_error", "请求来源不被允许。", 403);
    }

    assertContentLengthAllowed(request);

    const clientIp = getClientIp(request);
    const limit = rewriteRateLimiter.check(clientIp);
    if (!limit.allowed) {
      throw new RewriteError("rate_limited", "请求过于频繁，请稍后再试。", 429);
    }

    const raw = await request.text();
    assertRawBodyAllowed(raw);
    payload = JSON.parse(raw) as Partial<RewriteRequest>;

    const result = await handleRewriteRequest(payload as RewriteRequest, controller.signal);
    return json(result);
  } catch (error) {
    if (isAbortError(error)) {
      return errorJson({ ok: false, errorCode: "timeout", message: "请求超时，请稍后重试或缩短文本。" }, 504);
    }

    if (error instanceof RewriteError) {
      const detail = error.detail
        ? sanitizeErrorDetail(error.detail, payload?.apiKey, payload?.sourceText)
        : undefined;
      return errorJson(
        { ok: false, errorCode: error.code, message: error.message, ...(detail ? { detail } : {}) },
        error.status,
      );
    }

    if (error instanceof SyntaxError) {
      return errorJson({ ok: false, errorCode: "provider_error", message: "请求格式错误，请刷新页面后重试。" }, 400);
    }

    return errorJson({ ok: false, errorCode: "provider_error", message: "请求处理失败，请稍后重试。" }, 500);
  } finally {
    clearTimeout(timeout);
  }
}
