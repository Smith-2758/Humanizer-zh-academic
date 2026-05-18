export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-14">
      <p className="text-sm font-medium text-slate-500">隐私说明</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">隐私与免责声明</h1>
      <div className="mt-8 space-y-6 text-base leading-8 text-slate-700">
        <p>本站不提供模型额度，用户需要使用自己的 API Key。服务器只在本次请求中转发 API Key、原文和参数，不保存 API Key、原文或改写结果。</p>
        <p>如果你选择在浏览器中记住 API Key，它只会保存在当前浏览器的 localStorage。localStorage 不是加密存储，同设备用户、浏览器扩展、浏览器同步或恶意脚本可能读取这些内容。</p>
        <p>历史记录也只保存在当前浏览器本地。请求会经由本站后端转发到你选择的模型服务商，模型服务商可能按其政策处理请求内容，请自行阅读对应平台政策。</p>
        <p>请不要提交涉密、隐私或未经授权的内容。本工具用于表达润色和写作校准，不替代真实学习、实验、研究和写作过程。</p>
        <p>本工具不保证符合任何学校、期刊、课程或检测系统的要求。你需要自行核对事实、数据、引用、术语和格式规范，并对最终使用结果负责。</p>
      </div>
    </article>
  );
}
