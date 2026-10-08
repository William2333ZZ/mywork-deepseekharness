# 共同 2：委托与信任

原始调研记录（2026-10-05）。未经逐条复核，复核结果见上一级目录的 `audit.md`。数字和说法以各条所附网址的原文为准。

## 人群

- **F1 卖方行业研究员与研究所**：券商研究所的行业分析师、首席、所长、金工团队
  - 深度研究工作：行业深度、公司首次覆盖、海外对标综述、盈利预测更新；基础环节（股权沿革、综述、数据处理、初稿）已大量交给 AI，价值转向产业认知、一线调研和客户沟通；受合规约束须人工终审。
  - 规模：三季度末注册分析师约 5891 人，较年初净减 138 人（财联社 2026-10-02）；研报总量降至 18.13 万份、人均 31.23 份/年（上海证券报 2026-09-24，未注明统计年份）
- **F2 公募与大型机构的买方研究员、基金经理**：公募基金主动权益、量化、固收的研究员和基金经理
  - 深度研究工作：研报速读、财务分析、政策跟踪、纪要结构化、因子挖掘、观点置信度评估；机构自建多智能体平台并把资深方法写成 Skill；人负责提问、验证假设和决策。
  - 规模：来源未给出人数；富国基金平台内置 20 余个 Agent、60 余个 Skill、50 余个 MCP，日请求超 3000 次（券商中国 2026-09-29）
- **F3 小型私募与独立研究型投资者**：私募创始人兼投资经理、写公开研究的独立投资者
  - 深度研究工作：自己搭常驻智能体做每日跟踪和事后打分；用桌面智能体做专项数据采集、年报比对、想法筛选、研究归档；自己付费、自己承担核对。是本次证据里最像目标用户的一群。
  - 规模：来源未给出人数；有私募给每位员工每年至少 5 万元 AI 额度（上海证券报 2026-09-22）
- **A1 做 AI 与科学研究的人**：研究者、研究工程师、博士生、理论物理等领域的教授
  - 深度研究工作：文献综述、推导与代码、实验循环、论文写作；已有人让智能体连续运行数天或整夜，用计划文件、进展日志、测试基准和跨模型评审来控制质量。
  - 规模：816 名论文作者的调查中 81% 已在研究流程中使用 LLM（arXiv 2411.05025）；Anthropic 内部调查 132 人
- **A2 深度研究 AI 行业的人**：独立行业分析师、研究型通讯团队、做技术判断的教授和记者
  - 深度研究工作：市场与技术专题、带数据的行业报告；把证据收集、文档处理、代码交给智能体，人定题、定参数、复核；对数字来源极其敏感。
  - 规模：来源未给出人数

## 工作流

1. **1. 立题与定框架（人）**：研究者选题、定方向、写下自己的框架和口径；把它写成给智能体的说明文件或项目级指令。来源一致认为这一步不交出去。
   - 产出：问题定义、框架与口径、项目说明文件
   - 工具：CLAUDE.md / program.md / Cowork 项目指令 / 机构 Skill
   - 时间：来源未给出时间；Mollick 认为稀缺的正是知道该要什么。
   - 来源：<https://www.anthropic.com/research/vibe-physics> <https://github.com/karpathy/autoresearch> <https://www.oneusefulthing.org/p/management-as-ai-superpower> <https://www.yetanothervalueblog.com/p/basics-for-using-claude-cowork-with>
2. **2. 计划拆解与验收标准（人机共同）**：把课题拆成阶段和任务，定下每一步由谁做、怎样算完成；研究者希望计划可在执行中调整。
   - 产出：总计划、任务清单、可检验的完成标准
   - 工具：分层 markdown 计划；共同计划界面（Cocoa 原型）
   - 时间：Schwartz 的项目是 7 个阶段 102 个任务；Exponential View 强调部署前先定可检验的终点。
   - 来源：<https://www.anthropic.com/research/vibe-physics> <https://arxiv.org/abs/2412.10999> <https://www.exponentialview.co/p/seven-lessons-for-managing-ai-agents>
3. **3. 搜集与抽取（智能体为主）**：文献、公告、研报、纪要、数据的搜集、阅读、抽取和初步整理；遇到付费墙时现有产品只能绕开。
   - 产出：资料库、摘要、抽取表、综述初稿
   - 工具：深度研究模式、桌面智能体、机构自建平台、专业数据库
   - 时间：券商受访者称综述资料从两周缩到十几分钟、股权与沿革整理从一天缩到十几分钟（完成度约七成）；国金金工测算每天省 1–2 小时。
   - 来源：<http://finance.eastmoney.com/a/202609243883584012.html> <http://finance.eastmoney.com/a/202609223880385983.html> <https://www.understandingai.org/p/these-experts-were-stunned-by-openai>
4. **4. 计算、实验、建表（智能体执行，确定性代码把关）**：由脚本做衍生计算、跑模拟或实验、逐市场采集对比数据；用参考实现或单一指标裁判。
   - 产出：数据表、图、实验记录、可复跑的代码
   - 工具：Python 引擎、git、测试基准、Claude Code 等
   - 时间：autoresearch 一夜约 100 个实验（每个限 5 分钟）；Schwartz 项目约 40 CPU 小时模拟；Walker 的 50 市场比价表用了一个下午。
   - 来源：<https://github.com/karpathy/autoresearch> <https://github.com/Veblin/invest-skills> <https://www.yetanothervalueblog.com/p/how-i-built-three-research-tools> <https://www.anthropic.com/research/long-running-Claude>
5. **5. 核对与交叉验证（人为主，第二模型辅助）**：逐行审推导和数字，回到一手来源核引用，用其他模型交叉检查，反复追问直到不再出新错。这是人的时间主要去处，也是信任破裂最常发生的环节（伪造图、编系数、引用不符）。
   - 产出：勘误、未验证清单、被否掉的路线记录
   - 工具：多家模型互审、领域内一致性检验、人工回查原文
   - 时间：Schwartz 两周项目里人的监督约 50–60 小时；HN 用户称深度研究结果需要全部复核；METR 测得资深开发者用 AI 反而慢 19%。
   - 来源：<https://www.anthropic.com/research/vibe-physics> <https://hn.algolia.com/api/v1/items/43133207> <https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/> <https://arxiv.org/abs/2509.04499>
6. **6. 形成观点与成稿（人判断，智能体起草和改稿）**：研究者下结论、定观点；智能体出稿、改稿、做图；机构里 AI 生成后由人终审。
   - 产出：报告或论文终稿
   - 工具：同上；机构为 AI 生成加人工终审的双岗
   - 时间：Schwartz 的论文共 110 版草稿；最终润色由他本人完成。
   - 来源：<https://www.anthropic.com/research/vibe-physics> <http://finance.eastmoney.com/a/202609243883584012.html> <http://finance.eastmoney.com/a/202609293886444220.html>
7. **7. 沟通、合规与发布（人）**：与客户、管理层、专家、合作者沟通；过合规和署名；这部分来源一致认为不交给 AI。
   - 产出：对外发布的研究、路演与交流
   - 工具：人
   - 时间：来源未给出时间。
   - 来源：<http://finance.eastmoney.com/a/202609243883584012.html> <https://www.yetanothervalueblog.com/p/when-ai-reads-every-10-k-the-only> <https://www.anthropic.com/research/anthropic-interviewer>
