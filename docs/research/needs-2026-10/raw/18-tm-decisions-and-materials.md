# 技术经理 4：决定和决策材料

原始调研记录（2026-10-05）。关键陈述的复核结果见上一级目录的 `audit-tech-managers.md`；被复核改正或降级的地方以复核和报告正文为准。数字和说法以各条所附网址的原文为准。

## 人群

- **小团队的技术合伙人 / CTO / 技术负责人（约 10–50 人）**：创业公司和小软件公司里自己还写代码、同时替团队拍板的人。没有采购、安全、架构委员会，决定基本一个人做。
  - 要做的决定：给团队买哪个编程智能体（按月试、按月换）；接哪家模型 API；内部助手用自建模型还是外部 API。频率：工具几乎每月重看一次（V2EX 1202879 楼主买了一个月 Cursor Team 就在考虑第二个月换 Codex）。错的代价：订阅额度一天用完、账号被封、钱白花；选型时「封号风险」排在能力前面。
  - 现在读什么：主要靠 V2EX 这类论坛发帖问同行、自己和团队上手试；很多公司没有技术评审环节（V2EX 1142562 多人自述「我就是技术方案」「老大直接发任务」）。没有人替他们准备材料。
  - 规模：没有中国的规模数字。海外线索：Pragmatic Engineer 2025 工具调查称 85% 的软件工程师在工作中用 AI 工具（转引自 https://newsletter.pragmaticengineer.com/p/how-tech-companies-measure-the-impact-of-ai ），说明几乎所有带团队的人都面对这类决定。
- **中大型互联网 / 软件公司的技术总监、工程经理、平台负责人**：带几十到几千名工程师，负责内部 AI 平台/网关、研发工具采购、研发效能指标的人；向 CTO 或业务负责人汇报。
  - 要做的决定：统一采购哪些工具、给多少额度（例：自建模型网关 + 每人每月 200 美元 API 限额，V2EX 1200195）；用什么指标证明有用（AI 代码入库率、采纳率、token 用量）；年度规划里投多少人、ROI 怎么写；自研内部工具还是跟外部。频率：年度/季度规划 + 新工具出现时临时重评。错的代价：自研平台一年后被外部进展淘汰（安克 2023 年做的 AI 内容中台 2024 年重做）；指标一公布行为被扭曲。
  - 现在读什么：内部看板（token 用量、入库率排名）、试点团队的前后对比、厂商面板给的采纳率、开发者体验问卷（Monzo 用 DX 问卷）；下属或专项小组做的选型调研；RFC/ADR/技术方案评审材料。
  - 规模：LeadDev《AI Impact Report 2025》样本 880+ 名工程领导（ https://leaddev.com/the-ai-impact-report-2025 ）。中国没有找到带样本的数字。
- **传统企业 / 受监管行业的 CIO、数字化与 AI 落地负责人**：制造、金融、政企里的 IT/数字化负责人，预算大、合规约束多（信创、数据不出境、高敏业务必须本地模型）。
  - 要做的决定：私有化部署还是云 API（V2EX 1229783：几千万预算部署国产开源模型，流程要求高敏业务智能体必须用本地模型）；买现成应用还是自己做；哪些项目设短期 ROI、哪些允许探索（安克：约 1/3 团队背明确 ROI）。频率：按年度预算；错的代价以千万计且难回头。
  - 现在读什么：厂商方案和 POC 数据、外部榜单当初筛（a16z 把它比作 Gartner 魔力象限式的过滤器）、同行案例、内部业务方的痛点。材料多由下属团队和厂商准备。
  - 规模：a16z 2025 年调查 100 位企业 CIO、跨 15 个行业（ https://a16z.com/ai-enterprise-2025/ ）；Menlo Ventures 2025 年报告调查约 500 位美国企业决策者（ https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/ ）。中国没有找到对应调查。
- **既写代码又带人的技术负责人 / 架构负责人（TL）**：管几个人、几个项目的一线负责人。写代码时是做的人；审下属方案、在评审会上定方向、被上级要求「调研一下落地路径」并写结论时，是看的人和做决定的人。
  - 要做的决定：下属方案过不过；数据库/框架/模型这类选型（紫风自述 2019 年没评审自己拍板用 MongoDB 存订单，3 年后花 3 个月迁回 MySQL）；给上级的选型建议。频率：每个需求一次，小公司常是「今天需求评审、明天技术评审」。
  - 现在读什么：下属的技术方案（越来越多是把需求直接丢给 AI 生成的）、PR、论坛帖子。有人被告知只应留 20% 时间自己干活、其余看进度和风险（V2EX 1235251 回帖）。
  - 规模：没有。
- **海外对照：有成文决策流程的科技公司工程领导**：GitLab、Squarespace、Spotify、Monzo、Amazon 这类公开了 RFC/ADR/六页备忘流程的公司里的工程总监、平台负责人、DRI。
  - 要做的决定：架构变更、平台选型、AI 工具铺开；流程上有明确的拍板人（GitLab 的 DRI，ADR 评审期通常 10 天，到期即决定）。
  - 现在读什么：RFC/设计文档（带审批人名单、备选方案、风险）、ADR、每月架构同步会上的状态更新；会前或会上静读。
  - 规模：Pragmatic Engineer 列出 100 多家使用 RFC/设计文档流程的公司（ https://blog.pragmaticengineer.com/rfcs-and-design-docs/ ），同时指出 Meta 是明显例外。

## 一天、一周、一个事件

- **评审会前 / 会上**：读方案材料。成文流程里是会上先静读再评论：AWS 架构师建议 ADR 会议控制在 30–45 分钟，其中 10–15 分钟与会者当场读文档并写批注；Amazon 在会议开头集体静读六页备忘。国内自述的做法是「提前 3 天发材料、评审会 1–2 小时」，但小公司常是头天下午需求评审、第二天下午就技术评审。
  - 时间：会上阅读 10–15 分钟（AWS）；评审会 1–2 小时（紫风）；管理者个人会前读多久没有数字
  - 来源：<https://aws.amazon.com/blogs/architecture/master-architecture-decision-records-adrs-best-practices-for-effective-decision-making/> <https://www.aboutamazon.com/news/company-news/2017-letter-to-shareholders> <https://cloud.tencent.com/developer/article/2716534> <https://www.v2ex.com/t/1142562>
- **每周**：向老板周报部门工作（只报整体、风险、建议，不罗列事项）；看团队 AI 使用量统计；有的领导每周开一次「AI 共创会」。
  - 时间：没有
  - 来源：<https://cloud.tencent.com/developer/article/2079962> <https://www.v2ex.com/t/1200195> <https://www.v2ex.com/t/1235948>
- **每月**：工具订阅按月为单位重看要不要换；看 token 用量/入库率排名；GitLab 有每月一次的 Architecture Evolution Sync，工程领导在会上看关键设计文档的状态并给人力和经费上的指导。
  - 时间：没有
  - 来源：<https://www.v2ex.com/t/1202879> <https://www.v2ex.com/t/1206622> <https://handbook.gitlab.com/handbook/engineering/architecture/workflow/>
- **新模型 / 新工具发布时**：临时重评已有选择：让团队试新工具、观望即将发布的模型、等新工具超过现用的再切。Monzo 平台负责人在 Copilot 之外持续试 Cursor、Windsurf、Claude Code。
  - 时间：没有固定周期的证据
  - 来源：<https://newsletter.pragmaticengineer.com/p/how-tech-companies-measure-the-impact-of-ai> <https://www.v2ex.com/t/1163588> <https://a16z.com/ai-enterprise-2025/>
