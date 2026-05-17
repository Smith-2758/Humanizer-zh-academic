export type ParsedRewriteOutput = {
  parameterConfirmation?: string;
  rewrittenText?: string;
  changeLog?: string;
  rawOutput: string;
};

const HEADINGS = ["参数确认", "重写后的学术文本", "精简修改日志"] as const;

function headingPattern(title: string) {
  return new RegExp(`(^|\\n)\\s*(?:#{1,6}\\s*)?${title}\\s*[:：]?\\s*(?:\\n|$)`, "m");
}

export function parseRewriteOutput(rawOutput: string): ParsedRewriteOutput {
  const matches = HEADINGS.map((title) => {
    const match = headingPattern(title).exec(rawOutput);
    return match ? { title, index: match.index, end: match.index + match[0].length } : null;
  });

  if (matches.some((match) => !match)) return { rawOutput };

  const ordered = matches.filter(Boolean).sort((a, b) => a!.index - b!.index) as Array<{
    title: (typeof HEADINGS)[number];
    index: number;
    end: number;
  }>;

  const sections = new Map<string, string>();
  for (let i = 0; i < ordered.length; i += 1) {
    const current = ordered[i];
    const next = ordered[i + 1];
    sections.set(current.title, rawOutput.slice(current.end, next?.index).trim());
  }

  return {
    parameterConfirmation: sections.get("参数确认"),
    rewrittenText: sections.get("重写后的学术文本"),
    changeLog: sections.get("精简修改日志"),
    rawOutput,
  };
}
