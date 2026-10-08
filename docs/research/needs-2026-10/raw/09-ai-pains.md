# AI 3：痛点

原始调研记录（2026-10-05）。未经逐条复核，复核结果见上一级目录的 `audit.md`。数字和说法以各条所附网址的原文为准。

## 人群

- **A1-a AI 方向的博士生和硕士生**：高校课题组里要发论文、写开题和毕业论文的人；大陆学生还多一层英文阅读成本
  - 深度研究工作：进入新课题的文献调研（几十到上百篇）、复现 baseline、盯并发工作、写 related work 和综述；产出是开题报告、论文、组会分享。
  - 规模：没有找到人数来源。规模旁证：NeurIPS 2025 投稿 21,575 篇（GPTZero 文中数字）；ICLR 2026 约 19,000 篇投稿（Pangram 文中数字）。
- **A1-b 工业界研究工程师和应用科学家**：公司里要把论文方法落地、选 baseline 和模型的人
  - 深度研究工作：读论文判断可不可信、在自己数据上复现和对比、写内部技术调研和选型文档；产出是内部报告、评测表、可用的实现。
  - 规模：没有找到来源。
- **A2-a 行业分析师和深度内容作者**：独立分析师、研究型媒体和播客作者、研究投资平台的研究员
  - 深度研究工作：跟一个赛道，汇编数据做图，读论文和一手材料，访谈专家；产出是深度报告、长文、访谈。单份工作量以天到周计。
  - 规模：没有找到人数来源。旁证：海外独角兽自述三年近 200 篇深度研究（小宇宙主页）。
- **A2-b 做技术选型的工程和产品负责人**：要为团队决定用哪个模型、哪条技术路线的人
  - 深度研究工作：搭私有评测集、在自己任务上横向比较、持续跟踪退化和价格；产出是选型文档和评测表。
  - 规模：没有找到来源。
- **A2-c 做技术尽调的投资人和顾问**：PE/VC 投资经理、咨询顾问、战略部门
  - 深度研究工作：验证被投公司或厂商的技术说法，写尽调或竞争研究报告。
  - 规模：没有找到任何一手证据，这一细分全靠推断，需访谈。
- **邻近人群：想跟进前沿但不做研究的从业者**：工程师、产品经理、转行者
  - 深度研究工作：基本不做深度研究，要的是筛过的每周/每日摘要。这是「早报」对应的人群，已被 newsletter 和免费脚本大量覆盖。
  - 规模：没有找到来源。

## 工作流

1. **1. 定题与划范围**：判断哪个问题值得做、范围多大。A1 是研究选题；A2 是把委托方的问题变成可回答的研究问题。新兴话题还要先弄清该怎么学。
   - 产出：一页问题陈述、范围边界、初步假设
   - 工具：和导师/同事讨论；与 LLM 来回问答
   - 时间：Karpathy 自述前两年在探索，论文方向最后一年半才成形；Dwarkesh 说确定怎么学本身就是最挫败的阶段。没有来源给出小时数。
   - 来源：<https://karpathy.github.io/2016/09/07/phd/> <https://mercury.com/blog/dwarkesh-patel-interview-prep>
2. **2. 建地图：找综述和种子论文**：找名家综述、里程碑论文、主要课题组；A2 还要找厂商材料、独立评测和一手数据来源。
   - 产出：种子论文清单（几十篇）、主线脉络草图、关键作者/机构名单
   - 工具：Google Scholar、Semantic Scholar、Hugging Face 热门论文、X、ACL Anthology、已有论文的 related work
   - 时间：Andrew Ng：5–20 篇可入门实现，50–100 篇才算理解一个应用领域。综述质量被每月数百篇 LLM 生成稿稀释，筛综述本身成了成本。
   - 来源：<https://www.kdnuggets.com/2019/09/advice-building-machine-learning-career-research-papers-andrew-ng.html> <https://blog.arxiv.org/2025/10/31/attention-authors-updated-practice-for-review-articles-and-position-papers-in-arxiv-cs-category/> <https://news.ycombinator.com/item?id=45782136>
3. **3. 分级筛读**：多遍阅读：先标题/摘要/图，再引言/结论/related work，再跳过公式通读，最后精读。决定哪些值得精读。
   - 产出：分级的阅读清单；每篇一两句定位
   - 工具：PDF 阅读器、翻译插件（PDFMathTranslate、zotero-pdf-translate）、ChatPaper 类总结
   - 时间：Ng：新手读懂一篇较易论文约 1 小时，难的 3 小时以上。Raschka：收进来的约 95% 事后看不重要。
   - 来源：<https://www.kdnuggets.com/2019/09/advice-building-machine-learning-career-research-papers-andrew-ng.html> <https://sebastianraschka.com/blog/2023/keeping-up-with-ai.html> <https://github.com/Byaidu/PDFMathTranslate>
4. **4. 精读、记笔记、入库**：批注 PDF，写文献笔记，再提炼成主题笔记；把条目和引用键存进文献库。
   - 产出：文献库条目、文献笔记、主题笔记、间隔重复卡片
   - 工具：Zotero + Better BibTeX、Obsidian、Anki/Mochi、飞书多维表格（团队）
   - 时间：痛点是记账和维护：一次摄入可能要动 10–15 个页面（Karpathy）；笔记多却互不相关（tinytka 博客）。
   - 来源：<https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f> <https://tinytka.github.io/2026/05/06/%E6%9C%AC%E5%9C%B0%E6%90%AD%E5%BB%BA%E4%B8%AA%E4%BA%BAzotero-Obsidian%E5%B7%A5%E4%BD%9C%E6%B5%81/> <https://www.feishu.cn/practice_template/22893>
5. **5. 可信度核查与复现**：挑关键论文或候选方案动手跑：复现结果、找隐藏细节、联系作者；A2 是在自己的任务上试候选模型。
   - 产出：复现记录、已知问题清单、可用的 baseline
   - 工具：作者开源代码、自写实现、GPU、lm-evaluation-harness、私有评测集
   - 时间：Raff 独立实现 255 篇，63.5% 成功；可读性差的论文要读六遍以上才能实现。单篇复现耗时没有来源给出统一数字。
   - 来源：<https://arxiv.org/abs/1909.06674> <https://cloud.tencent.com/developer/article/2119566> <https://semgrep.dev/blog/2026/we-have-mythos-at-home-glm-52-beats-claude-in-our-cyber-benchmarks/>
6. **6. 做横向对比表**：把各论文/各模型的数字抽到一张表，对齐评测设置，标出不可比的格子；能重跑的统一重跑。
   - 产出：对比表（方法 × 指标 × 口径）、图表
   - 工具：Excel/飞书多维表格、论文附录、自跑评测
   - 时间：同一模型同一数据集不同实现可差 0.637 对 0.488；Benedict Evans 说自己的研究工作大量时间花在汇编数据和做图上。
   - 来源：<https://huggingface.co/blog/open-llm-leaderboard-mmlu> <https://arxiv.org/abs/2405.14782> <https://www.ben-evans.com/benedictevans/2025/2/17/the-deep-research-problem>
7. **7. 盯并发工作（贯穿全程）**：课题进行期间持续看有没有相似工作出现；出现就调整定位或赶紧挂预印本。
   - 产出：同期工作清单、差异说明、预印本时间戳
   - 工具：arXiv 列表、X、自建每日推送脚本
   - 时间：15 位受访学者里 13 位谈到抢发焦虑；相似论文可只隔两天。每天花多久没有来源。
   - 来源：<https://arxiv.org/html/2511.04081> <https://news.ycombinator.com/item?id=44235480> <https://github.com/TideDra/zotero-arxiv-daily>
8. **8. 写作：related work / 综述 / 报告**：把文献组织成 2–4 条有论点的线索或一张对比表；补漏引；核对每条引用和每个数字的出处。
   - 产出：related work 章节、综述或深度报告、参考文献表
   - 工具：LaTeX/飞书文档、BibTeX、deep research 类工具出初稿
   - 时间：写作指南建议专门拿一整天做文献检索；19 人测试中多数估计同等报告人工至少 10 小时、4 人估计一周；Dwarkesh 每期准备约一周。
   - 来源：<https://shmuhammadd.github.io/missing-guide-nlp/chapters/related-work> <https://www.understandingai.org/p/these-experts-were-stunned-by-openai> <https://mercury.com/blog/dwarkesh-patel-interview-prep>
9. **9. 交付后维护**：结论随新论文和新模型过时；需要更新数字、标注失效的说法。多数人做不到持续维护。
   - 产出：更新版报告/对比表、失效说明
   - 工具：手工；少数人定时重跑评测
   - 时间：有报告声明季度更新并给数据标新旧；有第三方每天重跑 50 个样本监控退化。
   - 来源：<https://gist.github.com/itsRay2014/d83f4b5ed2666ba8239b89f12c4b2c42> <https://marginlab.ai/trackers/claude-code/>

