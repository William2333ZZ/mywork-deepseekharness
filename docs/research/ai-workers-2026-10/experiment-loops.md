# 过夜实验 · 长时间跑的 agent · 实证研究流程（四篇原文提取，2026-10-05）

四个来源都抓到了：autoresearch 的 README 在 master 分支（main 分支 404），program.md、Anthropic 文章和两篇 LessWrong 文章都返回 200。另外我读了 Anthropic 文章里链接的 clax 项目 CLAUDE.md 和 CHANGELOG.md，以及 autoresearch 仓库里的 analysis.ipynb，作为对文件格式的补充，下文都标明了出处。

有一点要先说：来源 3 和 4 讲的是人类研究者（MATS 学员）怎么做实验，不是讲 AI agent 长时间自主运行。下文把它们的流程如实摘出，「数字同事」那一栏是我做的映射，不是作者说的。

---

## 1. karpathy/autoresearch（README + program.md）

**作者和日期**：Andrej Karpathy。README 署名「March 2026」，仓库建于 2026-03-06，最近一次提交 2026-03-26。

**做法概述**：给 agent 一个小而真实的 LLM 训练环境（nanochat 的单 GPU 简化版），让它整夜自主做实验：改代码，训练 5 分钟，比较指标，保留或丢弃，再循环。人不再改 Python，而是改 `program.md`，作者称之为「research org code」和「super lightweight "skill"」。启动方式：在仓库里打开 Claude/Codex，按原文「disable all permissions」，然后说「Hi have a look at program.md and let's kick off a new experiment! let's do the setup first.」

**准备阶段（和人一起做）**
1. 约定一个运行标签，比如 `mar5`；分支 `autoresearch/<tag>` 必须是新的。
2. 执行 `git checkout -b autoresearch/<tag>`。
3. 读 README.md、prepare.py、train.py。
4. 确认 `~/.cache/autoresearch/` 里有数据和分词器；没有就让人跑 `uv run prepare.py`（约 2 分钟）。
5. 新建只有表头的 results.tsv。
6. 人确认后开始。

**实验循环（LOOP FOREVER）**
1. 看当前 git 状态。
2. 只改 `train.py`。
3. git commit。
4. 运行 `uv run train.py > run.log 2>&1`。要求不用 tee，原文「do NOT … let output flood your context」。
5. 用 `grep "^val_bpb:\|^peak_vram_mb:" run.log` 取结果。
6. grep 为空就算崩溃，用 `tail -n 50 run.log` 看报错。小错就修，多次修不好就放弃。
7. 结果写进 results.tsv（这个文件不提交）。
8. val_bpb 降低就保留这次 commit；持平或变差就 `git reset`。

**预算和指标**
- 每次训练固定 5 分钟墙钟时间（不含启动和编译）。超过 10 分钟就杀掉，按失败处理。
- 大约每小时 12 次，一晚约 100 次。
- 指标是 val_bpb，越低越好，和词表大小无关。
- 显存是「soft constraint」。

**原文明确写的「NEVER STOP」规则**：不许问「should I keep going?」。没有思路时要更努力去想，比如读代码里引用的论文、组合之前差一点成功的改动、尝试更激进的架构。

**分工**
- 人：迭代 program.md，做好准备阶段，早上看结果。
- agent：提出想法、改 train.py、跑实验、判断保留还是丢弃、记账。

**文件和产物**
- `prepare.py`：只读。包含常量、数据、分词器和 `evaluate_bpb`。
- `train.py`：agent 唯一能改的文件。
- `program.md`：由人维护。
- `run.log`：每次运行的输出。
- `results.tsv`：用制表符分隔，原文说逗号会弄坏描述栏。5 列：`commit  val_bpb  memory_gb  status(keep/discard/crash)  description`。崩溃时记 0.000000 和 0.0。
- git 分支：只有被保留的改动会推进分支。
- `analysis.ipynb`（仓库里有，README 没提）：读 results.tsv，算保留率，画出 progress.png 里的最优前沿曲线，并按每次改进幅度排出贡献最大的实验。

**核对结果、防作弊**
- 评估函数 `evaluate_bpb` 是「ground truth」，agent 不能改。
- 不能装新依赖。
- 固定时间预算，保证不同实验可以直接比较。
- 指标没进步就 git reset。
- 简洁原则：例如 0.001 的提升如果换来 20 行难看代码，「Probably not worth it」；删代码还能持平，就保留。
- 回退到旧版本要「very very sparingly」。