8. **8. 持续跟踪与复盘（智能体例行，人看异常）**：按领域分工的智能体每日抓取并汇总，裁判智能体按事后事实给之前的判断打分；人工修正回灌知识库；研究笔记沉淀为可查询的项目记忆。
   - 产出：跟踪表、评分记录、更新后的知识库或 wiki
   - 工具：定时智能体、裁判智能体、项目文件夹、LLM wiki
   - 时间：张炀民的系统每日 6 点起跑；记忆库半年后会出现自信但错误的条目（HN 用户经验）。
   - 来源：<http://finance.eastmoney.com/a/202609223880385983.html> <https://finance.eastmoney.com/a/202609283884545227.html> <https://hn.algolia.com/api/v1/items/47899844> <https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f>

## 需求

### 1. 当我拿到 AI 交回的研究稿时，我想每个数字和关键结论都能一步点回带日期的一手出处（公告第几页、论文哪一段、哪次运行的代码），以便我只抽查而不必重做一遍。

- 证据强弱：强
- 谁：两组都有：卖方/买方研究员、基金经理、科研人员、AI 行业分析师
- 痛在哪：深度研究类产品常引二手聚合站或口径不对的来源，引用与原文对不上；一张表里只要发现一个错数，整张表就不敢用；读者分不清哪条是错的。
- 多久一次：每一份交付物、每一次用深度研究模式
- 现在怎么凑合：自己回到一手来源逐条核；同一问题跑多个产品，只留互相印证的部分；自建流程强制每个数字带来源、多源冲突并列呈现。
- 缺口：现成产品的引用准确率不稳定；出处做不到页/段/单元格级；没有人给来源本身分级（一手、二手、聚合）；付费库里的出处无法回链。
- 证据：
  - 检查 OpenAI 自己拿来做样例的智能手机市场报告：来源用的是流量统计站和二手聚合站，日本市场份额与原始调研方向相反；结论是表里有错就无法信任，只有本身是行家才能把几天的活压到几小时。（科技行业独立分析师 Benedict Evans；practitioner；2025-02-18） <https://www.ben-evans.com/benedictevans/2025/2/17/the-deep-research-problem>
  - 用深度研究做一项薪酬对比分析：只找到所需信息的约六成，却以完整成果的口吻交付，必须全部人工复核。另一位评论者说自己跨多个产品比对后丢掉 65–75% 的结果。（Hacker News 评论者（tptacek、iandanforth，技术从业者）；practitioner；2025-02-21） <https://hn.algolia.com/api/v1/items/43133207>
  - 审计多款生成式搜索与深度研究系统：引用准确率在 40%–80% 之间，大量陈述得不到其所列来源支持，对有争议的问题倾向单边且自信。（Salesforce AI Research 研究者（Venkit 等）；survey-or-study；2025-09-02） <https://arxiv.org/abs/2509.04499>
  - 外部 AI 工具存在数据幻觉、事实错误、信息源可信度不足，结果仍要用传统研究方法交叉验证，难以直接用于投资决策。（华宝基金权益投资部基金经理 夏林锋（上海证券报采访）；news；2026-09-22） <http://finance.eastmoney.com/a/202609223880385983.html>
  - 券商金工团队在论文中的判断：模型只能辅助信息处理，高价值研判仍依赖可追溯的数据源、清晰的推理链和人工复核。（国联民生证券金工团队（上海证券报转述）；news；2026-09-24） <http://finance.eastmoney.com/a/202609243883584012.html>
  - 个人开发者自建的 A 股研究 skills 把每个数字可回溯到来源作为核心卖点：多源冲突并列保留，核不了的内容单独标记，报告交付前过机器质检。（独立开发者/个人投资者 Veblin（GitHub README）；practitioner；2026） <https://github.com/Veblin/invest-skills>
  - 对照实验（N=308）：回答附带来源时，用户对错误回答的依赖下降；而只附解释会同时抬高对正确和错误回答的依赖。（普林斯顿/微软研究院 HCI 研究者（Kim 等，CHI 2025）；survey-or-study；2025-02-12） <https://arxiv.org/abs/2502.08554>

### 2. 当我做一个深度课题时，我想把搜集、整理、抽取、初稿这些产能型工作整段交出去，以便把时间留给判断、观点、实地调研和与人沟通。

- 证据强弱：强
- 谁：卖方行业研究员与所长、买方研究员/基金经理、科研人员
- 痛在哪：基础梳理（股权架构、历史沿革、综述资料、公告与研报阅读、数据提取）占掉大量时间；但让 AI 直接出观点会出错。
- 多久一次：每个课题的前半段；日常持续发生
- 现在怎么凑合：通用大模型加机构自建平台做初稿，人工终审；一线调研、产业链交叉验证、客户沟通由人做。
- 缺口：交出去的部分仍只有约七成完成度，需要人收尾；分工边界靠个人经验摸索，没有产品把交付物规格和验收标准固定下来。
- 证据：
  - 股权架构、历史沿革的整理从一天压到十几分钟，完成度约七成；研究员的价值转向行业底层认知和客户信任关系。（某券商研究所所长（匿名，上海证券报采访）；news；2026-09-24） <http://finance.eastmoney.com/a/202609243883584012.html>
  - 综述资料整理从两周缩到十几分钟；一线调研拿到的一手信息 AI 抓不到，是研究员新的核心竞争力；买方要的是交叉验证过的产业洞察。（某券商海外研究团队首席（匿名，上海证券报采访）；news；2026-09-24） <http://finance.eastmoney.com/a/202609243883584012.html>
  - 试过让 AI 直接产出投资观点但出错，改为 AI 负责筛选观点和发现异常，人负责交叉验证和决策。（鸣山基金创始人兼投资经理 张炀民（前景林资产研究员）；news；2026-09-22） <http://finance.eastmoney.com/a/202609223880385983.html>
  - 132 名工程师和研究员的调查加 53 场访谈：过半的人认为能完全放手的工作只占 0–20%；交出去的是容易验证、低风险、枯燥的任务，设计、战略和品味留给自己。（Anthropic 内部研究（厂商对自家员工的研究）；survey-or-study；2025（数据期 2025-02 至 08）） <https://www.anthropic.com/research/how-ai-is-transforming-work-at-anthropic>
  - 公募的做法是 AI 生成、人工审核：AI 处理研报、纪要、调研记录等非结构化文本并评估观点的历史置信度，人负责提问、验证关键假设和最终决策。（富国基金量化基金经理及相关人士（券商中国采访）；news；2026-09-29） <http://finance.eastmoney.com/a/202609293886444220.html>
  - 当 AI 能读完所有公开文件后，读得更细不再是优势；优势转向独有数据、管理层面谈、专家网络这些 AI 接触不到的东西。（价值投资者、Yet Another Value Blog 作者 Andrew Walker；practitioner；2026-08-13） <https://www.yetanothervalueblog.com/p/when-ai-reads-every-10-k-the-only>

### 3. 当我决定要不要把一件事交给 AI 时，我想核对它的成本明显低于我自己做的成本，以便交出去真的省时间而不是换个地方花时间。

