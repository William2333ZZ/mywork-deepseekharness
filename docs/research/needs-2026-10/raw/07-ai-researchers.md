# AI 1：做 AI 研究的人

原始调研记录（2026-10-05）。未经逐条复核，复核结果见上一级目录的 `audit.md`。数字和说法以各条所附网址的原文为准。

## 人群

- **AI/ML 方向博士生与硕士生（国内高校为主）**：顶会论文的第一作者；算力和导师时间都紧；既投稿也被要求审稿
  - 深度研究工作：一个课题持续 3–9 个月：调研→复现基线→跑实验→写论文→rebuttal，产出会议论文和学位论文
  - 规模：AAAI-26 收到近 29,000 篇投稿、其中约 20,000 篇来自中国、作者超过 75,000 人（AAAI-26 论文集前言 https://aaai.org/proceeding/aaai-40-2026/）。没有找到中国 AI 在读博士人数的来源。
- **高校教师 / PI / 博后**：定方向、改稿、署名担责、当 AC 和审稿人、写基金
  - 深度研究工作：同时管多个课题；为学生的选题和引用把关；大量审稿
  - 规模：NeurIPS 2025：20,518 名审稿人、1,663 名 AC；ICLR 2026：18,054 名审稿人；AAAI-26 程序委员会超过 28,000 人（各会议官方页面）。
- **工业界研究员 / research engineer / applied scientist**：在实验室或大厂做经验性研究，迭代快、算力相对多、内部工具多
  - 深度研究工作：快速去风险→规模化实验→内部报告或论文；产出技术报告、论文、内部决策依据
  - 规模：Anthropic 内部调查样本为 132 名工程师和研究员（厂商内部研究）。没有找到行业总人数来源。
- **独立研究者 / 研究项目学员（如 MATS）**：没有机构算力和导师日常把关，靠 API 和小 GPU 做经验性研究
  - 深度研究工作：短周期（数月）项目，产出论文或博客报告；最依赖工作流纪律和工具
  - 规模：未找到规模来源。
- **ML/CV/机器人方向的论文重度读者（跨上面各类）**：愿意为论文发现装专门工具的人
  - 深度研究工作：持续跟踪自己方向的新论文
  - 规模：Scholar Inbox 约 23,000 注册、约 8,000 月活（arXiv 2504.08385）。

## 工作流

1. **1 找方向与选题**：定一个问题域，弄清已知和未知；新人主要靠导师和同组判断，不是自己做穷尽式综述。职业压力把选题推向大模型方向。
   - 产出：一页问题陈述、最接近的 5–10 篇工作、初步假设
   - 工具：导师/组会、X、Google Scholar、LLM 头脑风暴
   - 时间：来源未给小时数。Nanda 指出新人常把探索期误当验证期而受挫；Si 等的研究显示 LLM 想法更新颖但可行性略差，专家判断新颖性也难。
   - 来源：<https://www.lesswrong.com/posts/hjMy4ZxS5ogA9cTYK/how-i-think-about-my-research-process-explore-understand> <https://arxiv.org/abs/2409.04109> <https://kyunghyuncho.me/i-sensed-anxiety-and-frustration-at-neurips24/>
2. **2 文献调研（related work、找空白）**：顺着引用上下游追、查并发 arXiv、整理成对比表；投稿前和 rebuttal 时各再补一次。
   - 产出：相关工作清单与对比表、bib 文件、空白点说明
   - 工具：Google Scholar、Semantic Scholar、Scholar Inbox、Research Rabbit、Undermind/Elicit、Deep Research、Zotero
   - 时间：arXiv 2026 年 9 月 40,363 篇；cs.LG 单日 608 条。实测中没有一种方法能找全 43 篇目标论文。ICLR 把并发窗口定为截稿前两个月。
   - 来源：<https://www.theregister.com/ai-and-ml/2026/10/02/arxiv-imposes-rate-limit-on-paper-submissions-to-stem-the-ai-slop-tide/5300899> <https://arxiv.org/list/cs.LG/new> <https://xiangyu-yin.com/content/post_deep_research.html> <https://iclr.cc/Conferences/2026/ReviewerGuide>
3. **3 读论文与笔记**：先扫标题摘要结论筛选，再精读少数；批注、打标签、写主题笔记。
   - 产出：带批注的 PDF 库、按课题组织的笔记/思维导图
   - 工具：Zotero（+Better BibTeX）、Obsidian、Zotero MCP、李沐精读视频
   - 时间：来源未给小时数。两位博主都说只给当前课题相关的论文写笔记，否则维护不动。
   - 来源：<https://www.lucasmercier.me/blog/research_workflow> <https://tinytka.github.io/2026/05/06/%E6%9C%AC%E5%9C%B0%E6%90%AD%E5%BB%BA%E4%B8%AA%E4%BA%BAzotero-Obsidian%E5%B7%A5%E4%BD%9C%E6%B5%81/> <https://github.com/mli/paper-reading>
4. **4 想法与假设、快速去风险**：用 notebook 和小模型做最便宜的实验先验证想法能不能成，再决定是否进入正式项目。
   - 产出：可行性结论、初步图表、研究日志条目
   - 工具：Jupyter、Cursor/Claude Code、聊天界面先手试提示
   - 时间：Perez 约 75% 的工作时间处于去风险模式；目标是几天内而不是几周内判断可行性。
   - 来源：<https://www.lesswrong.com/posts/6P8GYb4AjtPXx6LLB/tips-and-code-for-empirical-research-workflows> <https://www.lesswrong.com/posts/dZFpEdKyb9Bf4xYn7/tips-for-empirical-alignment-research>
5. **5 复现基线、搭实验**：把对比方法在自己环境里跑出论文数字；搭数据、评测和训练框架。
   - 产出：能跑的基线代码、基线结果表、差异说明
   - 工具：官方 GitHub 代码、Hugging Face、（已关停的）Papers with Code、给作者发邮件
   - 时间：Raff 独立复现 255 篇只成功 63.5%。来源未给单篇耗时。
   - 来源：<https://arxiv.org/abs/1909.06674> <https://www.cnblogs.com/noluye/p/14555088.html> <https://news.ycombinator.com/item?id=48443644>
6. **6 跑实验与记录**：排队跑主实验，夜里跑、早上看；把配置、指标、观察记进日志。
   - 产出：运行记录、指标表、带图的研究日志、周报
   - 工具：tmux、SSH 集群、W&B、Notion 数据库、Google Docs 日志、Slack 日更；近一年出现 autoresearch/ARIS 这类夜间智能体
   - 时间：Perez：项目绝大部分时间在执行阶段，单次实验控制在约 16 小时内。学界多数人只有 1–8 块 GPU，85% 无云预算。
   - 来源：<https://www.lesswrong.com/posts/dZFpEdKyb9Bf4xYn7/tips-for-empirical-alignment-research> <https://arxiv.org/abs/2410.23261> <https://github.com/karpathy/autoresearch> <https://www.cnblogs.com/pprp/p/14869872.html>
7. **7 分析与消融**：对结果保持怀疑，设计能区分不同解释的实验；补消融和稳健性检查。
   - 产出：消融表、失败案例分析、最终图表
   - 工具：pandas + notebook、绘图脚本（Carlini 自述近一年几乎每篇论文的初始实验代码都让 LLM 起草）
   - 时间：来源未给数字。LLM 调查显示数据清洗分析 69% 的研究者从不交给 LLM。
   - 来源：<https://www.lesswrong.com/posts/hjMy4ZxS5ogA9cTYK/how-i-think-about-my-research-process-explore-understand> <https://nicholas.carlini.com/writing/2024/how-i-use-ai.html> <https://arxiv.org/abs/2411.05025>
8. **8 写论文 / 技术报告**：压成 1–3 个主张，大纲→引言→全文迭代；写的过程中发现缺实验再回去补；核对引用。
   - 产出：论文 PDF、附录、checklist、代码发布
   - 工具：Overleaf、Zotero/BibTeX、LLM 润色、同事互审
   - 时间：Nanda：截稿前约一个月转入写作。Perez：对外写作 2–4 周以上。CS 论文中估计最高 17.5% 的内容经 LLM 改写。
   - 来源：<https://www.alignmentforum.org/posts/eJGptPbbFPZGLpjsp/highly-opinionated-advice-on-how-to-write-ml-papers> <https://arxiv.org/abs/2404.01268> <https://blog.iclr.cc/2026/03/31/a-retrospective-on-the-iclr-2026-review-process/>