## 需求

### 1. 当我做一个课题的几个月里每周面对上千篇新论文时，我想只看到和我手上课题真正相关的那几篇，并知道它们和我已收藏的论文是什么关系，以便不漏关键工作，也不把时间耗在刷 arXiv 上。

- 证据强弱：强
- 谁：A1 全体（博士生、研究工程师、应用科学家），以及想跟进前沿但不做学术的从业者
- 痛在哪：量太大且还在加速；摘要要有领域背景才看得懂；社交媒体制造 FOMO；真正的瓶颈是注意力分配而不是找不到论文——收进来的东西绝大部分事后看并不重要。
- 多久一次：每天到每周；贯穿整个课题周期
- 现在怎么凑合：Google Scholar 提醒、X 上的大 V、newsletter、Hugging Face 热门论文；大量自建脚本（fork 一个仓库，GitHub Actions 每天抓 arXiv，按 Zotero 库算相似度，用 DeepSeek 写中文摘要，推到邮箱或微信）；实验室把订阅邮件自动转进飞书话题群；每周固定时间过一遍清单（OneNote）。
- 缺口：现有推荐只按兴趣相似，不按我正在做的课题；不解释新论文和我已有文献的关系；跨平台重复；被大 V 的偏好带着走。这一层的日更推送本身已被免费脚本做到近乎零成本，未满足的是「相对于我的项目」的筛选和解释。
- 证据：
  - arXiv 全站月投稿量：2023-01 为 13,870，2025-09 为 26,646，2026-09 为 40,363（全站口径，非仅 AI）。（arXiv 官方统计（CSV）；survey-or-study；2026-10-04） <https://arxiv.org/stats/get_monthly_submissions>
  - 作者称每周有 1,000 多篇 AI/ML 论文、2025 年 AI 各领域投稿 8 万多篇；读研时每周扫 50–70 篇宇宙学论文还可行，在 AI 已不可能，于是自己搭了数据管线做每周筛选。（AI/ML 从业者（前计算宇宙学研究者）；practitioner；2026-01-13） <https://thisweekonarxiv.substack.com/p/keeping-up-with-the-ai-research-firehose>
  - 2018–2021 年做 arXiv 机器学习类目审核时每天看到 100–300 篇投稿；结论是找论文不难，难的是管理注意力；他收集的内容里约 95% 相对当前项目并不重要，靠每周复盘只挑几篇读。（ML 研究者/作者 Sebastian Raschka；practitioner；2023-03-23） <https://sebastianraschka.com/blog/2023/keeping-up-with-ai.html>
  - 按用户 Zotero 文献库给每日 arXiv 新论文打相似度分、LLM 写 TL;DR、邮件推送；仓库显示 6.0k star、5.2k fork（fork 即部署，说明大量人真在用）。（开源工具作者（研究者自建）；practitioner；） <https://github.com/TideDra/zotero-arxiv-daily>
  - 发帖人自建每日抓取 arXiv + DeepSeek 总结 + GitHub Pages 展示的工具，称每天成本约 0.2 元。（V2EX 用户 dwdengwei（工具作者）；practitioner；2025-06-12） <https://www.v2ex.com/t/1138124>
  - 原来要在多个平台手动刷论文；现在用 Semantic Scholar 推荐接口按种子论文找相关工作、DeepSeek 写中文摘要、Server 酱推微信，用正负样本论文调推荐。（香港城市大学学生（计算机方向）；practitioner；2026-04-01） <https://lucajiang.github.io/2026/04/01/DailyPaper/index.html>
  - 实验室里最受好评的做法是用飞书捷径把本领域最新成果的订阅邮件自动转进话题群。（高校计算机科研团队成员（飞书官网上的用户实践文）；vendor；） <https://www.feishu.cn/practice_template/22893>
  - 论文提醒系统的问题是研究者看不出新推荐论文和自己已收集论文的关系；15 人用户研究中，给出上下文关联描述后参与者更能判断相关性。（Allen AI / KAIST 的 HCI 研究（CHI 2024）；survey-or-study；2024-03-05） <https://arxiv.org/abs/2403.02939>
  - 分析 8,000 多篇论文：被 AI/ML 大 V 推过的论文中位引用数是对照组的 2–3 倍——发现渠道被少数账号左右。（UCSB 研究者（位置论文，含定量分析）；survey-or-study；2024-01-24） <https://arxiv.org/abs/2401.13782>

### 2. 当我要基于一篇论文的结论做决定（跟进、当 baseline、写进报告）时，我想知道它的结果可不可信、有没有人独立复现过、作者有没有藏细节，以便不在一个站不住的结果上浪费几周。

- 证据强弱：强
- 谁：A1（尤其刚入行的学生、需要选 baseline 的研究工程师）；A2 中做技术尽调的人
- 痛在哪：人人自称 SOTA；关键细节（数据分布、trick、权重共享）不写进论文；预印本没经过评审；会议没有纠错机制。结果是只能自己动手跑。
- 多久一次：每次选 baseline、每次复现；一个课题里多次
- 现在怎么凑合：自己复现（常以周计）；看作者和机构的名声；看有没有开源代码和代码质量；发邮件问作者；优先找已正式发表的版本。
- 缺口：没有一处能查到某篇论文的独立复现记录、已知问题和评测设置差异；Papers with Code 关停后连集中的 SOTA 表都没了。
- 证据：
  - 作者不看原作者代码、独立实现 255 篇论文，其中 162 篇（63.5%）复现成功、93 篇失败；结论之一是开源代码并不足以保证可复现。（Edward Raff（Booz Allen Hamilton / UMBC），NeurIPS 2019；survey-or-study；2019-09-14） <https://arxiv.org/abs/1909.06674>
  - 多位答主给出亲历的复现失败：dataloader 里悄悄改了正负样本比例而论文未提；某小样本论文实际学到的是标签顺序，修正后精度从约 90% 掉到约 60%；内部千万级数据集不公开。应对是不再盲追 SOTA、更看重开源项目质量。（知乎多位从业者/学者的回答（腾讯云开发者社区转载）；practitioner；2022-09） <https://cloud.tencent.com/developer/article/2119566>
  - 做目标检测选型的评论者说各家都宣称自己最优，最后只能逐个手工测试；另有评论者认为没代码的论文应直接拒稿。（HN 评论者 steinvakt2、lalaland1125（从业者）；practitioner；2026-06-08） <https://news.ycombinator.com/item?id=48443644>
  - 主张顶会设「反驳与批评」专门赛道：有误导、错误甚至造假的研究会被接收并获得影响力，而会议缺少系统性的纠错渠道。（Stanford 等机构的 ML 研究者（位置论文）；survey-or-study；2025-06-24） <https://arxiv.org/abs/2506.19882>
  - 15 位 AI/HCI 学者访谈：5 人强调预印本未经评审、可信度不确定；有人质疑为什么必须引用一篇十有八九会被拒的预印本；名组的论文更容易被引用。（访谈研究（15 位学者）；survey-or-study；2025-11-06） <https://arxiv.org/html/2511.04081>

### 3. 当我把多篇论文或多个模型的数字放进同一张对比表时，我想知道每个数字背后的评测设置（哪个 harness、什么 prompt、哪个数据版本和划分），以便这张表的比较是公平的、别人能复查。

- 证据强弱：强
- 谁：A1 写论文实验表和综述的人；A2 写技术选型和竞品对比的人
- 痛在哪：同一模型同一数据集，不同实现能差出一大截；论文里只写一个基准名和一个数；评测对设置极其敏感；榜单排名会因实现不同而变。
- 多久一次：每次写实验对比表、综述表、选型表
- 现在怎么凑合：手工翻论文附录抄数、Excel/飞书多维表格记录；能重跑的自己用同一套数据和提示词重跑；统一用 lm-evaluation-harness。
- 缺口：没有工具能在抽数时同时抽出口径并标出不可比的格子；重跑成本高，多数人只能照抄原文数字。
- 证据：
  - 同一个 LLaMA-65B 在 MMLU 上，原始实现和 HELM 得 0.637，而当时的 EleutherAI harness 得 0.488，排名也随实现变化；只写 MMLU 结果不足以跨库比较。（Hugging Face Open LLM Leaderboard 团队；practitioner；2023-06-23） <https://huggingface.co/blog/open-llm-leaderboard-mmlu>
  - 从维护评测框架的经验总结三个障碍：模型对评测设置敏感、方法间难以做恰当比较、缺少可复现性和透明度。（EleutherAI 等（lm-evaluation-harness 维护者）；survey-or-study；2024-05-23） <https://arxiv.org/abs/2405.14782>
  - 为了公平对比，团队用同一数据集和同一系统提示词跑三类方案；同一任务上自家带管线的方案 F1 约 61%，原生 Claude Code 约 32%，开源权重 GLM 5.2 约 39%——外围 harness 对数字的影响和模型本身一样大；并自陈只有一个任务、一份数据、一次运行。（Semgrep 安全研究与工程团队；practitioner；2026-06-22） <https://semgrep.dev/blog/2026/we-have-mythos-at-home-glm-52-beats-claude-in-our-cyber-benchmarks/>
  - 29 位专家系统审查顶会上的 445 个 LLM 基准，发现在被测现象、任务和打分指标上普遍存在削弱效度的问题，并给出 8 条建议。（Oxford 等机构研究者（NeurIPS 2025 D&B）；survey-or-study；2025-11-03） <https://arxiv.org/abs/2511.04703>
  - NLP 写作指南建议 related work 可以用一张按相关维度对比各方法的表来组织——说明对比表是论文写作里的固定产出物。（社区维护的 NLP 论文写作指南；practitioner；） <https://shmuhammadd.github.io/missing-guide-nlp/chapters/related-work>

