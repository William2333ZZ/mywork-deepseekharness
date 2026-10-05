# 技术经理 1：公司一级（CTO、技术 VP、CIO）

原始调研记录（2026-10-05）。关键陈述的复核结果见上一级目录的 `audit-tech-managers.md`；被复核改正或降级的地方以复核和报告正文为准。数字和说法以各条所附网址的原文为准。

## 人群

- **互联网/软件公司的 CTO、技术 VP、事业群技术一号位**：带几百到上万人研发的技术一号位，自己基本不写代码。例：飞猪 CTO 陈烨、Uber CTO、Superhuman 工程负责人、Imprint CTO Will Larson。
  - 要做的决定：公司在 AI 里做什么不做什么（年度/半年）；给全员配什么工具、多少 token 额度（按月调整）；哪些外部模型准用或禁用（事件驱动）；用什么口径度量和考核。错的代价见报道：Uber 年度 Claude Code 预算提前用完；Meta、Shopify 的 token 排行榜被刷后撤下；多邻国撤回把 AI 使用纳入绩效。
  - 现在读什么：内部用量和成本数据（Will Larson 每月至少看一次）；团队 Demo 日、黑客松、内部问卷；同级别闭门会和大会（GTLC、Snowflake CTO Circle）；技术媒体。材料由平台/效能团队、下属组长准备。没找到他们本人列出的日常阅读清单。
  - 规模：TGO 鲲鹏会自述学员超 2000 位（创始人、CXO、技术 VP 等），GTLC 单场 500+ 人 https://www.infoq.cn/article/2IZSlOkycOGWg0tyjal0 ；Snowflake 称 CTO Circle 首届到场 350+ 位 CTO https://www.infoq.cn/article/cFMO2oN8SyaR9vuUVUeQ ；LeadDev 报告页称调查 880+ 工程领导者 https://leaddev.com/the-ai-impact-report-2025 。中国整体人数：没有。
- **传统企业的 CIO、数字化部门负责人、CTO**：制造、零售、物流、金融等企业里负责数字化和 AI 落地的技术一把手。例：广汽数字化部部长刘倩、太古可口可乐（中国）数字化总经理冯柯、顺丰科技副总裁宋翔、英科医疗 CTO 陈坤、星巴克中国 CTO。
  - 要做的决定：自研还是买商业套件；公有云还是自建算力；选哪家模型和厂商；向集团争取多少预算、怎么分摊给业务部门；先做哪个场景。多为年度预算周期加项目制。错的代价见报道：某国有银行信用卡中心 300 万的知识库使用率长期低于 25%；广汽早期 AI 问答上线后准确率持续下降。
  - 现在读什么：同行企业实地考察（广汽去美的）；厂商交流和 demo；CXO 闭门会；咨询方法论（华为 IPD）；Gartner、IDC 报告。材料多由厂商、咨询方和内部数字化团队准备。
  - 规模：阿里云 CIO 团队称与十大行业 40 余家头部企业 CXO 对话 https://www.infoq.cn/article/jUUq67MUlQYq0146lADD ；极客时间企业版自述服务 3000+ 家企业 https://www.infoq.cn/article/4ySJ6K3Dg7D9FFT3YN24 。人群总数：没有。
- **创业公司技术合伙人、小公司 CTO（既写代码又带队）**：几人到几十人团队的技术负责人。写代码时是使用者；在给团队选工具套餐、选模型供应商、应对投资人和老板的 AI 要求时，是看材料做决定的人。
  - 要做的决定：团队用 Cursor、Codex 还是 Claude Code，买哪档（按月试用、按月换）；用 API 还是自建小模型；在国内怎么合规买到境外模型。错的代价：封号断供、额度一天用完、买了不合用的工具后重选。
  - 现在读什么：自己试用；团队试用一个月后的反馈和投票；V2EX、Hacker News、X 上同行的帖子。没人替他们准备，或由一个被指派的员工去发帖调研。
  - 规模：没有。
- **替他们准备材料的人：研发组长、技术经理（相邻人群，不是本次对象）**：要向 CTO 和 CFO 申请预算、解释模型差异的一线负责人。V2EX 上关于选型和采购的发帖人大多是这一层。
  - 要做的决定：不拍板。负责做对比、写调研、组织试用和投票。
  - 现在读什么：公开榜单、自己做的同题对比表、社区帖子。
  - 规模：没有。
- **海外对照：美国企业 CIO、CTO**：a16z、Menlo、MIT NANDA 调查覆盖的企业 AI 买方。
  - 要做的决定：模型采购已按传统软件采购流程走（清单、安全、价格）；多模型并用；应用层从自建转向采购。
  - 现在读什么：外部榜单做初筛，再加内部评测集和员工试用反馈；同行推荐和已有供应商。
  - 规模：a16z：100 位 CIO、15 个行业 https://a16z.com/ai-enterprise-2025/ ；Menlo：约 500 位美国企业决策者 https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/ ；NANDA：52 家机构访谈（PDF：https://mlq.ai/media/quarterly_decks/v0.1_State_of_AI_in_Business_2025_Report.pdf）。

## 一天、一周、一个事件

- **每天**：没找到公司级 CTO 自述每天读什么、读多久。能看到的只有：仍写代码的小公司 CTO 每天用 LLM 干活（HN 自称 CTO 的评论）；一位快手技术负责人说自己经常浏览 Product Hunt 看新产品；开发者帖子里的信息源是 X、公众号（量子位、新智元）、聚合站、B 站早报。
  - 时间：没有
  - 来源：<https://www.infoq.cn/article/P4LBQJIK5dY17awsxh0K> <https://www.v2ex.com/t/1214741> <https://news.ycombinator.com/item?id=48705943>
- **每周**：看用量：有公司每周统计 AI 使用量；Superhuman 工程负责人看每位工程师每周 PR 数的趋势。广汽转型期由一把手牵头周度研讨会。
  - 时间：没有
  - 来源：<https://www.v2ex.com/t/1200195> <https://www.infoq.cn/article/dX6llQs7kcIjeNQybMWO> <https://www.infoq.cn/article/uJeOpcZSZ2QRaovBjwRp>
- **每月**：Will Larson 每月至少看一次工具使用数据，追问重度用户在做什么、不用的人为什么不用；Superhuman 每月做一次员工问卷；Will Larson 的策略范例规定每月在高管周会上汇报进展；token 额度按月发放和调整（腾讯）。
  - 时间：频率：每月一次；时长没有
  - 来源：<https://lethain.com/company-ai-adoption/> <https://www.infoq.cn/article/dX6llQs7kcIjeNQybMWO> <https://lethain.com/llm-adoption-strategy/> <https://www.infoq.cn/article/rs0HJTRdN6Pl88LIFh1a>
- **半年、年度规划**：Will Larson 的策略范例写明六个月后刷新整份 LLM 策略；传统企业按年度预算，数字化部门争取预算下达后的自主分配权。
  - 时间：周期：六个月或一年
  - 来源：<https://lethain.com/llm-adoption-strategy/> <https://www.infoq.cn/article/uJeOpcZSZ2QRaovBjwRp>
