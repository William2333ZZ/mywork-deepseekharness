# 技术经理 3：怎么跟上变化

原始调研记录（2026-10-05）。关键陈述的复核结果见上一级目录的 `audit-tech-managers.md`；被复核改正或降级的地方以复核和报告正文为准。数字和说法以各条所附网址的原文为准。

## 人群

- **做 AI 产品的小公司 CTO / 技术合伙人（既写代码又拍板）**：几十人以内的 AI 应用公司、AI 编程工具公司、做智能体的团队里的 CTO、技术合伙人、技术负责人。写代码时是做的人；在选模型和供应商、定成本、对老板和客户解释时是看材料、做决定的人。
  - 要做的决定：用哪家模型和哪个版本、走官方还是云厂商或中转、要不要备第二家；频率很高：Amplify 2025 调查里超过一半受访者至少每月更新一次模型，17% 每周。错了的代价是被供应商卡脖子：Windsurf 被 Anthropic 在不到五天通知期内砍掉几乎全部一方容量；Cerebras 的企业客户称订阅的模型被终止后被请出平台；百炼下线一批历史模型，用 deepseek-v3.1 做智能体的团队要整体重测。
  - 现在读什么：X 上的官方账号和少数个人、Hacker News 及评论区、官方更新日志和下线页、Simon Willison 博客、V2EX / L 站、Telegram 频道；自己掏钱订工具亲测（每月 100 到 200 美元）。没有人替他们准备，多数靠自己刷和同行群里转。
  - 规模：没有可靠的人群数字。线索：Amplify 报告称调查了数百名做 AI 的工程师（https://www.amplifypartners.com/blog-posts/the-2025-ai-engineering-report）；follow-builders 这类给 builder 的摘要仓库 6800 多星（https://github.com/zarazhangrui/follow-builders）。
- **互联网和软件公司的工程经理 / 技术总监 / 一线技术负责人**：把 AI 用进研发和业务的公司里带 5 到 100 人的管理者。多数已不怎么写生产代码，但被要求推动团队用 AI、给团队配工具、每周组织分享。
  - 要做的决定：给团队配什么 AI 工具（Cursor、Claude Code、Trae、自建模型网关）、每人多少额度、能不能用境外模型、定不定使用规范；按季度或按事件决定。错了的代价：账号被封、工具里好用的模型被悄悄下架、token 账单涨了却说不清效果。
  - 现在读什么：公众号（量子位、新智元、机器之心）、B 站日更早报（橘鸦）、V2EX、X、同事吃饭闲聊；公司每周或每两周的内部 AI 分享会；海外是 Pragmatic Engineer、SoftwareLeadWeekly、LeadDev。替他们筛的人是团队里的早期采用者和轮到分享的同事。
  - 规模：海外线索：LeadDev《AI Impact Report 2025》称调查了 880 多名工程领导者（https://leaddev.com/the-ai-impact-report-2025）；SoftwareLeadWeekly 自称 31,020 名读者（https://softwareleadweekly.com/）；Pragmatic Engineer 自称 100 万以上读者，含工程师和工程经理（https://newsletter.pragmaticengineer.com/about）。中国没有找到数字。
- **大公司和大企业的技术 VP / CIO / 数字化与 AI 落地负责人**：管预算、管供应商、对经营层负责的人，基本不写代码。包括大厂技术 VP、上市公司 CIO、传统企业信息化和数字化总经理。
  - 要做的决定：年度和季度的 AI 预算、买应用还是自建、用几家模型、放在哪家云、数据安全和合规。a16z 对 100 位 CIO 的调查：预期未来一年预算平均增长约 75%，37% 的受访者在用 5 个以上模型；采购流程越来越像传统软件采购。错了的代价是预算花了看不到效果、向上解释不了。
  - 现在读什么：同行闭门会和社群（TGO 鲲鹏会、厂商办的 CTO 圆桌）、厂商大会、咨询公司的半年期材料（Thoughtworks Technology Radar）、外部榜单当初筛、下属和专门的 AI 团队的汇报、公司内部的通识培训。
  - 规模：线索：a16z 调查样本 100 位 CIO（https://a16z.com/ai-enterprise-2025/）；Snowflake 称其首届 CTO Circle 聚了 350 多位 CTO（厂商说法，https://www.infoq.cn/article/cFMO2oN8SyaR9vuUVUeQ）；TGO 杭州分会自称近百位科技决策者（https://www.infoq.cn/article/MOVBghUgQrXWr9igbK2p）。
- **受限环境里的技术负责人（只能用自建或国产模型，或老板不懂技术）**：信创项目、金融、大厂内部只许用自家模型的团队，以及老板靠刷短视频和朋友圈了解 AI 的中小公司的技术负责人。
  - 要做的决定：在国内怎么合规拿到海外模型和工具、国产模型选哪家、老板问要不要采购 AI 时怎么答。错了的代价：封号断供、违规、或者老板不经验证直接上马甚至裁人。
  - 现在读什么：老板转发的文章和短视频、公众号、V2EX；可用的工具有限（只知道豆包、只给国产模型的 key）。老板的信息渠道和工程师不同，多来自老板圈子和老板课。
  - 规模：没有数字。线索只有 V2EX 帖子里的自述（https://www.v2ex.com/t/1200195 ，https://www.v2ex.com/t/1200610）。

## 一天、一周、一个事件

- **每天早上或固定的一小段时间**：过一遍聚合或早报：像看报纸一样扫 X 时间线、看 B 站日更早报、打开 AIHOT 这类聚合站，或者读机器人推到飞书群的早报。感兴趣的开标签页稍后读。
  - 时间：nilenso 工程师自述约 15 到 20 分钟（自称没掐过表）；x-monitor-feishu 的作者把早报定在北京时间 9:00 推。没有针对技术管理者的抽样数字。
  - 来源：<https://blog.nilenso.com/blog/2025/06/23/how-i-keep-up-with-ai-progress/> <https://www.v2ex.com/t/1214741> <https://github.com/datazhy/x-monitor-feishu> <https://aihot.virxact.com/>
- **通勤、午休、会议之间的碎片时间**：Google 的工程负责人 Addy Osmani 自述在通勤火车上读一章技术书、午休做练习、叠衣服时看大会演讲；阿里的技术专家汤威自述午休前让 AI 去做一项研究，睡醒看结果。
  - 时间：Addy Osmani：每天至少 30 分钟，可以拆成几段。其他没有数字。
  - 来源：<https://leaddev.com/career-development/how-keep-tech-trends-and-upskill-sustainably> <https://www.infoq.cn/article/P4LBQJIK5dY17awsxh0K>