- **年度 / 季度规划与预算**：把 AI 项目写进年度规划，被问投入多少人、投入产出比多少、提效指标怎么设；定哪些团队背 ROI、哪些自由探索并定期汇报进展。
  - 时间：没有
  - 来源：<https://cloud.tencent.com/developer/article/2593994> <https://cloud.tencent.com/developer/article/2538636>
- **被老板临时问到**：老板看了发布会或短视频后问「AI 发展到什么程度了、公司该不该采购」，技术负责人要当场或几天内给说法；有的被指派去调研落地路径再回报。
  - 时间：没有
  - 来源：<https://www.v2ex.com/t/1204061> <https://www.v2ex.com/t/1183984> <https://cloud.tencent.com/developer/article/2682747>
- **出事或项目复盘时**：回头看当初的决定：项目复盘会上 PMO 数据显示出码率涨了但交付周期没缩短；选型的后果几年后才暴露。平时没有人主动对照当初的依据。
  - 时间：没有
  - 来源：<https://cloud.tencent.com/developer/article/2669269> <https://cloud.tencent.com/developer/article/2716534> <https://news.ycombinator.com/item?id=36209777>
- **日常工作群**：上级在工作群转发公众号、小红书链接；下属反映这些链接和内部分享「AI 味」重、看了开头就不想看。
  - 时间：没有
  - 来源：<https://www.v2ex.com/t/1204220>
- **每半年**：Thoughtworks 技术雷达一年两期，可当外部参照；读者主要看条目落在哪一环（Adopt/Trial/Assess/Caution），官方自己说象限不重要、环才引发争论。国内管理者是否按期读没有证据。
  - 时间：没有
  - 来源：<https://www.thoughtworks.com/radar/faq> <https://www.thoughtworks.com/radar/byor>

## 需求

1. **当我要为一个业务场景定模型和供应商（或被老板问「该接哪家」）时，我想看到在我们自己任务上的对比——效果、单次成本、切换代价、合规边界——而不是榜单名次，以便拍板后能向上解释，要换的时候知道代价。**（原记录标为强）
   - 谁：CIO/CTO、平台负责人；小团队里是技术负责人本人
   - 痛在哪：榜单只能初筛且有刷分；技术评审只看效果不看 token 成本曲线；prompt 为一家调过后换模型要大量工程时间；公司买回来的模型一线觉得不好用。
   - 多频繁：每个新场景立项时 + 每次有新模型发布时；没有固定周期的证据
   - 现在怎么办：外部榜单初筛 → 内部 golden dataset 和开发者反馈 → 按用例混用多家（a16z：37% 的受访者用 5 个以上模型）。小团队靠论坛口碑、内部投票、个人试用。
   - 缺什么：证据里只看到「要自己测」，没看到谁把当初的选型依据留档、在新模型出来时拿出来对照。自建评估集「要持续维护」被点名但没有人说怎么维护。推断：重评多是被新模型发布或账单触发的临时动作，不是定期动作。
   - 证据：转述：一位受访负责人说他们确实看外部榜单，但不亲自试用、不听员工反馈就很难选。（a16z 调查中的匿名企业负责人（100 位 CIO 调查，VC 立场）） <https://a16z.com/ai-enterprise-2025/>
   - 证据：转述：所有 prompt 都是照 OpenAI 调的，agent 的质量保证又难，换模型要花很多工程时间。（a16z 调查中的匿名企业负责人） <https://a16z.com/ai-enterprise-2025/>
   - 证据：转述：很多 CTO 评审 AI 功能时只看准确率和延迟，忽略每次调用的 token 成本；评估不能只跑通用基准，要有自己业务的评估集并持续维护。（TechVision大咖圈（自称技术副总经理/CIO，个人专栏，身份未核实）） <https://cloud.tencent.com/developer/article/2682747>
   - 证据：转述：评测集公开导致刷榜，各家都自称第一，使用者最后只能用脚投票。（数字生命卡兹克（AI 自媒体作者，非管理者）） <https://cloud.tencent.com/developer/article/2513748>
   - 证据：转述：公司买的是 MiniMax，用下来觉得不太聪明；回帖者建议换模型。（fulinlin9527（大公司开发者，V2EX）） <https://www.v2ex.com/t/1205284>
   - 证据：转述：先引入的国内编码助手实际使用不满足需求，之后组织内部选型投票，Claude Code 明显胜出，现在要调研规模化落地路径。（CodeDaiQin（国内企业负责落地调研的工程师，V2EX）） <https://www.v2ex.com/t/1183984>
   - 证据：转述：各团队各自接模型是局部最优，企业知道在用 AI 却不知道谁在用、成本为什么涨。（春秋元泉（Token 管理类产品专栏，厂商立场）） <https://cloud.tencent.com/developer/article/2687358>
2. **当我要决定给团队配哪个编程智能体时，我想先低成本试一轮、有一个说得过去的「有没有用」的判断，再决定铺开，以便钱花得出去也交代得过去。**（原记录标为强）
   - 谁：工程经理、平台负责人、小团队 CTO
   - 痛在哪：工具每月都在变；厂商只给它能测的代理指标（采纳率）；A/B 做不了；额度很快用完；指标一公布就被刷或被躲。
   - 多频繁：小团队按月；大公司持续试、按年谈合同
   - 现在怎么办：让一批工程师天天用、收主观反馈 + 用量数字 + 问卷（Monzo）；选一个痛点最重的团队做试点比有无（中兴）；论坛问同行；公司层面考核 AI 代码入库率、公布 token 用量排名。
   - 缺什么：现有衡量基本是「用了多少」而不是「带来了什么」。880+ 工程领导的调查里，缺少清晰指标被列为主要难题之一（Laura Tacho 转述为 60% 的领导把它列为最大难题）。安全合规怎么介入只有零散描述。
   - 证据：原文："Until you try these tools yourself, all you have is speculation."（Suhail Patel，Monzo Bank 平台团队负责人（受访）） <https://newsletter.pragmaticengineer.com/p/how-tech-companies-measure-the-impact-of-ai>
   - 证据：转述：值不值这个问题他们没有唯一答案，现在很大程度是主观的；厂商只测它能测的，比如采纳率；这件事对多数团队没法做 A/B。（Suhail Patel，Monzo Bank 平台团队负责人） <https://newsletter.pragmaticengineer.com/p/how-tech-companies-measure-the-impact-of-ai>
   - 证据：转述：30 人团队买了一个月 Cursor Team，每人 20 美元额度重度用不到一天就没了；之前不买 Codex 是怕封号，Claude Code 因封号风险直接不考虑。（HeyVincent（30 人团队负责选型的人，V2EX）） <https://www.v2ex.com/t/1202879>
   - 证据：转述：公司开始考核每个开发、团队、部门的 AI 代码入库率并横向对比，不达标通报。（江南一点雨（在职开发/技术博主，描述所在公司）） <https://cloud.tencent.com/developer/article/2704007>
   - 证据：转述：公司突然上线可查每人 token 用量的网站，前三名占七成；之后三天原先排前面的人都不敢用了。回帖里另有公司是非开发人员也得凑 token。（PepperEgg 及回帖者（V2EX）） <https://www.v2ex.com/t/1206622>
   - 证据：转述：想引入 Cursor，但合规团队对 HIPAA/SOC2/审计留痕提出疑虑；回帖者说他们是经 CTO 许可走云厂商托管的模型，因为数据留在已合规的云内。（Poomba（受监管行业公司的决策者）与 verdverm，Hacker News） <https://news.ycombinator.com/item?id=47043484>
   - 证据：转述：LeadDev 对 880 名工程领导的调查里 60% 把缺少清晰指标列为最大的 AI 难题；董事会和高管盯着代码行数。（Laura Tacho，DX 公司 CTO（厂商立场，转述 LeadDev 报告）） <https://newsletter.pragmaticengineer.com/p/how-tech-companies-measure-the-impact-of-ai>
