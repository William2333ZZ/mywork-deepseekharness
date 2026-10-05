# 技术经理 2：团队一级（总监、经理、组长、tech lead）

原始调研记录（2026-10-05）。关键陈述的复核结果见上一级目录的 `audit-tech-managers.md`；被复核改正或降级的地方以复核和报告正文为准。数字和说法以各条所附网址的原文为准。

## 人群

- **互联网/AI 公司的一线技术经理、TL、小组长（带 3–30 人）**：自己还写一部分代码或做 review 的团队负责人。证据里的典型身份：研发团队组长（V2EX fiht）、带 8–9 人的小团队负责人（V2EX tim9527）、30 人团队负责采购的人（V2EX Liamccc）、海外的 EM / tech lead（HN pron、LeadDev 受访者）。他们在这些时候是「看的人、做决定的人」：给团队选编程智能体和模型额度、向 CTO/CFO 解释为什么买、看团队的 AI 用量和产出、面试和带新人；在自己动手做对照测试时又变成「做调研的人」——中国的帖子里这两个身份经常是同一个人。
  - 要做的决定：团队用哪个编程智能体和模型、额度怎么分、各自报销还是统一采购（V2EX 1197618、1210111 都是「以前各自为战，现在要统一」的时点）；AI 提效怎么向上报数（V2EX 1206486）；招什么人（V2EX 1235472）。频率：证据里是事件驱动（领导要统一采购、新模型发布、成本超支、预算周期），没有固定周期的数字；有人说国内模型「约三个月一变」。错了的代价：买了放一边继续各自为战（1197618 rockddd）、token 被少数人几天烧掉几百美元（1210111）、出问题由提建议的人背锅（1220413 boogoogle、1197618 cs419）。
  - 现在读什么：同行论坛发帖直接问（V2EX 多帖）、X、公众号（量子位、新智元等）、Hacker News、B 站早晚报、电报群（V2EX 1214741）；工具自带的用量看板；团队里重度使用者的口碑。没有看到有人替他们准备材料——反而是他们替 CTO/老板准备。
  - 规模：没有中国这类人群的规模数字。旁证：Pragmatic Engineer 2026 调查 906 名受访者里 34% 是工程管理层（经理、总监、staff+），以欧美为主（https://newsletter.pragmaticengineer.com/p/ai-tooling-2026）。
- **创业公司技术负责人 / 技术合伙人（几人到十几人，自己重度写代码）**：刻意把团队压到两三人、自己和 AI 持续对话做设计的负责人（InfoQ 访谈里的 Kreditz AI Orchestrator 马工）；海外对照是 Imprint 的 Will Larson（亲手写了约 3000 行的内部 agent 平台）。他们大部分时间是做的人，只有在定供应商、定套餐、定团队规模时是决定的人。
  - 要做的决定：订阅还是 API、Team Plan 额度不够怎么办（马工：公司只能用 Team Plan，超出走 API 贵约十倍）；全公司统一用哪家（Larson：全员 OpenAI，工程另配 Cursor 和 Claude，Claude Code 走 AWS Bedrock）；要不要用 SaaS「AI 工具」（Larson 认为大多数只是营销话术）。频率没有数字。错了的代价主要是钱和时间，没看到「背锅」类表述。
  - 现在读什么：主要靠自己用：Larson 先读 Chip Huyen《AI Engineering》再做几个小项目；马工只信在真实生产系统里跑过真金白银业务的案例。没人替他们准备。
  - 规模：没有。旁证：Pragmatic Engineer 调查里最小的公司 75% 用 Claude Code（同上链接）。
- **传统企业 / 国企 / 金融里负责 AI 落地的技术负责人**：国企开发团队里被领导指派去统一采购的人（V2EX Newbee24：国企不让用国外套餐，还有信创要求）、有信创项目所以只能选国内工具的团队（V2EX qi19901212）、众安银行技术委员会主席沈斌、星巴克中国 CTO 罗金鹏（偏高一级，作对照）。
  - 要做的决定：只能在国产模型和国内企业版 AI IDE 里选哪家（Comate / Qoder / CodeBuddy / Trae，V2EX 1197169）；能不能开票、能不能对接内部账号体系、有没有研发效率数据给老板看（1197618 bennydeng7）；预算要和财务一起出报告上投资委员会、按三到五年算回报（星巴克中国）。还有「领导让弄一个垂直领域模型用来拿政策支持」这种自上而下的任务（V2EX 1145197）。错了的代价：合规和稳定性的事都落到提方案的人头上（1220413 Fruktozka）。
  - 现在读什么：论坛问同行、找云厂商销售谈（1197618 nrtEBH）、厂商和培训机构组织的闭门会（极客邦研讨会）。没有看到他们自己的长文自述。
  - 规模：没有。
- **大厂研发效能 / 平台负责人（给上千人选工具、定度量）——相邻人群，作对照**：菜鸟研发总监郭凤钊、美团工程效率负责人程大同、快手研发效能委员会、Monzo 平台团队负责人 Suhail Patel。
  - 要做的决定：自研还是引入市场上的编程智能体（菜鸟原有约 10 人自研 Copilot 团队，后来改为引入）；度量口径；怎么回答老板和 CEO 的「So what」。
  - 现在读什么：内部数据和调研；业界度量框架（DORA、SPACE、DevEx）；会议同行。
  - 规模：没有。
- **海外的 EM / 工程总监（对照）**：James Stanier（Nordhealth 高级工程领导，前 Shopify 工程总监）、Will Larson（Imprint）、LeadDev 和 Pragmatic Engineer 的受访者。
  - 要做的决定：工具和供应商、是否强制使用、怎么度量、自己要不要重新写代码。
  - 现在读什么：自己每天用 Claude Code / Codex；每周扫 IC 写的项目更新；每月看用量数据。
  - 规模：LeadDev 2025 AI Impact Report 样本 880+（https://leaddev.com/the-ai-impact-report-2025）；Jellyfish 2025 报告 640+（https://jellyfish.co/resources/2025-state-of-engineering-management-report/）。

## 一天、一周、一个事件

- **每天的碎片时间（刷信息）**：在 X、公众号（量子位、新智元等）、V2EX、Hacker News、B 站早晚报、电报群里零散地看 AI 消息；发帖人自己说信息零零散散、不看怕落伍。同一帖里也有人说少看没事、重要的会自己推到面前。发帖和回帖者是一般开发者，不能确认是管理者。
  - 时间：没有
  - 来源：<https://www.v2ex.com/t/1214741> <https://news.ycombinator.com/item?id=46441927> <https://news.ycombinator.com/item?id=42799142>
- **每天 / 每周看板**：看团队的 AI 用量数据：有公司每天看研发序列的 AI 生码率，有公司每周统计 AI 使用量，有团队做看板看每人的 token、花费、对话次数、采纳率。
  - 时间：没有
  - 来源：<https://www.v2ex.com/t/1206486> <https://www.v2ex.com/t/1200195>
- **每周（海外对照，Stanier 自述）**：扫一遍 Linear 里由 IC 负责人写的每周项目更新，看开发分支和演示录像，挑出 3–5 个需要自己盯的项目直接找负责人；周三全天开放办公时间；周二周四不开会。
  - 时间：每个项目的同步会 15–30 分钟；周三整天；总时长没有数字
  - 来源：<https://www.theengineeringmanager.com/growth/nobody-needs-a-human-router/>
