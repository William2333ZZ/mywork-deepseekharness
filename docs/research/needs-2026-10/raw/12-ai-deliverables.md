# AI 6：交付物与质量标准

原始调研记录（2026-10-05）。未经逐条复核，复核结果见上一级目录的 `audit.md`。数字和说法以各条所附网址的原文为准。

## 人群

- **A1 做 AI 研究的人**：博士生、研究员、research engineer、应用科学家
  - 深度研究工作：读文献并写 related work 和综述；复现基线；跑实验并写带误差条的结果；写论文和技术报告；过清单和同行评审。产出：论文、综述、复现报告、benchmark、技术报告、开源代码。
  - 规模：无直接人数来源。侧面量级：NeurIPS 2025 主会录用 4,841 篇（TechCrunch，2026-01-21）；arXiv CS 每月收到数百篇综述（arXiv 博客，2025-10-31）；一项调查覆盖 816 位论文作者，81% 已用 LLM（arXiv 2411.05025）。
- **A2-1 卖方和产业研究员（AI、TMT、计算机方向）**：券商研究所分析师、研究助理、产业研究员
  - 深度研究工作：行业深度和公司深度：整理招股书和年报、建 Excel 底稿、做市场空间测算、调研、过质控和合规、路演讲解；另有月度和周度例行报告。产出：研报、底稿、调研纪要、盈利预测模型。
  - 规模：全行业注册分析师约 5,891 人（2026 年三季度末，财联社引中证协与 Choice 数据）；这是所有行业合计，AI 方向人数无来源。
- **A2-2 一级市场投资人和技术尽调顾问**：VC、PE、产业资本的投资经理和合伙人；外部技术尽调顾问
  - 深度研究工作：赛道研究、公司拆解、专家和参考电话、验证对方的技术宣称、写一到两页或更长的投资备忘、投后复盘。产出：投资备忘、技术尽调报告、赛道地图。
  - 规模：未找到人数来源。花钱信号：专家电话每小时约 525–1,050 美元，专家网络年度合同中位数 3 万至 7.9 万美元（第三方汇编，2026-10-01）。
- **A2-3 研究机构、独立研究平台和研究型 newsletter 作者**：State of AI、AI Index 这类年度报告团队；海外独角兽、Contrary Research 这类研究平台；个人长文作者
  - 深度研究工作：全年收集、几个月成稿、外部评审、发布后维护和预测打分；公司研究长文持续更新。产出：年度报告、公司研究、长文、newsletter。
  - 规模：团队很小：State of AI 2025 为 4 人加 15 位以上评审；海外独角兽三年近 200 篇、150 多家公司。读者量级：Ahead of AI 自称 20 万以上读者，Latent Space 自称 20 万以上订阅。
- **A2-4 企业内做技术选型和评测的人**：架构师、AI 平台负责人、评测团队、技术型产品负责人、给甲方出方案的顾问
  - 深度研究工作：在自己的数据和负载上实测候选模型、向量库、推理引擎；攒评测集；写含备选方案的设计文档或选型报告；大版本更新后重评。产出：选型报告、设计文档、评测集和评测报告。
  - 规模：未找到人数来源。
- **A2-5 做竞品深度拆解的产品人**：产品经理、产品负责人、战略分析
  - 深度研究工作：亲手体验竞品、截图和流程拆解、汇总公开数据、给出可执行结论并维护。产出：竞品分析报告。
  - 规模：未找到人数来源。一位产品经理自述传统做法每份 3–5 天。

## 工作流

1. **1. 定题：界定要回答的问题和读者**：先确定这份东西要回答哪个具体问题、给谁看。卖方首席的说法是找出困扰市场定价的那几个关键问题；ML 论文是确定一到三个具体论断；综述是确定一个新的分析视角；设计文档是写清目标和非目标。
   - 产出：一句话论点或待解疑问、1–3 个核心论断、目标读者、非目标
   - 工具：与同事、客户、导师的讨论；一页纸画布
   - 时间：来源未给数字。多位作者强调这一步决定成败：没有分析框架的综述会被 JAIR 直接拒，没有论断的论文是一堆互不相干的发现。
   - 来源：<https://www.huxiu.com/article/633808.html> <https://www.alignmentforum.org/posts/eJGptPbbFPZGLpjsp/highly-opinionated-advice-on-how-to-write-ml-papers> <https://www.jair.org/index.php/jair/about/submissions> <https://www.industrialempathy.com/posts/design-docs-at-google/>
2. **2. 持续收集（贯穿全年）**：每天读邮件、社交媒体、圈内交流里冒出来的材料，把链接和要点留下，按月打包；研究者用 Google Scholar 加递归引用搜索扩展文献面；卖方从招股书、年报、友商报告建立感性认识。
   - 产出：链接与要点台账、月度 newsletter、候选文献清单
   - 工具：邮箱、X、Google Scholar、研报终端、Elicit 或 Undermind 一类检索工具
   - 时间：State of AI 作者称这是每天的功课，按月打包。来源未给小时数。
   - 来源：<https://www.zeta-alpha.com/post/nathan-benaich-the-ai-report-the-future-of-large-lms-and-investing> <https://lilianweng.github.io/faq/> <https://www.huxiu.com/article/633808.html>
3. **3. 搭框架和提纲**：年度报告在六七月开一份草图文档，把各板块的大事放进去；卖方按金字塔原理列提纲；综述确定分类体系；选型报告确定评估维度和备选方案。
   - 产出：提纲、分类体系、章节草图、评估维度表
   - 工具：Google 文档、Overleaf、思维导图
   - 时间：State of AI 从六七月起草到十月发布，约三到四个月。
   - 来源：<https://www.zeta-alpha.com/post/nathan-benaich-the-ai-report-the-future-of-large-lms-and-investing> <https://www.huxiu.com/article/633808.html> <https://korbonits.com/blog/2026-04-30-planning-an-ml-survey-paper/>
4. **4. 建底稿和一手取证（最重的一步）**：在写文字之前先把数据、图表和测算做完：市场规模自上而下和自下而上各算一遍；做问卷（495 位决策者、100 位 CIO、1,200 位从业者）；打专家电话和参考电话；跑实验、复现基线、在自己负载上实测候选方案、亲手走查竞品。
   - 产出：Excel 底稿、图表、实验日志和对齐记录、访谈纪要、问卷数据、截图
   - 工具：Excel、研报终端、专家网络、独立调研公司、GPU 和云算力、评测脚本、浏览器
   - 时间：时间主要耗在这里。复现一篇深度强化学习论文预估 3 个月实际 8 个月，调试约为实现的四倍，算力约 850 美元。美团一个业务的评测指标一年里从 20 多个扩到近 200 个。专家电话每小时约 525–1,050 美元。竞品分析传统做法一份 3–5 天。顶会论文从想法到投稿 Reddit 讨论的二手转述为 3–6 个月（原帖未能打开）。
   - 来源：<https://www.huxiu.com/article/633808.html> <http://amid.fish/reproducing-deep-rl> <https://tech.meituan.com/2026/08/07/Agent-Evaluation.html> <https://marketintelligencetools.com/reports/expert-network-cost/> <https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/> <https://a16z.com/ai-enterprise-2025/> <https://www.woshipm.com/ai/6225056.html>
5. **5. 写作和删减**：把已经做好的积木用文字连起来；然后大幅删。State of AI 每年砍 30%–50% 的页，目标约 100 页；NextView 的备忘限制在两页以内；卖方首席要求减少科普、标题直接说观点；论文作者把摘要、引言和图当作重点打磨。
   - 产出：初稿、图表定稿、摘要
   - 工具：Overleaf、Google 幻灯片、Word 和 PPT；LLM 用于出草稿和改语法
   - 时间：Nanda 建议截稿前留约一个月做提炼和写作。Distill 早期部分文章编辑投入 50 多小时帮改图文。
   - 来源：<https://www.zeta-alpha.com/post/nathan-benaich-the-ai-report-the-future-of-large-lms-and-investing> <https://nextview.vc/blog/the-investment-memo/> <https://www.alignmentforum.org/posts/eJGptPbbFPZGLpjsp/highly-opinionated-advice-on-how-to-write-ml-papers> <https://distill.pub/2021/distill-hiatus/>
6. **6. 红队、评审、质控与合规**：先自己打自己的结论，再交给别人：年度报告请十多位外部评审找遗漏和错误；期刊至少三位审稿人；券商报告过专职质量审核和合规审查，审核意见要有回应；投资备忘在内评前 24 小时提交；设计文档过评审会。
   - 产出：审稿意见与回复、质控和合规清单、修改稿
   - 工具：OpenReview、内部质控系统、评论批注
   - 时间：JAIR 常规审稿约 8–12 周；TMLR 在三份审稿意见公开至少两周后才能给最终建议。
   - 来源：<https://nathanbenaich.substack.com/p/the-state-of-ai-report-2025> <https://jmlr.org/tmlr/editorial-policies.html> <https://www.sac.net.cn/zlgl/zlgz/202512/t20251231_69839.html> <https://tianpan.co/zh/notes/274-10-investment-memo-template> <https://www.jair.org/index.php/jair/about/submissions>
