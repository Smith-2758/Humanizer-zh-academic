# Web V1 Progress Handoff

日期：2026-05-17

## 当前工作区

- Worktree: `D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1`
- 分支：`feature/web-v1`
- 计划文档：`docs/superpowers/plans/2026-05-17-web-v1-implementation.md`
- 产品规格：`docs/superpowers/specs/2026-05-17-web-product-design.md`

## 工作原则

- 只在 `feature/web-v1` worktree 内实现 Web V1，不触碰主工作区里的已有 legacy 文档改动。
- 按计划文档逐个 Task 推进。
- 行为代码采用 TDD：先写测试，确认红灯，再写最小实现，再验证绿灯。
- 用户未明确要求提交时，不主动创建新 commit；只报告变更文件和验证结果。

## 已完成

### Task 1: Scaffold Next.js app and test baseline

- 已创建 `web/` Next.js App Router 项目。
- 已加入 Vitest / React Testing Library / jsdom 测试配置。
- 已创建 sanity 测试与最小实现：
  - `web/lib/sanity.test.ts`
  - `web/lib/sanity.ts`
- 当前最新提交 `0dce8cb` 包含 Task 1 scaffold 文件。

### Task 2: Shared AI types and provider presets

- 已新增 provider resolution 测试：`web/lib/ai/providers.test.ts`。
- 已按 TDD 确认红灯：测试最初失败于 `Failed to resolve import "./providers"`，原因是实现文件尚不存在。
- 已新增共享 AI 类型：`web/lib/ai/types.ts`。
- 已新增 provider allowlist 与解析逻辑：`web/lib/ai/providers.ts`。
- V1 规则已落实：OpenAI 与 Anthropic 使用固定官方 endpoint；OpenAI-compatible 只允许平台预设；自定义 `baseUrl` 会抛出 `Custom Base URL is disabled in V1`。

### Task 3: Prompt builder

- 已新增 prompt builder 测试：`web/lib/prompt/buildPrompt.test.ts`。
- 已按 TDD 确认红灯：测试最初失败于 `Failed to resolve import "./buildPrompt"`，原因是实现文件尚不存在。
- 已新增精简系统提示词：`web/lib/prompt/systemPrompt.ts`。
- 已新增提示词组装逻辑：`web/lib/prompt/buildPrompt.ts`。
- 提示词输出已包含参数、原文、高级要求，以及模型必须返回的三个标题：`参数确认`、`重写后的学术文本`、`精简修改日志`。

### Task 4: Output parser

- 已新增 output parser 测试：`web/lib/output/parseRewriteOutput.test.ts`。
- 已按 TDD 确认红灯：测试最初失败于 `Failed to resolve import "./parseRewriteOutput"`，原因是实现文件尚不存在。
- 已新增模型输出解析器：`web/lib/output/parseRewriteOutput.ts`。
- 解析器支持普通标题、Markdown 标题、中文/英文冒号；当三个标准标题不完整时返回 `{ rawOutput }` 安全降级。
- 调试记录：首次实现后 Markdown 标题用例失败，根因是动态 `RegExp` 字符串中的 `\s` 没有双重转义；已修为 `\\s` 等形式。

### Task 5: Local storage helpers with full history metadata

- 已新增 storage 测试：
  - `web/lib/storage/settings.test.ts`
  - `web/lib/storage/history.test.ts`
  - `web/lib/storage/notice.test.ts`
- 已按 TDD 确认红灯：三组测试最初失败于 `./keys`、`./settings`、`./history`、`./notice` helper 不存在。
- 已新增本地存储 key：`web/lib/storage/keys.ts`。
- 已新增设置 helper：`web/lib/storage/settings.ts`。
  - API Key 默认不持久化。
  - 只有 `rememberApiKey` 与 `apiKeySaveConfirmed` 同时为 `true` 时才保存 API Key。
  - 无效 JSON 返回默认设置。
  - 写入失败时抛出可供 UI 展示的中文错误。
- 已新增历史 helper：`web/lib/storage/history.ts`。
  - `full` 保存原文、结果和参数。
  - `result-only` 不写入 `sourceText` 或 `strategy`。
  - `none` 不保存历史。
  - 支持删除单条、清空历史、坏 JSON 降级为空数组、最多保留 100 条。