9. **9 投稿、rebuttal、审稿**：投稿后等 3–4 份意见，一两周内补实验并逐条回应；同时自己被分配 4–6 篇去审。
   - 产出：rebuttal 文本和补充实验、自己写的审稿意见、camera-ready
   - 工具：OpenReview、ARIS 的 rebuttal/自动审稿流程、会议方的 AI 反馈
   - 时间：ICLR 2026 人均约 4.2 份审稿；HN 评论者称两周无偿审五篇。rebuttal 对边缘论文有效。
   - 来源：<https://blog.iclr.cc/2026/03/31/a-retrospective-on-the-iclr-2026-review-process/> <https://blog.neurips.cc/2025/09/30/reflections-on-the-2025-review-process-from-the-program-committee-chairs/> <https://arxiv.org/abs/2511.15462> <https://news.ycombinator.com/item?id=46181466>
10. **10 跟进后续工作**：看谁引用、谁超过、领域风向是否变；决定下一篇。
   - 产出：更新的 SOTA 表、下一课题的候选清单
   - 工具：Google Scholar 提醒、Hugging Face Trending Papers、X
   - 时间：没有找到一手描述；仅有关键词年更替 17% 和 PwC 关停两条间接证据。
   - 来源：<https://arxiv.org/abs/2505.04966> <https://blog.tib.eu/2025/10/02/papers-with-code-went-offline-the-knowledge-doesnt-have-to/>

## 需求

### 1. 当我为一个具体课题做文献调研/写 related work 时，我想把相关工作查全（含近两个月的并发 arXiv 论文和付费墙里的论文），以便不被审稿人指出漏引、也不白做别人做过的事。

- 证据强弱：强
- 谁：博士生、研究工程师、带学生的 PI（每个课题立项时和投稿前各一次）
- 痛在哪：量太大且每周在变：arXiv 2026 年 9 月单月 40,363 篇，cs.LG 单日列表 608 条；任何单一方法都查不全；通用 LLM 给的引用大量是编的。
- 多久一次：每个课题至少 2 次（立项、投稿前），rebuttal 时再补一次；每次数天到数周
- 现在怎么凑合：Google Scholar / Semantic Scholar 顺着引用上下游手工追；X 和同组口口相传；试 Deep Research / Undermind / Elicit 再人工核对；会议用两个月并发规则兜底。
- 缺口：没有一个工具能对一个课题给出可核对的覆盖度（查到了哪些、为什么判定相关、还缺哪类来源）；付费墙和领域小众文献是公开 deep research 工具的盲区。
- 证据：
  - 材料计算+ML 方向研究者实测 OpenAI/Gemini Deep Research 与半人工方法做一个细分方向综述：他事先认定的 43 篇相关论文，没有任何一种方法全部找到；深度研究工具漏掉领域小众和付费墙论文，结论是只能当起点。（Argonne 国家实验室研究者（博士，写过该方向综述）；practitioner；2025-02-09） <https://xiangyu-yin.com/content/post_deep_research.html>
  - arXiv 2026 年 9 月收到 40,363 篇投稿，两年翻倍（2024 年 9 月 20,569）；因此自 2026 年 10 月起每位提交者每月限 2 篇。（科技媒体报道，引 arXiv 编辑顾问委员会主席 Thomas Dietterich；news；2026-10-02） <https://www.theregister.com/ai-and-ml/2026/10/02/arxiv-imposes-rate-limit-on-paper-submissions-to-stem-the-ai-slop-tide/5300899>
  - arXiv cs.LG 在 2026-10-02 这一天的列表共 608 条，其中新提交 270 篇（本次打开页面直接读到）。（arXiv 官方列表页；industry-report；2026-10-02） <https://arxiv.org/list/cs.LG/new>
  - ICLR 2026 审稿指南规定：截稿前两个月内出现的论文算并发工作，作者可不比较，审稿人不能以此拒稿——会议不得不用规则承认没人能追上 arXiv。（ICLR 2026 官方审稿指南；industry-report；） <https://iclr.cc/Conferences/2026/ReviewerGuide>
  - 在科学文献问答上 GPT-4o 的引用 78–90% 是幻觉；专家在 70% 的情况下更偏好带检索的 OpenScholar-GPT4o 的回答而非专家手写答案（基准 2,967 个专家问题）。（UW / AI2 等研究团队论文；survey-or-study；2024-11-21） <https://arxiv.org/abs/2411.14199>
  - 厂商自称其文献搜索对最相关 20 篇的召回为 85%，而带搜索的前沿通用模型约 50%；一次搜索平均 2.9 分钟；Pro 版 16 美元/月（年付）。仅代表厂商认为查全是痛点。（Undermind 官网（厂商宣传）；vendor；） <https://www.undermind.ai/>

### 2. 当我的课题在进行中时，我想只被告知和我这个课题直接相关的新论文（撞车的、可当基线的、必须引用的），以便及时调整而不是每天刷一遍 arXiv。

- 证据强弱：强
- 谁：博士生、研究工程师、PI
- 痛在哪：泛泛的每日论文摘要已经泛滥且免费；真正缺的是按我的课题和主张来筛，并说明相关在哪里。兴趣有多条线时现有推荐也分不开。
- 多久一次：持续；课题周期内每天或每周
- 现在怎么凑合：arXiv 邮件列表 + X + Hugging Face papers + Scholar Inbox（免费）；自己 fork 开源每日论文脚本；让 AI 汇总多个来源。
- 缺口：按课题（而非按人）的长期记忆：我的假设、我的基线、我已读过什么；判断新论文与我的主张是冲突、重复还是可用。
- 证据：
  - Scholar Inbox（面向 ML/CV/机器人研究者的免费个性化论文推荐）约 23,000 注册用户，其中约 8,000 人近 30 天活跃；1,233 人用户调查显示研究者主要靠搜索引擎、预印本站和社交媒体发现论文，很少用其它推荐系统；用户批评它不能把不同研究兴趣分开建模。（图宾根大学 Andreas Geiger 组论文（含用户调查）；survey-or-study；2025-04-11） <https://arxiv.org/abs/2504.08385>
  - 中文开发者做的每日论文阅读器（抓 arXiv/OpenReview、DeepSeek 过滤、GitHub Actions 零服务器部署）有 939 star、861 fork——fork 数接近 star 数，说明多数人是拿去给自己跑一份。（GitHub 开源项目（个人开发者）；practitioner；） <https://github.com/ziwenhahaha/daily-paper-reader>
  - HN 上一个论文摘要信息流的帖子里，评论者要的是按研究兴趣和会议打标签过滤，另一位要的是跨学科的反信息茧房；没有人说缺的是更多摘要。（HN 评论者（开发者/研究读者）；practitioner；2025-12-02） <https://news.ycombinator.com/item?id=46119932>
  - HN 检索『keep up with papers』得到十余个论文摘要/信息流工具的 Show HN，绝大多数只有 1–4 分、0–2 条评论——供给很多，关注很少。（HN Algolia 搜索结果（本次打开）；practitioner；） <https://hn.algolia.com/api/v1/search?query=keep%20up%20with%20papers&tags=story&hitsPerPage=20&numericFilters=created_at_i%3E1672531200>
  - 一位评论者说他实际在用 AI 跨多个来源监控并汇总相关主题，用来减轻信息过载——是过滤器，不是深度综述。（HN 评论者 sangkwun；practitioner；2026-01-28） <https://news.ycombinator.com/item?id=46791551>

### 3. 当我选题或冒出一个 idea 时，我想快速知道它是否已被做过、可行性如何、值不值得投入几个月，以便不选错方向。