- **每周一次的团队 AI 分享 / 共创会**：领导组织团队对齐提示词和 Skills 的写法、沉淀知识，留时间聊使用心得；发帖的下属觉得议程一看就是 AI 写的。
  - 时间：每周一次，已开四次；单次时长没有
  - 来源：<https://www.v2ex.com/t/1235948>
- **每月（海外对照，Larson 自述）**：至少每月看一次工具用量数据，只问两个问题：重度使用者在用它做什么；不用的人为什么不用。
  - 时间：至少每月一次；时长没有
  - 来源：<https://lethain.com/company-ai-adoption/>
- **老板 / CTO / CFO 问起、或领导决定统一采购时**：临时准备：拿同一个编码问题做国内外模型的对照表并让整个团队来看；拿自己项目里一个影响全系统的复杂任务让 AI 做，用结果说话；分两组各用几天再交换；或者整理几篇榜单文章给领导。也有人去论坛发帖问该怎么回答。
  - 时间：准备多久没有数字；一位代购方说分组试用是「几天」
  - 来源：<https://www.v2ex.com/t/1220413> <https://www.v2ex.com/t/1204061> <https://www.v2ex.com/t/1197618>
- **成本超支被发现时**：发现个别成员几天内烧掉几百美元后，才开始找限额、统一账号、换便宜模型的办法。
  - 时间：帖子里的数字：一人 5 天 400 美元；多个 Ultra 账号月费超 1000 美元
  - 来源：<https://www.v2ex.com/t/1210111>
- **预算评审（传统企业）**：技术团队和财务一起整理数据、形成报告，上投资委员会；提效类投资要算能省多少成本，按三到五年评估回报。
  - 时间：没有
  - 来源：<https://www.infoq.cn/article/UBt5Xuv58Y4W8xx2KVQx>
- **线上出事的时候（海外对照）**：Stanier 自己加入事故通话，共享屏幕亲手驱动 AI 提示，团队补上下文、验证排查路径。
  - 时间：没有
  - 来源：<https://www.theengineeringmanager.com/growth/nobody-needs-a-human-router/>
- **日常时间分配（下属和本人的描述）**：协调、组织、写材料、周会月会周报月报、人事杂务；做过 team leader 的人说根本没时间写代码，光是流程设计、分发任务、检查测试就能用完全部工作时间。回帖里的经验说法是 3–4 人的组长肯定自己写，10 人以上一般不怎么写。
  - 时间：各项占比没有数字
  - 来源：<https://www.v2ex.com/t/1186524> <https://www.v2ex.com/t/1190842>

## 需求

1. **当老板、CTO 或 CFO 问「为什么不用某某模型」「国产的行不行」「该不该买」时，我想很快拿出一份用我们自己的活跑出来、外行也看得懂的对比和结论，以便拿到预算，而且以后出问题不由我一个人背。**（原记录标为强）
   - 谁：研发团队组长、技术经理；中国帖子里提问的往往是不写代码的 CTO 和管钱的 CFO
   - 痛在哪：上面的人拿榜单说「也就高几个点」，或只知道豆包；组长说不清差别就被认为差别与你们无关；说得太满又会被要求一个人干十个人的活；建议被采纳后合规、稳定性、效果都算在自己头上。
   - 多频繁：事件驱动：新模型发布、领导听说了什么、预算周期。没有频率数字；有回帖说国内模型约三个月一变。
   - 现在怎么办：同一道编码题做国内外对照表、叫全团队来看；拿自己项目的复杂任务实测；分两组试用几天后交换；整理榜单文章给领导；让老板自己试；先顺着老板倾向说。
   - 缺什么：证据里有的：一次性的对照很快过期，有人明确说这种调研要专项做、要数据验证、要能持续验证；榜单的几个点差距解释不了长任务上的差别。推断：他们缺的是「针对自己代码和约束、能重复跑、能给外行看」的对照，而不是更多榜单。
   - 证据：转述：你是研发组长，想申请预算买国外模型，CTO 和 CFO 都来问国内和国外在编程上差多少、买国内的可以吗；CTO 还说看榜单也就高几个点。（fiht，自述研发团队组长（公司类型未说明）） <https://www.v2ex.com/t/1220413>
   - 证据：转述：我们 CTO 也不懂，平时不写代码、问豆包做 PPT；我用表格把同一个编码问题在国内外模型上的效果列出来，让整个开发团队来看差距，自己少说、让大家说，最终采购了 GPT。（coryxu，回帖者，自述遇到同样情况的团队成员） <https://www.v2ex.com/t/1220413>
   - 证据：转述：公司用和个人用是两回事，这种调研报告应该专项去做，要各种数据验证，还要能持续验证，因为模型还在快速迭代。（yufeng0681，回帖者） <https://www.v2ex.com/t/1220413>
   - 证据：转述：你得听老板的倾向，老板说哪个好就是哪个好，不然最后出问题都是你背锅。（boogoogle，回帖者） <https://www.v2ex.com/t/1220413>
   - 证据：转述：AI Coding 贡献率到了八九成以后，仍然要回答老板和 CEO 的问题：那又怎样？（郭凤钊，菜鸟网络研发总监（大会演讲整理稿）） <https://www.infoq.cn/article/XPo33yALUEeIsBhQ4zGI>
   - 证据：转述：我每周都和很多工程负责人聊，他们一边被要求交出新闻标题里那样的结果，一边对盯着代码行数的董事会和高管团队感到沮丧。（Laura Tacho，DX 的 CTO，发表于 The Pragmatic Engineer） <https://newsletter.pragmaticengineer.com/p/how-tech-companies-measure-the-impact-of-ai>
   - 证据：转述：最大的难点是管理层尤其一把手的认知是否对齐，要么不重视，要么过于乐观以为 AI 能取代大部分研发。（沈斌，众安银行技术委员会主席（直播整理稿）） <https://www.infoq.cn/article/xf6NoCbQdxRFQ90LMMHF>
