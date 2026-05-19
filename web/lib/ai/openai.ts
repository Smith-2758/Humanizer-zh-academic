import { RewriteError } from "./errors";
import type { Usage } from "./types";

export type ModelMessages = {
  system: string;
  user: string;
};

export type CallProviderArgs = {
  endpoint: string;
  apiKey: string;
  model: string;
  messages: ModelMessages;
  signal?: AbortSignal;
};

export type ModelResult = {
  output: string;
  usage?: Usage;
};

type ListModelsArgs = {
  endpoint: string;
  apiKey: string;
  signal?: AbortSignal;
};

function extractErrorMessage(payload: unknown) {
  if (typeof payload === "string") return payload;
  if (!payload || typeof payload !== "object") return "Unknown upstream error";

  const error = "error" in payload ? payload.error : undefined;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  if ("message" in payload && typeof payload.message === "string") return payload.message;
  return "Unknown upstream error";
}

function mapProviderError(status: number, detail: string) {
  const lowered = detail.toLowerCase();
  if (status === 401 || status === 403) {
    throw new RewriteError("invalid_api_key", "API Key 无效或无权限。", status, detail);
  }
  if (status === 404) {
    throw new RewriteError("model_not_found", "模型不存在或当前账号无权使用。", status, detail);
  }
  if (status === 429) {
    throw new RewriteError("rate_limited", "请求过于频繁，请稍后再试。", status, detail);
  }
  if (lowered.includes("quota") || lowered.includes("insufficient balance") || lowered.includes("billing")) {
    throw new RewriteError("quota_exceeded", "模型额度不足或账户余额不足。", status, detail);
  }

  throw new RewriteError("provider_error", "模型服务返回错误。", status, detail);
}

async function parseJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function normalizeModelIds(payload: unknown) {
  if (!payload || typeof payload !== "object") return [];
  const data = "data" in payload ? payload.data : undefined;
  if (!Array.isArray(data)) return [];

  const ids = data
    .map((item) => (item && typeof item === "object" && "id" in item ? item.id : undefined))
    .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
    .map((id) => id.trim());

  return [...new Set(ids)];
}

export async function listOpenAICompatibleModels(args: ListModelsArgs): Promise<string[]> {
  const response = await fetch(args.endpoint, {
    method: "GET",
    redirect: "error",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
    },
    signal: args.signal,
  });

  const payload = await parseJson(response);
  if (!response.ok) mapProviderError(response.status, extractErrorMessage(payload));

  const models = normalizeModelIds(payload);
  if (models.length === 0) {
    throw new RewriteError("provider_error", "没有读取到可用模型列表，请手动填写模型名。", 502);
  }

  return models;
}

export async function callOpenAICompatible(args: CallProviderArgs): Promise<ModelResult> {
  const response = await fetch(args.endpoint, {
    method: "POST",
    redirect: "error",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify({
      model: args.model,
      messages: [
        { role: "system", content: args.messages.system },
        { role: "user", content: args.messages.user },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      stream: false,
    }),
    signal: args.signal,
  });

  const payload = await parseJson(response);
  if (!response.ok) mapProviderError(response.status, extractErrorMessage(payload));

  const output = payload?.choices?.[0]?.message?.content;
  if (typeof output !== "string") {
    throw new RewriteError("provider_error", "模型服务返回内容格式异常。", 502);
  }

  const usage = payload?.usage;
  return {
    output,
    usage: usage
      ? {
          inputTokens: usage.prompt_tokens,
          outputTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        }
      : undefined,
  };
}

export { mapProviderError };