- 证据强弱：中
- 谁：博士生（尤其低年级）、独立研究者；PI 替学生把关
- 痛在哪：新颖性判断连专家都难；LLM 会把已有概念说成新的；真正的瓶颈是研究品味，需要多年培养。
- 多久一次：每个课题开始时；探索期每周数次
- 现在怎么凑合：问导师和同组（Neel Nanda 明确建议新人靠导师而不是自己做穷尽式文献调研）；先做小实验去风险；用 LLM 头脑风暴和挑刺。
- 缺口：可核对的新颖性检查：列出最接近的 5–10 篇并指出差别在哪；而不是给一个新颖/不新颖的结论。
- 证据：
  - 100 多位 NLP 研究者盲评：LLM 生成的研究想法被评为更新颖，但可行性略差；LLM 自评不可靠、想法多样性不足，且专家自己判断新颖性也很难。（斯坦福研究团队论文；survey-or-study；2024-09-06） <https://arxiv.org/abs/2409.04109>
  - 独立评测 Sakana 的 AI Scientist：文献综述薄弱，常把已有概念当成新发现；42% 的实验因代码错误失败；生成论文引用中位数仅 5 篇。（Siegen 大学 / NUS 研究者论文；survey-or-study；2025-02-20） <https://arxiv.org/abs/2502.14297>
  - 研究流程第一阶段是选题，新人应借助导师而不是独自做穷尽式文献综述；新人最常见的错误是还在探索期却以为自己在验证期。（Google DeepMind 机制可解释性团队负责人 Neel Nanda；practitioner；2025-04-26） <https://www.lesswrong.com/posts/hjMy4ZxS5ogA9cTYK/how-i-think-about-my-research-process-explore-understand>
  - 做研究工具的评论者认为瓶颈是研究品味——判断一个想法有用、新且做得出来——这需要多年；现在的 AI 产出多是凑数内容，但可以加速其它环节。（HN 评论者 eamag（研究工具开发者）；practitioner；2026-01-28） <https://news.ycombinator.com/item?id=46791551>
  - NeurIPS'24 上高年级博士生和博后普遍焦虑：就业路径变了，发表压力集中到大模型方向，做其它方向的人觉得被忽视——选题本身带着职业风险。（NYU 教授 Kyunghyun Cho；practitioner；2024-12-21） <https://kyunghyuncho.me/i-sensed-anxiety-and-frustration-at-neurips24/>

### 4. 当我面对一堆声称 SOTA 的论文时，我想判断哪些结果是真的、值得精读和当基线，以便不把时间花在站不住的工作上。

- 证据强弱：强
- 谁：博士生、研究工程师、审稿人
- 痛在哪：同行评审本身噪声大；低质量和 AI 生成论文挤占注意力；被接收的错误工作没有正式的纠错渠道；人人都说自己 SOTA。
- 多久一次：每周；选基线时集中发生
- 现在怎么凑合：看作者和机构、有没有代码、2025 年之前有没有成果；自己手工测；看 X 上同行的口碑。
- 缺口：针对单篇论文的可信度档案：是否有代码、是否被独立复现、对比设置是否公平、后续工作是否推翻。
- 证据：
  - arXiv 限流的理由：少数作者提交大量低质量论文，占掉了审核志愿者不成比例的时间。（arXiv 编辑顾问委员会主席（媒体转述）；news；2026-10-02） <https://www.theregister.com/ai-and-ml/2026/10/02/arxiv-imposes-rate-limit-on-paper-submissions-to-stem-the-ai-slop-tide/5300899>
  - Papers with Code 关停后，评论者抱怨做目标检测时人人都宣称 SOTA，只能自己手工测；原负责人说该站曾为领域带来结构和可复现性。（HN 评论者（含 PwC 原 Meta 负责人）；practitioner；2026-06-08） <https://news.ycombinator.com/item?id=48443644>
  - 立场论文：错误、有缺陷甚至造假的研究会被顶会接收，而 ML 会议没有系统性的纠错机制，因此建议设立反驳与批评赛道。（斯坦福等 14 位研究者（含 David Donoho、Sanmi Koyejo）；practitioner；2025-06-24） <https://arxiv.org/abs/2506.19882>
  - NeurIPS 2014 与 2021 的一致性实验显示 16–23% 的论文换一组审稿人结果就会反过来；ICLR 前 20 研究关键词平均每年换掉 17%。（KAIST 等研究者立场论文（引用官方实验）；survey-or-study；2025-05-08） <https://arxiv.org/abs/2505.04966>
  - 一位学者自述今年夏天写了四篇论文，但每篇的实质内容只够写一段——合同期限和 KPI 逼着拆分发表；另一位评论者干脆默认 2025 年前没有成果的作者不看。（HN 评论者 okaleniuk（学术研究者）、SwellJoe；practitioner；2026-09-01） <https://news.ycombinator.com/item?id=49517928>

### 5. 当我需要某个任务/数据集上的最新最好结果和可比设置时，我想有一张带出处、带代码链接、持续更新的结果表，以便选基线和写实验对比。

- 证据强弱：中
- 谁：博士生、研究工程师
- 痛在哪：Papers with Code 2025 年被关停并跳转到 Hugging Face，按论文聚合的排行榜没了；替代品零散。
- 多久一次：每个课题选基线时、写实验章节时、rebuttal 被要求补对比时
- 现在怎么凑合：Hugging Face Trending Papers；翻各论文的表格自己抄一张 Excel；社区复活站和 ORKG；手工重测。
- 缺口：属于自己课题的、可追溯到论文表格和设置的 SOTA 表，不依赖某个随时可能下线的公共站点。
- 证据：
  - Papers with Code 2025 年突然下线并跳转到 GitHub/Hugging Face；TIB 研究者称其曾提供跨平台、以论文为中心的排行榜，并呼吁把结果贡献到开放知识图谱 ORKG（其 2021 年导入过 PwC 基准）。（德国 TIB（莱布尼茨科技信息中心）研究者；practitioner；2025-10-02） <https://blog.tib.eu/2025/10/02/papers-with-code-went-offline-the-knowledge-doesnt-have-to/>
  - 社区复活 Papers with Code 的帖子在 HN 得到 206 分、46 条评论；评论者怀念能一眼看到各方向 SOTA，现在只能直接翻 arXiv、缺少领域概览。（HN 评论者；practitioner；2026-06-08） <https://news.ycombinator.com/item?id=48443644>
  - 用户在官方数据仓库提 issue：站点跳转到 Hugging Face 后，Trending Papers 是否算合格替代存疑，认为这是对社区的严重损害。（GitHub 用户 Dereklvlv；practitioner；2025-08-14） <https://github.com/paperswithcode/paperswithcode-data/issues/116>

### 6. 当我要把一篇论文当基线时，我想在自己的环境里把它的数字跑出来（或明确知道差在哪），以便我的对比站得住。

- 证据强弱：强
- 谁：博士生、研究工程师（复现通常落在最年轻的人身上）
- 痛在哪：论文省略关键细节和超参、代码有 bug 或质量差、作者不回邮件；复现失败时不知道是自己错还是论文错。
- 多久一次：每个课题 2–5 个基线；每个数天到数周
- 现在怎么凑合：逐行对照官方代码、固定随机种子逐步对齐输出、发邮件问作者、在 GitHub issue 里找同病相怜的人。
- 缺口：把复现过程自动化并留下差异报告：环境、命令、得到的数字与论文数字的差、可能原因。
- 证据：
  - 一位研究者不看作者代码、独立实现 255 篇 ML 论文，成功复现 162 篇（63.5%）；整个研究（选论文、记录特征）花了约 6 个月。（Booz Allen Hamilton / UMBC 研究者 Edward Raff（NeurIPS 2019）；survey-or-study；2019-09-14） <https://arxiv.org/abs/1909.06674>
  - 复现不出来的常见原因：实现里不报错的 bug、论文为可读性省略细节、术语不统一、超参没解释、代码或数据缺失；建议逐行核对并把复现当作基本功。中文博客专门翻译此文，说明国内读者有同样的痛。（动画与深度学习研究者 Daniel Holden（博客园译文）；practitioner；2021-04-28） <https://www.cnblogs.com/noluye/p/14555088.html>
  - 评论者认为没有代码的论文应被直接拒稿；另一位说因为人人都宣称 SOTA，只能自己手工测。（HN 评论者；practitioner；2026-06-08） <https://news.ycombinator.com/item?id=48443644>
  - AI Scientist 自动跑的实验 42% 因代码错误失败，其余也有产出误导结果的——让智能体独立复现目前不能不看着。（独立评测论文；survey-or-study；2025-02-20） <https://arxiv.org/abs/2502.14297>