2. **当团队要统一买编程智能体或模型套餐时，我想知道在我的硬约束（只能国产或信创、要能开票、怕封号、预算上限、要能统计用量）下哪种组合真的能干活，以便不要买了放一边、大家继续各用各的。**（原记录标为强）
   - 谁：被领导指派去采购的团队负责人，国企和有信创项目的团队尤其明显
   - 痛在哪：国内公司没有正规渠道买 Claude 官方订阅；员工自买报销容易封号；中转站可能偷换模型、泄露数据；国产模型好不好用，帖子里说法两极；企业版工具里跑的是什么模型不透明。
   - 多频繁：事件驱动（从各自报销转向统一采购的那一次，以及每次套餐或模型大变）；没有频率数字
   - 现在怎么办：在 V2EX 发帖问同行；找云厂商销售；买中转站或代购；走 AWS / Azure 的 API（贵但能开票）；选能对接内部账号、带效率看板的国内企业版 IDE；继续各自为战报销。
   - 缺什么：证据里有的：帖子下面一半是互相矛盾的口碑和中转商广告；有团队买了国内套餐后结论是不好用、放在一边；HN 上也有人说套餐额度和新模型一直在变、整体信息不可靠，只能自己花钱试。推断：他们要的是「符合我约束的可行组合」加真实使用反馈，而不是通用横评。
   - 证据：转述：以前大家各自承担 AI 费用，现在领导打算统一采购；国企不让用国外的套餐，信创已经搞得半死。（Newbee24，约 30 人开发团队成员，国企） <https://www.v2ex.com/t/1197618>
   - 证据：转述：我们公司已经采购阿里百炼 coding plan 并配到 Claude Code 里，结论是别用国内模型；套餐还在买，但都放在一边，还是各自为战。（rockddd，回帖者） <https://www.v2ex.com/t/1197618>
   - 证据：转述：我这边 30 个人的团队采购的就是中转站，可以开发票；但有人说不安全，另外不是自己花钱买的，token 用得飞快。（Liamccc，30 人团队） <https://www.v2ex.com/t/1197618>
   - 证据：转述：国内公司没有任何正规渠道采购 Claude 官方订阅，第三方买的都有封号风险；最接近合规的是找 Azure 或 AWS 买 API，费用比订阅多得多，但能开发票。（SilencerL，回帖者） <https://www.v2ex.com/t/1200488>
   - 证据：转述：公司要推行 AI Coding，为了统计用量和数据安全想买企业版 AI IDE，候选是 Comate、Qoder、CodeBuddy、Trae，选国内这几家是为了开票方便；回帖说 Qoder 模型不透明。（avalon8，负责选型的团队成员） <https://www.v2ex.com/t/1197169>
   - 证据：转述：公司规模对工具选择的影响大于个人偏好，万人以上企业 56% 用 Copilot，最小的公司 75% 用 Claude Code；约八分之一的人只用公司默认的模型。（The Pragmatic Engineer 调查，约 900 名受访者，34% 为工程管理层） <https://newsletter.pragmaticengineer.com/p/ai-tooling-2026>
   - 证据：转述：评估订阅只能自己掏钱去试、自己量，因为额度和新模型一直在变，整体信息不可靠。（frangonf，HN 回帖者（身份未说明）） <https://news.ycombinator.com/item?id=49550324>
3. **当我要向上汇报团队用 AI 的效果时，我想有一个不容易被刷、能说明「所以呢」的说法，以便证明钱花得值，又不逼着团队造数字。**（原记录标为强）
   - 谁：技术经理到研发总监；也包括被要求填提效百分比的一线
   - 痛在哪：编码环节的指标很好看，交付没有同比例变快；自估的「不用 AI 要多久」不可信；一旦把用量或次数纳入考核，大家就刷；厂商只给得出采纳率这类代理指标。
   - 多频繁：持续（有的公司每天看生码率、每周统计用量）；向上汇报的频率没有数字
   - 现在怎么办：AI 代码生成率、采纳率、token 和花费看板；自估提效百分比；开发者问卷；北极星指标加检查指标（菜鸟）；把度量公开展示。
   - 缺什么：证据里有的：菜鸟贡献率超 90% 而需求周期只差约 10%；快手个人体感提效 20–40% 而组织交付基本不变；LeadDev 调查里 60% 的工程领导把缺少清晰指标列为最大的 AI 挑战；基层承认随便填数。
   - 证据：转述：比较有 AI 参与和没有 AI 参与的需求，变更周期只相差约 10%，相对 90% 以上的贡献率显然不理想；编码在整个交付周期里可能只占三成左右。（郭凤钊，菜鸟网络研发总监） <https://www.infoq.cn/article/XPo33yALUEeIsBhQ4zGI>
   - 证据：转述：开发人员主观体感效率提升 20–40%，但需求交付效率基本不变，个人提效没能传导到组织。（快手研发效能委员会审稿的技术团队长文） <https://www.infoq.cn/article/9rX1Ov951gKtaTmQb8Jq>
   - 证据：转述：公司开了 Cursor Team，AI 提效百分比纳入考察；我们自己估不借助 AI 要多久，再和实际耗时比，但只有后一个数是准的。（hubianluanma，公司员工） <https://www.v2ex.com/t/1206486>
   - 证据：转述：随便填了数字交上去，老板要的是一个心里范围的数；另一位说公司考核 AI 使用次数，没需求时只能每天让 AI 重构来消耗 token。（vikaptain、SmallBlueZhao，回帖者） <https://www.v2ex.com/t/1206486>
   - 证据：转述：LeadDev 对 880 名工程领导的调研里，60% 把缺少清晰指标列为最大的 AI 挑战。（Laura Tacho 引用 LeadDev 2025 AI Impact Report） <https://newsletter.pragmaticengineer.com/p/how-tech-companies-measure-the-impact-of-ai>
   - 证据：转述：很难衡量这些工具对业务的推动；工具厂商只能量采纳率这类代理指标，大多数组织包括我们自己今天都没有准备好准确衡量。（Suhail Patel，Monzo 平台团队负责人） <https://newsletter.pragmaticengineer.com/p/how-tech-companies-measure-the-impact-of-ai>
   - 证据：转述：当下组织转型最普遍的症状是 token 消耗了不少，管理者却看不到效果。（杨瑞，企业教练，GTLC 杭州站分享（会议回顾稿转述）） <https://www.infoq.cn/article/MOVBghUgQrXWr9igbK2p>
4. **当团队的 AI 花费开始失控时，我想能按人、按任务分配模型和额度，以便难题用得上最强的模型，日常活不把预算烧光。**（原记录标为强）
   - 谁：管着团队报销或公司账号的技术经理、小公司技术负责人
   - 痛在哪：全额报销就往上限用；一个人只用最贵的模型，5 天花掉 400 美元；统一账号又怕被一锅端封号；聊天记录和配置散在个人账号里。
   - 多频繁：发现超支时；有的公司按天或按月设额度
   - 现在怎么办：每人每天或每月限额、不够再申请；高级模型限额，多买国产 coding plan；各自充值后报销；多个账号轮换；直接买最贵套餐不做比较。
   - 缺什么：证据里有的：发帖人说既不清楚如何控制这类开销，也没找到兼顾协作和成本的方案；回帖里有人说现在是野蛮增长阶段，没人知道最佳实践。Pragmatic Engineer 说花费和成本分析还没有被普遍度量。
   - 证据：转述：成员各自充值后报销；有人用多个 Cursor Ultra 账号轮换，月费超 1000 美元；试 Cursor Team 时一位同学只用 Opus，5 天消耗 400 美元；我们不清楚怎么控制。（willXW，团队负责人（公司类型未说明）） <https://www.v2ex.com/t/1210111>
   - 证据：转述：公司给全员开放 Claude Code，每人每天 50 美元额度，不够可以再申请 50；另一帖：自建模型平台可用 Opus，给 API Key，限额每月 200 美元。（skills（V2EX 1206486）；DiamondYuan（V2EX 1200195）） <https://www.v2ex.com/t/1200195>
   - 证据：转述：观念上没有障碍，目前最大的问题是算力和 token 消耗带来的高成本。（侯凡，华为云 PaaS 首席前端架构师） <https://www.infoq.cn/article/xf6NoCbQdxRFQ90LMMHF>
   - 证据：转述：便宜模型在最难的任务上总成本未必更低；提高回报的办法可能不是平均发给所有人，而是把最好的模型交给最有经验的工程师。（唐飞虎（月之暗面开发者关系）、滕昱（近 20 年企业软件开发经验），记者整理） <https://www.infoq.cn/article/YBCpst8secs3xWqZwWLe>
   - 证据：转述：花费和成本分析还没有被广泛度量，多数组织不想因为追踪花费而打击大家使用。（Laura Tacho / The Pragmatic Engineer） <https://newsletter.pragmaticengineer.com/p/how-tech-companies-measure-the-impact-of-ai>
