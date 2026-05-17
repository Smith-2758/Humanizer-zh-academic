"use client";

import { useMemo, useState } from "react";
import type { RewriteRole, Seriousness } from "@/lib/ai/types";
import {
  clearHistory,
  deleteHistoryItem,
  type HistoryItem,
  loadHistory,
} from "@/lib/storage/history";

type SeriousnessFilter = Seriousness | "全部";
type RoleFilter = RewriteRole | "全部";

const ROLE_OPTIONS: RoleFilter[] = [
  "全部",
  "课程论文作者",
  "毕业设计作者",
  "实验报告作者",
  "答辩陈述稿作者",
  "自定义",
];

export function HistoryList() {
  const [items, setItems] = useState<HistoryItem[]>(() => loadHistory());
  const [query, setQuery] = useState("");
  const [seriousness, setSeriousness] = useState<SeriousnessFilter>("全部");
  const [role, setRole] = useState<RoleFilter>("全部");
  const [status, setStatus] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const searchable = [
        item.sourceText,
        item.rawOutput,
        item.parsedOutput.rewrittenText,
        item.model,
        item.role,
        item.seriousness,
      ]
        .filter(Boolean)
        .join("\n")
        .toLowerCase();

      if (normalizedQuery && !searchable.includes(normalizedQuery)) return false;
      if (seriousness !== "全部" && item.seriousness !== seriousness) return false;
      if (role !== "全部" && item.role !== role) return false;
      return true;
    });
  }, [items, query, role, seriousness]);

  function refresh() {
    setItems(loadHistory());
    setStatus(null);
  }

  function remove(id: string) {
    deleteHistoryItem(id);
    refresh();
  }

  function clearAll() {
    clearHistory();
    refresh();
  }

  function exportJson() {
    void navigator.clipboard?.writeText(JSON.stringify(filtered, null, 2));
    setStatus("已将当前筛选结果复制为 JSON。");
  }

  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-slate-600">暂无历史记录。</p>
        <button
          type="button"
          className="mt-4 rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          onClick={refresh}
        >
          刷新
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="block text-sm font-medium text-slate-700">
          搜索历史
          <input
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索原文、结果、模型或角色"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          按严肃度筛选
          <select
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950"
            value={seriousness}
            onChange={(event) => setSeriousness(event.target.value as SeriousnessFilter)}
          >
            <option value="全部">全部</option>
            <option value="低">低</option>
            <option value="中">中</option>
            <option value="高">高</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          按角色筛选
          <select
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950"
            value={role}
            onChange={(event) => setRole(event.target.value as RoleFilter)}
          >
            {ROLE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className="rounded-full border border-slate-300 px-4 py-2 text-sm" onClick={refresh}>
          刷新
        </button>
        <button type="button" className="rounded-full border border-slate-300 px-4 py-2 text-sm" onClick={exportJson}>
          导出 JSON
        </button>
        <button type="button" className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-700" onClick={clearAll}>
          清空全部
        </button>
      </div>

      {status ? <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{status}</p> : null}

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">没有匹配的历史记录。</p>
      ) : (
        <div className="mt-6 space-y-4">
          {filtered.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">{new Date(item.createdAt).toLocaleString("zh-CN")}</p>
                  <h2 className="mt-1 font-semibold text-slate-950">
                    {item.role} / {item.seriousness} / {item.model}
                  </h2>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                  onClick={() => remove(item.id)}
                >
                  删除
                </button>
              </div>
              {item.sourceText ? (
                <details className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                  <summary className="cursor-pointer font-medium text-slate-700">查看原文</summary>
                  <p className="mt-2 whitespace-pre-wrap">{item.sourceText}</p>
                </details>
              ) : null}
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {item.parsedOutput.rewrittenText ?? item.rawOutput}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
