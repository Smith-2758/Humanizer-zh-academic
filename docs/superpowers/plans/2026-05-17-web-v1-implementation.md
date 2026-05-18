# Web V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在当前 Skill 仓库中新增 `web/` 网站项目，实现一个可部署到 Vercel 的中文学术文本润色与表达校准工具 V1。

**Architecture:** `web/` 是独立 Next.js App Router 项目。前端负责首页、改写页、设置页、历史页和隐私页；本地设置与历史保存在浏览器 `localStorage`；后端 `/api/rewrite` 只做受限模型请求转发。V1 只使用后端 allowlist 中的平台预设地址，不开放任意自定义 Base URL。

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Vitest, React Testing Library, Vercel Route Handler, browser `localStorage`.

---

## Reference Documents

- Spec: `docs/superpowers/specs/2026-05-17-web-product-design.md`
- Skill prompt source: `SKILL.md`
- Existing examples: `docs/superpowers/corpus/`, `docs/superpowers/deai/`

## Execution Notes

- Before implementation, create an isolated worktree with the `using-git-worktrees` skill.
- Use PowerShell-compatible commands. Prefer `npm --prefix web ...` from repo root when possible.
- Commit steps are included for checkpoints. If the user has not explicitly approved commits, skip commit commands and report changed files instead.
- V1 must favor safety over flexibility: custom Base URL remains disabled in production until full SSRF protection is implemented and tested.
- In Vercel/serverless, the in-memory rate limiter is best-effort only. V1 docs must state the upgrade path to Upstash Redis, Vercel KV, or Cloudflare Turnstile.

## File Map

### Create under `web/`

- `web/package.json`: scripts and dependencies.
- `web/next.config.ts`: security headers and Next config.
- `web/tsconfig.json`, `web/postcss.config.mjs`, `web/eslint.config.mjs`: project tooling generated/updated by scaffold.
- `web/vitest.config.ts`, `web/test/setup.ts`: test runner setup.
- `web/app/layout.tsx`: global layout and metadata.
- `web/app/page.tsx`: homepage.
- `web/app/rewrite/page.tsx`: rewrite tool page.
- `web/app/history/page.tsx`: local history page.
- `web/app/settings/page.tsx`: local settings page.
- `web/app/privacy/page.tsx`: privacy and disclaimer page.
- `web/app/examples/page.tsx`: short V1 example/placeholder page.
- `web/app/guide/page.tsx`: short V1 guide/FAQ page.
- `web/app/api/rewrite/route.ts`: POST-only rewrite API.
- `web/app/globals.css`: Tailwind base and theme tokens.
- `web/components/SiteHeader.tsx`, `web/components/SiteFooter.tsx`: layout chrome.
- `web/components/rewrite/*`: rewrite form, model panel, output panel, history notice.
- `web/components/settings/*`: settings form and API Key confirmation UI.
- `web/components/history/*`: local history list.
- `web/lib/ai/*`: provider types, presets, adapters, errors.
- `web/lib/prompt/*`: system prompt and prompt builder.
- `web/lib/storage/*`: local settings/history/notice helpers.
- `web/lib/output/*`: response parser.
- `web/lib/server/*`: request guards, origin checks, request-size checks, rate limiting, API handler helpers.
- `web/README.md`: local development and deployment notes.

### Optional root modifications

- `README.md`: add short note that website project lives in `web/`.
- `.gitignore`: add generated ignores only if missing, such as `.vercel/`.

---

## Task 1: Scaffold Next.js app and test baseline

**Files:**
- Create: `web/package.json`
- Create: `web/app/layout.tsx`
- Create: `web/app/page.tsx`
- Create: `web/app/globals.css`
- Create: `web/vitest.config.ts`
- Create: `web/test/setup.ts`
- Create: `web/lib/sanity.ts`
- Test: `web/lib/sanity.test.ts`

- [ ] **Step 1: Create the Next.js project non-interactively**

Run from repo root. Use the latest generator, but pass all known non-interactive flags. If `create-next-app` prompts for extra options, choose the minimal defaults: no `src/` directory, App Router, TypeScript, ESLint, Tailwind, import alias `@/*`.

```powershell
npx --yes create-next-app@latest web --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm
```

Expected: `web/` is created with a working Next.js App Router project.

- [ ] **Step 2: Install test dependencies in `web/`**

Run from repo root:

```powershell
npm --prefix web install -D vitest jsdom @testing-library/react @testing-library/jest-dom
```

Expected: dependencies are added to `web/package.json`, not the repository root.

- [ ] **Step 3: Normalize scripts**

Modify `web/package.json` scripts. Do not use `next lint`; use `eslint .` so the plan works with modern Next.js versions.

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

- [ ] **Step 4: Add Windows-safe Vitest config**

Create `web/vitest.config.ts`:

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
```

Create `web/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5: Write the failing sanity test**

Create `web/lib/sanity.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getAppName } from "./sanity";

describe("sanity", () => {
  it("returns the app name", () => {
    expect(getAppName()).toBe("Humanizer Academic");
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

```powershell
npm --prefix web run test:run -- lib/sanity.test.ts
```

Expected: FAIL because `web/lib/sanity.ts` does not exist.

- [ ] **Step 7: Add minimal implementation**

Create `web/lib/sanity.ts`:

```ts
export function getAppName() {
  return "Humanizer Academic";
}
```

- [ ] **Step 8: Verify baseline**

```powershell
npm --prefix web run test:run
npm --prefix web run lint
npm --prefix web run build
```

Expected: tests pass, lint passes, production build succeeds.

- [ ] **Step 9: Commit checkpoint**

```powershell
git add web
git commit -m "chore: scaffold web app"
```

---

## Task 2: Shared AI types and provider presets

**Files:**
- Create: `web/lib/ai/types.ts`
- Create: `web/lib/ai/providers.ts`
- Test: `web/lib/ai/providers.test.ts`

- [ ] **Step 1: Write provider resolution tests**

Create `web/lib/ai/providers.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getProviderPresets, resolveProviderTarget } from "./providers";