7. **7. 发布和讲解**：报告通过统一平台发布后要去讲：卖方路演和客户解读，要求同一份报告能在 3、15、30、60 分钟内讲完；年度报告配发布文和播客；论文配代码归档和 README。
   - 产出：正式报告、讲解版本、公开代码和数据
   - 工具：发布平台、newsletter、播客、GitHub、Software Heritage
   - 时间：来源未给数字。
   - 来源：<https://www.jiemian.com/article/7907133.html> <https://reproml.org/challenge_resources/> <https://www.sac.net.cn/zlgl/zlgz/202512/t20251231_69839.html>
8. **8. 维护和回看**：发布不是终点：综述持续出新版本；博文加更新说明；公司研究标注最后更新日；技术雷达每半年重评；年度报告给上一年预测打分；投资备忘在投后 100 天和若干年后回看。
   - 产出：新版本、变更说明、预测评分表、复盘记录
   - 工具：arXiv 版本、博客更新条、内部复盘会
   - 时间：A Survey of Large Language Models 三年 19 个版本。State of AI 2025 对上一年预测自评 10 中 5。
   - 来源：<https://arxiv.org/abs/2303.18223> <https://lilianweng.github.io/faq/> <https://www.thoughtworks.com/radar/faq> <https://nathanbenaich.substack.com/p/the-state-of-ai-report-2025> <https://nextview.vc/blog/the-investment-memo/>

## 需求

### 1. 当我要写一篇综述或文献综述时，我想先得到一个能重新组织这个领域的分类框架和有取舍的判断，而不是一份按论文排列的摘要清单，以便它能过审、被同行当作入门梯子。

- 证据强弱：强
- 谁：A1：博士生、研究员、research engineer；A2：写技术趋势研究的分析师和咨询顾问
- 痛在哪：只做摘要的综述已经不值钱。arXiv CS 每月收到数百篇综述，官方评价多数只是带注释的文献目录，2025-10-31 起未经同行评审的综述和立场论文不再接收。JAIR 写明只总结文献、没有新分析视角的综述大概率被拒。真正难的是判断哪些工作已过时、哪些结果重要、怎么分类，这需要在领域里泡过。
- 多久一次：博士阶段 1–2 次；每进入一个新方向一次；行业分析师每开一个新赛道一次
- 现在怎么凑合：Google Scholar 加递归追引用；从近期论文的参考文献反推领域边界；Overleaf 写作；用 LLM 起草大纲。
- 缺口：现有 AI 能堆出篇幅，但给不出经得起专家检验的取舍，非专家也看不出其中的幻觉。缺的是成稿之前的东西：全量候选文献底表（每篇标注方法、数据、结论、是否被后续工作推翻），以及几个候选分类方案供人挑。
- 证据：
  - arXiv CS 不再接收未经同行评审的综述和立场论文；理由是每月数百篇、LLM 让这类稿子又快又容易写、多数缺少对开放问题的实质讨论。（arXiv 官方博客（预印本平台运营方）；news；2025-10-31） <https://blog.arxiv.org/2025/10/31/attention-authors-updated-practice-for-review-articles-and-position-papers-in-arxiv-cs-category/>
  - 自述学术界人士：好的综述是进入新领域的快速梯子，给出该读的论文、重要结果和推理直觉，相当于压缩了在领域里工作数年的积累。另一位评论者指出不经专家仔细审查无法用 AI 迭代出可用综述。（HN 用户 trostaft（自述 academic）、JumpCrisscross、bee_rider；practitioner；2025-11-01） <https://news.ycombinator.com/item?id=45782136>
  - JAIR 投稿说明：只总结既有文献、不提供新见解或概念贡献的综述被拒概率高；常规审稿周期约 8–12 周。（JAIR 期刊投稿指南；industry-report；） <https://www.jair.org/index.php/jair/about/submissions>
  - TMLR 设综述认证，只授予特别全面或有洞见的综述；每篇至少三位审稿人，接收标准是论断是否有准确、可信的证据支撑。（TMLR 编辑政策；industry-report；） <https://jmlr.org/tmlr/editorial-policies.html>
  - 一位科技公司工程师复盘自己没写成的 ML 综述：认识到必须先有分析框架而不是罗列，最后因本职工作挤占时间而放弃。（软件工程师（个人博客）；practitioner；2026-04-30） <https://korbonits.com/blog/2026-04-30-planning-an-ml-survey-paper/>
  - 中文科技媒体报道同一新规，称 AI 让不读文献也能拼出数千字综述，看上去都还行的低质综述批量涌入。（夕小瑶科技说（科技自媒体）；news；2025-11-03） <https://news.qq.com/rain/a/20251103A03C1K00>

### 2. 当领域每个月都在变时，我想让已经发出去的综述、对比表、公司研究保持最新，并让读者看得到改了什么。

- 证据强弱：强
- 谁：综述作者团队、长文博主、做公司研究和行业报告的分析师
- 痛在哪：维护是长期劳动，没人愿意一直盯。A Survey of Large Language Models 从 2023-03 到 2026-03 发了 19 个版本，21 位作者，144 页、1081 条引用。Lilian Weng 说自己定期更新旧文并在顶部加更新说明，但一个人时间有限，大主题不可能覆盖全。Thoughtworks 技术雷达的条目默认只保留一期，不重新评估就消失。Papers with Code 域名现在直接跳转到 Hugging Face 的 trending 页。
- 多久一次：持续；按月到按季
- 现在怎么凑合：多作者分工；靠读者来信补漏；版本号加顶部更新说明；每半年或每年重出一版。
- 缺口：缺一个常驻角色：定期发现新论文、新版本、新数字，对照已发布的文档提出修改建议，并留下变更日志。这是定时例行加自有文件夹最贴合的工作。
- 证据：
  - arXiv 页面显示该综述共 19 个版本（v1 2023-03-31 至 v19 2026-03-18），备注为 ongoing work、144 页、1081 条引用。（arXiv 论文元数据（综述作者团队的实际行为）；survey-or-study；2026-03-18） <https://arxiv.org/abs/2303.18223>
  - 博主自述用 Google Scholar 加递归引用搜索找论文，仍看不全；会定期更新旧文并在顶部标注；一个人时间有限，处理读者来信要等。（Lilian Weng（AI 研究者，Lil'Log 作者）；practitioner；） <https://lilianweng.github.io/faq/>
  - 技术雷达每年两期，约 20 人的技术顾问委员会评议；条目不换环就只出现一期。（Thoughtworks 技术雷达 FAQ；industry-report；） <https://www.thoughtworks.com/radar/faq>
  - Contrary Research 的 Anthropic 公司研究标注最后更新 2026-02-06，5 位署名作者，约 77 分钟阅读量。（Contrary Research（投资机构旗下研究平台）；industry-report；2026-02-06） <https://research.contrary.com/company/anthropic>
  - 访问 paperswithcode.com 被 302 重定向到 Hugging Face 的 trending papers 页面。（本次访问的实测结果；news；） <https://paperswithcode.com/>

### 3. 当我写 related work 或给报告加引用时，我想确认每条引用真实存在，并且确实支持我写的那句话。

- 证据强弱：强
- 谁：A1 所有写论文的人；A2 写带出处报告的分析师
- 痛在哪：连顶会也没人逐条核对。GPTZero 在 NeurIPS 2025 的 4,841 篇录用论文里查出 51 篇共 100 条幻觉引用。OpenScholar 论文测得 GPT-4o 回答科研问题时 78%–90% 的引用是编的。816 位研究者的调查里 81% 已在研究流程中用 LLM，信息检索是用得最多的环节之一，而被提得最多的风险是幻觉。
- 多久一次：每篇论文、每份报告；集中在截稿前
- 现在怎么凑合：人工逐条点开；靠合作者互查；多数人不查。
- 缺口：逐条打开原文、定位到支持句、标出不支持或查无此文，是纯体力活，而且常要读付费全文。云端工具进不了用户的订阅。
- 证据：
  - GPTZero 在 NeurIPS 2025 的 4,841 篇录用论文中发现 51 篇含共 100 条幻觉引用；NeurIPS 回应称约 1.1% 的论文有错误引用不等于论文内容无效。（TechCrunch 报道（数据来自检测厂商 GPTZero）；news；2026-01-21） <https://techcrunch.com/2026/01/21/irony-alert-hallucinated-citations-found-in-papers-from-neurips-the-prestigious-ai-conference/>
  - GPT-4o 在科研问答中 78%–90% 的情况下编造引用；专家在 51%（8B 版）和 70%（GPT-4o 版）的情况下更偏好检索增强系统的答案而非专家手写答案。（OpenScholar 论文作者（学术研究，2,967 条专家问题的基准）；survey-or-study；2024-11） <https://arxiv.org/abs/2411.14199>
  - 816 位已核实的论文作者中 81% 在研究流程里用过 LLM；信息检索 49%、编辑 45% 至少偶尔使用；数据分析 69% 从不使用；最常提到的风险是幻觉、抄袭、数据造假。（Liao 等（学术调查，样本 816）；survey-or-study；2024-11） <https://arxiv.org/abs/2411.05025>
  - 写作建议：related work 的作用是讲清自己和已有工作的区别，不要表演式地引用所有沾边论文；可以让 LLM 出草稿找思路，但不要直接用。（Neel Nanda（可解释性研究负责人）；practitioner；2025-05-12） <https://www.alignmentforum.org/posts/eJGptPbbFPZGLpjsp/highly-opinionated-advice-on-how-to-write-ml-papers>

