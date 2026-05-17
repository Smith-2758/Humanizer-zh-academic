import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RewriteForm } from "./RewriteForm";

describe("RewriteForm", () => {
  it("requires source text before submit", () => {
    const onSubmit = vi.fn();
    render(<RewriteForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "开始改写" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("请先粘贴需要处理的原文。")).toBeInTheDocument();
  });

  it("blocks source text over 8000 characters", () => {
    const onSubmit = vi.fn();
    render(<RewriteForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("待处理原文"), { target: { value: "中".repeat(8_001) } });
    fireEvent.click(screen.getByRole("button", { name: "开始改写" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("原文最多 8000 字，请缩短后再提交。")).toBeInTheDocument();
  });

  it("blocks extra instruction over 500 characters", () => {
    const onSubmit = vi.fn();
    render(<RewriteForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("待处理原文"), { target: { value: "这是原文。" } });
    fireEvent.change(screen.getByLabelText("高级要求"), { target: { value: "补".repeat(501) } });
    fireEvent.click(screen.getByRole("button", { name: "开始改写" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("高级要求最多 500 字，请缩短后再提交。")).toBeInTheDocument();
  });

  it("shows minimal usage guidance and directs saved API Key users to settings", () => {
    render(<RewriteForm onSubmit={vi.fn()} />);

    expect(screen.getByText(/粘贴原文/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "设置页" })).toHaveAttribute("href", "/settings");
    expect(screen.queryByLabelText("记住 API Key")).not.toBeInTheDocument();
  });

  it("submits controlled custom role fields", () => {
    const onSubmit = vi.fn();
    render(<RewriteForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("待处理原文"), { target: { value: "这是原文。" } });
    fireEvent.change(screen.getByLabelText("角色"), { target: { value: "自定义" } });
    fireEvent.change(screen.getByLabelText("学科背景"), { target: { value: "新闻传播学" } });
    fireEvent.change(screen.getByLabelText("求学阶段或经验"), { target: { value: "硕士二年级" } });
    fireEvent.change(screen.getByLabelText("文本用途"), { target: { value: "课程展示报告" } });
    fireEvent.click(screen.getByRole("button", { name: "开始改写" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "自定义",
        customRole: {
          discipline: "新闻传播学",
          stage: "硕士二年级",
          purpose: "课程展示报告",
        },
      }),
    );
  });

  it("requires all custom role fields when role is custom", () => {
    const onSubmit = vi.fn();
    render(<RewriteForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("待处理原文"), { target: { value: "这是原文。" } });
    fireEvent.change(screen.getByLabelText("角色"), { target: { value: "自定义" } });
    fireEvent.click(screen.getByRole("button", { name: "开始改写" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("请补充自定义角色的学科背景、求学阶段或经验、文本用途。" )).toBeInTheDocument();
  });
});
