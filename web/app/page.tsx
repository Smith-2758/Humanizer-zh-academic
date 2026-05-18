import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-white to-slate-100">
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <p className="mb-4 text-sm font-medium text-slate-500">中文学生学术写作工具</p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            中文学术文本润色与表达校准工具
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            帮助课程论文、实验报告、毕业设计和答辩稿减少模板感，让表达更自然、清楚、克制。
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/rewrite" className="rounded-full bg-slate-950 px-6 py-3 text-center text-sm font-medium text-white hover:bg-slate-800">
              开始使用
            </Link>
            <Link href="/examples" className="rounded-full border border-slate-300 px-6 py-3 text-center text-sm font-medium text-slate-700 hover:bg-white">
              查看示例
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">V1 重点</h2>
          <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
            <li>调整学术表达：减少空泛总结、机械连接词和过度拔高表达。</li>
            <li>匹配写作场景：支持课程论文、实验报告、毕业设计和答辩陈述稿。</li>
            <li>用户自带模型：API Key 默认不保存，服务器不保存原文和结果。</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