### 4. 当我要复现一篇论文（当基线、写复现报告或做尽调验证）时，我想把结果跑到误差范围内，并说清楚哪里对不上、为什么。

- 证据强弱：强
- 谁：A1：博士生、research engineer、应用科学家；A2：做技术尽调需要验证对方宣称结果的人
- 痛在哪：耗时远超预期，时间花在调试而不是写代码。一位研究者预估 3 个月，实际 8 个月，调试约为实现的四倍，算力约 850 美元，每个实验要多个随机种子重复。论文里写不全的细节都在代码里，而代码常不公开。OpenAI 的 PaperBench 上最好的 AI agent 平均只复现到 21.0%，低于机器学习博士。
- 多久一次：每个新项目开头做基线；MLRC 每年一届；尽调中偶发
- 现在怎么凑合：写工作日志；按步骤逐层对齐；多种子重跑；给原作者写信；等官方代码。
- 缺口：需要长时间无人值守地跑实验、记日志、逐步对齐并生成差异记录。AI 目前只能辅助，但环境搭建、对齐日志、实验台账和成本记账是可以交出去的部分。TMLR 的复现认证还要求有额外基线、消融或新见解，光重跑不够。
- 证据：
  - 复现一篇深度强化学习论文：预估 3 个月、实际 8 个月；调试时间约为实现的四倍；总算力约 850 美元；建议详细记工作日志、先想后跑。（Matthew Rahtz（研究工程师，个人博客）；practitioner；2018） <http://amid.fish/reproducing-deep-rl>
  - 20 篇 ICML 2024 论文、8,316 个可评分子任务；最好的 agent 平均复现得分 21.0%，尚未超过机器学习博士基线。（PaperBench 论文作者（OpenAI）；survey-or-study；2025-04） <https://arxiv.org/abs/2504.01848>
  - 飞桨论文复现指南把复现拆成 11 个对齐步骤和 6 个核验点，ImageNet 精度误差要求 0.15% 以内，要求提交各步对齐日志；数据预处理、初始化、训练三步最容易导致失败。（PaddlePaddle 官方复现指南；industry-report；） <https://raw.githubusercontent.com/PaddlePaddle/models/release/2.2/tutorials/article-implementation/ArticleReproduction_CV.md>
  - 研究者评论：代码里的细节永远比论文多，环境、库版本、随机种子都影响复现；应原样发布跑实验时的代码而不是整理后的版本。（HN 用户 albertzeyer（自述研究者）等；practitioner；2022-01-14） <https://news.ycombinator.com/item?id=29934192>
  - MLRC 2026 接收正面确认、部分复现和复现失败；须先被 TMLR 接收；TMLR 复现认证要求在验证之外有额外基线、分析或见解。（ML Reproducibility Challenge 征稿页与 TMLR 政策；industry-report；） <https://reproml.org/call_for_papers/>

### 5. 当我发布或引用一个评测数字时，我想让它带误差范围、测试口径和可重跑的条件，别人追问时经得住。

- 证据强弱：强
- 谁：A1：写实验论文和 benchmark 的研究者；A2：写模型横评和评测报告的分析师、平台团队
- 痛在哪：多数评测报告只有单点分数。BetterBench 按 46 条实践评了 24 个常用 benchmark，多数不报告统计显著性、结果难以复现。Anthropic 指出题目成组时聚类标准误可达朴素标准误的三倍以上。Leaderboard Illusion 发现厂商可私下测多个变体只公布最好的（Meta 在 Llama-4 前测了 27 个）。NeurIPS 要求填清单，含误差条和算力，缺清单直接拒稿。
- 多久一次：每次模型发布、每篇实验论文；榜单是持续的
- 现在怎么凑合：报单点分数；引用公开榜单；少数团队自己重跑。
- 缺口：重复采样、成对比较、置信区间、环境和版本记录都是可脚本化的重复劳动，但很少有人做全。写评测报告的人需要一份带原始日志、能重跑的底表。
- 证据：
  - 按 46 条最佳实践评估 24 个 AI benchmark，质量差异大；多数不报告统计显著性，结果不易复现。（BetterBench 论文作者（斯坦福，NeurIPS 2024 Spotlight）；survey-or-study；2024-11） <https://arxiv.org/abs/2411.12990>
  - 建议评测报告给出均值标准误、对成组题目用聚类标准误、用成对差异比较模型、事先做功效分析；聚类标准误可超过朴素值三倍。（Anthropic 研究博客；industry-report；2024-11-19） <https://www.anthropic.com/research/statistical-approach-to-model-evals>
  - Chatbot Arena 上 Meta 在 Llama-4 发布前私测 27 个变体；Google 和 OpenAI 各拿到约两成对战数据，83 个开放权重模型合计约 29.7%。（The Leaderboard Illusion 论文作者；survey-or-study；2025-04） <https://arxiv.org/abs/2504.20879>
  - NeurIPS 论文清单要求说明论断与结果是否相符、局限、可复现路径、误差条或显著性检验、算力；不附清单直接拒稿。（NeurIPS 官方指南；industry-report；） <https://neurips.cc/public/guides/PaperChecklist>

### 6. 当团队要在几个模型、向量库或推理引擎里选一个时，我想在我们自己的数据和负载上实测，并把没选的方案和理由写下来。

- 证据强弱：强
- 谁：A2：架构师、AI 平台负责人、技术型产品负责人；也包括给甲方出选型报告的顾问
- 痛在哪：二手对比表不可信，自己测又贵。HN 上的实践者指出对比表里有明显错误并要求给出依据；有人说装好 Chroma 花了一周多，换成 pgvector 只用几小时；有人把五种方案都实现了一遍才下结论。Hamel Husain 认为通用 benchmark 测的不是你的任务，团队该把大部分时间花在自己的评测上。美团团队说评测不能停在离线打榜和某次 demo，一个业务的评测指标一年里从 20 多个扩到近 200 个。技术雷达规定没有生产使用经验的技术进不了试验环。
- 多久一次：每个新项目一次；模型大版本更新后要重评，量级为每季度
- 现在怎么凑合：看厂商对比表加小规模 PoC；凭经验直接用 Postgres；内部评测集从线上坏例慢慢攒。
- 缺口：缺一个能按统一脚本把候选逐个装起来、跑自己的样本、记录踩坑和耗时、输出带原始日志的对比底表的角色，并且在新版本出来时重跑。纯桌面调研写出来的选型报告会被同行直接质疑。
- 证据：
  - 对比表把 pgvector 标为无角色权限控制，评论者指出 Postgres 手册有整章讲这个，并要求每个格子给出依据；另一位说 Chroma 折腾一周多，换 pgvector 几小时；还有人实现过五种方案后认为 Postgres 更快。（HN 用户 drewbug01、citruscomputing、__newmoon__（工程实践者）；practitioner；2023-10-04） <https://news.ycombinator.com/item?id=37764489>
  - 产品评测要针对自己用户的任务，和通用模型 benchmark 测的不是一回事；多数团队只顾改提示词和模型，所以停在 demo 水平。（Hamel Husain（独立 AI 工程顾问）；practitioner；2024-03-29） <https://hamel.dev/blog/posts/evals/>
  - 两年实践总结：评测必须服务真实业务迭代；从高频场景和线上坏例起步；先由一个人统一标准再做人机一致；某业务指标一年内从 20 多个扩到近 200 个。（美团履约技术团队与图灵 Agent 评测团队；practitioner；2026-08-07） <https://tech.meituan.com/2026/08/07/Agent-Evaluation.html>
  - 条目由全球员工从客户项目中提名；只有在生产软件中用过才能进入试验环。（Thoughtworks 技术雷达 FAQ；industry-report；） <https://www.thoughtworks.com/radar/faq>
  - Google 设计文档的固定章节含背景、目标与非目标、设计、备选方案、横切关注点；较大项目约 10–20 页；一年后回读自己的文档做复盘。（Malte Ubl（前 Google 工程师）；practitioner；2020-07-06） <https://www.industrialempathy.com/posts/design-docs-at-google/>
  - 厂商写的大模型平台选型指南：七个决策点加成熟度对照表，没有实测数据，自己也建议用真实场景验证。（灵雀云（厂商内容，仅代表厂商对需求的理解）；vendor；2026-08-12） <https://www.alauda.cn/blog/1322/>