### 7. 当我同时跑几十上百个实验时，我想让每次实验的目的、配置、结果、结论都被记下来并能回溯，以便几周后写论文和 rebuttal 时还能复现当时的数字。

- 证据强弱：强
- 谁：博士生、研究工程师、带组的 mentor
- 痛在哪：实验跑完就忘了当时想验证什么；用时间戳文件夹和零散笔记，结果混乱无法分析和回溯。
- 多久一次：每天
- 现在怎么凑合：Google Docs 研究日志（贴图加观察）、Notion 实验数据库、带日期的实验文件夹、W&B（学术免费）、Slack 每日更新、yaml+logging。
- 缺口：工具只记指标，不记意图和结论；把运行记录、图和当时的判断自动汇成一份可读的研究日志和周报，仍靠人手。
- 证据：
  - 他在 Google Docs 里维护滚动的研究日志，结果一出来就贴图和观察；区分自己看的非正式日志和给别人看的整理版。（Anthropic 对齐研究员 Ethan Perez；practitioner；2024-02） <https://www.lesswrong.com/posts/dZFpEdKyb9Bf4xYn7/tips-for-empirical-alignment-research>
  - 团队用带日期的实验文件夹和编号脚本（便于 rebuttal 时重跑）、Notion 数据库登记实验、Slack 每日更新、W&B 跟踪微调；结果导出为带全部元数据的 JSONL。（独立对齐研究者 John Hughes 与 Ethan Perez（MATS 导师）；practitioner；2025-01-20） <https://www.lesswrong.com/posts/6P8GYb4AjtPXx6LLB/tips-and-code-for-empirical-research-workflows>
  - 中文作者自述：比赛期间实验记录很糟，结果混乱、无法有效分析和回溯，跑完连实验目的都记不清；之前靠时间戳文件夹加有道云笔记和纸本，后来改用 argparse/yaml/logging 和结构化目录。（博客园作者 pprp（深度学习方向学生）；practitioner；2021-06-10） <https://www.cnblogs.com/pprp/p/14869872.html>
  - W&B（现价格页在 CoreWeave 名下）对学生、教授、博后的学术研究永久免费，含 200GB 存储；商业 Pro 版 60 美元/月起。（厂商价格页；vendor；） <https://coreweave.com/forge-pricing>

### 8. 当我只有几块 GPU 时，我想让实验在夜里和周末不间断地排队跑、失败自动重试、早上直接看结果，以便不浪费算力和我的白天。

- 证据强弱：强
- 谁：高校博士生和硕士生（算力最紧）、小团队研究工程师
- 痛在哪：多数学者只有 1–8 块 GPU、没有云预算；长实验挂了要到第二天才发现；迭代一慢整个课题就慢。
- 多久一次：每天（课题执行期）
- 现在怎么凑合：把单次实验压到一夜以内；tmux 挂后台；先在小模型单卡上试；让 Claude Code 之类的智能体夜里自己改代码跑实验。
- 缺口：无人值守时的可靠性（卡死只报警不重启）、对结果的独立审计、以及不把算力浪费在没价值的实验上。
- 证据：
  - 对 35 个机构 50 位研究者（约六成博士生）的调查：多数人能用 1–8 块 GPU、数天到数周；66% 对学校算力满意度不超过 3 分（5 分制）；85% 的人云算力预算为零；多数人表示若有硬件会跑更贵的实验。（Brown 大学研究团队论文；survey-or-study；2024-10-30） <https://arxiv.org/abs/2410.23261>
  - 主张单次实验控制在约 16 小时内，形成晚上跑、早上分析的节奏；项目绝大部分时间花在执行阶段，瓶颈是把想法快速实现出来的速度。（Anthropic 对齐研究员 Ethan Perez；practitioner；2024-02） <https://www.lesswrong.com/posts/dZFpEdKyb9Bf4xYn7/tips-for-empirical-alignment-research>
  - Karpathy 的 autoresearch：让智能体在单块 GPU 上通宵自主做实验——改训练代码、训练 5 分钟、指标变好就保留否则丢弃、循环；人只维护一份说明文件。仓库 97.3k star、13.5k fork。（Andrej Karpathy（GitHub 开源项目）；practitioner；） <https://github.com/karpathy/autoresearch>
  - ARIS（睡觉时让 Claude Code 做科研）：睡前启动，早上看到论文被打分、弱点被找出、实验已跑；17k star、1.4k fork，支持 SSH 任务队列和 GPU 集群；作者自述内置看门狗只报警不自动重启，关键决策点保留人工审批。（中文开发者 wanshuiyin（GitHub 开源项目）；practitioner；2026-09-28） <https://github.com/wanshuiyin/Auto-claude-code-research-in-sleep>

### 9. 当结果基本齐了、离截稿还有一个月时，我想把结果压成 1–3 个主张、理出叙事、写出初稿并发现还缺哪些实验，以便赶上截稿且写得让人看懂。

- 证据强弱：强
- 谁：博士生（第一作者）、PI（改稿）
- 痛在哪：写作要 2–4 周以上，写的过程中才发现缺实验；非英语母语者语言负担重；直接让 LLM 写又被视为有风险。
- 多久一次：每篇论文一次，持续 2–4 周；一年 1–4 次
- 现在怎么凑合：Overleaf 协作；先列要点大纲再扩写；找同事互换论文提意见；用 LLM 改语法和克服开头卡壳（不直接照抄）。
- 缺口：从实验日志到图表和结果段落的整理；对照主张检查证据是否齐全；这些仍是手工。
- 证据：
  - 建议在截稿前约一个月转入提炼和写作；先把研究压缩成 1–3 个具体主张；卡壳时可把大纲和相关论文给 LLM 生成草稿，但不要直接搬进论文。（Google DeepMind 研究负责人 Neel Nanda；practitioner；2025-05-12） <https://www.alignmentforum.org/posts/eJGptPbbFPZGLpjsp/highly-opinionated-advice-on-how-to-write-ml-papers>
  - 对外写作通常要 2–4 周以上，部分原因是写清楚结果时才发现缺实验。（Anthropic 对齐研究员 Ethan Perez；practitioner；2024-02） <https://www.lesswrong.com/posts/dZFpEdKyb9Bf4xYn7/tips-for-empirical-alignment-research>
  - 816 位论文作者调查（40% 为计算机方向）：81% 已在研究流程中用 LLM；最常见是信息查找（49% 至少偶尔用）和编辑润色（45%）；数据清洗分析 69% 从不用、数据生成 73% 从不用；直接写作被评为中等风险，数据类任务风险最高；非英语母语和初级研究者用得更多。（UW / AI2 研究团队调查；survey-or-study；2024-10-30） <https://arxiv.org/abs/2411.05025>
  - 对 950,965 篇论文的统计估计：计算机科学论文中被 LLM 明显改写的内容最高达 17.5%，数学和 Nature 系期刊最高 6.3%；更常发预印本、领域更拥挤、篇幅更短的论文比例更高。（斯坦福研究团队论文；survey-or-study；2024-04-01） <https://arxiv.org/abs/2404.01268>

### 10. 当我提交论文前，我想确认每一条参考文献真实存在、作者和出处无误、并且确实支持我引用它的那句话，以便不因为假引用被直接拒稿或丢人。

