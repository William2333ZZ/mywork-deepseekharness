# AI 4：工具与花费

原始调研记录（2026-10-05）。未经逐条复核，复核结果见上一级目录的 `audit.md`。数字和说法以各条所附网址的原文为准。

## 人群

- **A1-学术研究者（博士生、博后、教师）**：在高校做 AI/ML 研究、以论文为产出的人；国内研究生读英文论文、对翻译和中文工具依赖更重
  - 深度研究工作：开题文献摸底、长期跟踪一个子方向、复现 baseline、跑实验、写论文和 related work、审稿。产出是论文、综述、实验表。
  - 规模：没有直接的人数来源。可作参照：NeurIPS 2025 主会投稿 21,575 篇（Fortune）；ICLR 2026 约 20,000 篇投稿（HN 帖转述）。
- **A1-产业界研究工程师 / 应用科学家**：在公司里做模型训练、评测、应用研究的人，有 GPU 预算，更看重把论文变成能用的东西
  - 深度研究工作：技术选型调研、把论文方法落成代码、自动化实验循环、内部技术报告。产出是可运行的实现、对比实验、内部文档。
  - 规模：没有找到人数来源。行为信号：autoresearch 97,262 星、Paper2Code 4,974 星（GitHub API）。
- **A2-独立行业分析师 / 研究型写作者**：以深度分析为产品的人（如 Stratechery、Benedict Evans 这类），自费订多家 AI
  - 深度研究工作：行业和公司深度分析、数据汇编、访谈准备、演讲和报告。产出是长文、数据图表、演示稿。
  - 规模：没有找到人数来源。
- **A2-投资人（VC/PE 投资经理、做 AI 赛道的研究员）**：看 AI 项目和赛道的一级投资人及二级 TMT 研究员；机构为数据库付费
  - 深度研究工作：赛道图谱、公司画像、技术和商业尽调、投资备忘录、持续跟踪。产出是 memo、行研报告、项目底稿。
  - 规模：没有直接人数。参照：AlphaSense 自称 7,000+ 企业客户；企名片 Pro 自称 200 多家头部投资机构和投行；一项被转引的调查样本为近 3,000 家 VC 机构。
- **A2-企业内的战略、产品负责人和咨询顾问**：写竞品研究、技术选型报告、市场进入分析的人
  - 深度研究工作：竞品深度对比、技术选型、市场规模测算。产出是内部报告和决策材料。
  - 规模：没有找到人数来源；这一段的直接证据最少。

## 工作流

1. **A1-1 选题与文献摸底**：从一篇近期综述或种子论文出发，沿引用向前向后扩展，确认问题没人做过、列出要对比的工作。
   - 产出：阅读清单、脉络图、研究空白的一段话
   - 工具：Google Scholar、Semantic Scholar（免费，2 亿多篇）、Undermind / Elicit / Consensus、Connected Papers、通用 deep research
   - 时间：厂商称手工检索要数小时；一次深度检索 2024 年约 3 分钟，2025 年的评测者说 8 分钟到 1 小时；通用 deep research 约 5 分钟出 13 页。时间主要花在合并多个工具的结果和判断漏没漏。
   - 来源：<https://news.ycombinator.com/item?id=41069909> <https://aarontay.substack.com/p/why-i-think-academic-deep-research> <https://www.oneusefulthing.org/p/the-end-of-search-the-beginning-of> <https://xiangyu-yin.com/content/post_deep_research.html>
2. **A1-2 精读与建库**：把论文收进文献库，速读筛选、精读关键论文、做批注和笔记；国内读者常先翻译。
   - 产出：带批注的文献库、每篇的要点笔记、证据摘录
   - 工具：Zotero（存储 20–120 美元/年）+ AI/翻译插件、NotebookLM、ima、Readwise Reader（9.99 美元/月）、Obsidian
   - 时间：来源没有给出小时数。可观察到的摩擦是在文献库和 AI 工具之间来回复制，以及 NotebookLM 的来源数上限。
   - 来源：<https://news.ycombinator.com/item?id=45663884> <https://www.zotero.org/storage> <https://support.google.com/notebooklm/answer/16213268?hl=en>
3. **A1-3 定 baseline 与复现**：找到要比较的方法和公开代码，跑通并复现论文里的数字，整理对比表。
   - 产出：能跑的 baseline、方法×数据集×指标对比表
   - 工具：GitHub、Hugging Face Trending Papers（Papers with Code 的继任，无榜单）、编码智能体、Paper2Code
   - 时间：智能体端到端复现的成功度仍低（PaperBench 最好 21.0%），所以这一步仍是人工为主；来源没有给出人工耗时。
   - 来源：<https://arxiv.org/abs/2504.01848> <https://github.com/paperswithcode/paperswithcode-data/issues/122>
4. **A1-4 实验迭代**：改代码、跑实验、看曲线、记录结果，决定下一步；可把循环交给智能体夜间跑。
   - 产出：实验日志、结果表、失败记录
   - 工具：编码智能体（Claude Code / Codex）、karpathy/autoresearch、GPU 集群
   - 时间：一个公开案例：单 GPU 约 1.8 小时达到目标，16 GPU 约 1.65 小时但 GPU 效率减半。全自动系统的独立评测：42% 实验失败、每篇仍需约 3.5 小时人工。
   - 来源：<https://news.ycombinator.com/item?id=47442435> <https://arxiv.org/abs/2502.14297>
5. **A1-5 写作**：多人在 Overleaf 上协作写稿，整理参考文献，画图排版。
   - 产出：论文初稿（LaTeX）、图表、.bib
   - 工具：Overleaf、Zotero + Better BibTeX、LLM 写 LaTeX/TikZ 和校对
   - 时间：一位课题组负责人自述约 40% 的时间在 Overleaf 里；苦活集中在排版、图和参考文献格式。
   - 来源：<https://news.ycombinator.com/item?id=46783752>
6. **A1-6 引文与论断核对、投稿**：逐条核对参考文献是否存在、是否支持所述论断，然后投稿并应对审稿。
   - 产出：核对过的参考文献、投稿稿件
   - 工具：基本靠人工；少数人自建校验脚本；会议方开始用检测工具
   - 时间：评论者称审稿人两周要无偿审 5 篇，没有时间替作者核对；核对工作落在作者身上。
   - 来源：<https://news.ycombinator.com/item?id=46181466> <https://news.ycombinator.com/item?id=47495510> <https://fortune.com/2026/01/21/neurips-ai-conferences-research-papers-hallucinations/>
7. **A2-1 定题与搭框架**：把问题拆成问题树，用 deep research 铺第一版背景和框架。
   - 产出：研究提纲、初版背景材料
   - 工具：ChatGPT / Gemini / Claude / Perplexity 的 deep research；国内 Kimi、秘塔、豆包、纳米 AI
   - 时间：一次运行几分钟到约 20 分钟（国产实测 1–20 分钟）；分析师估计可把几天的活压到几小时，但之后要改错。
   - 来源：<https://www.ben-evans.com/benedictevans/2025/2/17/the-deep-research-problem> <https://www.woshipm.com/ai/6270278.html>
8. **A2-2 桌面研究与取数**：从融资库、流量和用量数据、财报、研报里取数，拼成公司和行业的数据底表。
   - 产出：公司画像、市场规模和份额表、融资事件表
   - 工具：PitchBook、Crunchbase、AlphaSense、IT桔子、企名片 Pro、Similarweb、OpenRouter 数据
   - 时间：一项厂商主办的调查称约半数 VC 机构每个项目用 4–6 个数据源；时间花在登录各库、导出、对口径。来源没有给出小时数。
   - 来源：<https://www.beigemedia.org/article/vc-due-diligence-tech-stack> <https://www.failory.com/blog/pitchbook-pricing> <https://www.vendr.com/marketplace/alphasense>
9. **A2-3 一手信息**：访谈专家、创始人、客户，实地走访，拿公开网页上没有的信息。
   - 产出：访谈纪要、一手观察
   - 工具：人；访谈前用 deep research 做功课，访谈后用转写和知识库整理
   - 时间：从业者一致认为这一步不能交给 AI；来源没有给出耗时。
   - 来源：<https://stratechery.com/2025/deep-research-and-knowledge-value/> <https://www.36kr.com/p/3896147083675267> <https://finance.sina.com.cn/roll/2026-06-26/doc-inietspp7311082.shtml>
