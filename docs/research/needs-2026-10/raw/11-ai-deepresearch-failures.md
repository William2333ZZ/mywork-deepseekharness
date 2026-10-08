# AI 5：深度研究产品在哪里失败

原始调研记录（2026-10-05）。未经逐条复核，复核结果见上一级目录的 `audit.md`。数字和说法以各条所附网址的原文为准。

## 人群

- **A1 做 AI 研究的人**：研究员、研究工程师、博士生、应用科学家；写综述、related work、课题申报、方法对比
  - 深度研究工作：为一个研究方向做文献综述（数十到上百篇）、方法对比表、基准成绩汇总、研究空白分析；持续跟踪一个子领域数月。产出：related work 章节、综述论文、开题/申报材料、内部技术调研。
  - 规模：没有找到人数来源。可作参照的规模线索：NeurIPS 2025 录用 4841 篇、录用率 24.52%（GPTZero 页面所述，https://gptzero.me/news/neurips/）；Wiley 2025 调查样本 2400+ 名各学科研究者，84% 使用 AI、62% 用于研究与发表任务（https://newsroom.wiley.com/press-releases/press-release-details/2025/AI-Adoption-Jumps-to-84-Among-Researchers-as-Expectations-Undergo-Significant-Reality-Check/default.aspx）
- **A2 深度研究 AI 产业的人**：行业分析师（如 Evans、Thompson、海外独角兽）、做技术尽调的投资人、咨询顾问、写竞品/选型研究的战略和产品负责人
  - 深度研究工作：公司与赛道研究（市场格局、产品技术、商业模式、竞品、团队）、技术选型对比、供应链梳理、带数据表的市场规模与份额分析、访谈准备。产出：行业深度、投资备忘、咨询建议、选型报告。
  - 规模：没有找到人数来源。线索：DeepResearch Bench 分析 96147 条真实联网查询，科技与商业金融是占比最高的两类主题（https://deepresearch-bench.github.io/）
- **跨学科/进入陌生领域的研究者（A1 的相邻人群）**：需要快速补另一个学科知识的研究者
  - 深度研究工作：用 AI 获取非本行知识、搭桥；把原创判断留给自己。产出：入门综述、跨领域的研究设想。
  - 规模：一项 15 人纵向访谈研究（https://arxiv.org/abs/2609.30588）；无总体规模数据

## 工作流

1. **1. 定题与拆框架**：把大问题切成可研究的维度（行业/地区/时间跨度/读者），确定报告结构和比较维度。实际做法是先和模型来回几轮澄清，或先问「做这个综述该关注什么」拿到结构再写正式指令。
   - 产出：研究问题清单、报告提纲、表格的列定义
   - 工具：ChatGPT/Gemini 深度研究的澄清对话；自己的模板
   - 时间：几轮对话即可；但这一步给的信息决定后面整条轨迹（arXiv 2609.33509），相同查询不同人想要的不同（DRACULA）
   - 来源：<https://wangshuyi.substack.com/p/openai-deep-research> <https://xiangyu-yin.com/content/post_deep_research.html> <https://arxiv.org/abs/2604.23815> <https://arxiv.org/abs/2609.33509>
2. **2. 找线索、建书单**：找代表性论文、关键公司、数据来源。专家的手工做法是从 Related Work 和 Google Scholar 引用关系里追；AI 做法是深度研究跑多次再合并（单次有漏、每次不一样）。
   - 产出：候选文献/来源清单（Yin 的例子：44 篇参考文献，任何单一方法都没找全）
   - 工具：深度研究（OpenAI/Gemini/Perplexity）、Google Scholar、Elicit/Asta 类学术检索、Exa/Kagi
   - 时间：AI 单次 5–30 分钟（OpenAI 官方说法；王树义实测一次 11 分钟）；专家估计同等产出人工要 10 小时以上（Understanding AI 的 19 人评估）。这是 AI 目前最省时间的一段。
   - 来源：<https://xiangyu-yin.com/content/post_deep_research.html> <https://www.linkedin.com/posts/namwkim_summarized-version-of-the-related-work-by-activity-7300755482137296896-fw9D> <https://www.understandingai.org/p/these-experts-were-stunned-by-openai> <https://arxiv.org/abs/2605.29234>
3. **3. 拿到全文和不公开的资料**：付费论文、专有数据库、自己文献库里的 PDF、不在网上的信息（未上市公司、访谈）。现有产品到这一步基本断掉，专家改为自己下载 PDF、转 Markdown、再喂给模型。
   - 产出：本地资料集（Yin：27 篇自选 PDF）
   - 工具：机构订阅、Zotero/本地 PDF 库、Marker-PDF、NotebookLM、文件上传
   - 时间：全靠人；来源没有给出时间数字。半手工方案的最终得分最高（9.08 对 8.92/8.50）
   - 来源：<https://xiangyu-yin.com/content/post_deep_research.html> <https://www.oneusefulthing.org/p/the-end-of-search-the-beginning-of> <https://stratechery.com/2025/deep-research-and-knowledge-value/>
4. **4. 精读与抽取成表**：把每篇/每家的方法、数据、指标、结论、数字抽成统一格式的表或数据集。
   - 产出：方法对比表（Yin：7 列）、机器可读 CSV（Kucharski）、产品矩阵（FutureSearch：45 个产品 × 多列）
   - 工具：人工 + Excel；Elicit 的按列抽取；模型读 PDF
   - 时间：专家称把已发表数据整理成标准格式一直是难点（Kucharski）；AI 在这一步漏行漏格（34/45 产品，118/170 单元格），所以仍以人工为主
   - 来源：<https://kucharski.substack.com/p/the-shallowness-of-deep-research> <https://futuresearch.ai/oaidr-feb-2025> <https://elicit.com/pricing>
5. **5. 综合、归纳、下判断**：按主题把文献归组、比较路线、指出空白和趋势、给出观点。AI 倾向逐篇罗列、篇幅长而观点弱；专家把判断和原创留给自己。
   - 产出：报告正文各节、竞品比较、风险与判断
   - 工具：多模型分别出稿后互相批评合并（HN fallinditch）；人工重写
   - 时间：来源没有给出时间数字；这是专家明确不外包的一段（15 人访谈研究）
   - 来源：<https://news.ycombinator.com/item?id=43185868> <https://arxiv.org/abs/2609.30588> <https://m.huxiu.com/article/4264516.html>
6. **6. 核查**：逐条引用点开对原文，逐个数字回查一手出处和口径，查有没有漏关键项。
   - 产出：核过的报告；被删改的论断
   - 工具：浏览器 + 搜索引擎；第二个模型交叉核（但担心同错）；引用检测工具
   - 时间：专家反复说这一步可能吃掉省下的时间（HN nxobject、Kim）；一位用户写 5 小时后仍面临巨大核查量（HN johngossman）。没有来源给出占比数字
   - 来源：<https://news.ycombinator.com/item?id=43183723> <https://news.ycombinator.com/item?id=47289837> <https://www.ben-evans.com/benedictevans/2025/2/17/the-deep-research-problem>
7. **7. 持续维护与更新**：课题持续数周数月：新论文、新财报、新版本出来后更新结论。商用深度研究不支持，专家自己搭持久 wiki：新来源进来 → 模型读、写摘要页、更新实体/概念页、标出与旧结论的矛盾。
   - 产出：持续更新的项目知识库（Karpathy：一个来源可能改动 10–15 个页面）
   - 工具：Claude Code/Codex 类智能体 + Obsidian + Markdown 文件夹
   - 时间：Karpathy 自述偏好一次摄入一个来源并全程参与；没有时间数字
   - 来源：<https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f> <https://arxiv.org/abs/2602.23335>