### 7. 当我要出一份年度或深度行业报告时，我想把一年里每天看到的材料沉淀成带出处、可检索的底稿，到成稿期只做筛选和判断。

- 证据强弱：强
- 谁：A2：投资机构研究团队、研究机构、独立研究平台、咨询顾问
- 痛在哪：成稿只有几个月，素材却要攒一年。State of AI 的作者说自己每天读邮件、推特和圈内交流里冒出来的东西，按月打包成 newsletter，六七月开一份草图文档，初稿每年要砍掉 30%–50%，目标约 100 页，再请一组外部评审找漏洞和错误。2025 年版是 4 人团队、点名致谢 15 位以上评审，并做了 1,200 人的从业者调查。Menlo 的报告靠 495 位企业决策者的问卷加自下而上模型；a16z 靠 100 位 CIO 的问卷加二十多位买方访谈。
- 多久一次：成稿每年一次；素材收集每天
- 现在怎么凑合：个人收藏夹；月度 newsletter 当中间产物；Google 文档草图；外部评审挑错；委托独立调研公司做问卷。
- 缺口：每日信息流对这些人的价值在于喂给年度和深度产出，不在于当天读完。缺的是按报告章节归档、每条带出处和日期、成稿时能回溯的素材台账。
- 证据：
  - 全年每日阅读并按月打包；夏初开草图文档；每年砍掉 30%–50% 的页；请业界、创业公司和学界的评审找明显遗漏和无意的错误。（Nathan Benaich（Air Street Capital 创始人，State of AI Report 作者）访谈；practitioner；2022-12） <https://www.zeta-alpha.com/post/nathan-benaich-the-ai-report-the-future-of-large-lms-and-investing>
  - 2025 年版：第八年；Benaich 加三位合作者；点名致谢 15 位以上评审；首次做 1,200 位从业者的使用调查；上一年 10 条预测自评对了 5 条。（Nathan Benaich（报告作者的发布文）；practitioner；2025-10-09） <https://nathanbenaich.substack.com/p/the-state-of-ai-report-2025>
  - 方法说明：2025-11-07 至 11-25 与独立调研公司合作调查 495 位美国企业 AI 决策者，并结合覆盖模型 API、基础设施、应用的自下而上市场模型。（Menlo Ventures（投资机构报告）；industry-report；2025-12-09） <https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/>
  - 报告基于对 15 个行业 100 位 CIO 的问卷和二十多位企业买方的访谈，16 条发现分四部分，并与一年前的同类调查对比。（a16z（投资机构报告）；industry-report；2025-06-10） <https://a16z.com/ai-enterprise-2025/>
  - AI Index 2025 共 8 章，由跨学界和业界的指导委员会主持，每年一版，自述目标是提供无偏、经严格核验、来源广泛的数据。（Stanford HAI；industry-report；2025） <https://hai.stanford.edu/ai-index/2025-ai-index-report>

### 8. 当我写一篇行业或公司深度时，我想先把底稿（数据、图表、测算）做扎实并留痕，让质控和合规一次过，把时间留给回答市场真正的疑问。

- 证据强弱：强
- 谁：A2：卖方 TMT、计算机、AI 方向分析师和研究助理；券商产业研究员
- 痛在哪：一位传媒互联网首席写道，好报告的定义是解决市场的疑问，流程是先整理信息、梳理基本面和市场关心的问题、列提纲、做底稿、最后才写正文；他同时承认卖方越来越内卷和服务导向，资深分析师很难有时间专注写深度，行业报告质量在明显下滑。监管上，2025-12-26 生效的执业规范要求核实引用信息和数据来源、建立工作底稿制度、由专职人员做质量审核和合规审查，并明确宏观和产业研究报告参照执行。行业人数在降：2026 年三季度末注册分析师约 5,891 人，较 2025 年末净减约 138 人，招聘偏向宏观、区域政策和产业研究。
- 多久一次：深度报告按月到按季；例行点评每周到每月
- 现在怎么凑合：Excel 底稿；招股书、年报、友商研报；实习生和研究助理；券商自己搭 Agent 流水线做例行报告。
- 缺口：例行报告券商已在自己自动化（东吴证券把月度复盘拆成新闻收集、数据底稿、撰写、编辑检查四个 AI 角色）。深度报告的底稿仍靠人：多源数据口径统一、每个数字能追到来源页、供质控和合规核对。
- 证据：
  - “好的报告就是解决市场的疑问”；流程五步，底稿先于文字；资深分析师因服务内卷没时间写深度，行业报告质量明显下滑；建议时刻抱着证伪的想法、尽早让别人挑毛病。（元芳（某券商传媒互联网首席分析师），发于公众号互联网怪盗团、虎嗅转载；practitioner；2022-08-13） <https://www.huxiu.com/article/633808.html>
  - 第九条要求核实引用信息和数据来源；第十五条要求工作底稿含信息资料、调研纪要、分析模型；第十七、十八条要求发布前质量审核和合规审查并留清单；第三十六条规定宏观和产业研究报告参照执行。（中国证券业协会自律规则（中证协发〔2025〕278号）；industry-report；2025-12-26） <https://www.sac.net.cn/zlgl/zlgz/202512/t20251231_69839.html>
  - 三季度末全行业注册分析师约 5,891 人，较 2025 年末约 6,029 人净减约 138 人；年内迁徙近 480 人次；对宏观、区域政策和产业研究人才需求加大；有分析师转向 AI 领域。（财联社记者报道（引中证协官网与 Choice 数据）；news；2026-10-02） <https://finance.eastmoney.com/a/202610023888329378.html>
  - 券商自述：把月度复盘类研报拆成四个 AI 角色的流水线，盲测下与真人稿难区分；但信息源覆盖、新闻真伪、同日多事件的权重排序、前瞻结论仍需研究员交叉验证和把关。（东吴证券研究员芦哲、唐遥衎（宏观深度报告摘要）；practitioner；2026-07-26） <https://stock.finance.sina.com.cn/stock/go.php/vReport_Show/kind/macro/rptid/838407756378/index.phtml>
  - 卖方观点：AI 可处理信息获取、整理和初步研究，研究员转向判断、思辨和决策。（中银证券研究员周原（产业研究报告摘要）；industry-report；2026-09-30） <https://stock.finance.sina.com.cn/stock/go.php/vReport_Show/kind/search/rptid/844070680202/index.phtml>

### 9. 当我给出一个市场规模数字时，我想让它有口径、有出处、能用两种方法互相校验，别人改一个假设就能重算。

- 证据强弱：强
- 谁：A2：卖方和买方研究员、投资经理、咨询顾问、写行业报告的研究机构
- 痛在哪：同一个市场不同口径能差出一个数量级，出处常被二手聚合站污染。卖方首席的做法是自上而下和自下而上各算一遍，因为国内常缺可靠的第三方数据。Menlo 给出 2025 年企业生成式 AI 支出 370 亿美元时专门列出不含芯片、推理和模型托管、以及嵌在既有软件里的 AI 功能。Sequoia 的 6000 亿美元缺口是把 Nvidia 收入年化后连乘两个 2 得到的，并说明是对上一年 2000 亿版本的更新。分析师 Benedict Evans 检查 OpenAI 自己的 Deep Research 样例时发现它用流量统计站和聚合站当出处、把日本的手机系统份额写反了，结论是表里有错就整张表不能信。
- 多久一次：每篇深度、每份备忘一次；假设变化时重算
- 现在怎么凑合：Excel；引用咨询机构数字；自己花钱做问卷；手工追原始出处。
- 缺口：追到原始出处而不是聚合站、把口径差异列清、把假设参数化，是现有 deep research 最弱的环节。FutureSearch 测到它把出处错归给聚合站、选了不权威的数字、表格缺项却看起来完整。
- 证据：
  - 以字体市场为例：国内缺可靠第三方数据，用海外占比推算（自上而下）和自下而上两种方式测算，底稿阶段只处理数据不写文字。（元芳（券商传媒互联网首席分析师）；practitioner；2022-08-13） <https://www.huxiu.com/article/633808.html>
  - 企业生成式 AI 支出 2025 年 370 亿美元（2024 年 115 亿）；口径不含芯片、推理与模型托管、既有软件中的 AI 功能。（Menlo Ventures 报告方法说明；industry-report；2025-12-09） <https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/>
  - 把 Nvidia 年化收入乘 2 得到数据中心总成本，再乘 2 反映终端 50% 毛利要求，得出 6000 亿美元收入缺口；是对 2023-09 的 2000 亿版本的更新。（David Cahn（Sequoia 合伙人）；practitioner；2024-06-20） <https://www.sequoiacap.com/article/ais-600b-question/>
  - 以自己熟悉的智能手机市场检验 Deep Research 样例：出处是流量统计站和 SEO 聚合站，日本份额与原始调研数据相反；只在自己是专家、能挑错时才觉得可用来省掉几天活。（Benedict Evans（独立科技分析师）；practitioner；2025-02-17） <https://www.ben-evans.com/benedictevans/2025/2/17/the-deep-research-problem>
  - 六个失败案例：把出处错归给聚合站而非原始机构；替代肉市场选了不权威的 72 亿而非 64 亿美元；产品表只列出 45 个中的 34 个、170 格中 118 格正确，且缺项不易察觉。（Dan Schwarz（FutureSearch，研究评测公司）；practitioner；2025-02-19） <https://futuresearch.ai/oaidr-feb-2025>

