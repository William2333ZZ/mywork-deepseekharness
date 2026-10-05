# 每日论文 · 写论文 · 核引用（四类原文提取，2026-10-05）

四个来源都抓到了。苏剑林的博客第一次请求返回 403 和一段 JS 跳转，用 cookie jar 照着跳转再请求一次就拿到了全文。每节最后的"数字同事最少能力"是我的推论，原文没有这部分。

---

## 1. ARIS（Auto-claude-code-research-in-sleep）

**作者和日期**
- 仓库 wanshuiyin。技术报告署名 Ruofeng Yang、Yongcan Li、Shuai Li，arXiv:2605.03042（2026）。
- 仓库建于 2026-03-10，README 最新一条更新是 2026-09-28。约 1.7 万星，MIT 许可。

**它是什么**
- 83 个纯 Markdown 写的 skill，每次给一个研究课题，从头跑一条流水线。
- 分工是"执行者干活、另一家族模型审"：Claude 执行，GPT 经 Codex 审。
- 技能目录里**没有每日论文推送类的 skill**。

**工作流步骤**
- 入口命令：`/research-pipeline`、`/idea-discovery`、`/experiment-bridge`、`/auto-review-loop`、`/paper-writing`、`/rebuttal`、`/resubmit-pipeline`、`/paper-talk`、`/research-wiki`、`/meta-optimize`。
- 文献类：`/research-lit`、`/arxiv`、`/semantic-scholar`、`/deepxiv`、`/exa-search`、`/openalex`、`/alphaxiv`、`/novelty-check`。
  - `/research-lit` 的来源依次是 Zotero（经 MCP 读分类、标注、BibTeX）→ Obsidian → 本地 PDF → 网络，最后跨来源去重。
- 过夜循环（工作流 2，`/auto-review-loop`）：
  1. GPT 以 xhigh 档深读论文找弱点。
  2. Claude 修复：改写章节、加 baseline，或用 `/run-experiment` 把实验发到 GPU。
  3. `/monitor-experiment` 收结果，再交审。
  4. 分数到 6/10 或跑满 4 轮就停。
- 过夜循环的规则：
  - 估计超过 4 GPU 小时的实验直接跳过，标记"需人工跟进"。
  - 能改叙事解决的就不跑新实验；明确规定"不准隐藏弱点"。
  - 状态写进 `REVIEW_STATE.json`，上下文压缩后可以续跑。
  - 审稿难度三档：medium / hard（审稿人有记忆 + 辩论）/ nightmare（GPT 直接读代码仓库）。
- Research Wiki（`/research-wiki init` 一次开启）：
  - 四类实体：论文、想法、实验、声明，加上带类型的关系边（extends / contradicts / supports / invalidates 等）。
  - 另有 `gap_map.md`，以及给想法生成用的 `query_pack.md`（最多 8000 字）。
  - 自动挂钩：文献检索时自动入库论文；生成想法前先读 wiki，失败的想法当作禁止清单；结果判定后更新声明状态。
  - 入库前过滤"某工具做不到 X"这类运行噪声，避免它被后来的会话当成事实引用。
- 产出格式：每个审计都出一份 MD 报告、一份 JSON 台账、一份 HTML 视图。

**核对怎么做**
- 审计分四层，逐层往上：`/experiment-audit`（代码）→ `/result-to-claim`（数据能否支持结论）→ `/paper-claim-audit`（论文里的数字）→ `/citation-audit`（引用）。
- `/citation-audit`：
  - 把每个 `\cite` 连同所在文件、行号和整句原文抽出来。
  - 每个条目开一个**新的**跨家族审稿线程，只读，必须真的联网查 web/DBLP/arXiv。
  - 三条轴分别判断：
    - **存在性**：YES / NO / UNCERTAIN，并给出查证 URL。
    - **元数据**：作者、年份、会议、标题是否正确。
    - **是否支持原句**：每处引用判 SUPPORTS / WEAK / WRONG。作者认为这一条比元数据更危险。
  - 每条给 KEEP / FIX / REPLACE / REMOVE。只有 FIX（改元数据）可以自动应用；REPLACE 和 REMOVE 必须人批。改完重编译，检查有没有未定义引用。
  - 每次投稿只跑一次，明确禁止挂在 `/loop` 或定时任务上反复跑。
- 检索阶段另有一道快筛 `verify_papers.py`：
  - 查证顺序：arXiv 批量 API → CrossRef DOI → Semantic Scholar 模糊标题（词重叠 0.6）。
  - 结果分四态：verified / unverified / verify_pending / error。
  - 网络瞬时失败记为 pending，**不计入幻觉率**；查不到的论文保留在输出里，标 `[UNVERIFIED]`。
- **误报事故（2026-09-28 修复）**：arXiv 用 406 拒绝 Python 的 HTTP 客户端，被当成"查无此文"。有用户在 38 篇真实论文上跑出 47% 的幻觉率。现在 406/401/403 一律标 pending 并改走 curl，作者建议带 `--no-cache` 重跑。
- `/paper-claim-audit`：
  - 审稿人只拿到 `.tex` 和原始结果文件（json/csv/config），拿不到任何执行者写的总结。
  - 查数字虚高、只报最好的随机种子、配置不一致、实际 seed 数少于声称、增幅算错、图注与图不符、范围说过头。