describe("resolveProviderTarget", () => {
  it("uses fixed OpenAI official endpoint", () => {
    expect(resolveProviderTarget({ provider: "openai" })).toEqual({
      endpoint: "https://api.openai.com/v1/chat/completions",
      format: "openai",
    });
  });

  it("uses fixed Anthropic endpoint", () => {
    expect(resolveProviderTarget({ provider: "anthropic" })).toEqual({
      endpoint: "https://api.anthropic.com/v1/messages",
      format: "anthropic",
    });
  });

  it("resolves allowlisted OpenAI-compatible presets", () => {
    expect(resolveProviderTarget({ provider: "openai-compatible", presetId: "deepseek" })).toEqual({
      endpoint: "https://api.deepseek.com/v1/chat/completions",
      format: "openai",
    });
  });

  it("rejects custom baseUrl in V1", () => {
    expect(() =>
      resolveProviderTarget({ provider: "openai-compatible", baseUrl: "https://example.com/v1" }),
    ).toThrow("Custom Base URL is disabled in V1");
  });

  it("exposes recommended model metadata for UI", () => {
    const deepseek = getProviderPresets().find((preset) => preset.id === "deepseek");
    expect(deepseek?.recommendedModel).toBe("deepseek-chat");
    expect(deepseek?.label).toContain("DeepSeek");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
npm --prefix web run test:run -- lib/ai/providers.test.ts
```

Expected: FAIL because provider files do not exist.

- [ ] **Step 3: Add shared AI types**

Create `web/lib/ai/types.ts`:

```ts
export type Provider = "openai" | "openai-compatible" | "anthropic";

export type ProviderPresetId =
  | "openai"
  | "deepseek"
  | "kimi"
  | "siliconflow"
  | "zhipu"
  | "qwen"
  | "doubao"
  | "anthropic";

export type Seriousness = "低" | "中" | "高";

export type RewriteRole =
  | "课程论文作者"
  | "毕业设计作者"
  | "实验报告作者"
  | "答辩陈述稿作者"
  | "自定义";

export type CustomRole = {
  discipline: string;
  stage: string;
  purpose: string;
};

export type RewriteRequest = {
  provider: Provider;
  presetId?: ProviderPresetId;
  baseUrl?: string;
  apiKey: string;
  model: string;
  sourceText: string;
  seriousness: Seriousness;
  role: RewriteRole;
  customRole?: CustomRole;
  extraInstruction?: string;
};

export type Usage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};
```

- [ ] **Step 4: Add provider allowlist with UI metadata**

Create `web/lib/ai/providers.ts`:

```ts
import type { Provider, ProviderPresetId } from "./types";

type ResolveArgs = {
  provider: Provider;
  presetId?: ProviderPresetId;
  baseUrl?: string;
};

type ProviderTarget = {
  endpoint: string;
  format: "openai" | "anthropic";
};

export type ProviderPreset = {
  id: ProviderPresetId;
  label: string;
  provider: Provider;
  baseUrl?: string;
  recommendedModel: string;
  helpText: string;
};

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";

const PRESETS: ProviderPreset[] = [
  { id: "openai", label: "OpenAI 官方", provider: "openai", recommendedModel: "gpt-4o-mini", helpText: "使用 OpenAI 官方 API。" },
  { id: "deepseek", label: "DeepSeek", provider: "openai-compatible", baseUrl: "https://api.deepseek.com/v1", recommendedModel: "deepseek-chat", helpText: "OpenAI 兼容接口，适合低成本测试。" },
  { id: "kimi", label: "Kimi / Moonshot", provider: "openai-compatible", baseUrl: "https://api.moonshot.cn/v1", recommendedModel: "moonshot-v1-8k", helpText: "OpenAI 兼容接口。" },
  { id: "siliconflow", label: "硅基流动", provider: "openai-compatible", baseUrl: "https://api.siliconflow.cn/v1", recommendedModel: "deepseek-ai/DeepSeek-V3", helpText: "OpenAI 兼容接口。" },
  { id: "zhipu", label: "智谱", provider: "openai-compatible", baseUrl: "https://open.bigmodel.cn/api/paas/v4", recommendedModel: "glm-4-flash", helpText: "OpenAI 兼容接口。" },
  { id: "qwen", label: "通义千问", provider: "openai-compatible", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", recommendedModel: "qwen-plus", helpText: "OpenAI 兼容接口。" },
  { id: "doubao", label: "豆包", provider: "openai-compatible", baseUrl: "https://ark.cn-beijing.volces.com/api/v3", recommendedModel: "doubao-1-5-lite-32k", helpText: "OpenAI 兼容接口，模型名以控制台为准。" },
  { id: "anthropic", label: "Anthropic / Claude", provider: "anthropic", recommendedModel: "claude-3-5-sonnet-latest", helpText: "使用 Anthropic 官方 Messages API。" },
];

export function getProviderPresets() {
  return PRESETS;
}

export function resolveProviderTarget(args: ResolveArgs): ProviderTarget {
  if (args.provider === "openai") {
    return { endpoint: OPENAI_ENDPOINT, format: "openai" };
  }

  if (args.provider === "anthropic") {
    return { endpoint: ANTHROPIC_ENDPOINT, format: "anthropic" };
  }

  if (args.baseUrl) {
    throw new Error("Custom Base URL is disabled in V1");
  }

  const preset = PRESETS.find((item) => item.id === args.presetId && item.provider === "openai-compatible");
  if (!preset?.baseUrl) {
    throw new Error("Unknown OpenAI-compatible provider preset");
  }

  return { endpoint: `${preset.baseUrl.replace(/\/$/, "")}/chat/completions`, format: "openai" };
}
```

- [ ] **Step 5: Verify tests**

```powershell
npm --prefix web run test:run -- lib/ai/providers.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit checkpoint**

```powershell
git add web/lib/ai
git commit -m "feat: add provider presets"
```

---

## Task 3: Prompt builder

**Files:**
- Create: `web/lib/prompt/systemPrompt.ts`
- Create: `web/lib/prompt/buildPrompt.ts`
- Test: `web/lib/prompt/buildPrompt.test.ts`

- [ ] **Step 1: Write prompt builder tests**

Create `web/lib/prompt/buildPrompt.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildRewriteMessages } from "./buildPrompt";

describe("buildRewriteMessages", () => {
  it("includes parameters, source text, and required output headings", () => {
    const result = buildRewriteMessages({
      sourceText: "这是原文。",
      seriousness: "中",
      role: "实验报告作者",
      extraInstruction: "保留原段落。",
    });

    expect(result.system).toContain("中文学生学术写作");
    expect(result.user).toContain("严肃度：中");
    expect(result.user).toContain("角色：实验报告作者");
    expect(result.user).toContain("这是原文。");
    expect(result.user).toContain("参数确认");
    expect(result.user).toContain("重写后的学术文本");
    expect(result.user).toContain("精简修改日志");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
npm --prefix web run test:run -- lib/prompt/buildPrompt.test.ts
```

Expected: FAIL because prompt files do not exist.

- [ ] **Step 3: Add compact system prompt**

Create `web/lib/prompt/systemPrompt.ts` using a distilled version of `SKILL.md`:

```ts
export const SYSTEM_PROMPT = `你是一位专门指导大学生进行论文写作的资深学术编辑。
你的任务是把中文学生学术写作中的模板感、机械句法、空洞总结和过度卖弄表达，改成更自然、清楚、克制的表达。

总原则：
1. 不承诺绕过任何 AI 检测，也不牺牲事实准确性。
2. 保留具体事实，减少空泛意义拔高。
3. 根据严肃度调整正式程度、句长波动、术语保留和结论收束力度。
4. 根据角色调整叙述重心、段落组织方式和表达口吻。
5. 清理机械连接词、卖弄词、伪深刻排比和高危排版。
6. 输出必须包含：参数确认、重写后的学术文本、精简修改日志。`;
```

- [ ] **Step 4: Add prompt builder**

Create `web/lib/prompt/buildPrompt.ts`:

```ts
import type { CustomRole, RewriteRole, Seriousness } from "@/lib/ai/types";
import { SYSTEM_PROMPT } from "./systemPrompt";

type BuildPromptArgs = {
  sourceText: string;
  seriousness: Seriousness;
  role: RewriteRole;
  customRole?: CustomRole;
  extraInstruction?: string;
};

export function buildRewriteMessages(args: BuildPromptArgs) {
  const customRoleText =
    args.role === "自定义" && args.customRole
      ? `\n自定义角色信息：\n- 学科背景：${args.customRole.discipline}\n- 求学阶段或经验：${args.customRole.stage}\n- 文本用途：${args.customRole.purpose}`
      : "";

  const extra = args.extraInstruction?.trim()
    ? `\n高级要求：${args.extraInstruction.trim()}`
    : "";

  return {
    system: SYSTEM_PROMPT,
    user: `请按以下参数处理文本：

严肃度：${args.seriousness}
角色：${args.role}${customRoleText}${extra}

输出必须严格包含以下三个标题：
参数确认
重写后的学术文本
精简修改日志

原文：
${args.sourceText}`,
  };
}
```

- [ ] **Step 5: Verify tests**

```powershell
npm --prefix web run test:run -- lib/prompt/buildPrompt.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit checkpoint**

```powershell
git add web/lib/prompt
git commit -m "feat: add rewrite prompt builder"
```

---

## Task 4: Output parser

**Files:**
- Create: `web/lib/output/parseRewriteOutput.ts`
- Test: `web/lib/output/parseRewriteOutput.test.ts`

- [ ] **Step 1: Write parser tests**

Create `web/lib/output/parseRewriteOutput.test.ts` with cases for plain headings, markdown headings, heading colons, and malformed output.

- [ ] **Step 2: Run test to verify it fails**

```powershell
npm --prefix web run test:run -- lib/output/parseRewriteOutput.test.ts
```

Expected: FAIL because parser does not exist.

- [ ] **Step 3: Implement parser**

Create `web/lib/output/parseRewriteOutput.ts`:

```ts
export type ParsedRewriteOutput = {
  parameterConfirmation?: string;
  rewrittenText?: string;
  changeLog?: string;
  rawOutput: string;
};

const HEADINGS = ["参数确认", "重写后的学术文本", "精简修改日志"] as const;

function headingPattern(title: string) {
  return new RegExp(`(^|\\n)\\s*(?:#{1,6}\\s*)?${title}\\s*[:：]?\\s*(?:\\n|$)`, "m");
}

export function parseRewriteOutput(rawOutput: string): ParsedRewriteOutput {
  const matches = HEADINGS.map((title) => {
    const match = headingPattern(title).exec(rawOutput);
    return match ? { title, index: match.index, end: match.index + match[0].length } : null;
  });

  if (matches.some((match) => !match)) return { rawOutput };

  const ordered = matches.filter(Boolean).sort((a, b) => a!.index - b!.index) as Array<{
    title: (typeof HEADINGS)[number];
    index: number;
    end: number;
  }>;

  const sections = new Map<string, string>();
  for (let i = 0; i < ordered.length; i += 1) {
    const current = ordered[i];
    const next = ordered[i + 1];
    sections.set(current.title, rawOutput.slice(current.end, next?.index).trim());
  }

  return {
    parameterConfirmation: sections.get("参数确认"),
    rewrittenText: sections.get("重写后的学术文本"),
    changeLog: sections.get("精简修改日志"),
    rawOutput,
  };
}
```

- [ ] **Step 4: Verify tests**

```powershell
npm --prefix web run test:run -- lib/output/parseRewriteOutput.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit checkpoint**

```powershell
git add web/lib/output
git commit -m "feat: parse rewrite output sections"
```

---

## Task 5: Local storage helpers with full history metadata

**Files:**
- Create: `web/lib/storage/keys.ts`
- Create: `web/lib/storage/settings.ts`
- Create: `web/lib/storage/history.ts`
- Create: `web/lib/storage/notice.ts`
- Test: `web/lib/storage/settings.test.ts`
- Test: `web/lib/storage/history.test.ts`
- Test: `web/lib/storage/notice.test.ts`

- [ ] **Step 1: Write storage tests**

Tests must cover:

- API Key is not persisted when `rememberApiKey` is false.
- API Key is persisted only when `rememberApiKey` is true and `apiKeySaveConfirmed` is true.
- Full history saves source text and metadata.
- Result-only history omits source text but keeps output and parameters.
- Result-only history never writes `sourceText` or `strategy` into the stored object.
- `none` history saves nothing.
- Delete one history item.
- Clear history.
- First-run history notice starts as unseen and can be marked seen.
- Invalid stored JSON is handled by returning an empty/default value instead of crashing the page.
- `QuotaExceededError` or unavailable `localStorage` is surfaced as a storage error that UI can display.

- [ ] **Step 2: Run tests to verify they fail**

```powershell
npm --prefix web run test:run -- lib/storage/settings.test.ts lib/storage/history.test.ts lib/storage/notice.test.ts
```

Expected: FAIL because helpers do not exist.

- [ ] **Step 3: Implement storage keys and settings**

Create `web/lib/storage/keys.ts`:

```ts
export const STORAGE_KEYS = {
  settings: "hz_academic.settings.v1",
  history: "hz_academic.history.v1",
  firstRunNotice: "hz_academic.firstRunNotice.v1",
} as const;
```

Create `web/lib/storage/settings.ts`:

```ts
import { STORAGE_KEYS } from "./keys";

export type HistoryStrategy = "full" | "result-only" | "none";

export type Settings = {
  provider?: string;
  presetId?: string;
  model?: string;
  rememberApiKey?: boolean;
  apiKeySaveConfirmed?: boolean;
  apiKey?: string;
  defaultSeriousness?: string;
  defaultRole?: string;
  historyStrategy?: HistoryStrategy;
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    return raw ? JSON.parse(raw) : { historyStrategy: "full", rememberApiKey: false };
  } catch {
    return { historyStrategy: "full", rememberApiKey: false };
  }
}

export function saveSettings(settings: Settings) {
  const next = { ...loadSettings(), ...settings };
  if (!next.rememberApiKey || !next.apiKeySaveConfirmed) delete next.apiKey;
  try {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(next));
  } catch {
    throw new Error("本地设置保存失败，可能是浏览器隐私模式或存储空间不足。");
  }
}

export function clearApiKey() {
  const next = loadSettings();
  delete next.apiKey;
  next.rememberApiKey = false;
  next.apiKeySaveConfirmed = false;
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(next));
}

export function clearAllLocalData() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}
```

- [ ] **Step 4: Implement full history storage**

Create `web/lib/storage/history.ts`:

```ts
import type { CustomRole, Provider, RewriteRole, Seriousness, Usage } from "@/lib/ai/types";
import type { ParsedRewriteOutput } from "@/lib/output/parseRewriteOutput";
import { STORAGE_KEYS } from "./keys";
import type { HistoryStrategy } from "./settings";

export type HistoryItem = {
  id: string;
  createdAt: string;
  sourceText?: string;
  rawOutput: string;
  parsedOutput: ParsedRewriteOutput;
  provider: Provider;
  presetId?: string;
  model: string;
  seriousness: Seriousness;
  role: RewriteRole;
  customRole?: CustomRole;
  extraInstruction?: string;
  usage?: Usage;
};

export type AddHistoryItemArgs = Omit<HistoryItem, "id" | "createdAt" | "sourceText"> & {
  strategy: HistoryStrategy;
  sourceText: string;
};

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.history);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(items.slice(0, 100)));
  } catch {
    throw new Error("历史记录保存失败，可能是浏览器隐私模式或存储空间不足。");
  }
}

export function addHistoryItem(args: AddHistoryItemArgs) {
  const { strategy, sourceText, ...rest } = args;
  if (strategy === "none") return;
  const item: HistoryItem = {
    ...rest,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...(strategy === "full" ? { sourceText } : {}),
  };
  saveHistory([item, ...loadHistory()]);
}

export function deleteHistoryItem(id: string) {
  saveHistory(loadHistory().filter((item) => item.id !== id));
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEYS.history);
}
```

- [ ] **Step 5: Implement first-run notice helper**

Create `web/lib/storage/notice.ts`:

```ts
import { STORAGE_KEYS } from "./keys";

export function hasSeenHistoryNotice() {
  return localStorage.getItem(STORAGE_KEYS.firstRunNotice) === "true";
}

export function markHistoryNoticeSeen() {
  localStorage.setItem(STORAGE_KEYS.firstRunNotice, "true");
}
```

- [ ] **Step 6: Verify tests**

```powershell
npm --prefix web run test:run -- lib/storage/settings.test.ts lib/storage/history.test.ts lib/storage/notice.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit checkpoint**

```powershell
git add web/lib/storage
git commit -m "feat: add local storage helpers"
```

---

## Task 6: Request guards, errors, and rate limiting

**Files:**
- Create: `web/lib/ai/errors.ts`
- Create: `web/lib/server/requestGuards.ts`
- Create: `web/lib/server/rateLimit.ts`
- Test: `web/lib/server/requestGuards.test.ts`
- Test: `web/lib/server/rateLimit.test.ts`

- [ ] **Step 1: Write guard and limiter tests**

Tests must cover:

- allowed origin passes;
- unknown origin fails;
- production with no configured origin fails closed;
- development allows `http://localhost:3000`;
- `content-length` over 64 KB is rejected before reading body;
- missing `content-length` falls back to read-time validation;
- invalid `content-length` is rejected before reading body;
- sanitizer redacts API Key and source text;
- sanitizer does not return upstream raw detail when sensitive values are present;
- memory limiter blocks after configured limit.

- [ ] **Step 2: Run tests to verify they fail**

```powershell
npm --prefix web run test:run -- lib/server/requestGuards.test.ts lib/server/rateLimit.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement error class**

Create `web/lib/ai/errors.ts`:

```ts
export type RewriteErrorCode =
  | "invalid_api_key"
  | "model_not_found"
  | "invalid_base_url"
  | "quota_exceeded"
  | "rate_limited"
  | "timeout"
  | "content_too_long"
  | "provider_error"
  | "network_error"
  | "unsafe_base_url";

export class RewriteError extends Error {
  constructor(
    public code: RewriteErrorCode,
    message: string,
    public status = 400,
    public detail?: string,
  ) {
    super(message);
  }
}
```

- [ ] **Step 4: Implement request guards**

Create `web/lib/server/requestGuards.ts`:

```ts
import { RewriteError } from "@/lib/ai/errors";

const MAX_BODY_BYTES = 64_000;

export function getAllowedOrigins(env = process.env) {
  const origins = [env.NEXT_PUBLIC_SITE_URL, env.VERCEL_URL ? `https://${env.VERCEL_URL}` : undefined].filter(Boolean) as string[];
  if (env.NODE_ENV !== "production") origins.push("http://localhost:3000");
  return origins;
}

export function validateOrigin(origin: string | null, allowedOrigins: string[]) {
  if (!origin) return false;
  if (allowedOrigins.length === 0) return false;
  return allowedOrigins.includes(origin);
}

export function assertContentLengthAllowed(request: Request) {
  const value = request.headers.get("content-length");
  if (!value) return;
  const size = Number(value);
  if (!Number.isFinite(size) || size > MAX_BODY_BYTES) {
    throw new RewriteError("content_too_long", "请求内容过大，请缩短文本后再试。", 413);
  }
}

export function assertRawBodyAllowed(raw: string) {
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    throw new RewriteError("content_too_long", "请求内容过大，请缩短文本后再试。", 413);
  }
}

export function sanitizeErrorDetail(detail: string, apiKey?: string, sourceText?: string) {
  if (apiKey && detail.includes(apiKey)) return "上游服务返回了包含敏感信息的错误，已隐藏详情。";
  if (sourceText && detail.includes(sourceText)) return "上游服务返回了包含原文片段的错误，已隐藏详情。";

  let sanitized = detail;
  if (apiKey && apiKey.length >= 8) sanitized = sanitized.replaceAll(apiKey.slice(0, 8), "[redacted-api-key-prefix]");
  if (sourceText && sourceText.length >= 20) sanitized = sanitized.replaceAll(sourceText.slice(0, 20), "[redacted-source-text-prefix]");
  return sanitized.slice(0, 500);
}

export function getClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
```

- [ ] **Step 5: Implement best-effort rate limiter**

Create `web/lib/server/rateLimit.ts`:

```ts
type RateLimitOptions = { limit: number; windowMs: number };
type Bucket = { count: number; resetAt: number };

export function createMemoryRateLimiter(options: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();
  return {
    check(key: string) {
      const now = Date.now();
      const bucket = buckets.get(key);
      if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + options.windowMs });
        return { allowed: true };
      }
      bucket.count += 1;
      return { allowed: bucket.count <= options.limit, resetAt: bucket.resetAt };
    },
  };
}