## 需求

### 1. 当我拿到一份带引用的研究报告时，我想让每个关键论断都能点回原文里支持它的那一段，以便不用把整份报告重查一遍

- 证据强弱：强
- 谁：A1（写综述、related work 的研究者、博士生）和 A2（写行业深度、技术尽调的分析师）
- 痛在哪：伪造链接已不是主要问题，主要问题是「引用存在但不支持这句话」：把观点安到错误的作者头上、把论文立场说反、列了参考文献正文却没用。外行看不出来，内行要逐条回查。
- 多久一次：每一份报告、每一条引用都会遇到；独立评测里每 5 条带引用的论断约有 1 条以上对不上
- 现在怎么凑合：逐条点开核对；只把报告当线索清单，自己重读原文再重写；要求模型单列 References 方便人工核；换工具（V2EX 用户从 Perplexity 换到 Gemini 或 ChatGPT）
- 缺口：没有一款产品在交付前做「论断—原文段落」的逐条对照并把对不上的标出来；引用准确率随搜索深度增加反而下降
- 证据：
  - 100 个博士级任务（中英各 50）上，四款商用深度研究的引用准确率在 78%–90% 之间；Gemini 有效引用最多（约 111 条）但准确率 81%，Perplexity 准确率最高（90%）但有效引用只有约 31 条——数量与准确度此消彼长（中科大等研究团队，DeepResearch Bench（FACT 指标）；survey-or-study；2025-06） <https://deepresearch-bench.github.io/>
  - 审计 GPT-4.5/5、Perplexity、You.com、Copilot、Gemini 的深度研究配置：引用准确率只有 40%–80%，大量陈述得不到自己所列来源的支持，争议问题上明显一边倒（Salesforce AI Research 研究者，DeepTRACE 审计；survey-or-study；2025-09） <https://arxiv.org/abs/2509.04499>
  - 14 个模型：链接可打开率 94% 以上、主题相关 80% 以上，但论断与所引来源事实一致的只有 39%–77%；工具调用从 2 次增到 150 次，事实准确度平均下降约 42%（企业研究团队（arXiv 论文）；survey-or-study；2026-05） <https://arxiv.org/abs/2605.06635>
  - 学术深度研究工具的引用忠实度最好也就 80% 左右；编造文献基本被事后校验解决了，剩下的是「引用不支持论断」（Aaron Tay，高校图书馆员兼研究者；practitioner；2025-08-11） <https://aarontay.substack.com/p/what-academic-deep-research-is-really>
  - 文章汇总的专家实测中，AI 安全研究者 Dan Hendrycks 反馈它反复把话安错人、歪曲论文作者的立场；另一位子领域专家说约一成内容是外行分辨不出的胡说（Zvi Mowshowitz 汇总的多位专家实测（含 AI 研究者）；practitioner；2025-02-04） <https://thezvi.substack.com/p/were-in-deep-research>
  - 国内用户为学术课题申报试用：Gemini 的深度研究乍看可信，核对后发现有幻觉和不存在的来源；有人改为自己指挥模型去 arXiv、GitHub 搜再总结（V2EX 多位用户（开发者/学生）；practitioner；2026-04-20） <https://www.v2ex.com/t/1207134>
  - 10 个模型/智能体、5.3 万条 URL：3%–13% 的引用链接是凭空生成的，5%–18% 打不开；深度研究智能体引用更多，但幻觉率也更高；接入链接健康检查工具后可降到 1% 以下（宾大等研究者（arXiv 论文）；survey-or-study；2026-04） <https://arxiv.org/abs/2604.03173>

### 2. 当报告里出现市场份额、规模、增速、基准分数这类数字时，我想每个数字都带口径、时间和一手出处，以便直接放进我的表里

- 证据强弱：强
- 谁：A2 为主（行业分析师、投资人、咨询、战略/产品负责人）；A1 在引用基准成绩时同样遇到
- 痛在哪：数字错、口径混（流量 vs 保有量）、年份旧、转述时变形（四分之一写成三分之一）、把二手聚合站当出处；表里只要有一处错，整张表都不敢用
- 多久一次：凡涉及定量结论的报告都会遇到；在测评里连给定公式的简单计算五款产品也都没算对
- 现在怎么凑合：只在定性、文本类问题上用深度研究，定量部分自己回原始财报/数据库重做；逐个数字回查原始出处
- 缺口：没有「每个数字 = 值 + 口径 + 时点 + 一手来源定位」的强制结构；计算过程不给可复核的代码或步骤
- 证据：
  - 用 OpenAI 自己宣传的智能手机案例检验：日本 iOS/安卓份额与底层来源相反，来源是测流量的 Statcounter 和只做转载的 Statista；他的结论是表里有错就整表不可信，只能给本来就懂的人省时间（Benedict Evans，科技行业独立分析师；practitioner；2025-02-18） <https://www.ben-evans.com/benedictevans/2025/2/17/the-deep-research-problem>
  - 六个已知答案的问题全部出错：基准成绩用旧数（17.5% 而非 34.5%）、超额死亡数用过期数据和 Reddit、把预测的出处错归给 Statista、市场规模取了低质量来源的数字（Dan Schwarz，FutureSearch（做预测与研究智能体的公司）创始人；practitioner；2025-02-19） <https://futuresearch.ai/oaidr-feb-2025>
  - 让五款产品按给定公式用特斯拉财报算一个因子：五款都没算对，有的理解错计算对象，有的只算了四分之一，有的回归时多加了截距（海外独角兽（国内 AI 投研机构）研究员；practitioner；2025-04-22） <https://m.huxiu.com/article/4264516.html>
  - 给一家非上市公司做竞品与定位分析：报告把原文的四分之一写成三分之一；多年份来源混用，看不出哪个最新（LinkedIn 用户，自述做竞品分析；practitioner；2025-02） <https://www.linkedin.com/posts/sabinasobhani_just-took-openais-deep-research-for-a-spin-activity-7300887030979317760-K40f>
  - 70 道由行业专家出的管理咨询题：按「评分≥2.5 且核验通过率≥80%」验收，o3 深度研究通过 15.7%，Claude 与 Gemini 各 12.9%；o3 的典型问题是计算错误层层传导（研究团队（arXiv 论文）；survey-or-study；2026-05） <https://arxiv.org/abs/2605.17554>
  - 自称把额度用完的重度用户：定性、文本类研究好用，定量分析不会用它（Hacker News 评论者 infecto；practitioner；2025-02） <https://news.ycombinator.com/item?id=43184305>

### 3. 当我让它替我搜资料时，我想由我来定哪些来源算数（一手、权威、同行评议），以便结论不是建在营销号、SEO 文和二手聚合站上