- **做决定之前**：亲手做小项目建立直觉（Will Larson：读一本书，再做几个小项目）；让团队试用一个月再决定换不换；拿自己项目里的同一任务让不同模型做，把结果给全体开发看；内部投票；去同行企业考察。
  - 时间：Will Larson：每个小项目 2–10 小时；团队试用：一个月
  - 来源：<https://lethain.com/company-ai-adoption/> <https://www.v2ex.com/t/1202879> <https://www.v2ex.com/t/1220413> <https://www.v2ex.com/t/1183984> <https://www.infoq.cn/article/uJeOpcZSZ2QRaovBjwRp>
- **行业大会、闭门会、出国参访**：GTLC 两天（一天演讲、一天四个主题闭门会）；极客邦与 Snowflake 的硅谷参访团四天、近 50 人；Snowflake Summit 期间的 CTO Circle。
  - 时间：2 天；4 天
  - 来源：<https://www.infoq.cn/article/2IZSlOkycOGWg0tyjal0> <https://www.infoq.cn/article/RGDB7CQSi4E0rvOXzWMC> <https://www.infoq.cn/article/cFMO2oN8SyaR9vuUVUeQ>
- **出事的时候（封禁、涨价、下线、预算打穿）**：被动应对：美团限制豆包后要求业务自查并迁移；阿里宣布某日起禁用 Claude Code 并指定替代；GitHub Copilot 改按用量计费，计费切换前约一个月才给费用预览；Uber 预算提前用完后内部开始讨论 token 与招聘的取舍。
  - 时间：通知到生效：约一周到一个月
  - 来源：<https://www.infoq.cn/article/rs0HJTRdN6Pl88LIFh1a> <https://www.infoq.cn/article/XkAoNsINYJhsvJeKcZSa> <https://www.infoq.cn/article/LXegvvlZaOtPJEFJ9rEt>
- **被上级或同事问到的时候**：CEO、董事会、CFO 临时发问（能不能快一倍、国内外模型差多少、AI 是不是骗局），CTO 转头问下属或当场给一个指标。
  - 时间：没有
  - 来源：<https://www.infoq.cn/article/dX6llQs7kcIjeNQybMWO> <https://www.v2ex.com/t/1220413> <https://www.infoq.cn/article/jUUq67MUlQYq0146lADD>

## 需求

1. **当 CEO、董事会、CFO 或投资人问「AI 带来了什么、为什么花这笔钱、为什么不能再快一倍」时，我想拿出他们听得懂又站得住的指标和说法，以便守住预算和合理预期。**（原记录标为强）
   - 谁：所有层级的技术一号位；大公司和有投资人的创业公司最明显。
   - 痛在哪：没有单一可信的指标；上面的预期被同行 CEO 的公开说法抬高；token 用量和业务产出连不成一条线；非技术高管缺少判断框架，CTO 变成全职翻译。
   - 多频繁：董事会和高管会的固定汇报（月/季），加临时发问。具体频率没有数字。
   - 现在怎么办：用 PR 数趋势加每月问卷（Superhuman）；用「释放多少人力」的说法（阿里云 CIO）；把投入分成四类分别说明（星巴克中国 CTO）；把上级的想法翻译成一个小范围试验（Will Larson）；下属做对比表给 CTO 和 CFO 看。
   - 缺什么：当事人自己承认这些指标可以被刷、只能看趋势。Uber 高管公开说画不出 token 到产出的那条线。推断：缺的是能对外转述的、与同行可比的证据，而不是更多内部数字。
   - 证据：（转述）他说 CEO 和董事会开始问能否把速度提一倍；向他们汇报时总得给指标，他主要看每位工程师每周 PR 数的趋势，再配每月问卷。（Loic Houssier，Superhuman 工程负责人（AI 邮件应用公司）；InfoQ 编译的访谈） <https://www.infoq.cn/article/dX6llQs7kcIjeNQybMWO>
   - 证据：（转述）发帖人要申请预算买国外模型，CTO 和 CFO 来问国内外模型编程上差多少、买国内 Coding Plan 行不行。（fiht，自述研发团队组长（公司类型未说明），V2EX） <https://www.v2ex.com/t/1220413>
   - 证据：（转述）Uber 运营负责人说很难在 token 数据和「多产出 25% 有用功能」之间画出清晰的线；此前 CTO 透露 2026 年 Claude Code 预算已提前用完。（Andrew Macdonald（Uber 运营负责人）、Praveen Neppalli Naga（Uber CTO）；InfoQ 记者转述外媒） <https://www.infoq.cn/article/LXegvvlZaOtPJEFJ9rEt>
   - 证据：（转述）一场 CXO 闭门会上有 CEO 当场问 AI 是不是骗局；文章把 CIO 的新角色描述为把技术的现实约束翻译给业务高层。（InfoQ 对阿里云 CIO 团队报告的报道（厂商立场）） <https://www.infoq.cn/article/jUUq67MUlQYq0146lADD>
   - 证据：（转述）他说作为 CTO 顶回这些 AI 强制要求很费劲，几乎都来自 VC 和非技术人员。（cultofmetatron，自称 CTO，Hacker News 评论） <https://news.ycombinator.com/item?id=48705943>
   - 证据：（转述）一位药企采购 VP 说，买工具让团队更快，但不知道怎么量化这个影响、怎么向上证明。（财富 1000 强药企采购 VP，MIT NANDA 报告访谈（匿名）） <https://mlq.ai/media/quarterly_decks/v0.1_State_of_AI_in_Business_2025_Report.pdf>
2. **当新模型、新工具发布，或团队提出要换时，我想知道它在我们自己的任务上强多少、贵多少、风险在哪，以便决定跟不跟、选哪家。**（原记录标为强）
   - 谁：所有层级；自己不写代码的 CTO 最依赖别人的结论。
   - 痛在哪：公开榜单只差几个点，看不出实际差距；榜单好不等于内部场景稳定；CTO 自己不用，判断不了；买过不合用的工具。
   - 多频繁：模型发布驱动。Will Larson 的范例是半年系统性重看一次；小团队按月试用、按月换。
   - 现在怎么办：外部榜单做初筛，再内部试用加员工反馈（a16z）；拿自己项目的同一任务做对比表给全员看；内部投票；先只用一家、半年后再看（Will Larson）；厂商自建内部用例榜（超聚变约 1500 个用例）。
   - 缺什么：对比靠下属临时手工做，不可重复。推断：没看到任何公司有持续的「新模型在我们任务上的结果」跟踪；公开证据里只有超聚变这类厂商自己做了。
   - 证据：（转述）调查称企业越来越把 LM Arena 这类外部榜单当初筛；受访领导者说仍要自己试用并收集员工反馈才能选。37% 的受访者在用 5 个以上模型。（a16z 对 100 位企业 CIO 的调查和二十多位买方访谈（投资机构）） <https://a16z.com/ai-enterprise-2025/>
   - 证据：（转述）回帖人说他的 CTO 平时不写代码、不知道哪个好用；他用同一编码问题做国内外模型对比表，叫全体开发来看差距，最终公司采购了 GPT。（coryxu，一线开发/组长自述，V2EX） <https://www.v2ex.com/t/1220413>
   - 证据：（转述）策略写明先用 Anthropic（经 AWS Bedrock），暂不铺开多模型，六个月后刷新；理由是内部经验不足、此时切换成本低。（Will Larson，时任 Carta CTO，以虚构公司写的工程策略范例） <https://lethain.com/llm-adoption-strategy/>
   - 证据：（转述）公司先引入一款国产 AI 编码产品，实际使用没满足需求；后来内部选型投票 Claude Code 胜出，再派他调研落地路径。（CodeDaiQin，被指派调研的员工，V2EX） <https://www.v2ex.com/t/1183984>
   - 证据：（转述）记者写道，模型在公开榜单上表现很好，放进企业内部场景可能因上下文、权限、数据质量而不稳定；超聚变用自家约 1500 个真实用例做了内部榜。（InfoQ 记者；超聚变（厂商）） <https://www.infoq.cn/article/TLRAmZy8pPICVFVWmu6p>
   - 证据：（转述）他反对只看准确率、F1 等离线指标，认为有效的是访问量、复购率、任务完成率这类用户认可度指标。（陈烨，飞猪 CTO，InfoQ 专访） <https://www.infoq.cn/article/lwk5AQiWPSRPAxRPpM3W>
