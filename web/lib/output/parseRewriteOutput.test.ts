import { describe, expect, it } from "vitest";
import { parseRewriteOutput } from "./parseRewriteOutput";

describe("parseRewriteOutput", () => {
  it("parses plain headings", () => {
    const rawOutput = `参数确认
严肃度：中

重写后的学术文本
这是改写后文本。

精简修改日志
- 删除空泛表达。`;

    expect(parseRewriteOutput(rawOutput)).toEqual({
      parameterConfirmation: "严肃度：中",
      rewrittenText: "这是改写后文本。",
      changeLog: "- 删除空泛表达。",
      rawOutput,
    });
  });

  it("parses markdown headings with colons", () => {
    const rawOutput = `## 参数确认：
角色：实验报告作者

### 重写后的学术文本:
实验结果较为稳定。

## 精简修改日志：
压缩了修饰词。`;

    const result = parseRewriteOutput(rawOutput);

    expect(result.parameterConfirmation).toBe("角色：实验报告作者");
    expect(result.rewrittenText).toBe("实验结果较为稳定。");
    expect(result.changeLog).toBe("压缩了修饰词。");
  });

  it("falls back to raw output when headings are incomplete", () => {
    const rawOutput = "只有一段模型输出，没有标准标题。";

    expect(parseRewriteOutput(rawOutput)).toEqual({ rawOutput });
  });
});