**依赖**
- 宿主：Claude Code，或 Codex / Cursor / DeepSeek Harness 等。
- 审稿需要已登录的 Codex CLI，加 python3 跑的 codex-exec 桥接。
- 写论文需要 LaTeX 和 poppler；GPU 可选（SSH、本地或 Vast.ai）。
- 其余可选：Zotero/Obsidian MCP、DeepXiv、Exa key、Gemini key、S2 key、W&B、飞书推送或审批。
- 换模型可走 llm-chat 接 DeepSeek 等；也可用 manual 审稿，但那样没法无人值守。

**DeepSeek Harness 分支**
- 分支名 `dsh-aris`，安装命令 `dsh plugin --profile web add dsh-aris`（0.1.1）。
- 执行者换成 deepseek-v4-pro，审稿仍走 Codex（非 DeepSeek 家族，xhigh 档）。
- 需要 pnpm、python3 ≥3.9、DeepSeek key；走代理时启动要带 `NODE_USE_ENV_PROXY=1`。
- 桥接起不来时 Harness 直接拒绝启动，原话是"没有独立审稿人的 ARIS 不是 ARIS"。
- Web 界面多一个只读的 ARIS 标签页，读 `review-stage/REVIEW_STATE.json`。
  - 审稿人身份只能标"调用方声明"，即未认证。
  - `completed` 只表示循环结束，不表示通过。
- 已知限制：
  - 针对 Harness 0.1.1-rc.1 验证过，不保证下个版本。
  - `web_fetch` 关闭，联网改用 web_search 或 curl。
  - Codex 的推理过程不进日志，只回判词；超过 50KB 的判词落盘。

**明说的限制**
- `/paper-figure` 画不了架构图，约 40% 的图要手画。
- 审稿额度消耗大，档位不降。
- 审计类 skill 只在稿子或结果变化时跑一次。

**做成长期数字同事，最少需要（推论）**
- 一个持续积累的论文、想法、声明知识库。
- 一位独立的跨家族审稿人。
- 引用三轴核对，网络失败和查无此文要分开记。
- 断点续跑的状态文件。
- 设上限的过夜实验调度，超限交给人。
- 高风险改动必须人批。

---

## 2. 苏剑林《写了个刷论文的辅助网站：Cool Papers》（科学空间 9907）

**作者和日期**：苏剑林，2023-12-25。

**工作流步骤**
- 他一直**每天刷 arXiv 官网**，逐篇自己过，不用算法初筛。原因是怕漏召回，"刷"就是为了追新。
- Cool Papers（papers.cool）把这个习惯做成网站：
  - 只同步 arXiv 最新一天的列表，延迟不超过 10 分钟。
  - arXiv 大约在工作日北京时间 10 点更新，周末和美国节假日不更新。
  - 只显示当天，不能回溯，"贵在坚持，过时不候"。
- 他强调这是"刷"（筛选）网站，不是"读"网站，目的是挑出要精读的，不能代替精读。
- 筛选顺序：
  1. 先看标题和摘要，能筛掉不少。
  2. 拿不准的再点 [Kimi]，看 Kimi 生成的论文问答。
- 每篇论文的其他按钮：[PDF] 预览、[Copy] 复制标题摘要链接。
- 排序：默认按 arXiv 发布顺序；加 `-sorted-by-stars` 后按所有用户点击算出的 stars 排。
- Kimi 问答要排队，后台生成；已有人生成过的会缓存，再点立即出。
- 评论区补充：
  - Prompt 的诀窍是"一个问题一个问题地问"。
  - 站内只存标题、作者、摘要三个字段。

**核对怎么做**：本文不涉及引用或事实核对。

**依赖**：网站端用 Kimi Chat（长上下文）；用户端只要浏览器，PDF 预览靠用户自己的网络访问 arXiv。

**明说的限制**
- 目前很粗糙。
- 只有 arXiv 一个源（OpenReview 等待定）。
- 不能看历史。
- 手机浏览器点 PDF 会触发下载。
- 不要随手点 Kimi，会拖长别人的排队。

页面相关链接里还有几篇后续文章（适配 Zotero Connector、站内检索、浏览器扩展），**我没有读**。

**做成长期数字同事，最少需要（推论）**
- 每天按 arXiv 节奏准时出完整清单，宁可多不可漏。
- 默认按原序，可选按群体热度排序。
- 只对不确定的论文才生成逐问问答，并缓存复用。
- 明确定位是"筛"，最后把精读名单交给人。

---

## 3. GitHub 每日论文推荐类项目

搜索结果：Zotero 关联类星最多的是 **TideDra/zotero-arxiv-daily（6005 星）**。顺带读了点名的 huangkiki/dailypaper-skills（1269 星）。其他高星的 arXiv 每日项目与 Zotero 无关：dw-dengwei/daily-arXiv-ai-enhanced 3017 星，Vincentqyw/cv-arxiv-daily 1500 星。

### 3a. zotero-arxiv-daily

