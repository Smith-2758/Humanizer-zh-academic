# Humanizer Academic Web V1

这是 `Humanizer-zh-academic-student` 的网站版 V1。网站定位为中文学术文本润色与表达校准工具，使用用户自带模型 API Key，不提供模型额度。

## 功能范围

- 首页、改写页、历史页、设置页、示例页、使用说明页和隐私说明页。
- 支持 OpenAI 官方接口、OpenAI 兼容平台预设、Anthropic / Claude 官方接口。
- V1 只开放后端 allowlist 中的平台预设 Base URL，不开放任意自定义 Base URL。
- API Key 默认不保存；只有用户在设置页勾选“记住 API Key”并确认 localStorage 风险后才保存到当前浏览器。
- 历史记录只保存在当前浏览器，可选择保存完整历史、只保存结果和参数，或不保存历史。
- `/api/rewrite` 只做受限请求转发，不保存 API Key、原文或改写结果。

## 本地开发

在仓库根目录运行：

```powershell
npm --prefix web install
npm --prefix web run dev
```

访问：

```text
http://localhost:3000
```

## 验证命令

```powershell
npm --prefix web run test:run
npm --prefix web run lint
npm --prefix web run build
```

## Vercel 部署

在 Vercel 新建项目时：

1. Project Root 选择 `web/`。
2. Build Command 使用默认 `npm run build`，或显式设置为 `npm run build`。
3. Install Command 使用默认 `npm install`。
4. 环境变量建议设置：

```text
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

建议先在本地复制一份环境变量样例：

```powershell
Copy-Item web/.env.example web/.env.local
```

然后把 `NEXT_PUBLIC_SITE_URL` 改成你准备绑定到 Vercel 的正式域名。这个值必须是站点根地址，例如 `https://your-domain.example`，不要带路径、查询参数或尾部说明。

生产环境的 `/api/rewrite` 会校验请求 `Origin`。如果未配置 `NEXT_PUBLIC_SITE_URL` 且没有可用的 `VERCEL_URL`，接口会 fail closed 并拒绝请求。

如果你先用 `*.vercel.app` 域名上线，也建议显式设置 `NEXT_PUBLIC_SITE_URL`，不要只依赖 `VERCEL_URL` 自动推断。这样更容易排查跨域和来源校验问题。

## 上线前检查

在推送到 Vercel 前，至少完成下面几项：

```powershell
npm --prefix web run test:run
npm --prefix web run lint
npm --prefix web run build
```

还要人工确认：

1. 首页、`/rewrite`、`/settings`、`/history`、`/privacy` 都能正常打开。
2. 未填写原文时，改写页会阻止提交。
3. 设置页里未确认风险前，不会保存 API Key。
4. 隐私页明确写了服务器不保存 API Key、原文和改写结果。
5. 公开文案中没有“保证通过 AI 检测”“绕过检测”“规避审查”之类承诺。

## Vercel 配置建议

建议在 Vercel 项目里按下面方式配置：

1. Framework Preset 使用 `Next.js`。
2. Root Directory 设为 `web`。
3. Production 环境显式配置 `NEXT_PUBLIC_SITE_URL`。
4. 先不要开放任何自定义 Base URL 相关开关，V1 继续只用平台预设。

## 上线后验证

部署完成后，至少验证一次真实线上链路：

1. 访问首页，确认没有空白页或 CSP 报错。
2. 打开 `/rewrite`，确认页面能正常渲染。
3. 不填原文直接提交，确认前端校验仍生效。
4. 填入测试用 API Key 和短文本，确认 `/api/rewrite` 不会因为来源校验误拦截。
5. 刷新设置页，确认未勾选保存时 API Key 不会残留。

## 回滚点

如果线上部署后出现问题，优先按这个顺序排查：

1. 检查 `NEXT_PUBLIC_SITE_URL` 是否与实际访问域名完全对应。
2. 检查浏览器控制台是否有 `Content-Security-Policy` 违规。
3. 检查 Vercel Functions 日志里是否只有脱敏后的错误，没有 API Key 或原文。
4. 如确认为本次改动引入问题，先回滚到上一版成功部署，再单独修复安全头或来源校验配置。

## 安全与隐私说明

- 服务器不持久化 API Key、原文、改写结果或历史记录。
- API Key 如被用户选择保存，只保存在浏览器 localStorage；localStorage 不是加密存储。
- 历史记录也只保存在浏览器 localStorage，可能被同设备用户、浏览器扩展、浏览器同步或恶意脚本读取。
- 请求会经由本站后端转发到用户选择的模型服务商；模型服务商可能按其政策处理请求内容。
- 请勿提交涉密、隐私或未经授权的内容。
- 本工具用于表达润色和写作校准，不保证符合任何学校、课程、期刊或检测系统要求。

## 限流说明

V1 使用内存中的 best-effort rate limiter。该方案在 Vercel/serverless 环境下只能作为基础保护，不适合强一致的全局限流。

后续生产增强建议：

- Upstash Redis；
- Vercel KV；
- Cloudflare Turnstile；
- 按 API Key 或用户会话维度增加更细粒度的限流策略。

## 后续版本方向

- Word / PDF 文件解析；
- 更完整的示例库；
- 账号、数据库、同步历史；
- 在完成 SSRF 防护、DNS/IP 校验、重定向拦截和端口限制后，再考虑开放自定义 Base URL。