5. **当 AI 的消息每天都在冒时，我想只在「会改变我某个决定」的变化出现时知道它，并能判断值不值得动，以便不被怕落伍的情绪牵着走，也不漏掉该换的时候。**（原记录标为中）
   - 谁：证据主要来自一般开发者和个别管理者；能确认是管理者的只有 Monzo 的 Patel、Stanier、Larson
   - 痛在哪：信息零散在各平台，中文平台封闭、难以自动汇总；资讯号很多只是 AI 摘要；模型和套餐几个月一变；没时间反复比较。
   - 多频繁：每天都有新东西；他们实际看的频率没有数字
   - 现在怎么办：X、公众号、论坛、B 站早晚报；RSS；让 Codex 或其他 agent 定时汇总；定时任务自动试新模型；不看、等重要的自己传过来；直接买最贵的免去比较。
   - 缺什么：证据里有的：发帖人觉得零散、没有掌控感；回帖者指出 AI 归纳会很有条理地胡说。也有相反证据：不少人认为不需要实时跟，免费渠道够用。推断：对管理者来说痛点不在「看不到消息」，而在「这条和我的选型有没有关系」。
   - 证据：转述：几乎每天每小时都有新东西，不关注怕过几天落伍，关注又不知道从哪获取，资讯零零散散；也许我们根本不需要每天实时关注。（gongfuxiongmao，发帖者（身份未说明）） <https://www.v2ex.com/t/1214741>
   - 证据：转述：少看没啥事，风口过几天就变，看多了只会加重 FOMO；能转化成自己的资产或改进工作流才值得看。（kuhung，回帖者） <https://www.v2ex.com/t/1214741>
   - 证据：原文："Until you try these tools yourself, all you have is speculation."（Suhail Patel，Monzo 平台团队负责人） <https://newsletter.pragmaticengineer.com/p/how-tech-companies-measure-the-impact-of-ai>
   - 证据：转述：自己仍承担大量开发，没有太多时间在不同模型和价格之间反复比较，所以直接买最贵的模型和最高的套餐。（滕昱，近 20 年企业软件开发经验（记者整理）） <https://www.infoq.cn/article/YBCpst8secs3xWqZwWLe>
   - 证据：转述：远离那些追最新消息的 newsletter，它们多半是用 AI 摘要论文和 Discord；去看正在用 AI 做东西的人写的博客。（lunarcave，HN 回帖者） <https://news.ycombinator.com/item?id=42799142>
   - 证据：转述：我有一个定时的 LLM 任务专门侦察现状、测试新模型，觉得有用就换上。（flemhans，HN 回帖者） <https://news.ycombinator.com/item?id=49550324>
6. **当下属、同事或供应商拿来一份方案、调研或一堆 AI 写的代码时，我想很快分清哪些是真验证过的、依据是什么，以便不用自己从头核一遍，也不把没人懂的东西签字放行。**（原记录标为中）
   - 谁：要做评审和签字的 TL、技术经理；面试官
   - 痛在哪：AI 生成的材料又长又像样，核对来源的成本成倍增加；签字上线的人如果不了解逻辑就是责任真空；候选人和下属在说不清的地方用 AI 含糊过去。
   - 多频繁：没有数字
   - 现在怎么办：只看在真实生产里跑过的案例；自己拉分支本地跑；先让 AI 出 review 报告再人工查；看最坏情况而不是平均水平；面试时让对方共享屏幕现场用 AI。
   - 缺什么：证据里有的：收到 deep research 报告的人说它引用的本身就是 AI 生成内容，核对变成层层追溯；开发者普遍不完全信任 AI 产出。「下属拿来选型对比报告，管理者怎么审」这个具体场景，没有找到管理者本人的详细自述，这一条里一半是相邻场景。
   - 证据：转述：deep research 报告更糟，它们引用的是 AI 生成的内容，我得再去找那些来源所引用的来源才能确认真假。（luPowB6aAcRZcFr，HN 回帖者（身份未说明）） <https://news.ycombinator.com/item?id=45337253>
   - 证据：转述：作为 team lead 我不关心平均能力，只关心最坏情况；只要怀疑某人不能把任务做完或说清为什么难，我就不会把任务给他。（pron，自述长期担任 technical lead） <https://news.ycombinator.com/item?id=46927188>
   - 证据：转述：我评估工具只看一件事，有没有在真实生产系统里处理过真金白银的案例，没有我基本不信。（马工，Kreditz AI Orchestrator（直播整理稿）） <https://www.infoq.cn/article/y8L3Ml8juDeZ56MuUvmc>
   - 证据：转述：如果代码完全由 AI 生成，而签字上线的人根本不了解其逻辑，就会出现严重的责任真空。（滕昱（记者整理）） <https://www.infoq.cn/article/YBCpst8secs3xWqZwWLe>
   - 证据：转述：面了快 50 个了，关键的、说不清楚的地方他们就用 AI 含糊过去。（harveyM，十几年开发经验的面试官） <https://www.v2ex.com/t/1235472>
   - 证据：转述：72% 的开发者每天用 AI 编码工具，42% 的代码由 AI 生成或辅助，但 96% 不完全信任 AI 生成的代码；约 35% 绕过公司授权工具用个人账号。（Sonar《开发者代码现状调查》，由 Sonar 高管在播客中介绍（厂商说法）） <https://www.infoq.cn/article/e40mGRhF9o583Yi3akyM>
   - 证据：转述：46% 的受访者不信任 AI 输出的准确性，信任的只有 33%；66% 认为最大的问题是「差一点就对」。（Stack Overflow 2025 开发者调查，4.9 万以上受访者） <https://survey.stackoverflow.co/2025/ai>