3. **当 AI 从个人试验变成全员工具时，我想看清谁在花、花在哪、值不值，并能提前估出账单，以便预算不被打穿。**（原记录标为强）
   - 谁：大公司 CTO 和 CFO；也包括 30 人规模的小团队。
   - 痛在哪：按 token 计费后账单事前算不清；额度一天用完；预算提前耗尽；钱花了但管理者看不到效果。
   - 多频繁：按月（额度、账单）；计费规则变动时集中爆发。
   - 现在怎么办：人均额度和上限（腾讯每月 1400 元起、特斯拉每周 200 美元、某公司 API key 每月 200 美元）；单日激增熔断（Shopify）；统一网关和多 Key（优刻得 CTO 的建议）；项目预算制。
   - 缺什么：有上限，但没有「值不值」的答案。优刻得 CTO 也说多数企业还没定义清楚任务和愿意付的成本。推断：缺的是按任务、按产出算的成本，而不是总量。
   - 证据：（原文）一位 CIO 说：“what I spent in 2023 I now spend in a week.”（匿名企业 CIO，a16z 调查；调查称受访企业预计未来一年 LLM 预算平均增长约 75%） <https://a16z.com/ai-enterprise-2025/>
   - 证据：（转述）GitHub Copilot 自 2026 年 6 月 1 日起改按用量计费；文章称 token 账单很难提前算清，GitHub 5 月初才提供费用预览。（InfoQ 记者报道（引 GitHub 官方博客）） <https://www.infoq.cn/article/XkAoNsINYJhsvJeKcZSa>
   - 证据：（转述）30 人团队买了一个月 Cursor Team，每人 20 美元额度，重度使用不到一天用完，超出多少会触发额外付费还不清楚。（HeyVincent，负责调研采购的员工，V2EX） <https://www.v2ex.com/t/1202879>
   - 证据：（转述）他说企业至少要有用量可见、日志审计、多 Key 管理和限流，不能全员共用一个 Key，否则成本异常时关不掉。（王凯，优刻得 CTO（云厂商，厂商立场），InfoQ WAIC 访谈） <https://www.infoq.cn/article/x4PTF8mgDBvtQQYa8B97>
   - 证据：（转述）他陪跑多家企业看到的最普遍症状是 token 消耗了不少，管理者却看不到效果。（杨瑞，英睿信息 CEO、TGO 鲲鹏会（厦门）负责人，GTLC 杭州站演讲（InfoQ 回顾稿）） <https://www.infoq.cn/article/MOVBghUgQrXWr9igbK2p>
   - 证据：（转述）Shopify 把 token 排行榜改为使用情况仪表盘，并设置个人单日花费激增即切断的熔断；特斯拉给员工设每周 200 美元上限。（InfoQ 记者转述外媒（Shopify 工程负责人 Farhan Thawar；特斯拉内部备忘录）） <https://www.infoq.cn/article/LXegvvlZaOtPJEFJ9rEt>
4. **当供应商涨价、封号、下线功能，或公司和监管禁用某个模型时，我想尽快知道影响面，并有能切过去的备选，以便业务不中断、计划不被打乱。**（原记录标为强）
   - 谁：中国公司尤其明显（境外模型买不到、国内大厂互相限制）；海外是切换成本问题。
   - 痛在哪：封号和断供；一年内多轮调价；平台功能说下线就下线；prompt 和 agent 流程为某一家调过，换起来费工程时间。
   - 多频繁：不定期。2025-08 到 2026-07 的报道里至少有：Cursor 调价、Claude 对中国的限制、Copilot 改计费、美团限豆包、阿里禁 Claude Code、豆包和千问下线智能体功能。
   - 现在怎么办：平台与模型解耦、多供应商（太古可口可乐、优刻得 CTO 的建议）；经云厂商 API 或中转站购买；员工自购报销；指定国产替代。
   - 缺什么：都是事后迁移。a16z 称 agent 工作流让切换成本在上升。推断：没看到有人提前掌握「哪些业务依赖哪家、换了会怎样」。
   - 证据：（转述）报道称美团通知限制使用豆包，要求业务自查并规划迁移，迁不了走专项审批；阿里自 7 月 10 日起禁用 Claude Code；豆包和千问 7 月 15 日下线智能体功能。（InfoQ《AI 周报》，记者转述「大厂日爆」等媒体） <https://www.infoq.cn/article/rs0HJTRdN6Pl88LIFh1a>
   - 证据：（转述）发帖人公司想买约 50 个 Claude Code 公司账号，现在靠员工自购报销但常封号；回帖称国内没有正规渠道，只能经云厂商 API，费用高很多。（0x47（发帖人）、SilencerL（回帖人），V2EX） <https://www.v2ex.com/t/1200488>
   - 证据：（转述）一位受访领导者说所有 prompt 都是为 OpenAI 调的，agent 的质量保证又不容易，换模型现在要花大量工程时间。（匿名企业技术领导者，a16z 调查） <https://a16z.com/ai-enterprise-2025/>
   - 证据：（转述）他说会把技术平台和大模型解耦，搭可迁移的平台，针对中国区的限制换用通义千问、DeepSeek，保证业务连续。（冯柯，太古可口可乐（中国）信息科技及数字化总经理，InfoQ 报道的 CIO 对谈） <https://www.infoq.cn/article/elIEmtKU92WkTKk6wDNh>
   - 证据：（转述）文章称 Cursor 不到一年多轮调价和限额；一位企业应用方说他们仍用 Cursor，因为 Claude Code 在国内企业侧还没找到可行的用法。（InfoQ 记者；受访企业应用方「瑞翔」（化名）） <https://www.infoq.cn/article/06ov3mEaQskNgP6gM9od>
   - 证据：（转述）编辑导语称模型层出现全球范围的准入门槛和封锁线，工具之争已和模型生态、合规深度绑定。（InfoQ 编辑导语（文章主体是腾讯云产品负责人访谈，厂商立场）） <https://www.infoq.cn/article/sOadSrAIOYT8ckqHIJx5>
