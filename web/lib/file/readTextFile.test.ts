import { describe, expect, it, vi } from "vitest";
import { readTextFromFile } from "./readTextFile";

vi.mock("mammoth/mammoth.browser", () => ({
  default: {
    extractRawText: vi.fn().mockResolvedValue({ value: "Word 正文\n" }),
  },
}));

describe("readTextFromFile", () => {
  it("reads txt files as plain text", async () => {
    const file = new File(["第一段\n第二段"], "sample.txt", { type: "text/plain" });

    await expect(readTextFromFile(file)).resolves.toBe("第一段\n第二段");
  });

  it("reads markdown files as plain text", async () => {
    const file = new File(["# 标题\n正文"], "sample.md", { type: "text/markdown" });

    await expect(readTextFromFile(file)).resolves.toBe("# 标题\n正文");
  });

  it("extracts docx files as raw text", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "sample.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    await expect(readTextFromFile(file)).resolves.toBe("Word 正文");
  });

  it("rejects unsupported files", async () => {
    const file = new File(["bad"], "sample.pdf", { type: "application/pdf" });

    await expect(readTextFromFile(file)).rejects.toThrow("仅支持上传 .docx、.md 或 .txt 文件。");
  });
});