10. **A2-4 数字核对与溯源**：把每个关键数字追到一手来源，剔除聚合站和过期数据。
   - 产出：带来源层级的数据表
   - 工具：人工为主
   - 时间：使用者自述拿到约六成价值后仍要全部抽查；这是当前最费人的环节。
   - 来源：<https://www.ben-evans.com/benedictevans/2025/2/17/the-deep-research-problem> <https://news.ycombinator.com/item?id=43133207>
11. **A2-5 成稿与持续更新**：写报告或投资备忘录、做 PPT；之后按季度或事件更新底稿。
   - 产出：行业报告、投资 memo、PPT、更新后的底稿
   - 工具：Office / 飞书 / Notion；AI 生成初稿和 PPT
   - 时间：一线投研人把底稿更新和 PPT 生成列为已交给 AI 的重复劳动；判断和定价不交。
   - 来源：<https://finance.sina.com.cn/roll/2026-06-26/doc-inietspp7311082.shtml>

## 需求

### 1. 当我开一个新题或要写 related work 时，我想在半天内拿到一份不漏关键工作的论文清单和脉络，以便确认没人做过、知道该跟谁比。

- 证据强弱：强
- 谁：A1：博士生、研究工程师、应用科学家；A2 里做技术尽调的人也有同样的活
- 痛在哪：手工在 Google Scholar 上翻要数小时且会漏；专用工具多数只搜摘要或开放获取全文，首轮覆盖不全，按相似度而不是重要性排序；通用 deep research 读不到付费墙后的全文，同一问题重复跑结果不一致。
- 多久一次：每个新课题、每篇论文至少一次，写作期反复补查（来源没有给出频率数字）
- 现在怎么凑合：多个工具并用再人工合并：Undermind / Elicit / Consensus + Connected Papers + Google Scholar；把自己挑好的 PDF 喂给大上下文模型（实测这种半手工做法得分最高）；多家 deep research 各跑一遍再合并。
- 缺口：付费墙后的全文、学位论文和灰色文献；可复述的检索过程（做系统综述的人要写明检索式和数据库）；与自己已有文献库去重；按“重要性/奠基性”而不是相似度排序。
- 证据：
  - 创始人自述问题：研究者在 Google Scholar 上耗数小时、甚至跳过彻底检索；当时一次检索约 3 分钟，只搜 Semantic Scholar 的摘要，付费全文要靠出版社合作，月费约 20 美元。（Undermind 创始人（厂商自述，代表厂商认为的需求）；vendor；2024-07-25） <https://news.ycombinator.com/item?id=41069909>
  - 同一帖里的研究者反馈：有人在前 10 条里发现了本该自己找到的两篇；有人指出漏了关键理论论文、把新文排在奠基论文之前；有人指出只搜摘要会漏；研究生嫌没有学生价。（CS 学者、物理方向研究者、研究生等（HN 评论者）；practitioner；2024-07-25） <https://news.ycombinator.com/item?id=41069909>
  - 在自己熟悉的方向上对比三种做法：自己挑 PDF 再交给模型的半手工方式平均得分最高（9.08/10）；两个自动 deep research 都没取全论文（付费墙、抓取受限），同一工具多次运行结果不一致；他把它定位成综述的“起点”。（Argonne 国家实验室计算材料科学家 Xiangyu Yin；practitioner；2025-02-09） <https://xiangyu-yin.com/content/post_deep_research.html>
  - 学术场景里真正有价值的是检索质量（deep search）而不是生成的报告；一次深度检索 8 分钟到 1 小时，学者愿意等；全文/付费墙覆盖和引文忠实度仍是短板。（高校图书馆员、学术检索评测者 Aaron Tay；practitioner；2025-08-08） <https://aarontay.substack.com/p/why-i-think-academic-deep-research>
  - OpenAI Deep Research 约 5 分钟产出 13 页、3778 词、6 条引用的文献综述，质量接近刚入学博士生，但读不到付费论文和书；Google 版引用更多但来源参差。（商学院教授 Ethan Mollick；practitioner；2025-02） <https://www.oneusefulthing.org/p/the-end-of-search-the-beginning-of>
  - 价格即行为：Elicit Pro 年付折合 49 美元/月、Scale 169 美元/月；Consensus Pro 12 美元/月、Deep 45 美元/月（200 次深度综述）；Undermind Pro 16 美元/月。（厂商定价页；vendor；2026-10 访问） <https://elicit.com/pricing>

### 2. 当我写综述或 related work 时，我想每条论断都挂着原文摘录和能点开的出处，以便我能为每一句话负责、不被假引用坑。

- 证据强弱：强
- 谁：A1：要投稿的研究者、博士生；审稿人和会议组织者是受害方
- 痛在哪：LLM 生成或“补全”的参考文献会出现不存在的论文、错作者、错出处；核对一条 AI 给的结论常比自己查还慢；审稿人没有时间逐条验证。
- 多久一次：每次写作、每次投稿前；顶会每年一轮
- 现在怎么凑合：自己搭流程：先让模型从 PDF 里抽取原句和论断，再用脚本校验原句确实在 PDF 里，最后人工逐条过；只让 LLM 在已筛过的文献集合内工作；Zotero + Better BibTeX 管理条目。
- 缺口：没有成熟工具能判断“被引论文是否真的支持这句论断”（检测方自己说仍在 beta）；投稿前的 DOI/BibTeX 自动核对没有成为标配。
- 证据：
  - GPTZero 在 NeurIPS 2025 已接收论文里找出 100 多条 AI 幻觉引用，至少涉及 53 篇；当年主会投稿 21,575 篇、接收率 24.52%。（财经媒体报道（引 GPTZero 与 NeurIPS 回应）；news；2026-01-21） <https://fortune.com/2026/01/21/neurips-ai-conferences-research-papers-hallucinations/>
  - ICLR 2026 约 2 万篇投稿中只扫了 300 篇就发现 50 多篇含幻觉引用；评论者解释成因是用 GPT 修补不完整的 Zotero 导出而不核对，并希望有自动 DOI/bib 校验和“引用是否支持论断”的检查。（研究者与审稿人（HN 评论者），含 GPTZero 团队成员；practitioner；2025-12-07） <https://news.ycombinator.com/item?id=46181466>
  - 博士候选人自建看板：ChatGPT Pro 找文献，Codex 从 PDF 抽取原句和论断，脚本校验原句存在，再人工逐条审；他担心这被算作学术不端。回帖的学者普遍认为核验流水线才是最有价值的部分。（结构工程博士候选人（发帖人）及多名学者；practitioner；2026-03-23） <https://news.ycombinator.com/item?id=47495510>
  - 用 Gemini 从 PubMed 找论文，再自己读和引用；认为 LLM 仍会出引文错误，应把它限制在已筛过的文献集合内。（科研人员（HN 评论者 SubiculumCode）；practitioner；2025-12-07） <https://news.ycombinator.com/item?id=46181466>
  - SciConBench：用系统综述里的 9.11K 个问题和专家结论测智能体，最好的系统事实 F1 只有 0.337，且在隔离评测下成绩明显下降。（学术研究（arXiv 预印本）；survey-or-study；2026-06-09） <https://arxiv.org/abs/2606.11337>
  - Elicit 把两种相近分子混淆、与它自己引用的摘要相矛盾；另一位指出证伪一个错误答案比自己核实更费时。（试用者（HN 评论者）；practitioner；2024-05-16） <https://news.ycombinator.com/item?id=40377344>

### 3. 当我已经攒了几百篇 PDF 和笔记时，我想直接对“我的库”提问、让答案写回我的笔记，以便不在 Zotero、ChatGPT、NotebookLM 之间来回复制粘贴。