- **每周**：读一份周报或周刊（周五早上收到自己搭的摘要、每周的管理类通讯）；公司每周五或每两周开内部 AI 分享会，随机抽人讲；有人干脆每周只集中补一次。
  - 时间：没有时长数字。频率：分享会每周或每两周一次；HN 用户称只做一次每周补课。
  - 来源：<https://news.ycombinator.com/item?id=48939630> <https://www.v2ex.com/t/1204230> <https://softwareleadweekly.com/>
- **每月**：自己掏钱订一两个最强的工具亲手试，给团队定标杆；更新线上用的模型；读一份月度的压缩简报。
  - 时间：来也科技 CTO 胡一川自述有两个月几乎每天深度用一到两小时；Imprint CTO Will Larson 自述每个上手小项目 2 到 10 小时；Simon Willison 的月度简报定位为十分钟读完。
  - 来源：<https://www.infoq.cn/article/P4LBQJIK5dY17awsxh0K> <https://lethain.com/company-ai-adoption/> <https://simonwillison.net/about/> <https://www.amplifypartners.com/blog-posts/the-2025-ai-engineering-report>
- **半年到一年（规划、预算、大会）**：看半年一期的技术雷达；参加技术领导者大会和闭门会；组团去硅谷参会；做年度预算和供应商评估。
  - 时间：Thoughtworks Radar 一年两期；TGO 的硅谷参访团一次四天。
  - 来源：<https://www.thoughtworks.com/radar/faq> <https://www.infoq.cn/article/RGDB7CQSi4E0rvOXzWMC> <https://a16z.com/ai-enterprise-2025/>
- **出事的时候（收到下线、调价、封禁通知）**：突击评估影响、重测提示词和智能体、找替代模型，同时到论坛发帖问别人换成了什么。
  - 时间：通知期从不足五天（Windsurf）到约一个月（百炼站内信）到约半年（OpenAI 微调模型）不等；也有不通知直接下架的。
  - 来源：<https://techcrunch.com/2025/06/03/windsurf-says-anthropic-is-limiting-its-direct-access-to-claude-ai-models/> <https://www.v2ex.com/t/1218919> <https://community.openai.com/t/deprecation-of-fine-tuned-models-but-still-cant-access-newer-ones/1379550> <https://github.com/Trae-AI/TRAE/issues/2513> <https://www.v2ex.com/t/1234994>
- **被老板或业务方问到的时候**：老板刷到 AI 消息后来问 AI 到什么程度了、要不要采购、别人都在裁员我们为什么不；技术负责人临时组织说法。
  - 时间：没有
  - 来源：<https://www.v2ex.com/t/1204061> <https://www.v2ex.com/t/1200610> <https://www.infoq.cn/article/Z4GAgXGi6gYdWMrQk8ro>

## 需求

1. **当我们在用的模型、接口或 AI 工具要下线、调价、改名重定向、限区域或封号时，我想在供应商动手之前就知道，并且知道影响到哪些业务，以便留出测试和迁移时间、提前把成本变化跟上面说清楚。**（原记录标为强）
   - 谁：做 AI 产品的 CTO 和技术合伙人；管着线上智能体、模型网关或团队研发工具的技术负责人
   - 痛在哪：通知期短、渠道散（站内信、邮件、文档脚注、X），有的根本不通知；一换模型就要把提示词和智能体整体重测。
   - 多频繁：供应商侧几乎每月都有；Amplify 2025 调查里超过一半受访者至少每月更新一次模型，17% 每周。
   - 现在怎么办：等站内信和邮件；看到别人在 V2EX、X、Discord 发帖才知道；少数人订下线信息的 RSS 推到 Slack；用多模型和网关留后路。
   - 缺什么：证据里有的：通知期可短到不足五天；有工具直接下架不公告；有供应商把旧模型名悄悄指到新模型。推断：现成的下线追踪（deprecations.info）只覆盖海外九家，没有百炼、DeepSeek 等国内供应商，也不会告诉你自己的哪个业务在用；它的仓库只有 18 星，说明知道并使用的人很少。
   - 证据：转述：CEO 说对方通知很短，他们本来愿意付全价买容量，对这个决定和通知期感到失望（Varun Mohan，Windsurf CEO（AI 编程工具公司），TechCrunch 记者引述其 X 帖） <https://techcrunch.com/2025/06/03/windsurf-says-anthropic-is-limiting-its-direct-access-to-claude-ai-models/>
   - 证据：转述：供应商这样频繁终止模型，没法在上面建一个稳定的生意（HN 用户 remusomega，自称 Cerebras 企业客户、创业者） <https://news.ycombinator.com/item?id=46707904>
   - 证据：转述：我们很多智能体是用 deepseek-v3.1 做的，这次一换又增加了测试工作量（V2EX 用户 EasonIndie（团队里做智能体的人，职位未说明）） <https://www.v2ex.com/t/1218919>
   - 证据：转述：部分历史快照模型下线，请在截止日前完成迁移（阿里云官网公告（厂商）） <https://www.aliyun.com/notice/118345>
   - 证据：转述：我们用 nano 就是因为响应快；替代模型不微调做不对我们的分类（OpenAI 开发者社区用户 dandiep（在产品里用微调模型的开发者）；OpenAI 客服确认 2026-10-23 移除） <https://community.openai.com/t/deprecation-of-fine-tuned-models-but-still-cant-access-newer-ones/1379550>
   - 证据：转述：公告也没有，突然就没了；订阅还没到期（TRAE 的多名付费用户（GitHub issue，27 条跟帖）） <https://github.com/Trae-AI/TRAE/issues/2513>
   - 证据：转述：旧模型名仍可调用，请求将由新模型提供服务并按新价计费（DeepSeek API 文档（厂商）） <https://api-docs.deepseek.com/zh-cn/quick_start/pricing>
   - 证据：转述：别再错过任何一次模型停用（deprecations.info 作者（个人开发者，仓库 2025-08 建，18 星）） <https://deprecations.info/>
   - 证据：转述：刚集成完一个模型，另一个又发布，还带着破坏性变更（Amplify Partners《2025 AI Engineering Report》，调查数百名 AI 工程从业者（风投机构，与 Latent Space 合作）） <https://www.amplifypartners.com/blog-posts/the-2025-ai-engineering-report>
