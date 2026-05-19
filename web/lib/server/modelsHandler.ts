import { RewriteError } from "@/lib/ai/errors";
import { listOpenAICompatibleModels } from "@/lib/ai/openai";
import { resolveProviderModelsTarget } from "@/lib/ai/providers";
import type { Provider, ProviderPresetId } from "@/lib/ai/types";

export type ModelsRequest = {
  provider: Provider;
  presetId?: ProviderPresetId;
  baseUrl?: string;
  apiKey: string;
};

export type ModelsSuccessResponse = {
  ok: true;
  models: string[];
};

function assertNonEmpty(value: unknown, code: RewriteError["code"], message: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new RewriteError(code, message, 400);
  }
}

export async function handleModelsRequest(payload: ModelsRequest, signal?: AbortSignal): Promise<ModelsSuccessResponse> {
  assertNonEmpty(payload.apiKey, "invalid_api_key", "请填写 API Key。");

  const target = resolveProviderModelsTarget({
    provider: payload.provider,
    presetId: payload.presetId,
    baseUrl: payload.baseUrl,
  });

  const models = await listOpenAICompatibleModels({
    endpoint: target.endpoint,
    apiKey: payload.apiKey,
    signal,
  });

  return { ok: true, models };
}