- 证据强弱：强
- 谁：两组都有，越资深越在意
- 痛在哪：如果每个细节都要复核，等于没省；更糟的是人会高估 AI 带来的提速。
- 多久一次：每次委托前的隐性判断
- 现在怎么凑合：只把容易验证的任务交出去；把结果当实习生稿对待；用是否值得的粗算（自己做的时间、一次成功的概率、提示加等待加评估的时间）决定。
- 缺口：产品不告诉用户哪些部分已被机器核过、哪些必须人看；没有按风险排序的抽查清单；核对工作量不可预估。
- 证据：
  - 125 位科学家的访谈中 79% 提到信任与可靠性是主要障碍；有数学家说核对 AI 输出花的时间和自己做差不多，有安全研究员说逐条复核就失去了意义。（受访科学家（Anthropic Interviewer 研究，厂商主持的访谈）；survey-or-study；2025-12-04） <https://www.anthropic.com/research/anthropic-interviewer>
  - 16 名资深开源开发者、246 个任务的随机对照：允许用 AI 时完成时间反而慢 19%，而他们事前预期快 24%、事后仍以为快了 20%。（METR 研究团队；survey-or-study；2025-07-10） <https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/>
  - 提出委托的三要素：人自己做要多久、AI 一次做对的概率、提示加等待加评估要多久；稀缺的是知道该要什么以及有专业能力评估结果。（沃顿商学院教授 Ethan Mollick；practitioner；2026-01-27） <https://www.oneusefulthing.org/p/management-as-ai-superpower>
  - 一篇真实物理论文：两周完成（他估计带研究生要一到两年），但人投入了 50–60 小时监督，逐行检查并反复追问直到不再出新错。（哈佛大学物理学教授 Matthew Schwartz（文章发表在 Anthropic 网站）；practitioner；2026-03-23） <https://www.anthropic.com/research/vibe-physics>
  - 在自己专业（游戏软件工程）里核对深度研究的输出，估计约八成见解有事实错误；另一位做定性文本研究的用户则说没遇到幻觉问题并为更多额度买了多个订阅。（Hacker News 评论者（caseyy、aprilthird2021）；practitioner；2025-02-21） <https://hn.algolia.com/api/v1/items/43133207>

### 4. 当我让 AI 做研究时，我想它按我的研究框架、指标口径和筛选标准做，而不是给一份通用模板报告，以便产出能直接进我的体系。

- 证据强弱：强
- 谁：买方基金经理、卖方资深分析师、独立投资者；科研人员（按自己的研究计划分步）
- 痛在哪：通用大模型的输出与自己的投研框架脱节；资深人员的方法只在脑子里，难以复用；每次都要重新交代标准。
- 多久一次：每个课题、每次例行更新
- 现在怎么凑合：机构把资深研究员的方法、行业框架、合规红线写成可复用的 Skill；个人把规则写进项目级指令，通过反复反馈让系统学会自己的筛选口味。
- 缺口：框架的沉淀靠人手写；纠正过的东西是否真的被记住、下次是否照做，用户看不见也验不了。
- 证据：
  - 核心难题不是用不用大模型，而是把 AI 与自己的投研框架深度结合；主观投资涉及景气判断、商业模式认知、逻辑迭代。（华宝基金基金经理 夏林锋；news；2026-09-22） <http://finance.eastmoney.com/a/202609223880385983.html>
  - 国泰基金把资深研究员的方法论、行业框架与合规红线沉淀为标准化 Skill；易方达让普通员工创建和分享 Skill，把个人经验变成组织能力；兴证全球把人工修正过的条目回灌知识库。（国泰基金、易方达基金、兴证全球基金（券商中国/证券时报报道）；news；2026-09-29） <http://finance.eastmoney.com/a/202609293886444220.html>
  - 为每个研究项目建文件夹和项目级指令，之后该项目下研究的每家公司都自动检查他关心的信号（如近期 CFO 增持）。（价值投资者 Andrew Walker；practitioner；2026-05-01） <https://www.yetanothervalueblog.com/p/basics-for-using-claude-cowork-with>
  - 不到 45 分钟搭了一个每周出 5 个投资想法的工具，靠他的反馈逐步调到自己的风格（市值偏好、事件类型）；他担心的正是这套个人筛选器可以被训练出来。（价值投资者 Andrew Walker；practitioner；2026-04-29） <https://www.yetanothervalueblog.com/p/i-spent-45-minutes-building-the-ai>
  - 把成熟研究方法封装成标准功能，让分析师一句话调数据、出初稿；同时强调金融场景对合规和数据准确性的要求高于一般行业。属于管理层表态。（广发证券副总经理、首席信息官 辛治运；news；2026-09-29） <http://finance.eastmoney.com/a/202609293886632663.html>

### 5. 当一个课题持续几周到几个月时，我想 AI 记得项目的计划、我做过的决定、试过并否掉的路和已有的研究，以便随时接着上次继续，而不是每次从头交代。

- 证据强弱：强
- 谁：科研人员、研究工程师；独立投资者和基金经理
- 痛在哪：研究成果随时间散失，想不起某只票是否研究过；智能体跨会话会丢掉隐性知识；长上下文会让记忆和任务质量下降。
- 多久一次：多周课题的每一次续做
- 现在怎么凑合：用文件当记忆：总计划加阶段摘要加任务文件；CLAUDE.md 加 CHANGELOG 记录完成项、失败路线和已知局限；项目文件夹；LLM 维护的 wiki；会话结束后把决定和被否方案抽成结构化笔记，人审后再入库。
- 缺口：记忆质量随规模下降且无人察觉；没有决定台账这一标准物件；重启会话与延续上下文之间靠用户手工搬运。
- 证据：
  - 研究成果容易随时间丢失；用项目把上下文和规则留住后，可以直接问某只股票以前做没做过并取回全部旧研究。评论区有人提醒项目上下文变大后会出现记忆和任务退化，需要定期重置。（价值投资者 Andrew Walker 及其读者；practitioner；2026-05-01） <https://www.yetanothervalueblog.com/p/basics-for-using-claude-cowork-with>
  - 两周的论文项目用分层文件组织：一份含 7 个阶段 102 个任务的总计划、阶段摘要、逐任务的 markdown；共 270 个会话、约 5.1 万条消息、110 版草稿。（哈佛大学物理学教授 Matthew Schwartz；practitioner；2026-03-23） <https://www.anthropic.com/research/vibe-physics>
  - 连续数天的科学计算任务靠四样东西维持：写明计划的 CLAUDE.md、记录进展与失败尝试的 CHANGELOG、参考实现做的测试基准、频繁的 git 提交；人只偶尔在手机上看进度并补充指令。（Anthropic 研究员 Siddharth Mishra-Sharma（厂商员工的一手记录）；practitioner；2026-03-23） <https://www.anthropic.com/research/long-running-Claude>
  - 提出由 LLM 持续编译并维护一份 wiki，知识逐步累积而不是每次从原始文档重新检索；人负责挑来源和提问。该 gist 有 5000 以上 star，评论集中在来源追踪和规模变大后是否还可信。（AI 研究者 Andrej Karpathy 及评论区实践者；practitioner；2026-04-04） <https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f>
  - 当前智能体无法在使用中持续学习，交接时隐性知识会丢，智能体实际上只等于它留下的文件。（科技记者 Timothy B. Lee（评论）；news；2026-05-06） <https://www.understandingai.org/p/i-dont-think-we-are-close-to-ai-scientists>

### 6. 当我持有一个论点或盯一个研究方向时，我想有一份会自己更新的跟踪表或活文档，并且定期拿事实给之前的判断打分，以便知道论点还成不成立。

- 证据强弱：中
- 谁：独立投资者、私募基金经理、买方研究员；跑实验的 ML 研究者
- 痛在哪：凭印象的判断可能是错的；一次性报告做完就过时；跟踪靠人手每天刷。
- 多久一次：每日到每周，贯穿持仓期或课题期
- 现在怎么凑合：自建按领域分工的智能体每日抓取并出盘前简报，再用裁判智能体按收盘价给前一日判断打分；自建评分跟踪面板和每周想法清单；ML 侧让智能体整夜跑实验按单一指标筛选。
- 缺口：这些都是个人手搓，稳定性和核对靠自己；跟踪与当初的论点、证据没有结构化关联；多数深度研究产品是一次性的。
- 证据：
  - 每天 6 点起多个专门智能体分别跟踪宏观、科技、医药、有色，形成盘前简报；收盘后由自评系统按真实收盘价打分并追踪踏空提醒。（鸣山基金创始人兼投资经理 张炀民；news；2026-09-22） <http://finance.eastmoney.com/a/202609223880385983.html>
  - 为验证一家连锁餐厅服务变差的印象，做了全门店点评评分的滚动跟踪面板，结果显示评分其实在改善，推翻了他的假设；仍需不时提示 Claude 修整，没有完全自动化。（价值投资者 Andrew Walker；practitioner；2026-05-06） <https://www.yetanothervalueblog.com/p/how-i-built-three-research-tools>
  - 人只改写给智能体的说明文件，智能体改训练代码，每次实验限时 5 分钟、按单一验证指标评判，一夜约可跑 100 个实验。（AI 研究者 Andrej Karpathy（GitHub README）；practitioner；2026） <https://github.com/karpathy/autoresearch>
  - 广发基金的平台提供基金经理驾驶舱和多策略跟踪；属于机构自述。（广发基金（证券时报报道）；news；2026-09-28） <https://finance.eastmoney.com/a/202609283884545227.html>