export const rewriteRateLimiter = createMemoryRateLimiter({ limit: 10, windowMs: 60_000 });
```

- [ ] **Step 6: Verify tests**

```powershell
npm --prefix web run test:run -- lib/server/requestGuards.test.ts lib/server/rateLimit.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit checkpoint**

```powershell
git add web/lib/ai/errors.ts web/lib/server
git commit -m "feat: add rewrite request guards"
```

---

## Task 7: Provider adapters and error mapping

**Files:**
- Create: `web/lib/ai/openai.ts`
- Create: `web/lib/ai/anthropic.ts`
- Create: `web/lib/ai/callModel.ts`
- Test: `web/lib/ai/callModel.test.ts`

- [ ] **Step 1: Write adapter tests with mocked fetch**

Tests must cover:

- OpenAI-compatible success payload and usage mapping;
- Anthropic success payload and usage mapping;
- Anthropic missing usage fields does not produce `NaN`;
- 401/403 maps to `invalid_api_key`;
- 404 maps to `model_not_found`;
- 429 maps to `rate_limited`;
- quota-like error text maps to `quota_exceeded` when detectable;
- unknown upstream errors map to `provider_error` with sanitized detail handled by route layer.

- [ ] **Step 2: Run test to verify it fails**

```powershell
npm --prefix web run test:run -- lib/ai/callModel.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement adapters in focused files**

Create `web/lib/ai/openai.ts` for OpenAI-compatible calls, `web/lib/ai/anthropic.ts` for Anthropic calls, and `web/lib/ai/callModel.ts` as dispatcher.

Key requirements:

- use `temperature: 0.7`, `max_tokens: 4000`, `stream: false`;
- accept `AbortSignal`;
- throw `RewriteError` with specific code/status for known errors;
- calculate Anthropic `totalTokens` only when both `input_tokens` and `output_tokens` are numbers.

- [ ] **Step 4: Verify tests**

```powershell
npm --prefix web run test:run -- lib/ai/callModel.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit checkpoint**

