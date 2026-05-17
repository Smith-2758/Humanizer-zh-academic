import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>用于中文学术文本润色与表达校准。请遵守所在学校或机构的 AI 使用规范。</p>
        <div className="flex gap-4">
          <Link href="/guide" className="hover:text-slate-900">
            使用说明
          </Link>
          <Link href="/privacy" className="hover:text-slate-900">
            隐私说明
          </Link>
        </div>
      </div>
    </footer>
  );
}