2. **当我每天只有十几二十分钟看 AI 消息时，我想只看到和我们的技术栈、业务有关的少数几条，并且一眼知道它跟我有什么关系，以便不被重复转发和零散信息耗掉时间。**（原记录标为强）
   - 谁：各类技术管理者；帖子里的发言者多为普通开发者，身份未核实
   - 痛在哪：每天每小时都有新东西；消息零散分布在 X、公众号、群、B 站；关注多了全是互相转发；中文平台封闭，自己聚合不起来；长时间不读积压后有心理负担。
   - 多频繁：每天
   - 现在怎么办：刷 X 和公众号；看 B 站早报；用免费聚合站（AIHOT、BestBlogs、今日热榜）；自己搭抓取加 LLM 打分的管道；让 ChatGPT 或 Codex 定时汇总；或者干脆不追。
   - 缺什么：证据里有的：聚合站和早报是面向所有人的同一份，楼主追问过信源能不能自定义、只服务自己；中文源难自动抓。推断：没有一个现成做法按「我们在用什么、在做什么」来判断相关性；最大的开源聚合项目 TrendRadar 写明的适合人群是投资者、自媒体、企业公关，不是技术管理者。
   - 证据：转述：AI 每天每小时都有新东西，资讯零零散散分布在各处（V2EX 用户 gongfuxiongmao（开发者，职位未说明），37 条回复） <https://www.v2ex.com/t/1214741>
   - 证据：转述：信息最快的是 X，但要自己筛；关注多了基本都是重复的（V2EX 用户 szboy、Mandelo、ghosts（开发者），51 条回复） <https://www.v2ex.com/t/1232563>
   - 证据：转述：是落后被淘汰，还是跟上然后累垮？后来发现这是个假两难（Dan Mahr，工程领导者，LeadDev 演讲摘要） <https://leaddev.com/culture/obsessing-over-ai-is-optional>
   - 证据：转述：每天 200 多篇根本读不完，标题党、转载、机翻、营销稿混在一起（BestBlogs 作者 Gino Zhang（产品方自述，属于供给方说法）） <https://github.com/ginobefun/BestBlogs>
   - 证据：转述：只看真正关心的新闻资讯（TrendRadar 作者 sansan0（开源项目 README）） <https://github.com/sansan0/TrendRadar>
   - 证据：转述：订阅的源越来越多后，碎片时间阅读会感到信息洪流袭来（少数派作者「不孤独的二向箔」（开发者，Tidyread 作者，带自荐）） <https://sspai.com/post/90423>
   - 证据：转述：我像看报纸一样过一遍时间线，大概十五到二十分钟（Atharva Raykar，咨询公司 nilenso 的工程师（不是管理者，作对照）） <https://blog.nilenso.com/blog/2025/06/23/how-i-keep-up-with-ai-progress/>
3. **当我看到一条说某模型或工具大幅领先、成倍提效的消息或一张榜单时，我想知道它出自谁、有没有一手出处、在像我们这样的场景里是否成立，以便决定要不要让团队花时间去验证。**（原记录标为强）
   - 谁：要为选型和采购负责的 CTO、技术总监、CIO
   - 痛在哪：厂商话术、自媒体标题、营销号、卖课和卖 token 的人混在一起；公开榜单好看的模型放到内部场景不稳定。
   - 多频繁：每次有新模型或新工具发布，约每周
   - 现在怎么办：只看官方公告和原文；只信少数几个长期的个人整理者；看评论区；等它在多个地方反复出现；把外部榜单当初筛，再自己试。
   - 缺什么：证据里有的：管理者说仍然必须自己评估，外部榜单只是其中一个因素。推断：没有人替他们把「这条消息的出处和可信度」和「在我们场景里要验证什么」连起来。
   - 证据：转述：多数所谓 AI 工具只是把 AI 写进了营销话术（Will Larson，Imprint CTO（金融科技公司）） <https://lethain.com/company-ai-adoption/>
   - 证据：转述：外部榜单我们肯定看，但不真正试用和收集员工反馈很难选（a16z 对 100 位企业 CIO 的调查及访谈中的一位领导者（风投机构）） <https://a16z.com/ai-enterprise-2025/>
   - 证据：转述：默认一切转述都有问题，直接去读实验室的原始公告（Atharva Raykar，nilenso 工程师） <https://blog.nilenso.com/blog/2025/06/23/how-i-keep-up-with-ai-progress/>
   - 证据：转述：某号的标题太夸张，动不动就人类末日（V2EX 用户 jsdi、kuhung（开发者）） <https://www.v2ex.com/t/1210655>
   - 证据：转述：邮件写的是不支持地区的请求，怎么就变成了针对中国开发者（V2EX 用户 airyland 等（开发者）） <https://www.v2ex.com/t/1052345>
   - 证据：转述：越是要负责任的资深人员，越强调人工核实（Stack Overflow 2025 开发者调查（该题约 3.3 万人作答，对象是开发者不是管理者）） <https://survey.stackoverflow.co/2025/ai>
   - 证据：转述：榜单上表现好的模型，到内部场景可能因上下文和数据问题不稳定（InfoQ 报道超聚变论坛（厂商宣传性质）） <https://www.infoq.cn/article/TLRAmZy8pPICVFVWmu6p>
4. **当一个新模型或新工具看起来可能改变我们的做法时，我想自己花几个小时上手试一下，以便形成自己的判断、给团队定标杆，而不是转述别人的结论。**（原记录标为强）
   - 谁：CTO、技术负责人、一线技术管理者（这是他们明确不交出去的部分）
   - 痛在哪：要自己花钱花时间；大厂里外部工具不许用于生产代码，只能做原型；试完的结论留在个人脑子里。
   - 多频繁：每月到每季度
   - 现在怎么办：个人自费订阅（每月 100 到 200 美元）；做 2 到 10 小时的小项目；先用最强的模型探上限，再对比公司内部工具。
   - 缺什么：证据里只说明他们坚持亲手做，没有说哪里不够。推断：缺的是决定「这次值不值得我亲自试」的前置筛选，以及把个人试用结论变成团队可复用材料的环节。
   - 证据：转述：每个小项目花两到十小时，让我看清了它能做什么、不能做什么（Will Larson，Imprint CTO） <https://lethain.com/company-ai-adoption/>
   - 证据：转述：必须自己亲自试用，才能真正发现它的价值（胡一川，来也科技联合创始人兼 CTO（InfoQ 直播实录）） <https://www.infoq.cn/article/P4LBQJIK5dY17awsxh0K>
   - 证据：转述：管理者每个月至少花点钱亲自体验先进的工具（王东旭，快手磁力引擎风控技术负责人（InfoQ 直播实录）） <https://www.infoq.cn/article/P4LBQJIK5dY17awsxh0K>
   - 证据：转述：先用最强的模型测一遍，知道上限在哪，再给团队定标杆（汤威，阿里巴巴高级前端技术专家（InfoQ 直播实录）） <https://www.infoq.cn/article/P4LBQJIK5dY17awsxh0K>
   - 证据：转述：读懂原理之后，我知道了什么时候该用、什么时候别用（李梦泽，飞书前端负责人（InfoQ 访谈实录）） <https://www.infoq.cn/article/Z4GAgXGi6gYdWMrQk8ro>
   - 证据：转述：负责人不亲自下场做出原型，转型就推不动（李靖瑜，猎豹移动集团总经理（TGO 大会回顾，组织方转述）） <https://www.infoq.cn/article/MOVBghUgQrXWr9igbK2p>