### 10. 当我要拆一个 AI 产品或公司时，我想亲手把产品走一遍，把公开数据和访谈拼成一份有结论、可持续维护的拆解。

- 证据强弱：中
- 谁：A2：产品负责人、产品经理、投资机构研究员、独立研究平台
- 痛在哪：一位竞品分析书作者强调报告要可执行、可维护、每条素材有来源，编造数据会误导决策。一位 B 端产品经理说传统做法一份要 3–5 天，用 AI 后约 1 天，但她找不到能让 AI 直接看网页的工具，只能逐页截图发给模型，页面之间的流转关系也很难讲清。机构侧的公司研究是长文档：Contrary 的 Anthropic 报告分 Thesis 到 Summary 共 11 节并持续更新；海外独角兽自述三年发了近 200 篇深度研究、覆盖 150 多家公司。
- 多久一次：产品团队每个规划周期或每季度；投资机构每个标的；研究平台按周产出
- 现在怎么凑合：截图加提示词；人工体验；公开资料汇编；一页纸画布先验证思路。
- 缺口：需要在真实浏览器里登录后走完整流程（注册后才看得到的功能、定价页、更新日志），并定期回访记录变化。这一点直接对应本机已登录浏览器加定时例行。
- 证据：
  - 竞品分析报告建议总分总结构；要点是可执行、可维护、存素材、有来源；常见错误包括选错竞品和维度、泛泛而谈、编造数据。（张在旺（咨询师，《有效竞品分析》作者）；practitioner；2022-11-10） <https://www.woshipm.com/evaluating/5672064.html>
  - 自述传统方法 3–5 天、AI 辅助约 1 天；因为没找到能让 AI 直接分析网页的工具，只能截关键页面；提示词不清时模型会答非所问。（Thea小里（5 年 B 端产品经理）；practitioner；2025-06-04） <https://www.woshipm.com/ai/6225056.html>
  - 公司研究固定 11 节：Thesis、Founding Story、Product、Market、Competition、Business Model、Traction、Valuation、Key Opportunities、Key Risks、Summary；正文内嵌大量出处链接。（Contrary Research；industry-report；2026-02-06） <https://research.contrary.com/company/anthropic>
  - 自我介绍：过去 3 年研究并公开发布近 200 篇深度研究，含 150 多家全球头部独角兽公司的分析和硅谷一线走访。（海外独角兽（拾象旗下研究平台）播客简介；practitioner；） <https://www.xiaoyuzhoufm.com/podcast/6410266f5384961ba7e08c7d>

### 11. 当我要把一个 AI 项目推上投委会时，我想把 demo 之外的真实情况查清（是否上了生产、有没有评测体系、成本怎么随规模走、护城河在不在数据和流程里），写进一份事后能回看的备忘。

- 证据强弱：中
- 谁：A2：VC 和 PE 投资经理、做技术尽调的顾问、产业资本的战略投资团队
- 痛在哪：备忘本身很短，背后的取证很重。NextView 合伙人说他们的备忘只有一到两页、固定十来个小节、只在内部流通以保证坦诚，作用一是逼自己把决策想清楚，二是留一份当时想法的快照供日后对照。Bessemer 公开的 Shopify 备忘含市场、客户与定价、产品、获客与留存、竞争、团队、财务、交易条款、情景分析。做 AI 技术尽调的顾问说要看的是真实生产状态、评测体系、审计记录和成本曲线，这些在 demo 里看不到。一手信息很贵：公开报价的专家网络一小时电话约 525–1,050 美元。
- 多久一次：每个进入尽调的项目；活跃投资人每月数个
- 现在怎么凑合：专家网络电话；参考电话；内部模板；请技术合伙人看代码；项目当天建档、内评前 24 小时定稿、投后 100 天复盘。
- 缺口：访谈、参考电话和最终判断交不出去。可以交出去的是公开信息底稿、竞品对照、对公司宣称的 benchmark 做复测、访谈纪要整理、以及到期回看当时的判断。
- 证据：
  - 备忘一到两页，固定小节含尽调小结、最多四条看好理由、担忧、退出情景；只在内部流通；作用是磨决策和留快照，日后回看哪些判断对了。（David Beisel（NextView Ventures 合伙人）；practitioner；2024-10-03） <https://nextview.vc/blog/the-investment-memo/>
  - 2010 年的真实备忘：两位作者写给合伙人会，约十二节，证据以公司内部指标、留存曲线、可比公司和情景分析为主。（Bessemer Venture Partners 公开的投资备忘；practitioner；2010-10-12） <https://www.bvp.com/memos/shopify>
  - 中文模板：六大板块；发现项目当天建档，内评前 24 小时提交定稿，投后 100 天复盘；好备忘主动暴露风险并给缓解方案。（TianPan.co（产品与投资类个人站点，作者身份未标注）；practitioner；2025-07-18） <https://tianpan.co/zh/notes/274-10-investment-memo-template>
  - AI 技术尽调要查生产状态和真实用户规模、评测框架、审计记录、数据流向、成本是否随规模线性上涨；这些在演示里看不出来。（Missing Corner 联合创始人（技术尽调服务商，带服务商立场）；vendor；） <https://www.missingcorner.com/thinking/technical-diligence/>
  - 公开报价的专家电话每小时约 525–1,050 美元；采购数据显示年度合同中位数 AlphaSights 约 78,980 美元、Tegus 约 30,000 美元。（Market Intelligence Tools（第三方汇编，引各家官网与 Vendr 采购数据）；industry-report；2026-10-01） <https://marketintelligencetools.com/reports/expert-network-cost/>

### 12. 当我写一篇给同行看的深度长文或研究型 newsletter 时，我想把时间花在论点和图上，而不是花在找料、核对和排版上。

- 证据强弱：中
- 谁：A1 和 A2 里写长文的研究者、工程师、独立分析师
- 痛在哪：瓶颈是制作成本。Distill 编辑部在停刊说明里说，这类文章的主要瓶颈是制作所需的工作量，早期有的文章编辑要投入 50 多小时帮作者改图和文字，志愿者因此倦怠。Neel Nanda 建议截稿前留约一个月专门做提炼和写作，摘要、引言、图各自要花的功夫和正文其余部分相当。Lilian Weng 的图是自己用 Google 幻灯片画的。需求侧不缺读者：Ahead of AI 自称读者超过 20 万，Latent Space 自称订阅超过 20 万。
- 多久一次：每 1–8 周一篇
- 现在怎么凑合：一个人硬扛；靠读者来信纠错和补漏；
- 缺口：素材台账、引用核对、图表重画、旧文更新这些环节可以交出去；论点、取舍和文风交不出去。
- 证据：
  - 停刊说明：主要瓶颈是制作这类文章所需的工作量；早期部分文章编辑投入 50 多小时帮改图和文字；志愿编辑倦怠。（Distill 编辑团队（Chris Olah 等）；practitioner；2021-07-02） <https://distill.pub/2021/distill-hiatus/>
  - 好论文围绕一到三个具体论断讲一个故事；截稿前留约一个月写作；摘要、引言、图和其余正文花同等精力；要主动红队自己的结论。（Neel Nanda（可解释性研究负责人）；practitioner；2025-05-12） <https://www.alignmentforum.org/posts/eJGptPbbFPZGLpjsp/highly-opinionated-advice-on-how-to-write-ml-papers>
  - 博主自述画图用 Google 幻灯片，文献靠 Google Scholar 和递归引用搜索，旧文定期更新。（Lilian Weng；practitioner；） <https://lilianweng.github.io/faq/>
  - 自称读者超过 20 万研究者和从业者，定位是帮人跟上研究进展的独立项目。（Sebastian Raschka（Ahead of AI 作者）；practitioner；） <https://magazine.sebastianraschka.com/about>

