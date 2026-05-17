import { HistoryList } from "@/components/history/HistoryList";

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <p className="text-sm font-medium text-slate-500">历史记录</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">本地历史记录</h1>
      <p className="mt-4 max-w-2xl leading-7 text-slate-600">
        历史记录只保存在当前浏览器。你可以搜索、筛选、复制导出 JSON，也可以随时删除。
      </p>
      <div className="mt-8">
        <HistoryList />
      </div>
    </div>
  );
}