5. **当老板或业务方拿着刷到的 AI 消息来问我们是不是落后了、要不要上、要不要买时，我想有一套说得清的现状、案例和代价，以便把话接住，把大家的认知拉到同一条线上。**（原记录标为中）
   - 谁：向非技术老板或经营层汇报的技术负责人、CIO
   - 痛在哪：上面的信息来自短视频、朋友圈、老板圈子，和工程师的渠道不同；各团队对 AI 的能力、概念和边界各说各话；业务领导最先问的是有没有别人的成功案例。
   - 多频繁：不定期，由外部热点触发
   - 现在怎么办：临时组织说法；内部搞通识培训和提效比赛；每周分享会让下面的人讲。
   - 缺什么：证据里有的：信息输入碎片化、不成体系导致认知难对齐；分享会越讲越卷、内容带包装。推断：没有现成材料把「外面在传什么」翻成「对我们公司意味着什么、代价多少」。
   - 证据：转述：认知不统一是第一道障碍，各团队各说各话（蒋林泉，阿里云智能集团副总裁、CIO（InfoQ 记者整理的 CIO 对话）） <https://www.infoq.cn/article/elIEmtKU92WkTKk6wDNh>
   - 证据：转述：领导们问得很务实：有没有案例，别的公司怎么做成的（肖然，Thoughtworks 中国区总经理（InfoQ 访谈实录）） <https://www.infoq.cn/article/Z4GAgXGi6gYdWMrQk8ro>
   - 证据：转述：老板只是道听途说，问我公司应不应该采购 AI（V2EX 用户 wvx（公司里的开发者）） <https://www.v2ex.com/t/1204061>
   - 证据：转述：外面说一人一个团队，他就敢不验证直接上马（V2EX 用户 McD0nalds、jackOff（开发者）） <https://www.v2ex.com/t/1200610>
6. **当我要做一个没有成熟答案的决定（工具怎么配、组织怎么改、预算给多少）时，我想知道和我们规模相近的同行实际怎么做、做到了什么水平，以便有参照，向上也好交代。**（原记录标为强）
   - 谁：工程总监、技术 VP、CTO
   - 痛在哪：这类经验多停留在各公司内部；公开分享多是修饰过的成功故事；二手转述失真。
   - 多频繁：每季度到每年，重大决定前
   - 现在怎么办：加入技术领导者社群（TGO、SFELC 一类）；参加闭门会和厂商办的 CTO 圆桌；组团去海外大会；在论坛发帖做小调研。
   - 缺什么：证据里有的：有工程总监公开求同行小组；有人在论坛发问卷式帖子问各家 AI 基建到哪一步。推断：平时没有持续、可比的同行做法材料，只能靠线下活动和发帖。组织方和厂商的说法有招揽成分。
   - 证据：转述：有没有工程领导者在认真讨论这种团队配置的同行小组（HN 用户 agentwrangler，自称 AI 创业公司工程总监） <https://news.ycombinator.com/item?id=49051762>
   - 证据：转述：不能只盯自己的业务，要知道同行和竞品做到了哪一步（王东旭，快手磁力引擎风控技术负责人） <https://www.infoq.cn/article/P4LBQJIK5dY17awsxh0K>
   - 证据：转述：好奇大家公司的内部 AI 基建到了什么程度（V2EX 用户 AkaHero 及回复者（各公司员工）） <https://www.v2ex.com/t/1200195>
   - 证据：转述：一个人去看回来讲，别人听到的终究是二手信息（TGO 鲲鹏会与 Snowflake 的活动回顾（组织方和厂商）） <https://www.infoq.cn/article/RGDB7CQSi4E0rvOXzWMC>
   - 证据：转述：领导者很看重和面临同样决定的同行坦诚交流（Snowflake（厂商博客，InfoQ 中文转载）） <https://www.infoq.cn/article/cFMO2oN8SyaR9vuUVUeQ>
   - 证据：转述：做务实的早期大众，向早期采用者同行学就够了（Dan Mahr，工程领导者，LeadDev 演讲摘要） <https://leaddev.com/culture/obsessing-over-ai-is-optional>
7. **当模型价格、套餐额度变了，或者 token 账单涨上去时，我想知道同等效果下更便宜的组合和换过去的代价，以便控制预算，并解释钱花得值不值。**（原记录标为中）
   - 谁：管预算的 CTO、CIO、技术总监；自己付 API 费的小团队负责人
   - 痛在哪：价格和额度总在变，综合信息不可靠；token 花了不少管理者看不到效果；换模型本身有工程成本。
   - 多频繁：每次调价或新模型发布；预算按季度和年度
   - 现在怎么办：自己花钱逐个试；看 OpenRouter 用量排行和个别榜单；到论坛问别人换了什么；和云厂商签长约；设每人每月额度。
   - 缺什么：证据里有的：有人说缺一个公开的第三方 token 价格追踪指数；有人说订阅额度和新模型一直在变、只能自己掏钱测。推断：没有把「价格变化」和「我们这个用法的实际花费与效果」放在一起的材料。管理者把追价格当成日常工作的直接自述没有找到。
   - 证据：转述：模型都够用了，价格就成了更重要的因素（a16z 调查中受访的企业技术领导者） <https://a16z.com/ai-enterprise-2025/>
   - 证据：转述：额度和新模型总在变，整体信息不可靠，只能自己掏钱量（HN 用户 solomonmwalker（提问）、frangonf（回复），个人开发者） <https://news.ycombinator.com/item?id=49550324>
   - 证据：转述：涨了三倍起，用不起了；有没有差不多聪明的模型可以接着用（V2EX 用户 xuhengjs、longaiwp、laizenan（开发者）） <https://www.v2ex.com/t/1234192>
   - 证据：转述：现在缺的是一个公开的第三方 token 价格追踪指数（V2EX 用户 cufezhusy、Yserver） <https://www.v2ex.com/t/1206837>
   - 证据：转述：token 花了不少，管理者却看不到效果（杨瑞，英睿信息 CEO、TGO 厦门负责人（大会回顾转述）） <https://www.infoq.cn/article/MOVBghUgQrXWr9igbK2p>
