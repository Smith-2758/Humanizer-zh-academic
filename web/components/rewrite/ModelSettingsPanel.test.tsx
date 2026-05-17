import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ModelSettingsPanel } from "./ModelSettingsPanel";

describe("ModelSettingsPanel", () => {
  it("fills the recommended model when a provider preset is selected", () => {
    render(<ModelSettingsPanel />);

    fireEvent.change(screen.getByLabelText("平台预设"), { target: { value: "deepseek" } });

    expect(screen.getByLabelText("模型名")).toHaveValue("deepseek-chat");
  });

  it("does not expose editable Base URL for OpenAI official or Anthropic", () => {
    render(<ModelSettingsPanel />);

    expect(screen.queryByRole("textbox", { name: "Base URL" })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("平台预设"), { target: { value: "anthropic" } });

    expect(screen.queryByRole("textbox", { name: "Base URL" })).not.toBeInTheDocument();
  });

  it("marks custom Base URL as unavailable in V1", () => {
    render(<ModelSettingsPanel />);

    expect(screen.getByText(/自定义 Base URL/)).toHaveTextContent("V1 暂不开放");
  });

  it("syncs displayed preset and model when defaults are loaded by the parent", () => {
    const { rerender } = render(<ModelSettingsPanel presetId="openai" model="gpt-4o-mini" />);

    rerender(<ModelSettingsPanel presetId="deepseek" model="deepseek-chat" />);

    expect(screen.getByLabelText("平台预设")).toHaveValue("deepseek");
    expect(screen.getByLabelText("模型名")).toHaveValue("deepseek-chat");
  });
});