**作者和日期**：TideDra，仓库建于 2024-11-23，最近推送 2026-10-01，AGPL-3.0。

**工作流步骤**
- 运行方式：Fork 后用 GitHub Actions 每天 22:00 UTC 运行，也可以本地 `uv run main.py`。
- 数据源：arXiv（按分类，可含 cross-list），另有 bioRxiv、medRxiv、chemRxiv。
- 筛选和打分：
  1. 拉取 Zotero 全库，可用 glob 只取部分分类。
  2. 拉取前一天的新论文。
  3. 用嵌入模型（默认本地 jina-embeddings-v5-text-nano，也可用 API）对摘要编码。
  4. 每篇新论文的分数 = 与 Zotero 全部论文的加权平均相似度，越新加入库的论文权重越高。
- 产出：一封邮件，按相关度排序，最多 100 篇。每篇附 LLM 写的 TL;DR（用 pymupdf4llm 抽正文）、作者单位、PDF 和代码链接。

**核对怎么做**：无。

**依赖**
- Zotero ID 和只读 API key。
- SMTP 发件账号和授权码。
- 兼容 OpenAI 接口的 LLM key。
- 本地嵌入模型或嵌入 API。
- Python 环境（uv）。不需要 GPU。

**明说的限制**
- 推荐算法很简单，可能不准确反映兴趣。
- 篇数设太大可能超出 Actions 时限（公开仓库单次 6 小时，私有仓库每月 2000 分钟）。
- 周末和节假日没有新论文。

### 3b. dailypaper-skills

**作者和日期**：huangkiki，仓库建于 2026-02-26，最近推送 2026-10-05，Apache-2.0。

**工作流步骤**
- 触发：在 Agent 里说"今日论文推荐"，默认手动；可以说"过去一周"补看。
- 数据源：HuggingFace Daily/Trending 和 arXiv。
- 筛选：按配置的兴趣筛，按历史推荐去重，最多 10 篇，相关论文不够时不凑数。
- 打分：
  - 默认用第三方 Jev 判断主题相关性，需要 TYPESAFE_API_KEY；没有 key 可改关键词模式。
  - 研究价值由宿主 Agent 判断。
  - README 附一次单次成本对照（2026-10-05，30 篇候选，两组前 10 重合 9 篇），是作者自己测的。
- 分流：必读 / 值得看 / 可跳过。每篇回答四个问题：做了什么、和你的关系、可借鉴什么、还值得追问什么。
- 产出：
  - 推荐页。
  - 必读论文的全文精读笔记（公式、图表、实验、局限、`[[概念]]` 链接），存在本地 Markdown 或 Obsidian。
  - 也能从 Zotero 按标题或分类开始读。

**核对怎么做**：要求"判断要有证据，信息不足说明需要全文确认"，没有描述引用核对机制。

**依赖**：Python 3.10+、Git、curl、Poppler，Obsidian 和 Zotero 可选。

**明说的限制**
- 安装后不会自动定时运行，也不会建后台任务。
- 只能聊天、不能跑命令或访问文件的客户端用不了。
- 安装通过不等于每个客户端都做过端到端验证。

**做成长期数字同事，最少需要（推论）**
- 读取用户文献库作为兴趣画像，近期收藏权重更高。
- 每天定时拉新论文，周末和节假日能识别。
- 便宜的相关度粗排加上有理由的分流。
- 推荐历史去重。
- 必读论文出带链接的笔记，并持续积累。
- 漏看几天时能补看。

---

## 4. ICLR 2026 审稿回顾（只看幻觉引用部分）

**作者和日期**：ICLR 2026 Program Chairs，2026-03-31。

**怎么定义**：提交论文里有一条或多条引用，指向不存在的文献，和/或书目信息严重错误。

**检测流程**
1. 用一个自动系统从每篇投稿中抽取参考文献。
2. 与多个标准书目数据库和一次普通网页搜索比对。文中没有给出系统名称。
3. 系统**误报率很高**，例子是作者把非英文标题自行译成英文后被报为不存在。
4. 因此先由领域主席（AC）做第一轮人工复核。
5. 程序主席再亲自复查**全部**被标记的引用，每篇被标记论文至少经过 3 人审看。
6. 确认含幻觉引用的论文一律 desk reject，同时开申诉通道纠正误判。

**另外**
- 对所有投稿也跑了 LLM 内容检测，把含量高的标给 AC。
- 文中说这一流程"部分解释"了今年 desk reject 偏多。全年 desk reject 共 779 篇，**没有单独给出幻觉引用的数量**。
- 文中只描述了存在性和元数据核对，**没有提到核对引用是否支持原句**。

**依赖**：自动抽取加数据库与网页比对的系统，再加大量人工复核。

**明说的限制**：误报率高；最终处理靠人工确认加申诉兜底。

**做成长期数字同事，最少需要（推论）**
- 投稿前自查：抽全部引用 → 多库加网页比对存在性和元数据。
- 能识别会误报的情况（译名、预印本与正式版之差等）。
- 把"疑似"和"确认"分开报告给人，不自动下结论。
- 保留可复查的证据链接。