5. **当要决定自建还是采购、私有化还是 API 时，我想看到同类公司真实的投入、效果和坑，以便不花冤枉钱。**（原记录标为强）
   - 谁：传统企业 CIO 和数字化负责人；有数据安全顾虑的中小公司。
   - 痛在哪：领导倾向自建而下属说不清长期成本；自建的知识库和平台没人用；预算递减下被迫自研；私有化后算力利用率低。
   - 多频繁：年度预算和立项时。
   - 现在怎么办：考察同行（广汽去美的）；核心领域自研、成熟系统外采（广汽）；先用通用模型再谈自研（英科医疗）；发帖问网友（V2EX）。
   - 缺什么：带样本的数字只有美国的（Menlo：76% 采购；NANDA：外部合作成功率约为自建两倍）。推断：中国决策者拿不到同量级的本土对照，只能靠个别考察和厂商说法。
   - 证据：（转述）报告称 2024 年 47% 的 AI 方案是内部自建，2025 年 76% 的用例是采购而来。（Menlo Ventures，约 500 位美国企业决策者调查（投资机构，持有 Anthropic 等）） <https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/>
   - 证据：（转述）报告称与外部合作的落地成功率约为内部自建的两倍。（MIT NANDA《The GenAI Divide》，52 家机构访谈（报告自述数据为方向性）） <https://mlq.ai/media/quarterly_decks/v0.1_State_of_AI_in_Business_2025_Report.pdf>
   - 证据：（转述）她说预算递减下不得不用自研替代商业套件压采购支出；主张影响核心竞争力的数据和业务领域自研，ERP 这类成熟系统可以外采。（刘倩，广汽集团数字化部部长，InfoQ 专访） <https://www.infoq.cn/article/uJeOpcZSZ2QRaovBjwRp>
   - 证据：（转述）不到 50 人的公司要搭内部 AI 助手，领导倾向自建 GPU 加开源小模型，发帖人倾向 API，但不确定长期 token 成本。（Aokiji，负责方案的员工，V2EX） <https://www.v2ex.com/t/1196345>
   - 证据：（转述）文章引公开信息：某国有银行信用卡中心投入 300 万元上线知识管理系统，使用率长期低于 25%。（InfoQ 对阿里云 CIO 团队报告的报道（厂商立场）） <https://www.infoq.cn/article/jUUq67MUlQYq0146lADD>
   - 证据：（转述）他说目前用通用大模型，计划启动自研模型，自有算力中心即将投用；现阶段鼓励创新，不能太计较成本。（陈坤，英科医疗 CTO，InfoQ 访谈） <https://www.infoq.cn/article/Tce0I3GbEKSjP2wbKoos>
6. **当我不确定自己踩的坑是不是普遍问题时，我想听到同级别同行不加修饰的经验，以便校准自己的判断。**（原记录标为强）
   - 谁：CIO、CTO 一级。这一条有最多的实际行为证据（付费、出差、参会）。
   - 痛在哪：公开叙事全是成功案例；公司内部没有同级的人可以对照；厂商的话不能全信。
   - 多频繁：大会和闭门会一年数次；出国参访一年一次量级。具体没有数字。
   - 现在怎么办：同侪组织和闭门会（TGO 鲲鹏会、GTLC）；出国参访团；厂商组织的 CXO 圈子；去同行企业考察；读同行的工作笔记（Will Larson）。
   - 缺什么：推断：这类交流低频、靠人脉、内容不留存，而且多由厂商或媒体组织，带立场。证据里没人说它「不够」，只看到大家持续为它花钱花时间。
   - 证据：（转述）文章说报告的起点是这位 CIO 的疑问：是不是只有他遇上这些坑；于是与 40 余家企业 CXO 对话数月。文中称越来越多 CIO 愿意讲踩过的坑。（InfoQ 对阿里云 CIO 团队报告的报道（厂商立场）） <https://www.infoq.cn/article/jUUq67MUlQYq0146lADD>
   - 证据：（转述）主办方称 TGO 鲲鹏会学员超 2000 位；GTLC 门票 2999 元、学员免费；第二天专设四个主题闭门会；过半参会者是技术一号位。（TGO 鲲鹏会（主办方自述）） <https://www.infoq.cn/article/2IZSlOkycOGWg0tyjal0>
   - 证据：（转述）作者说只凭个人见闻回来分享终究是二手信息，于是组团；参访团从 7 人扩到近 50 位创始人、CTO 和高管，行程四天。（郭多娇，Snowflake 中国市场总经理（厂商）） <https://www.infoq.cn/article/RGDB7CQSi4E0rvOXzWMC>
   - 证据：（转述）一位高管说每天收到大量自称最好的 GenAI 方案的邮件，建立信任才是难处，所以主要依赖同行推荐和人脉引荐。（匿名企业高管，MIT NANDA 报告访谈） <https://mlq.ai/media/quarterly_decks/v0.1_State_of_AI_in_Business_2025_Report.pdf>
   - 证据：（转述）广汽转型计划是在考察美的等企业的调研中成型的，一把手在调研归途拍板。（InfoQ 对广汽集团数字化部部长刘倩的专访） <https://www.infoq.cn/article/uJeOpcZSZ2QRaovBjwRp>
   - 证据：（转述）Snowflake 称工程领导者很少有机会公开对比彼此经验，首届 CTO Circle 到场 350 多位 CTO。（Snowflake 官方博客（厂商），InfoQ 转载） <https://www.infoq.cn/article/cFMO2oN8SyaR9vuUVUeQ>
7. **当每天被 demo、榜单、各种「AI 工具」推销和同行高调说法包围时，我想快速分清哪些是真的，以便不被厂商和舆论带着走。**（原记录标为强）
   - 谁：CIO、CTO 一级。
   - 痛在哪：demo 多、有用的少；所谓 AI 工具多是换了说法的 SaaS；CEO 圈的夸大说法制造同行压力。
   - 多频繁：持续。NANDA 受访者说每天都收到推销。
   - 现在怎么办：只信同行推荐和已有供应商（NANDA）；内部帮团队评估哪些工具有意义（Will Larson）；自己把厂商聊一遍（某化妆品公司 CIO）；媒体替读者筛选。
   - 缺什么：推断：筛选靠个人人脉和时间；没看到有人能系统地核对厂商说法。
   - 证据：（转述）一位 CIO 说今年看了几十个 demo，真正有用的也就一两个，其余是套壳或科研项目。（匿名 CIO，MIT NANDA 报告访谈） <https://mlq.ai/media/quarterly_decks/v0.1_State_of_AI_in_Business_2025_Report.pdf>
   - 证据：（转述）他发现相当多的所谓 AI 工具只是在营销里谈 AI 的 SaaS 厂商，公司内部在帮各团队评估哪些才有意义。（Will Larson，Imprint CTO，个人博客） <https://lethain.com/company-ai-adoption/>
   - 证据：（转述）一家知名化妆品公司的 CIO 在闭门会上说，他几乎和所有做 AI 智能营销的厂商聊了一遍，都没有结果。（InfoQ 对阿里云 CIO 团队报告的报道（厂商立场，转述闭门会）） <https://www.infoq.cn/article/jUUq67MUlQYq0146lADD>
   - 证据：（转述）文章指出创始人和 CEO 比工程师更相信 AI 编码工具；DX 一项 3.8 万人的研究里，开发者自估每周省约 4 小时（中位数）。（Gergely Orosz，The Pragmatic Engineer（作者是 DX 的投资人）） <https://newsletter.pragmaticengineer.com/p/software-engineering-with-llms-in-2025>
   - 证据：（转述）他说很多 CEO 对外宣称 95% 的代码由 AI 生成，他持保留态度，但这种风气让你不得不评估自己团队。（Loic Houssier，Superhuman 工程负责人） <https://www.infoq.cn/article/dX6llQs7kcIjeNQybMWO>
