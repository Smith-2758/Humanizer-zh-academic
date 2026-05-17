export default function GuidePage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-14">
      <p className="text-sm font-medium text-slate-500">使用说明</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">V1 快速说明</h1>
      <div className="mt-8 space-y-6 text-base leading-8 text-slate-700">
        <section>
          <h2 className="font-semibold text-slate-950">API Key 是什么</h2>
          <p className="mt-2">API Key 是你在模型服务商控制台创建的访问凭证。本站默认不保存 Key，只在本次改写请求中使用。</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-950">普通用户怎么选</h2>
          <p className="mt-2">优先选择平台预设，例如 OpenAI、DeepSeek、Kimi、通义或 Anthropic。普通用户不用填写 Base URL，V1 也不会开放任意自定义 Base URL。</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-950">请求失败怎么办</h2>
          <p className="mt-2">请先检查 API Key、账户余额、模型名和文本长度。长文本建议分段处理，高级要求尽量保持简短。</p>
        </section>
      </div>
    </article>
  );
}