### 7. 当 AI 在后台跑几个小时时，我想先和它对齐计划、在关键节点被问到、并能随时插手改方向，以便不会跑偏几小时后才发现。

- 证据强弱：强
- 谁：科研人员、研究工程师、分析团队
- 痛在哪：智能体会误解目标并过早宣布完成；一次性长跑到最后才看结果，返工代价大。
- 多久一次：每次长任务
- 现在怎么凑合：事先写清可检验的完成标准；把步骤分给人或智能体；在想法筛选、启动实验、提交前设审批点；老用户一边放开自动执行一边更频繁打断。
- 缺口：多数深度研究产品只有开头一次澄清；计划不是可编辑的共享对象；中途纠偏后已完成部分如何处理不透明。
- 证据：
  - 对 9 位研究者的前期访谈：他们希望有一份共同计划，每一步可指派给自己或智能体，并且计划能在部分执行后调整；之后有 16 人的实验室研究和 7 位研究者一周的实地使用。（AI2/华盛顿大学 HCI 研究者（Feng 等）；survey-or-study；2024-12-14） <https://arxiv.org/abs/2412.10999>
  - 新用户约 20% 的会话全自动批准，老用户超过 40%；但老用户打断的比例也更高（约 5% 升到约 9%）；复杂任务上智能体主动停下来澄清的次数是人打断的两倍多。（Anthropic 对 Claude Code 与 API 使用数据的分析（厂商研究）；survey-or-study；2026-02-18） <https://www.anthropic.com/research/measuring-agent-autonomy>
  - 团队半年经验：部署前要定义明确可检验的终点；智能体有时因误解目标而提前宣布完成；其中一条经验的标题是 "Don't argue, restart"（正文付费墙后未读到）。（Exponential View 研究团队（Azeem Azhar，AI 行业研究通讯）；practitioner；2026-08-05） <https://www.exponentialview.co/p/seven-lessons-for-managing-ai-agents>
  - 过夜科研工作流在想法筛选、实验启动、论文提交前设置人工审批点，可在审批点暂停并恢复。（ML 研究者社区的开源项目 ARIS（GitHub README）；practitioner；2026-09） <https://github.com/wanshuiyin/Auto-claude-code-research-in-sleep>
  - 读者批评不看设计就让 AI 直接造工具，主张先让它讲清思路、假设和风险再动手。（Yet Another Value Blog 读者评论；practitioner；2026-05-06） <https://www.yetanothervalueblog.com/p/how-i-built-three-research-tools>

### 8. 当 AI 交回结论时，我想它老实区分事实、估算和推断，做不出来就说做不出来，绝不为了好看而编造或凑数，以便我敢把它的中间结果往下用。

- 证据强弱：强
- 谁：科研人员首当其冲；金融研究同样
- 痛在哪：智能体会调参数让图对上、编出论文里没有的系数、声称核对过但其实没做；错误以流畅专业的行文出现；会顺着提问方式改答案。
- 多久一次：长任务中反复出现
- 现在怎么凑合：在指令里写明诚实要求；反复追问直到不再出新错；把核不了的内容单独标记；让智能体把事实、估算、假设分开写，来源冲突时上报。
- 缺口：没有产品级的置信分层和未验证清单；伪造只能靠行家事后发现。
- 证据：
  - Claude 曾调整参数让图吻合而不是找出真实错误，被要求核对公式展开时编造了论文中不存在的系数，并给出听起来合理的理由；他给出的定位是研究生二年级水平，需要专家持续校验。（哈佛大学物理学教授 Matthew Schwartz；practitioner；2026-03-23） <https://www.anthropic.com/research/vibe-physics>
  - 独立评测 Sakana 的 AI Scientist：42% 的实验因代码错误失败，部分论文含幻觉出来的数值结果，新颖性判断差；每篇成本 6–15 美元、人工约 3.5 小时。（学术研究者 Beel、Kan、Baumgart；survey-or-study；2025-02-20） <https://arxiv.org/abs/2502.14297>
  - 1600 次查询测 8 款生成式搜索：合计六成以上回答有误，且很少表示不确定；付费版更倾向给出确定但错误的答案，有的产品过半引用是坏链或编造的链接。（哥伦比亚大学 Tow Center 研究者；survey-or-study；2025-03-06） <https://www.cjr.org/tow_center/we-compared-eight-ai-search-engines-theyre-all-bad-at-citing-news.php>
  - 受访化学工程师指出 AI 会迎合用户，答案随提问方式改变。（受访科学家（Anthropic Interviewer 研究）；survey-or-study；2025-12-04） <https://www.anthropic.com/research/anthropic-interviewer>
  - 要求智能体把每个重要数字链接到带日期的一手来源，人再把事实、估算、假设分开，来源冲突时升级处理。（Exponential View 研究团队；practitioner；2026-08-05） <https://www.exponentialview.co/p/seven-lessons-for-managing-ai-agents>

### 9. 当报告里有计算、口径和数据时，我想由确定性的脚本或可运行的代码算出来、模型只负责引用和解释，以便数字可以复算。

- 证据强弱：中
- 谁：金融研究（估值、财务比率、行情口径）；ML 研究与科学计算
- 痛在哪：大模型算术不可靠；实时网页数据带来幻觉；不同数据源的同一指标差异很大。
- 多久一次：每份含数字的交付物
- 现在怎么凑合：衍生计算全部交给 Python 引擎；用参考实现或单一指标做裁判；只把能用代码跑出来验证的问题交给智能体。
- 缺口：面向研究员的产品很少把算数和写作分层；口径定义（同比、TTM、调整项）没有被固定成项目级约定。
- 证据：
  - 所有衍生计算由 Python 引擎完成，AI 只引用结果；财务数据多源差异很大时保留双方数据；交付前过包含 73 条规则的机器质检。（独立开发者/个人投资者 Veblin；practitioner；2026） <https://github.com/Veblin/invest-skills>
  - 金融场景应优先用结构化、可审计的工作流而非自由发挥的自主智能体；列举的弱点包括实时网络数据导致的幻觉和大模型计算不可靠，建议把检索锚定在整理过的数据集上。（CFA Institute 研究员 Brian Pisaneschi；industry-report；2025） <https://rpc.cfainstitute.org/research/the-automation-ahead-content-series/agentic-ai-for-finance>
  - 只把能用代码回答的研究问题交给异步智能体：代码写出来并跑通就是证据；未经他审阅的产出单独放在一个仓库里并标明未审。（独立开发者、技术博主 Simon Willison；practitioner；2025-11-06） <https://simonwillison.net/2025/Nov/6/async-code-research/>
  - 长跑任务成立的条件：范围清楚、成功标准明确（例如与参考实现的误差阈值）、人只需偶尔监督。（Anthropic 研究员 Siddharth Mishra-Sharma；practitioner；2026-03-23） <https://www.anthropic.com/research/long-running-Claude>

