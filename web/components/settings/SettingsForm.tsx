"use client";

import { useMemo, useState } from "react";
import { getProviderPresets } from "@/lib/ai/providers";
import type { ProviderPresetId, RewriteRole, Seriousness } from "@/lib/ai/types";
import { clearHistory } from "@/lib/storage/history";
import {
  clearAllLocalData,
  clearApiKey,
  type HistoryStrategy,
  loadSettings,
  saveSettings,
} from "@/lib/storage/settings";

const SERIOUSNESS_OPTIONS: Seriousness[] = ["低", "中", "高"];
const ROLE_OPTIONS: RewriteRole[] = [
  "课程论文作者",
  "毕业设计作者",
  "实验报告作者",
  "答辩陈述稿作者",
  "自定义",
];

export function SettingsForm() {
  const presets = useMemo(() => getProviderPresets(), []);
  const [settings, setSettings] = useState(() => loadSettings());
  const [status, setStatus] = useState<string | null>(null);

  const selectedPreset =
    presets.find((preset) => preset.id === settings.presetId) ?? presets[0];
  const rememberApiKey = Boolean(settings.rememberApiKey);

  function update(next: Partial<typeof settings>) {
    setSettings((current) => ({ ...current, ...next }));
    setStatus(null);
  }

  function handlePresetChange(nextPresetId: ProviderPresetId) {
    const nextPreset = presets.find((preset) => preset.id === nextPresetId) ?? presets[0];
    update({
      provider: nextPreset.provider,
      presetId: nextPreset.id,
      model: nextPreset.recommendedModel,
    });
  }

  function handleSave() {
    try {
      saveSettings(settings);
      setSettings(loadSettings());
      setStatus("设置已保存。");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "设置保存失败。");
    }
  }

  function handleClearApiKey() {
    clearApiKey();
    setSettings(loadSettings());
    setStatus("API Key 已清除。");
  }

  function handleClearHistory() {
    clearHistory();
    setStatus("历史记录已清除。");
  }

  function handleClearAllLocalData() {
    clearAllLocalData();
    setSettings(loadSettings());
    setStatus("全部本地数据已清除。");
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">本地偏好设置</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          设置只保存在当前浏览器。API Key 默认不保存，勾选并确认风险后才会写入 localStorage。
        </p>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          默认平台预设
          <select
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950"
            value={(settings.presetId as ProviderPresetId | undefined) ?? selectedPreset.id}
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
          默认模型名
          <input
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
            value={settings.model ?? selectedPreset.recommendedModel}
            onChange={(event) => update({ model: event.target.value })}
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          默认严肃度
          <select
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950"
            value={settings.defaultSeriousness ?? "中"}
            onChange={(event) => update({ defaultSeriousness: event.target.value })}
          >
            {SERIOUSNESS_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          默认角色
          <select
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950"
            value={settings.defaultRole ?? "课程论文作者"}
            onChange={(event) => update({ defaultRole: event.target.value })}
          >
            {ROLE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700 md:col-span-2">
          历史保存策略
          <select
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950"
            value={settings.historyStrategy ?? "full"}
            onChange={(event) => update({ historyStrategy: event.target.value as HistoryStrategy })}
          >
            <option value="full">保存完整历史：原文、结果、参数和模型信息</option>
            <option value="result-only">只保存结果和参数：不保存原文</option>
            <option value="none">不保存历史</option>
          </select>
        </label>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <p className="font-medium">API Key 本地保存风险</p>
        <p className="mt-1">
          localStorage 不是加密存储，同设备用户、浏览器扩展、浏览器同步或恶意脚本可能读取本地保存的 Key。
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={rememberApiKey}
            onChange={(event) => update({ rememberApiKey: event.target.checked })}
          />
          记住 API Key
        </label>

        <label className="block text-sm font-medium text-slate-700">
          API Key
          <input
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
            type="password"
            value={settings.apiKey ?? ""}
            onChange={(event) => update({ apiKey: event.target.value })}
            placeholder="仅在确认风险后保存到当前浏览器"
          />
        </label>

        <label className="flex items-start gap-2 text-sm leading-6 text-slate-700">
          <input
            className="mt-1"
            type="checkbox"
            checked={Boolean(settings.apiKeySaveConfirmed)}
            onChange={(event) => update({ apiKeySaveConfirmed: event.target.checked })}
          />
          <span>我理解 API Key 会保存在当前浏览器，且 localStorage 不是加密存储。</span>
        </label>
      </div>

      {status ? <p className="mt-5 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{status}</p> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          onClick={handleSave}
        >
          保存设置
        </button>
        <button
          type="button"
          className="rounded-full border border-slate-300 px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          onClick={handleClearApiKey}
        >
          清除 API Key
        </button>
        <button
          type="button"
          className="rounded-full border border-slate-300 px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          onClick={handleClearHistory}
        >
          清除历史记录
        </button>
        <button
          type="button"
          className="rounded-full border border-red-200 px-5 py-2.5 text-sm text-red-700 hover:bg-red-50"
          onClick={handleClearAllLocalData}
        >
          清除全部本地数据
        </button>
      </div>
    </section>
  );
}