8. **当我在公司里推动全员用 AI 时，我想分清真实提效和为了指标的消耗，以便不把钱和注意力烧在表演上。**（原记录标为强）
   - 谁：推动 AI 转型的 CTO、技术 VP。
   - 痛在哪：用量指标一挂钩考核就被刷；工具用上了，产出没明显变化；强推引发抵触。
   - 多频繁：持续；按月复盘。
   - 现在怎么办：每月看用量并逐个追问原因（Will Larson）；撤掉排行榜、改叫仪表盘（Shopify、Meta）；用同类需求的端到端人月消耗来度量（阿里云 CIO）；不考核 token，靠单点案例带动（飞猪 CTO）。也有公司反过来强推：按 AI 率在团队间比拼，占比低约谈。
   - 缺什么：做法两极，没有共识。阿里云 CIO 的人月法、Superhuman 的 PR 数都被当事人说成只能看趋势。
   - 证据：（转述）他说对 AI 推广最大的担心，是公司只营造出在采用 AI 的印象而不是真的提高产出；他每月至少看一次用量数据。（Will Larson，Imprint CTO） <https://lethain.com/company-ai-adoption/>
   - 证据：（转述）报道称 Meta 下线了 token 排行榜；多邻国撤回把 AI 使用纳入绩效；Salesforce 设最低预期花费后有员工刷量。（InfoQ 记者转述外媒和员工说法） <https://www.infoq.cn/article/LXegvvlZaOtPJEFJ9rEt>
   - 证据：（转述）文章称某大型企业内部用 Cursor 后开发产出没有明显增加；阿里云 CIO 主张用同类需求的端到端人月消耗来衡量。（InfoQ 对阿里云 CIO 团队报告的报道（厂商立场）） <https://www.infoq.cn/article/jUUq67MUlQYq0146lADD>
   - 证据：（转述）他反对强制推行或 KPI 考核，做法是让小团队做出单点案例；强调不要机械地考核 token 量。（陈烨，飞猪 CTO） <https://www.infoq.cn/article/lwk5AQiWPSRPAxRPpM3W>
   - 证据：（转述）一位回帖人说公司自研了 IDE 和模型平台，强制用 AI 编码，AI 生成代码占比低会被约谈；另一位说公司每周统计 AI 使用量。（toma77、uCharles，员工自述，V2EX） <https://www.v2ex.com/t/1200195>
   - 证据：（转述）他给团队设了「AI 率」指标，不同团队口径不同，团队之间会比拼。（王东旭，快手磁力引擎风控技术负责人，InfoQ 直播整理） <https://www.infoq.cn/article/P4LBQJIK5dY17awsxh0K>
9. **当我已经不在一线写代码、却要对 AI 路线拍板时，我想用很少的时间亲手摸到真实的能力边界，以便不靠二手叙事做判断。**（原记录标为中）
   - 谁：脱离一线的 CTO、CEO；V2EX 上下属的抱怨集中在这类人。
   - 痛在哪：不用就判断不了，下属公开嘲讽；只做了一次 demo 又会高估。
   - 多频繁：新一代工具出现时。没有数字。
   - 现在怎么办：读一本书加几个小项目（Will Larson）；CEO 亲自用 Claude Code 做原型（猎豹）；让团队演示。
   - 缺什么：V2EX 的反例：老板用 Claude 做完一个 demo 后，认定 AI 远超普通程序员，要求全流程交给 AI。推断：亲手试一次不等于看清边界，缺的是生产环境里的对照。
   - 证据：（转述）他先读了 Chip Huyen 的《AI Engineering》，再做了几个小项目，每个 2 到 10 小时；做完才觉得工具调用不再神秘。（Will Larson，Imprint CTO） <https://lethain.com/company-ai-adoption/>
   - 证据：（转述）他说 CEO 不亲自用 Claude Code 做出让自己兴奋的原型，就推不动下一步。（李靖瑜，猎豹移动集团总经理，GTLC 杭州站演讲（InfoQ 回顾稿）） <https://www.infoq.cn/article/MOVBghUgQrXWr9igbK2p>
   - 证据：（转述）多条回帖让 CTO 自己去试；有人说自己的 CTO 平时不写代码，只是问豆包做 PPT。（V2EX 回帖者（一线开发）） <https://www.v2ex.com/t/1220413>
   - 证据：（转述）老板用 Claude 做完一个系统 demo 后，认为 AI 已远超一般程序员，要求只给目标和约束、其余全交给 AI，连 SPEC 范式都不认可。（sdww8591193，员工自述，V2EX） <https://www.v2ex.com/t/1205270>
10. **当员工自己把 AI 工具带进来，或团队想用境外模型时，我想有清楚的可用边界和合规的采购路径，以便既不挡生产力，也不担数据和法律风险。**（原记录标为强）
   - 谁：所有公司；中国公司多一层境外模型的合规问题。
   - 痛在哪：员工用个人账号干活，公司不知情；多数公司没有使用规范；想用的模型没有正规购买渠道。
   - 多频繁：持续；安全事件或政策变化时收紧。
   - 现在怎么办：一刀切拦截并给申请入口（京东）；只准用自建平台；经海外主体或云厂商 API 购买；默许员工自购报销。
   - 缺什么：推断：现有做法在「全禁」和「放任」两头。V2EX 帖子里有人直接质疑某些方案是在给违规的事做合规包装。
   - 证据：（转述）报告称只有约 40% 的公司买了官方 LLM 订阅，但 90% 以上受访公司的员工经常用个人 AI 工具干活。（MIT NANDA 报告） <https://mlq.ai/media/quarterly_decks/v0.1_State_of_AI_in_Business_2025_Report.pdf>
   - 证据：（转述）报告称 27% 的 AI 应用支出来自个人先用起来再转企业合同，算上员工自费的影子使用接近 40%。（Menlo Ventures 调查） <https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/>
   - 证据：（转述）报道称京东 3 月底起拦截员工访问外部 AI 网站，拦截页提供自研模型入口和外部 AI 申请入口。（InfoQ《AI 周报》，记者转述「大厂日爆」） <https://www.infoq.cn/article/pp8VUCpuJENbkWr169ec>
   - 证据：（转述）调研帖的回帖里，有人说公司没有 AI 规范、都是自己搞；有人问大家公司不介意代码直接暴露给模型提供商吗。（V2EX 回帖者（员工）） <https://www.v2ex.com/t/1200195>
   - 证据：（转述）有回帖说发帖人是在请教如何给一件明确违规的事做合规；也有人给出经海外主体购买 AWS Bedrock 再内部封装下发的做法。（V2EX 回帖者） <https://www.v2ex.com/t/1183984>
   - 证据：（转述）调查称安全在访谈中被反复强调，安全和成本的权重已追上准确率。（a16z 调查） <https://a16z.com/ai-enterprise-2025/>