- 证据强弱：强
- 谁：所有作者；PI 尤其在意（署名风险）
- 痛在哪：Google Scholar 导出的 BibTeX 本身就常错；赶截稿时用 LLM 补元数据会编造；审稿人不核对引用；ICLR 2026 已对确认的虚构引用直接拒稿。
- 多久一次：每篇论文投稿前一次；每篇 30–100 条引用
- 现在怎么凑合：手工多源反复核对 bib；默认信任合作者；事后被 GPTZero 之类扫出来。
- 缺口：逐条核对存在性、元数据和论点支撑的自动检查——且检查器自己不能幻觉。
- 证据：
  - ICLR 2026 用自动系统检测引用不存在文献的投稿，经 AC 和 PC 人工复核后，所有确认含虚构引用的论文被直接拒稿；同时要求披露 LLM 使用。（ICLR 2026 程序主席官方复盘；industry-report；2026-03-31） <https://blog.iclr.cc/2026/03/31/a-retrospective-on-the-iclr-2026-review-process/>
  - 扫描 NeurIPS 2025 已接收的 4,841 篇论文，在 51–53 篇里确认了 100 多条幻觉引用（真标题配假作者、不存在的 arXiv 号等）。检测方是卖检测服务的厂商。（GPTZero（厂商调查）；vendor；2026-01-21） <https://gptzero.me/news/neurips/>
  - 一位评论者说自己花了大量时间、用多个来源反复核对来整理参考文献库；另两位指出 Google Scholar 的 BibTeX 会把编辑当作者、文章类型错、缺作者。（HN 评论者 dekhn、m-schuetz、jmmcd（研究者）；practitioner；2026-01） <https://news.ycombinator.com/item?id=46720395>
  - 审稿人说自己通常不逐条核对引用，默认作者诚信；另一位指出更大的问题是作者歪曲被引论文实际支持的内容，核对这个比查假引用费时得多；有人提议用 LLM 检查引用是否支撑论点，也有人提醒 LLM 的核对结果自己也会幻觉。（HN 评论者 andy99（审稿人）、ulrashida、bossyTeacher 等；practitioner；2025-12-07） <https://news.ycombinator.com/item?id=46181466>
  - 用户研究发现研究者用 LLM 查相关工作时有三个反复出现的缺口：不信任输出、持续的核对负担、要在多个工具之间来回倒。（Notre Dame / IBM Research 等研究者论文；survey-or-study；2025-12-12） <https://arxiv.org/abs/2512.11661>

### 11. 当论文快要投出去时，我想先拿到一份像样的审稿意见（技术错误、缺的实验、checklist 不合规处），以便在真审稿人看到之前改掉。

- 证据强弱：强
- 谁：博士生、没有资深合作者把关的小组
- 痛在哪：真审稿像抽签；导师没时间细看；自己看不出自己的盲点。
- 多久一次：每篇论文投稿前 1–3 轮
- 现在怎么凑合：同事互换论文；会议官方的 LLM checklist 助手；ARIS 的跨模型自动审稿循环；各种 AI 模拟审稿网站。
- 缺口：AI 审稿善于找技术错误，但缺大局判断；自查工具有约四成用户反馈不准确或过严。
- 证据：
  - NeurIPS 2024 官方实验：234 篇论文用了 LLM checklist 助手；超过 70% 的作者觉得有用并打算据此修改；52 位回答者里 20 位抱怨不准确、14 位抱怨过严；对抗性 LLM 能在 15 个问题里的 14 个上骗过它。（NeurIPS 2024 组织者官方博客；survey-or-study；2024-12-10） <https://blog.neurips.cc/2024/12/10/results-of-the-neurips-2024-experiment-on-the-usefulness-of-llms-as-an-author-checklist-assistant-for-scientific-papers/>
  - AAAI-26 给全部 22,977 篇进入完整评审的论文各生成一份 AI 审稿意见，不到一天完成；作者和程序委员在技术准确性和研究建议等维度上更偏好 AI 意见。（AAAI-26 组织者论文；survey-or-study；2026-04-15） <https://arxiv.org/abs/2604.13940>
  - 同一试点的问卷回收 5,834 份：53.9% 认为 AI 审稿有帮助、20.2% 认为没帮助；单篇成本不到 1 美元；被指出的缺点是缺乏大局观、容易钻牛角尖、领域积累浅。（机器之心报道（36氪转载）；news；2026-04-19） <https://www.36kr.com/p/3773078234268168>
  - 港科大（广州）机器人方向博士生的项目笔记：ARIS 的要点是执行模型和审稿模型分开、预算和超时写死、技能之间用文件交接、贵的决定留人工检查点；但它保证不了想法本身重要，也保证不了叙事诚实而不只是漂亮。（HKUST(GZ) 博士生 Lixin Xu；practitioner；2026-03-14） <https://davidlxu.github.io/posts/2026/03/aris-project-notes/>

### 12. 当我被分到 4–6 篇论文要在两三周内审完时，我想更快看懂每篇的主张、查它和已有工作的关系、把意见写具体，以便尽到责任又不占掉自己的研究时间。

- 证据强弱：强
- 谁：博士生（投稿即须审稿）、博后、教师
- 痛在哪：无偿、时间短、数量大；隐蔽使用 LLM 既违规又招作者反感；不披露使用 LLM 可能连累自己的论文被拒。
- 多久一次：每年 2–4 个审稿周期，每次 4–6 篇
- 现在怎么凑合：相当一部分人已在用 LLM（披露或不披露）；会议方给审稿人提供 AI 反馈；拖到截止前赶。
- 缺口：合规且保密的辅助：在不把未发表稿件交给第三方的前提下查相关工作、核对论文里的数字和引用。判断本身不能外包。
- 证据：
  - ICLR 2026：19,525 篇有效投稿、18,054 名审稿人、76,139 份审稿意见（人均约 4.2 份）；会议对所有投稿和审稿跑自动检测，并遭遇 OpenReview 身份泄露事件。（ICLR 2026 程序主席官方复盘；industry-report；2026-03-31） <https://blog.iclr.cc/2026/03/31/a-retrospective-on-the-iclr-2026-review-process/>
  - NeurIPS 2025 主会 21,575 篇有效投稿（2020 年 9,467）、20,518 名审稿人、1,663 名 AC；主席承认出现审稿人疲劳，有人为了结束来回讨论而抬分；11 例严重失职审稿人自己的论文被拒。（NeurIPS 2025 程序主席官方博客；industry-report；2025-09-30） <https://blog.neurips.cc/2025/09/30/reflections-on-the-2025-review-process-from-the-program-committee-chairs/>
  - 评论者指出 ICLR 审稿人被要求两周内无偿审五篇，还要兼顾教学和研究，逐条核对引用不现实。（HN 评论者 bjourne；practitioner；2025-12） <https://news.ycombinator.com/item?id=46181466>
  - ICLR 2024、NeurIPS 2023 等会议的审稿文本中估计 6.5%–16.9% 被 LLM 明显改写；这类文本更多出现在自信度低、临近截止提交、不参与 rebuttal 的审稿里。（斯坦福研究团队论文；survey-or-study；2024-03-11） <https://arxiv.org/abs/2403.07183>
  - ICLR 2026 有 21% 的审稿意见被检测为完全由 AI 生成，数十位学者在社交媒体上投诉幻觉引用和又长又空的意见（正文付费墙，只读到标题和导语）。（Nature 新闻；news；2025-11-27） <https://www.nature.com/articles/d41586-025-03506-6>
  - ICLR 2025 随机对照：2 万多份审稿收到可选的 AI 反馈，收到的人中 27% 修改了审稿，采纳了 1.2 万多条建议，修改后的审稿更长、更有信息量，rebuttal 讨论也更投入。（斯坦福 James Zou 组与 ICLR 组织者论文；survey-or-study；2025-04-13） <https://arxiv.org/abs/2504.09737>
  - 华中科大团队认为审稿打分尺度差异逐年变大，投稿体验越来越像「抽卡游戏」。（新智元报道，转述华中科技大学李钦宾团队；news；2026-07-20） <https://hub.baai.ac.cn/view/56471>

### 13. 当审稿意见下来、只有一两周 rebuttal 时，我想快速把每条意见归类、重跑或补跑被要求的实验、逐条写出有数字支撑的回应，以便把边缘分拉过线。