3. **当老板或业务方问「AI 到底提效多少、省了多少钱」、或我要续明年预算时，我想拿出口径能复算、对得上财务的数，以便预算批得下来、出了偏差我能交代。**（原记录标为强）
   - 谁：技术总监、CTO、CIO、AI 专项负责人
   - 痛在哪：整体提效很难量化；出码率、采纳率这类数好看但和交付周期对不上；对创新项目设短期 ROI 会把方向带偏，不设又证明不了；高管和一线对效果的感受差距大。
   - 多频繁：年度/季度规划、每次预算申请、项目复盘
   - 现在怎么办：报代码产出量、有效代码比例、用例数等局部指标；按场景确定性分两类管理（确定的要 ROI，探索的只要求定期汇报）；用开发者满意度顶着；卖方替买方建「基线账本」。
   - 缺什么：出码率从 53% 提到 80–90% 而交付周期没明显缩短的例子说明现有指标回答不了老板的问题（该例为二手转述）。没有看到被广泛接受的口径。
   - 证据：转述：像「效率提升 30%」这种指标从完整研发周期看很难量化；项目初见成效要向管理层汇报或进年度规划时，问题变成投多少人、投入产出比多少、指标怎么设。（郭华翔，蚂蚁集团高级前端技术专家（圆桌发言，声明不代表公司）） <https://cloud.tencent.com/developer/article/2593994>
   - 证据：转述：给创新设很短期的 ROI 创新就变味，没有 ROI 又证明不了；目前约三分之一团队背明确 ROI，其余只要求定期汇报进展。（龚银，安克创新 CIO（InfoQ 采访，含云厂商合作背景）） <https://cloud.tencent.com/developer/article/2538636>
   - 证据：转述：客户问省了多少钱，要的其实是三样：数字可验证、口径能入财务的账、他能拿着向上级交代。（顺势而为（自称 CTO，卖 AI 方案的一方，厂商视角）） <https://cloud.tencent.com/developer/article/2746739>
   - 证据：转述：对 5000 名美国白领的调查中，40% 的非管理者说 AI 没省任何时间，92% 的高层说 AI 让自己更高效。（The Guardian 记者 Ramin Skibba 转述调查） <https://www.theguardian.com/technology/2026/apr/14/ai-productivity-workplace-errors>
   - 证据：转述：复盘会上 PMO 的数据显示交付周期没缩短、返工更多；引高德团队在云栖大会的分享，出码率 53% 升到 80–90% 而交付周期无明显缩短。（老周聊架构（技术博主，转述他人分享）） <https://cloud.tencent.com/developer/article/2669269>
   - 证据：转述：CIO 对结果指标怎么定、怎么量、怎么计费不放心，多数仍愿意按用量付费。（a16z 100 位 CIO 调查） <https://a16z.com/ai-enterprise-2025/>
4. **当下属交来技术方案、调研或选型报告（越来越多是 AI 生成的）时，我想很快分清哪些内容有人验证过、哪些只是看起来完整，以便不把时间花在读没人负责的材料上，也不把错误带进决定。**（原记录标为强）
   - 谁：技术负责人、工程经理、架构负责人
   - 痛在哪：生成几乎不花力气、读却要花力气；下属说不清方案为什么这样；材料越光鲜评审越软；AI 味一重读的人直接不看。
   - 多频繁：每个需求、每份方案；Stanford/BetterUp 调查称 40% 的受访者一个月内收到过这类材料
   - 现在怎么办：追问「你讲给我听」；改成开会当面说；自己也用 LLM 提炼要点或再审一遍；设置必须人工确认的卡点；直接略过不读。
   - 缺什么：没有找到管理者明确说「我把这份 AI 报告打回了」的具体案例，只有抱怨和应对办法。也没有看到材料本身标明哪些结论是人验证过的做法（推断：这是空白）。
   - 证据：转述：让下属设计方案，他把需求扔给 AI，AI 出了表结构就直接跑；说设计不行，他回答 AI 就是这么设计的。帖主认为多数是经验不足、分不出 AI 结果对错。（DeepSIeep（管几个人几个项目的老员工，V2EX）） <https://www.v2ex.com/t/1181948>
   - 证据：转述：5 页的技术设计文档一半是 AI 胡写；提交后上司先让他用 AI 审一遍，再拿自己的 AI 的意见来对，两人逐条分辨哪些是胡说。（LandOfMightDev（入职一年的工程师，下属视角），Hacker News） <https://news.ycombinator.com/item?id=49771657>
   - 证据：转述：对 1150 名美国办公室员工的调查，40% 一个月内遇到过 workslop，平均每月花 3.4 小时处理（研究未经同行评审）。（The Guardian 转述 Stanford/BetterUp 研究（HBR 原文付费墙，只读到导语）） <https://www.theguardian.com/technology/2026/apr/14/ai-productivity-workplace-errors>
   - 证据：转述：对付上级发来的 AI 长文，可以丢给自己的 LLM 要一份要点；或者约时间当面聊，因为电话里给不了 AI 内容。（Sean Goedecke（工程师、技术博主）） <https://www.seangoedecke.com/how-to-protect-yourself-from-workslop/>
   - 证据：转述：文档看起来越完善，评审往往越温和、越没用，读的人因为对方已经投入很多而只挑小毛病。（Phil Calçado（曾任 SoundCloud、Meetup 等公司工程负责人）） <https://philcalcado.com/2018/11/19/a_structured_rfc_process.html>
   - 证据：转述：设计常得不到深入评审；评审人不确定该找什么，怕问出作者已经想过的问题。（Tanya Reilly，Squarespace 基础设施部门工程师） <https://engineering.squarespace.com/blog/2019/the-power-of-yes-if>
   - 证据：转述：技术分享全是 AI 生成的架构设计图，问题不在 AI 设计得差，而在分享的人根本没认真整理。（ufan0（开发者，V2EX 回帖）） <https://www.v2ex.com/t/1204220>