## 信什么，不信什么

- 信在自己项目上跑出来的对比，不信榜单分数：CTO 说 benchmark 只高几个点，回帖者的办法是拿自己项目的复杂任务让模型做、给全员看结果 https://www.v2ex.com/t/1220413
- 外部榜单只当初筛，像过去用 Gartner 魔力象限；最终靠内部评测集、试用和员工反馈 https://a16z.com/ai-enterprise-2025/
- 信同行推荐和已有供应商，不信陌生厂商的推销：受访高管说宁可等现有合作方加上 AI，也不赌创业公司 https://mlq.ai/media/quarterly_decks/v0.1_State_of_AI_in_Business_2025_Report.pdf
- 信员工已经在用、喜欢用的品牌：多位 CIO 说买企业版 ChatGPT 是因为员工喜欢它 https://a16z.com/ai-enterprise-2025/
- 不信只讲成功的案例，更信讲踩坑的同行：阿里云 CIO 的报告和 Snowflake 的 CTO Circle 都以「不是修饰过的成功故事」为卖点（两者都是厂商说法）https://www.infoq.cn/article/jUUq67MUlQYq0146lADD ；https://www.infoq.cn/article/cFMO2oN8SyaR9vuUVUeQ
- 不信其他公司 CEO 的「95% 代码由 AI 生成」这类说法，但承认它制造同行压力 https://www.infoq.cn/article/dX6llQs7kcIjeNQybMWO
- 对下属的结论：不只听一个人说，而是让团队一起看对比、投票。下属也知道这点，会有意少说、让大家说 https://www.v2ex.com/t/1220413 ；https://www.v2ex.com/t/1183984
- 对内部用量数字：PR 数、token 量都可以被刷，只当提问的起点，不当结论 https://www.infoq.cn/article/dX6llQs7kcIjeNQybMWO ；https://www.infoq.cn/article/LXegvvlZaOtPJEFJ9rEt
- 对 AI 的输出：业务侧因为「偶尔惊艳、经常翻车」不信，CTO 的办法是加规则兜底、可信度评分、低分转人工 https://www.infoq.cn/article/lwk5AQiWPSRPAxRPpM3W
- 对自评：IDC 分析师称超过 60% 的企业自认 AI 应用较成熟，按成熟度模型测算后多数在早期探索阶段（深信服相关稿件引用，厂商立场）https://www.infoq.cn/article/Gz4w1NVNIJjs8fZOaQZD
- 信亲手做过的：Will Larson 认为高层亲自钻进细节是对抗「做样子」的少数办法之一 https://lethain.com/company-ai-adoption/
- 对厂商工具的保留：多数所谓 AI 工具只是营销里谈 AI 的 SaaS https://lethain.com/company-ai-adoption/ ；今年看了几十个 demo 只有一两个有用 https://mlq.ai/media/quarterly_decks/v0.1_State_of_AI_in_Business_2025_Report.pdf

## 工具和花费

- **Cursor Team**（团队 AI 编码）：每人每月 20 美元套餐内额度，超出另计（帖主称重度使用不到一天用完）；谁付：公司 <https://www.v2ex.com/t/1202879>
- **Claude Code（官方订阅、云厂商 API、中转）**（AI 编码 agent）：帖中报价：中转约 400 元/月；转售号 1888 元一个；云厂商 API 比订阅贵很多。另一文提到个人每月 200 美元档；谁付：公司采购，或员工自购后报销 <https://www.v2ex.com/t/1200488>
- **GitHub Copilot**（AI 编码）：Pro 每月 10 美元含 1000 Credits，Pro+ 每月 39 美元含 3900 Credits；2026-06-01 起按 token 折算；谁付：公司或个人 <https://www.infoq.cn/article/XkAoNsINYJhsvJeKcZSa>
- **公司内部 token 额度**（全员调用模型）：腾讯：技术族每月 1400 元起、非技术族 700 元，实际多在 2000 元以上；特斯拉：每周 200 美元上限；V2EX 某公司：API key 每月 200 美元；谁付：公司 <https://www.infoq.cn/article/rs0HJTRdN6Pl88LIFh1a>
- **AI 工具报销**（员工自选 AI 服务）：飞猪：最高每月 1000 元，可申请增加；谁付：公司 <https://www.infoq.cn/article/VK4MLI3LtolekTLVT0Gt>
- **Salesforce 内部的花费指引**（Claude Code 和 Cursor 用量）：报道称上限为 Claude Code 每月 250 美元、Cursor 每月 170 美元，可点击解除；谁付：公司 <https://www.infoq.cn/article/LXegvvlZaOtPJEFJ9rEt>
- **国产 Coding Plan（GLM、MiniMax）**（内部 AI 助手的模型来源）：帖主列的价：GLM Max 年付约 4000 元，MiniMax Ultra 年付约 8000 元；谁付：公司 <https://www.v2ex.com/t/1196345>
- **OpenAI 全员版，加 Cursor，加经 AWS Bedrock 的 Claude Code**（Imprint 公司的标准配置）：没有；谁付：公司 <https://lethain.com/company-ai-adoption/>
- **GTLC 全球科技领导力大会（TGO 鲲鹏会）**（同级别交流、闭门会）：门票 2999 元/人；TGO 学员免费（会费没查到）；谁付：没有（个人或公司未说明） <https://www.infoq.cn/article/2IZSlOkycOGWg0tyjal0>
- **硅谷参访团（极客邦、TGO 鲲鹏会与 Snowflake 合办）**（拿一手信息、闭门交流）：没有；谁付：没有 <https://www.infoq.cn/article/RGDB7CQSi4E0rvOXzWMC>
- **LLM 网关和 AI 成本治理工具（SI-LLM-Gateway、EvoLink、深信服算力网关等）**（多账号管理、成本可见、数据不出内网。这是厂商认为需求所在）：没有；谁付：公司 <https://www.infoq.cn/article/MOVBghUgQrXWr9igbK2p>
- **外部榜单（LM Arena 等）**（模型初筛）：免费；谁付：无 <https://a16z.com/ai-enterprise-2025/>
- **企业 AI 认证培训（阿里云大模型认证、极客时间企业版）**（全员 AI 通识，统一语境）：没有；谁付：公司 <https://www.infoq.cn/article/KjOQP8efoU9WgUktr26f>

## 现在怎么用 AI