- 证据强弱：中
- 谁：博士生（第一作者）
- 痛在哪：时间极短；要重跑几个月前的实验；回应里一旦有编造的数字后果严重；审稿人疲劳后未必认真看。
- 多久一次：每篇论文每次投稿一次，1–2 周
- 现在怎么凑合：靠当初规整的实验文件夹重跑；套 rebuttal 模板；ARIS 之类带事实核对关口的 rebuttal 流程。
- 缺口：把审稿意见映射到已有实验记录（哪条已有证据、哪条要新跑）并排出补实验计划。
- 证据：
  - 分析 ICLR 2024 和 2025 的 rebuttal 前后分数：rebuttal 对边缘论文确实能改变结果；初始分数和同组其它审稿人的打分是分数变化最强的预测因素。（慕尼黑大学等研究者论文；survey-or-study；2025-11-19） <https://arxiv.org/abs/2511.15462>
  - 主席观察到作者 rebuttal 越来越积极，审稿人出现疲劳；AC 在评审后提出新问题时作者没有机会回应。（NeurIPS 2025 程序主席官方博客；industry-report；2025-09-30） <https://blog.neurips.cc/2025/09/30/reflections-on-the-2025-review-process-from-the-program-committee-chairs/>
  - 他们规定实验文件夹命名和脚本编号的一个明确理由，就是 rebuttal 时能方便地重跑。（John Hughes 与 Ethan Perez；practitioner；2025-01-20） <https://www.lesswrong.com/posts/6P8GYb4AjtPXx6LLB/tips-and-code-for-empirical-research-workflows>
  - ARIS 把 rebuttal 起草做成独立流程，并加了造假检测关口和策略需人工批准的环节——用户已经在把这件事交给智能体起草。（ARIS 中文说明（开发者 wanshuiyin）；practitioner；） <https://github.com/wanshuiyin/Auto-claude-code-research-in-sleep/blob/main/README_CN.md>

### 14. 当我精读一批论文时，我想把读到的方法、局限和可借鉴之处沉淀成能被日后写作和实验直接调用的笔记，以便不是读完就忘、写 related work 时再重读一遍。

- 证据强弱：中
- 谁：博士生、研究工程师
- 痛在哪：文献越来越多、笔记越来越散；工具链（Zotero、Obsidian、各种插件）自己搭、容易越搭越复杂。
- 多久一次：每周
- 现在怎么凑合：Zotero 存 PDF 和批注 + Obsidian 写主题笔记；只给当前课题相关的论文写笔记；把 Zotero 库通过 MCP 接给 AI 查询；看李沐的逐段精读视频学方法。
- 缺口：笔记与课题的假设、实验、论文草稿之间没有打通；理解本身研究者不愿外包。
- 证据：
  - 计算机视觉研究者的流程：Google Scholar 和 Research Rabbit 找论文，Zotero 按任务和方法打标签并用颜色批注（问题/方法/局限），再导入 Obsidian，用画布按研究问题归纳；自述痛点是笔记越积越多难管理。（CV/深度学习研究者 Lucas Mercier；practitioner；2024-01-24） <https://www.lucasmercier.me/blog/research_workflow>
  - 中文博主搭 Zotero+Obsidian 的原因是文献越来越多、笔记越来越散；教训是别一开始装太多插件、别每篇都写长笔记，只给当前项目相关或要反复读的论文建笔记。（个人博客作者 ptyybb；practitioner；2026-05-06） <https://tinytka.github.io/2026/05/06/%E6%9C%AC%E5%9C%B0%E6%90%AD%E5%BB%BA%E4%B8%AA%E4%BA%BAzotero-Obsidian%E5%B7%A5%E4%BD%9C%E6%B5%81/>
  - 一位（非 AI 方向的）工科博士生把本地 Zotero 库通过 MCP 接给 AI 查方法细节、让 AI 写数值求解器和验证脚本，但坚持公式自己推、物理解释自己做——认为把理解外包就失去了读博的意义。（机械工程博士生 Anderson Nunes（巴西/德国联培）；practitioner；2026-09-17） <https://adsnunes.github.io/2026/09/17/how-i-use-ai-in-my-phd/>
  - 李沐的深度学习论文逐段精读仓库有 33.9k star——中文研究者对把论文读深这件事有大量需求，而不是只要摘要。（李沐（GitHub 仓库）；practitioner；） <https://github.com/mli/paper-reading>

### 15. 当我的论文发出去之后，我想知道谁在跟进、谁超过了我的数字、谁指出了我的问题，以便决定下一篇做什么和要不要更新结论。

- 证据强弱：弱
- 谁：博士生、PI
- 痛在哪：领域关键词一年换掉近两成；公共排行榜下线后没有地方看谁超过了我。
- 多久一次：每篇论文发表后持续数月
- 现在怎么凑合：Google Scholar / Semantic Scholar 引用提醒；X；等别人来告诉自己。
- 缺口：本次没有找到直接描述这件事的一手叙述，只能从并发规则、关键词更替和 PwC 关停间接推断；是否真是痛点需要访谈确认。
- 证据：
  - ICLR 关键词分析：前 20 个研究关键词平均每年有 17% 被换掉；ICLR 2025 投稿一年增长 59.8%。（KAIST 等研究者立场论文；survey-or-study；2025-05-08） <https://arxiv.org/abs/2505.04966>
  - PwC 下线后研究者失去了跨平台、以论文为中心的排行榜，无法方便地看到谁刷新了某个基准。（TIB 研究者；practitioner；2025-10-02） <https://blog.tib.eu/2025/10/02/papers-with-code-went-offline-the-knowledge-doesnt-have-to/>

## 工具与花费

| 工具 | 用来做什么 | 价格 | 谁付钱 | 抱怨 | 来源 |
|---|---|---|---|---|---|
| Zotero | 文献库、PDF 批注、BibTeX 导出 | 软件免费；同步存储 2GB 20 美元/年、6GB 60 美元/年、不限量 120 美元/年 | 个人 | 和笔记、写作之间靠插件拼接，容易越搭越复杂 | <https://www.zotero.org/storage> |
| Overleaf | 论文协作写作（LaTeX） | 免费版只能 1 位协作者；学生版 8.25 美元/月（年付）；标准版 16.75 美元/月；Pro 33.25 美元/月 | 个人或学校机构订阅 | 免费版协作和历史记录受限 | <https://www.overleaf.com/user/subscription/plans> |
| Weights & Biases（价格页现在 CoreWeave 名下） | 实验指标跟踪 | 学术研究永久免费（200GB）；商业 Pro 60 美元/月起 | 学术用户不花钱 | 只记指标，不记实验意图和结论（由多位从业者另用 Google Docs/Notion 记日志可见） | <https://coreweave.com/forge-pricing> |
| Scholar Inbox | ML/CV/机器人方向个性化论文推荐 | 学术项目，免费使用（价格页未单独核对） | 无 | 不能把多个研究兴趣分开建模 | <https://arxiv.org/abs/2504.08385> |
| Undermind | 针对一个问题的文献深搜 | 免费版；Pro 16 美元/月（年付）；团队 15 美元/人/月 | 个人 | 未找到用户抱怨；召回数字为厂商自测 | <https://www.undermind.ai/> |
| Elicit | 文献筛选、数据抽取、研究报告 | 基础免费；Pro 49 美元/月；Scale 169 美元/月 | 个人或课题组 | 未打开到 ML 研究者的使用评价 | <https://elicit.com/pricing> |
| ChatGPT / Gemini Deep Research | 综述起点、头脑风暴 | 实测者用的是 ChatGPT Pro 和 Gemini Advanced；本次未核对价格 | 个人 | 漏领域小众和付费墙论文、不同次运行结果不稳定 | <https://xiangyu-yin.com/content/post_deep_research.html> |
| Cursor / Claude Code / Codex | 写实验代码、画图、跑脚本、夜间自动实验 | Cursor 个人版 20 美元/月；Claude Code、Codex 价格本次未核对 | 个人；工业界由公司付 | 自动跑的实验需要独立审计；Anthropic 内部调查多数人认为只能完全放手 0–20% 的工作 | <https://cursor.com/pricing> |
| ARIS / autoresearch（开源技能与脚本） | 睡觉时让智能体跑想法→文献→实验→写作→审稿循环 | 免费；需自备两个模型家族的订阅或 API，以及 GPU | 个人 | 卡死只报警不重启；保证不了想法重要和叙事诚实 | <https://github.com/wanshuiyin/Auto-claude-code-research-in-sleep> |
| Hugging Face Trending Papers / 社区复活版 Papers with Code / ORKG | 看热门论文、查基准结果 | 免费 | 无 | 不等于原来以论文为中心的排行榜；用户怀疑是否算合格替代 | <https://github.com/paperswithcode/paperswithcode-data/issues/116> |
| Google Docs / Notion / Slack | 研究日志、实验登记表、每日更新 | 未核对 | 个人或机构 | 全靠手工维护 | <https://www.lesswrong.com/posts/6P8GYb4AjtPXx6LLB/tips-and-code-for-empirical-research-workflows> |
| 学校 GPU 集群 / 自租 GPU（AutoDL 等） | 跑实验 | 调查中 85% 的学者云预算为零；AutoDL 页面价格本次未能读到 | 学校或导师经费；国内学生自费租卡的情况只在未能打开的知乎页面里看到线索 | 66% 对学校算力满意度不超过 3/5 | <https://arxiv.org/abs/2410.23261> |
| GPTZero 引用幻觉检测 | 扫描论文里的虚构引用 | 未核对 | 会议方或个人 | HN 上有研究者认为其个案夸大、带产品推销目的 | <https://gptzero.me/news/neurips/> |