7. **当我已经不天天写代码、却要评审方案、处理事故、做技术决定时，我想能很快把某个项目或代码库的上下文重新装进脑子，以便靠一手判断说话，而不是只转述别人的汇报。**（原记录标为强）
   - 谁：带人的 TL 到总监；中国证据多来自下属对领导的观察
   - 痛在哪：时间被协调和材料占满；离代码远了以后判断只能靠听汇报；不写代码的领导给的建议被下属认为没深入；不懂的上级反过来用 AI「复核」工程师，给出不可用的方案。
   - 多频繁：海外自述是每周；中国没有数字
   - 现在怎么办：海外：每天用 Claude Code / Codex 探索不熟的代码、结对、事故中亲手驱动提示、自己合并小改动；每周只挑 3–5 个项目深入。中国帖子里：有空就写、项目启动期带着写一两个月、之后偏重 review。
   - 缺什么：证据里有的：Pragmatic Engineer 调查里工程经理常规使用 agent 的比例（46.1%）低于 staff+ 工程师（63.5%）；下属抱怨老板只听汇报。推断：中国的团队负责人是否也在用 AI 重建上下文，缺本人自述。
   - 证据：转述：每周扫一遍更新，挑出三到五个真正需要我盯的项目直接去找负责人；Codex 和 Claude Code 我每天都用。（James Stanier，Nordhealth 高级工程领导，前 Shopify 工程总监） <https://www.theengineeringmanager.com/growth/nobody-needs-a-human-router/>
   - 证据：转述：想牵头内部的 AI 项目，就必须自己在用这些工具，而且不只是 ChatGPT，要自己做过会调用工具的 agent。（Will Larson，Imprint 工程负责人） <https://lethain.com/company-ai-adoption/>
   - 证据：转述：我原来做 team leader 根本没时间写代码，各种人事杂务；另一位说被写代码内耗、没时间提升整个团队效率，累垮了。（cufezhusy、473，自述做过 team leader） <https://www.v2ex.com/t/1186524>
   - 证据：转述：老板怎么知道他不写代码呢，老板都是听他汇报；另一位说后来遇到的技术主管基本不写、看都不看，只听汇报。（jasonhc、lts9165，一线开发） <https://www.v2ex.com/t/1186524>
   - 证据：转述：多年不写代码的经理用 Cursor 复核工程师的结论，拿 AI 给的方案来提议，工程师得花时间去筛，也伤了信任。（asdev，HN 发帖者（工程师视角）） <https://news.ycombinator.com/item?id=46918346>
   - 证据：转述：staff+ 工程师 63.5% 常规使用 agent，工程经理 46.1%，总监和 VP 51.9%。（The Pragmatic Engineer 调查，约 900 名受访者） <https://newsletter.pragmaticengineer.com/p/ai-tooling-2026>
8. **当我要招人、带新人时，我想有办法看出一个人在 AI 参与下能不能可靠交付、知道哪里该踩刹车，以便不招来只会让 AI 代答的人，也让新人还有成长的路。**（原记录标为强）
   - 谁：做面试官的 TL 和技术经理
   - 痛在哪：应届生不会手写、不会调试，简历上全是看着高大上的 Agent 项目；传统手写题考不出真实能力；怎么量化一个人用 agent 的水平，行业没有标准。
   - 多频繁：招聘时；没有数字
   - 现在怎么办：共享屏幕看候选人怎么用 AI；给一段 AI 写的有问题的代码让他找；故意埋问题看能否发现模型出错；回到基本功和真实项目细节。
   - 缺什么：证据里有的：面试官说已经不会招人了；LeadDev 调查 54% 预计初级工程师招聘会减少；有人指出日常要求高 AI 生成率、招聘却考不用 AI 的能力，很割裂。
   - 证据：转述：所有候选人都用 AI 完成项目，从技术侧看都没什么优势和壁垒，已经不会招人了，不知道什么样的算有潜力。（harveyM，十几年开发经验的面试官） <https://www.v2ex.com/t/1235472>
   - 证据：转述：做面试官时不阻止候选人用 AI，而是设计必须人机协作完成的任务并故意埋问题，看他能否发现模型的错误、调整方向。（唐飞虎，月之暗面开发者关系（记者整理）） <https://www.infoq.cn/article/YBCpst8secs3xWqZwWLe>
   - 证据：转述：54% 的受访者预计初级工程师的招聘会减少；60% 计划把精力放在管理 AI agent 上。（LeadDev AI Impact Report 2025，880+ 受访者） <https://leaddev.com/the-ai-impact-report-2025>
   - 证据：转述：内部尝试发现，在 AI 辅助下，以高职级为主的团队在同样成本下能交付更高的价值，平均职级会整体上移。（沈斌，众安银行技术委员会主席） <https://www.infoq.cn/article/xf6NoCbQdxRFQ90LMMHF>
9. **当我在传统企业里要推 AI、又被要求零风险时，我想把一件事讲成财务和合规都能批的样子，以便立得了项、出了问题有据可查。**（原记录标为中）
   - 谁：传统企业、国企、金融里的技术负责人和数字化负责人
   - 痛在哪：领导既要创新又要零风险；预算要和财务一起算回报上会；只能用国产、要信创；有时任务本身是为了拿政策支持。
   - 多频繁：预算和立项周期；没有数字
   - 现在怎么办：把 AI 包装成「数智化升级」推进；和财务一起出报告上投资委员会，按三到五年算回报；先做概念验证，生产上线很少；买大厂产品以便出问题不由自己担。
   - 缺什么：证据薄：只有一篇记者转述的 CTO 访谈、一场培训机构组织的闭门会和几条论坛回帖。推断：这类人需要的是可以拿去过会的依据（合规、成本、同类企业案例），但他们自己没有公开说过。
   - 证据：转述：提效类技术投资要评估能节约多少成本，团队会和财务部门一起整理数据、形成报告，在投资委员会上评审；评估周期通常三到五年。（罗金鹏，星巴克中国 CTO（记者转述）） <https://www.infoq.cn/article/UBt5Xuv58Y4W8xx2KVQx>
   - 证据：转述：领导既要创新又要零风险，我们只能把 AI 包装成数智化升级才敢推进。（某机械制造企业培训中心负责人，极客邦科技组织的闭门研讨会（主办方有培训业务）） <https://www.infoq.cn/article/v2WguqKMH28efZ4ymJ8N>
   - 证据：转述：不能自建就买大厂的，中间出了问题有大厂的名头在，轮不到你背锅。（cs419，回帖者） <https://www.v2ex.com/t/1197618>
   - 证据：转述：领导让我弄一个垂直领域模型用来获取政策支持，我们现在只是调 Kimi 和豆包的 API，怎么低成本快速做一个？（mythjava，开发者） <https://www.v2ex.com/t/1145197>

## 信什么，不信什么

- 信自己或自己团队在真实代码上跑出来的结果，不信二手说法：Monzo 平台负责人说没亲手试过就只是猜测；Stanier 说判断要靠拿真实问题长期使用，而不是五分钟演示；V2EX 回帖者说拿自己项目定义一个复杂任务让 AI 做、用结果说话。https://newsletter.pragmaticengineer.com/p/how-tech-companies-measure-the-impact-of-ai ；https://www.theengineeringmanager.com/growth/earn-your-scepticism/ ；https://www.v2ex.com/t/1220413
- 不信榜单上几个点的差距能说明问题：CTO 拿 benchmark 说也就高几个点，组长觉得这解释不了实际差别；回帖者说差别主要在长任务和疑难问题上。https://www.v2ex.com/t/1220413
- 不信厂商给的代理指标和未经核实的漂亮数字：Monzo 说厂商只量得了采纳率这类；Stanier 点名不信「多少比例代码由 AI 写」这类说法；菜鸟和快手都承认贡献率不等于交付变快。https://newsletter.pragmaticengineer.com/p/how-tech-companies-measure-the-impact-of-ai ；https://www.theengineeringmanager.com/growth/earn-your-scepticism/ ；https://www.infoq.cn/article/XPo33yALUEeIsBhQ4zGI
- 只信在生产里处理过真实业务的案例，不信大厂没实战过的整套方案：Kreditz 的马工原话意思如此。https://www.infoq.cn/article/y8L3Ml8juDeZ56MuUvmc
- 同行口碑是主要依据，但他们知道里面掺着广告：采购帖下面多条中转商和代购的自荐；有人追问中转怎么保证不偷换模型；有人指出企业版工具里用的什么模型不透明。https://www.v2ex.com/t/1197618 ；https://www.v2ex.com/t/1197169
- 对下属和 AI 都按最坏情况而不是平均水平判断：自述 tech lead 的 pron 说只要怀疑做不完或讲不清就不派活；滕昱说 AI 生成代码可以接受但必须有人负责。https://news.ycombinator.com/item?id=46927188 ；https://www.infoq.cn/article/YBCpst8secs3xWqZwWLe
- 一眼看出是 AI 写的管理材料会掉信任：下属对领导的 AI 共创会议程的第一反应是「一看就是 AI 写的」；HN 上有人说经理发来的 Claude 生成文档让人看不懂目的。https://www.v2ex.com/t/1235948 ；https://news.ycombinator.com/item?id=45337253
- 「大厂背书」被当作一种信任理由，实质是免责：买大厂的，出问题轮不到你背锅。https://www.v2ex.com/t/1197618
- 对 AI 的回答普遍有保留：Stack Overflow 2025 调查 46% 不信任准确性；DORA 2025 约 30% 对 AI 生成代码很少或完全不信；V2EX 回帖者提醒 AI 归纳会很有条理地胡说。https://survey.stackoverflow.co/2025/ai ；https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report ；https://www.v2ex.com/t/1214741
- 上级的信息来源被下属认为不可靠：老板只知道豆包、CTO 平时问豆包做 PPT、领导说自己一下午用 AI 就搞定了。https://www.v2ex.com/t/1200195 ；https://www.v2ex.com/t/1220413 ；https://www.v2ex.com/t/1206486
- 让决策人亲自体验比给数字更能说服：一位做合规代购的人说，分组试用几天并拉上有决策权的人亲手用，对方就不再追问量化问题（卖方说法）。https://www.v2ex.com/t/1220413