8. **当团队想用海外模型和工具时，我想知道在国内哪种拿法走得通、会不会被封、公司规定允许什么，以便给团队一个稳定且交代得过去的配置。**（原记录标为中）
   - 谁：中国公司的技术负责人、负责给团队采购工具的人
   - 痛在哪：官方不卖给国内主体；员工自购再报销容易封号；政策和封禁规则说变就变；大厂和信创环境只许用自家或国产模型。
   - 多频繁：持续；每次上游改政策时集中爆发
   - 现在怎么办：员工自购报销；通过云厂商买 API（贵得多）；用能调到同款模型的其他工具；自建统一模型网关；只用国产模型。
   - 缺什么：证据里有的：发帖人问有没有办法，回复者说没有任何正规渠道，最接近合规的是找云厂商买 API。推断：上游的区域和账号政策变化没有面向国内技术负责人的稳定通报渠道，主要靠论坛帖子。证据集中在 V2EX 一个平台。
   - 证据：转述：现在是员工用自己的账号再报销，很容易封号，不稳定（V2EX 用户 0x47（公司里负责此事的人，职位未说明）；回复者 SilencerL 称没有正规渠道） <https://www.v2ex.com/t/1200488>
   - 证据：转述：只允许用自建的模型；国外的不让用；没有什么规范，都是自己搞（V2EX 多名回复者（各公司员工）） <https://www.v2ex.com/t/1200195>
   - 证据：转述：邮件说 7 月 9 日起阻止不支持地区的 API 流量（V2EX 用户 PinLG 发帖及 49 条回复） <https://www.v2ex.com/t/1052345>
   - 证据：转述：管控非常严格，大厂通常要求用自家的模型工具（王东旭，快手；胡一川，来也科技 CTO） <https://www.infoq.cn/article/P4LBQJIK5dY17awsxh0K>
9. **当我同时带项目、带人、顾家，没有时间每天看时，我想确认不追也不会错过要紧的事，以便把时间留给业务，只在该提高注意力的时候才提高。**（原记录标为强）
   - 谁：时间被会议和交付占满的工程经理、技术负责人（这是一条反向需求：不少人认为不必追）
   - 痛在哪：不追有负罪感和落伍感；追了又多是噪音，看完就过时。
   - 多频繁：持续
   - 现在怎么办：只看一两个信源；每周或每半年集中补一次；等重要的事自己传到面前；遇到具体问题再去查；让团队里的早期采用者去看。
   - 缺什么：证据里有的：多人认为重要的事会自己沉淀下来，不追也没事。推断：这个假设对模型发布成立，对下线、调价、封禁这类有截止日期的事不一定成立（见第一条需求），但没有人把两类事分开处理。
   - 证据：转述：不盯着 AI 新闻也能干好；重要的进展自己会变成通行做法（Dan Mahr，工程领导者，LeadDev 演讲摘要） <https://leaddev.com/culture/obsessing-over-ai-is-optional>
   - 证据：转述：真正重要的东西，过 48 小时还在（HN 用户 dofm、PaiDxng（身份未说明）） <https://news.ycombinator.com/item?id=48939630>
   - 证据：转述：我每半年才看一眼，省下的追赶时间本身就是效率（HN 用户 AnimalMuppet（身份未说明）） <https://news.ycombinator.com/item?id=44575422>
   - 证据：转述：少看没啥事，看多了只会加重错失焦虑（V2EX 用户 kuhung、Maxwe11、NeoWalnut、iorilu（开发者）） <https://www.v2ex.com/t/1232563>
   - 证据：转述：技术团队盲目追新、业务团队不买账，是常见的失败路径（InfoQ 记者王玮转述 RAND 研究） <https://www.infoq.cn/article/elIEmtKU92WkTKk6wDNh>
   - 证据：转述：我大概是最有条件跟上的人，但还是很难跟上（Bret Taylor，OpenAI 董事长、Sierra CEO、前 Facebook CTO（InfoQ 编译自播客）） <https://www.infoq.cn/article/FsQ4a8vXUP96BmaMmTav>

## 信什么，不信什么

- 信一手出处：实验室官方公告、system card、论文原文；对转述默认存疑，看到惊人说法绕过转述者读原文（https://blog.nilenso.com/blog/2025/06/23/how-i-keep-up-with-ai-progress/）；中文论坛里也有人说在 X 上只关注官方账号（https://www.v2ex.com/t/1186826）。
- 信少数几个长期稳定的个人整理者：Simon Willison 在 HN 和 V2EX 的三个帖子里被反复点名，有人说让他替自己跑腿就够了（https://news.ycombinator.com/item?id=44575422 ，https://news.ycombinator.com/item?id=48939630 ，https://www.v2ex.com/t/1186826）；中文里被点名的是橘鸦、宝玉、卡兹克的 AIHOT（https://www.v2ex.com/t/1232563 ，https://www.v2ex.com/t/1204230）。
- 信评论区和多处重复出现：有人说 HN 最值得看的是评论区的观点，新闻本身常夹带公关稿（https://www.v2ex.com/t/1210655）；有人等一个工具在 HN 评论、YouTube、Reddit 多处出现后才去试，并据此说服公司其他工程师（https://news.ycombinator.com/item?id=44575422）。
- 外部榜单只当初筛：a16z 调查里企业把榜单当成类似分析师象限的过滤器，但受访领导者说仍要自己试用并收集员工反馈（https://a16z.com/ai-enterprise-2025/）。
- 最信自己动手得到的直觉和自己的数据：Imprint CTO 靠 2 到 10 小时的小项目建立判断（https://lethain.com/company-ai-adoption/）；nilenso 工程师说自己把能力放进生产后拿到的数据胜过官方 cookbook（https://blog.nilenso.com/blog/2025/06/23/how-i-keep-up-with-ai-progress/）；云知声 CTO 说选型要按自己的业务做数据评估（https://www.infoq.cn/article/Z4GAgXGi6gYdWMrQk8ro）。
- 不信厂商话术：CTO 认为多数所谓 AI 工具只是营销里谈 AI 的 SaaS（https://lethain.com/company-ai-adoption/）；论坛里的说法是贩卖焦虑的是自媒体、供应商、卖 token 和卖课的（https://www.v2ex.com/t/1200610）。
- 不信标题夸张的媒体和营销号：头部 AI 公众号被指标题夸张（https://www.v2ex.com/t/1210655）；X 近几个月营销号变多、质量下降（https://www.v2ex.com/t/1232563）；一条引流帖被多人指出标题与原文不符（https://www.v2ex.com/t/1052345）。
- 不全信 AI 的归纳：有人提醒搜索首页的 AI 归纳会非常有条理地胡说（https://www.v2ex.com/t/1214741）；Stack Overflow 2025 调查里不信任 AI 准确性的开发者（46%）多于信任的（33%），资深者最谨慎（https://survey.stackoverflow.co/2025/ai）。
- 信同行的坦诚交流，不信修饰过的成功故事：这是厂商的说法，但有工程总监公开求同行小组作旁证（https://www.infoq.cn/article/cFMO2oN8SyaR9vuUVUeQ ，https://news.ycombinator.com/item?id=49051762）。
- 下属在内部分享会上讲的内容带包装：员工自己说这类硬性分享越听不懂越显高级、广度到了老板就满意，还互相提醒别吹得太离谱（https://www.v2ex.com/t/1204230）。这意味着管理者从分享会拿到的信息未必是真实使用情况（后半句是推断）。