- 证据强弱：强
- 谁：A1 为主（Zotero 重度用户、研究生）；A2 里攒研报和纪要的人同理
- 痛在哪：文献管理器和 AI 是两套东西；NotebookLM 每个笔记本有来源数上限；库一大就搜不动；想离线、本地、基于已有 PDF 的方案但插件慢且不稳。
- 多久一次：读文献期间每天
- 现在怎么凑合：装 Zotero AI 插件或 MCP 把库接到 Claude 等；把 PDF 再上传一遍到 NotebookLM；国内用 ima 知识库；有人干脆放弃 Zotero 改问 LLM。
- 缺口：一个长期存在、认识我整个库、能跨会话记住我读过什么的助手；本地优先；不受来源数上限限制。
- 证据：
  - 观察 200 名内测用户：研究者把内容从 Zotero 复制到 ChatGPT、再把 PDF 传到 NotebookLM、再回 Zotero，反复横跳。（DeepTutor 开发者（厂商/创始人观察）；vendor；2025-10-22） <https://news.ycombinator.com/item?id=45663884>
  - GitHub 星标作为行为证据：zotero-gpt 7,452，papersgpt-for-zotero 2,662，zotero-mcp 5,236（把 Zotero 库接给 Claude 等助手）。（GitHub API（开源项目数据）；industry-report；2026-10-05 访问） <https://api.github.com/search/repositories?q=zotero+gpt+in:name,description&sort=stars&per_page=12>
  - 试过 NotebookLM、ZotAI、Connected Papers、Litmaps、Consensus，最后想要的是能离线、直接用现有 Zotero PDF 的本地 RAG；当时的插件又慢又有 bug。（研究者（HN 评论者 z02d）；practitioner；2026-03-26） <https://news.ycombinator.com/item?id=47529080>
  - 参考文献多到在 Zotero 里搜不动后放弃 Zotero，改为按课题组和主题问 LLM 找论文。（跨学科研究者（HN 评论者 MITSardine）；practitioner；2026-01-28） <https://news.ycombinator.com/item?id=46789726>
  - NotebookLM 每个笔记本的来源上限：免费 50、Plus 100、Pro 300、Ultra 500–600。（Google 帮助页；vendor；2026-10 访问） <https://support.google.com/notebooklm/answer/16213268?hl=en>
  - 腾讯首次披露 ima 月活超过 1300 万、知识库文件超过 4.2 亿份。（腾讯披露（经腾讯新闻转述）；news；2026-03-18） <https://news.qq.com/rain/a/20260318A07B1X00>

### 4. 当我做一个持续几个月的课题时，我想让系统把这个子方向的新论文持续筛进我的综述、笔记和对比表，以便知识是累积的，而不是每次从头检索。

- 证据强弱：中
- 谁：A1：在一个子方向长期深耕的研究者；A2：长期跟踪一个赛道的分析师
- 痛在哪：AI 方向每天新增几十上百篇，判断不了哪些重要；RAG/聊天式工具每次提问都从原始文档重新推导，不沉淀；提醒类功能只推列表，不会更新我的综述。
- 多久一次：持续性（每天有新文，按周消化）
- 现在怎么凑合：Litmaps/ResearchRabbit/Scite 的提醒，Elicit Routines，alphaXiv/X 上看热度；自己用 Claude Code + Obsidian 维护一个由 LLM 记账的 markdown 知识库。
- 缺口：把“提醒”接到“一份活的综述/对比表”上，并保留变更日志；这正是持久同事 + 文件夹 + 定时例行的形态，但要挂在一个具体课题上，而不是泛泛的每日新闻。
- 证据：
  - 提出由 LLM 持续维护的个人 wiki：原始资料不动，LLM 负责摘要、交叉引用、归档和记账，人负责找资料和提问；点名的用例之一是持续数周数月的研究深挖。（AI 研究者 Andrej Karpathy；practitioner；2026-04-04） <https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f>
  - 该做法发布后 HN 上出现 20 个左右的衍生项目（Obsidian 插件、CLI、技能包等），说明有人愿意自己动手搭。（HN 搜索结果（开发者自发项目）；practitioner；2026-04 至 2026-07） <https://hn.algolia.com/api/v1/search?query=LLM%20wiki%20karpathy&tags=story&hitsPerPage=20>
  - 创始人描述的问题：每天有几十到上百篇新论文，AI 团队难以判断哪些重要、怎么用；公司拿到 700 万美元种子轮并自称有数百万用户。（alphaXiv 联合创始人（厂商自述，经科技媒体）；vendor；2025-11-19） <https://siliconangle.com/2025/11/19/alphaxiv-raises-7m-funding-become-github-ai-research/>
  - 厂商把“持续跟踪”做成付费点：Litmaps Pro（10 美元/月）才有每日提醒；ResearchRabbit+ 含 signals 提醒；Elicit 首页列出用 Routines 跟进新研究。（厂商定价页与首页；vendor；2026-10 访问） <https://www.litmaps.com/pricing>
  - 区分两种用途：语义检索对“技术监测”有价值，和写论文的文献综述是不同的活；并指出 Google Scholar 不让别人在其上做产品。（研究者/开发者（HN 评论者 eric-burel）；practitioner；2024-12-25） <https://news.ycombinator.com/item?id=42507116>

### 5. 当我要定 baseline、写实验对比时，我想有一张带出处的“方法 × 数据集 × 指标”表，以便知道当前最好结果是多少、该和谁比。

- 证据强弱：中
- 谁：A1：做实证研究的研究者和工程师；A2：要判断“谁领先”的技术尽调者
- 痛在哪：Papers with Code 被关停后，论文、代码、榜单三者的对应关系散落在多个站点；官方继任者没有 SOTA 榜单。
- 多久一次：每个项目立项和写实验章节时
- 现在怎么凑合：在 HF Trending Papers、社区重建站、各论文的表格之间手工拼。
- 缺口：一张由自己掌控、能持续更新、每个数字都能点回原论文表格的对比表。
- 证据：
  - 社区在数据仓库 issue 里整理替代品清单（HF Trending Papers、社区重建版、找代码的工具等），并指出官方继任者没有 SOTA 榜单，功能被拆散到多个平台。（ML 社区成员（GitHub issue）；practitioner；2025-11） <https://github.com/paperswithcode/paperswithcode-data/issues/122>
  - 审稿时间有限的背景：评论者称 ICLR 审稿人两周内要无偿审 5 篇，无法逐项核对，对比表和引用的正确性主要靠作者自己保证。（审稿人（HN 评论者 bjourne）；practitioner；2025-12） <https://news.ycombinator.com/item?id=46181466>

### 6. 当我要在别人的方法上做改进时，我想先把论文的代码跑通、把表里的数字复现出来，以便我的对比站得住。

- 证据强弱：中
- 谁：A1：研究工程师、博士生
- 痛在哪：很多论文没有可用代码或细节缺失；从论文到能跑的实现很耗时，且生成的代码质量不稳定，必须人工核对。
- 多久一次：每个项目 1 到数个 baseline
- 现在怎么凑合：用 LLM/编码智能体按论文写实现、生成单测和文档，再人工逐项验证；找 Paper2Code 之类的工具。
- 缺口：智能体端到端复现仍远低于人类博士水平，需要人盯；缺少把“复现到哪一步、差多少”记下来的持续记录。
- 证据：
  - PaperBench：让智能体从零复现 20 篇 ICML 2024 Spotlight/Oral 论文（8,316 个可评分子任务），最好的智能体平均只有 21.0%，低于参与对照的 ML 博士。（OpenAI 研究团队（arXiv）；survey-or-study；2025-04-02） <https://arxiv.org/abs/2504.01848>
  - 用 LLM 把期刊论文里的 DSP 方法写成代码、生成单测和文档，然后自己手工验证正确性；质量从很好到明显很差都有。（工程师（HN 评论者 galangalalgol）；practitioner；2026-07） <https://news.ycombinator.com/item?id=48967355>
  - Paper2Code 仓库 4,974 星，说明“论文转代码”有明确的自发需求。（GitHub API；industry-report；2026-10-05 访问） <https://api.github.com/search/repositories?q=repo:karpathy/autoresearch+repo:SakanaAI/AI-Scientist+repo:SamuelSchmidgall/AgentLaboratory+repo:going-doer/Paper2Code+repo:windingwind/zotero-pdf-translate+repo:54yyyu/zotero-mcp+repo:SakanaAI/AI-Scientist-v2+repo:LearningCircuit/local-deep-research>

### 7. 当我有明确指标和一份能改的训练代码时，我想让智能体在夜里自己改代码、跑实验、记结果，以便我第二天只看结论和曲线。