## 数字

- arXiv 2026 年 9 月投稿 40,363 篇；2024 年 9 月 20,569 篇；2016 年 9 月 9,869 篇；2026 年 10 月起每位提交者每月限 2 篇（news） <https://www.theregister.com/ai-and-ml/2026/10/02/arxiv-imposes-rate-limit-on-paper-submissions-to-stem-the-ai-slop-tide/5300899>
- arXiv cs.LG 2026-10-02 单日列表 608 条，其中新提交 270 篇（industry-report） <https://arxiv.org/list/cs.LG/new>
- NeurIPS 2025 主会：21,575 篇有效投稿、接收 5,290 篇（24.52%）、20,518 名审稿人、1,663 名 AC、199 名 SAC；2020 年投稿 9,467 篇（industry-report） <https://blog.neurips.cc/2025/09/30/reflections-on-the-2025-review-process-from-the-program-committee-chairs/>
- ICLR 2026：19,525 篇有效投稿、779 篇直接拒稿、5,042 篇撤稿、76,139 份审稿、18,054 名审稿人、接收率 27.4%（industry-report） <https://blog.iclr.cc/2026/03/31/a-retrospective-on-the-iclr-2026-review-process/>
- AAAI-26：近 29,000 篇投稿、约 20,000 篇来自中国、超过 75,000 名作者、程序委员会超过 28,000 人（industry-report） <https://aaai.org/proceeding/aaai-40-2026/>
- AAAI-26 AI 审稿试点：22,977 篇论文不到一天审完；问卷 5,834 份，53.9% 认为有帮助、20.2% 认为没帮助；单篇不到 1 美元（survey-or-study） <https://www.36kr.com/p/3773078234268168>
- ICLR 2026 有 21% 的审稿意见被检测为完全由 AI 生成（Nature 标题与导语）（news） <https://www.nature.com/articles/d41586-025-03506-6>
- AI 会议审稿文本中 6.5%–16.9% 被 LLM 明显改写（ICLR 2024、NeurIPS 2023、CoRL 2023、EMNLP 2023）（survey-or-study） <https://arxiv.org/abs/2403.07183>
- 816 位研究者中 81% 已用 LLM；信息查找 49%、编辑 45% 至少偶尔用；数据清洗分析 69% 从不用、数据生成 73% 从不用（survey-or-study） <https://arxiv.org/abs/2411.05025>
- CS 论文中估计最高 17.5% 的内容经 LLM 改写（样本 950,965 篇）（survey-or-study） <https://arxiv.org/abs/2404.01268>
- 独立复现 255 篇 ML 论文，成功 162 篇（63.5%）（survey-or-study） <https://arxiv.org/abs/1909.06674>
- 35 个机构 50 位学者：多数只有 1–8 块 GPU；85% 云预算为零；66% 对学校算力满意度不超过 3/5（survey-or-study） <https://arxiv.org/abs/2410.23261>
- Scholar Inbox 约 23,000 注册用户、约 8,000 月活；用户调查 1,233 人（survey-or-study） <https://arxiv.org/abs/2504.08385>
- GPT-4o 在科学文献问答中 78–90% 的引用为幻觉（survey-or-study） <https://arxiv.org/abs/2411.14199>
- GPTZero 在 NeurIPS 2025 的 4,841 篇已接收论文中确认 51–53 篇含 100 多条幻觉引用（厂商数据）（vendor） <https://gptzero.me/news/neurips/>
- NeurIPS 2024 LLM checklist 助手：234 篇论文参与，超过 70% 作者认为有用；52 位回答者中 20 位反馈不准确（survey-or-study） <https://blog.neurips.cc/2024/12/10/results-of-the-neurips-2024-experiment-on-the-usefulness-of-llms-as-an-author-checklist-assistant-for-scientific-papers/>
- ICLR 2025：2 万多份审稿收到 AI 反馈，27% 的审稿人据此修改，采纳 1.2 万多条建议（survey-or-study） <https://arxiv.org/abs/2504.09737>
- AI Scientist 评测：42% 的实验因代码错误失败；每篇论文成本 6–15 美元、人工介入 3.5 小时（survey-or-study） <https://arxiv.org/abs/2502.14297>
- Anthropic 内部：132 人调查，自述 59% 的日常工作用 Claude、生产率提升约 50%，但多数人只能完全放手 0–20% 的工作（厂商内部研究）（vendor） <https://www.anthropic.com/research/how-ai-is-transforming-work-at-anthropic>
- autoresearch 97.3k star；ARIS 17k star；李沐论文精读 33.9k star；daily-paper-reader 939 star / 861 fork（均为本次打开时页面显示）（practitioner） <https://github.com/karpathy/autoresearch>
- NeurIPS 一致性实验：16–23% 的论文换一组审稿人结论会反转；ICLR 2025 投稿一年增长 59.8%；前 20 关键词年更替 17%（survey-or-study） <https://arxiv.org/abs/2505.04966>
- AI 论文数 2013–2023 年从约 10.2 万增至 24.2 万以上，占计算机论文的比例从 21.6% 升到 41.8%（industry-report） <https://hai.stanford.edu/ai-index/2025-ai-index-report/research-and-development>

## 可以交给 AI 的、只能协助的、不会交出去的

【可以整件交给一位长期在岗的 AI 同事的】共同点是：结果可逐条点开核对、机械、重复、出错代价高但判断含量低。
1) 课题级文献雷达：同事记住这个课题的主张、基线和已读清单，定时查 arXiv / OpenReview / Semantic Scholar，并用用户已登录的图书馆账号读付费墙论文，只报撞车的、可当基线的、必须引用的，每条附出处和理由。依据：泛摘要已免费泛滥（Scholar Inbox、十余个 HN 工具），缺的是按课题筛；公开 deep research 工具漏付费墙和小众文献（Xiangyu Yin）。持久记忆 + 自己的文件夹 + 用户登录态，正好是现有工具没有的三样。
2) 参考文献核对：逐条确认存在、元数据正确、找到被引论文里支撑该句的段落。依据：ICLR 2026 对虚构引用直接拒稿；审稿人不核对；研究者自述手工核对极费时。必须做成每条给原文链接，否则核对器自己幻觉（HN 评论者已指出）。
3) SOTA / 基线结果表：每个基准一行，数字、设置、论文表格位置、代码链接，持续更新。依据：Papers with Code 关停后的空缺。
4) 实验台账和研究日志：从运行目录 / W&B 页面把配置、指标、图汇成表和带日期的日志，写周报初稿。依据：Perez、Hughes、pprp 都在手工做这件事。前提是同事能读到实验所在的机器或网页。
5) 投稿前的机械检查：checklist、匿名化、格式、图表编号、数字前后一致。