5. **当一个技术决定摆到我面前时，我想拿到的材料是：开头一段就有结论和要我决定什么，后面有备选方案和不选的理由、风险、谁拍板、截止日期，以便我在会前或会上十几分钟内读完并表态。**（原记录标为强）
   - 谁：审批人、DRI、技术总监；向高管汇报的工程负责人
   - 痛在哪：材料只有问题没有答案；学术式铺陈；罗列细节；不知道谁说了算，评论拖成无休止讨论；方案写完代码才来评审。
   - 多频繁：每次方案评审、每次向上汇报
   - 现在怎么办：海外：带审批人栏的 RFC 模板（批「yes」或「not yet」，鼓励「yes, if」）、一个 ADR 只写一个决定、把设计探索和决定分成两份文档、10 天评审期到期即决。国内自述：ADR + 选型对比表 + 性能评估 + 风险分析，提前 3 天发；小公司常只评方向或没有评审。
   - 缺什么：关于「管理者实际读哪一部分」，证据都是流程规定和写作建议（开头段、环的位置、状态栏），没有行为观察。国内大厂的评审模板没拿到。
   - 证据：转述：很多场合一段结构清楚的开头（情境、矛盾、问题、答案）就足以引出关键讨论，后文可能根本不会被讨论；向高管提问题而不带答案，对方会怀疑要不要换人。（Will Larson（工程高管，曾任 Stripe、Uber 工程负责人）） <https://lethain.com/present-to-executives/>
   - 证据：转述：新模板有审批人栏，审批人不点头就不开工；另设「考虑过的备选方案/已有做法」一节，写明为什么没选。（Tanya Reilly，Squarespace） <https://engineering.squarespace.com/blog/2019/the-power-of-yes-if>
   - 证据：转述：ADR 评审期通常 10 天，到期由 DRI 做决定并合并；要区分只需征询的人和有否决权的人（例如安全团队）。（GitLab 公开手册（公司工作文件）） <https://handbook.gitlab.com/handbook/engineering/architecture/workflow/>
   - 证据：转述：基于 200 多份 ADR 的经验，一份 ADR 只写一个决定，与会者不超过 10 人，会上先读 10–15 分钟；一到三次会应该定下来。（Christoph Kappey 等，AWS 架构师） <https://aws.amazon.com/blogs/architecture/master-architecture-decision-records-adrs-best-practices-for-effective-decision-making/>
   - 证据：转述：六页备忘质量差别很大，写得不好往往是以为一两天能写完，而好的需要一周或更久的反复改。（Jeff Bezos，Amazon 创始人（致股东信）） <https://www.aboutamazon.com/news/company-news/2017-letter-to-shareholders>
   - 证据：转述：评审前 3 天发出架构设计文档、选型对比表、性能评估和风险分析；常见的坑是评审走过场、写完代码才评审、没有记录。（紫风（自称研发部经理，个人专栏，文风疑似 AI 辅助）） <https://cloud.tencent.com/developer/article/2716534>
   - 证据：转述：技术评审就是评个方向，没功夫找出所有问题；多位回帖者说自己公司根本没有技术评审。（chairuosen 等（开发者，V2EX）） <https://www.v2ex.com/t/1142562>
6. **当几个月或几年后有人问「当初为什么这么选」、或者环境变了（新模型、新价格）时，我想找得到当时的依据并知道这条决定该不该重审，以便不盲目沿用也不盲目推翻。**（原记录标为强）
   - 谁：架构负责人、技术总监、接手团队的新负责人
   - 痛在哪：决定没被记下，过几个月理由就忘了；记了也没人在动手前去读；ADR 越写越杂，真正的架构决定被淹没；AI 相关决定半年就可能过时。
   - 多频繁：接手系统、出事复盘、技术换代时
   - 现在怎么办：ADR（背景、决定、状态、后果；被取代时互相链接）；会议纪要 + Action Item；个别 RFC 模板头部有「revisit date」；有人写工具在改到相关代码时自动把决定贴到 PR 上。
   - 缺什么：没有证据显示有人对 AI 选型做定期的事后对照（当初依据对不对、指标达没达）。看到的回头看都是被动的：出事、换人、或新技术把旧平台淘汰。推断：AI 决定的有效期比 ADR 这套做法预设的短得多。
   - 证据：转述：用过 ADR，但不接入自动化检查就被忽略，也很少更新；懂背景的人走后它们成了过去的遗迹。（turtleyacht（工程师），Hacker News） <https://news.ycombinator.com/item?id=36209777>
   - 证据：转述：团队照 Spotify 的建议写了 ADR，放在目录里，没人在提 PR 前读；问题在于决定没有在有人改相关代码时出现。（iamalizaidi（工程师、工具作者），Hacker News） <https://news.ycombinator.com/item?id=47226046>
   - 证据：转述：2019 年没评审自己拍板用 MongoDB 存订单，3 年后迁回 MySQL 花了 3 个月；评审讨论若没纪要，几个月后大家就忘了当时的理由。（紫风（自称研发部经理）） <https://cloud.tencent.com/developer/article/2716534>
   - 证据：转述：项目里最难追的是决定背后的动机；不了解动机的新人只能盲目接受或盲目更改；大文档没人读也没人更新。（Michael Nygard（ADR 提出者）） <https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions>
   - 证据：转述：2023 年投入小团队做了 AI 内容中台，到 2024 年下半年 AI 能力完全变了，果断重做、接受失败；智能体平台若核心价值转移也会毫不犹豫重构。（龚银，安克创新 CIO） <https://cloud.tencent.com/developer/article/2538636>
   - 证据：转述：SoundCloud 的 RFC 头部字段包括作者、评审人、revisit date 和状态。（Gergely Orosz（前 Uber 工程经理）汇编的公开模板） <https://blog.pragmaticengineer.com/rfcs-and-design-docs/>
   - 证据：转述：ADR 里塞进团队做的每个决定后，真正撤销成本高的架构决定反而被淹没。（Pierre Pureur、Kurt Bittner（架构顾问，InfoQ 中文译文）） <https://cloud.tencent.com/developer/article/2356500>
7. **当我要决定自建（平台、私有化模型、内部工具）还是采购现成时，我想知道这笔投入多久会被外部进展淘汰、总成本是多少、合规上有哪些硬约束，以便不在一年后推倒重来。**（原记录标为强）
   - 谁：CIO、CTO、平台负责人；小公司技术负责人
   - 痛在哪：自研推进速度赶不上外部；自建的真实成本（数据、评估、推理服务化）被低估；私有化预算很大但效果和兼容性不如云；局部「合理」的选择汇总起来失控。
   - 多频繁：年度预算、每个新 AI 场景
   - 现在怎么办：先自建后转采购；高敏业务本地模型 + 其余云 API 分级；中小企业被同行建议不要大规模自建、先用开源和现成工具解决六七成。
   - 缺什么：决定时拿不到「多久过时」的依据，只能事后接受失败。V2EX 上被要求执行私有化决定的工程师在问「这事还能走下去吗」，说明决定的依据没有传到执行层。
   - 证据：转述：2024 年 47% 的 AI 方案是内部自建，现在 76% 的 AI 用例是采购而非自建（约 500 位美国企业决策者调查）。（Menlo Ventures 报告（VC 立场，持有模型厂商股份）） <https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/>
   - 证据：转述：一家上市金融科技公司已开始自建客服方案，评估了市面第三方产品后决定改为采购；内部工具难维护且不带来业务优势。（a16z 100 位 CIO 调查中的案例） <https://a16z.com/ai-enterprise-2025/>
   - 证据：转述：自研 AI 研发工具能和内部系统打通，但要兼顾各部门需求，推进速度往往赶不上外部 AI 的发展。（王玉霞，中兴通讯资深需求教练和 AI 教练（圆桌发言）） <https://cloud.tencent.com/developer/article/2593994>
   - 证据：转述：公司用几千万预算部署国产开源模型，并规定高敏业务智能体必须用本地模型；已知问题是兼容性不如云厂商、偶有工具调用 bug、最新大模型部署不起。（SoulSleep（有规模公司的工程师，V2EX）） <https://www.v2ex.com/t/1229783>
   - 证据：转述：不到 50 人的公司想搭内部 AI 助手，在「自建 GPU + 开源小模型」和「外部 API」之间评估，自述对 GPU 服务器和自建模型不熟。（Aokiji（小公司技术负责人，V2EX）） <https://www.v2ex.com/t/1196345>
   - 证据：转述：不建议中小企业大规模自建 AI 系统，缺人才储备时盲目投入会挫伤信心；问题往往不是没有可用工具，而是不知道该选哪个。（黄金（趣丸科技基础架构组负责人）、郭华翔（蚂蚁），圆桌发言） <https://cloud.tencent.com/developer/article/2593994>