```powershell
git add web/lib/ai
git commit -m "feat: add model provider adapters"
```

---

## Task 8: Rewrite handler and API route

**Files:**
- Create: `web/app/api/rewrite/route.ts`
- Create: `web/lib/server/rewriteHandler.ts`
- Test: `web/lib/server/rewriteHandler.test.ts`
- Test: `web/app/api/rewrite/route.test.ts`

- [ ] **Step 1: Write handler and route tests**

Tests must cover:

- missing API Key rejected;
- source text over 8000 chars rejected;
- extra instruction over 500 chars rejected;
- custom `baseUrl` rejected in V1;
- non-allowed Origin rejected;
- production with no allowed origin fails closed;
- `content-length` over 64 KB rejected before parsing;
- rate limit triggers 429;
- `AbortError` maps to `timeout`;
- upstream error detail is sanitized with API Key and source text.

- [ ] **Step 2: Run tests to verify they fail**

```powershell
npm --prefix web run test:run -- lib/server/rewriteHandler.test.ts app/api/rewrite/route.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement payload validation and handler helper**

Create `web/lib/server/rewriteHandler.ts`. Requirements:

- validate required fields;
- enforce source length and extra instruction length;
- reject `baseUrl` for V1 unless future feature flag is added;
- call `resolveProviderTarget`, `buildRewriteMessages`, and `callModel`;
- do not log request body.

- [ ] **Step 4: Implement POST-only route**

Create `web/app/api/rewrite/route.ts`. Requirements:

- export only `POST`;
- call `assertContentLengthAllowed(request)` before `request.text()`;
- call `assertRawBodyAllowed(raw)` after reading;
- validate Origin using `getAllowedOrigins()` and fail closed;
- apply memory rate limiter by IP;
- use AbortController with 60s timeout;
- parse payload before calling handler so catch block can pass `payload.apiKey` and `payload.sourceText` to `sanitizeErrorDetail`;
- map `RewriteError` to its status/code/message;
- map `AbortError` to `timeout` with 408 or 504;
- return Chinese user-facing error messages.

- [ ] **Step 5: Verify tests, lint, build**

```powershell
npm --prefix web run test:run
npm --prefix web run lint
npm --prefix web run build
```

Expected: all pass.

- [ ] **Step 6: Commit checkpoint**

```powershell
git add web/app/api web/lib/server
git commit -m "feat: add rewrite api route"
```

---

## Task 9: Layout and static pages

**Files:**
- Modify: `web/app/layout.tsx`
- Modify: `web/app/page.tsx`
- Create: `web/app/privacy/page.tsx`
- Create: `web/app/examples/page.tsx`
- Create: `web/app/guide/page.tsx`
- Create: `web/components/SiteHeader.tsx`
- Create: `web/components/SiteFooter.tsx`
- Modify: `web/app/globals.css`
- Test: `web/components/SiteHeader.test.tsx`

- [ ] **Step 1: Write header render test**

Test that header renders `Humanizer Academic`, `开始使用`, `历史记录`, `设置`, and `隐私说明`.

- [ ] **Step 2: Run test to verify it fails**

```powershell
npm --prefix web run test:run -- components/SiteHeader.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement header, footer, homepage, privacy, guide, examples**

