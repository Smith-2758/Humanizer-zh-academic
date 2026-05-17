import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadHistory } from "@/lib/storage/history";
import { markHistoryNoticeSeen } from "@/lib/storage/notice";
import { saveSettings } from "@/lib/storage/settings";
import { RewriteTool } from "./RewriteTool";

const standardOutput = `参数确认
严肃度：中

重写后的学术文本
这是改写后的文本。

精简修改日志
- 删除空泛表达。`;

describe("RewriteTool", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("displays parsed rewritten text after a successful rewrite", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true, output: standardOutput, provider: "openai", model: "gpt-4o-mini" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    render(<RewriteTool />);

    fireEvent.change(screen.getByLabelText("待处理原文"), { target: { value: "这是原文。" } });
    fireEvent.click(screen.getByRole("button", { name: "开始改写" }));

    expect(await screen.findByText("这是改写后的文本。")).toBeInTheDocument();
  });

  it("shows Chinese next-step advice when rewrite fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: false, message: "API Key 无效。" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    render(<RewriteTool />);

    fireEvent.change(screen.getByLabelText("待处理原文"), { target: { value: "这是原文。" } });
    fireEvent.click(screen.getByRole("button", { name: "开始改写" }));

    expect(await screen.findByText(/请检查 API Key、余额、模型名或文本长度/)).toBeInTheDocument();
  });

  it("shows the first-run history notice and saves successful output to local history", async () => {
    saveSettings({ historyStrategy: "full" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true, output: standardOutput, provider: "openai", model: "gpt-4o-mini" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    render(<RewriteTool />);

    fireEvent.change(screen.getByLabelText("待处理原文"), { target: { value: "这是原文。" } });
    fireEvent.click(screen.getByRole("button", { name: "开始改写" }));
    expect(await screen.findByText(/本工具默认会把原文、改写结果和参数保存在当前浏览器本地/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "保存完整历史" }));

    const [item] = loadHistory();
    expect(item.sourceText).toBe("这是原文。");
    expect(item.parsedOutput.rewrittenText).toBe("这是改写后的文本。");
  });

  it("automatically saves later rewrites after the history notice has been acknowledged", async () => {
    saveSettings({ historyStrategy: "result-only" });
    markHistoryNoticeSeen();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true, output: standardOutput, provider: "openai", model: "gpt-4o-mini" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    render(<RewriteTool />);

    fireEvent.change(screen.getByLabelText("待处理原文"), { target: { value: "这是原文。" } });
    fireEvent.click(screen.getByRole("button", { name: "开始改写" }));

    expect(await screen.findByText("这是改写后的文本。")).toBeInTheDocument();
    const [item] = loadHistory();
    expect(item.sourceText).toBeUndefined();
    expect(item.parsedOutput.rewrittenText).toBe("这是改写后的文本。");
    expect(screen.getByText("已自动保存到本地历史记录。" )).toBeInTheDocument();
  });

  it("disables the submit button while request is in flight", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));

    render(<RewriteTool />);

    fireEvent.change(screen.getByLabelText("待处理原文"), { target: { value: "这是原文。" } });
    fireEvent.click(screen.getByRole("button", { name: "开始改写" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "正在改写..." })).toBeDisabled());
  });
});
