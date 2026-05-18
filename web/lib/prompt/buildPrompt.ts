import type { CustomRole, RewriteRole, Seriousness } from "@/lib/ai/types";
import { SYSTEM_PROMPT } from "./systemPrompt";

type BuildPromptArgs = {
  sourceText: string;
  seriousness: Seriousness;
  role: RewriteRole;
  customRole?: CustomRole;
  extraInstruction?: string;
};

export function buildRewriteMessages(args: BuildPromptArgs) {
  const customRoleText =
    args.role === "自定义" && args.customRole
      ? `\n自定义角色信息：\n- 学科背景：${args.customRole.discipline}\n- 求学阶段或经验：${args.customRole.stage}\n- 文本用途：${args.customRole.purpose}`
      : "";

  const extra = args.extraInstruction?.trim() ? `\n高级要求：${args.extraInstruction.trim()}` : "";

  return {
    system: SYSTEM_PROMPT,
    user: `请按以下参数处理文本：

严肃度：${args.seriousness}
角色：${args.role}${customRoleText}${extra}

输出必须严格包含以下三个标题：
参数确认
重写后的学术文本
精简修改日志

原文：
${args.sourceText}`,
  };
}