- 已新增首次历史提示 helper：`web/lib/storage/notice.ts`。

### Task 6: Request guards, errors, and rate limiting

- 已新增 request guards / rate limiter 测试：
  - `web/lib/server/requestGuards.test.ts`
  - `web/lib/server/rateLimit.test.ts`
- 已按 TDD 确认红灯：测试最初失败于 `./requestGuards` 与 `./rateLimit` 不存在。
- 已新增统一错误类：`web/lib/ai/errors.ts`。
- 已新增请求 guard：`web/lib/server/requestGuards.ts`。
  - 支持生产环境来源 allowlist，未配置来源时 fail closed。
  - 开发环境允许 `http://localhost:3000`。
  - 支持 `content-length` 预检和读取后的 raw body 字节数校验。
  - 支持上游错误详情中的 API Key / 原文脱敏。
  - 支持从 `x-forwarded-for` / `x-real-ip` 读取客户端 IP。
- 已新增 best-effort 内存限流器：`web/lib/server/rateLimit.ts`。

### Task 7: Provider adapters and error mapping

- 已新增 provider adapter 测试：`web/lib/ai/callModel.test.ts`。
- 已按 TDD 确认红灯：测试最初失败于 `Failed to resolve import "./callModel"`，原因是 dispatcher / adapter 文件尚不存在。
- 已新增 OpenAI-compatible 调用适配器：`web/lib/ai/openai.ts`。
  - 使用 `temperature: 0.7`、`max_tokens: 4000`、`stream: false`。
  - 映射 OpenAI usage 到统一 `inputTokens/outputTokens/totalTokens`。
  - 将 401/403、404、429、quota-like 错误映射为对应 `RewriteError`。
- 已新增 Anthropic 调用适配器：`web/lib/ai/anthropic.ts`。
  - 使用 Messages API 请求结构和 `anthropic-version: 2023-06-01`。
  - 仅当 `input_tokens` 与 `output_tokens` 同时为 number 时计算 `totalTokens`，避免 `NaN`。
- 已新增 provider dispatcher：`web/lib/ai/callModel.ts`。

### Task 8: Rewrite handler and API route

- 已新增 rewrite handler / route 测试：
  - `web/lib/server/rewriteHandler.test.ts`
  - `web/app/api/rewrite/route.test.ts`
- 已按 TDD 确认红灯：测试最初失败于 `./rewriteHandler` 与 `./route` 不存在。
- 已新增 handler：`web/lib/server/rewriteHandler.ts`。
  - 校验 API Key、模型名、原文、原文字数和高级要求长度。
  - V1 继续拒绝自定义 `baseUrl`。
  - 组装 provider target、prompt messages，并调用 `callModel`。
- 已新增 POST-only API route：`web/app/api/rewrite/route.ts`。
  - 在读取 body 前校验 `content-length`。
  - 读取后校验 raw body 字节数。
  - 校验 Origin，生产环境未配置来源时 fail closed。
  - 按客户端 IP 做 best-effort 内存限流。
  - 使用 60 秒 `AbortController` 超时控制。
  - 将 `RewriteError`、`AbortError` 和 JSON 格式错误映射成中文错误响应，并对上游 detail 做 API Key / 原文脱敏。

### Task 9: Layout and static pages

- 已新增 Header 渲染测试：`web/components/SiteHeader.test.tsx`。
- 已按 TDD 确认红灯：测试最初失败于 `./SiteHeader` 不存在。
- 已新增站点 Header / Footer：
  - `web/components/SiteHeader.tsx`
  - `web/components/SiteFooter.tsx`
- 已更新全局布局：`web/app/layout.tsx`，设置中文语言、站点 metadata，并挂载 Header/Footer。
- 已替换默认 Next.js 首页：`web/app/page.tsx`。
  - 首页标题：`中文学术文本润色与表达校准工具`。
  - 首页副标题：`帮助课程论文、实验报告、毕业设计和答辩稿减少模板感，让表达更自然、清楚、克制。`