8. **当团队已经认定某个海外工具最好用时，我想有一条能对公签约、开发票、不封号、数据说得清的路径，以便把「员工自己买再报销」变成公司能负责的采购。**（原记录标为强）
   - 谁：国内公司的技术负责人、被指派做落地调研的工程师
   - 痛在哪：没有正规渠道订阅；多人共用或走中转有封号和数据风险；走云厂商 API 合规些但贵得多；有的公司强推 AI 却不出钱。
   - 多频繁：每次工具选型都会撞上；持续存在
   - 现在怎么办：员工自购报销；海外主体买云厂商托管模型再内部封装下发；中转站开票；退而求其次用国产工具（Trae、CodeBuddy、GLM 等）或 GitHub Copilot。
   - 缺什么：这是决定之后的执行障碍，不是信息缺口：技术上「选谁」已有答案，卡在采购与合规。证据全部来自 V2EX，偏中小公司和一线视角。
   - 证据：转述：现在是员工用自己的账号再报销，容易封号；公司想采购约 50 个公司账号，问有没有办法。（0x47（国内公司技术人员，V2EX）） <https://www.v2ex.com/t/1200488>
   - 证据：转述：国内公司没有正规渠道买官方订阅；通过云厂商采购 API 最接近勉强合规还能开票，但费用比订阅高很多。（SilencerL（V2EX 回帖者）） <https://www.v2ex.com/t/1200488>
   - 证据：转述：领导好不容易有意愿，现在头痛的是采购怎么合规、对公、开指定发票；几天后另一回帖者说开完会结论是让自己买、不给报销。（saltfish510、szqh97（V2EX）） <https://www.v2ex.com/t/1155695>
   - 证据：转述：直接订阅担心封号；Cursor 有企业管理能力且国内支持友好但能力被认为弱一些；回帖建议通过海外主体买云上托管模型、内部封装客户端统一下发。（CodeDaiQin 与 idblife（V2EX）） <https://www.v2ex.com/t/1183984>
   - 证据：转述：有的只允许用自建模型；有的给公司 Trae 账号、国外的不让用、有信创项目；有的自建网关可用最新海外模型并给每月 200 美元额度；有的老板只知道豆包。（多位回帖者（V2EX 小调研帖）） <https://www.v2ex.com/t/1200195>
   - 证据：转述：公司不给 API key、不报销、纯自费，却极力鼓吹并强制用 AI。（Freeego（后端开发，V2EX）） <https://www.v2ex.com/t/1204686>
9. **当我要向老板和业务方写季度规划、AI 落地进展、预算申请或复盘时，我想把技术上的事翻译成「要什么资源、做到什么目标、带来什么结果」，并在会前和相关人对齐，以便拿到资源而不是失去信任。**（原记录标为强）
   - 谁：技术经理、技术总监、CTO
   - 痛在哪：讲粗了讲细了领导都听不懂；罗列事项老板不关心；讲技术复杂度被当成绕圈子要人；最费劲的是把收益变成对方认的数字。
   - 多频繁：每周周报、季度/年度规划、专项汇报
   - 现在怎么办：结果导向的周报；用金字塔/SCQA 结构；会前把初稿发给与会高管问要改什么；方案汇报先私下达成一致、会上只同步结论；引用竞品公司的团队和资源配置作参照。
   - 缺什么：关于 AI 落地进展和预算申请具体怎么写，没有找到管理者公开的样例；中文一手材料偏旧（2018、2022）。「最费劲的是量化收益」与上一条 ROI 需求靠的是同一批来源。
   - 证据：转述：做了很专业的架构 PPT 想说明技术复杂、争取资源，业务负责人的反应是听不懂、原来就是想招人、是不是在忽悠我。（转载文章作者（技术管理者自述，原作者未署名）） <https://cloud.tencent.com/developer/article/1184871>
   - 证据：转述：汇报只需包含现有架构支撑未来业务要多久、团队分工、竞品公司的团队和服务器配置，以及要多少人和机器能换来多少速度与稳定性。（同上） <https://cloud.tencent.com/developer/article/1184871>
   - 证据：转述：事项太多老板不关心；只报整体情况和特殊情况、风险、建议；方案汇报要提前和相关人达成一致，会上只同步结论。（十毛（每周向老板汇报的部门负责人，个人博客）） <https://cloud.tencent.com/developer/article/2079962>
   - 证据：转述：每位高管都习惯以某一种方式消化被预处理过的现实，方式不对就会鸡同鸭讲；最管用的一条是把初稿提前发给一位与会高管问该改什么。（Will Larson（工程高管）） <https://lethain.com/present-to-executives/>
   - 证据：转述：汇报讲粗了领导听不懂，讲细了还是听不懂，讲多了时间不够，讲少了重点不突出。（腾讯云开发者公众号（直播预告文，平台方）） <https://cloud.tencent.com/developer/article/2106965>
   - 证据：转述：帖主比较三任领导，其中一条就是各自对上汇报的方式；回帖者说上级告诉他只有 20% 时间该自己干活，其余是进度和风险。（wanmyj、WebKit（V2EX）） <https://www.v2ex.com/t/1235251>
10. **当新模型、新工具或涨价出现时，我想知道它是否足以让我推翻或重审已有的决定，以便既不被每次发布牵着走，也不守着已经过时的选择。**（原记录标为中）
   - 谁：所有层级的技术管理者
   - 痛在哪：每月都有新东西；工具厂商自己的定价和规则也在变；没有判据说明「什么程度的变化值得重评」。
   - 多频繁：几乎每月被触发；无固定节奏
   - 现在怎么办：持续让团队试新工具；观望即将发布的模型；「等它超过现用的再切」；用接口抽象降低切换成本；接受一定的不确定和失败。
   - 缺什么：没有找到任何人描述固定的重评周期或触发条件。推断：现在的重评由发布新闻和同行议论触发，而不是由自己记录的假设被打破触发。
   - 证据：转述：不跟上这个快速变化的工具格局是愚蠢的；本可以一直用 Copilot，但变化太多，所以一直在试 Cursor、Windsurf、Claude Code。（Suhail Patel，Monzo Bank 平台团队负责人） <https://newsletter.pragmaticengineer.com/p/how-tech-companies-measure-the-impact-of-ai>
   - 证据：转述：给公司配的就选公认好用且成熟的；哪天另一家超过了再切过去不迟；有人提醒新模型几天内要发布可以先观望；有人因厂商规则朝令夕改而弃用。（Parva、Myprajna、bunny189（V2EX 回帖者）） <https://www.v2ex.com/t/1163588>
   - 证据：转述：准确识别哪些技术已足够成熟、又和自身场景契合，并在恰当时机投入，对大多数企业是极具挑战的决策。（InfoQ 记者转述龚银（安克创新 CIO）的看法） <https://cloud.tencent.com/developer/article/2538636>
   - 证据：转述：CEO 看了几场发布会回来要求全面拥抱 AI，CTO 迫于压力在每个模块都接大模型。（TechVision大咖圈（自称技术副总经理/CIO）） <https://cloud.tencent.com/developer/article/2682747>

