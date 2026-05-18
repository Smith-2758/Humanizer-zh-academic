"use client";

import { parseRewriteOutput } from "@/lib/output/parseRewriteOutput";
import type { ParsedRewriteOutput } from "@/lib/output/parseRewriteOutput";

type OutputPanelProps = {
  rawOutput: string;
  onSave?: (parsedOutput: ParsedRewriteOutput) => void;
  onClear?: () => void;
};

export function OutputPanel({ rawOutput, onSave, onClear }: OutputPanelProps) {
  const parsed = parseRewriteOutput(rawOutput);

  function copyFullOutput() {
    void navigator.clipboard.writeText(rawOutput);
  }

  function copyRewrittenText() {
    if (!parsed.rewrittenText) return;
    void navigator.clipboard.writeText(parsed.rewrittenText);
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-950">输出结果</h2>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" type="button" onClick={copyFullOutput}>
            复制全文
          </button>
          <button
            className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={!parsed.rewrittenText}
            onClick={copyRewrittenText}
          >
            只复制重写文本
          </button>
          {onSave ? (
            <button
              className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              type="button"
              onClick={() => onSave(parsed)}
            >
              保存到历史
            </button>
          ) : null}
          {onClear ? (
            <button
              className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              type="button"
              onClick={onClear}
            >
              清空结果
            </button>
          ) : null}
        </div>
      </div>

      {parsed.rewrittenText ? (
        <div className="mt-5 space-y-5 text-sm leading-7 text-slate-700">
          {parsed.parameterConfirmation ? (
            <section>
              <h3 className="font-semibold text-slate-950">参数确认</h3>
              <p className="mt-2 whitespace-pre-wrap">{parsed.parameterConfirmation}</p>
            </section>
          ) : null}
          <section>
            <h3 className="font-semibold text-slate-950">重写后的学术文本</h3>
            <p className="mt-2 whitespace-pre-wrap">{parsed.rewrittenText}</p>
          </section>
          {parsed.changeLog ? (
            <section>
              <h3 className="font-semibold text-slate-950">精简修改日志</h3>
              <p className="mt-2 whitespace-pre-wrap">{parsed.changeLog}</p>
            </section>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
          <p className="rounded-xl bg-amber-50 p-3 text-amber-900">未识别到标准输出结构，只能复制全文。</p>
          <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 font-sans">{rawOutput}</pre>
        </div>
      )}
    </section>
  );
}