- 证据强弱：强
- 谁：A1 + A2
- 痛在哪：分不清 SEO 垃圾和正经来源；偏爱容易抓到的博客、Reddit、摘要站；一篇看起来权威的假文档就能把结论带偏；越贵的版本越「自信地错」
- 多久一次：每次开放网络检索都会发生；市场/竞品类题目最严重
- 现在怎么凑合：在提示词里指定来源类型（政府、学术）；改用 Exa、Kagi 等搜索后自己读；看一次结果是博客垃圾就退订
- 缺口：来源白名单/黑名单、来源分级、同一事实优先取一手出处——直到 2026 年 2 月 OpenAI 才加了「限定可信网站」；对被污染或误导性来源仍无防护
- 证据：
  - 为设计客户潜力模型试用，返回的是低质量博客垃圾，当即退掉 200 美元订阅（Hacker News 评论者 aerhardt；practitioner；2025-02） <https://news.ycombinator.com/item?id=43187016>
  - 做市场调研的提问帖下：它总结来源还行，但判断来源优劣很差，分不清 SEO 垃圾与真实产品；建议在提示里限定政府、学术来源（Hacker News 评论者 solardev；practitioner；2025-04） <https://news.ycombinator.com/item?id=43603574>
  - 官方自认：会捏造事实或做错误推断，区分权威信息与谣言的能力不足，置信度校准差；2026-02 更新才加入可把搜索限定在受信任网站（OpenAI 官方发布页（厂商自述）；vendor；2025-02-02（2026-02-10 更新）） <https://openai.com/zh-Hans-CN/index/introducing-deep-research/>
  - 加入一篇带权威包装的误导文档，深度研究采纳错误结论的比例从 0% 升到平均 54.7%；事前事后防御只能降低不能消除（研究团队（arXiv 论文）；survey-or-study；2026-07） <https://arxiv.org/abs/2607.20891>
  - 8 款 AI 搜索、1600 次查询：总体六成以上答错新闻出处；付费版答对更多但错得更自信；Grok 3 的 200 条引用里 154 条指向错误页（哥伦比亚大学 Tow Center 研究者；survey-or-study；2025-03-06） <https://www.cjr.org/tow_center/we-compared-eight-ai-search-engines-theyre-all-bad-at-citing-news.php>
  - 法律诉讼研究实测（由该文汇总）：依赖低质量的 Reddit 和摘要网站，把法条说得过于简单（Zvi Mowshowitz 汇总的专家反馈；practitioner；2025-02-04） <https://thezvi.substack.com/p/were-in-deep-research>

### 4. 当关键资料在付费墙后、在我自己的文献库里、或者根本不在公开网上时，我想让它也能读到，以便报告不是只基于免费网页

- 证据强弱：强
- 谁：A1（付费期刊、会议论文、自己的 Zotero/PDF 库）和 A2（付费数据库、研报、未上市公司信息、访谈纪要）
- 痛在哪：付费论文读不到，让它按标题摘要判断相关性也不照做；领域奠基文献漏掉；未上市的关键玩家整个缺席，读者还以为自己看全了
- 多久一次：每个细分领域的深度项目都会遇到；越小众越严重
- 现在怎么凑合：自己从文献库挑 PDF、转成 Markdown 再喂给模型（半手工）；先用 NotebookLM 装自己的资料；Google Scholar 顺着引用关系人工追
- 缺口：厂商 2025 年就承诺「将来接入订阅和内部资源」，但用用户自己已有的订阅登录态去读全文仍是空白；不在网上的信息只能靠人补
- 证据：
  - 三种做法对比（各跑 3 次）：自己挑 27 篇 PDF 转 Markdown 再喂模型的半手工方案合并后得分最高（9.08），且是唯一拿到付费墙后小众论文的；44 篇参考文献没有任何一种方法全找到；结论是深度研究只能当综述的起点（Xiangyu Yin，阿贡国家实验室计算材料科学家（研究晶体生成模型）；practitioner；2025-02-09） <https://xiangyu-yin.com/content/post_deep_research.html>
  - 行业分析里整个漏掉一家非上市、无品牌的关键供应链公司；他的判断是公开信息越容易拿到，不在网上的信息越值钱（Ben Thompson，Stratechery 创始人、科技战略分析师；practitioner；2025-02-10） <https://stratechery.com/2025/deep-research-and-knowledge-value/>
  - 改写 related work 和做新课题综述两个场景：遇到付费墙时让它按标题摘要判断也不照做；检索范围有限，担心漏关键论文，最后还得回去手工搜（Nam Wook Kim，高校计算机方向研究者；practitioner；2025-02） <https://www.linkedin.com/posts/namwkim_summarized-version-of-the-related-work-by-activity-7300755482137296896-fw9D>
  - 认为报告达到研究生水平，但明确指出读不了付费学术文章，只限于能在线检索到的内容，缺书和专有数据库（Ethan Mollick，沃顿商学院教授；practitioner；2025-02-03） <https://www.oneusefulthing.org/p/the-end-of-search-the-beginning-of>
  - 学术研究实测：只用公开来源、付费研究缺席；漏掉本领域奠基性著作导致分析浅；列了参考文献但正文没用（Educators Technology 作者（教育学研究者）；practitioner；2025-02-27） <https://www.facebook.com/groups/1048019523623103/posts/1165938315164556/>
  - 官方写明当时只能访问开放网络和上传文件，未来才会接入订阅制或内部资源（OpenAI 官方发布页（厂商自述）；vendor；2025-02-02） <https://openai.com/zh-Hans-CN/index/introducing-deep-research/>

### 5. 当我要对一个领域下结论时，我想确认没有漏掉关键论文、关键数据集、关键公司，以便不被同行一眼看出缺口

- 证据强弱：强
- 谁：A1 + A2
- 痛在哪：漏项是「不知道自己不知道」：报告读起来完整，其实少了一半表格、少了本组自己发表的数据、少了已公开的项目；智能体早期搜到的东西会带偏后续检索，读到的只是有偏样本；同一问题每次跑结果不一样
- 多久一次：每个综述/行业图谱类项目都会遇到
- 现在怎么凑合：同一问题跑多次再合并；把它当作「我有没有漏」的反向检查，而不是让它出原始成果；回到 Related Work 和引用网络人工追
- 缺口：没有覆盖度的自我报告（搜了哪里、没搜到哪里、哪些打不开）；没有对照用户已有清单做差集
- 证据：
  - 让它汇总新冠变异株抗体数据并出 CSV：结果很单薄，连他自己组去年论文里几百条测量值都没收进来；他只会用它查漏，不会让它出原始研究成果（Adam Kucharski，伦敦卫生与热带医学院教授；practitioner；2025-03-02） <https://kucharski.substack.com/p/the-shallowness-of-deep-research>
  - 让它列一家公司的全部产品成表：45 个产品只列出 34 个，170 个单元格只对 118 个——靠遗漏造成的错误信息（Dan Schwarz，FutureSearch 创始人；practitioner；2025-02-19） <https://futuresearch.ai/oaidr-feb-2025>
  - 自适应搜索让智能体读到的文档成为有偏样本；即使引用都对，结论也可能偏；作者提出的校正方法在真实轨迹上最多把误差降 60.1%（研究团队（arXiv 论文）；survey-or-study；2026-09） <https://arxiv.org/abs/2609.39026>
  - 100 个人工任务、约 1000 份报告的失败分类（14 种）：深度研究不是败在理解任务，而是败在证据整合、核验和抗干扰的规划（研究团队（arXiv 论文，FINDER/DEFT）；survey-or-study；2025-12） <https://arxiv.org/abs/2512.01948>
  - 反面证据：把整篇论文当查询并沿引用网络扩展的深度研究流程，把文献检索召回从不到 20% 提到 80% 以上；人写的参考文献只有 51% 被评为中等以上相关（Mila 等研究者（arXiv 论文）；survey-or-study；2026-05） <https://arxiv.org/abs/2605.29234>

### 6. 当我有自己的研究框架（分段结构、比较维度、字数、引用格式、读者是谁）时，我想让它严格按框架写并做跨文献归纳、给出判断，以便我改的是观点而不是从头重写