## 信什么，不信什么

- 亲手试过的、或自己团队天天在用的人说的，压过一切二手材料。Monzo 平台负责人明说没试过就只是猜测，并接受评估带主观成分。https://newsletter.pragmaticengineer.com/p/how-tech-companies-measure-the-impact-of-ai
- 外部榜单只当初筛，不当结论。a16z 调查里企业把榜单当成类似 Gartner 魔力象限的过滤器，之后仍要内部 golden dataset 和员工反馈。https://a16z.com/ai-enterprise-2025/
- 榜单本身的公信力在中文圈被公开质疑（评测集公开导致刷榜、家家自称第一）。说话人是自媒体不是管理者。https://cloud.tencent.com/developer/article/2513748
- 厂商给的效果数字不被当真：厂商只测它能测的代理指标（采纳率），而且有动机让遥测数据不透明。https://newsletter.pragmaticengineer.com/p/how-tech-companies-measure-the-impact-of-ai
- 一线员工的偏好是采购依据：国内有公司直接内部投票选工具；a16z 里 CIO 说买企业版 ChatGPT 是因为员工喜欢、认这个牌子。https://www.v2ex.com/t/1183984 ；https://a16z.com/ai-enterprise-2025/
- 同行和标杆公司的做法被当作安全参照：选型方法论文章把「参照业界标杆」「看谁在生产用」列为主要依据；向上要资源时引用竞品公司的配置。https://cloud.tencent.com/developer/article/2217540 ；https://cloud.tencent.com/developer/article/1184871
- 下属说不清「为什么这样」的方案不被信；以「AI 就是这么说的」作答会直接失去信任。https://www.v2ex.com/t/1181948
- 一眼看出是 AI 写的材料会被降权甚至不看；领导用 AI 写的会议主题也会让下属看低领导。https://www.v2ex.com/t/1204220 ；https://www.v2ex.com/t/1235948
- 文档外观精致不等于可信，反而让评审变软（2018 年的观察，AI 让每份文档都精致后更成问题——后半句是推断）。https://philcalcado.com/2018/11/19/a_structured_rfc_process.html
- 数字要能复算、口径要对得上财务、来源要指得出，否则被认为是「往多了说」（卖方视角的总结）。https://cloud.tencent.com/developer/article/2746739
- 有具名审批人或 DRI 签字的决定更被接受；评论多少不算数，审批人不点头不开工。https://engineering.squarespace.com/blog/2019/the-power-of-yes-if ；https://handbook.gitlab.com/handbook/engineering/architecture/workflow/
- Thoughtworks 技术雷达自述的可信依据：进 Trial 环必须自己在生产项目用过；不接受厂商影响、不靠它创收；同时承认不是全面的市场调查。https://www.thoughtworks.com/radar/faq
- 对 AI 输出的基础信任很低：Stack Overflow 2025 调查里不信任 AI 工具准确性的开发者（46%）多于信任的（33%），有经验的开发者最谨慎；66% 的人最大的烦恼是「差一点就对」。https://survey.stackoverflow.co/2025/ai
- 高管自己的体感不可靠：同一调查里 92% 的高层说 AI 让自己更高效，40% 的非管理者说没省任何时间。https://www.theguardian.com/technology/2026/apr/14/ai-productivity-workplace-errors

## 工具和花费

- **Cursor Team**（团队编程智能体试用）：每人每月 20 美元套餐内额度（发帖者称重度使用不到一天用完，超额计费规则不清楚）；谁付：公司（30 人团队按月采购）；也有前端人手一个、公司报销 <https://www.v2ex.com/t/1202879>
- **公司自建模型网关 + 个人 API key**（统一接入多家模型、给编码工具配 key、统计用量）：有公司给每人每月 200 美元限额；有公司不限量；谁付：公司 <https://www.v2ex.com/t/1200195>
- **Claude Code（官方订阅或经云厂商托管模型）**（编程智能体）：帖子里没有可靠的官方价格；回帖者称走云厂商 API 比订阅贵很多；谁付：多为员工自购后报销；少数公司经海外主体走云厂商 <https://www.v2ex.com/t/1200488>
- **GitHub Copilot**（编程助手；受监管公司里常是唯一获批的）：Monzo 称它被并入已有的 GitHub 企业许可、不是单独一行预算；具体价格未提；谁付：公司 <https://newsletter.pragmaticengineer.com/p/how-tech-companies-measure-the-impact-of-ai>
- **国产工具与模型（Trae、CodeBuddy、MiniMax、GLM）**（公司统一采购的编程助手和模型额度）：帖子未给价格；有公司 Trae 账号 token 不限；谁付：公司 <https://www.v2ex.com/t/1202996>
- **私有化部署开源大模型（GPU 服务器）**（高敏业务必须用本地模型的合规要求）：发帖者称预算几千万元；谁付：公司（有规模的企业） <https://www.v2ex.com/t/1229783>
- **DX 开发者体验问卷 / AI 衡量框架**（用问卷和系统数据衡量 AI 工具的使用与影响）：没有；谁付：公司（Monzo 提到跑很多 DX 问卷）；DX 是厂商 <https://getdx.com/research/measuring-ai-code-assistants-and-agents/>
- **Google Deep Research**（一位 CTO 身份的博主用它直接生成《AI 辅助编程工具评测与企业选型指南》并原样发布）：文中未提；谁付：个人 <https://cloud.tencent.com/developer/article/2534370>
- **ADR / RFC（Markdown 放仓库或文档工具）**（记录技术决定和评审）：免费（流程成本是人的时间：AWS 称团队 20–30% 时间花在跨团队协调上）；谁付：无 <https://aws.amazon.com/blogs/architecture/master-architecture-decision-records-adrs-best-practices-for-effective-decision-making/>
- **Thoughtworks 技术雷达 / Build Your Own Radar**（外部技术参照；自建内部雷达）：免费，开源（AGPL）；谁付：无 <https://www.thoughtworks.com/radar/byor>
- **企业生成式 AI 总预算（海外）**（模型与应用支出）：a16z：企业负责人预计未来一年平均增长约 75%，创新预算占比从四分之一降到 7%；Menlo：2025 年企业 AI 支出 370 亿美元，其中编码 40 亿；谁付：公司 IT 和业务部门的常规预算 <https://a16z.com/ai-enterprise-2025/>

## 现在怎么用 AI