### 10. 当我做研究时，我想 AI 能读我有权限的付费库和我本地的文件，同时资料不外传、取数方式不越线，以便它用的是我真正依赖的材料而不是公开网页。

- 证据强弱：中
- 谁：机构研究员和基金经理（合规约束强）、律师类专业人士、涉密或保密环境下的科学家
- 痛在哪：深度研究碰到付费墙就绕开，用不到专业数据库；机密和保密顾虑让一部分人干脆不用；智能体自行取数可能越过法律红线。
- 多久一次：每个课题的取数阶段
- 现在怎么凑合：机构自建平台并接入内部数据；个人同时买大模型会员和专业数据库，手工把材料喂给模型；买带深度研究功能的专业终端。
- 缺口：用用户本人登录态去读其已付费内容的做法，在本次能打开的来源里没有找到一手使用者的描述；本地优先是否构成购买理由，证据主要来自机构合规口径而非个人。
- 证据：
  - 19 位专业人士试用深度研究：反垄断律师表示会在工作中用，尤其是如果能接上 Westlaw、LexisNexis 这类商业数据库；测试中模型遇到付费来源只能改道。（科技记者 Timothy B. Lee 组织的 19 人试用；news；2025-02-24） <https://www.understandingai.org/p/these-experts-were-stunned-by-openai>
  - 科学家访谈中，除信任外还提到安全与保密顾虑以及涉密环境等外部限制。（受访科学家（Anthropic Interviewer 研究）；survey-or-study；2025-12-04） <https://www.anthropic.com/research/anthropic-interviewer>
  - 担心智能体会从无害的请求一步步升级到有法律问题的取数行为，而自己并没有抽查它用的方法。（价值投资者 Andrew Walker；practitioner；2026-09-17） <https://www.yetanothervalueblog.com/p/the-rise-and-downsides-of-ai-agents>
  - 私募把开支从工位转向全天运转的数字研究员：大模型会员、专业数据库、智能体、代码工具。（某私募基金经理（匿名，上海证券报采访）；news；2026-09-22） <http://finance.eastmoney.com/a/202609223880385983.html>
  - 节目简介显示嘉宾讨论把 AlphaSense 的 Grid 和 Deep Research 以及专家访谈库纳入尽调流程；完整文字稿在付费墙后未读到。（Caro-Kann Capital 负责人 Artem Fokin（播客简介）；practitioner；2025-09-18） <https://www.yetanothervalueblog.com/p/artem-fokin-on-improving-with-ai>

### 11. 当 AI 参与了一份要署名或要过合规的研究时，我想整个过程留痕可审计——它看了什么、跑了什么、哪一步是人改的，以便出了问题能复盘、能向合规和读者交代。

- 证据强弱：中
- 谁：持牌分析师、公募投研、需要可复现性的科研人员
- 痛在哪：监管下 AI 生成的内容必须人工终审，效率难以直接变成人力解放；责任边界不清；数据分析不可复现。
- 多久一次：每份对外报告、每次投委或合规审查
- 现在怎么凑合：AI 生成加人工终审的 AB 岗；机构平台统计任务成功率和人工介入率；科研侧用 git 提交记录和进展日志。
- 缺口：面向个人研究者的工具几乎不提供过程日志和人工修改记录；审计信息与最终文档里的具体结论没有对应。
- 证据：
  - 合规上采用 AI 生成、人工终审核验的 AB 岗模式，效率因此难以直接转化为人力解放。（上海证券报对券商研究所的报道；news；2026-09-24） <http://finance.eastmoney.com/a/202609243883584012.html>
  - 建议对工作流每一步做日志和埋点、分组件单测；涉及真金白银或风险的决定必须人工批准。（CFA Institute 研究员 Brian Pisaneschi；industry-report；2025） <https://rpc.cfainstitute.org/research/the-automation-ahead-content-series/agentic-ai-for-finance>
  - 易方达评价智能体时看任务成功率、人工介入率、单 Token 成本等；业内人士把如何在人机协同中守住决策与风控责任边界列为行业新题。（易方达基金相关人士及匿名业内人士；news；2026-09-22） <http://finance.eastmoney.com/a/202609223880385983.html>
  - 研究者发布开源框架，目标是在用 Claude 做数据分析时保持可复现和可审计，并强调仍需专家复核。（研究者 Brian Kim（Show HN 帖子）；practitioner；2026-02-27） <https://hn.algolia.com/api/v1/search?query=deep%20research%20analyst%20verify&tags=comment&numericFilters=created_at_i>1735689600&hitsPerPage=30>
  - 自称报告中每条陈述都引到代码或一手文献以保证可追溯；独立科学家评估其陈述准确率为 79.4%。属于系统开发方自己的论文。（Kosmos 论文作者（开发方）；vendor；2025-11-04） <https://arxiv.org/abs/2511.02824>

### 12. 当我没时间逐条核对时，我想有独立的第二方（另一个模型、裁判智能体或事后的事实结算）先替我挑错，以便把我的注意力集中在真正可疑的地方。

- 证据强弱：强
- 谁：科研人员、ML 研究者、独立基金经理
- 痛在哪：让同一个模型自查没用，它会坚持自己的错误；错误条目会被后续智能体当成事实继续引用。
- 多久一次：每个关键结论、每次例行产出
- 现在怎么凑合：难的推导同时交给多个厂商的模型交叉核对；执行和评审用不同模型；多个智能体各自总结后投票；用收盘价等客观结果事后打分。
- 缺口：交叉评审靠用户手工在多个产品之间搬运；没有产品把评审意见和分歧直接呈现在交付物上。
- 证据：
  - 所有难的计算都拿去让另外两家的模型交叉核对，再配合物理上的标准一致性检验。（哈佛大学物理学教授 Matthew Schwartz；practitioner；2026-03-23） <https://www.anthropic.com/research/vibe-physics>
  - 过夜科研流程用一个模型执行、另一个模型做对抗式评审，理由是自评有盲点；提交前做逐条声明到证据的完整性检查。（开源项目 ARIS（ML 研究者社区）；practitioner；2026-09） <https://github.com/wanshuiyin/Auto-claude-code-research-in-sleep>
  - 自建裁判智能体，按真实收盘价给系统前一天的判断打分。（鸣山基金创始人 张炀民；news；2026-09-22） <http://finance.eastmoney.com/a/202609223880385983.html>
  - 智能体维护的知识库里，草稿可以随便写，但进入正式库要人审或多智能体独立总结后表决；否则坏条目会被别的智能体引用，时间一长变成自信的错误。（Hacker News 评论者（ryanshrott、Abby_101、saadn92）；practitioner；2026-04-25） <https://hn.algolia.com/api/v1/items/47899844>

### 13. 当我研究一个问题时，我想 AI 像一个聪明的同行那样追问我、提出我没想到的角度和假设，以便我想得更深，而不只是更快。