## 工具和花费

- **Cursor Team / Cursor Ultra**（团队编程智能体，带用量看板（token、花费、对话次数、采纳率））：帖子里的实际花费：一人 5 天 400 美元；多个 Ultra 账号轮换月费超 1000 美元；另一家前端每人每月 20 美元额度。官方定价本次未打开；谁付：公司（团队账号或报销） <https://www.v2ex.com/t/1210111>
- **Claude Code（公司 API Key 或订阅报销）**（编程智能体）：帖子里的额度：每人每天 50 美元、不够可再申请 50；每月 200 美元限额；有公司报销 5X 档订阅。马工说 Team Plan 超额走 API 约贵十倍。官方定价本次未打开；谁付：公司；也有不少人自费 <https://www.v2ex.com/t/1200195>
- **国产 Coding Plan（阿里百炼、Kimi、GLM、MiniMax 等）**（只能用国产模型时接到 Claude Code 等工具里）：Kimi coding plan 99 元/月（个人订阅者自述）；其他未见价格；谁付：公司统一采购或个人 <https://www.v2ex.com/t/1197618>
- **国内企业版 AI IDE（Trae、Qoder、CodeBuddy、Comate、通义灵码）**（能开票、统计用量、对接内部账号、出研发效率数据给老板）：没有看到价格；有人说 Qoder 贵；谁付：公司 <https://www.v2ex.com/t/1197169>
- **中转站 / 代购账号**（绕开国内买不到官方订阅的问题，能开对公发票）：帖内商家自报：一个 Claude Max 账号 1888 元；另一家称官方 6–7 折（均为卖方说法，未核实）；谁付：公司（有 30 人团队这么买） <https://www.v2ex.com/t/1197618>
- **AWS Bedrock / Azure / Google Vertex 的模型 API**（最接近合规的 Claude 使用方式；Imprint 用 Bedrock 跑 Claude Code）：没有具体数字；回帖者说比订阅贵得多；谁付：公司 <https://www.v2ex.com/t/1200488>
- **GitHub Copilot（随企业许可附带）**（大企业默认的编程助手）：Monzo 说它是并进 GitHub 企业许可的，不是单独一项开支；价格未见；谁付：公司 <https://newsletter.pragmaticengineer.com/p/how-tech-companies-measure-the-impact-of-ai>
- **全员 OpenAI 账号 + 工程侧 Cursor 和 Claude**（Imprint 的公司级标准平台，入职当天自动开通）：没有；谁付：公司 <https://lethain.com/company-ai-adoption/>
- **Linear（每周项目更新）**（管理者每周看 IC 写的项目更新，代替层层转述）：没有；谁付：公司 <https://www.theengineeringmanager.com/growth/nobody-needs-a-human-router/>
- **开发者体验问卷（DX 等）**（用主观问卷判断 AI 工具是否有用）：没有；谁付：公司 <https://newsletter.pragmaticengineer.com/p/how-tech-companies-measure-the-impact-of-ai>
- **The Pragmatic Engineer 付费订阅**（工程管理者看 AI 工具调查的完整报告（公开部分只到一半））：页面上没有看到价格；谁付：没有证据 <https://newsletter.pragmaticengineer.com/p/ai-tooling-2026>
- **TGO 鲲鹏会（技术领导者同行组织）**（技术负责人之间学习技术与管理、交换资源；杭州分会约百余位成员）：没有看到会费；谁付：没有证据 <https://www.infoq.cn/article/MOVBghUgQrXWr9igbK2p>
- **免费信息渠道：X、公众号、V2EX、Hacker News、B 站早晚报、电报群、RSS**（日常跟进 AI 消息）：免费；谁付：无 <https://www.v2ex.com/t/1214741>

## 现在怎么用 AI

- 海外管理者自述每天用 Claude Code 和 Codex 进入不熟的代码、结对、在事故里亲手驱动提示、自己合并小改动；Stanier 说动手已经成了他工作的主体。https://www.theengineeringmanager.com/growth/nobody-needs-a-human-router/
- Will Larson 自己写了内部 agent（约 3000 行 Python Lambda）、把所有 agent 的提示放在全公司可读的 Notion 库里，并每月看用量。https://lethain.com/company-ai-adoption/
- 带样本的数字：工程经理里 46.1% 常规使用 agent，低于 staff+ 工程师的 63.5%；约八分之一的人只用公司默认模型。https://newsletter.pragmaticengineer.com/p/ai-tooling-2026
- 用 AI 跟进信息：有人让 Codex 起定时任务每天总结全网 AI 新闻，有人把开源的信息源列表接到自己的 agent 每天早上推送；HN 上有人用定时任务自动试新模型。这些人是一般开发者，不能确认是管理者。https://www.v2ex.com/t/1214741 ；https://news.ycombinator.com/item?id=49550324
- 用 AI 做评审初筛：先由 AI 生成 review 报告再人工检查（张汉东）；AI 给 PR 生成总结帮助评审者理解上下文（字节 TRAE 架构师）。https://www.infoq.cn/article/y8L3Ml8juDeZ56MuUvmc ；https://www.infoq.cn/article/xf6NoCbQdxRFQ90LMMHF
- 创始人这一级主要把 AI 用在效率和决策支持上（32.9%），工程师主要用来写代码（51%）；工程师里 21% 认为质量变差。Lenny's Newsletter 调查，1750 人。https://www.lennysnewsletter.com/p/ai-tools-are-overdelivering-results
- 失败一：不写代码的上级用 Cursor 复核工程师的判断并提出不可用的方案，浪费工程师时间、损害信任。https://news.ycombinator.com/item?id=46918346
- 失败二：经理让 Claude 在每个 PR 上留两页评论、发来看不出目的的 Claude 生成文档；收到的 deep research 报告引用的是 AI 生成内容，核对成本翻倍。https://news.ycombinator.com/item?id=45337253
- 失败三：领导用 AI 写的会议议程被下属一眼认出并嘲笑。https://www.v2ex.com/t/1235948
- 失败四：AI 归纳的信息会很有条理地出错，回帖者提醒大家没见识过这种胡说。https://www.v2ex.com/t/1214741
- 不用的人：帖子里的 CTO 不写代码、只问豆包做 PPT；老板只知道豆包；培训会上有人转述 70 后总监拒绝学 AI（主办方有培训业务）。https://www.v2ex.com/t/1220413 ；https://www.v2ex.com/t/1200195 ；https://www.infoq.cn/article/v2WguqKMH28efZ4ymJ8N
- 没有找到中国团队级管理者亲口讲「我用 AI 准备向上汇报或技术决定」的自述；现有中国证据多是下属视角或大会演讲。