Required copy:

- Homepage title: `中文学术文本润色与表达校准工具`
- Homepage subtitle: `帮助课程论文、实验报告、毕业设计和答辩稿减少模板感，让表达更自然、清楚、克制。`
- Privacy page: server does not store API Key/source/output; localStorage risk; model provider policy; disclaimer; no guarantee for school/journal/detection systems.
- Guide page V1 short form: API Key 是什么、默认不保存 Key、普通用户优先选平台预设、Base URL 普通用户不用填、失败时检查 Key/余额/模型名/文本长度。
- Examples page may be short V1 examples or clear placeholder; no blank page or 404.

- [ ] **Step 4: Verify static pages**

```powershell
npm --prefix web run test:run -- components/SiteHeader.test.tsx
npm --prefix web run lint
npm --prefix web run build
```

Expected: PASS.

- [ ] **Step 5: Commit checkpoint**

```powershell
git add web/app web/components
git commit -m "feat: add web layout and static pages"
```

---

## Task 10: Rewrite form shell and model settings panel

**Files:**
- Create: `web/components/rewrite/ModelSettingsPanel.tsx`
- Create: `web/components/rewrite/RewriteForm.tsx`
- Modify: `web/app/rewrite/page.tsx`
- Test: `web/components/rewrite/ModelSettingsPanel.test.tsx`
- Test: `web/components/rewrite/RewriteForm.test.tsx`