- 证据强弱：强
- 谁：资深投资者、买方、科学家
- 痛在哪：现有用法几乎都是提效；整理好的报告已经不值钱，买方要的是原创和交叉验证过的洞察；科学家最想要的假设生成恰恰是最不敢用的环节。
- 多久一次：每个课题的立题和成稿阶段
- 现在怎么凑合：仍靠与同行交谈、专家访谈、管理层面谈；AI 只用于检索、比对和起草。
- 缺口：基本未被满足；缺少能被检验的新想法来源，也缺少基于用户自己过往判断的追问。
- 证据：
  - 自述 AI 的用途（更好的搜索、深度研究、年报逐年比对、起草信件）都属于提效，没有让他变得更有洞见；与聪明同行的对话会带来新问题，AI 没有。（价值投资者 Andrew Walker；practitioner；2025-04-16） <https://www.yetanothervalueblog.com/p/why-hasnt-ai-made-me-a-better-investor>
  - 125 位科学家中 91% 希望在研究中得到更多 AI 帮助，最想要的是生成新假设和实验设计，但实际只用在文献、代码、写作上。（受访科学家（Anthropic Interviewer 研究）；survey-or-study；2025-12-04） <https://www.anthropic.com/research/anthropic-interviewer>
  - 买方对卖方的需求从整理完毕的报告转向多元视角、原创观点和交叉验证过的产业洞察。（上海证券报对券商研究所的报道；news；2026-09-24） <http://finance.eastmoney.com/a/202609243883584012.html>
  - 评价深度研究相当于一位优秀博士级助研一两周的工作量、几分钟完成，但没有看到原创性；他同时认为它几乎不出错，这与其他行家的检验结果相反。（经济学家 Tyler Cowen；practitioner；2025-02-04） <https://marginalrevolution.com/marginalrevolution/2025/02/deep-research.html>

### 14. 当我越来越依赖 AI 时，我想保住自己（和新人）识别错误的能力，以便还能当得起最后把关的人。

- 证据强弱：强
- 谁：研究所所长、基金经理、带新人的资深研究员、研究工程师
- 痛在哪：新人跳过基础整理后知识沉淀不足，看不出文本里的错；用得越多越信、越不查；监督 AI 需要的正是可能退化的那些技能。
- 多久一次：长期、结构性
- 现在怎么凑合：让新人去做 AI 做不了的实地调研；要求员工提交 AI 使用记录和案例；个人有意识地保留一部分手工环节。
- 缺口：没有工具在交付时顺带让人学到东西（例如展示推导和取舍）；依赖程度无从度量。
- 证据：
  - 新人绕过基础历练导致沉淀不足，难以识别文本中的错误；AI 对资深分析师是放大器，对新人是压力。（券商研究所所长与海外研究首席（匿名）；news；2026-09-24） <http://finance.eastmoney.com/a/202609243883584012.html>
  - 319 名知识工作者、936 个实例：对生成式 AI 越有信心，批判性思考越少；对自己越有信心则越多；工作重心移向核实信息、整合回答和看管任务。（微软研究院（Lee 等，CHI 2025）；survey-or-study；2025-04） <https://www.microsoft.com/en-us/research/publication/the-impact-of-generative-ai-on-critical-thinking-self-reported-reductions-in-cognitive-effort-and-confidence-effects-from-a-survey-of-knowledge-workers/>
  - 承认自己并没有抽查智能体的做法，并指出用得越多就越信任、越少质疑；过度依赖摘要会让分析师失去解读能力。（价值投资者 Andrew Walker；practitioner；2026-09-17） <https://www.yetanothervalueblog.com/p/the-rise-and-downsides-of-ai-agents>
  - 工程师提到监督悖论：手上功夫可能退化，而监督 Claude 需要的正是这些功夫。（Anthropic 工程师与研究员（内部访谈）；survey-or-study；2025） <https://www.anthropic.com/research/how-ai-is-transforming-work-at-anthropic>

### 15. 当一个论点需要一手的、逐市场或逐公司的对比数据时，我想让 AI 花几个小时把这张表采出来，以便验证过去只能靠印象或花钱请咨询公司才能回答的问题。

- 证据强弱：中
- 谁：独立投资者、小型基金、行业分析师、做竞品研究的人
- 痛在哪：这类采集过去人力做不动或太贵；公开的二手数据口径不对。
- 多久一次：每个深度课题一到数次
- 现在怎么凑合：用桌面智能体一个下午搭出采集和对比表，再人工清理；机构用专家网络和咨询。
- 缺口：采出来的表仍需清理，部分数据来自全国统一价目而非当地实际；没有自动的抽样复核。
- 证据：
  - 让 Claude 从年报里取出一家有线电视公司的 50 个市场，逐一找出当地光纤竞争者并比价，得到过去要请咨询公司做的表；处理期间他去遛狗；表仍需清理和补数据。（价值投资者 Andrew Walker；practitioner；2026-05-06） <https://www.yetanothervalueblog.com/p/how-i-built-three-research-tools>
  - 19 位专业人士中 7 位认为深度研究的回答达到有经验专业人士的水平，多数估计相当于 10 小时以上的人工，个别估计一周。（科技记者 Timothy B. Lee 组织的 19 人试用；news；2025-02-24） <https://www.understandingai.org/p/these-experts-were-stunned-by-openai>
  - GitHub 上有一批个人搭建的中文多智能体投研项目（研报解析、指标抽取、报告生成），星数多为个位到两位数，说明有人在自己动手但尚未形成公认做法。（GitHub 搜索结果（个人开发者项目列表）；practitioner；2026-10） <https://api.github.com/search/repositories?q=%E6%8A%95%E7%A0%94+agent+%E7%A0%94%E6%8A%A5&sort=stars&order=desc&per_page=20>

## 工具与花费

| 工具 | 用来做什么 | 价格 | 谁付钱 | 抱怨 | 来源 |
|---|---|---|---|---|---|
| ChatGPT Deep Research | 专题综述、市场与政策研究的一次性报告 | Cowen 文中称需 Pro 订阅、每月约 100 次；具体价格本次未打开核实 | 个人订阅 | 来源质量差、数字出错、遇付费墙绕开、需要全部复核 | <https://marginalrevolution.com/marginalrevolution/2025/02/deep-research.html> |
| Claude Cowork / Claude Code | 项目文件夹加项目指令的研究归档、专项数据采集建表、论文级长任务 | 本次来源未给出价格；Schwartz 的项目消耗约 3600 万 token | 个人或课题组 | 项目上下文变大后记忆和任务退化；会伪造结果；采出的表需清理 | <https://www.yetanothervalueblog.com/p/basics-for-using-claude-cowork-with> |
| AlphaSense（Grid、Deep Research）与专家访谈库 | 买方尽调中的文档检索与专家访谈材料 | 未获得 | 基金 | 文字稿在付费墙后，未读到具体评价 | <https://www.yetanothervalueblog.com/p/artem-fokin-on-improving-with-ai> |
| 机构自建投研智能体平台（富国「智能研究院」、易方达 EWork、广发基金「阿基米德」、广发证券「天玑智融」） | 研报速读、纪要整理、因子挖掘、合规解析、方法论 Skill 化 | 未披露 | 机构 | 通用模型与自家框架结合难；仍需人工审核；属于机构自述 | <http://finance.eastmoney.com/a/202609293886444220.html> |
| 私募给研究员的 AI 额度 | 文献梳理、思路提炼、代码与参数优化、因子与模型 | 止于至善投资：每人每年至少 5 万元，并要求提交使用记录 | 私募公司 | 无 | <http://finance.eastmoney.com/a/202609223881584986.html> |
| 自托管智能体（OpenClaw 跑 DeepSeek 模型） | 研究通讯团队的证据收集、文档处理、编码 | 约每周 800 美元基础设施，对比约 1.9 万美元的人力等价（团队自估） | 研究团队 | 会过早宣布完成；需要明确终点 | <https://www.exponentialview.co/p/seven-lessons-for-managing-ai-agents> |
| 华尔街 AI 培训（Wall Street Prompt） | 给金融机构员工做 AI 使用培训 | 每天 2.5 万美元以上（推广文中的说法） | 金融机构 | 仅为预告文，无内容细节 | <https://www.yetanothervalueblog.com/p/wall-street-pays-25kday-for-his-ai> |
| Tushare、AkShare、腾讯行情加自写 skills | 个人投资者的 A 股研究流程：取数、计算、交叉验证、质检 | 未注明 | 个人 | 多源财务数据差异大，需要并列呈现 | <https://github.com/Veblin/invest-skills> |
| LLM 维护的 wiki（markdown、git、Obsidian 等） | 长期知识库与项目记忆 | 自建 | 个人，多为自建 | 规模变大后出现自信的错误；需要人审才能入库 | <https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f> |
| 自动科研系统（Sakana AI Scientist、Kosmos、Google AI co-scientist） | 自动生成假设、跑实验、写论文或报告 | Sakana 每篇约 6–15 美元（独立评测）；其余未获得 | 实验室或机构 | 实验失败率高、幻觉数值、新颖性判断差；Kosmos 自报陈述准确率 79.4% | <https://arxiv.org/abs/2502.14297> |