## 工具和花费

- **Claude Max / Claude Code / ChatGPT（Codex）/ GitHub Copilot CLI / X 订阅**（管理者自己上手试最强的模型和工具，给团队定标杆，和公司内部工具对比）：胡一川：Claude Max 每月 200 美元；汤威：合计每月约 100 美元（Claude Code 20、ChatGPT 20、Copilot CLI 约 10，加 xAI API 和 X 订阅）；谁付：个人自费（两人都说是自己订的） <https://www.infoq.cn/article/P4LBQJIK5dY17awsxh0K>
- **公司给团队配的 AI 工具额度（Cursor 团队版、API Key、Claude Code、Trae 公司账号等）**（团队日常研发）：帖子里的自述：Cursor 每人每月 20 美元额度；API Key 每月限额 200 美元；Claude Code 5X 报销；也有公司不给、员工自费；谁付：公司付或报销；部分公司员工自费 <https://www.v2ex.com/t/1200195>
- **Simon Willison 的月度简报**（每月十分钟补上 LLM 领域最重要的进展）：在 GitHub 赞助每月 10 美元及以上；周更通讯和博客免费；谁付：个人（谁在付没有数据） <https://simonwillison.net/about/>
- **The Pragmatic Engineer**（工程师和工程经理了解大厂和创业公司内部做法、行业动向）：有付费档，所读页面未显示价格；自称 100 万以上读者；谁付：没有数据 <https://newsletter.pragmaticengineer.com/about>
- **SoftwareLeadWeekly**（给忙碌的管理者的每周精选（团队、文化、领导力））：免费；自称 31,020 名读者；谁付：不需付费 <https://softwareleadweekly.com/>
- **BestBlogs.dev**（中英文技术和 AI 文章的评分精选、每日早报、周刊）：公共内容免费；Pro 早鸟每月 4.9 美元（到 2026-12-31），之后每月 9.9 美元；自称两万多注册用户；谁付：个人 <https://www.bestblogs.dev/pro>
- **AIHOT（aihot.virxact.com）**（中文 AI 动态聚合，带评分、推荐理由、热点榜和模型榜）：免费；谁付：不需付费 <https://aihot.virxact.com/>
- **TrendRadar（开源自建）**（多平台热点聚合、关键词筛选、AI 简报推到微信、飞书、钉钉）：免费开源，自己部署；62,677 星、24,886 fork；谁付：自己出服务器和模型调用费 <https://github.com/sansan0/TrendRadar>
- **x-monitor-feishu（开源自建）**（监控一批 X 博主原创推文，翻译加分析后推飞书群，每天出早报、每周出周报）：作者称运行成本每月约 2 美元；谁付：搭的人自己 <https://github.com/datazhy/x-monitor-feishu>
- **follow-builders（开源）**（把 26 位 AI 从业者的 X、6 个播客和官方博客做成每日或每周摘要推到聊天软件）：免费；6,835 星；谁付：不需付费 <https://github.com/zarazhangrui/follow-builders>
- **deprecations.info**（九家海外供应商的模型下线信息，RSS 和 JSON，可推 Slack）：免费；仓库 18 星；谁付：不需付费 <https://deprecations.info/>
- **Readwise Reader / lightfeed**（RSS 阅读加 AI 摘要、任意网页转 RSS 并过滤）：作者自述：Readwise Reader 年付折合每月 10 美元；lightfeed 订 5 个站点每月 3 美元，并抱怨费用高、工具分散；谁付：个人 <https://sspai.com/post/90423>
- **Thoughtworks Technology Radar**（半年一次的工具、技术、平台、语言取舍快照，可照着做自己公司的雷达）：免费；谁付：不需付费 <https://www.thoughtworks.com/radar/faq>
- **TGO 鲲鹏会、厂商 CTO 圆桌、海外参访团**（同行交流、带队进大会、闭门会）：所读页面没有价格；谁付：没有数据 <https://www.infoq.cn/article/MOVBghUgQrXWr9igbK2p>

## 现在怎么用 AI

- 让聊天助手定时汇总：多人说用 ChatGPT 的定时任务、让 Codex 起自动化任务、或用 agent 定时抓 HN，每天早上推一份 AI 新闻（https://www.v2ex.com/t/1232563 ，https://www.v2ex.com/t/1214741）。
- 自己搭抓取加 LLM 打分的管道：n8n 每天抓行业信源，LLM 按与自己关注点的相关度打分，周五早上发周报（HN 用户 garethsprice，https://news.ycombinator.com/item?id=48939630）。
- 偶尔让 Gemini、Claude 或 Perplexity 做一次深度检索出简报，并考虑改成每日自动（HN 用户 samuelgudi，同上帖）。
- 把研究派给 AI 再回来看结果：阿里技术专家午休前让它做一项研究，睡醒时已完成；过去一年很少再用搜索引擎（https://www.infoq.cn/article/P4LBQJIK5dY17awsxh0K）。
- 用 AI 准备决定和向上汇报：SaaScada 的 CTO 用 ChatGPT 讨论处境、要它给出决定的理由，说在碰到陌生领域时不那么两眼一抹黑；PagerDuty 的 SRE 高级经理用它在向团队和干系人汇报前检验论证；Multiverse 的工程 VP 说它像余光，提早暴露本来会晚发现的模式（LeadDev 采访 9 位工程领导者，https://leaddev.com/ai/how-engineering-leaders-can-better-leverage-ai-in-2026）。
- 用定时的 LLM 任务巡查新模型、测一下、合适就换上（HN 用户 flemhans，https://news.ycombinator.com/item?id=49550324）。
- 失败处一：中文环境平台封闭、反爬，AI 自动搜集对英文网站还行，对中文源不行（V2EX 楼主 gongfuxiongmao，https://www.v2ex.com/t/1214741）。
- 失败处二：AI 的归纳会有条理地出错，使用者被提醒要警惕（同上帖 datocp）；调查里不信任 AI 准确性的开发者多于信任的（https://survey.stackoverflow.co/2025/ai）。
- 失败处三：涉及订阅额度、价格、新模型时，综合信息不可靠，只能自己花钱测（https://news.ycombinator.com/item?id=49550324）；榜单结论到了自己场景仍要重测（https://a16z.com/ai-enterprise-2025/）。
- 不用 AI 跟进的人：靠和同事闲聊吃饭时听（https://www.v2ex.com/t/1210655）；干脆不追（https://www.v2ex.com/t/1186826 ，https://news.ycombinator.com/item?id=48939630）；大厂里外部 AI 工具受数据安全管控，只能用自家工具（https://www.infoq.cn/article/P4LBQJIK5dY17awsxh0K）。

