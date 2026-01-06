---
title: claude-code usage
date: 2026-01-06 12:49:37
tags:
---

## claude code 基础结构

### 被很多人忽略的：Claude Code 的“全流程助手”能力

很多人第一次用 Claude Code，会把它当成“更聪明的代码生成器”。但从官方的能力图来看，它更像是一个贯穿项目全生命周期的搭档：**从摸清现状 → 方案设计 → 质量保障 → 部署发布 → 线上维护**，每一步都能帮你把“隐性工作”显性化。

![](/images/cc-1.png)

#### 1) Discover：先搞懂再动手（最省时间）
- **Explore codebase and history**：快速梳理代码结构、关键数据流、历史变更动机（为什么当初这么写）。
- **Search documentation**：把 README/约定/注释里的规则提炼成清单，避免“我以为可以”的踩坑。
- **Onboard & Setup**：把从零跑起来写成可复制步骤（依赖/环境变量/权限/常见报错）。

#### 2) Design：把“想法”写成可评审的方案
- **Plan project**：把目标拆成里程碑、任务与验收标准（Definition of Done）。
- **Develop tech specs**：输出可讨论的技术规格：接口、数据结构、迁移与回滚、风险点。
- **Define architecture**：明确模块边界与依赖关系，提前识别耦合与扩展点。

#### 3) Build：别只让它写功能，要让它补齐质量
- **Write and execute tests**：补单测/集成测试、边界条件、回归用例，让修改“可证伪、可验证”。
- **Create commits and PRs**：把变更拆成清晰的 commit/PR，写明影响面、验证步骤与截图/日志。

#### 4) Deploy：发布是一套流程，不是一次 push
- **Automate CI/CD**：把 lint/test/build/deploy 自动化，减少“本地能跑线上炸”的概率。
- **Configure environments**：整理不同环境（dev/staging/prod）的配置与密钥，降低不可复现问题。
- **Manage deployments**：做发布清单、灰度/回滚策略与发布后核验。

#### 5) Support & Scale：线上问题与长期演进
- **Debug errors**：基于日志/堆栈/指标快速定位原因并给出验证路径。
- **Large-scale refactor**：做大规模迁移与重构时，分阶段推进并保持可运行、可回滚。
- **Monitor usage & performance**：补可观测性（指标/日志/Tracing），把“慢/贵/不稳定”变成可优化的数据。

> 一句话总结：Claude Code 的价值常常不在“写得快”，而在于把那些容易被忽略的环节（理解、对齐、测试、部署、排错、观测）做得更系统，让整个交付链路更稳。

### Claude Code 的内部设计：一个“会用工具的助手”是怎么工作的？

很多人把 Claude Code 理解成“能在终端里写代码的聊天机器人”，但从架构上看，它更像一个**Agent（智能体）系统**：模型负责推理与决策，工具负责执行可验证的动作，两者通过一个固定循环协作。

![](/images/cc-2.png)

#### 图 1 解读：三步循环（Gather context → Plan → Action）+ 迭代
在 Claude Code 的工作流里，每次解决问题基本都会走一个循环：

- **Gather context（收集上下文）**  
  先把“要做什么”弄清楚：读取项目文件、检查目录结构、查看报错日志、理解现有实现与约束。  
  这一步的意义是：让后续决策**基于事实**而不是凭空猜。

- **Formulate a plan（制定计划）**  
  把目标拆成可执行步骤：要改哪些文件、先做什么再做什么、有哪些风险点、如何验证成功。  
  这一步的意义是：把复杂任务变成**可控的多步流程**（也方便你 review）。

- **Take an action（采取行动）**  
  通过工具执行“确定性的操作”：跑命令、搜索代码、修改文件、发起提交等。  
  执行后再回到 Gather context，读取新的输出/结果，**不断迭代**直到完成。

此外，图里还有两个关键部件：

- **Memory（记忆）**：保存长期偏好与项目约定（例如代码风格、分支策略、你常用的命令），减少重复沟通成本（通过 CLAUDE.md 实现)。  
- **Tools（工具）**：把“能想”与“能做”分开；模型做决策，工具做执行，让结果更可复现、更易验证。

![](/images/cc-3.png)

#### 图 2 解读：Claude Code 的“工具箱”意味着什么？
工具列表可以理解为 Claude Code 的“可调用能力接口”，典型分两类：

- **读/查类（让结论有依据）**：例如列目录、读文件、grep 搜索、按模式找文件。  
  用途：快速定位入口、追踪调用链、找配置/脚本、确认事实。

- **执行/改动类（让动作可验证）**：例如运行 shell 命令、编辑文件、批量编辑、创建提交/PR。  
  用途：把计划落地，并通过日志/diff/测试结果验证“确实改对了”。