### 4. 当我要为团队、客户或投资决策写一份模型/技术路线选型时，我想要一份针对我自己任务的、可复查的横向对比，以便结论不建立在厂商自报分数和被刷过的榜单上。

- 证据强弱：强
- 谁：A2：技术负责人、产品负责人、咨询顾问、做技术尽调的投资人；也包括 A1 里的应用科学家
- 痛在哪：公开榜单被私测多版本、数据接触不对等所扭曲；主流 agent 基准可以不解题就拿到近满分；公开数据集一旦公开就被训练进去；同一产品的质量还会随时间变。
- 多久一次：每次新模型发布、每次立项或采购、每次尽调
- 现在怎么凑合：跳过榜单，直接在自己的用例上试；搭私有评测集；多模型结果互相印证；按报告方的信誉给数字打折；每天定时重跑同一小样本监控退化；拿固定小题当「第一印象」测试。
- 缺口：私有评测集的搭建和持续重跑是纯体力活，多数团队做不起；没有人替他们把「厂商说法—独立评测—自己任务上的结果」放在一张带出处的表里并持续更新。
- 证据：
  - Meta 在 Llama-4 发布前私测了 27 个变体并择优披露；Google 和 OpenAI 的模型各拿到约两成的对战数据，83 个开源权重模型合计不到三成；少量额外数据可带来最高 112% 的相对提升。（Cohere Labs、Princeton、Stanford 等研究者；survey-or-study；2025-04-29） <https://arxiv.org/abs/2504.20879>
  - 对 8 个最常用的 agent 基准做攻击：不解任何任务，SWE-bench Verified/Pro、Terminal-Bench、FieldWorkArena、CAR-bench 可到 100%，WebArena 约 100%，GAIA 约 98%，OSWorld 73%。（UC Berkeley RDI 研究团队；survey-or-study；2026-04） <https://rdi.berkeley.edu/blog/trustworthy-benchmarks-cont/>
  - 评论者的做法：干脆不看基准、直接在自己用例上测（ehtbanton）；用自己代码库的任务搭内部评测并长期跟踪（bisonbear）；公开数据集迟早被训练进去，只有私有集有用（raincole）；数字可信度取决于谁报的（mzelling）。（HN 上的工程从业者；practitioner；2026-04-11） <https://news.ycombinator.com/item?id=47733217>
  - 公开榜单量的是通用编码能力而不是他们关心的漏洞检测，所以自建任务级评测，并报告每发现一个漏洞的成本（GLM 5.2 约 0.17 美元）。（Semgrep 安全研究与工程团队；practitioner；2026-06-22） <https://semgrep.dev/blog/2026/we-have-mythos-at-home-glm-52-beats-claude-in-our-cyber-benchmarks/>
  - 作者承认自己的鹈鹕测试与模型真实质量的相关性已基本断开，只把它当上手检查；认为真正要比的是长对话里稳定调用工具的能力，单一基准不够。（独立开发者/AI 评论者 Simon Willison；practitioner；2026-07-16） <https://simonwillison.net/2026/Jul/16/kimi-k3/>
  - 第三方每天用抗污染的 SWE-Bench-Pro 子集（50 个样本）重跑 Claude Code，算 95% 置信区间来发现退化——同一产品的结论也会过期。（独立监测站 MarginLab；practitioner；） <https://marginlab.ai/trackers/claude-code/>
  - 评论者回忆 Papers with Code 出现前 ML 研究的信息很散乱低效；原站被 Meta 收购后不再维护，有人改看 Hugging Face 热门论文，有人自己写 RSS 抓带代码的论文。（HN 评论者 jeffreysmith、addandsubtract、vjsrinivas、marcindulak；practitioner；2026-06-08） <https://news.ycombinator.com/item?id=48443644>

### 5. 当我要进入一个不熟的方向（新课题、新赛道、一次访谈或尽调的准备）时，我想在几天内拿到一张可信的地图：主线脉络、关键论文、谁在做、哪些方法已经过时，以便把几周的摸索压缩掉。

- 证据强弱：强
- 谁：A1 新课题的学生和转方向的研究者；A2 分析师、投资人、播客/深度内容作者
- 痛在哪：好综述是最快的梯子，但综述正被 LLM 批量生成的低质文章淹没；机器写的综述分不清哪些论文已过时；新兴方向没有教材，连「该怎么学」都要先摸索；读了一周才发现基本概念没懂。
- 多久一次：每个新课题/新项目一次；A2 可能每月数次
- 现在怎么凑合：找名家写的综述；按 Andrew Ng 的读法分多遍读；自己拼课程表；和 LLM 来回问答补概念；看作者机构和发表记录判断综述可信度。
- 缺口：缺一张「由可信来源构成、标明每条判断出处、会说哪些已过时」的方向地图；现有 deep research 报告在专家眼里错误率不可接受（见下一条需求）。
- 证据：
  - 读 5–20 篇大致够在一个细分方向上实现系统，读 50–100 篇才算对一个应用领域理解得很好；新手读懂一篇较容易的论文约 1 小时，有的要 3 小时以上；建议每周稳定读 2 篇。（Andrew Ng（Stanford CS230 讲座，KDnuggets 笔记）；practitioner；2019-09） <https://www.kdnuggets.com/2019/09/advice-building-machine-learning-career-research-papers-andrew-ng.html>
  - 好的综述是进入新领域的快速梯子，能给出自己要花多年才形成的领域直觉（trostaft）；懂行的研究者知道哪些论文已过时，LLM 分不清（awestroke）；每月几百篇平庸综述稀释了质量（physarum_salad）。（HN 上的研究者评论；practitioner；2025-11-01） <https://news.ycombinator.com/item?id=45782136>
  - arXiv CS 类目每月收到数百篇综述，多数只是带注释的文献列表、没有对开放问题的实质讨论，因此改为只收已通过同行评审的综述和立场文章。（arXiv 官方博客；news；2025-10-31） <https://blog.arxiv.org/2025/10/31/attention-authors-updated-practice-for-review-articles-and-position-papers-in-arxiv-cs-category/>
  - 每期访谈准备约一周：读嘉宾的论文和书，为没有教材的新话题自己拼课程；最挫败的是先要弄清怎么学；常常读了一周才发现某个基本细节没懂；大量和 LLM 来回问答找知识缺口。（播客主持人/写作者 Dwarkesh Patel；practitioner；2026-03-02） <https://mercury.com/blog/dwarkesh-patel-interview-prep>
  - 把领域里讲不清的解释、没消化的想法、糟糕的抽象和噪音称为研究债：每多一个新人，理解成本就再付一次，而做梳理的人得不到回报。（Chris Olah、Shan Carter（Distill）；practitioner；2017-03） <https://distill.pub/2017/research-debt/>
  - 读博有内外两层循环，外层是判断哪个问题值得做；作者自己的论文方向是在前两年探索之后、最后一年半才成形。（Andrej Karpathy（时为刚毕业的博士）；practitioner；2016-09-07） <https://karpathy.github.io/2016/09/07/phd/>

### 6. 当机器交回一份调研报告或一张数据表时，我想在几分钟内核查完每个关键事实，以便核查比我自己重做一遍快得多——否则我宁可自己做。

