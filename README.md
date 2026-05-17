# Humanizer-zh-academic-student

> 旧版静态提示词版本已归档到分支 `legacy/main-v1-static-skill`。当前 `main` 为交互式 skill 版本，会先确认严肃度与角色，再执行去 AI 改写。

> **声明与鸣谢：**
> - 本项目的主要创意、基础架构和规则类别深度借鉴自 [op7418/Humanizer-zh](https://github.com/op7418/Humanizer-zh.git)。
> - 本项目在其基础上，进一步面向中国大学生和研究生的真实学术写作场景做了定向重构。
> - 原参考项目亦受益于 [blader/humanizer](https://github.com/blader/humanizer) 和维基百科的 [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)。

## 1. 项目简介

`Humanizer-zh-academic-student` 是一个面向学生学术写作场景的中文 skill，用于清理 AI 生成文本中的模板感、卖弄感和机械句法痕迹。

它不是单纯把文字改得更“像论文”，而是把文本压回更真实的学生写作状态：朴实、严谨、自然，不空泛，不装腔，也不过度口语化。

当前版本已经从静态提示词升级为轻交互式 skill：

1. 用户默认先提供待处理原文。
2. Agent 会自动确认 `语气严肃度`。
3. Agent 会自动确认 `角色`。
4. 参数齐全后，再按对应规则执行改写。

## 网站版 V1

本仓库新增了 `web/` 子项目，用于提供可部署到 Vercel 的网页版本。网站版定位为中文学术文本润色与表达校准工具，用户自带模型 API Key，站点本身不提供模型额度。

网站版文档见：`web/README.md`。

本地开发常用命令：

```powershell
npm --prefix web install
npm --prefix web run dev
```

交付前验证命令：

```powershell
npm --prefix web run test:run
npm --prefix web run lint
npm --prefix web run build
```

## 2. 当前能力

本版本重点提供以下能力：

1. 自动补问缺失参数，只在必要时询问 `低 / 中 / 高` 严肃度和写作角色。
2. 支持四类预设角色：`课程论文作者`、`毕业设计作者`、`实验报告作者`、`答辩陈述稿作者`。
3. 支持受控自定义角色，只补问 `学科背景`、`求学阶段或经验`、`文本用途` 三项信息。
4. 针对学术卖弄、机械句法、空洞总结和高危排版做强规则清洗。
5. 增加了面向 AI 检测逻辑的规则，重点压低模板化结论句、过匀句式和标准答案结构。

## 3. 使用流程

最常见的使用方式，是直接贴原文：

```text
请帮我处理下面这段实验报告正文：

[粘贴原文]
```

如果用户没有提前说明参数，agent 会自动补问：

```text
语气严肃度选低、中还是高？
```

然后继续确认角色：

```text
角色选课程论文作者、毕业设计作者、实验报告作者、答辩陈述稿作者，还是自定义？
```

如果用户已经提前说清楚参数，skill 会直接进入改写，例如：

```text
请使用 humanizer-zh-academic-student，把下面这段文字按高严肃度、毕业设计作者的写法处理：

[粘贴原文]
```

## 4. 安装与配置

这个仓库本身就是一个单 skill 仓库。实际使用时，核心文件是根目录下的 `SKILL.md`。

### Claude Code

1. 在本地创建目录：`~/.claude/skills/humanizer-zh-academic-student/`
2. 将本仓库里的 `SKILL.md` 放入该目录。
3. 可选保留 `README.md` 作为说明文件，但真正会被加载的是 `SKILL.md`。
4. 重启 Claude Code。
5. 在对话里直接说明任务，或显式提到 skill 名称即可。

Windows 常见路径示例：

```text
C:\Users\<你的用户名>\.claude\skills\humanizer-zh-academic-student\SKILL.md
```

调用示例：

```text
请使用 humanizer-zh-academic-student 帮我处理下面这段课程论文正文。
```

### Codex

1. 在本地创建目录：`~/.codex/skills/humanizer-zh-academic-student/`
2. 将本仓库里的 `SKILL.md` 放入该目录。
3. 重启 Codex，让它重新发现本地 skills。
4. 在对话里直接描述任务，或显式提到 skill 名称。

Windows 常见路径示例：

```text
C:\Users\<你的用户名>\.codex\skills\humanizer-zh-academic-student\SKILL.md
```

调用示例：

```text
请使用 humanizer-zh-academic-student，先确认参数，再帮我把下面这段实验报告去 AI 味。
```

### 不支持本地 skills 的平台

如果你使用的平台不支持本地 skill 目录，也可以直接把 `SKILL.md` 作为 system prompt 或自定义指令使用。

## 5. 参数说明

### 严肃度

当前支持三档严肃度：

1. `低`：更自然，保留适度学生写作痕迹，重点降低模板感和标准答案感。
2. `中`：清楚、自然、略正式，适合大多数课程论文和普通实验报告。
3. `高`：更正式、更克制、更凝练，适合毕业设计、正式提交稿和摘要总结。

### 预设角色

当前支持四类预设角色：

1. `课程论文作者`
2. `毕业设计作者`
3. `实验报告作者`
4. `答辩陈述稿作者`

### 自定义角色

当用户选择 `自定义` 时，skill 只会补问以下三项信息：

1. 学科背景
2. 求学阶段或经验
3. 文本用途

这样做是为了把角色限定在真实学术写作场景里，避免输出风格无限发散。

## 6. 输出与适用范围

默认输出包含三部分：

1. 参数确认
2. 重写后的学术文本
3. 精简修改日志

当前最适合处理的文本类型包括：

1. 课程论文正文
2. 毕业设计说明文字
3. 实验报告
4. 大作业总结
5. 答辩陈述稿

不建议用于：

1. 营销文案
2. 情绪化演讲稿
3. 社交媒体短内容
4. 与学术场景无关的人设化写作

## 7. 仓库结构

当前主线版本只保留实际使用所需的核心文件：

```text
humanizer-zh-academic/
├── SKILL.md
├── README.md
└── LICENSE
```

## 8. 参考与许可

参考资源：

- [op7418/Humanizer-zh](https://github.com/op7418/Humanizer-zh.git)
- [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
- [hardikpandya/stop-slop](https://github.com/hardikpandya/stop-slop)

许可说明：

本项目遵循原参考项目的开源协议许可。它的目标是帮助学生把文本改得更真诚、更贴近真实写作场景，而不是鼓励脱离学习过程的机械绕检行为。