你会注意到列表里还有两个容易被忽略但很重要的能力：
- **Task（子任务/子代理）**：把复杂问题拆给“子代理”并行处理（比如一边读代码一边写测试计划）。  
- **TodoWrite（结构化任务清单）**：把要做的事写成 checklist，适合长链路任务（排错/重构/发布）避免遗漏。


#### Claude Code 的“记忆”怎么落地：用 `CLAUDE.md` 把项目规则写给它

Claude Code 的 **Memory** 本质不是“玄学记忆”，而是**把你希望它遵循的规则/上下文写成文件**，让它在每次工作前都能读到同一份“项目说明书”。官方推荐的做法是用 `CLAUDE.md` 系列文件来承载这些信息（下图）。

![](/images/cc-4.png)

结合图里的三种常见位置，可以这样理解：

- **`./CLAUDE.md`（项目级、共享）**
  - **用途**：写“团队共识”和“仓库约定”（代码风格、目录结构、分支策略、测试/运行方式、PR 规范等）
  - **建议**：**提交到 Git**，让所有协作者与 Claude Code 得到同样的规则
  - **典型内容**：如何启动项目、如何跑测试、哪些目录不要动、提交信息格式、接口变更需要同步哪些文档

- **`./CLAUDE.local.md`（项目级、个人不共享）**
  - **用途**：写个人偏好或本机差异（本地端口、个人工具链、调试习惯、仅你需要的快捷命令）
  - **建议**：**不要提交到 Git**（通常加到 `.gitignore`），避免把个人配置“污染”团队规则

- **`~/.claude/CLAUDE.md`（全局级、对所有项目生效）**
  - **用途**：写你希望 Claude Code 在所有仓库都遵循的通用规则（输出风格、默认语言、偏好的工程习惯）
  - **建议**：把它当成“你的默认工作方式”，例如：先解释计划再改代码、改动前先搜索、任何修改都给出验证步骤

##### 一个可直接复用的 `CLAUDE.md` 模板（适合放进仓库）

```markdown
# Project rules for Claude Code

## Goal
- What this repo does (1-3 sentences).

## Repo map
- Key directories and what they contain.

## How to run
- Install: <commands>
- Dev: <commands>
- Build: <commands>

## Testing
- Unit tests: <commands>
- Integration/E2E: <commands>
- Lint/format: <commands>

## Change rules
- Prefer small, reviewable PRs.
- Update docs when changing public APIs.
- Never modify: <paths> (explain why).

## Output expectations
- Before coding: summarize plan + files to touch.
- After coding: list verification steps + any risks.
```

> 小结：把“你希望它遵循的规则”写进 `CLAUDE.md`，比在聊天里反复强调更稳定；而 `local`/`global` 两层则分别解决“个人偏好”和“跨项目一致性”。


## 如何使用 Claude Code 理解大型仓库？（从“迷路”到“建立心智模型”）

大型仓库的难点往往不是“看不懂某个文件”，而是**缺一张地图**：入口在哪里、核心链路怎么走、边界如何划分、哪些约定不能破。Claude Code 的优势在于它会做 **agentic search**（带目标地检索与跳转），把“碎片信息”拼成结构化结论。

### 1) 先让它产出 Repo Map（5–10 分钟建立全局视图）
你可以先问一个足够宽的问题，让它输出“可以拿来导航”的结果：

- 示例提问：

  - “给我一个 codebase overview：这个仓库的模块边界、目录职责、关键依赖（DB/消息队列/第三方）、以及主要的运行入口分别在哪里？”
  - “请列出最重要的 10 个文件/目录，并说明它们对业务/系统的作用；同时标注你不确定的地方以及你依据的证据（文件路径/关键函数名）。”

- 你希望它输出的格式（建议你明确要求）：
  - **Repo map（目录 → 职责）**
  - **入口点**（CLI/HTTP handler/worker/cron）
  - **关键领域对象/数据结构**
  - **关键依赖与配置位置**
  - **风险点**（耦合、隐藏约定、容易踩坑处）

### 2) 让它“走一遍链路”：用数据流问题替代“这个文件干嘛的”
理解大型系统最有效的是沿着一次真实请求/任务把数据流走通：

- 通用数据流提问模板（前后端/AI 都适用）：

  - “以【用户触发 X】为例：从入口开始，按时间顺序列出调用链（函数/类/模块），每一步输入输出是什么？哪些地方会读写 DB/缓存/外部服务？”
  - “请画出（用文字也行）数据流：Request → Validation → Domain logic → Persistence → Response，并给出对应代码位置（文件+函数名）。”

- AI / RAG / Pipeline 场景示例：
  - “以【一次检索增强问答】为例：query 如何被改写、embedding 在哪里算、检索在哪里做、rerank/过滤规则在哪里、最终 prompt 如何拼、日志与评估指标在哪里记录？”