- 证据强弱：强
- 谁：A1 和 A2 中所有已经在试 deep research 类工具的人
- 痛在哪：报告看起来自信而完整，但表里只要有一个数错了整张表就不能用；来源常是 SEO 页面或二手聚合站；检索过程不可见；工具不会说不知道；在自己懂的题目上一测就露馅。
- 多久一次：每次使用 deep research 工具
- 现在怎么凑合：逐条点链接核对；同一问题跑五个以上工具、只留重叠部分；只用它做定性而不做定量；只让 AI 润色自己查好的内容；把自己选定的资料喂给它而不是让它搜网。
- 缺口：没有一个工具把「每句话→原文位置」做成可一眼核对的形式，也没有把来源限定在用户认可的清单内并显示检索过程。
- 证据：
  - 在自己最熟的智能手机市场题目上测试 Deep Research：引用了量流量而非装机量的来源，且把日本 iOS/Android 份额写反（原始来源 Kantar 的数字正好相反）。结论是表里有错就无法信任，但对能改错的专家，它可能把几天的活变成几小时。（独立科技行业分析师 Benedict Evans；practitioner；2025-02-17） <https://www.ben-evans.com/benedictevans/2025/2/17/the-deep-research-problem>
  - 安全研究者 tptacek 说产出只有约六成有用且每条都得抽查；iandanforth 同题跑 5 个以上工具、丢掉 65–75%；领域专家 caseyy 说在其专业里约八成见解是错的；semi-extrinsic 要求从文献抽取的事实接近 99.99% 准确；simonw 要求检索过程可见。（HN 上的研究者、分析师、工程师；practitioner；2025-02-21） <https://news.ycombinator.com/item?id=43133207>
  - 多位评论者的同一个标准：核查必须明显快于自己查，否则没省时间（gorgoiler、Bjorkbat、chombier）；有人只肯让 AI 改文风（brushfoot、giarc）；工具不会说不知道就不能当主要学习来源（squigz）。（HN 评论者；practitioner；2025-02-03） <https://news.ycombinator.com/item?id=42913251>
  - 审计多款生成式搜索和 deep research 系统：引用准确率在 40–80% 之间，大量陈述得不到其自列来源的支持，辩论性问题上明显一边倒。（Salesforce AI Research 等；survey-or-study；2025-09-02） <https://arxiv.org/abs/2509.04499>
  - 3,200 多名研究者、113 个国家：58% 在用 AI 工具（上一年 37%），只有 22% 认为可信、39% 认为不可靠；提升信任的条件依次是自动给出引用（59%）、训练数据够新（55%）、事实准确保证（55%）、来源经同行评审（55%）、有人类专家校验（49%）。（Elsevier《Researcher of the Future》调查（出版商发布）；survey-or-study；2025-11-04） <https://www.elsevier.com/about/press-releases/elseviers-global-survey-of-3-000-researchers-reveals-less-than-half-have>

### 7. 当我在论文或报告里写下一个数字、一个结论或一条引用时，我想能回到原始出处的原文位置并确认这条引用真实存在，以便不因为一条假引用或写反的数字毁掉整份东西的信誉。

- 证据强弱：强
- 谁：A1 所有写论文的人；A2 所有写报告的人
- 痛在哪：通用大模型编造引用的比例极高；假引用已进入顶会录用论文；平台开始处罚；二手聚合来源把原始数字传错。
- 多久一次：每次写作；每条引用
- 现在怎么凑合：用 DOI/arXiv 号从权威库导入元数据而不是让 LLM 生成；手工点开每条引用；Zotero 浏览器插件抓取；只认一手来源。
- 缺口：写作环节没有自动的「引用存在性 + 引文是否支持该句」检查；从笔记里的一句结论回到 PDF 的具体页也常断链。
- 证据：
  - 在科学文献问答上，GPT-4o 有 78–90% 的情况会编造引用；用 4,500 万篇开放论文做检索增强后可达到人类专家水平的引用准确度。（UW / Allen AI 等（OpenScholar）；survey-or-study；2024-11-21） <https://arxiv.org/abs/2411.14199>
  - 扫描 NeurIPS 2025 录用的 4,841 篇论文，在 53 篇中确认至少 100 条编造引用；文中称 NeurIPS 投稿从 2020 年的 9,467 增至 2025 年的 21,575。（GPTZero（AI 检测厂商，自家工具得出）；vendor；2026-01-21） <https://gptzero.me/news/neurips/>
  - 对比四个高性能计算顶会 2021 与 2025 年论文集：2021 年没有问题引用，2025 年每个会都有，影响 2–6% 的论文；没有一位作者声明用 AI 生成引用。（高校研究者 Bienz、Pearson、Garcia de Gonzalo；survey-or-study；2026-02-05） <https://arxiv.org/abs/2602.05867>
  - 编译报道称 2025 年 arXiv、bioRxiv、SSRN、PubMed Central 中有近 15 万条 AI 编造的参考文献，早期职业科学家和小团队比例更高；arXiv 规定含 AI 幻觉内容的作者禁投一年。（中国社会科学报（编译报道）；news；2026-06-17） <https://www.cssn.cn/skgz/bwyc/202606/t20260617_6054402.shtml>
  - 有人用 Claude Code 给 50GB 的 PDF 批量生成 BibTeX；另两位评论者反对，认为用 LLM 生成文献元数据是拿学术信誉冒险，应改用 DOI 导入。（HN 评论者 NL807、btrettel、bayindirh（研究者）；practitioner；2026-07-06） <https://news.ycombinator.com/item?id=48809916>

### 8. 当我写论文的 related work 或报告的现状综述时，我想确认没有漏掉关键工作和同期工作，并把它们组织成几条有论点的线索，以便审稿人或读者不会因为漏引和堆砌而否定我。

- 证据强弱：中
- 谁：A1 写论文的学生和研究者；A2 写综述型报告的人
- 痛在哪：不同子领域用词不同，关键词搜不到；语义搜索又漏掉最新论文；多篇论文的 related work 互相重叠又各有侧重，难以拼成全景；常见失败是写成带注释的文献清单、漏掉里程碑论文、只引自己组。
- 多久一次：每篇论文/每份报告一次，投稿前集中发生；审稿期间出现新论文还要补
- 现在怎么凑合：专门拿一整天做文献检索；以 ACL Anthology 等权威库为主干批量下 BibTeX；读别人的 related work 找线索；Google Scholar、Semantic Scholar、Connected Papers。
- 缺口：没有「对照我的草稿，告诉我漏了谁、谁是同期工作、该放进哪条线索」的检查；检索工具缺日期过滤和新近性权衡。
- 证据：
  - 指南列出 related work 的常见失败：写成带注释的书目、漏里程碑论文、只引自己组、只和弱 baseline 比；建议专门花一整天做文献检索，并给出处理同期工作和评审期间新出现论文的措辞模板。（社区维护的 NLP 论文写作指南；practitioner；） <https://shmuhammadd.github.io/missing-guide-nlp/chapters/related-work>
  - 形成性研究发现：读多篇论文的 related work 段落有助于总览一个主题，但引用互相重叠、研究侧重又各不相同，很难导航；主实验 15 人。（Allen AI / UW 的 HCI 研究（CHI 2023）；survey-or-study；2023-02-13） <https://arxiv.org/abs/2302.06754>
  - 评论者的检索痛点：领域术语导致结果不相关（zzyzek）；语义搜索漏最新论文、需要新近性权衡（swyx）；缺日期过滤（ProofHouse）；出版商限制摘要开放，全面综述覆盖不全（shishy）；现有 Zotero/Mendeley 对个人文献库的本地语义搜索不够（bubaumba）。（HN 上的研究者和工程师；practitioner；2024-12-25） <https://news.ycombinator.com/item?id=42507116>

### 9. 当我做一个课题的几个月里，我想持续知道有没有人发了和我高度相似的工作，以便及时调整定位、抢先挂预印本，或者在论文里把它写成同期工作。

- 证据强弱：中
- 谁：A1 博士生和研究者，尤其是做热门方向的
- 痛在哪：方法趋同、代码易得，很多组同时做同一件事；怕被抢发到不敢打开 arXiv；相似论文可能只隔两天。
- 多久一次：课题进行期间持续；投稿前后最紧张
- 现在怎么凑合：尽早挂 arXiv 打时间戳；刷 arXiv 和学术社交媒体；论文里用同期工作的固定措辞处理。研究者具体怎么监控并发工作，访谈研究没有记录到。
- 缺口：没有围绕「我这个 idea」的持续监控：按我的草稿/摘要去比对每天的新论文，并说明相似在哪、不同在哪。
- 证据：
  - 15 位受访学者中 13 位谈到对被抢发的焦虑；一位受访者回忆两篇高度相似的论文在 arXiv 上只相隔两天；多人用预印本抢时间戳。（访谈研究（8 位 AI、4 位 HCI、3 位交叉）；survey-or-study；2025-11-06） <https://arxiv.org/html/2511.04081>
  - 评论者观察：过去可以在窄方向安静做 3–5 年，现在方法趋同，许多博士生害怕打开 arXiv 和学术社交媒体，担心有人更快。这是对他人的观察，不是第一人称经历。（HN 评论者 bonoboTP（自述学界中人）；practitioner；2025-06-10） <https://news.ycombinator.com/item?id=44235480>
  - 作者的监控管线在 24 小时内发现 9 个机构的 7 篇 VLA 论文在攻同一个机器人操作问题；把它们聚在一起能看出全领域卡在同一处。（HN 用户 CosmoSantoni（自建工具作者）；practitioner；2026-02-18） <https://news.ycombinator.com/item?id=47067509>