- 管理者自己用 AI 生成选型报告并原样发出：账号标注为 CTO 的「人月聊IT」公开了提示词，让 Google Deep Research 对四款编程工具做评测并给企业选型建议，两万多字，依据多是「据称」「用户反馈」，没有自己的实测。https://cloud.tencent.com/developer/article/2534370
- 管理者用 AI 审下属的东西：HN 上一位工程师说上司先让他用 AI 自审，再拿自己那边 AI 的意见来对，两人逐条分辨真假；一小时后上司又带着新一轮 AI 意见回来。只有下属视角、海外一例。https://news.ycombinator.com/item?id=49771657
- 会议转写后由 agent 生成需求文档和系统设计文档；发帖者同时列出没解决的问题：代码评审更多更长、不做容量规划后感觉要改回去。https://news.ycombinator.com/item?id=49275494
- 下属把需求直接丢给 AI 出方案和表结构、报错再丢给 AI 改；带人的人抱怨他们分不出对错。https://www.v2ex.com/t/1181948
- 小公司有人主张技术方案直接让 AI 出、先评了再说（回帖，带玩笑口吻）。https://www.v2ex.com/t/1142562
- 用 AI 对付 AI：把上级发来的 AI 长文丢给 LLM 提炼要点；作者同时指出有些面向全组织的报告本来就不是写来给人读的。https://www.seangoedecke.com/how-to-protect-yourself-from-workslop/
- 失败点一：收到的人要花时间返工。Stanford/BetterUp 调查 1150 人，40% 一个月内收到过 workslop，平均每月花 3.4 小时处理。https://www.theguardian.com/technology/2026/apr/14/ai-productivity-workplace-errors
- 失败点二：AI 评审工具自己也产出大量排版漂亮的废话，读它只为偶尔一条有用的。https://news.ycombinator.com/item?id=45337253
- 失败点三：用使用量当考核，结果是凑 token 或不敢用。https://www.v2ex.com/t/1206622 ；https://cloud.tencent.com/developer/article/2704007
- 失败点四：领导用 AI 写的会议主题和转发的 AI 味文章，被下属一眼看穿并因此看低。https://www.v2ex.com/t/1235948 ；https://www.v2ex.com/t/1204220
- 不用或用不上的人：公司不给 key 不报销的团队（https://www.v2ex.com/t/1204686 ）；合规团队没放行的受监管公司（https://news.ycombinator.com/item?id=47043484 ）；只允许自建模型的公司和「老板只知道豆包」的公司（https://www.v2ex.com/t/1200195 ）。
- 圆桌上的从业者普遍给 AI 设人工卡点：需求 agent 分析完价值要人确认才进下一步；运维里读可以放、写必须人审。https://cloud.tencent.com/developer/article/2593994

## 已经交出去的

- 工具和模型的对比调研交给下属或专人：领导有意愿后由工程师去问渠道、比方案、调研落地路径再回报。https://www.v2ex.com/t/1183984 ；https://www.v2ex.com/t/1155695
- 试点和知识库建设交给教练团队和一个痛点最重的试点团队，用有无对比来说服其他人。https://cloud.tencent.com/developer/article/2593994
- 使用数据的收集交给厂商面板、内部看板和问卷（采纳率、token 用量、入库率、开发者体验问卷）。https://newsletter.pragmaticengineer.com/p/how-tech-companies-measure-the-impact-of-ai ；https://www.v2ex.com/t/1206622
- 市场初筛交给外部榜单。https://a16z.com/ai-enterprise-2025/
- 选型报告的初稿交给 AI 深度研究工具（一例）。https://cloud.tencent.com/developer/article/2534370
- 设计文档的打磨和找对人交给 Coach Engineer；写作范例交给文档团队（Stripe 提供样例文档而不是填空模板）。https://handbook.gitlab.com/handbook/engineering/architecture/workflow/ ；https://slab.com/blog/stripe-writing-culture/
- 「提醒我这里有过一个决定」交给自动化：有人用 CI 在 PR 触及相关文件时自动贴出决定；另有人说 ADR 不接自动化就没人理。https://news.ycombinator.com/item?id=47226046 ；https://news.ycombinator.com/item?id=36209777
- 需求文档和系统设计文档的起草交给会议转写 + agent（一例）。https://news.ycombinator.com/item?id=49275494

## 不交的

- 最后拍板和担责。GitLab 写明 DRI 必须征询但有最终决定权；Calçado 强调必须明确谁对结果负责、谁有否决权；V2EX 上一线的说法是背锅担责是中层领导的事。https://handbook.gitlab.com/handbook/engineering/architecture/workflow/ ；https://philcalcado.com/2018/11/19/a_structured_rfc_process.html ；https://www.v2ex.com/t/1204686
- 对 AI 产出对不对的判断。中兴的教练说业务理解或技术能力不足就识别不出 AI 的错；趣丸的负责人说让 AI 猜不可接受，写操作和审批必须人来。https://cloud.tencent.com/developer/article/2593994
- 在自己业务上的实测。受访 CIO 说看了榜单仍要自己评；Monzo 要自己团队的人天天用。https://a16z.com/ai-enterprise-2025/ ；https://newsletter.pragmaticengineer.com/p/how-tech-companies-measure-the-impact-of-ai
- 向上汇报的口径和要资源的那句话。Larson 认为不带答案去见高管会让对方怀疑你的位置。https://lethain.com/present-to-executives/
- 安全合规的否决权留在安全/合规团队手里，不随选型下放。https://handbook.gitlab.com/handbook/engineering/architecture/workflow/ ；https://news.ycombinator.com/item?id=47043484
- 「这个项目要不要设短期 ROI」这类取舍由 CIO 本人想了很久后定。https://cloud.tencent.com/developer/article/2538636
- 架构方向。即使在几乎全用 AI 写代码的团队，接口设计和整体框架仍被认为该由人来。https://www.v2ex.com/t/1204686

## 和亲手做研究的人有什么不同

- 要的是能担责的结论加依据，不是全部细节：买方要数字可验证、可入账、可向上交代（https://cloud.tencent.com/developer/article/2746739 ）；高管常只需要开头一段（https://lethain.com/present-to-executives/ ）。做研究的人要的是方法和全量材料。
- 读的是被别人预处理过的现实。Larson 说每位高管都习惯一种固定的消化方式，换一种就读不进去（https://lethain.com/present-to-executives/ ）。所以同一份研究要按读的人改形状。
- 时间单位是会前或会上的十几分钟，一份材料对应一个决定（https://aws.amazon.com/blogs/architecture/master-architecture-decision-records-adrs-best-practices-for-effective-decision-making/ ），不是研究者的长时间深读。
- 判断材料靠「谁试过、谁签字、谁负责」多于自己复核：审批人具名、DRI、内部投票、试点团队（https://engineering.squarespace.com/blog/2019/the-power-of-yes-if ；https://www.v2ex.com/t/1183984 ）。
- 能接受主观和代理指标先用着。Monzo 负责人说工程师觉得有价值目前就够了（https://newsletter.pragmaticengineer.com/p/how-tech-companies-measure-the-impact-of-ai ）；研究者不会这样下结论。
- 卡住他们的常常不是信息而是非技术约束：采购渠道、发票、封号、信创、预算、老板的认知（https://www.v2ex.com/t/1155695 ；https://www.v2ex.com/t/1200195 ）。
- 同一个结论要再翻译一遍给不懂技术的上级，翻译的成败直接决定资源（https://cloud.tencent.com/developer/article/1184871 ）。
- 决定有保质期且要对后果负责：Larson 说几乎每个决定两年内会被重新考虑多次；安克一年后重做平台（https://lethain.com/present-to-executives/ ；https://cloud.tencent.com/developer/article/2538636 ）。研究者交完报告就结束，管理者要活到后果出现。
- 技术负责人是两种身份切换：写代码时是做的人；审下属方案、在评审会上定方向、被指派调研后向上给结论时是看的人和决定的人（https://www.v2ex.com/t/1181948 ；https://www.v2ex.com/t/1235251 ）。

## 意外的发现

