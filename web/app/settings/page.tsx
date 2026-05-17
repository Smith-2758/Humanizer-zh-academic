import { SettingsForm } from "@/components/settings/SettingsForm";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <p className="text-sm font-medium text-slate-500">设置</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">本地设置</h1>
      <p className="mt-4 max-w-2xl leading-7 text-slate-600">
        管理默认模型、写作参数、API Key 保存方式和历史记录策略。所有设置只保存在当前浏览器。
      </p>
      <div className="mt-8">
        <SettingsForm />
      </div>
    </div>
  );
}