### 10. 当我为一个课题读了几十上百篇论文之后，我想让这些理解沉淀成一个会累积、能查询、和文献库互相链接的知识库，以便半年后写论文或换课题时不用从头再读。

- 证据强弱：强
- 谁：A1 全体；A2 中长期跟一个赛道的分析师
- 痛在哪：读完就忘；笔记很多但互不关联；Zotero 管文献、Obsidian 管笔记，两套系统之间断层；维护交叉引用和一致性的记账工作增长得比价值快，于是人就放弃维护。
- 多久一次：持续；每读一篇都发生，写作时集中爆发
- 现在怎么凑合：Zotero + Obsidian + Better BibTeX，文献笔记到主题笔记两层沉淀；Anki/Mochi 间隔重复；写博客或做表格模型来逼自己理解；2026 年起流行让 LLM 代为维护 Markdown wiki（原始资料—wiki—规则三层，摄入/查询/体检三种操作）。
- 缺口：LLM 代维护的 wiki 没有人工把关会变成自信的错误；很多人坚持笔记必须自己写，因为写的过程就是思考。未满足的是：机器只做记账（链接、去重、过期检查、出处回链），人写判断，并且两者在界面上分得清。
- 证据：
  - 维护知识库最烦的不是读和想，而是记账；人放弃 wiki 是因为维护负担涨得比价值快；他的做法是原始资料不动、wiki 层完全交给 LLM、一份规则文件约束结构，一次摄入可能改动 10–15 个页面，并定期做体检找矛盾和过期说法。（Andrej Karpathy（研究者）；practitioner；2026-04） <https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f>
  - 反对意见：有人 2023 年起手写了 4,100 条 Obsidian 笔记，给 AI 内容打隔离标记，认为体力活本身会产生新想法（qaadika）；担心反复改写让信息退化（devnullbrain）；机器生成的 wiki 没时间逐条核查（jdthedisciple）。也有人在 15.5 万词的三本书上试出 210 个概念页并找出真实矛盾（vbarsoum1）。（HN 评论者；practitioner；2026-04-04） <https://news.ycombinator.com/item?id=47640875>
  - 核心困境是资料收集和知识输出割裂：笔记很多却互不相关，读过的材料转不成可用知识，工具太复杂导致维护成本过高；做法是 Zotero 管元数据/PDF/批注，Obsidian 管理解与输出，用稳定引用键关联，并加文献笔记到主题笔记两层沉淀。（个人博客作者 ptyybb（做科研/技术研究的工程师）；practitioner；2026-05-06） <https://tinytka.github.io/2026/05/06/%E6%9C%AC%E5%9C%B0%E6%90%AD%E5%BB%BA%E4%B8%AA%E4%BA%BAzotero-Obsidian%E5%B7%A5%E4%BD%9C%E6%B5%81/>
  - 大量阅读后仍难以长期记住；靠多年积累的间隔重复卡片、写博客、做表格模型和从零实现代码来加深理解。（播客主持人/写作者 Dwarkesh Patel；practitioner；2026-03-02） <https://mercury.com/blog/dwarkesh-patel-interview-prep>
  - 评论者称完全由 LLM 维护的 Markdown 库输出质量会退化（stingraycharles）；没有人审时条目半年后会变成自信的错误（Abby_101）；可行做法是草稿经人或多 agent 独立总结后才升级进 wiki（saadn92、ryanshrott、frrandias）。（HN 评论者（在团队里实际跑过的人）；practitioner；2026-04-25） <https://news.ycombinator.com/item?id=47899844>

### 11. 当组里有人读过某篇论文、踩过某个复现的坑、做过某个方向的调研时，我想让全组都能查到，以便新人不重复劳动、人走了经验还在。

- 证据强弱：中
- 谁：A1 的课题组/实验室；A2 的研究团队和投研团队
- 痛在哪：团队里人人都是研发、没人做知识管理；文档不及时写，后期因积压和遗忘而难补；每多一个成员，理解成本就再付一次。
- 多久一次：每周（组会、周报）；新人加入和成员毕业时集中暴露
- 现在怎么凑合：每周组会轮流分享论文或近期所学；项目一开始就在飞书知识库建项目主页；用多维表格做论文阅读表（进度、参考文献、某方向论文集）；周报归档。
- 缺口：这些都靠人自觉维护；没有人把组会分享、个人笔记和复现记录自动归到一个可查询的地方。此条证据偏少，且唯一的详细一手叙述登在厂商官网上。
- 证据：
  - 实验室 2020 年末引入飞书：项目启动时就建知识库主页以免后期因积压和遗忘补不出文档；每周视频周会含成果/学习分享环节；自制论文阅读多维表格管理进度、参考文献和方向论文集。（高校计算机科研团队成员（登在飞书官网的用户实践文，需按厂商渠道打折看）；vendor；） <https://www.feishu.cn/practice_template/22893>
  - 解释的成本不随人数增长，理解的成本却随每个新成员再增加一次；做梳理的人在现有激励下得不到回报。（Chris Olah、Shan Carter；practitioner；2017-03） <https://distill.pub/2017/research-debt/>
  - 团队里跑 agent 维护 wiki 的人说：AI 失败时要人介入补上下文才能改好文档（psanchez）；从会议记录里后台抽取决策、人审后再入库的做法有效（saadn92）。（HN 评论者；practitioner；2026-04-25） <https://news.ycombinator.com/item?id=47899844>
  - 有人为课题组做了飞书技能：多维表格管成员与方向、知识库按起止日期归档周报，群里一句话触发收周报。仓库仅 1 个 star，只能说明有人有此需求。（开源作者 zhjcreator；practitioner；2026-06） <https://github.com/zhjcreator/feishu-lab-management-skill>

### 12. 当我要交一份综述、深度行业报告或访谈准备材料时，我想把找材料、抽数据、做表、排引用这些体力活交出去，只留判断和结论给自己，以便把几天到一周的活压到几小时。

- 证据强弱：强
- 谁：A2 分析师、顾问、投资人、内容作者；A1 写综述和开题报告的人
- 痛在哪：一份像样的报告要十小时到一周；其中大部分是汇编数据、做图、反复改口径；交给现有工具得到的是入门员工或实习生水平，且要逐条核对。
- 多久一次：A2 每周到每月；A1 每个课题一到两次
- 现在怎么凑合：已经在大规模交给 LLM：研究者里约一半用 AI 做文献综述；专家把 deep research 当初稿再自己改；也有人直接把机器产出当成品发出去。
- 缺口：交出去的部分缺少可核查性（见核查那条）；产出是一次性的，不会随新资料更新；不能读用户有权限的付费来源。
- 证据：
  - 19 位不同行业的专业人士测试 Deep Research：7 人认为达到专业水平，其余多比作入门员工或实习生；多数估计同等报告需要至少 10 小时人工，4 人估计要一周；也遇到付费墙来源读不到和信息不够新的问题。（记者 Timothy B. Lee 组织的 19 人测试；practitioner；2025-02-24） <https://www.understandingai.org/p/these-experts-were-stunned-by-openai>
  - 他自己的研究工作大量是手工汇编数据、做图、反复换角度；认为 deep research 对有领域知识、能改错的人可以把几天的活变成几小时，相当于无限多的实习生。（独立科技行业分析师 Benedict Evans；practitioner；2025-02-17） <https://www.ben-evans.com/benedictevans/2025/2/17/the-deep-research-problem>
  - 研究者当前用 AI 的任务：查找和总结研究 61%、文献综述 51%、起草基金申请 41%、起草论文 38%、分析数据 38%；只有 45% 认为自己有足够时间做研究。（Elsevier 调查（3,200 多人）；survey-or-study；2025-11-04） <https://www.elsevier.com/about/press-releases/elseviers-global-survey-of-3-000-researchers-reveals-less-than-half-have>
  - 816 位已核实的论文作者中，81% 已把 LLM 用进研究流程的某些环节；非母语、初级研究者用得更多、感知收益更高。（UW / Allen AI 调查；survey-or-study；2024-10-30） <https://arxiv.org/abs/2411.05025>
  - 行为证据：LLM 让综述很容易按需批量产出，arXiv CS 每月收到数百篇，多为带注释的书目——说明这件事已被大量交给机器，但质量不被接受。（arXiv 官方博客；news；2025-10-31） <https://blog.arxiv.org/2025/10/31/attention-authors-updated-practice-for-review-articles-and-position-papers-in-arxiv-cs-category/>
  - 一个研究投资平台自述三年里公开发布近 200 篇深度研究、覆盖 150 多家全球头部公司，并包含去硅谷的一线走访——可见这类团队的产出节奏和一手访谈的地位。（海外独角兽（拾象科技旗下开源研究平台）自我介绍；practitioner；） <https://www.xiaoyuzhoufm.com/podcast/6410266f5384961ba7e08c7d>