**作者明说的局限**
- 只支持单张 NVIDIA GPU（在 H100 上测过）。
- 结果和别人的计算平台不可比。
- 默认的 program.md 故意写得很简陋（「bare bones baseline」）。
- 多 agent 的做法只是提了一句，没有实现。

**做成「长期数字同事」最少需要**
- 一台 GPU 机器上的 shell，能跑几小时不中断，不需要逐条确认权限。
- 能执行 git 的 commit 和 reset。
- 能读写 train.py 和 results.tsv。
- 能用 grep 和 tail 读日志，能对超时的任务计时并杀掉。
- 人能改 program.md，早上能看到 results.tsv 或进度图。

---

## 2. Anthropic「Long-running Claude for scientific computing」

**作者和日期**：Siddharth Mishra-Sharma（Anthropic Discovery 团队），2026-03-23。用的模型是 Claude Opus 4.6。示例项目是 smsharma/clax，一个用 JAX 写的可微分 CMB Boltzmann 求解器，参考实现是 CLASS。

**做法概述**：把对话式的「tight leash」换成：人先写清楚目标，再放 agent 自主跑好几天。适合的任务是范围清楚、成功标准明确、人只需偶尔照看的那类。紧耦合的流水线更适合单个 agent 顺序推进，需要时再派子 agent，并用参考实现去二分定位差异。核心是三样东西：进度文件、测试 oracle（判断对错的参照）、规则清楚的 prompt。

**步骤**
1. 先在本地和 Claude 反复打磨计划，写进根目录的 `CLAUDE.md`。目标是功能和 CLASS 对齐、全程可微、主要科学输出和 CLASS 相差在 0.1% 以内。Claude 在工作中也可以修改 CLAUDE.md。
2. 在 CLAUDE.md 里要求 Claude 把进度记在 `CHANGELOG.md`。原文说这是「portable long-term memory … lab notes」。
3. 测试 oracle：拿 CLASS 的 C 源码当参考，持续写单元测试、扩充测试、跑测试，防止退化。
4. 用 git 协调。原文规则：「Commit and push after every meaningful unit of work. Run `pytest tests/ -x -q` before every commit. Never commit code that breaks existing passing tests.」
5. 用 SLURM 申请节点，脚本参数为 `--gres=gpu:h100-32:1`、`--time=48:00:00`。在节点上用 `tmux new-session -d -s claude "claude; exec bash"` 启动。
6. 用 `srun --jobid=JOBID --overlap --pty tmux attach -t claude` 接入，下达「Read CHANGELOG.md and pick up the next task」，然后断开。
7. Ralph loop：agent 声称做完时，把它拉回来问是否真的做完。示例：`/ralph-loop:ralph-loop "…0.1% accuracy across the entire parameter range…" --max-iterations 20 --completion-promise "DONE"`。替代方案有 GSD 和 Claude Code 自带的 `/loop`。
8. 照看：作者在手机上看 GitHub。需要纠偏时 SSH 进去重新下指令，或者让本地的 Claude Code 代为 SSH。

**分工**
- 人：花大部分时间写清交付物和背景，偶尔查看、纠偏、开新任务。
- agent：写代码、写测试并跑测试、提交并推送、维护 CHANGELOG 和 CLAUDE.md、在需要时派子 agent。

**文件和格式**
- `CLAUDE.md`：计划、设计决定和规则。
- `CHANGELOG.md`：当前状态、已完成任务、失败的尝试和原因、关键节点的精度表、已知限制。原文例子：「Tried using Tsit5 … too stiff. Switched to Kvaerno5.」
- 测试套件和参考数据。
- git 提交历史：原文说读起来像「lab notes from a fast, hyper-literal postdoc」。

**链接的 CLAUDE.md 里的补充规则**
- 进度文件在这一版里叫 `PROGRESS.md`。
- 每次开工的顺序：读 PROGRESS.md，跑 `pytest tests/ -v --fast 2>&1 | tail -20`，挑下一个失败的测试，收工前更新 PROGRESS.md。
- 测试输出：成功时不超过 5–10 行，失败时约 20 行；详细内容写到 `test_logs/`；错误要能用 grep ERROR 搜到。
- `--fast` 只跑固定的约 10% 子样本，用来对付「time blindness」。
- 「Never add fudge factors」：不许乘个 1.002 之类的系数让测试通过。
- 每一项公式都要注明对应 CLASS 源码的行号。
- 要在多组参数点上测试，不能只测基准点（fiducial）。
- 用 CAMB 做第二个 oracle。
- 并行时在 PROGRESS.md 里认领任务，例如 `IN PROGRESS: … (@agent-1)`。

