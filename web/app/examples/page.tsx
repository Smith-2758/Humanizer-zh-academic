const EXAMPLES = [
  {
    title: "实验报告片段",
    before: "综上所述，本实验充分体现了该系统在多个维度上的优越性。",
    after: "从实验结果看，该系统在稳定性和响应速度上表现较好，但仍需要进一步测试边界情况。",
  },
  {
    title: "课程论文片段",
    before: "这一现象深刻揭示了技术发展对于社会结构的革命性重塑。",
    after: "这一现象说明，技术变化会影响社会结构中的部分关系和分工方式。",
  },
];

export default function ExamplesPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <p className="text-sm font-medium text-slate-500">示例库</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">短示例</h1>
      <p className="mt-4 max-w-2xl leading-7 text-slate-600">V1 先提供少量短片段示例，后续会继续补充不同角色和严肃度的完整案例。</p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {EXAMPLES.map((example) => (
          <article key={example.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-950">{example.title}</h2>
            <p className="mt-4 text-sm font-medium text-slate-500">原文片段</p>
            <p className="mt-2 leading-7 text-slate-700">{example.before}</p>
            <p className="mt-4 text-sm font-medium text-slate-500">校准后</p>
            <p className="mt-2 leading-7 text-slate-700">{example.after}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