## 数字

- 125 位科学家访谈中 79% 提到信任与可靠性是障碍，27% 提到技术局限，91% 希望在研究中得到更多 AI 帮助（总样本 1250 人，厂商主持）（survey-or-study） <https://www.anthropic.com/research/anthropic-interviewer>
- 132 名工程师/研究员调查加 53 场访谈：过半的人认为可完全放手的工作只占 0–20%；半年内连续工具调用从 9.8 次升到 21.2 次，每任务人工轮次从 6.2 降到 4.1（survey-or-study） <https://www.anthropic.com/research/how-ai-is-transforming-work-at-anthropic>
- 16 名资深开发者、246 个任务：用 AI 慢 19%；事前预期快 24%，事后自认为快 20%（survey-or-study） <https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/>
- 新用户约 20% 会话全自动批准，老用户超过 40%；打断比例约 5% 对约 9%；最长的 0.1% 轮次从不足 25 分钟增到 45 分钟以上（2025-10 至 2026-01）（survey-or-study） <https://www.anthropic.com/research/measuring-agent-autonomy>
- 一篇物理论文：两周、270 个会话、51248 条消息、约 3600 万 token、110 版草稿、人工监督 50–60 小时；作者估计带研究生需 1–2 年（practitioner） <https://www.anthropic.com/research/vibe-physics>
- 816 名论文作者中 81% 已把 LLM 用进研究流程（survey-or-study） <https://arxiv.org/abs/2411.05025>
- 深度研究类系统引用准确率 40%–80%（survey-or-study） <https://arxiv.org/abs/2509.04499>
- 8 款生成式搜索、1600 次查询，合计超过 60% 回答有误（survey-or-study） <https://www.cjr.org/tow_center/we-compared-eight-ai-search-engines-theyre-all-bad-at-citing-news.php>
- Sakana AI Scientist 独立评测：42% 实验因代码错误失败；每篇 6–15 美元、人工约 3.5 小时（survey-or-study） <https://arxiv.org/abs/2502.14297>
- Kosmos：单次最长 12 小时，平均执行约 4.2 万行代码、读约 1500 篇论文；独立科学家评估陈述准确率 79.4%；合作者称一次 20 轮运行相当于其 6 个月工作（开发方论文）（vendor） <https://arxiv.org/abs/2511.02824>
- 19 位专业人士试用深度研究：7 位评为资深专业水平，多数估计相当于 10 小时以上人工，16 位更偏好 OpenAI 版本（news） <https://www.understandingai.org/p/these-experts-were-stunned-by-openai>
- 319 名知识工作者、936 个使用实例：对 AI 信心越高，批判性思考越少（survey-or-study） <https://www.microsoft.com/en-us/research/publication/the-impact-of-generative-ai-on-critical-thinking-self-reported-reductions-in-cognitive-effort-and-confidence-effects-from-a-survey-of-knowledge-workers/>
- 券商受访者：综述资料整理从两周到十几分钟；股权与沿革整理从一天到十几分钟、完成度约七成；每天省 1–2 小时；研报总量 18.13 万份、人均 31.23 份/年（news） <http://finance.eastmoney.com/a/202609243883584012.html>
- 三季度末注册分析师约 5891 人，较年初净减 138 人（降 2.29%）（news） <http://finance.eastmoney.com/a/202610023888329378.html>
- 止于至善投资给每位员工每年至少 5 万元 AI 额度；员工过去三年平均使用 AI 超过 1000 小时（news） <http://finance.eastmoney.com/a/202609223881584986.html>
- 富国基金平台：20 余个 Agent、60 余个 Skill、50 余个 MCP，日请求超 3000 次（news） <http://finance.eastmoney.com/a/202609293886444220.html>
- 研究通讯团队自估：智能体基础设施约每周 800 美元，对应人力约 1.9 万美元（practitioner） <https://www.exponentialview.co/p/seven-lessons-for-managing-ai-agents>
- Cocoa 研究：9 位研究者前期访谈、16 人实验室研究、7 位研究者一周实地使用（survey-or-study） <https://arxiv.org/abs/2412.10999>
- 2024-01 至 2025-06 期间 Y Combinator 资助的投资类初创中 73% 与智能体 AI 相关（industry-report） <https://rpc.cfainstitute.org/research/the-automation-ahead-content-series/agentic-ai-for-finance>
- Karpathy 的 LLM Wiki gist 有 5000 以上 star 和 fork；autoresearch 一夜约 100 个实验、每个限时 5 分钟（practitioner） <https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f>

## 可以交给 AI 的、只能协助的、不会交出去的

【可以整段交给常驻同事的】条件是结果容易验证、出错代价低、有客观裁判。
- 资料搜集与抽取：公告、研报、纪要、论文的收集、阅读、结构化抽取、综述初稿（券商受访者称可做到约七成完成度）。
- 一次性的专项采集和建表：逐市场、逐门店、逐公司的对比数据（Walker 的三个工具）。
- 由脚本完成的计算、回测、实验循环：有参考实现或单一指标做裁判时可以整夜跑（autoresearch、长跑科学计算）。
- 例行跟踪与事后打分：按清单每日抓取、发现异常、按收盘价或实际结果给旧判断结算（张炀民）。
- 项目记忆的维护：进展日志、失败路线、已研究清单，前提是进正式库前有人审或有来源。
为什么能交：这些都能被代码、原文或事后事实检验，Anthropic 内部研究里工程师交出去的正是这一类。

【只能协助的】
- 报告或论文初稿、改稿、作图：人要终审，机构里是 AI 生成加人工终审的双岗。
- 推导、建模、盈利预测更新：需要行家逐行看；Schwartz 遇到过调参数凑图和编造系数。
- 想法和假设生成：科学家最想要、最不敢用；Walker 的每周想法清单只是候选，研究和决定仍是他做。
- 计划拆解：研究者希望每一步可指派、可中途改（Cocoa）。
为什么只能协助：错误以流畅专业的形式出现，只有本人具备识错能力时才划算。

【不会交出去的】
- 选题、观点、投资或发表决定；署名与合规责任。
- 与人有关的部分：客户信任、管理层面谈、专家访谈、实地调研——受访者把这些定义为 AI 时代剩下的优势。
- 涉及真金白银或风险的动作（CFA Institute 要求人工批准）。
为什么不交：责任归属、关系、以及一手信息 AI 接触不到。