### 3) “找证据”的高效用法：让它带着关键词/模式去定位
大型仓库常见入口并不显眼（注册表/路由表/依赖注入/配置驱动）。可以让它按模式找：

- 示例提问：
  - “这个服务的 HTTP 路由是在哪里注册的？请告诉我注册点文件、路由到 handler 的映射方式，以及新增一个 endpoint 应该改哪些地方。”
  - “后台任务/worker 是如何调度的？入口在哪里？任务定义和重试策略在哪里配置？”
  - “配置是如何加载的（env/config 文件/远端配置）？优先级是什么？哪些配置对本地运行是必须的？”

### 4) 把你的“理解”固化：用 Git 提交信息当作长期记忆
你在 `git add/commit` 时写/用claude code 写清楚动机与影响面，后续 Claude Code（以及你自己）会更快恢复上下文：

- 推荐的 commit message/描述要包含：
  - **Why**：为什么改（背景/问题）
  - **What**：改了什么（要点）
  - **Impact**：影响面（模块/接口/风险）
  - **Verify**：如何验证（命令/步骤）

- 示例（更利于后续检索与理解）：
  - `refactor(auth): clarify token validation flow; add doc + tests`
  - commit body：`Why/What/Impact/Verify` 四段式

### 5) 一个“上手大仓库”的实战流程（你可以照着做）
- “先输出 repo map + 入口清单”
- “选一条关键业务链路（登录/下单/训练/检索）走完数据流”
- “把关键点补成文档/注释（或写入 CLAUDE.md）”
- “每次改动都写清楚 commit/PR 描述，持续加深‘可检索的记忆’”




## 如何使用 Claude Code 撰写大型仓库？（从"写代码"到"可控交付"）

---

### 案例一：端到端 RAG Agent 添加 Feature

以下是一个典型的"给现有系统加功能"的完整流程，适用于 AI pipeline / Web 后端 / 前端组件等场景。

#### 第 1 步：定位要改的文件（你知道 > 让它猜）

- **如果你知道入口/改动点**：直接用 `@` 标识文件，减少 Claude Code 的探索时间。
  
  示例提问：
  ```
  我要在 RAG pipeline 里加一个"检索后 rerank"的步骤。
  相关文件是 @src/retrieval/pipeline.py 和 @src/retrieval/reranker.py。
  请先告诉我你理解的当前流程，再给出改动方案。
  ```

- **如果你不确定改哪里**：让它先做 agentic search，但要求它"带着目标找"而不是漫游。
  
  示例提问：
  ```
  我想给 RAG pipeline 加 rerank 能力。
  请帮我定位：1) 当前检索结果在哪里返回；2) 最适合插入 rerank 的位置；3) 需要改动的文件清单。
  ```

#### 第 2 步：生成计划（Plan Mode，`Shift + Tab`）

在动手前让 Claude Code 输出一份**可 review 的计划**，而不是直接改代码。

- **如何触发**：在 claude code 中按 `Shift + Tab` 进入 Plan Mode，或在提问时明确要求：
  ```
  请先输出一份改动计划，包含：
  1. 要新增/修改的文件
  2. 每个文件的改动要点
  3. 预期的调用链变化
  4. 需要新增的测试/验证点
  暂时不要写代码，等我确认后再执行。
  ```

- **Review 计划时关注**：
  - 是否遗漏了关联文件（配置/测试/文档）
  - 是否破坏了现有接口/契约
  - 回滚成本是否可控（改动范围是否过大）

#### 第 3 步：执行计划（确认后再动手）

确认计划合理后，让它按步骤执行：
```
计划看起来合理，请按上述方案执行。每完成一个文件后暂停，让我 review diff。
```

或者如果你信任度较高：
```
请执行上述计划，完成后输出所有 diff 摘要，并告诉我如何本地验证。
```

#### 第 4 步：人工 Review（前端 UI 可用截图反馈）

- **对于逻辑/接口改动**：看 diff、跑测试、检查日志。
- **对于前端 UI**：直接截图贴给 Claude Code 是最直观的反馈方式。
  
  示例：
  ```
  [截图]
  按钮位置不对，应该左对齐，并且去掉边框。请修复。
  ```

#### 第 5 步：用 MCP 工具替代"人工截图→反馈"循环（进阶）

如果你发现自己在**反复截图→贴图→等修复→再截图**，说明这个环节可以自动化。

##### 什么是 MCP（Model Context Protocol）工具？
MCP 是一种让 Claude Code 调用外部工具的协议。常见的 MCP 工具包括：
- **Playwright MCP**：让 Claude Code 自己打开浏览器、访问页面、截图、检查元素。
- **Terminal MCP**：让它执行命令并读取输出。
- **Database MCP**：让它查询数据库状态。