- [ ] **Step 1: Write component tests**

Tests must cover:

- provider preset selection fills recommended model;
- OpenAI official and Anthropic do not expose editable Base URL;
- custom Base URL control is disabled or marked unavailable in V1;
- if the rewrite page includes a “记住 API Key” control, checking it must show the same risk confirmation flow as settings; otherwise the page should direct users to Settings to save a Key;
- source text required;
- source text over 8000 chars blocks submit;
- extra instruction over 500 chars blocks submit;
- tool page includes inline minimal usage guidance.

- [ ] **Step 2: Run tests to verify they fail**

```powershell
npm --prefix web run test:run -- components/rewrite/ModelSettingsPanel.test.tsx components/rewrite/RewriteForm.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement client components**

Both components must start with `"use client"` because they use state and browser APIs.

Implement:

- source textarea with `aria-label="待处理原文"`;
- API Key field with default not persisted;
- do not persist API Key from the rewrite form unless the shared confirmation flow is used;
- preset selector based on `getProviderPresets()`;
- seriousness and role selectors;
- custom role fields shown only for `自定义`;
- visible inline guidance for non-technical users.

- [ ] **Step 4: Verify tests**

```powershell
npm --prefix web run test:run -- components/rewrite/ModelSettingsPanel.test.tsx components/rewrite/RewriteForm.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit checkpoint**

