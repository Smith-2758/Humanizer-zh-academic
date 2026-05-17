import type { Provider, ProviderPresetId } from "./types";

type ResolveArgs = {
  provider: Provider;
  presetId?: ProviderPresetId;
  baseUrl?: string;
};

type ProviderTarget = {
  endpoint: string;
  format: "openai" | "anthropic";
};

export type ProviderPreset = {
  id: ProviderPresetId;
  label: string;
  provider: Provider;
  baseUrl?: string;
  recommendedModel: string;
  helpText: string;
};

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";

const PRESETS: ProviderPreset[] = [
  {
    id: "openai",
    label: "OpenAI 官方",
    provider: "openai",
    recommendedModel: "gpt-4o-mini",
    helpText: "使用 OpenAI 官方 API。",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    provider: "openai-compatible",
    baseUrl: "https://api.deepseek.com/v1",
    recommendedModel: "deepseek-chat",
    helpText: "OpenAI 兼容接口，适合低成本测试。",
  },
  {
    id: "kimi",
    label: "Kimi / Moonshot",
    provider: "openai-compatible",
    baseUrl: "https://api.moonshot.cn/v1",
    recommendedModel: "moonshot-v1-8k",
    helpText: "OpenAI 兼容接口。",
  },
  {
    id: "siliconflow",
    label: "硅基流动",
    provider: "openai-compatible",
    baseUrl: "https://api.siliconflow.cn/v1",
    recommendedModel: "deepseek-ai/DeepSeek-V3",
    helpText: "OpenAI 兼容接口。",
  },
  {
    id: "zhipu",
    label: "智谱",
    provider: "openai-compatible",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    recommendedModel: "glm-4-flash",
    helpText: "OpenAI 兼容接口。",
  },
  {
    id: "qwen",
    label: "通义千问",
    provider: "openai-compatible",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    recommendedModel: "qwen-plus",
    helpText: "OpenAI 兼容接口。",
  },
  {
    id: "doubao",
    label: "豆包",
    provider: "openai-compatible",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    recommendedModel: "doubao-1-5-lite-32k",
    helpText: "OpenAI 兼容接口，模型名以控制台为准。",
  },
  {
    id: "anthropic",
    label: "Anthropic / Claude",
    provider: "anthropic",
    recommendedModel: "claude-3-5-sonnet-latest",
    helpText: "使用 Anthropic 官方 Messages API。",
  },
];

export function getProviderPresets() {
  return PRESETS;
}

export function resolveProviderTarget(args: ResolveArgs): ProviderTarget {
  if (args.provider === "openai") {
    return { endpoint: OPENAI_ENDPOINT, format: "openai" };
  }

  if (args.provider === "anthropic") {
    return { endpoint: ANTHROPIC_ENDPOINT, format: "anthropic" };
  }

  if (args.baseUrl) {
    throw new Error("Custom Base URL is disabled in V1");
  }

  const preset = PRESETS.find(
    (item) => item.id === args.presetId && item.provider === "openai-compatible",
  );
  if (!preset?.baseUrl) {
    throw new Error("Unknown OpenAI-compatible provider preset");
  }

  return { endpoint: `${preset.baseUrl.replace(/\/$/, "")}/chat/completions`, format: "openai" };
}
