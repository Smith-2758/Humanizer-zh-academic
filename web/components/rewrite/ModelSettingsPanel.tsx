"use client";

import { useMemo, useState } from "react";
import { getProviderPresets } from "@/lib/ai/providers";
import type { ProviderPresetId } from "@/lib/ai/types";

type ModelSettingsPanelProps = {
  apiKey?: string;
  model?: string;
  presetId?: ProviderPresetId;
  onApiKeyChange?: (apiKey: string) => void;
  onModelChange?: (model: string) => void;
  onPresetChange?: (presetId: ProviderPresetId) => void;
};

export function ModelSettingsPanel({
  apiKey = "",
  model,
  presetId,
  onApiKeyChange,
  onModelChange,
  onPresetChange,
}: ModelSettingsPanelProps = {}) {
  const presets = useMemo(() => getProviderPresets(), []);
  const initialPreset = presets.find((preset) => preset.id === (presetId ?? "openai")) ?? presets[0];
  const [internalPresetId, setInternalPresetId] = useState<ProviderPresetId>(initialPreset.id);
  const [internalModel, setInternalModel] = useState(model ?? initialPreset.recommendedModel);
  const selectedPresetId = presetId ?? internalPresetId;
  const selectedPreset = presets.find((preset) => preset.id === selectedPresetId) ?? initialPreset;
  const currentModel = model ?? internalModel;

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

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">模型设置</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        普通用户优先选择平台预设。API Key 默认只用于本次请求，不会从改写页保存到本地。
      </p>

      <div className="mt-5 space-y-4">
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
          当前接口：{selectedPreset.helpText}
          {selectedPreset.baseUrl ? <span> 平台预设地址由后端 allowlist 固定处理。</span> : null}
        </div>

        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
          自定义 Base URL：V1 暂不开放。为避免开放代理和 SSRF 风险，当前仅支持平台预设。
        </p>
      </div>
    </section>
  );
}