##### 示例指令解析（Playwright MCP）

原始指令：
```
Using the playwright MCP server visit 127.0.0.1:8000 and view the new chat button.
I want that button to look the same as the other links below for Courses and Try Asking.
Make sure this is left aligned and that the border is removed.
```

**结构拆解**：
| 部分 | 作用 | 你要写的内容 |
|------|------|--------------|
| **工具声明** | 告诉 Claude Code 用哪个 MCP | `Using the playwright MCP server` |
| **动作** | 访问 + 定位目标 | `visit 127.0.0.1:8000 and view the new chat button` |
| **参照物** | 给出"正确"的样式参考 | `look the same as the other links below for Courses and Try Asking` |
| **具体约束** | 明确要求（可验证） | `left aligned` / `border is removed` |

**省去人工截图的原理**：
Claude Code 通过 Playwright MCP 自己打开页面 → 截图 → 分析 → 修改代码 → 再截图验证，形成闭环。

##### MCP 的优缺点

| 优点 | 缺点 |
|------|------|
| 省去人工截图反馈循环 | 需要提前配置 MCP 工具（一次性成本） |
| 可自动化 UI 回归验证 | 复杂交互（拖拽、动画）可能不如人眼准 |
| 适合高频迭代场景 | 对本地环境有要求（浏览器/端口） |

##### 什么时候该考虑用 MCP？

问自己一个问题：**"这个操作我今天会重复超过 3 次吗？"**

- **适合用 MCP**：
  - 前端样式反复微调（截图→反馈→截图）
  - 需要检查多个页面/状态的 UI 一致性
  - 需要自动化验证某个流程（如登录→跳转→展示）

- **不需要用 MCP**：
  - 一次性改动，改完就走
  - 逻辑改动，跑测试比截图更有效
  - MCP 工具本身还没配好（先完成任务，再优化流程）

---

#### 小结：Feature 添加的"可控交付"心法

| 阶段 | 你要做的 | Claude Code 负责的 |
|------|----------|-------------------|
| **定位** | 给入口/文件（如果知道） | agentic search（如果你不确定） |
| **计划** | Review 计划、补充约束 | 输出可执行方案 |
| **执行** | 控制节奏（分步/一次性） | 按计划改代码 |
| **验证** | 跑测试 / 截图 / 用 MCP | 根据反馈修复 |
| **固化** | 写 commit/PR 描述 | 生成变更摘要 |

> 一句话总结：**让 Claude Code 先出计划、再动手、最后验证**——把"写代码"变成"可 review 的流程"，才是大型仓库里"改得稳"的关键。



### 代码测试与 Debug：让 Claude Code 帮你"找问题"而不是"猜问题"

Debug 的核心难点是**定位**：到底是哪一层出了问题？Claude Code 的优势在于它可以帮你**系统性地排查**，但你需要用正确的方式引导它。

---

#### Trick 1：用 "Think a lot / Think hard" 触发深度推理

**原理**：Claude Code 默认会尽快给出答案。对于复杂问题（多层调用、隐藏状态、竞态条件），你需要它分配更多"推理预算"。

**方法**：在 prompt 末尾加上 `Think a lot` / `Think hard` / `Think step by step`，让模型在回答前做更长的内部推理。

**示例（RAG 系统排错）**：
```
The RAG chatbot returns 'query failed' for any content-related questions.
I need you to:

1. Write tests to evaluate the outputs of the execute method of the CourseSearchTool in @backend/search_tools.py
2. Write tests to evaluate if @backend/ai_generator.py correctly calls for the CourseSearchTool
3. Write tests to evaluate how the RAG system is handling the content-query related questions.

Save the tests in a tests folder within @backend.
Run those tests against the current system to identify which components are failing.
Propose fixes based on what the tests reveal is broken.

Think a lot.
```

**结构拆解**：
| 部分 | 作用 |
|------|------|
| **现象描述** | 告诉它"什么坏了"（query failed） |
| **分层测试要求** | 让它从底层到顶层逐层验证（Tool → Caller → System） |
| **输出约束** | 测试放哪里、跑完要干什么（定位 → 修复） |
| **深度推理触发** | `Think a lot` 让它不要急着下结论 |

**见解**：
- 不要只说"帮我 debug"，要**拆成分层测试任务**——让它先定位到底是哪一层挂了。
- `Think a lot` 对"症状模糊、可能原因多"的问题特别有效（例如：偶发失败、性能下降、数据不一致）。

---

#### Trick 2：功能修改时，给出"行为对比示例"（区分哪些该变、哪些不该变）

