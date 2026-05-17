import { callModel } from "@/lib/ai/callModel";
import { RewriteError } from "@/lib/ai/errors";
import { resolveProviderTarget } from "@/lib/ai/providers";
import type { RewriteRequest } from "@/lib/ai/types";
import { buildRewriteMessages } from "@/lib/prompt/buildPrompt";

export type RewriteSuccessResponse = {
  ok: true;
  output: string;
  provider: RewriteRequest["provider"];
  model: string;
  usage?: Awaited<ReturnType<typeof callModel>>["usage"];
};

const SOURCE_TEXT_LIMIT = 8_000;
const EXTRA_INSTRUCTION_LIMIT = 500;

function assertNonEmpty(value: unknown, code: RewriteError["code"], message: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new RewriteError(code, message, 400);
  }
}

export async function handleRewriteRequest(payload: RewriteRequest, signal?: AbortSignal): Promise<RewriteSuccessResponse> {
  assertNonEmpty(payload.apiKey, "invalid_api_key", "请填写 API Key。");
  assertNonEmpty(payload.model, "provider_error", "请填写模型名。");
  assertNonEmpty(payload.sourceText, "content_too_long", "请填写需要处理的原文。");

  if (payload.sourceText.length > SOURCE_TEXT_LIMIT) {
    throw new RewriteError("content_too_long", "原文最多 8000 字，请缩短后再试。", 413);
  }

  if ((payload.extraInstruction?.length ?? 0) > EXTRA_INSTRUCTION_LIMIT) {
    throw new RewriteError("content_too_long", "高级要求最多 500 字，请缩短后再试。", 413);
  }

  const target = resolveProviderTarget({
    provider: payload.provider,
    presetId: payload.presetId,
    baseUrl: payload.baseUrl,
  });
  const messages = buildRewriteMessages(payload);
  const result = await callModel({
    endpoint: target.endpoint,
    format: target.format,
    apiKey: payload.apiKey,
    model: payload.model,
    messages,
    signal,
  });

  return {
    ok: true,
    output: result.output,
    provider: payload.provider,
    model: payload.model,
    usage: result.usage,
  };
}