### 13. 当我的综述、对比表或选型结论写完几个月之后，我想有人持续告诉我其中哪些说法已经过时并把它更新，以便我引用旧结论时不出错。

- 证据强弱：中
- 谁：A2 长期跟踪赛道的人；A1 维护综述和 baseline 表的人
- 痛在哪：论文和模型迭代极快；旧论文、旧基准、旧经验法则会悄悄失效；只有懂行的人知道哪些已过时；集中维护的 SOTA 表会停更。
- 多久一次：持续；每次新模型或重要论文发布
- 现在怎么凑合：报告里给数据标新旧并承诺季度更新；第三方每天重跑固定评测；个人靠经验判断。
- 缺口：没有对「我自己写过的结论」的过期体检：哪条被新论文推翻、哪个数字有了新版本。
- 证据：
  - 懂行的研究者知道哪些论文已过时，而 LLM 无法可靠区分过时和现行的工作。（HN 评论者 awestroke；practitioner；2025-11-01） <https://news.ycombinator.com/item?id=45782136>
  - 一份公开的 AI 基础模型行业调研报告用颜色标注每个数据的新旧（一年内、半年内、一年前、预测值），附数据校验方法并声明按季度更新——说明写报告的人自己也把时效当成要管理的对象。（GitHub Gist 用户 itsRay2014（未说明是否由 AI 生成）；practitioner；2026-03-01） <https://gist.github.com/itsRay2014/d83f4b5ed2666ba8239b89f12c4b2c42>
  - 自己用了多年的非正式测试与模型真实质量的相关性已基本断开。（Simon Willison；practitioner；2026-07-16） <https://simonwillison.net/2026/Jul/16/kimi-k3/>
  - 为发现同一产品随时间的退化，每天重跑 50 个样本并做统计检验。（MarginLab；practitioner；） <https://marginlab.ai/trackers/claude-code/>

### 14. 当我精读一篇英文论文时，我想要保留公式和版式的中英对照，并能在文献库里直接翻译批注和摘要，以便读得快又不丢细节。

- 证据强弱：强
- 谁：A1 中的大陆研究生和研究者；A2 中读英文一手材料的中文分析师
- 痛在哪：英文是额外成本；普通翻译破坏公式、图表和版式；全英文链接不便在中文团队里分享。
- 多久一次：每次读论文
- 现在怎么凑合：PDFMathTranslate 做保留版式的整篇翻译；Zotero 翻译插件划词和批注翻译；ChatPaper 一分钟总结；飞书文档一键翻译全文；自建脚本把中文摘要推到微信。
- 缺口：翻译、总结、入库、笔记分散在四五个工具里，没有连成一条线。这条需求的行为证据（star 数）比任务清单里的大多数痛点都硬。
- 证据：
  - 保留公式、图表、目录和批注的科学 PDF 翻译工具，仓库显示 37.3k star。（开源项目（研究者社区）；practitioner；） <https://github.com/Byaidu/PDFMathTranslate>
  - Zotero 内翻译 PDF、批注、标题和摘要的插件，支持 20 多种翻译服务，仓库显示 12.0k star。（开源插件作者 windingwind；practitioner；） <https://github.com/windingwind/zotero-pdf-translate>
  - 作者是中科大强化学习方向博士生，动机是每天海量的 arXiv 论文加上语言障碍；目标是 AI 一分钟总结、人一分钟读完；仓库显示 19.9k star。（ChatPaper 作者（博士生）；practitioner；） <https://github.com/kaixindelele/ChatPaper>
  - 发帖团队做 arXiv 速读站的三个理由之一是提供中文摘要快速筛选、避免全英文和链接失效；回帖用户 ihainan 要求左论文右 LLM 的布局、与 Zotero 笔记双向同步、优先提取流程图。（V2EX 用户 rodemon（工具方）、ihainan（使用者）；practitioner；2025-08-15） <https://www.v2ex.com/t/1152535>

### 15. 当调研需要读付费墙或登录后才能看的材料（付费数据库、行业报告、付费媒体、出版商全文）时，我想让替我干活的工具用我自己的订阅权限去读一手来源，以便报告不再建立在免费的二手聚合页上。

- 证据强弱：中
- 谁：A2 分析师、顾问、投资人；A1 中需要读出版商全文的人
- 痛在哪：现有云端 deep research 读不到付费内容，于是引用 SEO 页和二手聚合站；出版商限制摘要进入开放索引；Google Scholar 不开放接口。
- 多久一次：每次做行业研究；A1 偶发
- 现在怎么凑合：自己登录下载后再喂给工具；把选定资料放进 NotebookLM 一类工具；手工回到原始来源核对。
- 缺口：没有一个能在用户本机、用用户已登录的浏览器读取其有权阅读的内容并留下出处的研究助手。此条直接证据不多，但和产品能力正好对应。
- 证据：
  - Deep Research 引用的是聚合并设付费墙的 Statista 和量流量的 Statcounter，而真正的原始数据在 Kantar；作者是回到原始来源才发现数字写反了。（Benedict Evans；practitioner；2025-02-17） <https://www.ben-evans.com/benedictevans/2025/2/17/the-deep-research-problem>
  - 测试者遇到工具读不到付费墙后的专业规范网站的情况。（Timothy B. Lee 组织的 19 人测试；practitioner；2025-02-24） <https://www.understandingai.org/p/these-experts-were-stunned-by-openai>
  - 出版商限制摘要进入 OpenAlex 一类开放索引，影响全面综述的覆盖（shishy，曾在 scite 工作）；Google Scholar 的封闭让人恼火（eric-burel）；Deep Research 和普通搜索一样掉进 SEO 陷阱（j_maffe、light_triad，后两者出自另一讨论帖）。（HN 评论者；practitioner；2024-12-25） <https://news.ycombinator.com/item?id=42507116>
  - 有评论者自建了用用户提供的数据而非网页结果的替代方案，称控制来源后答案质量明显提高（somerandomness）；另有人建议用专家整理的可信来源清单（kgeist）。（HN 评论者；practitioner；2025-02-21） <https://news.ycombinator.com/item?id=43133207>

## 工具与花费

| 工具 | 用来做什么 | 价格 | 谁付钱 | 抱怨 | 来源 |
|---|---|---|---|---|---|
| Zotero | 文献库、PDF 批注、浏览器抓取、BibTeX 导出 | 软件免费；存储 300MB 免费，2GB 20 美元/年，6GB 60 美元/年，不限量 120 美元/年 | 个人；群组存储算在群主账户上 | 对个人文献库的本地语义搜索不够；有人嫌重而改用纯 BibTeX 文本文件；和笔记系统之间断层 | <https://www.zotero.org/storage> |
| Obsidian | 阅读笔记、主题笔记、LLM 维护的 Markdown wiki 的查看端 | 应用免费；Sync 年付 4 美元/月；商用授权 50 美元/人/年；学生教师 Sync 六折 | 个人 | 笔记爆炸、互不关联、维护成本高 | <https://obsidian.md/pricing> |
| 自建脚本（GitHub Actions + arXiv/Semantic Scholar 接口 + DeepSeek + 邮件或微信推送） | 每日论文筛选和中文摘要 | 一位作者称每天约 0.2 元；zotero-arxiv-daily 称零成本 | 个人 | 只按兴趣相似，不按课题；要自己维护 | <https://www.v2ex.com/t/1138124> |
| PDFMathTranslate / zotero-pdf-translate / ChatPaper | 保留版式的论文翻译、Zotero 内翻译、论文一分钟总结 | 开源免费（翻译或模型接口另计） | 个人 | 和文献库、笔记各自独立，没有连成一条线 | <https://github.com/Byaidu/PDFMathTranslate> |
| Elicit | 论文检索、数据抽取成表、研究报告、系统综述筛选 | 基础免费；Pro 49 美元/月；Scale 169 美元/月；企业版另议（厂商标价） | 未找到来源 | 未找到 AI 研究者对它的一手评价 | <https://elicit.com/pricing> |
| Undermind | 深度文献搜索 | 免费版；Pro 年付 16 美元/月；Team 年付 15 美元/人/月（厂商标价） | 未找到来源 | 未找到一手评价 | <https://www.undermind.ai/pricing> |
| ChatGPT / Gemini / Perplexity 的 deep research | 综述和行业报告初稿、访谈准备 | 本次未能打开定价页（OpenAI 定价页 403） | 有评论者为此开了多个账号（个人付费的迹象） | 表里数字写反、来源是 SEO 页和二手聚合站、读不到付费墙内容、核查不比重做快、专家眼里错误多 | <https://news.ycombinator.com/item?id=43133207> |
| Papers with Code（原站已停更）/ Hugging Face 热门论文 / paperswithcode.co | 找带代码的论文、看 SOTA 表 | 免费 | 无 | 原站被收购后不再维护；替代品看不到可靠的集中 SOTA 表 | <https://news.ycombinator.com/item?id=48443644> |
| 飞书（知识库、多维表格、妙记、捷径） | 课题组项目主页、论文阅读表、周会、把订阅邮件转进话题群 | 未查定价 | 课题组/单位（推断，未找到来源） | 靠人自觉维护 | <https://www.feishu.cn/practice_template/22893> |
| Readwise / Reader | 高亮回顾、稍后读、导出到 Obsidian/Notion | Lite 年付 5.59 美元/月；完整版年付 9.99 美元/月；学生五折 | 个人 | 未找到 AI 研究者的一手评价 | <https://readwise.io/pricing> |
| Anki / Mochi、OneNote 清单、Google Scholar 提醒、newsletter | 间隔重复记忆、每周阅读清单、新论文提醒 | 未查 | 个人 | 读了仍然记不住；收集的大部分不重要 | <https://sebastianraschka.com/blog/2023/keeping-up-with-ai.html> |
| 私有评测集 + lm-evaluation-harness | 在自己任务上做模型选型和退化监控 | 工程人力和接口费用（Semgrep 报告每发现一个漏洞约 0.17 美元） | 公司团队 | 搭建和持续重跑是体力活；单任务单次运行的结论不能外推 | <https://semgrep.dev/blog/2026/we-have-mythos-at-home-glm-52-beats-claude-in-our-cyber-benchmarks/> |
| alphaXiv | 在论文具体段落上讨论、AI 问答 | 未查 | 未找到来源 | 未找到 | <https://baoyu.io/blog/alphaxiv-arxiv-paper-reader> |