**原理**：功能修改往往会改变部分行为，但也有些行为不能被"误伤"。**给 Claude Code 一份 Before/After 的行为对比表**，明确标注哪些行为要变、变成什么样、哪些行为必须保持不变，它就能用这些作为验证标准。

**方法**：在修改请求里附上"用户操作 → 修改前结果 → 修改后预期结果"的对照表，用 ✅ / ⚠️ 标记区分。

**示例（功能修改导致部分行为变化）**：
```
我要修改 @src/auth/login.py，新增"同账号最多 3 个设备同时在线"的限制。
超出限制时，踢掉最早登录的设备。

修改前后的行为对比：

| 用户操作 | 修改前结果 | 修改后结果（预期变化） |
|----------|------------|------------------------|
| 正常登录 | 返回 200 + session | ✅ 不变 |
| 重复登录（同设备） | 刷新 session | ✅ 不变 |
| 第 1-3 个设备登录 | 全部共存 | ✅ 不变 |
| 第 4 个设备登录 | 全部共存 | ⚠️ 变化：踢掉最早的设备，返回 200 |
| 被踢设备访问 | 正常访问 | ⚠️ 变化：返回 401 + 提示"已在其他设备登录" |
| 主动登出后重新登录 | 正常登录 | ✅ 不变 |

请基于以上行为表：
1. 先写测试覆盖这 6 个场景（区分"应该变"和"不应该变"）
2. 再实现功能修改
3. 跑测试确认：✅ 行保持不变，⚠️ 行按预期变化
```

**这个表的关键设计**：

| 标记 | 含义 | 测试策略 |
|------|------|----------|
| ✅ 不变 | 这个行为必须和以前一样 | 回归测试：确保没被误伤 |
| ⚠️ 变化 | 这个行为要按新需求改变 | 新功能测试：确保变成预期的样子 |

**见解**：
- **不是所有修改都追求"行为不变"**——功能迭代本来就是要改变行为。
- 行为对比表的真正价值是：**显式区分"哪些该变、哪些不该变"**，避免改 A 误伤 B。
- 让 Claude Code 看到 ✅ / ⚠️ 标记后，它会自动把测试分成两类：回归测试 + 新功能测试。

---

#### Trick 3：不确定目标时，用多 Agent 头脑风暴

**原理**：当你自己也不确定"该怎么做"时，让 Claude Code 启动**多个并行子代理**，各自独立产出方案，再由你挑选/合并。

**方法**：用 `subagents` / `parallel` 关键词触发（需要在非 Plan 模式下，claude code 中按 Tab 进入 Shortcut 模式）。

**示例（方案探索）**：
```
Use two parallel subagents to brainstorm possible plans for:
- Adding a caching layer to the RAG retrieval step
- Goal: reduce latency by 50% without sacrificing recall

Each subagent should propose a different approach (e.g., embedding cache vs. result cache vs. hybrid).
Do not implement any code. Output a comparison table at the end.
```

**输出预期**：
- Agent A：方案一（embedding cache）+ 优缺点
- Agent B：方案二（result cache）+ 优缺点
- 对比表：延迟、命中率、实现复杂度、回滚成本

**见解**：
- 头脑风暴阶段**不要让它写代码**（`Do not implement`），否则它会过早收敛到一个方案。
- 多 Agent 的价值是"看到不同视角"，最终决策权在你。

---

#### Trick 4：选定方案后，用 Plan 模式细化执行计划

**原理**：头脑风暴产出的是"方向"，Plan 模式产出的是"可执行步骤"。两者配合使用。

**方法**：`Shift + Tab` 进入 Plan 模式，把选定的方案细化成任务清单。

**示例（从方案到计划）**：
```
我选择方案 A（embedding cache）。
请进入 Plan 模式，输出详细的执行计划：

1. 需要新增/修改的文件
2. 每个文件的改动要点
3. 缓存的 key 设计、TTL 策略、失效机制
4. 需要新增的配置项
5. 测试计划（单测 + 集成测试）
6. 回滚方案

暂不执行，等我确认。
```

**见解**：
- **先发散（Trick 3）→ 再收敛（Trick 4）** 是处理"目标模糊"问题的标准流程。
- Plan 模式的输出可以直接作为 PR 描述或技术文档的骨架。

---

#### 小结：Debug & 测试的 4 个心法

| 场景 | 方法 | 关键词 / 触发方式 |
|------|------|-------------------|
| 复杂问题定位 | 分层测试 + 深度推理 | `Think a lot` / `Think hard` |
| 功能修改 | 行为对比表（✅ 不变 / ⚠️ 变化） | Before/After 行为示例 |
| 目标不确定 | 多 Agent 头脑风暴 | `parallel subagents` / Shortcut 模式 |
| 方案细化 | Plan 模式 | `Shift + Tab` / `暂不执行` |