**核对结果、防跑偏**：靠 oracle 对比、提交前必跑测试、Ralph 的完成确认、定期看 git 历史，以及上面那些禁止凑系数的规则。

**作者明说的失败方式**
- 「agentic laziness」：原文例子「It's getting late, let's pick back up again tomorrow?」
- 测试覆盖有漏洞：有一段时间只在单个基准参数点（fiducial）上测。
- 犯基础错误，比如搞错规范约定（gauge conventions）；会花几个小时追一个宇宙学家一眼就能看出的 bug。
- 推进过程「somewhat clunky」。
- 成品不是生产级，不是所有区间都达标。
- CHANGELOG 里的一个实例：参考数据生成时把某些参数全设成 0，于是精度脚本一直没发现 4 个 bug。

**做成「长期数字同事」最少需要**
- 能 SSH 到集群并提交 SLURM 作业（GPU，48 小时）。
- 在 tmux 里保持一个长期会话，人能随时接入或断开。
- 能读写 CLAUDE.md 和 CHANGELOG.md。
- 能 git commit 和 push 到 GitHub，人可以在手机上看。
- 能跑测试，能访问参考实现及其参考数据。
- 有「声称完成后再追问」的循环。
- 能派子 agent。

---

## 3. Ethan Perez「Tips for Empirical Alignment Research」

**作者和日期**：Ethan Perez，2024-02-29，发在 AI Alignment Forum / LessWrong。对象是人类合作者，不是 AI agent；文中 LLM 只是做实验的对象和工具。

**做法概述**：核心原则是尽快降低不确定性。成功标准里「Getting ideas to work quickly」占 70%。

**「让模型做到某件事」的尝试顺序**（没有很强的理由不要跳步）
1. 在聊天界面里零样本地大量试，发 10–100 条消息，根据错误改 prompt。
2. 手工给 1–10 个标准示例。
3. 用带标签的数据做 few-shot，可以塞满上下文。
4. Best-of-N：temperature 1、top-p 1；N=8 还行，N=100 很好。
5. SFT：测试 loss 要低于随机基线，比如二分类时是 -log(0.5)；loss 和准确率都要看。
6. 最后才用 RL(HF)。

**执行阶段**
- 尽量让实验 24/7 都在跑。单次实验超过 8 小时的，至少一半时间要有实验在跑。
- 单次实验控制在 16 小时以内，形成这样的循环：晚上跑，早上看结果，决定下一步，实现，再跑。
- 缩短实验的办法：换小模型；样本量减到 1k，最少 300（300 是画出干净缩放趋势的下限）；先用 BoN 验证奖励函数，再上 RL；缩短 prompt；检查 stop token 是否真被触发；减少生成的 token 数。

**分工**
- 指导者：给新人定方向，每周一次反馈，Slack 上可能 1–7 天才回复。
- 执行者：跑实验，每次汇报结果都附上排好优先级的下一步建议。原文理由是别人「discriminate」（在选项里挑）比「generate」（自己想选项）容易。

**文件和产物**
- 研究日志：一个边做边追加的文档，放图、统计和观察。另整理一份给周会用。
- 每个项目一个 Slack 频道，大约每天一条更新，格式是 **Last / Next / Blockers**。
- 更新要带完整背景。原文说漏掉 1–2 个细节就可能看不懂，而下一次查看可能在 12 小时以后。
- 周会用幻灯片，议程包括：图表、按优先级排好的下一步、要问的问题、每项讨论的时间分配。
- 每 4 周一次 1:1。

**核对结果**
- 找一个自动的代理指标，同时看原始样本。
- 用 UMAP 做数据地图。
- 坐标轴取对数，找幂律。用错指标就可能看不出来，比如 BoN 越狱论文里，要画 -log(ASR) 才看得到。
- 偏好模型（PM）的分数只能在同一上下文里比较；RLHF 模型输出的概率没有校准。