## 已经交出去的

- 把盯头条交给团队里的早期采用者：给他们一个专门分享和讨论头条的地方，再用演示会把他们和大多数人接起来（Dan Mahr，https://leaddev.com/culture/obsessing-over-ai-is-optional）。
- 把广度交给每周或每两周的内部 AI 分享会，轮流或随机抽人讲（https://www.v2ex.com/t/1204230）。
- 把初筛交给外部整理者：Simon Willison、AI News（smol.ai）、橘鸦早报、量子位等公众号、SoftwareLeadWeekly、Pragmatic Engineer（https://news.ycombinator.com/item?id=44575422 ，https://www.v2ex.com/t/1232563 ，https://softwareleadweekly.com/）。
- 把推送交给机器人：聚合结果直接推到飞书、钉钉、企业微信、Slack 群（https://github.com/sansan0/TrendRadar ，https://github.com/datazhy/x-monitor-feishu ，https://deprecations.info/）。
- 大机构把技术取舍交给制度化的顾问组：Thoughtworks 的技术顾问委员会约 20 位资深技术人，每两周线上、每年两次面对面，首要角色是给 CTO 当顾问组，产出半年一期的 Radar（https://www.thoughtworks.com/radar/faq）。
- 把见世面交给社群和厂商活动：TGO 带成员进大会、组织海外参访团，会后收集每人改变了什么判断（https://www.infoq.cn/article/zFIHHoq5Tsj4ybQzpjq3 ，https://www.infoq.cn/article/RGDB7CQSi4E0rvOXzWMC）。
- 把持续的模型评估和优化交给专门的 AI 应用团队，甚至直接买第三方应用：a16z 调查称企业正从自建转向采购，原因之一是持续评估各模型的工作更适合专门团队做，内部自建工具难维护（https://a16z.com/ai-enterprise-2025/）。

## 不交的

- 亲手试用来建立直觉：CTO 和技术负责人都强调必须自己上手，自己掏钱订工具（https://lethain.com/company-ai-adoption/ ，https://www.infoq.cn/article/P4LBQJIK5dY17awsxh0K）。
- 判断哪些进展对本组织真的重要，并推动采用：Dan Mahr 把这称为领导者靠经验和对组织的了解才能做的事（https://leaddev.com/culture/obsessing-over-ai-is-optional）。
- 跟哪些技术、不跟哪些技术的取舍：云知声 CTO 把这列为技术管理者的关键决策点（https://www.infoq.cn/article/Z4GAgXGi6gYdWMrQk8ro）。
- 在自己场景和数据上的最终评估与选型：外部榜单和下属反馈只是输入（https://a16z.com/ai-enterprise-2025/）。
- 向上解释和在组织里统一认知：阿里云 CIO 从自己团队发起全公司通识教育，而不是外包给别人（https://www.infoq.cn/article/elIEmtKU92WkTKk6wDNh）。
- 预算和供应商的决定：a16z 调查显示 AI 支出已进入核心 IT 预算，采购走正式流程（https://a16z.com/ai-enterprise-2025/）；谁签字没有直接证据，属推断。

## 和亲手做研究的人有什么不同

- 要第一时间知道的是运营类变化，不是论文：下线、调价、额度、封号、区域限制、工具下架。证据里的抱怨和事故几乎全是这一类（https://techcrunch.com/2025/06/03/windsurf-says-anthropic-is-limiting-its-direct-access-to-claude-ai-models/ ，https://www.v2ex.com/t/1218919 ，https://github.com/Trae-AI/TRAE/issues/2513）。
- 不需要信息流的全量，做早期大众就够：工程领导者明确说不必当早期采用者，向早期采用者学即可（https://leaddev.com/culture/obsessing-over-ai-is-optional）。研究者要的是全和快，这里要的是少和准（后半句是推断）。
- 判断标准是和我们有什么关系，而不是是否最先进：发帖人追问聚合站能不能自定义信源、只服务自己（https://www.v2ex.com/t/1214741）；调查里企业按用例选模型而不是按总榜（https://a16z.com/ai-enterprise-2025/）。
- 多一层向上解释和横向对齐的任务：要回答老板要不要上、要不要买，要让产研、业务、管理层说同一种话（https://www.infoq.cn/article/elIEmtKU92WkTKk6wDNh ，https://www.v2ex.com/t/1204061）。亲手做研究的人没有这层任务（推断）。
- 要同行的做法做参照：工具怎么配、额度给多少、组织怎么改，这些在论文和榜单里没有（https://news.ycombinator.com/item?id=49051762 ，https://www.v2ex.com/t/1200195）。
- 读的时间是碎片的、按周的，深度靠有边界的上手来补：每天 30 分钟、每个小项目 2 到 10 小时（https://leaddev.com/career-development/how-keep-tech-trends-and-upskill-sustainably ，https://lethain.com/company-ai-adoption/）。
- 因为要负责，所以更不信二手结论和 AI 的回答：调查里经验越深越不信任 AI 输出（https://survey.stackoverflow.co/2025/ai）；管理者对厂商话术有明确防备（https://lethain.com/company-ai-adoption/）。
- 一个人常常两种身份切换：订 200 美元套餐亲手写代码时是做的人，定团队标杆、讲给财务和市场团队听时是看的人和决定的人（https://www.infoq.cn/article/P4LBQJIK5dY17awsxh0K）。

## 意外的发现

