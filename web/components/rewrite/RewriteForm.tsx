"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ModelSettingsPanel } from "./ModelSettingsPanel";
import type { CustomRole, ProviderPresetId, RewriteRequest, RewriteRole, Seriousness } from "@/lib/ai/types";
import { readTextFromFile } from "@/lib/file/readTextFile";
import { loadSettings, saveSettings } from "@/lib/storage/settings";

type RewriteFormProps = {
  onSubmit?: (payload: RewriteRequest) => void | Promise<void>;
  isSubmitting?: boolean;
};

const DEFAULT_PAYLOAD = {
  provider: "openai" as const,
  presetId: "openai" as ProviderPresetId,
  model: "gpt-4o-mini",
  seriousness: "中" as Seriousness,
  role: "课程论文作者" as RewriteRole,
};

export function RewriteForm({ onSubmit = () => undefined, isSubmitting = false }: RewriteFormProps) {
  const [sourceText, setSourceText] = useState("");
  const [extraInstruction, setExtraInstruction] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(DEFAULT_PAYLOAD.model);
  const [presetId, setPresetId] = useState<ProviderPresetId>(DEFAULT_PAYLOAD.presetId);
  const [seriousness, setSeriousness] = useState<Seriousness>(DEFAULT_PAYLOAD.seriousness);
  const [role, setRole] = useState<RewriteRole>(DEFAULT_PAYLOAD.role);
  const [customRole, setCustomRole] = useState<CustomRole>({ discipline: "", stage: "", purpose: "" });
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const settings = loadSettings();
      if (settings.presetId) setPresetId(settings.presetId as ProviderPresetId);
      if (settings.model) setModel(settings.model);
      if (settings.defaultSeriousness) setSeriousness(settings.defaultSeriousness as Seriousness);
      if (settings.defaultRole) setRole(settings.defaultRole as RewriteRole);
      if (settings.apiKey) setApiKey(settings.apiKey);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  async function handleFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    setIsReadingFile(true);
    setError(null);
    try {
      const text = await readTextFromFile(file);
      if (!text.trim()) {
        setError("文件中没有读取到可用文本。");
        setFileName(null);
        return;
      }
      setSourceText(text);
      setFileName(file.name);
      if (text.length > 8_000) {
        setError("文件内容已填入原文框，但超过 8000 字，请删减后再提交。");
      }
    } catch (readError) {
      setFileName(null);
      setError(readError instanceof Error ? readError.message : "文件读取失败，请换一个文件试试。");
    } finally {
      setIsReadingFile(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sourceText.trim()) {
      setError("请先粘贴需要处理的原文。");
      return;
    }
    if (sourceText.length > 8_000) {
      setError("原文最多 8000 字，请缩短后再提交。");
      return;
    }
    if (extraInstruction.length > 500) {
      setError("高级要求最多 500 字，请缩短后再提交。");
      return;
    }

    const nextCustomRole = {
      discipline: customRole.discipline.trim(),
      stage: customRole.stage.trim(),
      purpose: customRole.purpose.trim(),
    };
    if (role === "自定义" && (!nextCustomRole.discipline || !nextCustomRole.stage || !nextCustomRole.purpose)) {
      setError("请补充自定义角色的学科背景、求学阶段或经验、文本用途。");
      return;
    }

    const provider = presetId === "anthropic" ? "anthropic" : presetId === "openai" ? "openai" : "openai-compatible";
    const trimmedExtraInstruction = extraInstruction.trim();
    const requestState: RewriteRequest = {
      provider,
      presetId,
      apiKey,
      model,
      sourceText,
      seriousness,
      role,
      ...(role === "自定义" ? { customRole: nextCustomRole } : {}),
      ...(trimmedExtraInstruction ? { extraInstruction: trimmedExtraInstruction } : {}),
    };

    setError(null);
    saveSettings({ provider, presetId, model, defaultSeriousness: seriousness, defaultRole: role });
    onSubmit(requestState);
  }

  return (
    <form className="grid gap-6 lg:grid-cols-[1fr_360px]" onSubmit={handleSubmit}>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">开始改写</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          粘贴原文，选择严肃度和写作角色，再提交给你自己的模型服务。若希望长期保存 API Key，请到
          <Link href="/settings" className="mx-1 font-medium text-slate-950 underline underline-offset-4">
            设置页
          </Link>
          单独确认风险后保存。
        </p>

        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <label className="block text-sm font-medium text-slate-700">
              上传文本文件
              <input
                aria-label="上传文本文件"
                className="mt-2 block w-full text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
                type="file"
                accept=".docx,.md,.txt,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => handleFileChange(event.target.files)}
                disabled={isReadingFile}
              />
            </label>
            <p className="mt-2 text-sm text-slate-600">
              支持 .docx、.md、.txt；读取后会自动填入下方原文框，输出仍为纯文本。
            </p>
            {fileName ? <p className="mt-2 text-sm text-slate-700">已读取：{fileName}</p> : null}
          </div>

          <label className="block text-sm font-medium text-slate-700">
            待处理原文
            <textarea
              aria-label="待处理原文"
              className="mt-2 min-h-64 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder="粘贴课程论文、实验报告、毕业设计或答辩稿片段"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              严肃度
              <select
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                value={seriousness}
                onChange={(event) => setSeriousness(event.target.value as Seriousness)}
              >
                <option value="低">低</option>
                <option value="中">中</option>
                <option value="高">高</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              角色
              <select
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                value={role}
                onChange={(event) => setRole(event.target.value as RewriteRole)}
              >
                <option value="课程论文作者">课程论文作者</option>
                <option value="毕业设计作者">毕业设计作者</option>
                <option value="实验报告作者">实验报告作者</option>
                <option value="答辩陈述稿作者">答辩陈述稿作者</option>
                <option value="自定义">自定义</option>
              </select>
            </label>
          </div>

          {role === "自定义" ? (
            <div className="grid gap-4 rounded-xl bg-slate-50 p-3 sm:grid-cols-3">
              <label className="block text-sm font-medium text-slate-700">
                学科背景
                <input
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
                  value={customRole.discipline}
                  onChange={(event) => setCustomRole((current) => ({ ...current, discipline: event.target.value }))}
                  placeholder="如：机械工程"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                求学阶段或经验
                <input
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
                  value={customRole.stage}
                  onChange={(event) => setCustomRole((current) => ({ ...current, stage: event.target.value }))}
                  placeholder="如：本科毕业阶段"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                文本用途
                <input
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
                  value={customRole.purpose}
                  onChange={(event) => setCustomRole((current) => ({ ...current, purpose: event.target.value }))}
                  placeholder="如：毕业设计说明"
                />
              </label>
            </div>
          ) : null}

          <label className="block text-sm font-medium text-slate-700">
            高级要求
            <textarea
              aria-label="高级要求"
              className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
              value={extraInstruction}
              onChange={(event) => setExtraInstruction(event.target.value)}
              placeholder="例如：保留原段落，不改变术语。最多 500 字。"
            />
          </label>

          {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

          <button
            className="rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "正在改写..." : "开始改写"}
          </button>
        </div>
      </section>

      <ModelSettingsPanel
        apiKey={apiKey}
        model={model}
        presetId={presetId}
        onApiKeyChange={setApiKey}
        onModelChange={setModel}
        onPresetChange={setPresetId}
      />
    </form>
  );
}
