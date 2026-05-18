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
