# DeAI Detection Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 调整 `humanizer-zh-academic-student` 的去 AI 规则，使其更好吸收“困惑度 / 突发性”思路，进一步降低文本的模板感、板正度和标准答案结构密度。

**Architecture:** 本轮仅修改规则层与验证层，不增加新功能入口，不改变交互顺序。核心做法是：在 `SKILL.md` 中新增“反低困惑度”和“反低突发性”导向规则，并结合现有 `corpus/` 与 `deai/` 目录中的样本做人工回归验证，确保低 / 中 / 高三档都更自然，但不丢失场景边界。

**Tech Stack:** Markdown skill definition, repository docs, manual sample-based verification

---

### Task 1: 明确本轮规则调优边界

**Files:**
- Modify: `d:\codehub\ai_lab\Humanizer-zh-academic\SKILL.md`
- Reference: `d:\codehub\ai_lab\Humanizer-zh-academic\docs\superpowers\corpus\*.md`
- Reference: `d:\codehub\ai_lab\Humanizer-zh-academic\docs\superpowers\deai\*.md`

- [ ] **Step 1: 在 `SKILL.md` 中补一段总原则说明**

写入以下方向：
- 严肃度不等于低困惑度
- 严肃度不等于整篇高度平滑
- 学术文本可以正式，但不能每句都是“最可能被模型生成出来的表达”

- [ ] **Step 2: 明确本轮不做的事情**

写入或保留以下边界：
- 不强化“学生视角限制”
- 不引导模型故意使用怪词、冷僻词、隐喻
- 不为了通过检测而破坏事实准确性和专业清晰度

- [ ] **Step 3: 根据现有高检出片段整理共性问题**

从现有样本中提炼以下模式，准备映射到规则：
- 结论句过于标准
- 段落结构高度一致
- 因果链过于顺滑
- “事实 -> 解释 -> 总结”反复循环
- 一段内既有结论句又有重复性总结句

### Task 2: 将“困惑度”原则转写为可执行规则

**Files:**
- Modify: `d:\codehub\ai_lab\Humanizer-zh-academic\SKILL.md`

- [ ] **Step 1: 新增“反低困惑度”规则小节**

这一节应明确：
- 目标不是故意怪异，而是降低最高概率表达的密度
- 少用万能总结句、抽象评价句、过于安全的标准书面套话
- 优先保留具体事实，不把事实再翻译成一层抽象意义判断

- [ ] **Step 2: 为“反低困惑度”规则补充高风险表达名单**

至少覆盖以下模式：
- `从结果来看`
- `总体来看`
- `本研究的一个重要结论是`
- `比较明显的表现是`
- `可以看出`
- `这说明`
- `后续可以从几个方面入手`

- [ ] **Step 3: 为“反低困惑度”规则补充替换示例**

在计划中的示例应体现：
- 删去重复性结论句
- 将抽象判断改回具体陈述
- 将“平台化意义拔高”改回“场景内结果说明”

### Task 3: 将“突发性”原则转写为可执行规则

**Files:**
- Modify: `d:\codehub\ai_lab\Humanizer-zh-academic\SKILL.md`

- [ ] **Step 1: 新增“反低突发性”规则小节**

这一节应明确：
- 允许长短句自然交替
- 允许局部不圆整
- 允许某些段落只给结果，不补总结
- 允许某些段落只讲原因，不补意义提升

- [ ] **Step 2: 为“反低突发性”规则补充结构禁忌**

至少覆盖以下模式：
- 每段都“总起 + 解释 + 收束”
- 每段都用总结句开头或结尾
- 每段句长差不多
- 连续多段节奏完全一致

- [ ] **Step 3: 把严肃度模板重新校准到更自然的基线**

具体调整方向：
- `低`：允许更多自然波动，不追求整齐
- `中`：正式但不平滑，作为新的默认自然正式层级
- `高`：克制、凝练，但仍避免成熟论文腔和标准答案结构

### Task 4: 更新自检与验证标准

**Files:**
- Modify: `d:\codehub\ai_lab\Humanizer-zh-academic\SKILL.md`
- Modify: `d:\codehub\ai_lab\Humanizer-zh-academic\docs\superpowers\deai\README.md`

- [ ] **Step 1: 在 `SKILL.md` 的自检清单中加入检测导向检查项**

至少补充以下问题：
- 是否重复使用标准化结论句
- 是否每段都过于完整
- 是否句长分布太均匀
- 是否读起来像修整过的标准答案

- [ ] **Step 2: 在 `deai/README.md` 中补充回归验证方法**

加入一段说明：
- 优先用已有 `corpus` 和 `deai` 样本做低 / 中 / 高对照
- 记录不同检测平台的判断结果
- 优先观察共性问题，而不是单平台分数波动

- [ ] **Step 3: 为人工回归建立最小检查表**

检查表应包含：
- 结构是否过匀
- 句长是否过匀
- 结论句是否过密
- 事实陈述是否被重复翻译成意义判断
- 低严肃度是否明显更自然

### Task 5: 用现有样本做人工回归验证

**Files:**
- Verify: `d:\codehub\ai_lab\Humanizer-zh-academic\docs\superpowers\corpus\S1-计算机-本科二年级-课程论文作者.md`
- Verify: `d:\codehub\ai_lab\Humanizer-zh-academic\docs\superpowers\corpus\S2-机械工程-本科毕业阶段-毕业设计作者.md`
- Verify: `d:\codehub\ai_lab\Humanizer-zh-academic\docs\superpowers\corpus\S3-机器人工程-本科三年级-实验报告作者.md`
- Verify: `d:\codehub\ai_lab\Humanizer-zh-academic\docs\superpowers\corpus\S4-管理学-硕士一年级-答辩陈述稿作者.md`
- Verify: `d:\codehub\ai_lab\Humanizer-zh-academic\docs\superpowers\corpus\S5-新闻传播学-硕士二年级-自定义角色.md`
- Verify: `d:\codehub\ai_lab\Humanizer-zh-academic\docs\superpowers\deai\*.md`

- [ ] **Step 1: 选取用户已指出的高检出片段做回归重点**

优先复核以下类型：
- 实验结果分析段
- 管理学研究结论段
- 项目总结中的多结论段
- 毕业设计中的功能测试与总结段

- [ ] **Step 2: 人工比较低 / 中 / 高三档是否真正拉开**

检查是否满足：
- `低` 显著更自然
- `中` 正式但不过度平滑
- `高` 克制但不过度成熟

- [ ] **Step 3: 记录残余高风险模式**

把人工验证后仍明显存在的问题补成后续清单，例如：
- 某些角色仍偏板正
- 某些段落仍有强模板感
- 某些总结句仍过于频繁

### Task 6: 交付与版本管理

**Files:**
- Modify: `d:\codehub\ai_lab\Humanizer-zh-academic\SKILL.md`
- Modify: `d:\codehub\ai_lab\Humanizer-zh-academic\docs\superpowers\deai\README.md`

- [ ] **Step 1: 运行最终检查**

Run: `git -C d:\codehub\ai_lab\Humanizer-zh-academic diff -- SKILL.md docs\\superpowers\\deai\\README.md`
Expected: only intended rule and verification documentation changes appear

- [ ] **Step 2: 确认工作区状态**

Run: `git -C d:\codehub\ai_lab\Humanizer-zh-academic status --short`
Expected: only intended files are modified

- [ ] **Step 3: 提交本轮调优**

Run: `git -C d:\codehub\ai_lab\Humanizer-zh-academic commit -m "tune: align deai rules with detection heuristics"`
Expected: one commit containing only this round’s rule and verification changes
