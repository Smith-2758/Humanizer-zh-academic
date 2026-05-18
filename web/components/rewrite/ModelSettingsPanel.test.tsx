import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ModelSettingsPanel } from "./ModelSettingsPanel";

describe("ModelSettingsPanel", () => {
  it("fills the recommended model when a provider preset is selected", () => {
    render(<ModelSettingsPanel />);

    fireEvent.change(screen.getByLabelText("平台预设"), { target: { value: "deepseek" } });

    expect(screen.getByLabelText("模型名")).toHaveValue("deepseek-chat");
  });

  it("keeps Base URL hidden while official presets are selected", () => {
    render(<ModelSettingsPanel />);

    expect(screen.queryByRole("textbox", { name: "Base URL" })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("平台预设"), { target: { value: "anthropic" } });

    expect(screen.queryByRole("textbox", { name: "Base URL" })).not.toBeInTheDocument();
  });

  it("shows custom Base URL input when custom interface is selected", () => {
    const onInterfaceModeChange = vi.fn();
    const onBaseUrlChange = vi.fn();
    const { rerender } = render(
      <ModelSettingsPanel
        interfaceMode="official"
        baseUrl=""
        onInterfaceModeChange={onInterfaceModeChange}
        onBaseUrlChange={onBaseUrlChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "自定义接口" }));

    expect(onInterfaceModeChange).toHaveBeenCalledWith("custom");

    rerender(
      <ModelSettingsPanel
        interfaceMode="custom"
        baseUrl="https://gateway.example.com/v1"
        onInterfaceModeChange={onInterfaceModeChange}
        onBaseUrlChange={onBaseUrlChange}
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Base URL" }), {
      target: { value: "https://api.example.com/v1" },
    });

    expect(onBaseUrlChange).toHaveBeenCalledWith("https://api.example.com/v1");
  });

  it("syncs displayed preset and model when defaults are loaded by the parent", () => {
    const { rerender } = render(<ModelSettingsPanel presetId="openai" model="gpt-4o-mini" />);

    rerender(<ModelSettingsPanel presetId="deepseek" model="deepseek-chat" />);

    expect(screen.getByLabelText("平台预设")).toHaveValue("deepseek");
    expect(screen.getByLabelText("模型名")).toHaveValue("deepseek-chat");
  });
});