### 13. 当研究问题的答案在付费库、登录后页面或原始 PDF 里时，我想让助手读的就是我有权读的那一份，而不是公开网页上的二手转述。

- 证据强弱：中
- 谁：A1 和 A2 的所有深度研究者，尤其是依赖数据库、研报终端、专家纪要库的人
- 痛在哪：云端 deep research 进不了用户的订阅，于是退而用二手源。Understanding AI 的 19 位专业人士测试里，一位反垄断律师估计同样的报告人工要 15–20 小时，并说如果能接上 Westlaw 或 LexisNexis 这类商业数据库她会在工作中用；测试中模型碰到标准组织的付费墙后改用了州政府网站上的节选。Evans 和 FutureSearch 都指出出处被聚合站替代。券商执业规范要求信息来源合法并经核实；卖方首席把招股书和年报列为最可靠材料。
- 多久一次：每个深度项目的采数阶段
- 现在怎么凑合：人工下载 PDF 再上传；复制粘贴；让实习生去终端里查。
- 缺口：这是本机已登录浏览器能补的缺口。但研究者是否愿意让 AI 用自己的账号批量读，本次没有找到任何一手说法，需要访谈。
- 证据：
  - 19 位读者测试，7 位认为 OpenAI 的回答达到资深专业人士水平；反垄断律师称一份 8,000 词报告不输初级律师、人工要 15–20 小时，若能接入商业法律数据库更愿意在工作中用；模型遇付费墙后改用其他站点。（Timothy B. Lee（记者）及其读者测试者（律师、工程师、建筑师等）；practitioner；2025-02-24） <https://www.understandingai.org/p/these-experts-were-stunned-by-openai>
  - 样例报告的数据出处是流量统计站和聚合站，而非原始调研。（Benedict Evans（独立科技分析师）；practitioner；2025-02-17） <https://www.ben-evans.com/benedictevans/2025/2/17/the-deep-research-problem>
  - 第八条列举可用信息来源（含从信息服务机构合法取得的信息），第九条要求核实引用信息和数据来源。（中国证券业协会执业规范；industry-report；2025-12-26） <https://www.sac.net.cn/zlgl/zlgz/202512/t20251231_69839.html>

### 14. 当我在报告里下了判断或预测时，我想把它连同依据记下来，到期回看对错。

- 证据强弱：中
- 谁：A2：行业报告作者、投资人、卖方分析师；A1：写立场和展望类文章的研究者
- 痛在哪：能被证伪并事后打分，是顶级报告区别于罗列的标志，但多数人没有台账。State of AI 每年给 10 条预测并公开自评，2025 年版对上一年的自评是 10 中 5。Sequoia 的文章是对自己上一年数字的更新。NextView 把备忘当作日后对照的快照。中文投资备忘模板要求投后 100 天复盘。卖方首席建议写报告时始终想着怎样会被证伪。
- 多久一次：年度；每个项目结束后
- 现在怎么凑合：年度自评；少数机构有复盘制度；多数靠自觉。
- 缺口：没有工具把报告里的论断抽成可核对的条目、绑定到期日、到期自动取数回看。常驻同事加记忆加定时例行适合承担这本台账。
- 证据：
  - 回顾上一年预测自评 10 中 5，并给出下一年的 10 条预测。（Nathan Benaich；practitioner；2025-10-09） <https://nathanbenaich.substack.com/p/the-state-of-ai-report-2025>
  - 做预测一是让报告有看点，二是逼自己想清楚方向，每年公布评分。（Nathan Benaich 访谈；practitioner；2022-12） <https://www.zeta-alpha.com/post/nathan-benaich-the-ai-report-the-future-of-large-lms-and-investing>
  - 备忘是某一时点想法的快照，回看能知道当时哪些判断准、哪些不准。（David Beisel（NextView Ventures 合伙人）；practitioner；2024-10-03） <https://nextview.vc/blog/the-investment-memo/>
  - 文章列出可跟踪的指标并更新了上一年的缺口数字。（David Cahn（Sequoia）；practitioner；2024-06-20） <https://www.sequoiacap.com/article/ais-600b-question/>

### 15. 当稿子快写完时，我想有人按清单逐条挑毛病：论断有没有证据、数字前后是否一致、有没有漏掉显而易见的反驳。

- 证据强弱：强
- 谁：A1 和 A2 所有要过评审、质控或投委会的人
- 痛在哪：所有高标准交付物都有一道外部挑错环节，而评审人稀缺且慢。Nanda 建议默认自己犯了错并专门设计实验去打自己的结论。卖方首席说问题越早被别人挑出来报告质量越高。State of AI 请十多位评审找遗漏和错误。TMLR 至少三位审稿人，标准是论断是否有证据支撑。NeurIPS 有十几项的强制清单。券商规范要求质量审核和合规审查各有清单并留底稿，且审核意见要有回应和落实。
- 多久一次：每篇交付物
- 现在怎么凑合：导师、同事、外部评审；质控岗和合规岗；投委会前 24 小时预读。
- 缺口：正式评审之前缺一轮便宜的清单式自查：逐条核对论断与证据、数字口径、引用、风险提示。这部分规则明确，适合交给 AI 先过一遍，人再处理意见。
- 证据：
  - 建议假设自己已经犯错，主动找叙事里的漏洞并设计实验检验；预先回应明显反驳的论文更可信。（Neel Nanda；practitioner；2025-05-12） <https://www.alignmentforum.org/posts/eJGptPbbFPZGLpjsp/highly-opinionated-advice-on-how-to-write-ml-papers>
  - 除了自己找毛病，也需要别人挑问题，越早挑出质量越高。（元芳（券商首席分析师）；practitioner；2022-08-13） <https://www.huxiu.com/article/633808.html>
  - 第十七条：专职质量审核人员审核信息处理、分析逻辑、研究结论，须有审核清单和底稿并确保意见得到回应；第十八条：合规审查涵盖人员资质、信息来源、风险提示。（中国证券业协会执业规范；industry-report；2025-12-26） <https://www.sac.net.cn/zlgl/zlgz/202512/t20251231_69839.html>
  - 接收标准是论断是否有准确、可信、清楚的证据支撑；至少三位审稿人。（TMLR 编辑政策；industry-report；） <https://jmlr.org/tmlr/editorial-policies.html>
  - 清单涵盖论断、局限、可复现、误差条、算力、许可等十余项，缺清单直接拒稿。（NeurIPS 官方指南；industry-report；） <https://neurips.cc/public/guides/PaperChecklist>

## 工具与花费

| 工具 | 用来做什么 | 价格 | 谁付钱 | 抱怨 | 来源 |
|---|---|---|---|---|---|
| Google Scholar 加递归引用搜索 | 找文献、扩展文献面 | 免费 | 个人 | 大主题看不全，仍要靠读者来信补漏 | <https://lilianweng.github.io/faq/> |
| Elicit | 文献检索、系统综述筛选、从论文里抽取数据成表 | 免费版；Pro 每月 49 美元；Scale 每月 169 美元；企业版另议（厂商定价页） | 个人或实验室、团队 | 本次未找到一手抱怨 | <https://elicit.com/pricing> |
| Undermind | 深度文献搜索和报告 | 免费版；Pro 每月 16 美元（年付）；Team 每人每月 15 美元（厂商定价页） | 个人或团队 | 本次未找到一手抱怨 | <https://www.undermind.ai/pricing> |
| ChatGPT 和 Gemini 的 Deep Research | 快速出一份带引用的长报告初稿，供专家改 | 本次未能打开定价和额度页面（403） | 个人订阅为主 | 出处被聚合站替代、数字写反、表格缺项却显得完整、过度自信、进不了付费库 | <https://www.ben-evans.com/benedictevans/2025/2/17/the-deep-research-problem> |
| 专家网络（Tegus/AlphaSense、AlphaSights、Guidepoint、Inex One） | 尽调和行业研究里的专家电话、纪要库 | 公开报价每小时约 525–1,050 美元；年度合同中位数 Tegus 约 3 万、Guidepoint 约 4.8 万、AlphaSights 约 7.9 万美元（第三方汇编，引 Vendr 采购数据） | 基金或公司 | 贵；本次未找到用户侧的一手抱怨 | <https://marketintelligencetools.com/reports/expert-network-cost/> |
| 云算力和 GPU | 复现论文、跑评测 | 一个复现项目 8 个月约 850 美元（2018 年个人案例） | 个人或实验室 | 每试一个想法都要花钱，需多种子重复；算力需求远超预期 | <http://amid.fish/reproducing-deep-rl> |
| Excel 底稿加招股书、年报、友商研报 | 卖方深度报告的数据、图表和市场空间测算 | 未找到 | 券商 | 友商报告质量在下滑；国内常缺可靠第三方数据 | <https://www.huxiu.com/article/633808.html> |
| 券商自建 Agent 流水线（DeepSeek V4 Pro 加 Hermes Agent） | 月度复盘类例行研报的采集、底稿校验、撰写、编辑检查 | 未披露 | 券商 | 信息源覆盖、新闻真伪、多事件权重排序、前瞻结论仍需真人把关 | <https://stock.finance.sina.com.cn/stock/go.php/vReport_Show/kind/macro/rptid/838407756378/index.phtml> |
| 委托独立调研公司做问卷 | 年度行业报告的一手数据（495 位企业决策者） | 未披露 | 投资机构 | 未找到 | <https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/> |
| Google 文档和幻灯片 | 年度报告的草图文档和成稿；博文配图 | 免费或办公套件内 | 个人或团队 | 未找到 | <https://www.zeta-alpha.com/post/nathan-benaich-the-ai-report-the-future-of-large-lms-and-investing> |
| 付费版 GPT（o3）或 Sider 加截图 | 竞品页面拆解 | 作者只说 o3 需付费，Sider 每天有免费额度 | 个人 | 没有工具能让 AI 直接看网页，只能逐页截图；提示词不清就答非所问 | <https://www.woshipm.com/ai/6225056.html> |
| Statista、Statcounter 等聚合和统计站 | 被 AI 工具和不少报告当作数字出处 | 未查 | — | 分析师认为它们不是原始来源，口径不对，会把结论带偏 | <https://www.ben-evans.com/benedictevans/2025/2/17/the-deep-research-problem> |
| Papers with Code（现跳转到 Hugging Face trending） | 过去用于查各任务的最好结果和代码 | 免费 | — | 原站已不可用，访问被重定向 | <https://paperswithcode.com/> |
| Overleaf | 综述和论文写作 | 未查 | 个人或学校 | 未找到 | <https://korbonits.com/blog/2026-04-30-planning-an-ml-survey-paper/> |