- 小团队选编程工具时，「会不会封号」排在能力之前，最强的那个因此直接被排除。https://www.v2ex.com/t/1202879
- 有公司用内部投票定工具，投完才开始调研怎么合规落地——决定在前，依据在后。https://www.v2ex.com/t/1183984
- 以工程文化严谨著称的银行，平台负责人公开说衡量 AI 工具值不值目前主要靠主观感受，而且认为做不了 A/B。https://newsletter.pragmaticengineer.com/p/how-tech-companies-measure-the-impact-of-ai
- CTO 身份的作者把 AI 深度研究的输出连同提示词直接当企业选型指南发布。管理者不只是 AI 报告的读者，也是生产者。https://cloud.tencent.com/developer/article/2534370
- 公开渠道的中文「选型指南」被批量内容淹没：在腾讯云开发者社区搜「大模型选型」，首屏多数来自同一个匿名账号在 2026 年 7 月连发的十来篇。想靠搜索做选型的人先遇到的是这些。https://cloud.tencent.com/developer/search/article-大模型选型
- ADR 写了、放进仓库了，改代码的人照样不读；多位从业者说不接自动化就等于没有。https://news.ycombinator.com/item?id=47226046 ；https://news.ycombinator.com/item?id=36209777
- 文档越精致评审越软，这是 2018 年就有的观察；现在每份 AI 文档都很精致。https://philcalcado.com/2018/11/19/a_structured_rfc_process.html
- 自建还是采购在一年里翻转：自建占比从 47% 掉到 24%。https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/
- 很多小公司根本没有技术评审，谈不上「管理者读哪部分」；有流程的小公司留给方案的时间是一两天。https://www.v2ex.com/t/1142562
- 公司一边强制用 AI、一边不出钱；另一头是公布 token 排名后用得多的人反而不敢用了。https://www.v2ex.com/t/1204686 ；https://www.v2ex.com/t/1206622
- 几千万的私有化部署决定已经做了，执行的工程师在论坛上问这事技术上还走不走得下去。https://www.v2ex.com/t/1229783
- 「其实不需要新工具」的证据：圆桌上蚂蚁的专家说现成方案很多，问题不是没有工具而是不知道选哪个；V2EX 回帖者认为每月 20 美元的订阅「基本够用」，不够的人自己会掏钱。https://cloud.tencent.com/developer/article/2593994 ；https://www.v2ex.com/t/1163588

## 来源说明

- 检索受限：内置浏览器全程显示标签页已满，无法新开标签页（我没有动别人的标签页）；用 curl 访问 Bing、百度、搜狗、DuckDuckGo、Brave 等都返回验证码或无关结果，没有绕过。改用站内检索：V2EX（sov2ex 接口）、腾讯云开发者社区站内搜索、Hacker News Algolia，加上已知网址直取。因此来源分布受这三个入口影响很大。
- 共打开并读过约 65 个页面：V2EX 帖子 20 个、腾讯云开发者社区文章约 20 篇、英文文章和手册约 20 篇、HN 讨论 5 个。掘金两篇文章（架构评审一百问、我在创业公司当 CTO）页面打开但正文被反爬挡住，没有引用。HBR 的 workslop 原文付费墙，只读到导语，数字取自 The Guardian 对同一研究的报道，该研究未经同行评审。
- V2EX 被用来支撑需求 1、2、4、7、8、10：帖子彼此独立，但同属一个社区，偏开发者和中小公司，一线视角多于管理者本人；回帖有玩笑和广告成分（采购帖里有人卖账号，未采信）。
- 腾讯云开发者社区上的文章多为转载（InfoQ、公众号、个人博客）。自称 CTO/CIO/研发部经理的账号（TechVision大咖圈、顺势而为、紫风、人月聊IT）身份无法核实；紫风和 TechVision 的文章文风疑似 AI 辅助写作。「顺势而为」「春秋元泉」是卖方/厂商立场，只当作厂商认为需求在哪。
- 同一来源支撑多条需求：a16z 调查（需求 1、3、7、10 和信任）；Pragmatic Engineer 对 Monzo 的采访（需求 2、3、10 和信任）；InfoQ 圆桌（需求 3、7、4 和不交出去的事）；紫风一文（需求 5、6）；Larson 一文（需求 5、9、6）；V2EX 1183984（需求 1、2、8）；V2EX 1202879（需求 2、8）；Guardian 报道（需求 3、4）；安克采访（需求 3、6、7、10）。这些需求的「三个独立来源」里有重叠，强度判断应打些折扣。
- 立场：a16z 和 Menlo 是风投，分别持有 AI 应用和模型厂商的股份，报告面向创业者；Pragmatic Engineer 那篇与 DX 的 CTO 合写，作者披露自己是 DX 投资人；DX、LeadDev 报告有赞助方；安克的采访带云厂商合作背景；腾讯云开发者的「向上汇报」一文是直播预告。
- 时间：RFC/ADR/六页备忘/写作文化的来源集中在 2011–2020 年，早于大模型，只用来说明材料的形状和流程，不说明 AI 时代的做法。AI 相关来源集中在 2025-06 到 2026-09。两篇中文向上汇报文章是 2018 和 2022 年的。
- 地域：成文决策流程的证据几乎全是美欧公司；国内大厂（美团、阿里、字节、腾讯、得物、B 站）公开的方案评审和模型选型一手文章这次没拿到，国内部分靠论坛帖和个人专栏，代表性有限。
- 「管理者本人写的、本人受访说的、或带样本的调查」约占一半：Monzo、安克 CIO、InfoQ 圆桌三位、Larson、Calçado、Bezos、十毛、向上汇报文、几位 V2EX 上自述带团队或负责选型的发帖人，加上 a16z、Menlo、LeadDev、Stack Overflow、Stanford/BetterUp 五项调查。其余是一线下属视角、流程文件和厂商说法。

## 没查到的

- 国内大厂的技术方案评审、模型选型、AI 工具铺开的一手文档和模板没有拿到（搜索被挡）。需要直接找这些公司的技术管理者访谈或要内部模板。
- 管理者实际怎么读下属的选型报告：读哪几部分、读多久、读完做什么。现有证据都是流程规定和写作建议，没有行为观察，只有访谈或跟读能回答。
- 模型多久重新评一次、由什么触发、谁发起。没有找到任何固定周期或触发条件的描述。
- 试用多久才决定。只有一个数据点（按月）。
- 预算怎么批、谁批、要附什么材料。没有找到流程细节。
- 安全/合规部门在国内公司怎么介入 AI 工具选型。只有零散一句话的描述（只许自建模型、国外的不让用、有人问代码暴露给模型厂商怎么办）。
- 管理者把 AI 生成的调研或选型报告打回的具体案例没有找到；管理者自己用 AI 审下属材料的国内自述也没有找到，只有海外 HN 一例且是下属视角。
- 决定之后有没有人对照当初的依据：对 AI 选型，没有找到任何人在系统地做。是没人做，还是做了没公开，只有访谈能分清。
- 带样本的中国技术管理者调查没有找到。本报告里所有比例数字都来自美国样本。
- 每天、每周花多少时间跟进和看材料：没有任何数字。
- 他们愿意为「替我准备决策材料」付多少钱、现在有没有为此付费：没有证据。看到的付费都是买工具和 token，不是买材料。
- 内部技术雷达在国内公司有没有人维护、管理者看不看：没有证据。
- 事故复盘这一类向上材料只读到一篇 2021 年的通用文章，未形成可引用的证据；AI 相关事故怎么向上写没有找到。