- 证据强弱：强
- 谁：A1：有 GPU 的研究工程师、独立研究者
- 痛在哪：智能体容易退化成调超参；可能是对验证集的“工业化过拟合”；并行跑省时间但费 GPU；只靠模型权重里的知识，想不到最新方法。
- 多久一次：实验期每天/每晚
- 现在怎么凑合：跑 Karpathy 的 autoresearch 或自己接编码智能体；给智能体加 arXiv 检索来增加方法多样性；人工看泛化。
- 缺口：把文献检索、实验日志、结果表和结论沉到同一个持久工作区；自动检查“提升是否能泛化”。
- 证据：
  - karpathy/autoresearch 发布 7 个月 97,262 星，是这次查到的“研究类”仓库里最高的；AI-Scientist 14,657、AgentLaboratory 5,885。（GitHub API；industry-report；2026-10-05 访问） <https://api.github.com/search/repositories?q=repo:karpathy/autoresearch+repo:SakanaAI/AI-Scientist+repo:SamuelSchmidgall/AgentLaboratory+repo:going-doer/Paper2Code+repo:windingwind/zotero-pdf-translate+repo:54yyyu/zotero-mcp+repo:SakanaAI/AI-Scientist-v2+repo:LearningCircuit/local-deep-research>
  - 给智能体 16 块 GPU 后达到目标 loss 的墙钟时间从约 1.8 小时降到约 1.65 小时；评论者指出 GPU 效率其实减半，并担心只是在验证集上过拟合；有人给智能体接了内部 arXiv 检索后方法多样性明显提高。（ML 工程师与研究者（含 Karpathy 本人回帖）；practitioner；2026-03-19） <https://news.ycombinator.com/item?id=47442435>
  - 独立评测 Sakana AI Scientist：42% 的实验因代码错误失败，把已有概念误判为新颖，稿件中位数只有 5 条引用；但一篇成本 6–15 美元、人工约 3.5 小时。（学术研究（arXiv）；survey-or-study；2025-02-20） <https://arxiv.org/abs/2502.14297>
  - 研究者对“全自动科学家”的反应：担心动手训练被拿走、验证谁来做、只是按流程走形式；有人更想要“分叉出实验给人检查”的用法。（研究者（HN 评论者）；practitioner；2024-08-13） <https://news.ycombinator.com/item?id=41231490>

### 8. 当我做一个要跑几小时的大调研时，我想让它连续跑完、自带交叉核验，以便不在半路因为额度用光或没有最终综合而白跑。

- 证据强弱：强
- 谁：A1 和 A2 的重度用户（同时订多家的人）
- 痛在哪：订阅额度很快见底；现成的 deep research 给出未经核验的结论（错的许可证、没出处的数字）；一家工具不够，要多家互相印证。
- 多久一次：每个大题目一次，重度用户每周多次
- 现在怎么凑合：同时订 2–3 家（含 200 美元档）并把结果互相喂；自己搭多智能体流水线：便宜模型找和验、贵模型编排，要求每条结论带 URL 和原文。
- 缺口：可续跑、有预算上限、内置“不同智能体互验 + 原文引证”的长时程调研；这类用户已经在自己搭。
- 证据：
  - 第一次用 /deep-research 约 30 分钟就把 Claude Max 5x 的额度烧完：起了 111 个智能体，只完成 25 项核验，没有最终综合；改造后用现有订阅连续跑数小时。他要求由别的智能体核验、必须给出处和原文。（Quesma 创始人/研究者 Bartosz Kotrys；practitioner；2026-07-17） <https://quesma.com/blog/custom-deep-research-pipeline/>
  - 把 Claude、OpenAI 200 美元档和 Gemini Ultra 的结果一起喂给 Gemini 提炼；另一位在五个产品上各搜一遍，只留易核验的结果，丢掉大部分。（大厂工程师等（HN 评论者 kridsdale3、iandanforth）；practitioner；2025-02） <https://news.ycombinator.com/item?id=43133207>
  - 用到 Deep Research 配额上限，认为对定性/文本类研究非常有用，愿意为更多额度开多个账号。（研究型用户（HN 评论者 nxobject）；practitioner；2025-02） <https://news.ycombinator.com/item?id=43133207>
  - 开源自建的热度：gpt-researcher 29,916 星、dzhng/deep-research 19,754、Alibaba-NLP/DeepResearch 20,005、local-deep-research 9,152（主打本地和私有文档）。（GitHub API；industry-report；2026-10-05 访问） <https://api.github.com/search/repositories?q=deep+research+in:name,description&sort=stars&per_page=15>

### 9. 当我写论文时，我想把 LaTeX、TikZ 图、参考文献格式这些苦活交出去，以便把时间留给内容；但内容和引用我要自己掌握。

- 证据强弱：中
- 谁：A1：写论文的研究者、带学生的导师
- 痛在哪：大量时间耗在排版和协作编辑上；又怕 AI“顺手”生成参考文献和正文，带来不可核验的内容和被指 AI 代写的风险。
- 多久一次：每篇论文的写作期
- 现在怎么凑合：Overleaf（有人自建并另付团队版）、Zotero + Better BibTeX，LLM 只用来写 LaTeX/TikZ 语法和校对。
- 缺口：只做格式、图表、校对而不碰内容和引用生成的助手；能接 ACM/IEEE/Springer 等出版方库而不只是 arXiv。
- 证据：
  - 课题组负责人说自己约 40% 的时间在 Overleaf 里，组里每年为团队版付 500 欧元以上；希望 AI 帮文献检索和实验设计，并希望接入 ACM、IEEE、Springer 的库。（课题组负责人/会议组织者（HN 评论者 jll29）；practitioner；2026-01-27） <https://news.ycombinator.com/item?id=46783752>
  - 带学生的资深研究者希望自动化 TikZ、抓参考文献和校对；数学研究者则认为让 AI 生成参考文献离不可核验的垃圾只有一步之遥。（资深研究者、数学研究者（HN 评论者）；practitioner；2026-01-27） <https://news.ycombinator.com/item?id=46783752>
  - 816 名论文作者的调查：编辑润色是最常见用法之一（约 45% 至少偶尔用），被认为风险最低；数据清洗分析 69% 从不用、数据生成 73% 从不用。（学术调查（Liao 等，816 名已验证的论文作者）；survey-or-study；2024-10-30） <https://arxiv.org/abs/2411.05025>

### 10. 当我拿到一篇难读的论文（英文、公式多、不在我的小方向）时，我想很快知道它值不值得精读并留下要点，以便把精读时间留给真正重要的那几篇。

- 证据强弱：中
- 谁：A1：学生和跨方向阅读的研究者；国内读英文论文的研究生尤其明显
- 痛在哪：量大读不完；音频/摘要式速读容易浅、甚至误导；翻译是国内读者的硬需求。
- 多久一次：每天
- 现在怎么凑合：把单篇论文丢给 LLM 先问再读；NotebookLM 音频概览在通勤时听；Zotero 翻译插件；SciSpace 之类的读论文助手。
- 缺口：这件事已有大量免费或十几美元的工具，付费意愿低；缺的是把速读结果沉淀进课题笔记，而不是又一个摘要器。
- 证据：
  - Zotero 翻译插件 zotero-pdf-translate 有 11,976 星，高于任何 Zotero AI 问答插件。（GitHub API；industry-report；2026-10-05 访问） <https://api.github.com/search/repositories?q=repo:karpathy/autoresearch+repo:SakanaAI/AI-Scientist+repo:SamuelSchmidgall/AgentLaboratory+repo:going-doer/Paper2Code+repo:windingwind/zotero-pdf-translate+repo:54yyyu/zotero-mcp+repo:SakanaAI/AI-Scientist-v2+repo:LearningCircuit/local-deep-research>
  - 博士生把单篇论文丢给 LLM 先抓大意再精读、再问针对性问题，认为比传统略读有效。（博士生（HN 评论者 ifh-hn）；practitioner；2026-03-14） <https://news.ycombinator.com/item?id=47374221>
  - 对 NotebookLM 音频概览的批评：听过的每一期都有误导、忽略关键上下文；也有人承认浅，但认为总比不读强。（HN 评论者（AIPedant、great_psy）；practitioner；2025-04 至 2026-03） <https://hn.algolia.com/api/v1/search?query=NotebookLM%20research%20papers&tags=comment&hitsPerPage=30&numericFilters=created_at_i%3E1740787200>
  - SciSpace 定价页自称 100 万以上研究者使用，Premium 年付 12 美元/月起；Trustpilot 397 条评价 4.3 分，抱怨集中在自动续费和积分消耗不可预期。（厂商定价页；用户评价平台；vendor；2026-10 访问） <https://www.trustpilot.com/review/scispace.com>