- 证据强弱：强
- 谁：A1（按主题归组的 related work）和 A2（投资简报、选型研究、咨询建议）
- 痛在哪：选择性执行指令、夹带题外话、超字数；逐篇罗列而不是按主题归纳；篇幅很长但信息密度低、没有明确观点；不为专业读者调整；相同问题背后每个人要的东西不同，它猜不到
- 多久一次：每份要交付的报告
- 现在怎么凑合：多轮来回改提示；先让它列提纲、自己定结构再让它填；多模型出稿后互相批评合并、最后人工定稿
- 缺口：没有「项目级模板/框架」可复用；没有按学科惯例写作；判断和原创观点仍要人给
- 证据：
  - 分段、不同字数与引用格式要求的文献综述任务：五款产品没有一款完全照做；以 AI 招聘初创公司为题的研报任务里，Google 得分最低——篇幅长、信息密度低、观点不明、竞品找错；Perplexity 与 xAI 作为投资简报观点不够清晰（海外独角兽（国内 AI 投研机构）研究员；practitioner；2025-04-22） <https://m.huxiu.com/article/4264516.html>
  - 章节标题合理，但倾向于逐篇描述论文，做不到学术写作里那种「一组研究关注 X [1,2,3,4]」式的主题归纳（Nam Wook Kim，高校计算机方向研究者；practitioner；2025-02） <https://www.linkedin.com/posts/namwkim_summarized-version-of-the-related-work-by-activity-7300755482137296896-fw9D>
  - 19 名计算机研究者用 5 周产生 8103 条动作偏好：同一个查询，不同人想要的后续动作不同；难点在判断该执行哪些动作，而用户的完整历史选择最能预测其偏好（Allen Institute for AI 等研究者（arXiv 论文 DRACULA）；survey-or-study；2026-04） <https://arxiv.org/abs/2604.23815>
  - arXiv 计算机类别自 2025-10-31 起要求综述和立场文章先通过同行评审：生成式 AI 让这类稿件每月数百篇，多数缺乏实质分析（arXiv 官方公告；news；2025-10-31） <https://blog.arxiv.org/2025/10/31/attention-authors-updated-practice-for-review-articles-and-position-papers-in-arxiv-cs-category/>
  - 粒子物理学者实测：大框架对、细节有问题，没有图表，提示里写明读者是粒子物理学家也没有按专业读者来写（Hacker News 评论者 elashri，自述粒子物理学者；practitioner；2025-02） <https://news.ycombinator.com/item?id=42920981>
  - 认为它产出的是外行心目中的高质量科研；他见过的 AI 生成博士申请计划书表述空泛、想法不新、参考文献选得差（Adam Kucharski，伦敦卫生与热带医学院教授；practitioner；2025-03-02） <https://kucharski.substack.com/p/the-shallowness-of-deep-research>

### 7. 当我决定是否采用 AI 的报告时，我想让核查它的时间明显少于自己从头做，以便用它真的省时间

- 证据强弱：强
- 谁：A1 + A2，尤其是对交付物署名负责的人
- 痛在哪：综合过的结论比原始检索结果更难核：自己搜的时候顺手就判断了来源，读 AI 报告要倒回去逐条查；付费来源核不了；用两个模型互查又担心它们错得一样；在自己不熟的领域最需要它、也最难核
- 多久一次：每份报告；核查量与报告长度成正比
- 现在怎么凑合：只在「错了无所谓或一眼能看出来」的场景用；把报告降级为线索清单；在熟悉的领域干脆不用
- 缺口：没有把核查工作量压下去的设计：逐句内联出处、原文高亮、已核/未核状态、按风险排序的待核清单
- 证据：
  - 15 位跨学科学者的纵向访谈：把知识获取交给 AI、把原创判断留给自己；AI 输出恰恰在最需要它的非本行领域最难核实（“hardest to verify when most needed”）（明尼苏达大学等 HCI 研究者（arXiv 论文）；survey-or-study；2026-09） <https://arxiv.org/abs/2609.30588>
  - 综合结论的核查负担超过自动化带来的好处；当时没有内联引用，核查比自带来源判断的原始检索更繁琐（Hacker News 评论者 nxobject；practitioner；2025-02） <https://news.ycombinator.com/item?id=43183723>
  - 用 Claude 花 5 小时写带脚注的人物传记，脚注齐全但核查仍是巨大工作量，付费来源尤其难核；用 Gemini 深度研究复核又担心两者犯同样的错（Hacker News 评论者 johngossman；practitioner；2026-03-07） <https://news.ycombinator.com/item?id=47289837>
  - 每篇论文的相关性都要手工复核，结果不够可靠到可以不复查；感觉不全，于是又回去手工搜（Nam Wook Kim，高校计算机方向研究者；practitioner；2025-02） <https://www.linkedin.com/posts/namwkim_summarized-version-of-the-related-work-by-activity-7300755482137296896-fw9D>
  - 在自己熟悉的领域（如技术人之于 arXiv、GitHub）效率提升有限；核查不是看一眼域名就完事，所以仍离不开搜索引擎；被高度浓缩的信息反而限制了做判断的余地（APPSO（科技媒体）作者；news；2025-03-17） <https://m.huxiu.com/article/4130691.html>
  - 反面证据：他认为即使把报告里的来源重新手工验证、重写一遍，也比原来做综述省事；早期工具的假文献要逐一核对，反而拖后腿（王树义，高校教师（教研究方法与数据科学）；practitioner；2025-02-04） <https://wangshuyi.substack.com/p/openai-deep-research>

### 8. 当一个课题要做几周到几个月时，我想让它记得这个项目已经读过什么、定过什么口径、上次结论是什么，新资料来了只更新受影响的部分，以便知识是累积的而不是每次重来

- 证据强弱：中
- 谁：A1（长期跟一个方向）和 A2（持续覆盖一个赛道/一家公司）
- 痛在哪：每次深度研究都是一次性报告：不记得上次，不认用户给的长材料（会绕开它去联网），上下文一长就忘掉关键细节；新论文出来要整份重跑
- 多久一次：持续性课题里每周都遇到
- 现在怎么凑合：自己搭：用编码智能体 + Obsidian 维护一套由模型增量更新的 Markdown wiki；NotebookLM 装资料 → 提纲 → 多模型出稿 → 合并；把报告存成文件反复回看
- 缺口：商用深度研究没有项目记忆和增量更新；2026-02 才加了运行中可打断、可追加来源
- 证据：
  - 指出上传文件式的检索每次提问都从零重新发现知识、没有累积；他的做法是让模型增量维护一套持久的互链 wiki，新来源进来时更新相关页面并标出与旧结论的矛盾；明确列出的用途包括数周数月的课题研究、竞品分析、尽调（该 gist 5000+ 星）（Andrej Karpathy，AI 研究者；practitioner；2026-04） <https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f>
  - 20 万条以上真实查询日志：研究者把 AI 生成的回答当成持久的成果物，会回头重访、非线性地翻看引用；熟练用户更深入查看支持性引用（Allen Institute for AI 研究者（Asta 使用数据集）；survey-or-study；2026-02） <https://arxiv.org/abs/2602.23335>
  - 测评时放弃了记忆维度：即使喂给长文，深度研究也会联网检索绕开用户给定的上下文，无法评估它是否真的用了用户的材料（海外独角兽（国内 AI 投研机构）研究员；practitioner；2025-04-22） <https://m.huxiu.com/article/4264516.html>
  - 自述工作流：NotebookLM 装来源 → 提纲 → Perplexity/ChatGPT 分别出稿 → 互相批评合并 → 人工终稿；费时但结果好（Hacker News 评论者 fallinditch；practitioner；2025-02） <https://news.ycombinator.com/item?id=43185868>
  - 诉讼研究实测（由该文汇总）：上下文窗口小，忘掉了起诉书里的关键细节（Zvi Mowshowitz 汇总的专家反馈；practitioner；2025-02-04） <https://thezvi.substack.com/p/were-in-deep-research>

### 9. 当我要把几十篇论文或一批公司资料整理成一张可比较的表（方法、数据、指标、结论、出处）时，我想让它完整抽取、缺的标缺、不编，以便直接拿来做分析

