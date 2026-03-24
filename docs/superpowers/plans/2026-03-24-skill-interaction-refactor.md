# Skill Interaction Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构 `humanizer-zh-academic-student` 的交互规则，使其在改写前自动采集严肃度与角色，并按受控模板执行改写。

**Architecture:** 保持仓库仍是轻量 skill 项目，只重构 `SKILL.md` 的执行顺序与规则组织，同时更新 `README.md` 说明新的交互方式。实现以“参数采集层 + 改写执行层”为主线，不引入额外运行时工具。

**Tech Stack:** Markdown skill definition, repository docs

---

### Task 1: 重构 Skill 运行结构

**Files:**
- Modify: `d:\codehub\ai_lab\Humanizer-zh-academic\SKILL.md`

- [ ] **Step 1: 依据 spec 重新组织 skill 顶层结构**

将文档改为“定位 -> 前置规则 -> 参数采集 -> 严肃度模板 -> 角色模板 -> 自定义角色 -> 通用改写规则 -> 输出格式 -> 边界”的顺序。

- [ ] **Step 2: 写入参数采集逻辑**

加入以下运行规则：
- 默认用户已提供待处理文本
- 缺少严肃度时先问严肃度
- 缺少角色时再问角色
- 自定义角色时只补问一次学科背景、求学阶段或经验、文本用途
- 用户已明确给出要求时不重复追问

- [ ] **Step 3: 写入严肃度与角色映射**

补充三档严肃度和四类预设角色的写法差异，并说明二者对改写行为的影响维度。

- [ ] **Step 4: 保留并整合现有去 AI 核心规则**

保留现有的去卖弄、去机械句法、去空洞套话、去高危排版规则，并按新的执行顺序整理到统一章节中。

### Task 2: 更新用户文档

**Files:**
- Modify: `d:\codehub\ai_lab\Humanizer-zh-academic\README.md`

- [ ] **Step 1: 更新项目简介**

补充本 skill 现在支持交互式采集严肃度与角色，而不再只是静态改写提示词。

- [ ] **Step 2: 更新使用方法与示例**

新增示例，说明用户贴文本后，agent 会先补问严肃度和角色，再输出结果。

- [ ] **Step 3: 补充可用参数说明**

列出三档严肃度、四种预设角色，以及自定义角色的受控补问方式。

### Task 3: 手动验证

**Files:**
- Verify: `d:\codehub\ai_lab\Humanizer-zh-academic\SKILL.md`
- Verify: `d:\codehub\ai_lab\Humanizer-zh-academic\README.md`

- [ ] **Step 1: 通读 skill 场景流程**

手动检查以下场景的说明是否完整：
- 用户只贴文本
- 用户已给严肃度
- 用户已给角色
- 用户选择自定义角色
- 用户未贴文本

- [ ] **Step 2: 检查文档一致性**

确认 `README.md` 与 `SKILL.md` 中的严肃度、角色名称、输出格式保持一致。

- [ ] **Step 3: 检查 git 状态**

Run: `git -C d:\codehub\ai_lab\Humanizer-zh-academic status --short`
Expected: only intended documentation changes appear