### 11. 当我写一份行业或竞品深度报告时，我想让表里的每个数字都能追到一手来源，以便我敢把它交给客户或投委会。

- 证据强弱：强
- 谁：A2：独立行业分析师、投资人、咨询顾问、写竞品研究的产品/战略负责人
- 痛在哪：deep research 擅长理解模糊问题，却在“精确取数”上出错；引用 SEO 站、二手聚合站；报告看起来完整，其实只做了一部分；只要表里有错就整张不可信。
- 多久一次：每份报告；重度用户每周
- 现在怎么凑合：把它当“无限个实习生”：让它铺底稿，自己逐项抽查、回溯一手来源；不满意就退订 200 美元档。
- 缺口：按数据点记录“来源层级”（一手/二手/聚合）并自动回溯到一手来源；过期数据提示；国内产品还会出现引用已废止事物这类事实错误。
- 证据：
  - 用 OpenAI 自己的示例（智能手机市场）检验：日本 iOS/Android 份额引用了流量统计站和聚合站，数字与一手调查大致相反；他的结论是表里只要有错就整张不能信，但可以把几天的活压到几小时，像“无限个实习生”。（独立科技行业分析师 Benedict Evans；practitioner；2025-02-17） <https://www.ben-evans.com/benedictevans/2025/2/17/the-deep-research-problem>
  - 用它汇总各郊区的公职薪酬对比：拿到约六成的价值，仍要自己全部抽查，而且它把部分结果说成全部。（资深工程师（HN 评论者 tptacek）；practitioner；2025-02） <https://news.ycombinator.com/item?id=43133207>
  - 研究 B2B 客户潜力模型时拿到的全是低质量博客站的内容，试用后退订了 200 美元订阅；另一位认为它不会在充满营销内容的市场里分辨可信来源。（从业者（HN 评论者 aerhardt；solardev）；practitioner；2025-02 至 2025-04） <https://news.ycombinator.com/item?id=43133207>
  - 同一题目实测四款国产“深度研究”：Kimi 约 20 分钟、读 1026 个网页；豆包约 1 分钟、39 个页面，浅；纳米 AI 约 8 分钟、360 个页面；秘塔交付形式最花哨但出现引用已废止事物的错误。（产品经理社区作者“靠谱瓦叔”；practitioner；2025-09-19） <https://www.woshipm.com/ai/6270278.html>
  - Perplexity Deep Research 帖下的试用者：在自己的领域里发现它漏掉了本人发表的工作；有人形容像实习生把搜索前两页的链接都点了一遍。（研究者等（HN 评论者 SubiculumCode、daveguy）；practitioner；2025-02-15） <https://news.ycombinator.com/item?id=43061827>

### 12. 当我研究一家公司或一条产业链时，我想把付费库里的数据和公开网页放在一起看，以便不漏掉网上查不到的关键玩家。

- 证据强弱：强
- 谁：A2：投资人、行业分析师、战略/BD；A1 遇到付费期刊时同理
- 痛在哪：公开网页之外的信息 AI 拿不到：私营公司、付费数据库、付费期刊；更糟的是它不知道自己漏了什么，读者却感觉已经了解全貌。付费库很贵、按席位、不许共享账号。
- 多久一次：每个项目/每份报告
- 现在怎么凑合：机构为数据付五位数美元年费（PitchBook、AlphaSense；国内企名片 Pro、IT桔子）；每个项目用多个数据源；人工登录各库导出再拼。
- 缺口：让智能体在用户自己已登录的浏览器里读用户有权读的库——现有云端 deep research 做不到，这是本产品形态最直接的切入点；同时要明确标出“哪些是公开网页查不到、需要人去问的”。
- 证据：
  - 用 200 美元档的 Deep Research 做财报分析和访谈准备很有用；但在一个行业分析里它完全漏掉了一家关键的私营公司，因为网上几乎没有记录。他称之为“unknown knowns”，并认为不公开的信息会更值钱。（独立科技分析师 Ben Thompson（Stratechery）；practitioner；2025-02） <https://stratechery.com/2025/deep-research-and-knowledge-value/>
  - PitchBook 不公开报价；汇总的买家自报价格为单席位约 1.2–1.35 万美元/年、3 席位约 2–2.4 万美元/年，有 5 席起购和两年合同的情况，且不允许共享账号。（第三方汇总（来源为 G2、TrustRadius 上的匿名用户评价）；industry-report；2024-01-10） <https://www.failory.com/blog/pitchbook-pricing>
  - AlphaSense 年合同中位数 18,375 美元（基于 40 笔采购，区间 9,750–51,300 美元）；专家访谈等高级内容可占合同额的 20–40%。（采购平台 Vendr 的成交数据；industry-report；2026-10 访问） <https://www.vendr.com/marketplace/alphasense>
  - 64% 的投资人已用 AI 加速公司研究（Affinity 报告页）；另一篇引用同一调查称 49% 的 VC 机构每个项目依赖 4–6 个数据源。（CRM 厂商 Affinity 的行业调查（厂商主办，样本口径见原报告）；Beige Media 编辑转引；survey-or-study；2025） <https://www.affinity.co/report/the-2025-investment-benchmark-report>
  - 用 Claude 和 Gemini 的 Deep Research 做历史传记研究时，付费墙后的来源自己没法核对，且不同系统可能犯同样的错。（从业者（HN 评论者 johngossman）；practitioner；2026-03-07） <https://news.ycombinator.com/item?id=47289837>
  - 企名片 Pro 自称 200 多家头部投资机构和投行在用，只对企业对公销售、不公开价格。（厂商官网（厂商自述）；vendor；2026-10 访问） <https://pro.qimingpian.cn/>

### 13. 当我做完一轮访谈、调研和开会后，我想把录音、纪要、云盘里的文档自动整理成底稿并更新到报告和 PPT，以便把时间花在判断上。

- 证据强弱：中
- 谁：A2：研究员、投资经理、行业分析师（证据主要来自金融投研，AI 行业分析师的直接证据不足）
- 痛在哪：材料散在各处、不结构化；个人能提效但沉淀不到团队；自己搭 AI 工作流有门槛；金融场景对出错零容忍、对数据外流敏感。
- 多久一次：每周多次
- 现在怎么凑合：机构采购或接入行业专用智能体平台；个人用 ima/NotebookLM 类知识库；访谈准备交给 deep research。
- 缺口：材料留在本机、能长期记住一个项目上下文的整理者；从录音/纪要到底稿到图表的链路；可追溯到原始材料。
- 证据：
  - 圆桌上的一线投研负责人：交给 AI 的是调研录音、会议纪要、云盘文档整理，共识梳理，底稿更新和 PPT；一手信息、产业拐点判断、非共识洞见和定价仍由人做；难点是把散落的数据统一起来和从个人提效变成团队能力。（公募和外资机构的研究/投资负责人（证券媒体圆桌报道）；practitioner；2026-06-26） <https://finance.sina.com.cn/roll/2026-06-26/doc-inietspp7311082.shtml>
  - 投研智能体被用于自选股扫描、资料整理、报告生成、管理层背调；接入云平台后一季度使用量增长约 10 倍；云厂商高管强调金融场景不能容忍第 101 次出错，并用水印监测数据外流。（36氪报道（引厂商与云厂商高管，带厂商立场）；news；2026-06-02） <https://www.36kr.com/p/3835399000913032>
  - 访谈一位上市公司 CEO 前，用 Deep Research 准备公司背景、业务模式、竞争对手和问题清单，省下大量准备时间。（独立科技分析师 Ben Thompson；practitioner；2025-02） <https://stratechery.com/2025/deep-research-and-knowledge-value/>
  - 在大厂工作的人自费订 Claude 和 OpenAI 并把结果用于工作，同时担心专有工作内容的保密问题。（大厂员工（HN 评论者 munchler）；practitioner；2025-02） <https://news.ycombinator.com/item?id=43133207>

### 14. 当我长期跟踪 AI 行业时，我想有一张自己掌控、定期更新的数据底表（模型价格和调用量、产品流量和收入、融资事件），以便写报告时直接取数而不是每次重查。

