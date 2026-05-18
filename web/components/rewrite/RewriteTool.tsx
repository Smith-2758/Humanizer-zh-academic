"use client";

import { useState } from "react";
import type { RewriteRequest, Usage } from "@/lib/ai/types";
import { parseRewriteOutput, type ParsedRewriteOutput } from "@/lib/output/parseRewriteOutput";
import { addHistoryItem } from "@/lib/storage/history";
import { hasSeenHistoryNotice, markHistoryNoticeSeen } from "@/lib/storage/notice";
import { type HistoryStrategy, loadSettings, saveSettings } from "@/lib/storage/settings";
import { OutputPanel } from "./OutputPanel";
import { RewriteForm } from "./RewriteForm";

type RewriteApiResponse =
  | { ok: true; output: string; provider: string; model: string; usage?: Usage }
  | { ok: false; message?: string; errorCode?: string; detail?: string };

export function RewriteTool() {
  const [rawOutput, setRawOutput] = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState<RewriteRequest | null>(null);
  const [usage, setUsage] = useState<Usage | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [showHistoryNotice, setShowHistoryNotice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(payload: RewriteRequest) {
    setIsSubmitting(true);
    setError(null);
    setStatus(null);

    try {
      const response = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as RewriteApiResponse;

      if (!body.ok) {
        setError(`${body.message ?? "请求失败。"} 请检查 API Key、余额、模型名或文本长度后再试。`);
        return;
      }

      if (!response.ok) {
        setError("请求失败。请检查 API Key、余额、模型名或文本长度后再试。");
        return;
      }

      setRawOutput(body.output);
      setLastPayload(payload);
      setUsage(body.usage);
      const strategy = loadSettings().historyStrategy ?? "full";
      const noticeSeen = hasSeenHistoryNotice();
      setShowHistoryNotice(strategy !== "none" && !noticeSeen);

      if (strategy !== "none" && noticeSeen) {
        addHistoryItem({
          strategy,
          sourceText: payload.sourceText,
          rawOutput: body.output,
          parsedOutput: parseRewriteOutput(body.output),
          provider: payload.provider,
          presetId: payload.presetId,
          model: payload.model,
          seriousness: payload.seriousness,
          role: payload.role,
          customRole: payload.customRole,
          extraInstruction: payload.extraInstruction,
          usage: body.usage,
        });
        setStatus("已自动保存到本地历史记录。");
      }
    } catch {
      setError("请求失败，请检查网络连接后重试。请检查 API Key、余额、模型名或文本长度。");
    } finally {
      setIsSubmitting(false);
    }
  }

  function saveCurrentResult(parsedOutput: ParsedRewriteOutput, strategyOverride?: HistoryStrategy) {
    if (!rawOutput || !lastPayload) return;
    const settings = loadSettings();
    const strategy = strategyOverride ?? settings.historyStrategy ?? "full";
    saveSettings({ historyStrategy: strategy });
    markHistoryNoticeSeen();
    setShowHistoryNotice(false);

    addHistoryItem({
      strategy,
      sourceText: lastPayload.sourceText,
      rawOutput,
      parsedOutput,
      provider: lastPayload.provider,
      presetId: lastPayload.presetId,
      model: lastPayload.model,
      seriousness: lastPayload.seriousness,
      role: lastPayload.role,
      customRole: lastPayload.customRole,
      extraInstruction: lastPayload.extraInstruction,
      usage,
    });

    setStatus(strategy === "none" ? "已关闭历史记录保存。" : "已保存到本地历史记录。");
  }

  function saveCurrentOutputWithStrategy(strategy: HistoryStrategy) {
    if (!rawOutput) return;
    saveCurrentResult(parseRewriteOutput(rawOutput), strategy);
  }

  function clearResult() {
    setRawOutput(null);
    setLastPayload(null);
    setUsage(undefined);
    setStatus(null);
    setShowHistoryNotice(false);
  }

  return (
    <div>
      <RewriteForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      {error ? <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
      {status ? <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{status}</p> : null}
      {showHistoryNotice ? (
        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <p>
            本工具默认会把原文、改写结果和参数保存在当前浏览器本地。localStorage 不是加密存储，
            同设备用户、浏览器扩展、浏览器同步或恶意脚本可能读取这些内容。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="rounded-full bg-slate-950 px-4 py-2 text-white" type="button" onClick={() => saveCurrentOutputWithStrategy("full")}>
              保存完整历史
            </button>
            <button className="rounded-full border border-amber-300 px-4 py-2" type="button" onClick={() => saveCurrentOutputWithStrategy("result-only")}>
              只保存结果和参数
            </button>
            <button className="rounded-full border border-amber-300 px-4 py-2" type="button" onClick={() => saveCurrentOutputWithStrategy("none")}>
              不保存历史
            </button>
          </div>
        </section>
      ) : null}
      {rawOutput ? <OutputPanel rawOutput={rawOutput} onSave={saveCurrentResult} onClear={clearResult} /> : null}
    </div>
  );
}