- 有人付钱是为了少收到东西：Simon Willison 的付费档卖的是更短的月度版，原文是「pay me to send you less」（https://simonwillison.net/about/）。
- 免费的已经很多，而且被反复推荐：AIHOT、BestBlogs 免费层、B 站早报、开源聚合、让 ChatGPT 定时汇总。同一个帖子里既有人问去哪看，也有十几个人贴免费去处（https://www.v2ex.com/t/1232563）。单纯再做一份 AI 日报没有证据支持。
- 专门解决别错过模型下线的工具几乎没人用：deprecations.info 的仓库只有 18 星，而泛热点聚合 TrendRadar 有 6 万多星（https://github.com/deprecations/deprecations-rss ，https://github.com/sansan0/TrendRadar）。可能是需求弱，也可能是知道的人少或不覆盖国内供应商，证据分不出来。
- 最大的开源聚合项目写明的适合人群是投资者、自媒体人、企业公关，技术管理者不在其中，只在一种推送模式里提到企业管理者（https://github.com/sansan0/TrendRadar）。
- 每周内部 AI 分享会很普遍，但从讲的人那边看是负担和表演：内容越讲越卷、越来越少，有人教怎么糊弄，有人提醒别吹太牛以免同事被裁（https://www.v2ex.com/t/1204230）。
- 连 OpenAI 董事长都说自己跟不上（https://www.infoq.cn/article/FsQ4a8vXUP96BmaMmTav）；跟不上是常态，不是某一类人的缺陷。
- 在中国，最要紧的突发消息不只是下线和调价，还有能不能买、会不会封：公司想买 50 个账号却没有正规渠道，外企的大陆员工也用不上（https://www.v2ex.com/t/1200488）。
- 供应商的变更有时写在文档脚注里：旧模型名继续能调，但背后已换成新模型并按新价计费（https://api-docs.deepseek.com/zh-cn/quick_start/pricing）。不看文档的人不会知道。
- 同一条下线通知，在论坛里先因为发帖人的标题被吵了一轮是不是标题党，真正受影响的人的一句话淹在中间（https://www.v2ex.com/t/1218919）。
- 老板的信息渠道和工程师不一样，而且会反过来压到技术负责人身上：短视频、老板圈子、老板课（https://www.v2ex.com/t/1200610）。

## 来源说明

- 搜索方式受限：内置浏览器标签页达到上限，始终开不了自己的标签页，没法用 Bing；curl 访问 Bing 只返回降级结果，百度和 Brave 出验证码（未绕过）。实际用的是各站自己的检索：V2EX（sov2ex）、Hacker News（Algolia）、InfoQ 和极客邦检索、掘金、少数派、GitHub、LeadDev 站内搜索，再加直接打开已知网址。因此公众号、知乎、即刻、小红书、播客、B 站的内容基本没覆盖，中文一手材料偏向 V2EX 和 InfoQ。
- 实际打开并读过的页面约 50 个。其中管理者本人自述或受访的有：Will Larson、Dan Mahr、Addy Osmani、LeadDev 采访的 9 位领导者、InfoQ 两场实录里的肖然、李梦泽、梁家恩、胡一川、王东旭、汤威、蒋林泉、Bret Taylor、Windsurf CEO、HN 上自称工程总监和企业客户的两人；带样本的调查有 a16z（100 位 CIO）、Amplify（数百名工程师）、Stack Overflow 2025（开发者）。
- V2EX 帖子被多条需求重复使用：1214741 和 1232563 同时支撑每日筛选、真假辨别、不必追三条；1200195 同时支撑同行参照和国内可得性两条；1200610 和 1204061 支撑向上解释一条。这些帖子的发言者是普通开发者，是否为技术管理者无法核实，只能当作这类人身边的行为证据。
- InfoQ《工作场景 AI 化》这一场实录（P4LBQJIK5dY17awsxh0K）同时支撑亲手试、同行参照、国内可得性三条需求和工具花费一栏，等于一个来源。
- a16z 的调查同时支撑真假辨别和成本两条需求，以及交出去和不交出去两栏；它是风投机构给创业者看的材料，样本是美国大企业 CIO。
- Dan Mahr 的 LeadDev 页面只有演讲摘要，视频要登录才能看；它同时支撑每日筛选、同行参照、不必追三条。
- 厂商和组织方立场：Snowflake 的 CTO Circle 文章、超聚变论坛报道、TGO 和极客邦的活动回顾都带招揽目的，只能当作厂商认为需求在哪；其中的到场人数算行为线索。BestBlogs、TrendRadar、Tidyread 的自述是供给方对用户痛点的描述。Amplify 的调查与 Latent Space 合作，信息源偏好那一题有偏。
- HN 和 V2EX 的发言者匿名，职位多为自述或未说明；Hacker News 读者偏英语区工程师。
- 时间：材料集中在 2025 年 6 月到 2026 年 10 月，价格和模型名称变化很快，具体数字只代表当时。InfoQ 那篇访谈是 2024 年 2 月，V2EX 的 OpenAI 限制帖是 2024 年 6 月。
- 地域：海外有较多管理者亲自写的长文，中国的同类材料主要是媒体组织的对谈实录和大会回顾，嘉宾多来自大厂；中小公司和传统企业技术负责人的自述几乎只有论坛帖。
- Bret Taylor 的话是 InfoQ 编辑对英文播客的编译，不是我直接听到的原话；蒋林泉的观点由记者整理；Windsurf CEO 的话由 TechCrunch 转引其 X 帖。

## 没查到的

- 没有找到针对技术管理者的抽样数据来回答：每天和每周花多少时间跟进 AI、在什么时段、用手机还是电脑。现有的只是个别人的自述（15 到 20 分钟、每天 30 分钟）。需要访谈或问卷。
- 没有找到管理者因为没看到通知而导致线上事故的正式复盘。找到的都是被通知后来不及或被动迁移的抱怨。是真的少，还是没人公开写，只有访谈能回答。
- 没有找到被竞品抢先的具体案例，也没有找到开源许可证变化对 AI 团队造成影响的管理者自述。
- 中国的技术管理者具体读哪些公众号、听哪些播客、在哪些微信群里：没有读者构成数据。量子位、机器之心、InfoQ、橘鸦等的读者里管理者占多少，没有打开到可用的材料。
- 团队里到底是谁在替管理者筛、怎么筛、管理者信到什么程度：只有 Dan Mahr 的做法和论坛里员工一侧对分享会的吐槽，没有管理者一侧对下属结论的评价。
- 他们愿意为什么付钱：只看到个人自费订工具和少量低价订阅。公司是否会为信息和情报类服务付费、走什么预算，没有证据。
- LeadDev 的两份报告（AI Impact Report 2025、Engineering Leadership Report 2025）正文要登录，只读到摘要；Gartner 等 CIO 调查在付费墙后，没有打开。
- TGO 鲲鹏会官网是脚本渲染，没读到会员人数和会费；InfoQ 的《CTO 焦虑自白》是视频，没有文字稿。
- V2EX 上 Cursor 在国内封禁 Claude 模型的帖子（/t/1145710）接口没有返回内容，没有读到；Anthropic 限制中资控股企业一事没有找到技术负责人的自述。
- 第一条需求里「提前多久知道才够用」没有答案：证据里有不足五天嫌短的，也有提前半年仍然没有等价替代的。需要问他们一次迁移实际要多少人天。
- 不必追的人和焦虑的人是不是同一类人、在什么条件下互相转换：证据只有各自的表态。
- 传统企业里负责数字化和 AI 落地的技术部门：除了一场 CIO 对话的记者整理稿，没有找到本人写的材料。