- 证据强弱：弱
- 谁：A2：AI 行业分析师、投资人、战略/产品负责人
- 痛在哪：数据分散在多个第三方源，口径不一；流量、应用收入类数据的报价不公开；手工更新费时。
- 多久一次：按周或按月更新，季度出报告
- 现在怎么凑合：引用 OpenRouter 用量数据、流量和应用收入估算、融资数据库；手工维护表格。
- 缺口：一张带来源和更新时间的活表，由助手按固定公式和固定来源维护。直接来自从业者的证据不足，下面多为厂商说法和媒体的实际用法。
- 证据：
  - OpenRouter 称其用量数据被政府机构、学术研究者、主要行业分析师和媒体使用，点名了 NIST、MIT、a16z、Reuters 等；提供按日的模型用量榜 API。（OpenRouter 官网（厂商自述）；vendor；2026-10 访问） <https://openrouter.ai/data>
  - 行业媒体写 Manus 和 Genspark 时用的正是这类底表数据：月移动端收入估算（约 360 万和 130 万美元）、月网页访问量（约 3030 万和 2135 万）。（出海行业媒体白鲸出海（经 36Kr 英文站）；news；2026-06-17） <https://eu.36kr.com/en/p/3855891603035398>
  - Similarweb 的企业方案不公开价格，需联系销售；产品线里专门有面向对冲基金的 Stock Intelligence。（Similarweb 定价页（厂商）；vendor；2026-10 访问） <https://www.similarweb.com/corp/pricing/>

## 工具与花费

| 工具 | 用来做什么 | 价格 | 谁付钱 | 抱怨 | 来源 |
|---|---|---|---|---|---|
| Elicit | 文献检索、数据抽取表、系统综述流程、研究报告 | 免费；Pro 年付折合 49 美元/月（588 美元/年）；Scale 169 美元/月（2,028 美元/年）；企业版另议 | 个人研究者；药企等机构（自称前 20 大药企中有 8 家） | 把相近概念混淆、偏选冷门会议论文而非高被引原文；核对成本高（HN 试用者）。Trustpilot 上没有评价可查。 | <https://elicit.com/pricing> |
| Undermind | 高召回的深度文献检索，生成带引用的报告 | 免费；Pro 16 美元/月（年付）；Team 15 美元/人/月 | 个人；高校和企业（自称 GSK 有 1000+ 科学家使用） | 早期只搜摘要；按相似度排序导致漏奠基论文；学生嫌贵；等待时间长 | <https://www.undermind.ai/pricing> |
| Consensus | 基于同行评议论文的问答和深度综述 | 免费（每月 3 次深度综述）；Pro 12 美元/月年付（15 次）；Deep 45 美元/月年付（200 次）；师生最多 6 折 | 个人（学生、研究者、临床医生），自称 500 万用户 | 未查到带出处的具体抱怨 | <https://consensus.app/pricing/> |
| SciSpace | 读论文助手、文献综述、深度研究、系统综述 | Premium 年付 12 美元/月（标价 20）；Advanced 70（标价 90）；Max 160（标价 200） | 个人，自称 100 万+ 研究者 | 自动续费无提醒、退款窗口短、积分消耗不可预期（Trustpilot 397 条，4.3 分） | <https://scispace.com/pricing> |
| Scite | 看一篇论文被支持还是被反驳的引用语境；引用提醒 | Basic 20 美元/月（年付）；Pro 50；Team 250 美元/月含 8 席 | 个人与机构，自称 200 万+ 用户 | 未查到 | <https://scite.ai/pricing> |
| ResearchRabbit / Litmaps（同属 Litmap Limited） | 引用网络可视化、从种子论文扩展、新文提醒 | ResearchRabbit 免费（50 篇种子），RR+ 10–12.5 美元/月；Litmaps Pro 10 美元/月 | 个人；机构版另议 | 未查到 | <https://www.researchrabbit.ai/pricing> |
| Connected Papers | 从一篇论文生成相似论文图谱，开题时用 | 免费每月 5 张图；学术版 6 美元/月（年付 72）；商业版 20 美元/月 | 个人 | 未查到 | <https://www.connectedpapers.com/pricing> |
| Semantic Scholar | 免费论文检索，也是多家工具的底层数据 | 免费（非营利） | 无 | 下游工具受其摘要/全文覆盖限制 | <https://www.semanticscholar.org/about> |
| alphaXiv | 在 arXiv 论文上讨论、看热度、发现论文 | 未查到收费；融资 700 万美元种子轮 | 风投出资；自称数百万用户 | 讨论偏浅、难达到临界规模（HN 研究者） | <https://siliconangle.com/2025/11/19/alphaxiv-raises-7m-funding-become-github-ai-research/> |
| Zotero 及 AI 插件（zotero-gpt、papersgpt、zotero-mcp、zotero-pdf-translate） | 文献管理；插件用于与库对话、翻译 | 软件免费；云存储 2GB 20 美元/年、6GB 60、无限 120；插件免费，用户自付模型 API | 个人 | 库大了难搜；AI 插件慢、有 bug；要在多个工具间复制 | <https://www.zotero.org/storage> |
| NotebookLM（Gemini Notebook） | 对一组来源提问、音频概览 | 随 Google AI 套餐：免费 / Plus 4.99 / Pro 19.99 / Ultra 99.99 美元起每月 | 个人 | 每本来源数有上限；音频概览浅、会误导 | <https://gemini.google/subscriptions/> |
| Readwise Reader | 稍后读、高亮同步到 Obsidian/Notion | 9.99 美元/月（年付，含 Reader）；Lite 5.59；学生半价 | 个人 | 未查到 | <https://readwise.io/pricing> |
| 腾讯 ima | 个人/团队知识库 + 搜读写，已向报告、PPT 和技能扩展 | 未查到收费信息 | — | 未查到 | <https://news.qq.com/rain/a/20260318A07B1X00> |
| ChatGPT Deep Research | 通用深度调研、文献综述初稿、访谈和财报准备 | 从业者提到的是 200 美元/月的 Pro 档；官方定价页和额度说明这次打不开 | 个人自费为主（有人自费后用于工作） | 读不到付费墙和非公开信息；取数出错、引用聚合站；额度不够；有人试用后退订 | <https://stratechery.com/2025/deep-research-and-knowledge-value/> |
| Gemini Deep Research | 同上；有人认为找到的相关来源更多 | 各档都含：免费、4.99、19.99、99.99 美元起每月 | 个人 | 引用多但来源参差、分析偏浅（教授的对比） | <https://gemini.google/subscriptions/> |
| Claude Research | 通用调研；重度用户用 Claude Code 自建多智能体调研 | Pro 17 美元/月年付或 20 月付；Max 100 美元/月起 | 个人 | 自建流水线约 30 分钟烧完 Max 5x 额度 | <https://claude.com/pricing> |
| Kimi（深度研究 / Agent） | 行业研究、竞品、投资尽调、学术综述（厂商列出的用例） | 国际版 19 / 39 / 99 / 199 美元每月，各功能共用一个额度池；2025-09 国内上线时为 49 元和 99 元每月 | 个人 | 慢（约 20 分钟）、呈现单调、配图用错年份 | <https://www.kimi.ai/zh-hans/help/membership/membership-overview> |
| 豆包 / 秘塔 / 纳米 AI 的深度研究 | 快速调研，交付网页、播客、PPT 等形式 | 这次没打开到定价页 | — | 豆包浅；秘塔出现事实错误；纳米洞察不如 Kimi（同一位评测者） | <https://www.woshipm.com/ai/6270278.html> |
| Manus | 通用智能体：深度研究、Wide Research、网站、幻灯片；含定时任务 | 月度积分 4,000 / 8,000 / 40,000 三档，价格数字页面未能读出；媒体称 20–200 美元/月 | 个人为主，主要收入来自美国；2025-12 自称 ARR 1 亿美元 | 付费用户多是低频杂务的泛用户，不是深度研究者（行业媒体的判断） | <https://manus.im/blog/manus-100m-arr> |
| Flowith | 画布式智能体 | Pro 标价 19.90、Ultimate 49.90、Infinite 499.90 美元每月 | 个人 | 未查到 | <https://flowith.io/pricing> |
| MiroMind（MiroThinker） | 开源深度研究模型和平台 | 未查到 | — | 未查到 | <https://miromind.ai/> |
| 开源 deep research（gpt-researcher、dzhng/deep-research、Tongyi DeepResearch、local-deep-research） | 自建、可接私有文档和本地模型的深度调研 | 免费，自付模型费用 | 个人、团队 | 需要自己搭和调 | <https://api.github.com/search/repositories?q=deep+research+in:name,description&sort=stars&per_page=15> |
| 研究智能体（autoresearch、AI Scientist、Agent Laboratory、Paper2Code） | 自动跑实验、生成论文、论文转代码 | 开源；AI Scientist 每篇约 6–15 美元模型费 | 个人，自付 GPU 和 API | 实验失败率高、新颖性误判、引用少且旧；易过拟合验证集 | <https://arxiv.org/abs/2502.14297> |
| Overleaf | 多人协作写 LaTeX 论文 | 一位课题组负责人自述团队版每年 500 欧元以上 | 课题组、机构 | 排版苦活多 | <https://news.ycombinator.com/item?id=46783752> |
| PitchBook | 私募市场的公司、交易、基金数据 | 不公开；买家自报单席约 1.2–1.35 万美元/年，3 席约 2–2.4 万美元/年 | 机构 | 贵；有起购席位和多年合同；不许共享账号 | <https://www.failory.com/blog/pitchbook-pricing> |
| AlphaSense | 研报、纪要、专家访谈库的检索和 AI 综合 | 不公开；Vendr 成交中位数 18,375 美元/年（40 笔） | 机构，自称 7,000+ 企业客户 | 专家访谈等高级内容另占合同 20–40% | <https://www.vendr.com/marketplace/alphasense> |
| IT桔子 | 国内创投数据库，查融资事件、导出数据 | 这次没读到价格（订购页空白）；超级会员含高级筛选、无限下载和募资/LP 数据 | 投资机构、企业战略部、咨询、媒体，也有个人 | 未查到 | <https://www.sohu.com/a/381643907_355020> |
| 企名片 Pro | 一级市场数据终端 | 不公开，只对企业对公销售 | 机构，自称 200 多家头部投资机构和投行 | 未查到 | <https://pro.qimingpian.cn/> |
| Similarweb / OpenRouter 数据 | 产品流量、模型调用量等行业底表数据 | Similarweb 企业方案不公开；OpenRouter 榜单 API 需其账号，定价未说明 | 机构 | 未查到 | <https://www.similarweb.com/corp/pricing/> |