【只能协助、人必须把关的】
- 文献综述和 related work 起草：可以给初稿和对比表，但覆盖度和表述要人核（没有方法能查全；GPT-4o 引用幻觉 78–90%）。
- 复现基线：同事可以搭环境、跑、出差异报告；差异原因的判断归人（AI Scientist 42% 实验因代码错误失败）。
- 夜间排队跑实验和消融：人定实验清单和预算，同事执行、失败重试、早上交结果表。autoresearch 和 ARIS 的 star 数说明研究者已在这么做，但 ARIS 作者自己保留人工检查点。
- 投稿前模拟审稿：AI 找技术错误和缺的实验有用（AAAI-26 问卷），大局判断弱。
- rebuttal：把意见归类、对应到已有实验、排补实验计划、起草回应；策略和每个数字要人确认。
- 读论文笔记：摘录方法、局限、与本课题的关系；理解本身研究者不肯外包。
- 新颖性检查：列出最接近的工作和差别，不下结论。

【不会交出去的，以及原因】
- 选什么问题、主张是什么、哪个结果值得信：这是研究品味和署名责任（Nanda；HN eamag；Lixin Xu 说工具保证不了想法重要和叙事诚实）。
- 对意外结果的解释和核心数据分析：调查里 69–73% 的研究者从不把数据分析和数据生成交给 LLM，并视为最高风险。
- 最终成文的每一句：出事时担责的是作者，ICLR 已把 LLM 使用披露和个人负责写进政策。
- 审稿判断：会议要求披露 LLM 使用、未发表稿件有保密义务、隐蔽使用会连累自己的论文；能协助的只有查相关工作和核对事实，而且稿件不能离开本机去第三方。这一条对产品是硬约束，需要确认模型调用是否算把稿件交给第三方。
- 与导师、合作者、作者之间的沟通：关系和信任。
- 理解本身：博士生明确说把理解外包就失去了读博的意义。

总体上，Anthropic 内部调查的结论可以当基准预期：即使是最熟练的人，也只认为 0–20% 的工作能完全放手，其余是带着监督的协作；被放手的是易验证、低风险、重复、无聊的那部分。

## 出乎意料的发现

1) 每日论文早报是红海，不是需求缺口。HN 上十余个帮你跟上论文的摘要/信息流工具大多只有 1–4 分；Scholar Inbox 免费且已有 2.3 万用户；中文开发者自己 fork 一份每日论文脚本就能跑。研究者缺的不是更多摘要，而是按我这个课题筛、并且可核对。这直接否定了我们原先早报式的假设，对 AI 研究者尤其如此。
2) 时间主要花在执行，不在信息。Perez 说项目绝大部分时间在执行阶段，瓶颈是把想法实现出来的速度；Nanda 甚至建议新人不要自己做穷尽式文献调研，去问导师。文献是必须过的关，但不是最大的时间黑洞。
3) 后台跑几个小时再交结果这件事，研究者已经在自己搭——但对象是实验，不是阅读。autoresearch 97.3k star、ARIS 17k star，卖点都是睡觉时让智能体跑实验、早上看结果。
4) 稀缺的是核对，不是生成。假引用已经导致直接拒稿；用户研究把核对负担列为 LLM 做文献工作的头号缺口；研究者把数据分析这类证据链环节挡在 LLM 之外（约七成从不用）。会生成的工具越多，能证明每一条都是真的工具越值钱。
5) 同一项技术，公开且结构化时受欢迎，隐蔽时招恨。AAAI-26 的 AI 审稿在找技术错误上被认为比人强、过半受访者觉得有用；而 ICLR 2026 有 21% 审稿被发现由 AI 代写则成了丑闻。披露和可追溯决定了接受度。
6) 整个体系在给产量踩刹车：arXiv 每人每月限 2 篇（2026 年 10 月）、ICLR 2027 据报道每位作者限投 20 篇、ICLR 对假引用直接拒稿。帮人多产论文的工具逆风，帮人把一篇做扎实的工具顺风。
7) 公共基础设施会消失。Papers with Code 说关就关，研究者想要的是自己手里那张带出处的结果表。这与一切留在本机、同事维护自己文件夹的产品形态吻合。
8) 学界没有云预算。85% 的受访学者云算力预算为零，多数只有 1–8 块 GPU；不能假设他们会为跑实验的智能体再付一笔算力钱，排队和不浪费才是需求。
9) 用得最多的人是非英语母语和初级研究者，顾虑最多的是资深研究者——付费意愿和使用意愿可能不在同一群人身上；而署名担责的 PI 才是对假引用最敏感的人。
10) 中国是这个人群的主体：AAAI-26 近 2.9 万篇投稿里约 2 万篇来自中国。但中文一手叙述恰恰是本次最难打开的（见 gaps）。

## 没查到的

【没能打开的】
- Reddit 全站：WebFetch 拒绝，内置浏览器提示该站因安全限制不可打开，没有换工具绕过。r/MachineLearning 上最对口的几个帖子（如何跟上论文洪流、被论文围攻且总被抢发、你实际怎么在研究流程里用 AI、NeurIPS 幻觉引用讨论）只在搜索结果里看到标题和片段，未作为证据使用。
- 知乎：问题页和专栏页都跳到人机验证加登录页，没有尝试通过。因此没读到：深度学习花四千块租 GPU 跑实验值不值、NeurIPS 2025 投稿经历复盘、如何高效管理深度学习实验、自费跑实验哪家 GPU 便宜等帖子。小红书、脉脉、即刻未尝试（需登录）。结果是中文一手证据偏薄，只有博客园、个人博客、GitHub 中文项目和媒体报道。
- Nature 四篇文章有付费墙，只读到标题和导语：5,000 人 AI 写作态度调查、ICLR AI 审稿、Frontiers 1,600 人审稿用 AI 调查、deep research 对科学家是否有用。其中的具体百分比未采用。
- WebSearch 配额在本会话开始前已用尽；改用 Brave（随后限流并出现人机验证，未处理）和浏览器里的 Bing。DuckDuckGo 出验证码。hiddenstate.io 在 Cloudflare Access 之后；CSDN 两篇返回 521；Wiley 研究者 AI 调查页 404；Towards Data Science 一篇正文为空；AutoDL 首页价格未渲染；Raff 论文的数字是从下载的 PDF 第 2 页读到的。
- X 上研究者的串、播客和访谈本次没有打开任何一条。
- 搜到的几篇 CSDN 读博经验文带有明显的批量生成痕迹，未采用；搜狐那篇 ICLR 限投报道页面自己标注含 AI 生成内容，ICLR 2027 限投 20 篇这一条没有找到官方页面核对。

【找了但没找到的】
- 针对 ML 研究者的时间分配研究（每个阶段占多少小时）。现有的只是从业者的定性说法（执行占绝大部分、写作 2–4 周、截稿前一个月转写作）。
- 复现一个基线平均花多久、失败率的近年数据（只有 2019 年的 63.5%）。
- 国内学生为科研工具和算力自己掏多少钱、导师经费能否报销订阅。
- 发表后跟进后续工作这一环的一手叙述。
- 被抢发/撞车的 ML 一手长文（只有会议的两个月并发规则这类间接证据）。
- 工业界研究员的工具栈和保密限制（只有 Anthropic 自家调查）。

【只有访谈能回答的】
1) 上一个课题里，哪一周最想有人替你干活？当时在做什么？
2) 你会让一个 AI 同事读你的实验目录、OpenReview 账号、学校图书馆登录态吗？哪一个不行，为什么？
3) 导师或公司允许把未发表的稿件、审稿中的论文交给哪些模型？本机运行但调用云端模型算不算外泄？
4) 你现在为科研工具每月自己付多少钱？哪一项是导师或公司付的？什么样的结果会让你再付一份？
5) 文献雷达报错一次（漏报撞车论文，或误报）之后你还会用吗？能容忍的漏报率是多少？
6) 夜里跑实验的智能体：你信它改代码吗？早上你要看到什么才敢把数字写进论文？
7) 国内课题组的算力是怎么分的（排队、抢卡、自费租），智能体夜里占卡会不会引起组内矛盾？
8) 一年里选题、调研、复现、实验、写作、rebuttal、审稿各占多少周？哪一段你认为是浪费？
9) PI 和学生谁决定用什么工具？谁对假引用最紧张？
10) 博士生是否把 AI 代劳看作学不到东西的风险？哪些环节宁可慢也要自己做？