## 已经交出去的

- 状态更新和周报：交给做事的 IC 负责人每周写，管理者只读、不转述（Stanier）。https://www.theengineeringmanager.com/growth/nobody-needs-a-human-router/
- 最佳实践的摸索和传播：交给团队里的「AI 布道师」（菜鸟）或先锋小组（环世物流）。https://www.infoq.cn/article/XPo33yALUEeIsBhQ4zGI ；https://www.infoq.cn/article/v2WguqKMH28efZ4ymJ8N
- 工具对比的实际试用：交给团队分组去用、去看，自己少说（coryxu；还有人建议分组对比轮次和采纳率）。https://www.v2ex.com/t/1220413
- 用量和采纳数据：交给工具自带的看板或管理后台（Cursor 看板、Claude Team 的用量分析）。https://www.v2ex.com/t/1206486 ；https://www.v2ex.com/t/1210111
- 采购渠道、发票、账号稳定：交给云厂商销售、中转商或代购。https://www.v2ex.com/t/1200488 ；https://www.v2ex.com/t/1197618
- 代码评审的第一遍：交给 AI 出报告或做规范检查。https://www.infoq.cn/article/y8L3Ml8juDeZ56MuUvmc ；https://www.infoq.cn/article/xf6NoCbQdxRFQ90LMMHF
- 日常消息汇总：有人交给定时 agent（一般开发者）。https://www.v2ex.com/t/1214741
- 跟进变化本身：有人主张不必统一，保证额度能报销，靠定期调查和内部分享让团队替自己跟。https://www.v2ex.com/t/1210111
- 自研编程助手：菜鸟放弃约 10 人的自研 Copilot 团队，改为引入市场上的工具。https://www.infoq.cn/article/XPo33yALUEeIsBhQ4zGI

## 不交的

- 最后拍板和担责：出问题还是人背锅；生产事故里要有人说就这么做、我来负责。https://www.v2ex.com/t/1220413 ；https://www.infoq.cn/article/YBCpst8secs3xWqZwWLe
- 亲手使用工具形成判断：Larson、Stanier、Monzo 的 Patel 都把这件事留给自己，认为听二手说法不算数。https://lethain.com/company-ai-adoption/ ；https://www.theengineeringmanager.com/uncategorized/the-right-kind-of-ai-sceptic/ ；https://newsletter.pragmaticengineer.com/p/how-tech-companies-measure-the-impact-of-ai
- 架构和方向上的取舍：AI 能给一百种看起来对的方案，选哪一个还是人的事（松子）；Stanier 说技术和架构决定一直留在自己手里。https://www.infoq.cn/article/y8L3Ml8juDeZ56MuUvmc ；https://www.theengineeringmanager.com/growth/nobody-needs-a-human-router/
- 向上解释：贡献率再高，回答老板和 CEO 的仍是负责人自己（郭凤钊）。https://www.infoq.cn/article/XPo33yALUEeIsBhQ4zGI
- 看数据并和不用工具的人谈：Larson 自己每月看、自己去问为什么不用。https://lethain.com/company-ai-adoption/
- 招人的判断：面试官仍然自己面，只是不知道该考什么。https://www.v2ex.com/t/1235472
- 聊天记录和提示是否向公司公开：团队成员强烈反对被统一收集，说那样谁还敢用。这是下属不肯交出去的。https://www.v2ex.com/t/1210111

## 和亲手做研究的人有什么不同

- 他们要的结论是「在我的约束下哪个能用」，约束常常比能力更决定结果：只能国产、信创、要开票、怕封号、要能统计用量。亲手做研究的人关心谁最强，他们关心谁能买、谁出事不算我的。依据：https://www.v2ex.com/t/1197618 ；https://www.v2ex.com/t/1197169 ；https://newsletter.pragmaticengineer.com/p/ai-tooling-2026
- 他们看材料多是为了回答别人的问题，是事件驱动的：老板问了、领导要统一采购了、钱超了。没有看到「每天固定读多久」的证据。依据：https://www.v2ex.com/t/1220413 ；https://www.v2ex.com/t/1210111
- 他们的产出要让外行信服，所以演示和对照比数字管用：做两个页面给老板看、同一道题的对照表、让决策人亲手试。依据：https://www.v2ex.com/t/1220413
- 他们按最坏情况和责任归属来判断，而不是平均能力：tech lead 自述只关心最坏情况；买大厂是为了不背锅。依据：https://news.ycombinator.com/item?id=46927188 ；https://www.v2ex.com/t/1197618
- 他们的时间是碎的，有人直接用钱换掉比较这件事（买最贵的拉满）。依据：https://www.infoq.cn/article/YBCpst8secs3xWqZwWLe ；https://www.v2ex.com/t/1186524
- 他们的信息很大一部分来自人而不是文献：团队里的重度使用者、论坛同行、销售、同行组织。依据：https://www.v2ex.com/t/1197618 ；https://www.infoq.cn/article/MOVBghUgQrXWr9igbK2p ；https://leaddev.com/ai/ai-coding-agents-spread-through-peer-pressure-not-mandates
- 他们还要管「团队怎么用」带来的二阶问题：成本、刷指标、隐私、封号，这些亲手做研究的人不用管。依据：https://www.v2ex.com/t/1206486 ；https://www.v2ex.com/t/1210111
- 他们使用 agent 的比例低于资深 IC（46.1% 对 63.5%），离一手体验更远，这正是他们被下属质疑的地方。依据：https://newsletter.pragmaticengineer.com/p/ai-tooling-2026 ；https://www.v2ex.com/t/1186524
- 在中国的团队这一级，「看的人」和「做调研的人」常常是同一个人：CTO 和 CFO 来问，组长自己去做对照。所以这一级和研究者的边界比预想的模糊。依据：https://www.v2ex.com/t/1220413

## 意外的发现