> 一句话总结：Debug 的本质是"缩小怀疑范围"——让 Claude Code 帮你**分层验证、对比行为、探索方案、细化计划**，比直接问"为什么挂了"有效 10 倍。



### 进阶技巧：用 Git Worktrees 实现多任务并行（不冲突、不覆盖）

当你有多个独立任务要同时推进（比如 UI 改版、测试补全、代码质量优化），**开多个终端窗口是不够的**——它们共享同一份代码，Claude Code 改 A 任务的文件可能覆盖 B 任务的改动。

**正确做法**：用 Git Worktrees，让每个任务在独立的工作目录（独立分支）中运行，互不干扰。

![](/images/cc-5.png)

---

#### 第 1 步：创建 Worktrees（一次性操作）

在项目根目录执行：
```bash
# 创建 .trees 目录存放所有 worktree
mkdir -p .trees

# 为每个任务创建独立的 worktree + 分支
git worktree add .trees/ui_feature
git worktree add .trees/testing_feature
git worktree add .trees/quality_feature

# 查看所有分支（确认 worktree 创建成功）
git branch -a
```

**输出示例**（如图中底部终端）：
```
* main
+ quality_feature
+ testing_feature
+ ui_feature
  remotes/origin/main
```

---

#### 第 2 步：在每个 Worktree 中启动 Claude Code

在 VS Code 中：
1. 打开 `.trees/ui_feature` 目录（或右键点击该目录 → "在集成终端中打开"）
2. 在该终端中启动 Claude Code
3. 对 `testing_feature`、`quality_feature` 重复上述操作

**结果**：你会得到 3 个并行的 Claude Code 会话（如图所示），每个会话：
- 工作在独立的目录（`cwd` 不同）
- 对应独立的 Git 分支
- 文件修改互不覆盖

---

#### 第 3 步：各自完成任务后提交

每个 worktree 中的任务完成后，让 Claude Code 提交：
```
Add and commit with a descriptive message.
```

或者更具体：
```
Please commit the changes with message: "feat(ui): add new chat button with updated styling"
```

---

#### 第 4 步：合并所有 Worktrees（可能有冲突）

回到主分支，让 Claude Code 帮你合并：
```
Use the git merge command to merge in all of the worktrees in the .trees folder.
Fix any conflicts if there are any.
```

Claude Code 会：
1. 依次合并 `ui_feature`、`testing_feature`、`quality_feature`
2. 如果有冲突，自动分析并修复（或给你选择）
3. 输出合并结果摘要

---

#### 小结：Worktrees 的价值

| 场景 | 不用 Worktrees | 用 Worktrees |
|------|----------------|--------------|
| 多任务并行 | 文件冲突、互相覆盖 | 完全隔离、互不干扰 |
| 切换任务 | 需要 stash/commit | 直接切目录 |
| 合并结果 | 手动解决冲突 | Claude Code 辅助合并 |

> 一句话总结：**Worktrees 让"一个人同时做多件事"变得安全**——每个任务有独立的工作空间，最后再统一合并。

---

### 进阶技巧：自定义 Claude Code 命令（`/your_command`）

除了内置命令（如 `/help`、`/compact`），你可以**自定义常用操作**，用 `/命令名` 一键触发。

#### 方法：在项目根目录创建 `.claude/commands/` 目录

```bash
mkdir -p .claude/commands
```

然后在该目录下创建 `.md` 文件，每个文件就是一个命令。

#### 示例：创建 `/implement_feature` 命令

创建文件 `.claude/commands/implement_feature.md`：
```markdown
# Implement Feature

Please implement the feature described below:

1. First, analyze the current codebase to understand the existing patterns
2. Create a plan for implementation
3. Implement the feature following existing code style
4. Add appropriate tests
5. Update documentation if needed

Feature to implement: $ARGUMENTS
```

使用时：
```
/implement_feature Add a dark mode toggle to the settings page
```

#### 常用自定义命令示例

| 命令名 | 用途 |
|--------|------|
| `/review` | 对当前 diff 做代码审查 |
| `/test` | 为指定文件生成测试 |
| `/doc` | 为函数/模块生成文档 |
| `/refactor` | 按指定目标重构代码 |
| `/fix_lint` | 修复所有 lint 错误 |

> 见解：把你**反复做的操作**封装成命令，既省打字，也能保证每次执行的 prompt 质量一致。




### 进阶技巧：让 Claude Code 直接与 GitHub 交互（Review PR / Fix Issues）

Claude Code 不仅能在本地终端里写代码，还能**直接与 GitHub 集成**——帮你 Review PR、修复 Issues、甚至在你不在电脑前时自动响应。

---

#### 第 1 步：安装 GitHub App 完成集成