## 数字

- arXiv CS 每月收到数百篇综述类投稿，2025-10-31 起未经同行评审的综述和立场论文不再接收（news） <https://blog.arxiv.org/2025/10/31/attention-authors-updated-practice-for-review-articles-and-position-papers-in-arxiv-cs-category/>
- A Survey of Large Language Models：19 个版本（2023-03-31 至 2026-03-18），144 页，1081 条引用，21 位作者（survey-or-study） <https://arxiv.org/abs/2303.18223>
- NeurIPS 2025 的 4,841 篇录用论文中 51 篇含共 100 条幻觉引用（GPTZero 检测）（news） <https://techcrunch.com/2026/01/21/irony-alert-hallucinated-citations-found-in-papers-from-neurips-the-prestigious-ai-conference/>
- GPT-4o 在科研问答中 78%–90% 的情况下编造引用（survey-or-study） <https://arxiv.org/abs/2411.14199>
- 816 位论文作者中 81% 已在研究流程中用 LLM；信息检索 49%、编辑 45% 至少偶尔使用（survey-or-study） <https://arxiv.org/abs/2411.05025>
- 复现一篇深度强化学习论文：预估 3 个月，实际 8 个月，算力约 850 美元，调试约为实现的四倍（practitioner） <http://amid.fish/reproducing-deep-rl>
- PaperBench：20 篇 ICML 2024 论文、8,316 个子任务，最好的 agent 平均复现得分 21.0%（survey-or-study） <https://arxiv.org/abs/2504.01848>
- 飞桨复现指南：11 个对齐步骤、6 个核验点，ImageNet 精度误差要求 0.15% 以内（industry-report） <https://raw.githubusercontent.com/PaddlePaddle/models/release/2.2/tutorials/article-implementation/ArticleReproduction_CV.md>
- BetterBench：按 46 条实践评估 24 个 benchmark，多数不报告统计显著性（survey-or-study） <https://arxiv.org/abs/2411.12990>
- 聚类标准误可超过朴素标准误的三倍（industry-report） <https://www.anthropic.com/research/statistical-approach-to-model-evals>
- Meta 在 Llama-4 发布前于 Chatbot Arena 私测 27 个变体（survey-or-study） <https://arxiv.org/abs/2504.20879>
- 美团某业务的评测指标一年内从 20 多个扩到近 200 个（practitioner） <https://tech.meituan.com/2026/08/07/Agent-Evaluation.html>
- State of AI：初稿每年砍掉 30%–50%，目标约 100 页；2025 年版 4 人团队、1,200 人调查、上一年预测 10 中 5（practitioner） <https://nathanbenaich.substack.com/p/the-state-of-ai-report-2025>
- Menlo：调查 495 位美国企业 AI 决策者；2025 年企业生成式 AI 支出 370 亿美元，2024 年 115 亿（industry-report） <https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/>
- a16z：问卷 100 位 CIO（15 个行业）加二十多位企业买方访谈，16 条发现（industry-report） <https://a16z.com/ai-enterprise-2025/>
- Sequoia：AI 基础设施收入缺口从 2000 亿更新到 6000 亿美元（Nvidia 年化收入乘 2 再乘 2）（practitioner） <https://www.sequoiacap.com/article/ais-600b-question/>
- 全行业注册证券分析师约 5,891 人（2026 年三季度末），较 2025 年末约 6,029 人净减约 138 人（news） <https://finance.eastmoney.com/a/202610023888329378.html>
- 19 位专业人士测试 Deep Research，7 位认为达到资深专业人士水平，16 位更偏好 OpenAI 的结果；律师估计同等报告人工需 15–20 小时（practitioner） <https://www.understandingai.org/p/these-experts-were-stunned-by-openai>
- Deep Research 生成的产品表只列出 45 个中的 34 个，170 格中 118 格正确（practitioner） <https://futuresearch.ai/oaidr-feb-2025>
- 竞品分析：传统做法每份 3–5 天，AI 辅助约 1 天（单一作者自述）（practitioner） <https://www.woshipm.com/ai/6225056.html>
- Distill 早期部分文章编辑投入 50 多小时帮作者改图和文字（practitioner） <https://distill.pub/2021/distill-hiatus/>
- 专家电话公开报价每小时约 525–1,050 美元；年度合同中位数 AlphaSights 约 78,980 美元、Tegus 约 30,000 美元（industry-report） <https://marketintelligencetools.com/reports/expert-network-cost/>
- Elicit Pro 每月 49 美元、Scale 每月 169 美元；Undermind Pro 每月 16 美元（年付）（vendor） <https://elicit.com/pricing>
- 海外独角兽三年发布近 200 篇深度研究，覆盖 150 多家公司（practitioner） <https://www.xiaoyuzhoufm.com/podcast/6410266f5384961ba7e08c7d>
- NextView 的投资备忘限制在一到两页（practitioner） <https://nextview.vc/blog/the-investment-memo/>
- Google 较大项目的设计文档约 10–20 页（practitioner） <https://www.industrialempathy.com/posts/design-docs-at-google/>
- Thoughtworks 技术雷达每年两期，约 20 人的技术顾问委员会评议（industry-report） <https://www.thoughtworks.com/radar/faq>

## 可以交给 AI 的、只能协助的、不会交出去的

判断依据：谁署名谁负责（券商规范第十六条要求署名分析师对内容和观点负责），以及证据显示 AI 现在做到什么程度（PaperBench 最好的 agent 复现得分 21%；deep research 的出处和表格完整性被分析师点名不可信；东吴证券的例行报告流水线盲测难分）。

一、可以整件交给常驻 AI 同事（规则明确、重复、可核对，且贴合定时例行、自有文件夹、本机已登录浏览器）
1. 活文档的维护：按周或按月发现新论文、新版本、新价格、新数字，对照已发布的综述、对比表、公司研究提出修改并写变更日志。理由：三年 19 版的综述和定期更新旧文的博主说明这是真实且没人想做的长期劳动。
2. 引用核对：逐条打开原文，确认文献存在、找到支持句、标出不支持或查无此文。理由：NeurIPS 录用论文里仍有 100 条幻觉引用；这是体力活，且需要读用户有权读的全文。
3. 素材台账：把每天看到的材料按报告章节归档，带出处、日期、原文位置。理由：年度报告作者自述的工作方式就是每日收集、按月打包、夏天成稿。每日简报在这里是底稿的进料口，不是交付物。
4. 例行类报告：月度复盘、周报、固定格式的跟踪。理由：券商自己已经在用四角色流水线做，说明这类产出的标准明确。
5. 预测和判断台账：把报告里的论断抽成条目、绑定到期日、到期取数回看。理由：公开打分是顶级报告的做法，但多数人没有工具。
6. 评测重跑：按固定协议重复采样、算置信区间、记录环境和版本，新模型出来时重跑。理由：统计规范已有明确做法，缺的是有人执行。