```powershell
git add web/app/rewrite web/components/rewrite
git commit -m "feat: add rewrite form shell"
```

---

## Task 11: Rewrite submission, output display, and copying

**Files:**
- Create: `web/components/rewrite/OutputPanel.tsx`
- Create: `web/components/rewrite/RewriteTool.tsx`
- Modify: `web/app/rewrite/page.tsx`
- Test: `web/components/rewrite/RewriteTool.test.tsx`
- Test: `web/components/rewrite/OutputPanel.test.tsx`

- [ ] **Step 1: Write behavior tests**

Tests must cover:

- successful `/api/rewrite` response displays parsed rewritten text;
- failed response shows Chinese next-step advice;
- submit button disabled while request is in flight;
- copy full output uses raw output;
- copy rewritten text uses parsed `rewrittenText`;
- if parsing fails, copy rewritten text is disabled or falls back with clear message.

- [ ] **Step 2: Run tests to verify they fail**

```powershell
npm --prefix web run test:run -- components/rewrite/RewriteTool.test.tsx components/rewrite/OutputPanel.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement request flow and output panel**

`RewriteTool.tsx` must be a client component. It should:

- gather form state;
- call `/api/rewrite` with POST;
- never write API Key to localStorage directly;
- use `parseRewriteOutput` for display;
- render output as plain text, not HTML.

- [ ] **Step 4: Verify tests**

```powershell
npm --prefix web run test:run -- components/rewrite/RewriteTool.test.tsx components/rewrite/OutputPanel.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit checkpoint**

```powershell
git add web/components/rewrite web/app/rewrite
git commit -m "feat: add rewrite submission flow"
```

---

## Task 12: History-save notice and rewrite-history integration

**Files:**
- Create: `web/components/rewrite/HistorySaveNotice.tsx`
- Modify: `web/components/rewrite/RewriteTool.tsx`
- Modify: `web/lib/storage/history.ts`
- Test: `web/components/rewrite/HistorySaveNotice.test.tsx`
- Test: `web/components/rewrite/RewriteTool.history.test.tsx`

- [ ] **Step 1: Write tests**

Tests must cover:

- first successful rewrite shows local history risk notice before saving;
- choosing full history saves source text and metadata;
- choosing result-only omits source text but saves output/parameters/model info;
- choosing none saves no history;
- after notice is marked seen, subsequent saves do not show first-run notice again.
- storage failures such as unavailable localStorage or quota exceeded show a user-facing warning instead of losing the rewrite result.

- [ ] **Step 2: Run tests to verify they fail**

```powershell
npm --prefix web run test:run -- components/rewrite/HistorySaveNotice.test.tsx components/rewrite/RewriteTool.history.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement history notice and save integration**

`HistorySaveNotice.tsx` must be a client component. On successful rewrite, `RewriteTool` should:

- parse output;
- if first-run notice unseen and strategy is not `none`, show notice before writing history;
- call `addHistoryItem` with provider, preset, model, seriousness, role, custom role, extra instruction, usage, raw output, parsed output, and source text according to strategy.

- [ ] **Step 4: Verify tests**

```powershell
npm --prefix web run test:run -- components/rewrite/HistorySaveNotice.test.tsx components/rewrite/RewriteTool.history.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit checkpoint**

```powershell
git add web/components/rewrite web/lib/storage
git commit -m "feat: save rewrite history locally"
```

---

## Task 13: Settings page with API Key confirmation

**Files:**
- Create: `web/components/settings/SettingsPanel.tsx`
- Modify: `web/app/settings/page.tsx`
- Test: `web/components/settings/SettingsPanel.test.tsx`

- [ ] **Step 1: Write settings tests**

Tests must cover:

- API Key is not saved by default;
- checking “记住 API Key” displays risk confirmation;
- checked but not confirmed does not save API Key;
- confirmed saves API Key;
- clear API Key removes saved Key and resets flags;
- clear all local data removes settings, history, and notice keys.

- [ ] **Step 2: Run test to verify it fails**

