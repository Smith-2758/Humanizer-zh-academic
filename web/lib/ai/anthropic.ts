import type { CallProviderArgs, ModelResult } from "./openai";
import { mapProviderError } from "./openai";
import { RewriteError } from "./errors";

async function parseJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

export async function callAnthropic(args: CallProviderArgs): Promise<ModelResult> {
  const response = await fetch(args.endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": args.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: args.model,
      system: args.messages.system,
      messages: [{ role: "user", content: args.messages.user }],
      temperature: 0.7,
      max_tokens: 4000,
      stream: false,
    }),
    signal: args.signal,
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    const detail = payload?.error?.message ?? payload?.message ?? "Unknown upstream error";
    mapProviderError(response.status, detail);
  }

  const output = payload?.content?.find((item: { type?: string }) => item.type === "text")?.text;
  if (typeof output !== "string") {
    throw new RewriteError("provider_error", "模型服务返回内容格式异常。", 502);
  }

  const inputTokens = payload?.usage?.input_tokens;
  const outputTokens = payload?.usage?.output_tokens;
  const hasUsage = typeof inputTokens === "number" && typeof outputTokens === "number";

  return {
    output,
    usage: hasUsage
      ? {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
        }
      : undefined,
  };
}