- 已新增静态页面，避免导航入口空白或 404：
  - `web/app/privacy/page.tsx`
  - `web/app/guide/page.tsx`
  - `web/app/examples/page.tsx`
- 已调整全局字体和基础链接样式：`web/app/globals.css`。

### Task 10: Rewrite form shell and model settings panel

- 已新增改写表单和模型设置测试：
  - `web/components/rewrite/ModelSettingsPanel.test.tsx`
  - `web/components/rewrite/RewriteForm.test.tsx`
- 已按 TDD 确认红灯：测试最初失败于 `./ModelSettingsPanel` 与 `./RewriteForm` 不存在。
- 已新增模型设置面板：`web/components/rewrite/ModelSettingsPanel.tsx`。
  - 平台预设切换会填入推荐模型。
  - OpenAI 官方和 Anthropic 不暴露可编辑 Base URL。
  - 明确提示自定义 Base URL 在 V1 暂不开放。
- 已新增改写表单外壳：`web/components/rewrite/RewriteForm.tsx`。
  - 包含 `aria-label="待处理原文"` 原文输入。
  - API Key 默认只用于本次请求，不在改写页保存。
  - 支持严肃度、角色、高级要求和长度校验。
  - 指向设置页处理长期保存 API Key 的风险确认。
- 已新增改写页：`web/app/rewrite/page.tsx`。
- 调试记录：首次 build 失败于 Server Component 向 Client Component 传递 `onSubmit={() => undefined}`；根因是函数 prop 不能从服务端组件传入客户端组件。已将 `RewriteForm` 的 `onSubmit` 改为可选，并在客户端组件内提供默认 no-op。

### Task 11: Rewrite submission, output display, and copying

- 已新增输出面板测试：`web/components/rewrite/OutputPanel.test.tsx`。
- 已新增改写提交流程测试：`web/components/rewrite/RewriteTool.test.tsx`。
- 已按 TDD 确认红灯：测试最初失败于 `./OutputPanel` 与 `./RewriteTool` 不存在。
- 已新增输出面板：`web/components/rewrite/OutputPanel.tsx`。
  - 使用 `parseRewriteOutput` 解析模型输出。
  - 展示参数确认、重写后的学术文本和精简修改日志。
  - 支持复制全文和只复制重写文本；解析失败时禁用“只复制重写文本”。
- 已新增改写工具容器：`web/components/rewrite/RewriteTool.tsx`。
  - 调用 `/api/rewrite`。
  - 成功后展示解析后的结果。
  - 失败时显示中文排查建议。
  - 请求中禁用提交按钮。
- 已更新 `web/app/rewrite/page.tsx`，改为渲染 `RewriteTool`。
- 调试记录：首次 build 失败于 `RewriteApiResponse` 联合类型缩小；根因是 `!response.ok || !body.ok` 无法让 TypeScript 确认 `body` 为错误响应。已改为先判断 `!body.ok`，再处理 HTTP 非 2xx 兜底。

### Task 12: History-save notice and rewrite-history integration

- 已在 `web/components/rewrite/RewriteTool.test.tsx` 中补充历史保存集成测试。
- 已按 TDD 确认红灯：首次历史确认保存时没有解析后的 `rewrittenText`，且已确认提示后的后续改写不会自动保存。
- 已更新 `web/components/rewrite/RewriteTool.tsx`：
  - 首次成功改写后展示 localStorage 风险提示。
  - 用户可选择保存完整历史、只保存结果和参数或不保存历史。
  - 首次提示确认后，后续成功改写按设置中的历史策略自动保存。
  - 保存历史时使用 `parseRewriteOutput` 写入结构化结果。
- 已更新 `web/components/rewrite/OutputPanel.tsx`：支持“保存到历史”和“清空结果”。

### Task 13: Settings and history pages

- 已新增设置页：`web/app/settings/page.tsx`。
- 已新增设置表单与测试：
  - `web/components/settings/SettingsForm.tsx`
  - `web/components/settings/SettingsForm.test.tsx`
- 设置页支持默认平台预设、模型名、严肃度、角色、历史保存策略、API Key 风险确认、清除 API Key、清除历史和清除全部本地数据。
- 已新增历史页：`web/app/history/page.tsx`。
- 已新增历史列表与测试：
  - `web/components/history/HistoryList.tsx`
  - `web/components/history/HistoryList.test.tsx`