在 Claude Code 中执行：
```
/install-github-app
```
---

#### 使用场景 1：Review Pull Requests

让 Claude Code 帮你审查 PR，找出潜在问题：

```
Review PR #42 in this repository.
Focus on:
1. Logic errors or bugs
2. Security concerns
3. Performance issues
4. Code style consistency
Give specific line-by-line feedback.
```

**Claude Code 会**：
- 读取 PR 的所有文件变更
- 逐文件分析改动
- 输出具体的 review 意见（带行号）
- 可以直接在 GitHub 上提交 review comments

---

#### 使用场景 2：Fix Issues

让 Claude Code 根据 Issue 描述自动修复问题：

```
Look at issue #15 in this repository.
Understand the problem, locate the relevant code, and implement a fix.
Create a PR with the fix when done.
```

**Claude Code 会**：
- 读取 Issue 的描述和讨论
- 在代码库中定位相关文件
- 实现修复
- 自动创建 PR 并关联 Issue

---

#### 使用场景 3：恢复之前的对话（`--resume`）

如果你之前在处理某个任务，中途关闭了终端，可以用 `--resume` 恢复：

```bash
# 恢复最近一次对话
claude --resume

# 恢复指定的对话（按 ID）
claude --resume <conversation_id>
```

**适用场景**：
- 长时间任务中途断开
- 想继续之前的 PR review 或 Issue 修复
- 切换设备后继续工作

---

#### 进阶功能：Hooks（自动化触发）

暂无说明

---

#### 小结：GitHub 集成的价值

| 能力 | 传统方式 | Claude Code + GitHub |
|------|----------|----------------------|
| Review PR | 人工逐行看 | AI 辅助 + 自动输出意见 |
| Fix Issues | 手动定位 + 修复 | 读 Issue → 定位 → 修复 → 创建 PR |
| 持续响应 | 需要人在线 | Hooks 自动触发 |
| 上下文恢复 | 从头开始 | `--resume` 继续 |

> 一句话总结：**把 Claude Code 当成你的 GitHub 助手**——它可以帮你 Review、修 Bug、响应 Issue，甚至在你不在的时候自动干活。

---

## Claude Code 与 Jupyter 的结合用法：从混乱 Notebook 到专业 Dashboard

数据分析师的日常痛点：Jupyter Notebook 写着写着就变成了"一次性脚本"——代码混乱、没有文档、图表难看、换个时间段就要改一堆地方。

Claude Code 可以帮你**系统性地重构 Notebook**，甚至进一步**转换成可交互的 Dashboard**。

---

### 第 1 步：重构 Jupyter Notebook（从混乱到专业）

**目标**：保留原有分析逻辑，但让 Notebook 变得：
- 结构清晰（有目录、有分节）
- 代码可复用（抽成函数/模块）
- 可配置（换个时间段不用改代码）
- 图表专业（标题、坐标轴、配色）

#### Prompt 示例（可直接复用）

```
The @EDA.ipynb contains exploratory data analysis on e-commerce data in @ecommerce_data, focusing on sales metrics for 2023. Keep the same analysis and graphs, and improve the structure and documentation of the notebook.

Review the existing notebook and identify:
- What business metrics are currently calculated
- What visualizations are created
- What data transformations are performed
- Any code quality issues or inefficiencies
  
**Refactoring Requirements**

1. Notebook Structure & Documentation
    - Add proper documentation and markdown cells with clear header and a brief explanation for the section
    - Organize into logical sections:
        - Introduction & Business Objectives
        - Data Loading & Configuration
        - Data Preparation & Transformation
        - Business Metrics Calculation (revenue, product, geographic, customer experience analysis)
        - Summary of observations
    - Add table of contents at the beginning
    - Include data dictionary explaining key columns and business terms
   
2. Code Quality Improvements
   - Create reusable functions with docstrings
   - Implement consistent naming and formatting
   - Create separate Python files:
        - business_metrics.py containing business metric calculations only
        - data_loader.py loading, processing and cleaning the data  
        
3. Enhanced Visualizations
    - Improve all plots with:
        - Clear and descriptive titles 
        - Proper axis labels with units
        - Legends where needed
        - Appropriate chart types for the data
        - Include date range in plot titles or captions
        - Use consistent color business-oriented color schemes
          
4. Configurable Analysis Framework
   The notebook shows the computation of metrics for a specific date range (entire year of 2023 compared to 2022). Refactor the code so that the data is first filtered according to configurable month and year & implement general-purpose metric calculations. 

**Deliverables Expected**
- Refactored Jupyter notebook (EDA_Refactored.ipynb) with all improvements
- Business metrics module (business_metrics.py) with documented functions
- Requirements file (requirements.txt) listing all dependencies
- README section explaining how to use the refactored analysis

**Success Criteria**
- Easy-to-read code & notebook (do not use icons in the printing statements or markdown cells)
- Configurable analysis that works for any date range
- Reusable code that can be applied to future datasets
- Maintainable structure that other analysts can easily understand and extend
- Maintain all existing analyses while improving the quality, structure, and usability of the notebook
- Do not assume any business thresholds
```