- 没找到公司级 CTO 用 AI 来跟进资讯或准备决策材料的直接自述。能找到的用法几乎都是写代码和内部流程。
- 仍写代码的小公司 CTO 每天用 LLM 干活；有自称 CTO 的人说几乎每天都遇到模型钻错方向的问题，要在它选文件那一步人工干预（HN 检索接口返回的评论原文，未单独打开页面）https://news.ycombinator.com/item?id=46982512
- Will Larson 自己搭内部 agent：评论 Notion 文档、回复 Slack、分诊 Jira；所有 prompt 集中放在全员可读的 Notion 库里 https://lethain.com/company-ai-adoption/
- 前阿里 CTO 鲁肃在大会上说让 AI 给自己列了「十大罪状」，结果条条属实。这是高管把 AI 用于自我审视的一例 https://www.infoq.cn/article/MOVBghUgQrXWr9igbK2p
- 下属描述的 CTO 用法很浅：平时问豆包做 PPT https://www.v2ex.com/t/1220413
- 失败处一：对内部数据的问答准确率随时间下降，幻觉变多（广汽经营驾驶舱的 AI 问答）https://www.infoq.cn/article/uJeOpcZSZ2QRaovBjwRp
- 失败处二：业务侧因「偶尔惊艳、经常翻车」不信任，需要兜底机制 https://www.infoq.cn/article/lwk5AQiWPSRPAxRPpM3W
- 失败处三：用了工具但产出没变。某大型企业用 Cursor 后产出没有明显增加 https://www.infoq.cn/article/jUUq67MUlQYq0146lADD ；DX 研究里开发者自估每周省约 4 小时，一半开发者一周用不到一次 https://newsletter.pragmaticengineer.com/p/software-engineering-with-llms-in-2025
- 不用的人：即使公司买了国外服务包月，也有同事坚持手写代码（阿里高级前端技术专家汤威）https://www.infoq.cn/article/P4LBQJIK5dY17awsxh0K
- 开发者（不是 CTO）已经在用 AI 跟进资讯：让 codex 起每日任务总结 AI 新闻、把开源的信息源清单接进 agent 每天早上推送；同帖也有人提醒 AI 的归纳会很有条理地胡说 https://www.v2ex.com/t/1214741
- 「不需要」的证据：同一帖里有人说少看没事，风口过几天就变，看多了只加重 FOMO；也有人说重要的信息总会自己传到你面前。这是开发者的看法，不是 CTO 的 https://www.v2ex.com/t/1214741

## 已经交出去的

- 模型和工具的对比、调研材料：交给研发组长或被指派的员工，他们再去社区发帖问 https://www.v2ex.com/t/1220413 ；https://www.v2ex.com/t/1183984
- 选工具、提需求：Will Larson 的策略范例里由开发者体验团队和内部工具团队负责提供工具，有新工具再提交工程高管评审 https://lethain.com/llm-adoption-strategy/
- 模型评估：内部评测集、标准答案集和开发者反馈由团队做 https://a16z.com/ai-enterprise-2025/
- 判断「什么算好」的评测：交给业务专家，IT 部门当「数字员工提供商」（阿里云 CIO 团队的做法）https://www.infoq.cn/article/jUUq67MUlQYq0146lADD
- token 额度的分配：交给 HR 按上月消耗调配（腾讯）https://www.infoq.cn/article/rs0HJTRdN6Pl88LIFh1a
- 成本异常的拦截：交给熔断和网关（Shopify）https://www.infoq.cn/article/LXegvvlZaOtPJEFJ9rEt
- 全员 AI 通识：交给认证培训 https://www.infoq.cn/article/KjOQP8efoU9WgUktr26f
- 筛信息、找同行：交给同侪组织和媒体（TGO 鲲鹏会、GTLC）https://www.infoq.cn/article/2IZSlOkycOGWg0tyjal0
- 应用层：越来越多直接买现成的（Menlo：76% 的用例是采购）https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/

## 不交的

- 公司在 AI 里做什么、不做什么：飞猪 CTO 说先回答想成为什么样的公司，再定投入，并亲自划出两类不做的方向 https://www.infoq.cn/article/lwk5AQiWPSRPAxRPpM3W
- 供应商的最终批准：Will Larson 的范例里厂商审批放在 CTO 频道 https://lethain.com/llm-adoption-strategy/
- 亲手建立直觉：Will Larson 认为这是技术领导欠团队的基本功 https://lethain.com/company-ai-adoption/
- 向 CEO 和董事会解释：Superhuman 工程负责人自己拿指标去汇报；阿里云 CIO 把自己定位成向上的翻译 https://www.infoq.cn/article/dX6llQs7kcIjeNQybMWO ；https://www.infoq.cn/article/jUUq67MUlQYq0146lADD
- 出事后的责任：阿里云 CIO 团队的说法是责任一定在正式员工身上，AI 只是外包性角色 https://www.infoq.cn/article/jUUq67MUlQYq0146lADD
- 预算的自主分配权：广汽数字化部部长争取的唯一一项权利就是预算下达后自己分 https://www.infoq.cn/article/uJeOpcZSZ2QRaovBjwRp
- 安全准入（禁用或放行某个模型）：公司层面统一决定（阿里禁 Claude Code、京东拦截外部 AI）https://www.infoq.cn/article/rs0HJTRdN6Pl88LIFh1a ；https://www.infoq.cn/article/pp8VUCpuJENbkWr169ec
- 看用量数据并追问原因：Will Larson 自己每月看 https://lethain.com/company-ai-adoption/

## 和亲手做研究的人有什么不同

- 他们要的是能转述给 CEO、CFO、董事会的结论和指标，而不是更深的材料。证据：汇报时「总得给指标」https://www.infoq.cn/article/dX6llQs7kcIjeNQybMWO ；CTO 和 CFO 要的是「通俗解释」https://www.v2ex.com/t/1220413
- 判断依据是自己业务上的试用结果加同行口碑，而不是论文和 benchmark。证据：a16z 把外部榜单定位为初筛 https://a16z.com/ai-enterprise-2025/ ；NANDA 的买方靠同行推荐 https://mlq.ai/media/quarterly_decks/v0.1_State_of_AI_in_Business_2025_Report.pdf
- 节奏是月度复盘、半年刷新策略，加上被事件触发，而不是每天追。证据：Will Larson 每月看数据、六个月刷新 https://lethain.com/llm-adoption-strategy/ ；封禁和调价的通知到生效只有一周到一个月 https://www.infoq.cn/article/rs0HJTRdN6Pl88LIFh1a
- 关心的维度不同：成本、合规、切换成本、组织阻力、谁担责，重于模型能力本身。a16z 称多数任务上模型都够用，所以价格和安全更重要 https://a16z.com/ai-enterprise-2025/ ；阿里云 CIO 团队称卡住项目的往往不是技术 https://www.infoq.cn/article/jUUq67MUlQYq0146lADD
- 信息大多经下属、厂商、媒体转过一手。痛点是转手后的失真和被带着走，而不是找不到原始材料。证据：CTO 引用榜单分差来质疑下属 https://www.v2ex.com/t/1220413 ；CIO 看了几十个 demo https://mlq.ai/media/quarterly_decks/v0.1_State_of_AI_in_Business_2025_Report.pdf
- 亲手做只是为了有直觉（几个 2–10 小时的小项目），不产出研究 https://lethain.com/company-ai-adoption/
- 他们花钱花时间买的是「和同级的人坦率交流」（会议、闭门会、参访），而不是数据库或论文工具 https://www.infoq.cn/article/2IZSlOkycOGWg0tyjal0 ；https://www.infoq.cn/article/RGDB7CQSi4E0rvOXzWMC

## 意外的发现

