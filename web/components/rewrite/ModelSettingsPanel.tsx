"use client";

import { useMemo, useState } from "react";
import { getProviderPresets } from "@/lib/ai/providers";
import type { ProviderPresetId } from "@/lib/ai/types";

export type InterfaceMode = "official" | "custom";

type ModelSettingsPanelProps = {
  apiKey?: string;
  model?: string;
  presetId?: ProviderPresetId;
  baseUrl?: string;
  interfaceMode?: InterfaceMode;
  onApiKeyChange?: (apiKey: string) => void;
  onModelChange?: (model: string) => void;
  onPresetChange?: (presetId: ProviderPresetId) => void;
  onBaseUrlChange?: (baseUrl: string) => void;
  onInterfaceModeChange?: (mode: InterfaceMode) => void;
};

export function ModelSettingsPanel({
  apiKey = "",
  model,
  presetId,
  baseUrl,
  interfaceMode,
  onApiKeyChange,
  onModelChange,
  onPresetChange,
  onBaseUrlChange,
  onInterfaceModeChange,
}: ModelSettingsPanelProps = {}) {
  const presets = useMemo(() => getProviderPresets(), []);
  const initialPreset = presets.find((preset) => preset.id === (presetId ?? "openai")) ?? presets[0];
  const [internalPresetId, setInternalPresetId] = useState<ProviderPresetId>(initialPreset.id);
  const [internalModel, setInternalModel] = useState(model ?? initialPreset.recommendedModel);
  const [internalBaseUrl, setInternalBaseUrl] = useState(baseUrl ?? "");
  const [internalInterfaceMode, setInternalInterfaceMode] = useState<InterfaceMode>(interfaceMode ?? "official");
  const selectedPresetId = presetId ?? internalPresetId;
  const selectedPreset = presets.find((preset) => preset.id === selectedPresetId) ?? initialPreset;
  const currentModel = model ?? internalModel;
  const currentBaseUrl = baseUrl ?? internalBaseUrl;
  const currentInterfaceMode = interfaceMode ?? internalInterfaceMode;

  function handlePresetChange(nextPresetId: ProviderPresetId) {
    const nextPreset = presets.find((preset) => preset.id === nextPresetId) ?? initialPreset;
    setInternalPresetId(nextPreset.id);
    setInternalModel(nextPreset.recommendedModel);
    onPresetChange?.(nextPreset.id);
    onModelChange?.(nextPreset.recommendedModel);
  }

  function handleModelChange(nextModel: string) {
    setInternalModel(nextModel);
    onModelChange?.(nextModel);
  }

  function handleInterfaceModeChange(nextMode: InterfaceMode) {
    setInternalInterfaceMode(nextMode);
    onInterfaceModeChange?.(nextMode);
  }

  function handleBaseUrlChange(nextBaseUrl: string) {
    setInternalBaseUrl(nextBaseUrl);
    onBaseUrlChange?.(nextBaseUrl);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">模型设置</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        普通用户优先选择平台预设。API Key 默认只用于本次请求，不会从改写页保存到本地。
      </p>

      <div className="mt-5 space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-full bg-slate-100 p-1" role="group" aria-label="接口类型">
          <button
            type="button"
            className={`rounded-full px-3 py-2 text-sm font-medium transition ${
              currentInterfaceMode === "official" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-950"
            }`}
            onClick={() => handleInterfaceModeChange("official")}
          >
            官方接口
          </button>
          <button
            type="button"
            className={`rounded-full px-3 py-2 text-sm font-medium transition ${
              currentInterfaceMode === "custom" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-950"
            }`}
            onClick={() => handleInterfaceModeChange("custom")}
          >
            自定义接口
          </button>
        </div>

        {currentInterfaceMode === "official" ? (
          <label className="block text-sm font-medium text-slate-700">
            平台预设
            <select
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950"
              value={selectedPresetId}
              onChange={(event) => handlePresetChange(event.target.value as ProviderPresetId)}
            >
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="block text-sm font-medium text-slate-700">
            Base URL
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
              value={currentBaseUrl}
              onChange={(event) => handleBaseUrlChange(event.target.value)}
              placeholder="https://api.example.com/v1"
            />
          </label>
        )}

        <label className="block text-sm font-medium text-slate-700">
          API Key
          <input
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
            type="password"
            value={apiKey}
            onChange={(event) => onApiKeyChange?.(event.target.value)}
            placeholder="本次使用，默认不保存"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          模型名
          <input
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
            value={currentModel}
            onChange={(event) => handleModelChange(event.target.value)}
          />
        </label>

        <div className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
          {currentInterfaceMode === "official" ? (
            <>
              当前接口：{selectedPreset.helpText}
              {selectedPreset.baseUrl ? <span> 平台预设地址由后端 allowlist 固定处理。</span> : null}
            </>
          ) : (
            <span>当前接口：按 OpenAI 兼容格式请求你的自定义 Base URL。</span>
          )}
        </div>

        {currentInterfaceMode === "custom" ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            只支持 HTTPS 公网地址。为避免 SSRF 风险，本机、内网、非标准端口、query 和 fragment 会被拒绝。
          </p>
        ) : null}
      </div>
    </section>
  );
}