```powershell
npm --prefix web run test:run -- components/settings/SettingsPanel.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement settings UI**

`SettingsPanel.tsx` must be a client component. Include:

- default provider/preset/model;
- remember API Key toggle;
- explicit confirmation checkbox or confirm action before saving Key;
- history strategy selector: full, result-only, none;
- clear API Key;
- clear history;
- clear all local data with confirmation.

- [ ] **Step 4: Verify tests**

```powershell
npm --prefix web run test:run -- components/settings/SettingsPanel.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit checkpoint**

```powershell
git add web/app/settings web/components/settings
git commit -m "feat: add local settings page"
```

---

## Task 14: History page

**Files:**
- Create: `web/components/history/HistoryList.tsx`
- Modify: `web/app/history/page.tsx`
- Test: `web/components/history/HistoryList.test.tsx`

- [ ] **Step 1: Write history page tests**

Tests must cover:

- renders saved items with time, model, seriousness, role;
- full history can show source text;
- result-only history does not show source text;
- copy output works;
- delete one item works;
- clear all history works.

- [ ] **Step 2: Run test to verify it fails**

```powershell
npm --prefix web run test:run -- components/history/HistoryList.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement history page**

`HistoryList.tsx` must be a client component. Keep V1 simple: search, filtering, export JSON, and “restore to editor” are explicitly deferred V1 enhancements. Do not add navigation controls for deferred features unless they are disabled or marked “后续补充”.

- [ ] **Step 4: Verify tests**

```powershell
npm --prefix web run test:run -- components/history/HistoryList.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit checkpoint**

```powershell
git add web/app/history web/components/history
git commit -m "feat: add local history page"
```

---

## Task 15: Security headers and deployment docs

**Files:**
- Modify: `web/next.config.ts`
- Create/Modify: `web/README.md`
- Optional Modify: root `README.md`

- [ ] **Step 1: Add security headers with dev-aware CSP**

In `web/next.config.ts`, configure headers. Production CSP should be strict; development may relax script/connect sources if Next dev HMR needs it.

Required production policies:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy` with at least `default-src 'self'`, `script-src 'self'`, `connect-src 'self' https:`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`

The production CSP must be verified against a production build. If strict `script-src 'self'` blocks Next.js runtime scripts, replace it with a Next-compatible nonce/hash strategy or a documented minimal relaxation; do not ship a CSP that causes blank pages.

- [ ] **Step 2: Document development and deployment**

Create/update `web/README.md` with:

- `npm install`
- `npm run dev`
- `npm run test:run`
- `npm run lint`
- `npm run build`
- Vercel root directory: `web/`
- required env var: `NEXT_PUBLIC_SITE_URL`
- custom Base URL disabled in V1;
- server does not store API Key/source/output;
- in-memory rate limiting is best-effort on Vercel/serverless;
- upgrade path: Upstash Redis, Vercel KV, or Cloudflare Turnstile for stronger public-site abuse control.

- [ ] **Step 3: Final verification**

```powershell
npm --prefix web run test:run
npm --prefix web run lint
npm --prefix web run build
```

Expected: all pass.

- [ ] **Step 4: Production CSP smoke test**

Run:

```powershell
npm --prefix web run build
npm --prefix web run start
```

Open the printed production URL, usually `http://localhost:3000`. Verify the homepage, rewrite page, settings page, and privacy page render without browser console CSP violations. If the console reports CSP violations that break Next.js runtime scripts or data loading, adjust CSP before proceeding.

- [ ] **Step 5: Manual dev smoke test**

Run:

```powershell
npm --prefix web run dev
```

Open the printed local URL, usually `http://localhost:3000`. If port 3000 is occupied, use the URL printed by Next.js. Verify:

- homepage loads;
- rewrite page renders;
- submitting without text shows validation;
- settings page does not save API Key without confirmation;
- history page renders;
- privacy page includes disclaimer;
- no page contains “保证通过 AI 检测”“绕过检测”“规避审查” or similar guarantees.

- [ ] **Step 6: Commit checkpoint**

Only run this commit step if the user explicitly approved commits in this implementation session.

```powershell
git add web README.md .gitignore
git commit -m "docs: document web deployment"
```

---

## Final Acceptance Checklist

- [ ] `npm --prefix web run test:run` passes.
- [ ] `npm --prefix web run lint` passes.
- [ ] `npm --prefix web run build` passes.
- [ ] API Key is not saved by default.
- [ ] API Key is not saved when “remember” is checked but risk confirmation is not accepted.
- [ ] Saved API Key warning appears before persisting.
- [ ] History strategy supports full, result-only, and none.
- [ ] Successful rewrite writes history according to the selected strategy.
- [ ] First history save shows localStorage risk notice.
- [ ] OpenAI and Anthropic use fixed backend endpoints.
- [ ] OpenAI-compatible V1 uses allowlisted presets only.
- [ ] Custom Base URL is disabled in V1 production.
- [ ] `/api/rewrite` exports only POST.
- [ ] `/api/rewrite` enforces content-length precheck, read-time body size check, timeout, origin check, and rate limit.
- [ ] Production origin policy fails closed if no allowed origin is configured.
- [ ] Timeout maps to `timeout`, not `provider_error`.
- [ ] Upstream error details are redacted with API Key and source text before returning to the client.
- [ ] No server code logs API Key, source text, output, or full request body.
- [ ] Output parser supports standard headings and markdown heading variants.
- [ ] Privacy page includes localStorage risks and model provider policy note.
- [ ] localStorage unavailable, invalid JSON, and quota errors are handled with a visible user-facing warning where relevant.
- [ ] Tool page includes inline guidance for non-technical users.
- [ ] Production build/start smoke test shows no CSP violations that break page rendering.
- [ ] Vercel deployment docs specify `web/` as project root and rate-limit upgrade path.
- [ ] All public copy avoids promises about passing AI detection or evading review.