- 不少人明确说不需要实时跟进：少看没事、重要的会自己推过来、只要我不学就不会落后。免费渠道加同行口碑对很多人已经够用。https://www.v2ex.com/t/1214741
- 有人用「直接买最贵的」来免掉选型研究，理由是没时间比较。https://www.infoq.cn/article/YBCpst8secs3xWqZwWLe
- 如实汇报的动机并不总是存在：多条回帖建议向公司推荐国产模型、自己偷偷用国外的，把差距当成个人的护城河；也有人建议执行层对老板的采购问题打马虎眼。向上流动的选型信息可能是被有意扭曲的。https://www.v2ex.com/t/1220413 ；https://www.v2ex.com/t/1204061
- 选型常常由采购和免责决定，而不是由评测决定：大企业默认 Copilot 是因为采购和捆绑；国内选企业版 IDE 是因为开票方便；买大厂是为了不背锅。https://newsletter.pragmaticengineer.com/p/ai-tooling-2026 ；https://www.v2ex.com/t/1197169 ；https://www.v2ex.com/t/1197618
- 编码指标和交付结果的差距比想象的大：菜鸟 AI 代码贡献率 90% 以上，需求周期只差约 10%；快手个人体感提效 20–40%，组织交付基本不变。https://www.infoq.cn/article/XPo33yALUEeIsBhQ4zGI ；https://www.infoq.cn/article/9rX1Ov951gKtaTmQb8Jq
- 工具的首次使用靠同伴带动而不是命令：微软内部研究里，隔级同伴超过四分之一在用时，尝试的几率高 216%，直属经理在用高 82%；能否留下来只看是否合工作流。https://leaddev.com/ai/ai-coding-agents-spread-through-peer-pressure-not-mandates
- 国内买不到官方订阅，催生了一个灰色的中转和代购市场，几乎每个采购帖下面都有卖家自荐，管理者是在广告堆里做决定的。https://www.v2ex.com/t/1197618 ；https://www.v2ex.com/t/1200488
- 管理者用 AI 写的沟通材料会反过来掉信任：议程、PR 评论、文档都被下属点名。https://www.v2ex.com/t/1235948 ；https://news.ycombinator.com/item?id=45337253
- 海外的风向是要管理者回到细节里、少做信息转手；有公司专门只招有经理背景的人来管 agent。https://www.theengineeringmanager.com/growth/nobody-needs-a-human-router/ ；https://leaddev.com/career-development/demand-for-engineering-managers-is-surging-in-the-agentic-coding-era
- 团队成员反对统一收集聊天记录，统一账号还被认为容易被一锅端；「统一管理」本身就有阻力。https://www.v2ex.com/t/1210111

## 来源说明

- 搜索受限：内置浏览器标签页一直满额，打不开自己的标签页，没有动别人的；用 curl 访问 Bing、百度、搜狗、DuckDuckGo 等只得到降级结果或验证页，没有绕过。资料全靠站内检索接口找到：V2EX（sov2ex 检索加 V2EX 官方 API 读正文和回帖）、InfoQ 中文站（极客邦检索接口加文章接口）、Hacker News（Algolia），外加直接打开已知网址。所以来源明显偏向这三个社区和几家英文通讯。
- 实际打开并读了约 50 个页面：V2EX 帖子 17 个、InfoQ 中文文章 13 篇、Hacker News 讨论 9 个、英文自述和调查约 15 页。一半以上是本人发帖或自述、或带样本的调查。
- 重复使用：V2EX 1220413 同时支撑「向上解释」「信任」「如实汇报动机」「与研究者的差别」；V2EX 1197618 同时支撑「采购」「信任」「传统企业」「工具花费」；V2EX 1206486 支撑「度量」和「日常节奏」；V2EX 1210111 支撑「成本」和「不交出去的事」；InfoQ 郭凤钊一文支撑「度量」「向上解释」「交出去的事」；InfoQ 滕昱和唐飞虎一文支撑「成本」「跟进」「评审」「招人」四处；Stanier 的三篇文章支撑「保持在细节里」「信任」「日常节奏」；Pragmatic Engineer 的两篇支撑「采购」「度量」「成本」「信任」。这些需求看起来各有多条证据，实际独立来源比条数少。
- 身份不确定：V2EX 和 HN 的发言者身份都是自述或看不出；不少帖子是下属在评论领导，不是管理者本人。能确认是团队级管理者本人的中文自述很少（fiht、willXW、Liamccc、harveyM、tim9527 等寥寥几人），而且都很短。
- 立场：InfoQ 的稿子多为大会演讲和直播整理，演讲者在宣传自己公司的做法，主办方极客邦有会议和企业培训业务；「10+ 企业高管」一文是其培训业务的研讨会稿。Sonar 的调查是厂商调查。V2EX 采购帖里有多条中转商、代购的自荐，价格是卖方自报。V2EX 1220413 里讲分组试用成交的人本身是代购方。
- 没能逐字核对的数字：LeadDev AI Impact Report 页面上的 85%、59%、60%、54% 在图片里，取自抓取工具的摘要，原文文字只核对到 53% 和「880+」；其中「60% 缺清晰指标」另由 Pragmatic Engineer 文中转引核对过。Lenny、Jellyfish、Stack Overflow、DORA 的数字来自抓取摘要，未逐字核对。Pragmatic Engineer 和 Lenny 的正文后半付费，没有看。
- 地域和时间：英文调查以欧美为主；中文材料集中在 2026 年 1–9 月，模型和套餐名称变化很快，具体工具评价很快会过时。V2EX 用户偏个人开发者和中小公司，对国产模型的评价有社区倾向，同一帖里也有人指出这一点。
- 引文一律为贴近原文的转述，只有 Monzo 一句是原文短摘。

## 没查到的

- 时间数字基本没有：每天或每周花多久看信息、周报和评审各占多少时间、哪件最费劲、自己还写多少代码，都只有定性描述（没时间、被杂务占满），没有任何带样本的占比。LeadDev Engineering Leadership Report 的网址两次 404，没读到。
- 「老板问为什么不用某某模型，要准备多久」：只找到做法（对照表、分组试用几天），没有准备时长。
- 「下属拿来选型对比或调研报告时怎么看」：没有找到团队级管理者本人的详细自述，只有相邻证据（收到 AI 报告的人、面试官、tech lead 对 agent 的评价）。需要访谈。
- 技术方案评审、写周报、申请预算这三件事在中国团队级管理者那里具体怎么做、用不用 AI：只有零星回帖和一篇星巴克中国 CTO 的转述。
- 银行、制造、政企里团队级技术负责人的一手自述几乎没有；现有的是国企开发者的几条回帖、一位银行技术委员会主席的直播发言和培训机构的会议稿。
- 评测怎么做：只看到「自己搭业务基准」「拿真实任务试」的说法，没有看到团队级管理者公开的评测集、流程或工作文件。
- 他们愿意为「跟上变化、准备决定」付多少钱：没有任何付费证据。看到的付费都是为模型和工具本身，以及疑似的同行组织会费（未见金额）。
- 没打开或读不到：掘金正文（返回验证页，接口正文为空，只看到了搜索结果标题，未引用）、知乎专栏、公众号文章、脉脉、即刻、极客时间专栏章节和留言、InfoQ 写作平台正文、HBR 的 workslop 原文（付费墙，只看到开头）、CNBC 转述（403）、Reddit。DORA 完整报告和 JetBrains 2025 的具体数字没读到。
- 中国的团队负责人是否像 Stanier、Larson 那样用编程智能体重建上下文、亲自下场：没有本人自述，只能从下属抱怨里看到反面。
- 人群规模：中国有多少这样的团队级技术管理者，没有找到数字。
- 「不需要」的比例：看到了明确的不需要、免费够用的声音，但说话的是一般开发者，管理者里有多少人这样想，只有访谈能回答。