**作者明说的失败方式**
- 单次实验超过 16 小时，反馈就太慢。
- 钻牛角尖，只盯一个方向。
- 太少约会议讨论。
- 生病时不休息。
- 用错指标，错过幂律。

**做成「长期数字同事」最少需要**（我的映射）
- 能定时：夜里跑，早上汇报。
- 能往一个固定频道发 Last/Next/Blockers 格式的日报。
- 能往一份研究日志里追加内容。
- 能调用模型 API（采样、BoN、微调 API）。
- 能画图，能列出排好优先级的下一步给人挑。

---

## 4. John Hughes & Ethan Perez「Tips and Code for Empirical Research Workflows」

**作者和日期**：John Hughes（主笔）与 Ethan Perez，2025-01-20。对象同样是人类研究者。AI 在文中是工具：Cursor 被称为「essential」，还提到 Aider 和 Devin。作者对 Devin 的评价是「isn't seamless yet」（曾在 lint 上卡住，因为 Python 版本不对），但「likely how automated research will be orchestrated in the future」。

**两种模式**
- de-risk 模式：用 notebook 快速验证。Ethan 大约 75% 的工作处在这个模式；many-shot jailbreaking 当初只用了约 50 行代码就验证完了。
- extended project 模式：验证过之后切换，改成脚本，加代码审查、测试、pre-commit 和 CI。

**实验流程**
1. 写项目计划：动机、研究问题、能想到的所有实验、里程碑。
2. 开始一个实验前先停下来问：动机是什么？预期结果是什么？是否先用一个模型、一个数据集？是不是一次改了太多变量？
3. 建实验文件夹，例如 `./experiments/<name>/250109_jailbreaking_technique_v1`，日期用 YYMMDD。脚本按执行顺序编号，例如 `1_run_harmbench.sh`、`2_run_classifier.sh`、`3_analyse_attack_success_rate.ipynb`。
4. 输出 jsonl，包含所有元数据、输入和输出，用 pandas 分析。
5. 所有脚本都要有命令行参数（用 simple_parsing），这样可以写包装脚本，也方便在多个 tmux 窗格里并行跑。
6. 在实验目录里存 git commit hash，必要时复制整份代码。
7. 缓存 LLM 响应并保存检查点，实验可以杀掉再从断点继续。
8. 并行：多 GPU 用 simple-gpu-scheduler 排队；openweights 自动在 RunPod 上开机器；夜间实验优先用 OpenAI 或 Anthropic 的 batch API。
9. 每天在 Slack 发更新，每天和核心合作者开站会。
10. extended 模式下每个功能或实验一个小 PR，尽快合并。

**分工**：导师或团队负责反馈和挑选下一步；执行者跑实验、记录、提 PR。

**文件和产物**
- Notion 实验表，列为：experiment name、tags、users involved、last updated、status（in progress/done）。每个实验一页，往里随手放图和想法。
- 实验文件夹、jsonl 结果、commit hash。
- `.pre-commit-config.yaml`：ruff、black、trailing-whitespace、nbstripout，用 `make hooks` 安装。
- 用 tmux 跑过夜实验，用 dotfiles 统一机器环境。
- 两个开源模板仓库：safety-tooling（带并发控制的推理 API、接 W&B 的微调、Jinja 模板）和 safety-examples。

**核对结果、防跑偏**
- 代码审查。原文：「One bug could lead to you having to re-run days or weeks of results」。
- 从 notebook 重构成脚本本身就能抓到 bug，因为 notebook 的 cell 不按顺序执行容易出错。
- 可复现：同一个脚本跑出的结果应尽量一致（数据划分、超参数都相同）。
- 用 pre-commit 和 CI 卡住不合格的代码。

**作者明说的失败方式**
- notebook 容易出 bug。
- 大 PR 会降低审查质量。
- LLM API 即使 temperature 设为 0 也不确定；prompt 一变缓存就失效。
- Devin 不稳定，而且每月 500 美元很贵。

**做成「长期数字同事」最少需要**（我的映射）
- 能 SSH 到远程 GPU（例如 RunPod），用 tmux 跑过夜实验。
- 能用 git 建分支、提 PR。
- 能调用带缓存的并发推理 API 和 batch API。
- 能按约定建带日期的实验文件夹，写 jsonl，记录 commit hash。
- 能维护一张带状态的实验表。
- 能发日报，能排队 GPU 任务，并能从断点续跑。
