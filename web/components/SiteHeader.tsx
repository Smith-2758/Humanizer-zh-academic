import Link from "next/link";

const NAV_ITEMS = [
  { href: "/rewrite", label: "开始使用" },
  { href: "/history", label: "历史记录" },
  { href: "/settings", label: "设置" },
  { href: "/privacy", label: "隐私说明" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-950">
          Humanizer Academic
        </Link>
        <nav aria-label="主导航" className="flex flex-wrap gap-3 text-sm text-slate-600">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-full px-3 py-1.5 hover:bg-slate-100 hover:text-slate-950">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