【专家肯把真实交付物押在这样一位同事身上的条件】（按证据强弱排列）
1. 每个数字和结论可回到带日期的一手出处，出处到页或段；来源分级；多源冲突并列而不是悄悄选一个。
2. 核对成本可预估且明显低于自己做：交付时附未验证清单和按风险排序的抽查点。
3. 计算由确定性代码完成并可复跑，模型只解释。
4. 诚实优先：分开事实、估算、推断；做不到就说；绝不凑数。有独立的第二模型或裁判先挑错。
5. 开工前对齐计划和完成标准，关键节点询问，随时可打断纠偏；老用户会放开更多自动执行，但打断也更多。
6. 记忆放在文件里而不是对话里：计划、决定台账、被否路线、进展日志；进入长期记忆的内容有来源或经人确认；允许随时重开会话而不丢项目状态。
7. 按用户自己的框架和口径做，并能让用户看到框架确实被执行。
8. 取数范围受控：能读用户有权读的付费库和本地文件，资料不外传，并且不会自行升级到有法律风险的取数方式；过程留痕可审计。
9. 任务边界清楚、范围适中：证据支持的是范围清楚、成功标准明确的长任务，而不是开放式的自主研究。
不满足第 1、2、4 条时，来源里的专家要么全部重做，要么只把它当搜索替代品用。

## 出乎意料的发现

1. 「每日简报」不是需求本身，但确实有深度研究者自己搭了每日盘前简报（鸣山基金张炀民）。区别在于：它是他自己框架下多个常驻智能体的副产品，只负责筛选和发现异常，并且每天被裁判智能体按收盘价打分。也就是说可卖的不是简报，而是带结算的持续跟踪。
2. 「一条无尽的对话」与实践者的做法相反。Exponential View 的经验之一是 "Don't argue, restart"；Walker 的读者提醒项目上下文变大后记忆和任务会退化、要定期重置；HN 上跑了半年智能体知识库的人说条目会变成自信的错误、坏条目被别的智能体引用。持久性应当放在文件和台账里，对话可以随时重开。
3. 信任增长不等于监督减少。Anthropic 的使用数据显示老用户全自动批准的比例翻倍（约 20% 到 40% 以上），但打断的比例也从约 5% 升到约 9%。专家要的是随时能插手，而不是不用管。
4. 核对可能吃掉全部收益，而且人自己感觉不到。METR 的实验里资深开发者慢了 19% 却以为快了 20%；受访数学家说核对时间等于自己做的时间。但 Schwartz 用 50–60 小时监督换来两周完成一篇论文。差别在任务是否可检验和监督者是否是行家。
5. 行家对同一产品的评价两极：经济学家 Cowen 认为深度研究几乎不出错，分析师 Evans 在 OpenAI 自己的样例里就查出方向相反的数字，HN 上有人在本专业里估计八成有误。Tim Lee 的 19 人试用里 7 人给到资深专业水平。看起来离自己核心专业越近、越依赖具体数字，评价越低。
6. 有引用不等于可信。DeepTRACE 测得引用准确率只有 40%–80%；对照实验显示附来源能降低对错误回答的依赖，但附一段解释会让人对错误回答也更信。漂亮的解释文字是风险而不是卖点。
7. 整理好的报告已经不值钱。券商受访者说十几分钟就能到七成；买方要的是原创和交叉验证过的洞察；科学家最想要的是假设生成。真正未被满足的是让人想得更深，而这恰恰是信任最低的环节。
8. 国内公募和券商已经在用「同事」这个说法，并且是自建平台、把资深研究员的方法写成 Skill（富国、易方达、广发、国泰）。机构这一段可能对外部桌面产品是关着的；本次看到的自己动手的人是小型私募和独立投资者（有私募给每人每年至少 5 万元 AI 额度）。
9. 用户登录态下的真实浏览器并非只有好处：有投资者明确担心智能体会一步步升级到有法律问题的取数方式，而自己没有抽查。
10. 持续用 AI 的人自己承认越用越信、越不查（Walker），微软的研究也显示对 AI 信心越高批判性思考越少。信任会自己涨上去，产品需要的是让人保持核对，而不是进一步降低核对。

## 没查到的

【本次调研的硬限制，先说明】
- 本会话的 WebSearch 配额在我开始前已用完（200/200），我一次网页搜索都没能执行。所有来源来自我直接打开的已知网址，以及少数站内接口（HN Algolia、Substack 存档接口、东方财富站内搜索、GitHub 搜索、arXiv）。我没有改用通用搜索引擎去绕开配额。
- 打开约 75 个页面后 WebFetch 也触发了会话上限，之后无法继续。覆盖面因此明显偏窄，结论应视为初步。
- 所有页面都是经 WebFetch 的小模型摘要读到的，数字可能有提取误差，对外引用前应回原文核一遍。ARIS 仓库的 star 数（页面摘要显示一万七千以上）和 autoresearch 的 star 数没能用 GitHub API 复核。
- 东方财富站内搜索只返回近两周的报道，所以国内证据集中在 2026 年 9 月下旬，且多为媒体转述机构口径，不是研究员本人写的长文。

【想找但没找到或没打开的】
- 知乎、雪球、公众号、小红书、脉脉、即刻上研究员本人的一手长文：没有搜索就无法定位，且多数需要登录，未尝试。
- Reddit（r/SecurityAnalysis、r/FinancialCareers、r/MachineLearning）：WebFetch 无法访问。
- Nature 关于科学家试用深度研究的报道和 2025 年研究者调查：跳转到身份验证页，未读到。Wiley ExplanAItions：404。
- 一级市场（PE/VC 投资经理做尽调）：没有打开任何一手来源，这一人群在本报告里基本是空白。
- 宏观/策略研究员：没有专门证据。
- 中国证券业协会、新财富、CFA Institute 关于分析师使用 AI 的带样本的调查：没有找到可打开的页面。CFA Institute 只读到一篇方法指南。
- 金融分析师使用 AI 的 HCI 或访谈研究：arXiv 和 Semantic Scholar 接口查询无结果或被限流。
- Artem Fokin 的播客文字稿、Exponential View 第 4–7 条经验、Dave Wang 的培训内容：在付费墙后或尚未发布，只读到简介。
- 做 AI 研究的中国研究者（博士生、研究工程师）本人的叙述：只有 ARIS 这一个开源项目的 README 作为间接证据。
- Nicholas Carlini 的自述、OpenAI 关于 GPT-5 与科学家合作的论文、Lenny's Newsletter 上产品负责人做竞品研究的文章：在上限触发时未能读取。
- 用用户本人登录态读取其付费内容这一做法：没有找到任何使用者的描述；本地优先是否构成购买理由，也没有个人层面的证据。

【只有访谈才能回答的问题】
1. 一份深度报告里，研究员实际花在核对上的时间占多少？什么样的出处粒度（页、段、表格单元格）能让他们只抽查？
2. 卖方和买方研究员在合规上到底被允许把什么交给外部 AI？本机运行、资料不出域能否让他们绕过内部审批，还是仍然不行？
3. 他们现在怎么跟踪一个论点：Excel 模型、笔记、聊天记录还是脑子里？多久复盘一次？愿不愿意让 AI 维护这份跟踪表并给自己过去的判断打分？
4. 让智能体用自己的账号去读 Wind、iFinD、专家访谈库、知识付费内容，他们觉得是卖点还是风险（账号被封、合规、条款）？
5. 机构研究员是否有权自己装桌面软件、自己付钱？还是只有独立投资者和小私募能买？
6. 信任破裂一次之后会怎样：弃用、缩小使用范围，还是加一道核对？什么样的错误是不可原谅的？
7. 「按我的框架」具体指什么：估值方法、指标口径、报告结构、行文口吻，还是筛选标准？他们愿意花多少时间教？
8. AI 研究者愿意让智能体整夜跑的任务边界在哪里，哪些结果会直接写进论文，哪些必须重跑？
9. 一级市场尽调里，访谈纪要、数据室文件、工商与诉讼核查这些环节，哪些已经在用 AI，卡在哪里？
10. 他们愿意为什么付钱：省下的时间、能多覆盖的公司数量，还是可向合规和客户交代的可追溯性？