## 数字

- arXiv 全站月投稿：2023-01 为 13,870；2025-09 为 26,646；2026-09 为 40,363；截至 2026-10-04 累计 3,195,083 篇投稿（全站口径）。（官方统计） <https://arxiv.org/stats/get_monthly_submissions>
- 独立实现 255 篇 ML 论文，162 篇（63.5%）复现成功。（研究（NeurIPS 2019）） <https://arxiv.org/abs/1909.06674>
- 同一 LLaMA-65B 在 MMLU 上：原始实现与 HELM 为 0.637，当时的 EleutherAI harness 为 0.488。（从业者技术博客） <https://huggingface.co/blog/open-llm-leaderboard-mmlu>
- 8 个主流 agent 基准不解题可得：5 个 100%、WebArena 约 100%、GAIA 约 98%、OSWorld 73%。（研究（UC Berkeley）） <https://rdi.berkeley.edu/blog/trustworthy-benchmarks-cont/>
- Meta 在 Llama-4 发布前在竞技场私测 27 个变体；少量额外数据可带来最高 112% 相对提升。（研究） <https://arxiv.org/abs/2504.20879>
- 29 位专家审查 445 个 LLM 基准，普遍存在效度问题。（研究（NeurIPS 2025 D&B）） <https://arxiv.org/abs/2511.04703>
- GPT-4o 在科学文献问答中 78–90% 的情况编造引用。（研究） <https://arxiv.org/abs/2411.14199>
- deep research 类系统引用准确率 40–80%。（研究） <https://arxiv.org/abs/2509.04499>
- NeurIPS 2025 录用论文中 53 篇含至少 100 条编造引用（扫描 4,841 篇）；NeurIPS 投稿 2020 年 9,467、2025 年 21,575。（厂商（AI 检测）） <https://gptzero.me/news/neurips/>
- 四个 HPC 顶会：2021 年无假引用，2025 年影响 2–6% 的论文。（研究） <https://arxiv.org/abs/2602.05867>
- 3,200 多名研究者：45% 认为有足够时间做研究；58% 用 AI（上年 37%）；22% 认为 AI 工具可信；51% 用于文献综述；中国 68% 对比美国 29% 认为 AI 给了更多选择；59% 认为自动引用能提升信任。（调查（出版商发布）） <https://www.elsevier.com/about/press-releases/elseviers-global-survey-of-3-000-researchers-reveals-less-than-half-have>
- 816 位论文作者中 81% 已在研究流程中使用 LLM。（调查） <https://arxiv.org/abs/2411.05025>
- 15 位 AI/HCI 学者访谈，13 位谈到被抢发的焦虑。（访谈研究） <https://arxiv.org/html/2511.04081>
- 8,000 多篇论文的分析：被大 V 推过的论文中位引用数为对照组的 2–3 倍。（研究） <https://arxiv.org/abs/2401.13782>
- 19 位专业人士测试 Deep Research：7 人评为专业水平；多数估计人工至少 10 小时，4 人估计一周。（记者组织的测试） <https://www.understandingai.org/p/these-experts-were-stunned-by-openai>
- 读 5–20 篇可入门一个细分方向，50–100 篇才算理解得很好；新手一篇约 1 小时，难的 3 小时以上。（从业者经验） <https://www.kdnuggets.com/2019/09/advice-building-machine-learning-career-research-papers-andrew-ng.html>
- 每期访谈准备约一周。（从业者自述） <https://mercury.com/blog/dwarkesh-patel-interview-prep>
- GitHub star：PDFMathTranslate 37.3k；ChatPaper 19.9k；zotero-pdf-translate 12.0k；zotero-arxiv-daily 6.0k（fork 5.2k）。（行为证据（页面显示值）） <https://github.com/Byaidu/PDFMathTranslate>
- ICLR 2026：约 19,000 篇投稿、70,000 条评审，21% 的评审被判为全 AI 生成。（厂商（AI 检测）） <https://www.pangram.com/blog/pangram-predicts-21-of-iclr-reviews-are-ai-generated>
- arXiv CS 类目每月收到数百篇综述文章。（官方公告） <https://blog.arxiv.org/2025/10/31/attention-authors-updated-practice-for-review-articles-and-position-papers-in-arxiv-cs-category/>
- 作者称 2025 年 AI 各领域论文 8 万多篇、每周 1,000 多篇。（从业者自述（未见其统计口径）） <https://thisweekonarxiv.substack.com/p/keeping-up-with-the-ai-research-firehose>
- 海外独角兽自述三年发布近 200 篇深度研究、覆盖 150 多家公司。（机构自述） <https://www.xiaoyuzhoufm.com/podcast/6410266f5384961ba7e08c7d>
- 一篇厂商软文称博士生人均囤积 300 多篇未读 PDF、真正有用的不到 15%——无出处，仅代表厂商对需求的看法。（厂商软文（不可当事实）） <https://www.cnblogs.com/nut-king/p/21282226>

## 可以交给 AI 的、只能协助的、不会交出去的

一、可以整件交给常驻 AI 同事的（低判断、可核查、用户已经在用脚本做）
1) 围绕「我的课题」的持续监控：按用户文献库、种子论文和草稿摘要比对每天的新论文，交回带出处的「相似在哪、不同在哪」。理由：用户已把这件事交给免费脚本（6.0k star 的仓库、每天 0.2 元的自建工具），信任门槛低；错了代价小、看一眼原文就能核对。
2) 文献库记账：元数据按 DOI/arXiv 号从权威库取（不让模型生成）、引用存在性核验、去重、Zotero 与笔记互链、wiki 交叉引用和矛盾/过期体检。理由：Karpathy 和多位评论者都说放弃知识库是因为记账，而不是因为读和想；研究者明确反对让 LLM 生成书目数据，所以必须走 DOI。
3) 对比表的抽数与口径标注：每个格子回链到 PDF 的页和表，标出 harness、prompt、数据版本，定时重抽。理由：是纯体力活，且「每格可回链」正好满足核查快于重做的条件。
4) 在用户机器上定时重跑用户自己的评测集。理由：从业者的共识是只信自己任务上的结果，但重跑是体力活。
5) 保留版式的翻译和双语对照。理由：行为证据最硬（37.3k star），没有判断成分。
6) 用用户已登录的浏览器取回其有权阅读的全文并存档留出处。理由：云端工具做不到，且这是访问权问题而非判断问题。

