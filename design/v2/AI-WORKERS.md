# 给 AI 工作者的同事（2026-10-05）

用户：「你应该重构这里所有的数字员工，来做成一个给 AI 工作者的产品」，并且「你看其他的那些技术 blog 我觉得是对的」。
所以这份阵容不从我们的设想出发，每位同事都照着一位从业者公开写过、自己天天在用的做法做；原文提取在
docs/research/ai-workers-2026-10/（三份，带作者和日期）。

## 阵容

| 同事 | 照谁的做法 | 用户做什么 | 它做什么 | 程序做什么（不靠模型自觉） |
|---|---|---|---|---|
| MyWork | —— | 什么都可以说 | 总助理；长期的事交给对口的同事，有模板的从模板建 | 今天卡 |
| 每日论文 | 苏剑林每天「刷」arXiv 全表（科学空间 9907）；zotero-arxiv-daily 用你的文献库当兴趣；dailypaper-skills 的 必读 / 值得看 / 可跳过 | 说清分类和方向，挑要精读的 | 一篇不漏地过完全表，分流，每篇必读回答四个问题，你点了的送进知识库 | 每个工作日取当天 arXiv 全表（新 / 交叉 / 更新），按原序存下；周末和节假日没有新表就不打扰 |
| 知识库 | Karpathy「LLM Wiki」 | 找资料、提问、想它意味着什么 | 摘要、交叉引用、归档、记账，标矛盾 | 链接、孤立页、断链、没进索引、日志（已做，72a23fe） |
| 实验 | Karpathy autoresearch（program.md / results.tsv / 只改一个文件 / 没进步就 reset）；Anthropic「Long-running Claude」（进度文件、测试 oracle、不许凑系数、声称做完要再追问）；Ethan Perez（夜里跑、早上看，汇报带排好序的下一步） | 写 program.md：目标、指标、怎么跑、预算、只许改什么 | 改代码、跑、比、留或丢、记账、写实验日志 | 连续跑到你定的时间（模型不能自己停下说「明天再说」）；读 results.tsv 算最好成绩、保留率、崩溃数；连续 3 轮没有新结果就停并说卡在哪 |
| 代码研究 | Simon Willison「Code research projects with async coding agents」 | 提一个写代码跑一跑就能回答的问题 | 每题一个文件夹，边做边记 notes.md，最后写 README.md 报告；只认跑出来的结论 | 列出全部项目（进行中 / 未经你审 / 审过）；你点「审过了」才去掉「未经你审」 |
| 论文 | Neel Nanda「Explore, Understand, Distill」（压成几条 claim，每条证据和局限，red-team）；ARIS citation-audit；ICLR 2026 幻觉引用回顾 | 给稿子和结果，定 claim | 论点账、写和改、核数字时只看原始结果 | 核引用：抽出每条引用和它所在的句子，到 arXiv / Crossref 查存在和元数据；查不到和网络失败分开记（ARIS 9/28 的误报事故）；模型再判断引用是否支持原句 |

## 几条贯穿的做法（都来自原文）

1. **程序给事实，模型做判断。** 苏剑林怕漏召回所以不用算法初筛；Larson 每条回复都要「final mandatory check」引用的实体存在；
   autoresearch 的评估函数是 ground truth、agent 不能改；ARIS 把网络失败从「查无此文」里分出来。所以：全表、成绩、
   引用存在与否，都由程序拿到再交给模型；模型负责读、挑、写、判。
2. **一个同事一个文件夹，文件就是记忆。** program.md / results.tsv / PROGRESS.md（Anthropic 叫 lab notes）、
   notes.md / README.md（Willison）、wiki/ + AGENTS.md（Karpathy）。用户在右边的面板里看这些文件，不另造数据库。
3. **没审过的标出来。** Willison：没经人审的就是 slop，隔离存放；ICLR：疑似和确认分开报。代码研究的报告一律先标
   「未经你审」，核引用把「疑似」交给人确认，只自动改元数据。
4. **夜里跑，早上看。** autoresearch 一晚约 100 次实验；Perez 让实验 24 小时不停、早上看结果、汇报附排好序的下一步
   （「挑」比「想」容易）。连续跑的轮次在对话里合成一行灰字，早上一份报告。
5. **同事之间能接手。** 每日论文里点「收进知识库」，原文存进知识库的 原始资料/，知识库接着收；代码研究和实验的结论
   也可以交给知识库。MyWork 遇到长期的事从模板建对口的同事。

## 每位同事的文件

- 每日论文：AGENTS.md（分类、方向、不要什么）、收藏.md（你收进知识库的，程序记；越近越重要）、每日/YYYY-MM-DD.json（程序取的全表）、每日/YYYY-MM-DD.md（它的分流）。
- 实验：program.md、results.tsv（commit / 指标 / 显存 / 状态 keep·discard·crash / 说明，制表符分隔）、PROGRESS.md（现状、做过的、失败的尝试和原因、下一步）、AGENTS.md（规矩）。
- 代码研究：每题 YYYY-MM-DD-短名/notes.md + README.md；AGENTS.md。
- 论文：稿子/（.tex .bib .md）、论点.md（claim | 证据 | 局限 | 状态）、核引用/YYYY-MM-DD.md 和 .json、AGENTS.md。

## 不做的

- 不给每位同事造新页面：还是一条对话 + 右边一个面板（知识库 / 论文 / 实验 / 项目），和知识库同一个样子。
- 不替用户装 GPU 环境、不替用户登录：实验同事在用户已经能 ssh 上的机器上干活，onboarding 时让它先跑一次基线确认。
- 不改用户已经建的同事（日程助理、红书雷达、财联社记者等），只把模板、默认话术和 MyWork 的分派改成面向 AI 工作者。