## 数字

- 816 名已验证的论文作者中 81% 已把 LLM 用进研究流程；信息检索类用法约 49% 至少偶尔用，编辑润色约 45%；数据清洗分析 69% 从不用，数据生成 73% 从不用；59% 更偏好开源或非营利模型，只有 2.85% 偏好商业模型。（survey-or-study） <https://arxiv.org/html/2411.05025>
- NeurIPS 2025：至少 53 篇已接收论文含 100 多条 AI 幻觉引用；主会投稿 21,575 篇，接收率 24.52%。（news） <https://fortune.com/2026/01/21/neurips-ai-conferences-research-papers-hallucinations/>
- ICLR 2026：约 20,000 篇投稿中扫描 300 篇，发现 50 多篇含幻觉引用。（practitioner（HN 帖转述 GPTZero）） <https://news.ycombinator.com/item?id=46181466>
- PaperBench：20 篇 ICML 2024 论文、8,316 个评分子任务，最好的智能体平均复现得分 21.0%。（survey-or-study） <https://arxiv.org/abs/2504.01848>
- SciConBench：9.11K 个来自系统综述的问题，最好的智能体事实 F1 为 0.337。（survey-or-study） <https://arxiv.org/abs/2606.11337>
- Sakana AI Scientist 独立评测：42% 实验因代码错误失败；稿件中位数 5 条引用；每篇 6–15 美元、约 3.5 小时人工。（survey-or-study） <https://arxiv.org/abs/2502.14297>
- Elicit 首页称超过 500 万研究者使用，前 20 大药企中 8 家在用；Pro 49 美元/月、Scale 169 美元/月。（vendor） <https://elicit.com/>
- Consensus 称超过 500 万研究者、学生和临床医生使用；Pro 12、Deep 45 美元/月（年付）。（vendor） <https://consensus.app/pricing/>
- Scite 称 200 万+ 用户；SciSpace 称 100 万+ 研究者。（vendor） <https://scite.ai/pricing>
- 腾讯 ima 月活超过 1300 万，知识库文件超过 4.2 亿份（2026-03-18 披露）。（news） <https://news.qq.com/rain/a/20260318A07B1X00>
- GitHub 星标（2026-10-05）：karpathy/autoresearch 97,262；gpt-researcher 29,916；Alibaba-NLP/DeepResearch 20,005；dzhng/deep-research 19,754；AI-Scientist 14,657；zotero-pdf-translate 11,976；local-deep-research 9,152；zotero-gpt 7,452；AgentLaboratory 5,885；zotero-mcp 5,236；Paper2Code 4,974。（industry-report（GitHub API）） <https://api.github.com/search/repositories?q=repo:karpathy/autoresearch+repo:SakanaAI/AI-Scientist+repo:SamuelSchmidgall/AgentLaboratory+repo:going-doer/Paper2Code+repo:windingwind/zotero-pdf-translate+repo:54yyyu/zotero-mcp+repo:SakanaAI/AI-Scientist-v2+repo:LearningCircuit/local-deep-research>
- OpenAI Deep Research 一次约 5 分钟，产出 13 页、3,778 词、6 条引用的文献综述。（practitioner） <https://www.oneusefulthing.org/p/the-end-of-search-the-beginning-of>
- 半手工综述（自己挑 PDF 再交给模型）平均得分 9.08/10，高于两个自动 deep research。（practitioner） <https://xiangyu-yin.com/content/post_deep_research.html>
- 学术深度检索一次 8 分钟到 1 小时；LLM 做相关性判断与人工判断的相关度约 80%。（practitioner） <https://aarontay.substack.com/p/why-i-think-academic-deep-research>
- 自建 deep research 流水线：约 30 分钟烧完 Claude Max 5x 额度，起 111 个智能体，只完成 25 项核验。（practitioner） <https://quesma.com/blog/custom-deep-research-pipeline/>
- 国产深度研究同题实测：Kimi 约 20 分钟读 1026 个网页；豆包约 1 分钟 39 个页面；纳米 AI 约 8 分钟 360 个页面。（practitioner） <https://www.woshipm.com/ai/6270278.html>
- PitchBook 买家自报价格：单席 1.2–1.35 万美元/年，3 席 2–2.4 万美元/年。（industry-report） <https://www.failory.com/blog/pitchbook-pricing>
- AlphaSense 年合同中位数 18,375 美元（40 笔，区间 9,750–51,300）；官网称 7,000+ 企业客户、5 亿+ 文档。（industry-report / vendor） <https://www.vendr.com/marketplace/alphasense>
- 64% 的投资人用 AI 加速公司研究（Affinity 2025 报告页）。（survey-or-study（厂商主办）） <https://www.affinity.co/report/the-2025-investment-benchmark-report>
- 二手转引 Affinity 2025：近 3,000 家 VC 机构的调查中，76% 用 AI 自动化日常事务，用 AI 直接做投资决策的比例从 40% 降到 13%；49% 的机构每个项目用 4–6 个数据源。未在 Affinity 原页上核到这三项。（vendor（DiligenceGPT 转引）/ news（Beige Media 转引）） <https://www.dgpt.io/insights/modern-vc-due-diligence-playbook>
- Manus 2025-12-17 自称 ARR 1 亿美元、总收入年化超 1.25 亿美元、处理 147T tokens。（vendor） <https://manus.im/blog/manus-100m-arr>
- 2026 年 5 月 Manus 月移动端收入约 360 万美元、Genspark 约 130 万美元；4 月网页访问 3030 万和 2135 万；两者定价 20–200 美元/月。（news） <https://eu.36kr.com/en/p/3855891603035398>
- alphaXiv 融资 700 万美元种子轮，自称数百万用户。（news / vendor） <https://siliconangle.com/2025/11/19/alphaxiv-raises-7m-funding-become-github-ai-research/>
- 企名片 Pro 自称 200 多家头部投资机构和投行在用。（vendor） <https://pro.qimingpian.cn/>
- 一位课题组负责人自述约 40% 的时间在 Overleaf 里，团队版每年 500 欧元以上。（practitioner） <https://news.ycombinator.com/item?id=46783752>