- 历史页支持搜索、按严肃度筛选、按角色筛选、删除单条、清空全部和导出 JSON。

### Task 14: Delivery hardening and docs

- 已新增 `web/next.config.test.ts`，按 TDD 确认安全 headers 与 `turbopack.root` 缺失。
- 已更新 `web/next.config.ts`：
  - 设置 `turbopack.root` 为 web 项目目录，消除 Next 16 workspace root 推断歧义。
  - 为全站配置 `X-Content-Type-Options`、`Referrer-Policy`、`X-Frame-Options` 和 `Permissions-Policy`。
- 已更新 `web/README.md`，替换 create-next-app 默认内容，补充本地开发、Vercel 部署、安全隐私和 serverless 限流升级路径。
- 已更新根 `README.md`，增加网站版 V1 说明和常用命令。

## 当前状态

- Web V1 已达到当前计划定义的可交付状态。
- 最终全量测试、lint 和生产构建均已通过。
- 用户未要求提交，因此本轮没有创建新 commit。

## 验证记录

> 本节只记录实际运行过的命令。新的完成结论必须以最新命令输出为准。

- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run test:run -- lib/ai/providers.test.ts`
  - 第一次：FAIL，失败原因是 `./providers` 不存在，符合 Task 2 红灯预期。
  - 实现后：PASS，`1 passed` test file，`5 passed` tests。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run test:run`
  - PASS，`2 passed` test files，`6 passed` tests。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run lint`
  - PASS，exit 0。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run build`
  - PASS，exit 0。
  - 注意：Next.js 16.2.6 构建时提示 workspace root 推断警告，建议后续在 `web/next.config.ts` 设置 `turbopack.root` 消除歧义。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run test:run -- lib/prompt/buildPrompt.test.ts`
  - 第一次：FAIL，失败原因是 `./buildPrompt` 不存在，符合 Task 3 红灯预期。
  - 实现后：PASS，`1 passed` test file，`1 passed` test。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run test:run`
  - PASS，`3 passed` test files，`7 passed` tests。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run lint`
  - PASS，exit 0。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run build`
  - PASS，exit 0。
  - 注意：Next.js 16.2.6 构建时仍提示 workspace root 推断警告，后续可在 `web/next.config.ts` 设置 `turbopack.root`。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run test:run -- components/SiteHeader.test.tsx`
  - 第一次：FAIL，失败原因是 `./SiteHeader` 不存在，符合 Task 9 红灯预期。
  - 实现后：PASS，`1 passed` test file，`1 passed` test。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run lint`
  - PASS，exit 0。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run build`
  - PASS，exit 0。
  - 新增静态路由 `/examples`、`/guide`、`/privacy`；构建仍提示 workspace root 推断警告。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run test:run -- components/rewrite/ModelSettingsPanel.test.tsx components/rewrite/RewriteForm.test.tsx`
  - 第一次：FAIL，失败原因是 `./ModelSettingsPanel` 与 `./RewriteForm` 不存在，符合 Task 10 红灯预期。
  - 实现后：PASS，`2 passed` test files，`7 passed` tests。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run test:run`
  - PASS，`15 passed` test files，`63 passed` tests。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run lint`
  - PASS，exit 0。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run build`
  - 第一次：FAIL，`/rewrite` prerender 时服务端组件向客户端组件传递函数 prop。
  - 修复后：PASS，exit 0；新增静态路由 `/rewrite`；构建仍提示 workspace root 推断警告。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run test:run -- components/rewrite/RewriteTool.test.tsx components/rewrite/OutputPanel.test.tsx`
  - 第一次：FAIL，失败原因是 `./OutputPanel` 与 `./RewriteTool` 不存在，符合 Task 11 红灯预期。
  - 实现后：PASS，`2 passed` test files，`6 passed` tests。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run test:run`
  - PASS，`17 passed` test files，`69 passed` tests。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run lint`
  - PASS，exit 0。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run build`
  - 第一次：FAIL，`RewriteApiResponse` 联合类型未正确缩小，`body.message` 被认为可能访问成功响应。
  - 修复后：PASS，exit 0；构建仍提示 workspace root 推断警告。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run test:run -- lib/server/rewriteHandler.test.ts app/api/rewrite/route.test.ts`
  - 第一次：FAIL，失败原因是 `./rewriteHandler` 与 `./route` 不存在，符合 Task 8 红灯预期。
  - 实现后：PASS，`2 passed` test files，`11 passed` tests。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run test:run`
  - PASS，`12 passed` test files，`55 passed` tests。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run lint`
  - PASS，exit 0。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run build`
  - PASS，exit 0。
  - 注意：Next.js 16.2.6 构建时仍提示 workspace root 推断警告，后续可在 `web/next.config.ts` 设置 `turbopack.root`。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run test:run -- lib/ai/callModel.test.ts`
  - 第一次：FAIL，失败原因是 `./callModel` 不存在，符合 Task 7 红灯预期。
  - 实现后：PASS，`1 passed` test file，`9 passed` tests。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run test:run`
  - PASS，`10 passed` test files，`44 passed` tests。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run lint`
  - PASS，exit 0。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run build`
  - PASS，exit 0。
  - 注意：Next.js 16.2.6 构建时仍提示 workspace root 推断警告，后续可在 `web/next.config.ts` 设置 `turbopack.root`。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run test:run -- lib/server/requestGuards.test.ts lib/server/rateLimit.test.ts`
  - 第一次：FAIL，失败原因是 `./requestGuards` 与 `./rateLimit` 不存在，符合 Task 6 红灯预期。
  - 实现后：PASS，`2 passed` test files，`12 passed` tests。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run test:run`
  - PASS，`9 passed` test files，`35 passed` tests。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run lint`
  - PASS，exit 0。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run build`
  - PASS，exit 0。
  - 注意：Next.js 16.2.6 构建时仍提示 workspace root 推断警告，后续可在 `web/next.config.ts` 设置 `turbopack.root`。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run test:run -- lib/storage/settings.test.ts lib/storage/history.test.ts lib/storage/notice.test.ts`
  - 第一次：FAIL，失败原因是 storage helper 文件尚不存在，符合 Task 5 红灯预期。
  - 实现后：PASS，`3 passed` test files，`13 passed` tests。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run test:run`
  - PASS，`7 passed` test files，`23 passed` tests。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run lint`
  - PASS，exit 0。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run build`
  - PASS，exit 0。
  - 注意：Next.js 16.2.6 构建时仍提示 workspace root 推断警告，后续可在 `web/next.config.ts` 设置 `turbopack.root`。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run test:run -- lib/output/parseRewriteOutput.test.ts`
  - 第一次：FAIL，失败原因是 `./parseRewriteOutput` 不存在，符合 Task 4 红灯预期。
  - 首次实现后：FAIL，`parses markdown headings with colons` 收到 `undefined`，根因是动态正则转义错误。
  - 修复后：PASS，`1 passed` test file，`3 passed` tests。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run test:run`
  - PASS，`4 passed` test files，`10 passed` tests。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run lint`
  - PASS，exit 0。
- `npm --prefix "D:/codehub/ai_lab/Humanizer-zh-academic/.worktrees/web-v1/web" run build`
  - PASS，exit 0。
  - 注意：Next.js 16.2.6 构建时仍提示 workspace root 推断警告，后续可在 `web/next.config.ts` 设置 `turbopack.root`。

## 最终验证记录

- `npm --prefix web run test:run`
  - PASS，`20 passed` test files，`81 passed` tests。
- `npm --prefix web run lint`
  - PASS，exit 0。
- `npm --prefix web run build`
  - PASS，exit 0。
  - 构建路由包括 `/`、`/rewrite`、`/history`、`/settings`、`/examples`、`/guide`、`/privacy` 和动态 `/api/rewrite`。

## 后续可选事项

1. 由用户决定是否提交当前 worktree 中的 V1 变更。
2. 部署到 Vercel 前设置 `NEXT_PUBLIC_SITE_URL`。
3. 若后续开放自定义 Base URL，必须先补齐 SSRF 防护、DNS/IP 校验、重定向拦截和端口限制。