#### Prompt 结构分析

| 部分 | 作用 | 你可以改的地方 |
|------|------|----------------|
| **上下文** | 告诉它 Notebook 是什么、数据在哪 | 改成你的文件路径和业务场景 |
| **Review 要求** | 让它先理解现状再动手 | 根据你的 Notebook 特点调整 |
| **Refactoring Requirements** | 具体的重构标准 | 按你的需求增减 |
| **Deliverables Expected** | 明确输出物 | 确保它不遗漏 |
| **Success Criteria** | 验收标准 | 加入你的偏好（如配色、风格） |

---

### 第 2 步：将 Notebook 转换为 Streamlit Dashboard

**目标**：把静态的分析结果变成**可交互的 Dashboard**，让非技术人员也能用。

#### Prompt 示例（可直接复用）

```
Convert `@EDA_Refactored.ipynb` into a professional Streamlit dashboard with this exact layout:

## Layout Structure
- **Header**: Title + date range filter (applies globally)
    - Title: left
    - Date range filter: right
- **KPI Row**: 4 cards (Total Revenue, Monthly Growth, Average Order Value, Total Orders)
    - Trend indicators for Total Revenue, Average Order Value and Total Orders
    - Use red for negative trends and green for positive trend
- **Charts Grid**: 2x2 layout
    - Revenue trend line chart:
        - Solid line for the current period
        - Dashed line for the previous period
        - Add grid lines for easier reading
        - Y-axis formatting - show values as $300K instead of $300,000
    - Top 10 categories bar chart sorted descending:
        - Use blue gradient (light shade for lower values)
        - Format values as $300K and $2M  
    - Revenue by state: US choropleth map color-coded by revenue amount
        - Use blue gradient
    - Bar chart showing satisfaction vs delivery time:
        - x-axis: Delivery time buckets (1-3 days, 4-7 days, etc.)
        - y-axis: Average review score
- **Bottom Row**: 2 cards 
    - Average delivery time with trend indicator
    - Review Score:
        - Large number with stars
        - Subtitle: "Average Review Score"

## Key Requirements
- Use Plotly for all charts
- Filter updates charts correctly
- Professional styling with trend arrows/colors
- Do not use icons
- Use uniform card heights for each row
- Show two decimal places for each trend indicator
- Include requirements.txt and README.md
```

#### Prompt 结构分析

| 部分 | 作用 | 你可以改的地方 |
|------|------|----------------|
| **Layout Structure** | 精确描述布局 | 改成你想要的布局（几行几列） |
| **KPI Row** | 关键指标卡片 | 换成你的业务指标 |
| **Charts Grid** | 图表类型和细节 | 换成你需要的图表 |
| **Key Requirements** | 技术约束 | 加入你的偏好（图表库、样式） |

---

### 方法论：为什么这样写 Prompt 效果好？

| 技巧 | 说明 |
|------|------|
| **先 Review 再改** | 让它理解现状，避免丢失原有逻辑 |
| **分层要求** | 结构、代码、可视化、可配置性分开说 |
| **明确 Deliverables** | 不只是"重构"，而是"输出哪些文件" |
| **Success Criteria** | 给它验收标准，减少返工 |
| **精确描述布局** | Dashboard 要"画"出来，不能只说"好看" |

---

### 小结：从 Notebook 到 Dashboard 的完整链路

```
混乱的 EDA.ipynb
       ↓ Claude Code 重构
结构化的 EDA_Refactored.ipynb + business_metrics.py + data_loader.py
       ↓ Claude Code 转换
可交互的 Streamlit Dashboard
```

| 阶段 | 输入 | 输出 | Claude Code 做的事 |
|------|------|------|-------------------|
| 重构 | 混乱 Notebook | 专业 Notebook + 模块 | 加结构、抽函数、改图表、加配置 |
| 转换 | 重构后 Notebook | Streamlit 代码 | 按布局生成 Dashboard |

> 见解：**Prompt 的详细程度决定输出质量**——对于 Dashboard 这类"视觉产品"，布局/配色/格式要写得越具体越好，否则 Claude Code 会按默认风格来（往往不是你想要的）。




## claude code 基于 Figma 原型创建 web 应用
TO BE COUNTINUED



# Reference
1. https://www.bilibili.com/video/BV1VuxezvE6d?spm_id_from=333.788.videopod.sections&vd_source=387401c193115a31f1066878e5ac9851