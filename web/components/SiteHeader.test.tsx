import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteHeader } from "./SiteHeader";

describe("SiteHeader", () => {
  it("renders brand and primary navigation", () => {
    render(<SiteHeader />);

    expect(screen.getByText("Humanizer Academic")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "开始使用" })).toHaveAttribute("href", "/rewrite");
    expect(screen.getByRole("link", { name: "历史记录" })).toHaveAttribute("href", "/history");
    expect(screen.getByRole("link", { name: "设置" })).toHaveAttribute("href", "/settings");
    expect(screen.getByRole("link", { name: "隐私说明" })).toHaveAttribute("href", "/privacy");
  });
});