- 证据强弱：强
- 谁：A1（方法对比表、实验结果汇总）和 A2（产品矩阵、厂商对比、参数表）
- 痛在哪：把各处已发表的数据整理成统一格式本来就是最耗人的环节；AI 抽出来的表缺行、缺列、随机忽略半张表、单元格出错
- 多久一次：每个综述和竞品研究至少一次；持续覆盖时要反复更新
- 现在怎么凑合：人工整理；用 Elicit 这类按列抽取的付费工具；自己给模型喂 PDF 让它按固定列出表
- 缺口：抽取的完整性没有保证（不知道漏了多少）；每个单元格缺少原文定位
- 证据：
  - 他说把已发表的数据源整理成标准格式一直是难点；让深度研究出机器可读 CSV，结果远少于已知存在的数据（Adam Kucharski，伦敦卫生与热带医学院教授；practitioner；2025-03-02） <https://kucharski.substack.com/p/the-shallowness-of-deep-research>
  - 产品清单表只覆盖 45 个中的 34 个，170 个单元格对了 118 个（Dan Schwarz，FutureSearch 创始人；practitioner；2025-02-19） <https://futuresearch.ai/oaidr-feb-2025>
  - 他要的交付物第一部分就是一张七列方法对比表（方法、建模方式、结构表示、数据与训练、评估指标、可解释性、计算效率）（Xiangyu Yin，阿贡国家实验室计算材料科学家；practitioner；2025-02-09） <https://xiangyu-yin.com/content/post_deep_research.html>
  - 厂商定价反映的付费意愿：Pro 每月 49 美元含 20 列表格、最多筛 5000 篇的系统综述流程；Scale 每月 169 美元含 30 列与图表抽取（Elicit 定价页（厂商）；vendor；2026-10 访问） <https://elicit.com/pricing>

### 10. 当我要进入一个不熟的方向（新子领域、相邻学科、一个新赛道）时，我想在一两个小时内拿到一张地图：关键概念、代表工作、主要玩家、分歧点，以便知道该读什么、该问谁

- 证据强弱：强
- 谁：A1 + A2；这是目前专家认可度最高的用法
- 痛在哪：这是它最有用的地方，也是最难核查的地方：专家在本行一眼看出错，在陌生领域看不出那一成胡说
- 多久一次：每个新课题开头一次；跨学科研究者更频繁
- 现在怎么凑合：直接用深度研究做入门和提纲，再自己读原文；准备访谈、会议前用它做背景
- 缺口：入门报告不标注「哪些是共识、哪些是它拿不准的」；没有按用户已有知识调整核查支持
- 证据：
  - 在讲自己研究流程的文章里说，Google/OpenAI 的深度研究对文献综述非常有价值，尤其是不熟悉的领域（Neel Nanda，Google DeepMind 机制可解释性研究负责人；practitioner；2025） <https://www.alignmentforum.org/posts/hjMy4ZxS5ogA9cTYK/how-i-think-about-my-research-process-explore-understand>
  - 19 位各行业读者评自己领域的报告：7 位认为达到专业水平，多数估计人工要 10 小时以上；16 位更偏好 OpenAI 而非 Google 的版本（Timothy B. Lee，Understanding AI 作者（记者）；practitioner；2025-02-24） <https://www.understandingai.org/p/these-experts-were-stunned-by-openai>
  - 学术深度研究真正的用途是定向（快速摸清一个领域的地形），而不是产出可发表的综述（Aaron Tay，高校图书馆员兼研究者；practitioner；2025-08-11） <https://aarontay.substack.com/p/what-academic-deep-research-is-really>
  - 用它为访谈企业 CEO 做准备很省时间，几分钟完成人工要很多小时的公开信息梳理（Ben Thompson，Stratechery 分析师；practitioner；2025-02-10） <https://stratechery.com/2025/deep-research-and-knowledge-value/>
  - 汇总的反馈里有人明确说：在陌生题目上表现好，在自己的专业领域令人失望（Zvi Mowshowitz 汇总的专家反馈；practitioner；2025-02-04） <https://thezvi.substack.com/p/were-in-deep-research>

### 11. 当议题有争议或证据不足时，我想让它把正反两边的证据和自己的把握程度都摆出来，以便我自己做判断而不是被一份自信的长文带着走

- 证据强弱：强
- 谁：A2（技术路线之争、厂商选型、投资判断）和 A1（有分歧的研究结论）
- 痛在哪：一边倒、过度自信；把零散的边缘来源逐条「验证」后拼成比原来更可信的叙事；不表达不确定
- 多久一次：凡涉及判断性结论的题目
- 现在怎么凑合：反过来用：让它专门找「我为什么是错的」；多模型互相批评
- 缺口：没有分级的置信度、没有「反方证据」强制栏、没有标出证据薄弱处
- 证据：
  - 审计发现无论普通还是深度研究配置，在争议性问题上都高度一边倒且自信；深度研究配置只是略降低了过度自信（Salesforce AI Research 研究者，DeepTRACE；survey-or-study；2025-09） <https://arxiv.org/abs/2509.04499>
  - 实测：它找到边缘来源、逐条核实了零散事实，然后综合成一个比原始材料更像真的阴谋论叙事，没有常识去识别框架本身有问题（Hacker News 评论者 furyofantares；practitioner；2025-02） <https://news.ycombinator.com/item?id=43185958>
  - 官方自认置信度校准差，往往不能准确传达不确定性（OpenAI 官方发布页（厂商自述）；vendor；2025-02-02） <https://openai.com/zh-Hans-CN/index/introducing-deep-research/>
  - 他的用法是让它检查自己有没有漏、指出自己哪里可能错，而不是让它给出原创结论（Adam Kucharski，伦敦卫生与热带医学院教授；practitioner；2025-03-02） <https://kucharski.substack.com/p/the-shallowness-of-deep-research>

### 12. 当我用 AI 帮忙写综述或 related work 时，我想保证没有一条假引用、错引用进入投稿，以便不因此被拒稿或损害名誉

- 证据强弱：中
- 谁：A1（投 NeurIPS/ICLR 等会议的研究者、博士生）
- 痛在哪：模型会把真论文拼接成看似合理但不存在的引用（作者、年份、会议对不上）；审稿也没拦住；会议把这类错误列为拒稿/撤稿理由；AI 生成的综述泛滥到 arXiv 收紧政策
- 多久一次：每次投稿；每篇综述
- 现在怎么凑合：人工逐条核对 BibTeX；用带检索的学术工具替代裸模型；用第三方检测工具扫参考文献
- 缺口：写作流程里没有内置「每条引用对到真实记录（DOI/arXiv ID）并核对元数据」的硬校验
- 证据：
  - 扫描 NeurIPS 2025 的 4841 篇录用论文，在 51–53 篇里发现至少 100 条编造的引用（拼接真论文标题、虚构作者、错年份和会议）；此前在 ICLR 2026 在审稿件中发现 50 多条（注意：发布方销售检测工具）（GPTZero（厂商调查）；vendor；2026-01-21） <https://gptzero.me/news/neurips/>
  - 不带检索的 GPT-4o 在科学问答中 78%–90% 的情况下编造引用；带 4500 万篇开放论文检索的系统引用准确度可与人类专家相当，专家在 51%–70% 的情况下更偏好其回答（华盛顿大学、Allen Institute for AI 等研究者（OpenScholar）；survey-or-study；2024-11） <https://arxiv.org/abs/2411.14199>
  - arXiv 计算机类别因 AI 生成的综述/立场文章泛滥而要求先过同行评审（arXiv 官方公告；news；2025-10-31） <https://blog.arxiv.org/2025/10/31/attention-authors-updated-practice-for-review-articles-and-position-papers-in-arxiv-cs-category/>
  - 警告深度研究会让看似可信但错误的内容更快涌入科学文献，因为呈现更像样、错误更难发现（Gary Marcus，认知科学家、AI 评论者；practitioner；2025-02-03） <https://garymarcus.substack.com/p/deep-research-deep-bullshit-and-the>

