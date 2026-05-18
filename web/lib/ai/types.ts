export type Provider = "openai" | "openai-compatible" | "anthropic";

export type ProviderPresetId =
  | "openai"
  | "deepseek"
  | "kimi"
  | "siliconflow"
  | "zhipu"
  | "qwen"
  | "doubao"
  | "anthropic";

export type Seriousness = "低" | "中" | "高";

export type RewriteRole =
  | "课程论文作者"
  | "毕业设计作者"
  | "实验报告作者"
  | "答辩陈述稿作者"
  | "自定义";

export type CustomRole = {
  discipline: string;
  stage: string;
  purpose: string;
};

export type RewriteRequest = {
  provider: Provider;
  presetId?: ProviderPresetId;
  baseUrl?: string;
  apiKey: string;
  model: string;
  sourceText: string;
  seriousness: Seriousness;
  role: RewriteRole;
  customRole?: CustomRole;
  extraInstruction?: string;
};

export type Usage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};
