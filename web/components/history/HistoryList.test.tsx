import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { saveHistory } from "@/lib/storage/history";
import { HistoryList } from "./HistoryList";

const item = {
  id: "history-1",
  createdAt: "2026-05-17T08:00:00.000Z",
  sourceText: "原文内容",
  rawOutput: "参数确认\n严肃度：高\n\n重写后的学术文本\n改写结果\n\n精简修改日志\n日志",
  parsedOutput: {
    parameterConfirmation: "严肃度：高",
    rewrittenText: "改写结果",
    changeLog: "日志",
    rawOutput: "raw",
  },
  provider: "openai" as const,
  presetId: "openai",
  model: "gpt-4o-mini",
  seriousness: "高" as const,
  role: "毕业设计作者" as const,
};

describe("HistoryList", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders local history with search, filters, and JSON export", () => {
    saveHistory([item]);

    render(<HistoryList />);

    expect(screen.getByText("改写结果")).toBeInTheDocument();
    expect(screen.getAllByText(/毕业设计作者/).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText("搜索历史"), { target: { value: "不存在" } });
    expect(screen.getByText("没有匹配的历史记录。")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("搜索历史"), { target: { value: "改写" } });
    expect(screen.getByText("改写结果")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("按严肃度筛选"), { target: { value: "低" } });
    expect(screen.getByText("没有匹配的历史记录。")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("按严肃度筛选"), { target: { value: "高" } });
    expect(screen.getByRole("button", { name: "导出 JSON" })).toBeInTheDocument();
  });

  it("deletes one item and clears all history", () => {
    saveHistory([item]);
    render(<HistoryList />);

    fireEvent.click(screen.getByRole("button", { name: "删除" }));
    expect(screen.getByText("暂无历史记录。" )).toBeInTheDocument();

    saveHistory([item]);
    fireEvent.click(screen.getByRole("button", { name: "刷新" }));
    fireEvent.click(screen.getByRole("button", { name: "清空全部" }));
    expect(screen.getByText("暂无历史记录。" )).toBeInTheDocument();
  });
});
