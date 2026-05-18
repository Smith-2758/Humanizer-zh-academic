import mammoth from "mammoth/mammoth.browser";

const SUPPORTED_EXTENSIONS = [".docx", ".md", ".txt"] as const;

function getExtension(fileName: string) {
  const normalized = fileName.toLowerCase();
  return SUPPORTED_EXTENSIONS.find((extension) => normalized.endsWith(extension));
}

export async function readTextFromFile(file: File) {
  const extension = getExtension(file.name);

  if (!extension) {
    throw new Error("仅支持上传 .docx、.md 或 .txt 文件。");
  }

  if (extension === ".docx") {
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value.trim();
  }

  return file.text();
}