二、只能辅助（AI 出底稿和候选，人做取舍）
1. 综述的分类框架：AI 给全量文献底表和几个候选分类，人选。理由：arXiv、JAIR 和学者都说价值在专家的取舍，非专家看不出幻觉。
2. 复现：AI 搭环境、逐步对齐、记实验日志和成本；人判断差异来源。理由：21% 的复现得分说明不能独立完成，但调试占了人四倍于实现的时间。
3. 市场规模测算：AI 追原始出处、列口径差异、搭参数化表；人定假设。理由：分析师指出一处错整张表不可信，所以每个数字必须能点回来源页。
4. 技术选型：AI 按统一脚本装候选、跑用户自己的样本、记录踩坑；人给生产经验和组织约束。理由：实践者只信自己负载上的结果和上过生产的经验。
5. 竞品走查：AI 在真实浏览器里登录后走流程、截图、定期回访；人下结论。理由：产品经理明说找不到能直接看网页的工具，只能截图。
6. 交稿前清单式自查：按 NeurIPS 清单、券商质控清单、论断与证据对照表过一遍；人处理意见。
7. 访谈前后：准备提纲、整理纪要、把纪要对回底稿。

三、不会交出去
1. 核心论点和取舍：要回答哪个市场疑问、砍掉哪一半内容、哪个研究方向值得做。HN 上有人把这叫研究品味，认为是 AI 最弱的地方。
2. 署名和责任：评级、目标价、投资建议、论文的贡献声明。监管和学术规范都要求人负责。
3. 关系型取证：上市公司调研、专家电话、参考电话、创始人访谈。信息来自信任关系，且有内幕信息和合规边界。
4. 最终决策：投不投、选哪个技术栈上生产。
5. 生产经验本身：技术雷达规定没在生产里用过的不能进试验环，这种证据只能来自人和团队的实际使用。

## 出乎意料的发现

1. 摘要式的东西正在贬值，而且是被 AI 自己打掉的。arXiv CS 因为 LLM 让综述太容易写，干脆不再接收未经评审的综述。所以让 AI 帮我写一篇综述或一份行业报告不是这群人看重的交付物，他们缺的是成稿之前的底稿和成稿之后的维护。

2. 关于每日简报：我们原先的假设错了一半。年度报告作者确实每天读、每月打包，但那是为了喂给三四个月后的成稿。每日信息流的价值是进料，不是产品。把它做成带出处、按章节归档、成稿时可回溯的素材台账才对得上需求。

3. 时间不花在写上。复现的时间花在调试（约为实现的四倍），深度报告花在底稿，选型花在攒评测集（一年 20 个指标变近 200 个），长文花在改图和编辑（50 多小时）。而现有 AI 工具主打的恰恰是写。

4. 好东西是短的、砍出来的。State of AI 每年砍掉三到五成；NextView 的投资备忘不超过两页；卖方首席要求减少科普；论文只讲一到三个论断。deep research 产出 8,000 到 12,000 词的长报告，方向相反。

5. 对数字的信任是二元的。分析师的原话意思是表里有一处错整张表就不能用。但同一时期 19 位各行业测试者里有 7 位认为产出达到资深专业人士水平。分歧在于读者是不是那个数字所在领域的专家：专家要的是每个数能点回原始出处。

6. 实践者不信桌面调研写出来的选型报告。他们信的是自己负载上的实测和上过生产的经历，厂商对比表被当场挑出错误。纯靠读文档写的技术选型报告在这群人里没有信用。

7. 顶级报告公开承认自己一半预测是错的（10 中 5）。被看重的不是准确率，而是敢下可证伪的判断并事后打分。

8. 券商在自己发报告教人用 AI 自动写研报，同时分析师人数在降、招聘转向宏观和产业研究，而 2025 年底的新规把质控、合规、底稿要求明确延伸到产业研究报告。例行报告的自动化机构自己会做；留给外部工具的空间在深度报告的可追溯底稿。

9. 连最懂 AI 的人也不核对引用：NeurIPS 2025 录用论文中约 1.1% 含幻觉引用。引用核对是一个连顶尖用户都没解决的需求。

10. 外部评审是质量的一部分，而且是稀缺资源：年度报告十多位评审，期刊至少三位。AI 同事替代不了评审人的背书，但可以做评审前那一轮。

## 没查到的

一、本次条件限制
1. WebSearch 配额在开始时已用尽（200/200）。改用内置浏览器里的 Bing 搜索加直接抓取已知页面，覆盖面比正常搜索窄，英文从业者帖子尤其少。
2. WebFetch 的摘要模型出过一次错：把东吴证券的报告说成国元证券并编了细节，我直接读原页后已更正。下列页面我用浏览器读过原文核对：中证协执业规范、东吴证券报告、财联社分析师人数、State of AI 2025 发布文、arXiv 2303.18223、虎嗅元芳文章、两条 HN 讨论、Zeta Alpha 访谈、美团评测文章、人人都是产品经理 Thea 文章、专家网络价格页、Menlo 报告、Contrary 报告的章节标题、Understanding AI 文章、FutureSearch 文章、Lilian Weng FAQ。其余条目只经过 WebFetch 摘要，数字与我对这些公开来源的了解一致，但细节仍可能有偏差。

二、想打开但打不开的
1. 知乎全部被安全验证拦住（需点验证或登录），没有绕过。因此综述怎么写、论文复现不出来、券商深度报告要花多久等中文从业者回答都没读到。Bing 结果摘要里有一条知乎回答称高质量深度报告要跑至少 10 家公司、约 1 个月，我没能打开原文，只作为访谈线索，不算证据。
2. Reddit 在浏览器和抓取工具里都被禁止访问；顶会论文耗时的讨论只看到第三方转述。
3. Nature 两篇（研究者使用 AI 的调查、幻觉引用污染文献）跳转到登录页；Economist 无法抓取；ACM Computing Surveys 作者指南、Gartner 新闻稿、OpenAI Deep Research FAQ 返回 403；36氪被反爬页拦住；CSDN 多篇返回 521；证券日报连接中断；雪球页面内容不可读；虎嗅一篇 Deep Research 实测超时；Towards Data Science 一篇正文为空；SuperCLUE 首页没有方法说明。
4. Contrary Research 页面有 cookie 弹窗，我没有点接受或拒绝，只读了已显示的内容。

三、找了但没找到的
1. 一份真实的券商 AI 行业深度报告全文（页数、章节、图表数、引用了哪些数据源）。只看到摘要页。
2. A2 各类交付物的人周数：行业深度、技术尽调报告、选型报告各要几个人做多久。只有年度报告和复现有一手数字。
3. 真实的 AI 技术尽调报告和投委会备忘（保密，公开的只有模板和十多年前的旧备忘）。AI 技术尽调的一手自述很少，找到的多为服务商文章。
4. 中国咨询和研究机构（艾瑞、甲子光年、量子位智库、信通院）的方法说明和报告制作流程。
5. 付费情况：Wind、Choice、AlphaSense、CB Insights、PitchBook、慧博、发现报告的价格；中国 VC 为专家访谈付多少钱；研究者自费还是实验室报销 AI 工具。专家网络价格来自第三方汇编页而非各家官网。
6. 人群规模：中国做 AI 研究的人数、做 AI 行业研究的分析师人数、VC 中看 AI 的投资经理人数都没有来源。分析师 5,891 人是全行业数字，不是 AI 方向。
7. 研究者写综述的一手耗时自述（读了多少篇、几个人、几个月）。只有 arXiv 元数据显示的作者数和版本数。

四、只有访谈能回答的问题
1. 你上一份深度交付物从开题到交稿，各阶段实际各花了多少天？哪一步你最想甩出去？
2. 你愿不愿意让 AI 用你已登录的账号去读数据库、研报终端、论文全文？顾虑是账号被封、合规、还是数据外泄？（本次没有找到任何一手说法。）
3. 底稿现在长什么样、存在哪、谁在维护？质控或导师实际会翻底稿吗？
4. 一个数字要追溯到什么程度你才敢用：原始 PDF 的页码，还是来源机构名就够？
5. 你现在为哪些工具和数据自己掏钱，哪些是单位买的？AI 同事替你做底稿，你愿意付多少、谁来批预算？
6. 你试过 deep research 类工具后，哪一次让你决定不再用或只用于某一步？
7. 交付物发出去之后你还维护吗？多久一次？不维护的原因是什么？
8. 例行报告和深度报告在你的考核里各占多少？如果例行部分被自动化，省下的时间真的会用来写深度吗？
9. 对 A1：复现和基线在你的项目里占多少时间？你会让 AI 无人值守跑一夜实验并花你的算力额度吗？
10. 对技术选型的人：一份选型报告要有什么你才会签字？AI 跑出来的实测数据你信到什么程度？