### 13. 当它在后台跑几十分钟时，我想先看到并能改它的研究计划，中途能纠偏、能加来源，以便不是等到最后才发现方向错了

- 证据强弱：中
- 谁：A1 + A2
- 痛在哪：开头给的信息决定了整条研究轨迹，但用户走开后就不可控；用户认可的是它先问澄清问题、把推理过程摆出来——说明需要的是可见和可控，而不是黑箱一次出稿
- 多久一次：每次长任务
- 现在怎么凑合：先用一轮对话让它帮忙定提纲和关注点，再发正式指令；跑多次取并集
- 缺口：计划可编辑、过程可见、中途可打断并追加来源，直到 2026 年才陆续成为标配；按用户历史偏好自动选动作仍是研究课题
- 证据：
  - 研究显示难点在于判断该执行哪些中间动作（加一节数据集、调整范围、改来源策略），而用户的完整历史选择是最有效的预测依据（Allen Institute for AI 等研究者（DRACULA，19 名 CS 研究者，5 周）；survey-or-study；2026-04） <https://arxiv.org/abs/2604.23815>
  - 用户走开后的自主研究：初始给的用户信息会改变信息获取请求的分布，并在最终建议里表现得更明显；方向性结论在草稿到终稿的大幅改写中保持不变（研究团队（arXiv 论文）；survey-or-study；2026-09） <https://arxiv.org/abs/2609.33509>
  - 2026-02-10 更新：可接入任意 MCP/应用、限定可信网站、实时查看进度、随时打断并追加提示或来源——厂商认定的需求（OpenAI 官方发布页（厂商）；vendor；2026-02-10 更新） <https://openai.com/zh-Hans-CN/index/introducing-deep-research/>
  - 认可的两点正是它会先追问澄清、以及能看到它的推理过程（跑偏了至少知道怎么偏的）（LinkedIn 用户，自述做竞品分析；practitioner；2025-02） <https://www.linkedin.com/posts/sabinasobhani_just-took-openais-deep-research-for-a-spin-activity-7300887030979317760-K40f>
  - 他先问模型「做这个综述该关注什么」得到结构，再据此写正式指令，并把同一指令各跑 3 次再合并（Xiangyu Yin，阿贡国家实验室计算材料科学家；practitioner；2025-02-09） <https://xiangyu-yin.com/content/post_deep_research.html>

### 14. 当证据在中文或其他非英文资料里时，我想让它同样找得到、读得对、引得准，以便中文语境的研究不比英文差一截

- 证据强弱：弱
- 谁：国内的 A1/A2（中文论文、中文行业资料、古籍/政策原文）
- 痛在哪：证据是非英文时，检索召回、校准和引用忠实度都下降，即使把正确证据直接给它也恢复不到基线；有用户遇到编造中文古文原文和数据
- 多久一次：国内用户几乎每个项目
- 现在怎么凑合：换工具试（Gemini、Grok）；自己搜中文资料再喂给模型
- 缺口：中文封闭平台（公众号、知乎、研报库）的覆盖没有找到专家的一手评价，只有间接证据——这条需要访谈确认
- 证据：
  - 12 种语言的跨语言评测：证据是非英文时检索召回、校准和引用可靠性明显下降，直接提供全部正确证据也恢复不到基线（研究团队（arXiv 论文，跨语言 BrowseComp-Plus）；survey-or-study；2026-06） <https://arxiv.org/abs/2606.15345>
  - 用户反馈 Perplexity 的深度研究幻觉严重，会编造中文古文原文和数据，求同价位幻觉更低的替代品（V2EX 用户；practitioner；2025-05-01） <https://www.v2ex.com/t/1129266>

## 工具与花费

| 工具 | 用来做什么 | 价格 | 谁付钱 | 抱怨 | 来源 |
|---|---|---|---|---|---|
| ChatGPT Deep Research（OpenAI） | 陌生领域入门、综述初稿、竞品与行业报告、访谈准备；多数横评里综合最好 | 未核实现价。打开过的页面上的说法：2025-02 上线时 Pro 用户每月最多 100 次（OpenAI 官方页）；2025-02 底 Plus 用户每月 10 次（Kucharski 文中所述）；有用户提到 200 美元订阅和 20 美元订阅含此功能 | 个人订阅为主（来源中都是个人自述）；有人愿意买多个账号，也有人一次不满意就退订 | 数字和口径错、来源质量差（博客、Reddit、聚合站）、读不了付费墙、表格漏项、把话安错作者、不按字数和结构要求写、置信度校准差（官方自认） | <https://openai.com/zh-Hans-CN/index/introducing-deep-research/> |
| Gemini Deep Research（Google） | 同上；更擅长找到最新论文（Yin），有效引用数量最多（DeepResearch Bench） | 未核实 | 个人订阅（来源自述） | 篇幅长、信息密度低、观点不明（海外独角兽）；核对后有幻觉和不存在的来源（V2EX）；单次运行不完整，合并多次才好（Yin） | <https://deepresearch-bench.github.io/> |
| Perplexity Deep Research | 快速带引用的检索与报告 | 未核实（发布页 403） | 个人订阅 | 幻觉严重、编造中文古文和数据（V2EX）；参考链接经常不对（Kim）；引用准确率在 DeepResearch Bench 最高（90%）但有效引用少；新闻出处测试错 37%（Tow Center） | <https://www.v2ex.com/t/1129266> |
| Manus、xAI DeepSearch | 海外独角兽横评的对象：Manus 工具调用和图表强，xAI 短平快 | 未核实 |  | Manus 指令遵循有空白、信息准确性和论证不足；xAI 多目标规划弱 | <https://m.huxiu.com/article/4264516.html> |
| Elicit | 学术文献检索、按列抽取成表、系统综述筛选 | 免费版；Pro 49 美元/月（年付 588 美元）；Scale 169 美元/月（年付 2028 美元）；企业版另议 | 未找到来源 | 未找到专家对 Elicit 的一手抱怨；Aaron Tay 指出学术工具普遍只覆盖元数据商能拿到的期刊内容，专著和灰色文献不足 | <https://elicit.com/pricing> |
| 自建：自己的 PDF 库 + 模型（NotebookLM、Marker-PDF 转 Markdown 后喂给 Gemini 等） | 绕开付费墙和抓取限制，用自己挑的材料做综述 | 来源未给出 | 个人 | 全靠人挑材料和转换；上下文窗口限制 | <https://xiangyu-yin.com/content/post_deep_research.html> |
| 自建：LLM Wiki（Claude Code/Codex 类智能体 + Obsidian + Markdown 文件夹） | 数周数月课题的持久知识库：摄入来源、更新页面、标矛盾、带引用回答 | 来源未给出（依赖已有的编码智能体订阅） | 个人 | 要自己搭和维护规则文件；Karpathy 自述偏好逐个来源摄入并全程参与 | <https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f> |
| Google Scholar + 人工追引用关系 | 从 Related Work 和引用网络里找全相关论文——专家认为比深度研究更准更全 | 免费 |  | 耗时 | <https://www.linkedin.com/posts/namwkim_summarized-version-of-the-related-work-by-activity-7300755482137296896-fw9D> |
| Exa、Kagi（搜索 + 自己读或摘要） | 市场调研时替代深度研究，避免信任综合过的叙事 | 未核实 |  | 未找到 | <https://news.ycombinator.com/item?id=43603574> |
| GPTZero 引用检查 | 扫描论文参考文献里的编造引用 | 未核实 | 页面称在与 ICLR 协调稿件筛查 | 厂商自己的调查，需独立验证 | <https://gptzero.me/news/neurips/> |