## 可以交给 AI 的、只能协助的、不会交出去的

【可以整件交给持久同事（结果能逐条核对、错了代价低、当事人自己也称之为苦活）】
1. 文献库的维护：按课题持续检索、去重、入库、打标签，把新论文增量写进一份“活的综述”和变更日志。依据：Karpathy 的做法就是让 LLM 负责摘要、交叉引用、归档和记账；厂商已把提醒做成付费点，但没人把提醒接到综述上。
2. 引文存在性核对和 BibTeX 清洗：逐条比对 DOI、标题、作者、出处。依据：NeurIPS/ICLR 的假引用事件；研究者明确想要自动 DOI/bib 校验。
3. 在用户已登录的浏览器里取用户有权读的全文和数据：付费期刊、PitchBook、AlphaSense、IT桔子、企名片等。依据：付费墙和非公开信息是各路从业者最一致的抱怨；云端产品做不到。
4. 对比表和数据底表的更新：SOTA 表、模型价格和调用量、融资事件，按固定来源定期刷新，每格带出处和时间。
5. 私有材料整理：访谈录音、会议纪要、云盘文档整理成底稿；底稿更新、PPT 初稿。依据：一线投研负责人自己列出这些已交给 AI。
6. 格式类苦活：LaTeX、TikZ、参考文献格式、校对。依据：816 人调查里润色是最常见、被认为风险最低的用法。

【只能协助（必须有人把关）】
1. 文献摸底的“全不全”和综述的叙述取舍：最好成绩来自“人挑论文 + 模型综合”的半手工做法；工具首轮会漏、会把新文排在奠基文之前。
2. “这篇引用是否真的支持这句话”：检测方自己承认仍很难；基准上最好的智能体事实 F1 只有 0.337。
3. 复现和实验循环：智能体可以夜里跑，但 PaperBench 只有 21%，独立评测 42% 实验失败，还可能对验证集过拟合；人要看曲线和泛化。
4. 行业报告里的数字：让同事取数并标来源层级，人追一手来源。分析师的原话意思是表里只要有错就整张不可信。
5. 竞争格局和市场判断：可以铺底稿，但它不知道自己漏了什么。

【不会交出去】
1. 选题、研究品味、非共识判断、投资决策和定价——从业者一致保留；被转引的调查显示用 AI 直接做投资决策的比例在下降。原因是判断和责任。
2. 专家、创始人访谈和实地调研——一手信息和关系只能人去拿。
3. 署名内容的最终叙述——学术诚信政策和导师要求；研究者担心被指 AI 代写。原因是信任和制度。
4. 把机密材料发到外部服务——有人自费用外部模型却担心保密。这反过来是“全部留在本机”的卖点，不是阻碍。

## 出乎意料的发现

1. 付费意愿在“访问权和数据”上，不在“摘要和报告”上。文献类 AI 工具个人档只有 6–49 美元/月，而机构为 PitchBook、AlphaSense 付 1–2 万美元/年每席。读摘要、速读单篇这类浅活有大量免费工具，付费意愿最低。

2. 专业用户要的是检索质量和可核验，不是漂亮的报告。学术检索评测者明确把重点从“生成的综述”转到“深度检索”；行业分析师说表里有一个错就整张不能用；博士生自建流程里最被同行认可的是核验流水线。

3. “每日简报”的假设只对了一半。定时例行确实有人要，但形态是“把新东西并进我正在做的课题、综述或数据底表”，不是独立的晨间新闻。证据：厂商把提醒做成付费功能，Karpathy 的 LLM Wiki 强调累积而不是每次重查，没有一个从业者来源提到想要每日资讯摘要。

4. 研究者愿意等。深度检索 8 分钟到 1 小时被接受，重度用户还主动把调研拉长到数小时。后台跑几十分钟到几小时不是缺点。

5. 自己动手搭的热度远高于买现成的。autoresearch 近 10 万星，开源 deep research 多个 2–3 万星，Zotero 接 AI 的插件和 MCP 各有数千星；816 人调查里 59% 偏好开源或非营利模型，只有不到 3% 偏好商业模型。本地、可控、可改比“全托管”更合这群人的口味。

6. 通用智能体的收入不能当作深度研究需求的证据。行业媒体的分析是 Manus、Genspark 的付费用户多是做低频杂务的泛用户（做海报、处理表格），他们避开的正是需要桌面环境的工具。

7. 重度用户同时订两三家并互相印证，甚至有人为额度想开多个账号，也有人试用后退掉 200 美元档。单一产品的忠诚度很低，额度和可信度是流失点。

8. 研究者不想让 AI 写内容和生成引用，只想让它干排版、画图、校对。这和“自动写综述”的产品直觉相反。

9. 国内读者装得最多的 Zotero 插件是翻译，不是问答。

10. Papers with Code 在 2025 年 7 月被关停后，SOTA 对比表成了一个没人接好的空位。

11. 文献工具厂商正在往上提价（Elicit Scale 169 美元、SciSpace Max 标价 200 美元/月），同时用户评价里的抱怨集中在积分消耗和自动续费，说明按积分计费在这群人里招反感。

## 没查到的

【这次没能打开或核实的】
- WebSearch 配额在开始前已用完，检索改用应用内浏览器里的 Bing；英文长查询命中差，覆盖面比正常搜索窄。
- Reddit（r/MachineLearning、r/PhdProductivity 等）：抓取工具和浏览器都被拦，只在 Google 结果页看到标题，没有作为证据使用。
- 知乎：跳出安全验证并要求登录，没有继续。小红书、脉脉、即刻、X 没有尝试到可读内容。因此中文一线从业者的第一手自述很少，中文证据以媒体报道、厂商页面和一篇产品经理评测为主。
- Nature 关于科学家如何看 deep research 的报道：付费墙，只看到导语。
- OpenAI 的 deep research 说明页和定价页（403 / 人机验证）、Perplexity 帮助页和博客（403）、Genspark 定价（403）、秘塔定价（404）、IT桔子订购页（空白）、七麦和 AMiner（只有标题）、Crunchbase 和 Similarweb（不显示价格）、Katina 对 Undermind 的评测（403）、John Schulman 的 ML 研究指南（连接失败）。
- Manus 定价页能读到积分档位但价格数字读不出。Paper Digest 定价页内容像模板占位，没有采用。知网研学只看到搜索摘要里的价格，没有打开原页，没有采用。
- 没查到：Grok、通义、腾讯元宝、智谱、豆包的深度研究定价和额度；CB Insights、Sensor Tower、烯牛数据的价格；Cubox、飞书、Notion 在研究场景的用法和抱怨；Semantic Scholar、Zotero、NotebookLM 的用户数。
- Affinity 调查的三个数字（76%、40%→13%、49%）只在转引方页面看到，Affinity 原页只核到 64% 这一项。
- HN 帖子是通过 Algolia API 读取、由小模型摘要的，个别评论者的归属和措辞可能有偏差；对外引用单条评论前应回原帖核对。
- AI 行业分析师和做 AI 技术尽调的投资人，直接证据最薄：A2 的“私有材料整理”和“数据底表”两项主要借用了金融投研和厂商说法。

【只有访谈能回答的】
1. 一个真实课题里各阶段到底花多少小时？哪一步最想甩掉？（公开来源几乎没有小时数。）
2. 国内 AI 研究生和研究工程师实际装了什么、为什么付费或不付费？校园网和机构订阅怎样影响他们读全文？
3. 他们愿不愿意让智能体用自己已登录的浏览器去读付费库？机构的合规和数据库条款是否允许？
4. “活的综述”多久看一次才不算打扰？是按周消化还是有新的关键论文才提醒？
5. 把实验循环交出去时，GPU 在哪里（本机、实验室服务器、云）？桌面应用怎样接上？
6. 做 AI 行业研究的分析师和投资人，底表里到底有哪些列、数据从哪来、多久更新一次？技术尽调时如何验证对方的技术声明？
7. 导师、学校、会议对 AI 参与综述和写作的规定，实际卡在哪一步？
8. 个人自费的上限是多少？从 20 美元升到 100–200 美元档的理由是什么，什么情况下会退订？
9. 团队场景：个人的课题文件夹和记忆要不要、怎样共享给组里的人？