二、只能协助、人必须在环的
1) 新方向地图和综述初稿：机器分不清哪些论文已过时，专家要改；表里一个错就整张作废（Evans）。可交付形态是「带出处的草稿 + 明确标出不确定处」。
2) related work 草稿和漏引检查：可以对照草稿提示漏了谁、谁是同期工作，但线索怎么组织、怎么评价前人，是作者的论点。
3) 可信度判断：机器可以收集信号（有无代码、有无独立复现、评测设置差异、作者是否回邮件），结论由人下。
4) 复现：能跑代码、记录差异，但调试和算力决策在人。
5) 行业报告的数据汇编：定量部分必须逐条可核查；定性判断归分析师。
6) 团队知识库：机器抽取、人审后才入库；没人审的条目半年后会变成自信的错误（HN 上实际跑过的人的说法）。

三、不会交出去的
1) 选题和研究品味（Karpathy 说的外层循环）、报告的结论和立场。理由：这是他们的价值所在，也是署名责任。
2) 署名文字的终稿和引用的最终把关。理由：学术诚信风险，已有平台禁投一年的处罚；有评论者把让 LLM 生成引用比作拿学术信誉冒险。
3) 个人笔记里「自己写」的那部分。理由：写的过程就是思考，有人给 AI 内容打隔离标记、坚持手写 4,100 条笔记。
4) 专家访谈、一线走访、人脉。理由：关系和信任，机器替代不了；海外独角兽把硅谷走访当核心，Dwarkesh 的产出就是访谈本身。
5) 同行评审。理由：会议保密规定；不过厂商数据称 ICLR 2026 有 21% 的评审被判为全 AI 生成，说明规定和行为不一致，本地运行可能正是这类人要的，但产品不宜主打。

四、让他们敢把事情交给机器的条件（来自证据）
- 每个事实回链到原文位置，核查明显快于重做（HN 多人的同一标准）。
- 来源限定在用户认可的清单或用户提供的资料内，检索过程可见（simonw、somerandomness、kgeist）。
- 自动给引用、来源经同行评审、有人工校验（Elsevier 调查里排前几位的信任条件：59%、55%、49%）。
- 会说不知道；抽取类事实要接近零错（有评论者要求 99.99%）。
- 机器写的和人写的在界面上分得清；入库前有人审这一道闸。
- 先在用户自己最懂的题目上试——所有人都是这样检验工具的。

## 出乎意料的发现

1) 每日论文推送的需求是真的，但已经被免费自建脚本做到几乎零成本（fork 一个仓库即可，自建工具每天约 0.2 元）。所以「早报」不是空白，产品负责人的纠正和证据一致：未满足的是相对于我手上课题的筛选、解释和沉淀。
2) 瓶颈不是找不到论文，而是注意力和判断。做过 arXiv 审核的 Raschka 说找论文不难；收进来的约 95% 事后不重要。
3) 「让 AI 帮我写综述」不是未满足的需求，而是已经泛滥到被平台封堵：arXiv CS 每月收到数百篇 LLM 批量综述，于是不再收未经评审的综述。未满足的是可信、可核查、会更新的综述。
4) 决定能不能交给机器的不是生成速度，而是核查成本。HN 上多人给出同一个标准：核查必须明显快于自己做。Evans 的说法更极端：表里有错就不用了，准确率从 85% 提到 95% 并不解锁委托，回链出处才解锁。
5) 很多重度用户拒绝让机器写自己的笔记，理由是写就是想；实际跑过 agent 维护 wiki 的人说没有人审半年后会变成自信的错误。「同事自己维护一个文件夹」这个产品设定需要一道人审的闸，否则会被这批人否定。
6) 可信的横向对比不是没人聚合，而是源头就不存在：Papers with Code 关停；8 个主流 agent 基准可不解题拿近满分；最大的竞技场榜单被私测和数据不对等扭曲。A2 要的对比只能在用户自己的任务上现做。
7) 同一个基准名下的数字不可比到了 0.637 对 0.488 的程度；harness 对分数的影响和模型一样大（Semgrep：61% 对 32%）。跨论文对比表如果不带口径，本身就是错的。
8) 中文用户行为证据最硬的需求不在任务给的痛点清单里：保留版式的论文翻译（37.3k star）和 Zotero 内翻译（12.0k star）。
9) 信任有明显的地区差：Elsevier 调查里中国研究者对 AI 工具的正面看法（68%）远高于美国（29%）和英国（26%）。大陆优先的话，信任门槛可能比英文社区的抱怨所显示的低，但这只是一项调查的一个题目。
10) 发现渠道被少数大 V 左右：被 AI/ML 大 V 推过的论文中位引用是对照组的 2–3 倍。研究者嘴上说要全面，行为上靠几个账号。
11) 规定不许但人在做：厂商数据称 ICLR 2026 约 21% 的评审为全 AI 生成；2025 年 HPC 顶会 2–6% 的论文有假引用且无人声明用了 AI。说得出口的需求和实际行为之间有缺口。
12) 博士生对并发工作的反应不是更勤地盯，而是不敢打开 arXiv（他人观察）；访谈研究也没记录到任何系统的监控做法。这件事可能是需求真实但无人在做。

## 没查到的

一、打不开或被拦的
- WebSearch 本会话配额已用尽（200/200），改用内置浏览器里的 Bing 和 HN Algolia 接口检索，覆盖面因此偏向 HN、个人博客和 arXiv。
- Reddit（r/MachineLearning、r/LocalLLaMA）被工具的安全限制拦截，WebFetch 和浏览器都打不开。Bing 结果里看到一个标题相关的 r/MachineLearning 帖子（被论文围困、担心被抢发），未能打开，未采用。
- 知乎（问答和专栏）全部跳到人机验证页，按规则没有绕过。因此中文一手叙述主要来自 V2EX、个人博客、GitHub README 和腾讯云社区对知乎回答的转载。
- 小红书、即刻、脉脉：没有可不登录检索的入口，未取得任何内容。
- kexue.fm（苏剑林关于 Cool Papers 的文章）403 且浏览器导航被拒；Nature 两篇新闻跳转到 idp 授权页，未继续；OpenAI 的 SWE-bench 说明页和定价页 403；SciSpace 定价页 403；Consensus 定价页无内容；掘金和一篇 CSDN 文章加载不出正文；Medium 一篇 403；新浪一篇关于 AI 抢先完成数学博士课题的报道已删除，相关说法未采用；Wiley ExplanAItions 报告全文需注册，只确认了样本量 2,430。
- 所有网页内容经 WebFetch 的小模型转述，原话未逐字核对，所以本结果全部为转述、没有使用直接引语。HN 用户名和数字来自转述，建议引用前再点开核对。
- WebFetch 自动把 Raff 论文 PDF 存到了会话的 tool-results 目录（工具行为，非我主动写文件）；我读了第 1–4 页确认 162/255 这个数。

二、找了但没找到的
- AI 研究者每周花多少小时读论文、做文献综述：没有带样本的测量。只有 Andrew Ng 的经验数字和个别人的自述。
- 付费意愿和谁付钱（个人、课题组经费、公司）：没有任何来源。工具定价是厂商标价，不是实际支出。
- A2 的中文一手叙述（AI 行业研究员、做技术尽调的投资人、咨询顾问怎么做一份深度报告）：公开网页上几乎全是 SEO 和厂商稿，没有找到可用的从业者自述。投资人技术尽调这一细分完全没有一手证据。
- 研究者具体怎么监控并发工作：访谈研究明确没有记录到。
- 团队知识共享：只有一篇登在飞书官网上的实验室实践文和零星评论，证据薄。
- 「找不到某个结论的出处」作为个人日常痛点的第一人称叙述：没有找到，现有证据是假引用的统计和工具审计。
- deep research 工具在中文语境、中文来源上的准确率：没有找到。

三、只有访谈能回答的问题
1) 最近一次从零调研一个方向，实际花了几天？时间花在哪一步？产出物长什么样、给谁看？
2) 对比表是怎么做出来的？口径不一致时怎么处理？被人指出过表里的错吗？
3) 现在每月为研究工具自己掏多少钱？哪些是组里或公司付的？上一次因为什么取消了订阅？
4) 让一个工具用你已登录的浏览器去读知网、万方、付费数据库或付费媒体，你愿意吗？顾虑是什么（账号风险、单位规定、版权）？
5) 你会让机器改你的 Zotero 库和笔记吗？哪些文件夹可以、哪些绝对不行？需要怎样的撤销和审阅？
6) 用过哪家 deep research？在你最懂的题目上错在哪？你是怎么发现的？核查花了多久？
7) 课题进行中你怎么知道有没有人撞车？多久看一次？被抢发过吗，之后怎么处理的？
8) 组会分享的内容之后去了哪里？新人入组第一个月靠什么上手？
9) A2：一份选型或尽调报告里，哪些数字必须是一手的？厂商给的数字你怎么验证？谁会质疑你的报告、质疑什么？
10) 一个常驻的 AI 同事跑几个小时交回一份文档——你希望它在哪几个节点停下来问你？