## 数字

- 四款商用深度研究的引用准确率：Gemini 81.44%、OpenAI 77.96%、Perplexity 90.24%、Grok 83.59%；有效引用数分别约 111、41、31、8；基准为 100 个博士级任务、22 个领域、中英各 50（survey-or-study） <https://deepresearch-bench.github.io/>
- 深度研究智能体的引用准确率在 40%–80% 之间（survey-or-study） <https://arxiv.org/abs/2509.04499>
- 14 个模型：链接有效率 94% 以上、相关性 80% 以上，事实一致率只有 39%–77%；工具调用从 2 增到 150 次，事实准确度平均降约 42%（survey-or-study） <https://arxiv.org/abs/2605.06635>
- 3%–13% 的引用 URL 是凭空生成的，5%–18% 打不开；接入链接健康检查后可降到 1% 以下（survey-or-study） <https://arxiv.org/abs/2604.03173>
- 8 款 AI 搜索、1600 次查询，总体六成以上答错；Perplexity 错 37%，Grok 3 错 94%，Grok 3 的 200 条引用中 154 条指向错误页（survey-or-study） <https://www.cjr.org/tow_center/we-compared-eight-ai-search-engines-theyre-all-bad-at-citing-news.php>
- 70 道专家出的咨询题，严格验收通过率：o3 深度研究 15.7%，Claude Opus 4.6 与 Gemini 3.1 Pro 深度研究各 12.9%（survey-or-study） <https://arxiv.org/abs/2605.17554>
- 一篇误导文档使深度研究采纳错误结论的比例从 0% 升到平均 54.7%（survey-or-study） <https://arxiv.org/abs/2607.20891>
- 产品清单表：45 个产品只列出 34 个，170 个单元格对 118 个（practitioner） <https://futuresearch.ai/oaidr-feb-2025>
- 19 位专家评估：7 位认为达到专业水平，多数估计人工需 10 小时以上，16 位偏好 OpenAI 而非 Google（practitioner） <https://www.understandingai.org/p/these-experts-were-stunned-by-openai>
- 半手工方案（27 篇自选 PDF）合并后得分 9.08，高于 OpenAI 合并 8.92 和 Gemini 合并 8.50；44 篇参考文献没有任何方法全部找到（评分由两个模型担任评审）（practitioner） <https://xiangyu-yin.com/content/post_deep_research.html>
- Wiley 2025 调查（2400+ 研究者）：AI 使用率 57%→84%；用于研究与发表任务 45%→62%；对不准确和幻觉的担忧 51%→64%；80% 用通用工具、25% 用专门的 AI 研究助手、平均仅 11% 听说过专门工具；70% 用免费工具（survey-or-study） <https://newsroom.wiley.com/press-releases/press-release-details/2025/AI-Adoption-Jumps-to-84-Among-Researchers-as-Expectations-Undergo-Significant-Reality-Check/default.aspx>
- NeurIPS 2025 的 4841 篇录用论文中，51–53 篇含至少 100 条编造引用（厂商调查）（vendor） <https://gptzero.me/news/neurips/>
- 不带检索的 GPT-4o 有 78%–90% 的情况编造引用；专家在 51%（8B 模型）到 70%（结合 GPT-4o）的情况下更偏好带检索系统的回答（survey-or-study） <https://arxiv.org/abs/2411.14199>
- 深度研究流程把文献检索召回从不到 20% 提到 80% 以上；人写的引用只有 51% 被评为中等以上相关（survey-or-study） <https://arxiv.org/abs/2605.29234>
- 19 名计算机研究者 5 周产生 8103 条动作偏好和 5230 条执行判断（survey-or-study） <https://arxiv.org/abs/2604.23815>
- 学术 AI 研究工具的真实使用日志超过 20 万条查询（survey-or-study） <https://arxiv.org/abs/2602.23335>
- OpenAI 深度研究一次运行 5–30 分钟；上线时 Pro 用户每月最多 100 次（vendor） <https://openai.com/zh-Hans-CN/index/introducing-deep-research/>
- Elicit：Pro 49 美元/月，Scale 169 美元/月（vendor） <https://elicit.com/pricing>

## 可以交给 AI 的、只能协助的、不会交出去的

可以整件交给一位常驻 AI 同事的（规则明确、可机器核验、重复发生）：
1. 项目资料库的摄入与增量维护：新论文/新公告进来后读、写摘要页、更新相关条目、标出与旧结论的矛盾。Karpathy 已经这么做，Asta 日志也显示研究者把回答当持久成果反复回看。理由：这是没人愿意做的簿记工作，错了影响小、可回看。
2. 引用硬校验：每条引用是否真实存在（DOI/arXiv ID/链接可达）、元数据是否对得上、所引段落是否真的支持这句话，把对不上的列成待核清单。理由：可机械核对（接入链接检查后不可达引用可降到 1% 以下，arXiv 2604.03173），而这正是专家最耗时、最怕出事的环节。
3. 用用户自己已登录的订阅去取全文、读自己的 PDF 库。理由：付费墙是被提到最多的硬缺口，最好的结果来自「人挑的材料 + 模型综合」（Yin）；这是访问权问题而非判断问题，本产品的本机浏览器正好对上。
4. 多轮检索合并与查漏：同一问题跑多次取并集、沿引用网络扩展、对照用户已有清单做差集并报告搜了哪里/哪里打不开。理由：单次运行有漏且不稳定，但召回可以靠流程堆上去（arXiv 2605.29234 从不到 20% 到 80% 以上）。
5. 陌生领域的入门地图和提纲初稿。理由：专家公认最有用（Neel Nanda、Aaron Tay、Understanding AI 的 19 人评估）。

只能协助、必须人把关的：
1. 批量抽取成表：AI 出初表并给每格原文定位、缺的标缺，人抽查。理由：完整性没保证（34/45、118/170），而表里一处错整表不可信（Evans）。
2. 数字与口径：AI 给候选值 + 一手出处 + 口径说明，人定用哪个。理由：口径选择是判断（流量 vs 保有量），且计算错误会层层传导（咨询基准）。
3. 竞品/产业链名单：AI 提候选，人补不在网上的玩家。理由：未上市、无品牌的关键公司它看不见（Thompson）。
4. 按主题归纳和报告成稿：人定框架和论点，AI 按框架填、按学科惯例改写。理由：它倾向逐篇罗列、选择性执行指令（海外独角兽、Kim）。
5. 正反证据整理与「我哪里可能错」的反向检查。理由：它默认一边倒且自信，但被要求挑错时有用（Kucharski）。

不会交出去的：
1. 核心判断与原创观点（投资结论、技术路线判断、研究的 novelty）。理由：15 人访谈研究显示研究者主动保留知识所有权；专家认为它产出的是外行眼里的好研究（Kucharski）。
2. 一手信息获取：专家访谈、渠道核实、未公开信息。理由：关系和访问权，且这部分信息价值在上升（Thompson）。——这一条的直接证据只有 Thompson 一处，需要访谈确认。
3. 最终署名交付物里数字和引用的最后把关。理由：名誉和责任（会议把假引用列为拒稿/撤稿理由；一次看到垃圾结果就退订的信任脆弱性）。
4. 在保密约束下的工作内容上传到云端模型。理由：HN 有人指出公司保密要求使这类流程在工作中不可用——本机运行可以回应，但需访谈确认这是否是真实阻碍。