- 很多 AI 工具不是 CTO 选的，而是员工先用起来、公司后补合同：Menlo 称 27% 的应用支出这样进来；NANDA 称 40% 的公司买了订阅而 90% 的公司员工在用个人工具。「给团队配什么工具」这个决定有一部分已经被自下而上地做掉了 https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/
- 压力方向常常是自上而下：自称 CTO 的人说自己在顶回投资人和非技术高管的 AI 强制要求；Will Larson 的文章教人怎么把高管对 LLM 的执念翻译成有用的事。CTO 不总是推动者，有时是刹车 https://news.ycombinator.com/item?id=48705943 ；https://lethain.com/executive-translation/
- 在中国，「买不买得到」先于「好不好」：境外模型的合规采购路径本身就是决策难题，V2EX 上相关帖子的回复全在讲中转、海外主体、封号 https://www.v2ex.com/t/1200488
- 「选哪个模型」的重要性在下降：a16z 称多数任务上模型都够用，价格变成主要因素；Will Larson 的策略干脆先只用一家。需求更多在成本、切换和治理上，而不在追最新模型 https://a16z.com/ai-enterprise-2025/
- 自建不占优：NANDA 称内部自建失败率是外部合作的两倍，Menlo 称采购占 76%。但中国传统企业受访者（广汽）仍强调核心领域自研 https://www.infoq.cn/article/uJeOpcZSZ2QRaovBjwRp
- 把 token 用量当先进性指标的做法在一年内被多家公司自己撤回（Meta、Shopify、多邻国）https://www.infoq.cn/article/LXegvvlZaOtPJEFJ9rEt
- 一线对「CTO 向下属问模型差异」的反应是成片的嘲讽（「CTO 干啥吃的」）。CTO 的认知滞后在下属那里是公开的 https://www.v2ex.com/t/1220413
- Will Larson 发现全员 AI 推广里很大一块其实是账号开通和权限控制这类琐事 https://lethain.com/company-ai-adoption/
- 开发者社区里相当多的人认为不需要实时跟进 AI 资讯，免费渠道（X、公众号、聚合站）被认为够用 https://www.v2ex.com/t/1214741

## 来源说明

- 检索受限：内置浏览器标签页已达上限，没能新开自己的标签页，也没有动别人的。用 HTTP 直接取 Bing 时结果退化成只匹配首词，不可用。改用了极客邦站内搜索接口（覆盖 InfoQ）、sov2ex（V2EX）、HN Algolia、36氪搜索接口和已知网址。因此中文来源集中在 InfoQ/极客邦系和 V2EX；公众号、即刻、知乎、晚点、少数派、腾讯云和阿里云开发者社区基本没有覆盖。
- InfoQ 文章是通过该站自己的文章接口取正文阅读的，网址是对应的文章页。
- 同源提醒一：阿里云 CIO 蒋林泉相关的四篇（jUUq67MUlQYq0146lADD、elIEmtKU92WkTKk6wDNh、KjOQP8efoU9WgUktr26f、4ySJ6K3Dg7D9FFT3YN24）是同一个人、同一套方法论，由极客邦系媒体报道，带云厂商立场。向上解释、自建还是采购、同行真话、过滤厂商噪音、度量真实提效这五条需求里都用到了它，不能当成多个独立来源。
- 同源提醒二：Will Larson 的四篇博客是同一作者。向上解释、选型、过滤噪音、度量、亲手试这五条都用到了他。他是美国金融科技公司 CTO，偏成熟的工程管理视角。
- 同源提醒三：InfoQ 关于 token 的几篇（LXegvvlZaOtPJEFJ9rEt、XkAoNsINYJhsvJeKcZSa、VK4MLI3LtolekTLVT0Gt）和两期《AI 周报》是记者汇编外媒和「大厂日爆」的二手转述，不是当事人自述。成本可见、供应商突变、度量、安全边界四条靠它们支撑事件层面的事实。
- 厂商稿：Snowflake 相关两篇（硅谷参访团、CTO Circle）、深信服相关一篇（引 IDC）、超聚变一篇、腾讯云 CodeBuddy 访谈、优刻得 CTO 访谈。只用来说明「厂商认为需求在哪」和事件事实，文中已标注。
- 调查的立场和地域：a16z 和 Menlo 是投资机构（Menlo 持有 Anthropic 等），样本是美国企业；NANDA 的 95% 失败率来自 52 家机构访谈，报告自己说只是方向性数据；Pragmatic Engineer 作者是 DX 的投资人。没有打开到任何中国的带样本调查原文。
- V2EX 的发帖人多是一线开发和组长。帖子里的「CTO」是被描述的对象，带下属视角的偏见；回帖里混有中转站广告。sov2ex 返回的回复数不准。
- Hacker News 上自称 CTO 的身份无法核实，多为小公司且仍写代码的人。
- 时间范围：2024-05 到 2026-09。2024–2025 的材料偏选型和自建还是采购，2026 的材料偏 agent、token 成本和组织考核。Will Larson 2024 年策略里「切换便宜」的判断，已被 a16z 2025 年「切换成本上升」的发现修正。
- CTO Craft 的文章页只读到了活动和工作坊简介，正文没有加载出来，没有作为证据引用。
- 我在极客邦搜索结果里看到 InfoQ 写作社区有大量「权威榜单 TOP」类营销稿。这只是搜索结果层面的观察，没有逐篇打开，未作为证据。

## 没查到的

- 公司级 CTO 每天、每周实际花多少时间看 AI 信息：没找到任何带数字的本人自述。唯一的时间数字是 Will Larson 的「每个小项目 2–10 小时」和「每月看一次用量」。
- 中国 CTO 具体读哪些公众号、Newsletter、播客，听谁的：没找到本人自述，只有开发者帖子里的清单。需要访谈。
- 决策材料长什么样（内部选型报告、评测表、给董事会的 AI 汇报）：中国没有公开样本；海外只有 Will Larson 的虚构公司策略范例。
- 中国带样本的 CTO、CIO 调查（信通院、IDC 中国原文、TGO 鲲鹏会的调研）：没有打开到原文。IDC 的数字只见于厂商相关稿件的转引。
- 为「跟上变化」付多少钱、谁出：TGO 鲲鹏会会费、Gartner 一类分析师订阅、参访团价格都没查到；只有 GTLC 门票 2999 元。
- CTO 是否已经用 AI（深度研究类功能）准备决策材料、信不信：没有直接证据。
- 模型版本下线对已上线业务的具体冲击（迁移花了多久、多少钱）：只有新闻层面的禁用和下线，没有当事技术负责人的复盘。
- 「招什么人」这个决定需要看什么材料：几乎没有材料，只有招聘偏好的表述（好奇心、韧性、复合型）。
- 创业公司技术合伙人在即刻、少数派上的自述：即刻要登录，少数派站内搜索不相关，掘金有验证页，都没有绕过。
- LeadDev《AI Impact Report 2025》（880+ 工程领导者）要登录才能看；Gartner 新闻页返回 403；都没读到。
- 内置浏览器没能用上，通用搜索引擎的结果没有覆盖到。如果后续能开标签页，建议补搜：公众号上 CTO 本人写的选型复盘、晚点和 36 氪对技术负责人的专访、腾讯云和阿里云开发者社区的落地调查。

