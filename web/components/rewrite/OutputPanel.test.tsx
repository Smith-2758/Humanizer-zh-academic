import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OutputPanel } from "./OutputPanel";

const standardOutput = `参数确认
严肃度：中

重写后的学术文本
这是改写后的文本。

精简修改日志
- 删除空泛表达。`;

describe("OutputPanel", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("displays parsed rewritten text", () => {
    render(<OutputPanel rawOutput={standardOutput} />);

    expect(screen.getByText("这是改写后的文本。")).toBeInTheDocument();
    expect(screen.getByText("- 删除空泛表达。")).toBeInTheDocument();
  });

  it("copies full output and rewritten text", () => {
    render(<OutputPanel rawOutput={standardOutput} />);

    fireEvent.click(screen.getByRole("button", { name: "复制全文" }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(standardOutput);

    fireEvent.click(screen.getByRole("button", { name: "只复制重写文本" }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("这是改写后的文本。");
  });

  it("disables rewritten-text copy when output cannot be parsed", () => {
    render(<OutputPanel rawOutput="模型没有按标准标题输出。" />);

    expect(screen.getByText(/未识别到标准输出结构/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "只复制重写文本" })).toBeDisabled();
  });

  it("offers save and clear actions", () => {
    const onSave = vi.fn();
    const onClear = vi.fn();
    render(<OutputPanel rawOutput={standardOutput} onSave={onSave} onClear={onClear} />);

    fireEvent.click(screen.getByRole("button", { name: "保存到历史" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ rewrittenText: "这是改写后的文本。" }));

    fireEvent.click(screen.getByRole("button", { name: "清空结果" }));
    expect(onClear).toHaveBeenCalled();
  });
});