专家在依赖 AI 做正式交付物之前要求的能力（从上述证据归纳）：
(1) 每个论断能定位到原文段落，且交付前已逐条自检并标出未通过的；(2) 每个数字带口径、时点、一手出处；(3) 来源可由用户限定和分级，默认一手优先；(4) 能读付费墙后和用户自己的资料；(5) 报告覆盖度自述：搜了什么、没搜到什么、哪些打不开；(6) 严格按用户的框架、字数、引用格式和读者层次写；(7) 表格抽取完整且缺失显式标注；(8) 表达不确定性并给出反方证据；(9) 计划可改、过程可见、中途可纠偏；(10) 项目记忆与增量更新，不必每次重来；(11) 同一问题多次运行结果稳定或自动合并；(12) 对误导性/被污染来源有防护。

## 出乎意料的发现

1. 「编造不存在的引用」已经不是主要矛盾。2026 年的评测里链接可打开率在 94% 以上，真正的问题是引用存在但不支持那句话（事实一致率 39%–77%，或 40%–80%，最好约 80%）。做「引用存在性检查」不够，要做「论断—原文」对照。
2. 搜得越深不等于越准。工具调用从 2 次增到 150 次，事实准确度平均下降约 42%（arXiv 2605.06635）；引用数量最多的产品准确率不是最高（DeepResearch Bench）。「跑几小时」本身不是卖点，甚至是风险。
3. 最好的结果来自「人挑材料 + 模型综合」，不是全自动上网搜（Yin 的半手工方案得分最高，且唯一拿到付费墙后的论文）。更多自主不等于更好；访问用户自己的资料比更强的搜索更值钱。
4. 专家在自己的领域最失望、在陌生领域最满意——而陌生领域恰恰最难核查（15 人访谈研究的「专长悖论」）。最受欢迎的用法（快速入门）同时是风险最高的用法。
5. 更贵的版本更「自信地错」（Tow Center：付费版答对更多，但错误时更少拒答）；一位用户看到一次博客垃圾结果就退掉了 200 美元订阅——信任一次就丢。
6. 用得越多，期望越低。Wiley 2025 调查（2400+ 研究者）：使用率从 57% 升到 84%，但认为 AI 已优于人的用例从过半降到不足三分之一，对幻觉的担忧从 51% 升到 64%。
7. 研究者主要用通用工具而不是专门的学术工具：80% 用 ChatGPT 这类，只有 25% 用 AI 研究助手，平均只有 11% 听说过被调查的专门工具，70% 在用免费工具（Wiley）。专门工具的认知度是瓶颈，付费意愿不能想当然。
8. 人写的参考文献也不是金标准：只有 51% 被评为中等以上相关，人引用合作者的概率是最好 AI 重排器的 2.5 倍（arXiv 2605.29234）。在「查全」这一项上 AI 流程可以超过人。
9. 到 2026 年，前沿模型在专家出的咨询交付物上按严格标准的验收通过率仍只有 13%–16%（arXiv 2605.17554）。模型升级没有自动解决这些问题。
10. 关于我们原来的「每日简报」假设：这次打开的所有专家证据里，没有一条痛点是「信息来得不够快或不够多」。痛点全部落在可信（引用、数字、来源）、可及（付费墙、私有资料）、框架与判断、以及累积（项目记忆、增量更新）上。与「定期推送」最接近的真实行为是 Karpathy 式的「新来源进来就更新项目知识库」——定时例行的价值在于维护一个持续变厚的项目资料库，而不是每天给一份读完即弃的简报。另一个反直觉点：APPSO 的作者认为被高度浓缩的信息反而限制了做判断的余地——专家要的是能回到原文的入口，不是更短的摘要。

## 没查到的

没能打开或没能搜索的（未绕过任何登录或验证）：
- WebSearch 本会话额度已用完；DuckDuckGo、百度、搜狗返回验证码，Brave 限流。改用内置浏览器里的 Google 搜索做发现，再逐页打开。
- Reddit（r/MachineLearning、r/ChatGPTPro、r/venturecapital、r/Bard、r/consulting 的相关帖）：抓取工具和内置浏览器都被拦，一条都没读到。搜索结果里能看到标题（例如 r/venturecapital 的「AI 做竞品分析好不好用」、r/Bard 的吐槽帖），但内容未读，未作为证据。
- 知乎：跳到安全验证/登录页，未读。知乎专栏里有多篇深度研究实测，标题可见但内容未读。
- 即刻、小红书、脉脉、微信公众号：没有不登录的检索途径；只读到被虎嗅转载的两篇公众号文章（海外独角兽、APPSO）。
- Nature 关于科学家试用深度研究的报道：跳转登录，未读。The Economist 关于依赖深度研究之危险的文章：未打开。
- OpenAI 帮助中心的深度研究 FAQ（各档额度、是否支持续写）：Cloudflare 验证，未读。Perplexity 发布博客、FutureSearch 关于「更高投入反而降低准确率」的文章：403。Kimi 帮助页：页面不存在。因此 ChatGPT/Gemini/Perplexity/Kimi/秘塔/豆包/Manus 的现行价格和额度没有核实，toolsAndSpend 里只写了打开过的页面上的数字。
- Hacker News 评论是通过 HN 的 Algolia API 读的，给出的是对应的 HN 永久链接；评论者的身份是自述或未知，没有核实。
- arXiv 多数只读了摘要页，没有读全文；数字以摘要为准。

证据本身的局限：
- 从业者的详细实测集中在 2025 年 2–4 月（第一代产品）。2026 年的证据主要来自评测论文和一个 V2EX 帖子；专家对 2026 年产品的一手长文评价没有找到。
- 国内 A2（做 AI 行业研究的分析师、做技术尽调的投资人、咨询顾问）自述工作流的材料只找到海外独角兽一篇；国内 A1（AI 研究者、博士生）只有 V2EX 的简短反馈和王树义的文章。秘塔、Kimi、豆包、Manus 在专家使用中的失败案例没有找到（只有面向大众的测评）。
- 「中文资料覆盖差」只有一篇跨语言评测和一条用户反馈，属于弱证据。
- 「不能在上次基础上继续 / 没有项目记忆」的证据主要是行为证据（Karpathy 的做法、Asta 日志）和一处测评说明，直接抱怨深度研究产品不能续做的专家原话没有找到。
- 付费行为证据很少：只有一次退订、一位愿意买多个账号的重度用户、Elicit 的定价、Wiley 的「70% 用免费工具」。谁付钱（个人、课题组、公司）没有来源。
- 没有找到任何给出「核查占总时间多少」的数字。

只有访谈能回答的问题：
1. 一个真实项目里各阶段各花多少时间？核查到底占多少？
2. 他们今天用什么保存项目记忆（Zotero、Obsidian、Notion、飞书、共享盘）？愿不愿意让 AI 接管维护？
3. 愿不愿意让 AI 用自己已登录的付费账号（知网、Wind、机构订阅、付费研报库）去读？单位允许吗？
4. 「我的研究框架」具体长什么样——团队有固定模板吗？交付物是什么格式（PPT、Word、飞书文档、论文 LaTeX）？
5. 引用和数字准确到什么程度才敢不逐条核？有没有「错一次就不再用」的经历？
6. 增量更新的真实频率：一个赛道/一个方向多久需要更新一次结论，由什么触发？
7. 保密约束：哪些材料绝不能上云？本机运行是否真的改变他们的决定？
8. 现在为 AI 研究工具花多少钱、谁出、报销吗？
9. 国内用户实际用哪些产品做深度研究，中文信源（公众号、知乎、研报）各自怎么拿？
10. A2 里的投资人做技术尽调时，哪部分信息来自访谈和渠道，AI 能碰到的公开部分占多大比重？
