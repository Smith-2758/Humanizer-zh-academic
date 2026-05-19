import { RewriteError } from "./errors";
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

const OPENAI_BASE_URL = "https://api.openai.com/v1";
const OPENAI_ENDPOINT = `${OPENAI_BASE_URL}/chat/completions`;
const OPENAI_MODELS_ENDPOINT = `${OPENAI_BASE_URL}/models`;
const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
const LOCAL_HOSTNAMES = new Set(["localhost", "local"]);

const PRESETS: ProviderPreset[] = [
  {
    id: "openai",
    label: "OpenAI 官方",
    provider: "openai",
    recommendedModel: "gpt-5.5",
    helpText: "使用 OpenAI 官方 API。",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    provider: "openai-compatible",
    baseUrl: "https://api.deepseek.com/v1",
    recommendedModel: "deepseek-v4-pro",
    helpText: "OpenAI 兼容接口，适合低成本测试。",
  },
  {
    id: "kimi",
    label: "Kimi / Moonshot",
    provider: "openai-compatible",
    baseUrl: "https://api.moonshot.cn/v1",
    recommendedModel: "kimi-k2.6",
    helpText: "OpenAI 兼容接口。",
  },
  {
    id: "siliconflow",
    label: "硅基流动",
    provider: "openai-compatible",
    baseUrl: "https://api.siliconflow.cn/v1",
    recommendedModel: "deepseek-ai/DeepSeek-V3.2",
    helpText: "OpenAI 兼容接口。",
  },
  {
    id: "zhipu",
    label: "智谱",
    provider: "openai-compatible",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    recommendedModel: "GLM-5.1",
    helpText: "OpenAI 兼容接口。",
  },
  {
    id: "qwen",
    label: "通义千问",
    provider: "openai-compatible",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    recommendedModel: "qwen3.6-plus",
    helpText: "OpenAI 兼容接口。",
  },
  {
    id: "doubao",
    label: "豆包",
    provider: "openai-compatible",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    recommendedModel: "doubao-seed-2-0-pro",
    helpText: "OpenAI 兼容接口，模型名以控制台为准。",
  },
  {
    id: "anthropic",
    label: "Anthropic / Claude",
    provider: "anthropic",
    recommendedModel: "claude-sonnet-4-6",
    helpText: "使用 Anthropic 官方 Messages API。",
  },
];

export function getProviderPresets() {
  return PRESETS;
}

function parseIpv4(hostname: string) {
  const parts = hostname.split(".");
  if (parts.length !== 4) return undefined;

  const octets = parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) return undefined;
    const value = Number(part);
    return value >= 0 && value <= 255 ? value : undefined;
  });

  return octets.every((value) => value !== undefined) ? (octets as number[]) : undefined;
}

function isPrivateOrLocalHostname(hostname: string) {
  const normalized = hostname.replace(/^\[/, "").replace(/\]$/, "").replace(/\.$/, "").toLowerCase();
  if (!normalized) return true;
  if (LOCAL_HOSTNAMES.has(normalized) || normalized.endsWith(".localhost") || normalized.endsWith(".local")) {
    return true;
  }
  if (!normalized.includes(".") && !normalized.includes(":")) return true;
  if (/^\d+$/.test(normalized)) return true;
  if (normalized.includes(":")) return true;

  const ipv4 = parseIpv4(normalized);
  if (!ipv4) return false;

  const [a, b] = ipv4;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function resolveCustomOpenAIBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.trim();
  if (!trimmed) {
    throw new RewriteError("invalid_base_url", "请填写自定义 Base URL。", 400);
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new RewriteError("invalid_base_url", "Base URL 格式不正确。", 400);
  }

  if (parsed.protocol !== "https:") {
    throw new RewriteError("invalid_base_url", "Base URL 必须使用 HTTPS。", 400);
  }
  if (parsed.username || parsed.password) {
    throw new RewriteError("invalid_base_url", "Base URL 不能包含用户名或密码。", 400);
  }
  if (parsed.search || parsed.hash) {
    throw new RewriteError("invalid_base_url", "Base URL 不能包含 query 或 fragment。", 400);
  }
  if (parsed.port && parsed.port !== "443") {
    throw new RewriteError("unsafe_base_url", "Base URL 不能使用非标准端口。", 400);
  }
  if (isPrivateOrLocalHostname(parsed.hostname)) {
    throw new RewriteError("unsafe_base_url", "Base URL 不能指向 private/local 网络地址。", 400);
  }

  const normalizedPath = parsed.pathname.replace(/\/+$/, "").replace(/\/chat\/completions$/, "");
  return `${parsed.origin}${normalizedPath}`;
}

function resolveOpenAICompatiblePresetBaseUrl(presetId?: ProviderPresetId) {
  const preset = PRESETS.find(
    (item) => item.id === presetId && item.provider === "openai-compatible",
  );
  if (!preset?.baseUrl) {
    throw new Error("Unknown OpenAI-compatible provider preset");
  }

  return preset.baseUrl.replace(/\/+$/, "");
}

function endpointFromBase(baseUrl: string, path: "/chat/completions" | "/models") {
  return `${baseUrl.replace(/\/+$/, "")}${path}`;
}

export function resolveProviderTarget(args: ResolveArgs): ProviderTarget {
  if (args.provider === "openai") {
    return { endpoint: OPENAI_ENDPOINT, format: "openai" };
  }

  if (args.provider === "anthropic") {
    return { endpoint: ANTHROPIC_ENDPOINT, format: "anthropic" };
  }

  if (args.baseUrl) {
    return { endpoint: endpointFromBase(resolveCustomOpenAIBaseUrl(args.baseUrl), "/chat/completions"), format: "openai" };
  }

  return { endpoint: endpointFromBase(resolveOpenAICompatiblePresetBaseUrl(args.presetId), "/chat/completions"), format: "openai" };
}

export function resolveProviderModelsTarget(args: ResolveArgs): ProviderTarget {
  if (args.provider === "openai") {
    return { endpoint: OPENAI_MODELS_ENDPOINT, format: "openai" };
  }

  if (args.provider === "anthropic") {
    throw new RewriteError("provider_error", "Anthropic 暂不支持拉取模型列表，请手动填写模型名。", 400);
  }

  if (args.baseUrl) {
    return { endpoint: endpointFromBase(resolveCustomOpenAIBaseUrl(args.baseUrl), "/models"), format: "openai" };
  }

  return { endpoint: endpointFromBase(resolveOpenAICompatiblePresetBaseUrl(args.presetId), "/models"), format: "openai" };
}
