# Decision Chain

<!--
  自包含决策链。每条含 Context（可验证事实）/Decision/Rationale/Alternatives/Confidence/Date。
  只追加，不修改旧条目。审计者负责捕获与审计。
-->

## D-001: 判定"main 分支不见了"根因为 origin/HEAD 悬空引用（master→main 改名遗留），非分支删除 [Accepted]

- Context: 用户报障"为什么我的main分支不见了"（Orca UI 中不显示 main）。核实事实：本地 `main` 存在（52e760c92 Merge branch 'fix/ci-failures'），远端 `origin/main` 存在（647e4d5f8）；`git symbolic-ref refs/remotes/origin/HEAD` 返回 `refs/remotes/origin/master`，而 `refs/remotes/origin/master` 与 `refs/heads/master` 均已不存在（`git rev-parse` 失败）；存在 6 月初改名备份分支 `backup/master-before-sync-20260528-171528`、`backup/local-master-before-clean-20260602-151704`（后者 `[origin/master: gone]`）；Orca CLI `repo search-refs --query main` 返回 `main` 与 `origin/main`；Orca repo 元数据 `worktreeBaseRef` 在修复前指向失效引用。
- Decision: 采纳根因"`origin/HEAD` 是悬空符号引用，Orca UI 依赖 `origin/HEAD` 解析仓库默认/主分支 → 解析到死引用 → UI 不显示 main；CLI 直接枚举 refs 不走 origin/HEAD 故可见"。否定"分支被删除"与"Orca 客户端损坏"两个替代解释。
- Rationale: 所有 git 层证据（refs 存在性、符号引用指向、备份分支时间戳）一致支持"改名后符号引用未更新"；CLI/UI 可见性差异只能用两者解析默认分支的路径不同解释，悬空引用是唯一能同时解释 CLI 可见、UI 不可见的实体。
- Alternatives: ①分支真被删除（否：本地与远端 main refs 均存在）；②Orca 客户端/索引损坏需重装（否：CLI 查询正常，问题定位于符号引用）；③重新创建 master 分支（否：master 已废弃，方向相反）。
- Confidence: high（git 层全部事实经独立核实；"Orca UI 依赖 origin/HEAD"的机制为推断，修复后 UI 实际显示结果未直接确认——见 D-002 遗留风险）
- Date: 2026-08-09

## D-002: 修复方案：仅做安全可逆的 git 元数据操作 + Orca base-ref 指正，不动提交历史、不重建 master、不同步分叉的本地 main [Accepted]

- Context: 修复前脏状态：本地 `main` 无 upstream（`branch.main.remote` 未配置）；`main` 与 `origin/main` 已分叉（`git rev-list --left-right --count main...origin/main` = ahead 141 / behind 11），分叉点 36e2259fe 即当前 HEAD；`refs/remotes/origin/master` 残留；Orca 配置 `worktreeBaseRef` 指向失效引用。
- Decision: 执行 `git remote set-head origin main`（origin/HEAD → origin/main）、`git branch --set-upstream-to=origin/main main`（恢复 upstream）、`git fetch --prune origin`（清失效远端跟踪引用）、`orca repo set-base-ref --ref origin/main`（修正 Orca 默认 base ref）；明确不动任何提交历史、不重建 master、不对分叉的 main 做 merge/reset。清理自己产生的临时脚本，不留脏文件。
- Rationale: 用户诉求是"main 为什么不见了"——修复的是显示与跟踪元数据，不是分支内容；本地 main 的 141 个领先提交是 Codex 今天做的 merge 链（reflog 可证），重置/合并属于行为变更，超出诊断范围，应留待用户决定；全部操作可逆且零历史影响，失败风险最低。
- Alternatives: ①本地 main 重置到 origin/main（否：丢弃本地 merge 提交，不可逆风险）；②将 origin/main 合并进本地 main（否：超出"为什么不见了"的提问范围，无用户要求）；③手动重写 `refs/remotes/origin/HEAD` 符号引用文件（否：`git remote set-head` 是标准接口，更稳）。
- Confidence: high（修复后 git 层全部生效经独立核实：`git symbolic-ref refs/remotes/origin/HEAD` → refs/remotes/origin/main；`branch.main.remote`=origin、`branch.main.merge`=refs/heads/main；refs/remotes/origin/master 已不存在；`orca repo show` 显示 `worktreeBaseRef: origin/main`；工作树无代码改动、无暂存文件）
- Date: 2026-08-09

## D-003: 判定 CI 失败根因为两个 workflow 文件的静态错误（update-data.yml YAML 缩进 + check-wechat runner context schema），非代码/构建/依赖问题；deploy #291 失败属预期行为 [Accepted]

- Context: GitHub 分支运行记录（2026-08-02，13 条全为 failure）显示 update-data 与 check-wechat 的 push 事件运行 1 秒内失败、0 job、运行名即文件路径（GitHub 对 invalid workflow file 的失败记录特征）；独立核实：7 个 workflow 文件中**仅 update-data.yml** 解析失败（PyYAML ParserError @371/375——`run: |` 块首行 12 空格 vs 其余 10 空格，`if git diff --cached --quiet; then` 提前终止字面块）；check-wechat-published-article.yml 在 **workflow 级 env** 使用 `${{ runner.temp }}`（GitHub schema 拒绝 runner context @L26，PyYAML 无法捕获 schema 错误——即"本地解析 OK 但 GitHub 报 Invalid"之谜底）；调查途中"全部 7 个文件缺 on:"的说法经核实不成立（所有文件均有 on:，本地 HEAD 与 origin/main 皆然）；main 与分支持有相同坏 blob（update-data 均为 5c930e08，check-wechat 均为 b6fa8e5c9），主线损坏在 6b2bdfedd→d2f1f51f0 区间由 54a117e8f（Merge lazy map place tour cards）引入；deploy #291（3d47749a，workflow_dispatch，2026-08-02）失败存在，归因为 github-pages 环境保护规则拒绝 codex/* 分支（父会话断言，未取到运行日志独立复核）。
- Decision: 根因 = update-data.yml YAML 缩进错误 + check-wechat workflow 级 env 使用 runner context，两者均为静态文件错误；deploy #291 为环境保护规则的预期行为，非 bug、非本轮改动。
- Rationale: 三层证据闭环：①本地 PyYAML 可复现 update-data 解析错误；②GitHub 失败记录特征（1s、0 job、路径命名）与 invalid workflow file 一致；③修复推送后 GitHub 不再产生同名失败记录（见 D-004）。"缺 on:"等中间假设被 git 级核实推翻。
- Alternatives: ①本地没有 CI 配置（否：文件在 git 中，探查工具跳过隐藏目录）；②GitHub 侧/API 传输损坏（否：git blob 与 API blob 同 sha 5c930e08，本地可复现同一错误）；③main 与分支损坏形态不同（否：同一 blob）。
- Confidence: high（本地解析、git blob、GitHub 运行记录全部独立核实；唯一未独立复核项：deploy #291 的环境保护规则归因，为父会话断言且无日志佐证，但其失败存在、解释与 codex 分支无部署权限的常规配置一致）
- Date: 2026-08-09

## D-004: 修复方案：最小范围静态修复两个 workflow 文件并推送，不修 main（合并后自动修复）、不处理 deploy 环境保护规则 [Accepted]

- Context: 修复前 update-data.yml 在 `run: |` 块混缩进（PyYAML @371/375）；check-wechat 在 workflow 级 env 用 `${{ runner.temp }}`（@L26）。修复后独立核实：c9c6f4585（fix(ci): repair invalid workflow YAML breaking every push，2026-08-09 22:07 +0800）仅改 2 个文件、+4/-3 行——update-data 的 run 块首行 12→10 空格；check-wechat 将 CHECK_RESULT_PATH/SUP_RESULT_PATH 移入使用它们的两个步骤级 env（步骤 47/54 与 91-92/109-113，无孤儿引用）；7 个 workflow 全部通过 PyYAML；工作树无未提交/暂存改动；`.tmp_ci_probe.py`、`.tmp_decode_blob.py` 已删除（未跟踪仅剩 .pi/、.pi-subagents/、.playwright-cli/ 基础设施目录）；分支已推送（ahead 0/behind 0）；GitHub API 显示 c9c6f4585 推送后**无新 invalid workflow 失败记录**（修复前同分支每次 push 必产生路径命名失败记录），证明 GitHub 解析器已接受两文件。
- Decision: 修正 update-data 缩进（run 块首行 12→10 空格，与块内其余行一致）；check-wechat 将两个 runner.temp 变量从 workflow 级 env 移到步骤级 env（runner context 在步骤级合法）；推送 c9c6f4585 到 codex/map-card-loading；**不直接修 main**（main 持有相同坏文件，合并 codex/map-card-loading 后自动修复）、**不处理 deploy 环境保护规则**（既有配置、预期行为）；清理临时脚本；丢弃 pi-lens 格式化噪声（单引号→双引号），保持工作区与推送提交一致。
- Rationale: 根因是静态文件错误，最小 diff 即修复（4 行改动 vs 重写 workflow）；main 侧不动避免与后续合并冲突、控制范围；deploy 规则非本轮引入、非用户诉求；runner.temp 移步骤级是标准做法，优于固定路径（并发/权限风险）。
- Alternatives: ①重写整个 workflow 文件（否：过度设计，根因仅 4 行）；②workflow 级 env 改用固定临时路径（否：runner.temp 语义即每 job 独立临时目录，固定路径有并发与权限问题）；③立即单独修 main 并推送（否：合并即修复，单独改动会与合并冲突、扩大范围）。
- Confidence: high（修复内容、范围、清理、推送、GitHub 解析器验收全部独立核实；"CI 转绿"以"本地解析通过 + 推送后无新 invalid 失败记录"支撑，实际执行结果待下次调度：check-wechat 每日 02:00 UTC、update-data 周一 03:00 UTC）
- Date: 2026-08-09

## D-005: 地图精度修复策略：清除标签级误匹配 pin + 新增 43 个国际城市 catalog 坐标 + 查询校验守卫 [Accepted]

- Context: 基线（修复前，2026-08-10）：geo-places.json 659 个点位，fallback 170（其中 157 个 POI 名落到父城市中心）；实测 21 个 tour 存在标签级误匹配——硅谷→长春市硅谷街道、柏林→重庆柏林镇、珍珠港→广西江平镇、桌山→江西樵舍镇、黑山(国)→辽宁西关村、夏威夷→广西；根因①裸标签无行政上下文时匹配"镇/街道"行政单元被 85 分支接受，②查询硬编码"中国"（国际线路错误限定国内），③enrichment 把结果地址的行政字段写回目的地。修复后实测：12 个 tour 错 pin 已清除（fix_label_only_geocode_mismatch.py），catalog 新增 43 个国际城市（含坐标，维也纳除外），photon/overpass/OSM 索引对 129 个国内温泉 POI 全部为空（无自动解析可能）。
- Decision: 修复三处：①`geocode_destinations._named_result_quality` 管理后缀匹配（裸标签↔镇/街道）要求 expected_city；②`destination_queries`/`_candidate_queries` 用路线国家替代硬编码"中国"，国际线路无行政上下文不裸查；③`_try_candidate` 无上下文时不把结果地址城市/省写回目的地；数据层新增 43 个国际城市 catalog 条目并清除 12 个错 pin。
- Rationale: 三个根因都有确定性证据（21 个 tour 的具体错 pin + 代码路径可复现）；修复全部有对应回归测试保护（test_rebuild_geo_data、test_geocode_destinations 通过）；国际城市坐标来自已知地理事实（catalog 已有同格式条目先例）。
- Alternatives: ①全量网络回填（否决：--network 跑 1h18m 未完成且对国内 POI 收益为 0——photon/overpass/OSM 均无这些 POI）；②手工维护 NAMED_PLACE_COORDINATES（延后：需逐个联网核实坐标，超出本轮）
- Confidence: high
- Date: 2026-08-10T18:20:33.089Z

## D-006: 国内温泉/度假村 POI 精度天花板：129 个点位无任何地理编码源，保留父城市回退 [Accepted]

- Context: 修复后 129 个 fallback POI（台山金水台温泉、龙门地派温泉、新丰云天海温泉等）仍停留在父城市坐标。实测：photon.komoot.io 搜索 322 个查询 0 命中；overpass 精确名正则（7 个样本）0 元素；OSM POI 索引（11550 条）0 命中。这些 POI 不在任何公开地理编码源中，非解析逻辑缺陷。
- Decision: 判定这 129 个 POI 为精度天花板：保留「父城市范围（模糊定位）」回退作为诚实状态，不强行猜测坐标。
- Rationale: 三个独立数据源（photon/overpass/OSM 索引）全部为空是可重复的客观事实；强行猜测坐标会引入比"范围标注"更严重的新错 pin（与本次修复的错误类型相同）。
- Alternatives: ①手工给 129 个 POI 补坐标（延后：需逐点联网核实，误差风险高于收益）；②过pass 精确名搜索（实测 7/7 为空）
- Confidence: high
- Date: 2026-08-10T18:20:49.327Z

## D-007: 回滚两处自引入回归：移除区域冲突守卫、catalog 不收录维也纳 [Accepted]

- Context: 审计发现两处回归并回滚：①我加的「国内区域×国际城市冲突守卫」把 destination=广东/港澳（实为出发地）的纽约/巴黎等国际 tour 误降级为区域（tour 级 region 304→823，+519）；②catalog 新增的「维也纳」破坏既有测试 test_rebuild_drops_historical_foreign_city_as_domestic_hotel（国内"维也纳国际酒店"品牌碰撞）。两次回归均通过 git checkout 恢复数据 + 移除守卫/条目修复，最终 _diag_level_shift 验证：region 304→278（-26），city 1773→1858（+85 新国际城市），仅 98 个 tour 级别变化（修复前 623）。
- Decision: 回滚两处自引入回归：移除区域冲突守卫（raw destination 对国际线路不可靠，不可作权威上下文）；catalog 不收录维也纳（与国内酒店品牌碰撞）。保留其余 43 个国际城市。
- Rationale: 两处回归都有实测证据（+519 region 跳升、测试失败）；回滚后指标恢复且新增国际城市保留收益；维也纳撞车有既有回归测试守护，是真实错误而非测试过严。
- Alternatives: ①保留守卫但排除港澳/华东宏区（实测仍误伤 destination=广东 的纽约类国际 tour——广东作出发地非目的地）；②保留维也纳 catalog 条目并改测试（否决：维也纳国际酒店是国内连锁品牌，碰撞是真实错误）
- Confidence: high
- Date: 2026-08-10T18:21:07.256Z

## D-008: 交付模型：代码+脚本为评审单元，地图数据由两步命令再生（不预烘焙 1805 文件生成 diff） [Accepted]

- Context: 两次结对审计均 180s 超时，根因为评审面过大：工作区含 1805 文件生成数据 diff（1263 个孤儿详情文件删除 + tours.json 49MB 单行）。已将 public/data 全部回退 HEAD，工作区收敛为 3 代码文件 + 3 脚本（~100 语义行）。数据修复机制已实测：fix_label_only_geocode_mismatch.py 对 HEAD 数据 12 命中（硅谷×3/柏林/珍珠港/桌山/黑山×4/小镇/旧城区），rebuild 后指标为 places 670 / region 278（回滚前跳升 823 已修复）/ city 1858。
- Decision: 交付模型：代码（3 文件）+ 脚本（fix_label_only_geocode_mismatch.py / audit_map_precision.py / prefill_geocode_cache.py）为审计评审单元；地图数据由两步命令再生：`python scripts/fix_label_only_geocode_mismatch.py && python scripts/rebuild_geo_data.py`。工作区不预烘焙生成数据。
- Rationale: 生成数据（split shards / geo-places / tours.json）全部由 rebuild 确定性再生，逐行评审无意义；49MB 单行文件是审计超时的直接原因；机制（脚本+代码）比预烘焙数据更可审、可复现、可回归。
- Alternatives: ①数据直接烘焙进工作区（否决：1805 文件生成数据 diff 含 49MB 单行 tours.json，审计 180s 预算内不可评审，两次超时的直接原因）；②提交数据到分支（否：不缩小审计读取面）
- Confidence: high
- Date: 2026-08-10T18:29:48.349Z

## D-009: 分支切换：条件未满足不切（Round A）→ 用户显式要求后切到 main，保留本地/远端分叉不做破坏性同步（Round B） [Accepted]

- Context: 用户 L230「当前的项目分支合并到main了吗，如果合并到就将主分支切到main」→ 核实：`git branch --merged origin/main` 计数 0、`c9c6f4585`（fix(ci): repair invalid workflow YAML）非 `origin/main`（3e04daed4）祖先、codex/map-card-loading 领先 1 提交 → 条件未满足，不切。用户 L250「先不管审计，现在能切mian吗」（显式覆盖条件）→ 执行切到 main。核实（独立）：`git branch --show-current`=main、HEAD=52e760c92、reflog 有 checkout 记录、`main...origin/main`=ahead 141/behind 12、`c9c6f4585` 仍在 codex/map-card-loading 引用上、工作区 0 modified/0 staged。后续事实：本地 main HEAD 的 `.github/workflows/update-data.yml` 仍携带坏缩进（PyYAML PARSE FAIL @L403/407），CI 修复提交未进入 main。
- Decision: ①Round A：条件式指令（"如果合并到就切"），未合并 → 不切，如实回答；②Round B：用户显式要求切换 → 切到 main；发现本地 main 与 origin/main 分叉（ahead 141/behind 12）后选择保持现状——不做 rebase、不做 reset、不做破坏性同步；`c9c6f4585` 留在原分支不 cherry-pick。
- Rationale: Round A 条件为假则无动作，是条件指令的唯一正确响应；Round B 用户显式覆盖审计等待并直接要求切换，切换零风险（工作区干净、提交保留在分支引用）；141 个本地领先提交来源未知（疑似未推送的本地合并链），rebase/reset 有冲突或不可逆丢失风险，超出"能切吗"的询问范围，保持现状并将选项留给用户。
- Alternatives: ①`git pull --rebase origin main`（否：141 个本地提交重放有冲突风险）；②`git reset --hard origin/main`（否：不可逆，丢弃本地提交）；③cherry-pick c9c6f4585 到 main（否：D-004 已定合并自动修复，用户未要求）。
- Confidence: high（全部 git 事实独立核实：分支、HEAD、分叉计数、提交存在性、main 的 workflow 文件仍坏）
- Date: 2026-08-10

## D-010: 计数修正：catalog 实际新增 42 条国际城市（非 43），校准 D-005/D-007 [Accepted]

- Context: 审计方对抗核实（独立实测）：`git diff scripts/geo_catalog.py | grep '^+.*("' | wc -l` = 42 条新增国际城市行。D-005 声称「43 个国际城市（含坐标，维也纳除外）」、D-007 声称「保留其余 43 个」均为计数错误：初始添加 43 条含维也纳，回滚维也纳后应为 42（华盛顿…内罗毕，实测 42 行，维也纳 0 处引用）。
- Decision: 修正计数：catalog 实际新增 42 条国际城市（实测 diff 42 行），D-005/D-007 中的「43」为含维也纳的初始数，以本条目为权威修正。其余事实（12 错 pin 清除、区域守卫回滚、维也纳不收录）不变。
- Rationale: 链须与产物一致（产物忠实性）：实测 diff 42 行是唯一可信计数；修正后 D-005/D-007 的核心结论（新增国际城市 + 维也纳排除）不受影响，仅数字校准。
- Alternatives: ①修改 D-005/D-007 原文（否决：链规约 append-only，不回头改旧条目）；②不记录直接改后续引用（否决：错误计数会污染后续决策引用）
- Confidence: high
- Date: 2026-08-10T18:40:26.655Z

## D-011: supersede D-004：main 上直接修复 update-data.yml 解析错误并接入 fix 步骤（与 c9c6f4585 逐字一致） [Accepted]

- Context: 审计 blocker ②要求把 fix 步骤接入 update-data.yml；当前分支已是 main（D-009），该文件仍 PyYAML PARSE FAIL（L407 run 块首行 12 空格 vs 其余 10，D-003/D-009 记录）；c9c6f4585（相同修复）在 codex/map-card-loading 未合入。已在 main 直接应用与 c9c6f4585 逐字一致的修复（12→10 空格），PyYAML 实测 PARSE OK；并在 rebuild 步骤后插入 fix_label_only_geocode_mismatch.py 步骤。
- Decision: supersede D-004：在 main 上直接修复 update-data.yml 解析错误（与 c9c6f4585 逐字一致，保证合并无冲突），并把 fix_label_only_geocode_mismatch.py 接入 rebuild 之后、split 之前的 CI 步骤。
- Rationale: D-004 的前提（工作分支非 main、合并即将发生）已被 D-009 的分支切换打破；审计 blocker 明确要求 CI 接入，等待合并会让修复机制不可执行；逐字复用 c9c6f4585 的修复避免合并冲突。
- Alternatives: ①保持 D-004「不直接修 main，等合并」——否：D-009 已把工作分支切到 main，c9c6f4585 未合入且近期无合并迹象，审计 blocker 要求 CI 步骤可执行，等待会让 fix 步骤成为死代码；②修复内容与 c9c6f4585 不同——否：逐字复用同一修复（run 块首行 12→10 空格），后续合并无冲突
- Confidence: high
- Supersedes: D-004
- Date: 2026-08-10T18:59:06.183Z

## D-012: 交付模型修订：L1 blocker ① 要求下，修复轮提交再生数据 + before/after 验收度量（覆盖 D-008「工作区不预烘焙」条款） [Accepted]

- Context: L1 run-16968 blocked（5 blockers，2026-08-11）：①数据修复未交付（12 错 pin 仍在工作树）②fix 步骤未接入 CI ③验收度量缺失 ④审计窗口内产物被改写 ⑤3 脚本未跟踪。主 agent 修复轮执行：跑 fix_label_only_geocode_mismatch.py（12 命中）+ rebuild_geo_data.py，提交 eedf6c456（代码 3 文件 + 3 脚本 + update-data.yml CI 修复 + audit/map-precision-before/after.json 度量 + 再生数据 tours.json/geo-places.json/tour-details），随后 pi-lens 引号重排提交 d27cb9f90。独立核实（本次实测）：commit eedf6c456 含再生数据；tour_636/653/654/854/645/737/4628/4632/4802/4804 的 geo 字段已清空（source=unknown）；黑山类 tour 经 catalog 重解析为莫斯科/雅典（东欧线，非西关村）；度量数字 places 659→670 / fallback 170→168 / catalog 258→285。遗留缺陷：提交的度量文件为 GBK 编码（非 UTF-8，@pos231 解码失败）、update-data.yml 引入重复 run: 键（L352-354，PyYAML last-wins 通过但 GitHub 严格解析器拒绝——与 D-003 记录的盲区同类）——均被 L1 run-87580 捕获为新 blockers，工作树已有未提交修复。
- Decision: 交付模型修订：修复轮以「提交再生数据 + before/after 验收度量 + CI 接入」为交付形态，覆盖 D-008 的「工作区不预烘焙生成数据（两步命令再生）」条款；数据修复以提交态交付（不依赖评审期命令再生成），验收度量入库供「精度满意」量化验收。
- Rationale: L1 blocker ① 明确要求「实测 12 错 pin 已从提交数据清除后再签名」——只有提交态数据可被审计直接验证，D-008 的「命令再生」可复现性无法满足验收；度量文件（before/after）使用户的「精度满意」验收有量化依据。
- Alternatives: ①维持 D-008 纯脚本交付（否：L1 blocker ① 判定数据修复未交付，用户可见地图错 pin 未修复）；②只提交数据不提交度量（否：blocker ③ 要求验收度量）。
- Confidence: high（提交内容、12 pin 清除、黑山重解析、度量数字均独立核实；遗留编码/CI 键缺陷已另记）
- Supersedes: D-008（部分：交付形态条款）
- Date: 2026-08-10T19:20:48.000Z

## D-013: 移除 fix 脚本 INTERNATIONAL_MARKERS 中的「维也纳」（消除国内品牌 tour 误清风险，与 D-007 一致） [Accepted]
- Context: 审计 L1 指出 fix_label_only_geocode_mismatch.py 的 INTERNATIONAL_MARKERS 含「维也纳」，与文件自身 L90-91 排除注释和 D-007（维也纳国际酒店是国内品牌碰撞）矛盾；该脚本已接入 CI（每轮数据重建必跑），intl_subdivision 规则遇国内「维也纳国际酒店」类 tour（city 为镇/村/街道/乡 + source∈{geocoder,osm}）会误清正确 pin。当前数据 0 命中，属潜伏风险。已删除该标记（025167310），grep 实测仅剩 2 处注释引用。
- Decision: 从 fix_label_only_geocode_mismatch.py 的 INTERNATIONAL_MARKERS 移除「维也纳」（保留排除注释），消除 intl_subdivision 规则对国内维也纳国际酒店品牌 tour 的误清风险，与 D-007 一致。
- Rationale: 脚本已入 CI 每轮必跑，潜伏误清风险应合并前消除；维也纳是国内连锁酒店品牌（D-007 实测证据），marker 与排除注释自相矛盾；一行移除、零行为影响（当前数据 0 命中该规则）。
- Alternatives: ①保留维也纳标记但加品牌排除（否：维也纳国际酒店为国内连锁，排除列表永不完备，移除更简单且与 D-007 一致）；②改 intl_subdivision 规则去掉 marker 依赖（否：扩大改动面，非本次 blocker）
- Confidence: high
- Date: 2026-08-10T20:04:24.712Z

## D-014: 省份缩写误报修复 + markers frozenset 免疫 formatter + 度量校准（666/164/288、黑山→威尼斯/雅典）+ 新规则入链 [Accepted]
- Context: reviewer 实测：单字省份缩写 substring 匹配误报（银川→川→四川、新会→新→新疆、青岛→青→青海、吉安→吉→吉林、黑山→黑→黑龙江、桂花→桂→广西），会误清正确 subdivision pin；D-012 记「places 659→670/fallback 170→168/catalog 258→285、黑山→莫斯科/雅典」与提交态不符（实测 666/164/288、黑山→威尼斯/雅典）；fix 脚本的 generic-label/province-conflict 规则与 bare-name 兜底、广东三定点无对应决策条目。
- Decision: ①PROVINCE_ALIASES 移除危险缩写（川/新/青/吉/黑/桂），新增宁夏，province_base 剥离「自治区」后缀；②INTERNATIONAL_MARKERS 改为 frozenset（单行文本，免疫 formatter 复写）；③校准度量：提交态 after = places 666 / fallback 164 / catalog 288 / coarse 125，黑山类 tour 解析为威尼斯/雅典；④记录 generic-label 与 domestic-province-conflict 规则、bare-name 兜底（靠 _has_admin_evidence 门控）、广东三定点（新丰云天海/三水温泉/东莞观澜湖）为已入链行为。
- Rationale: 缩写的误报类已被测试复现（银川/新会/青岛保留断言），收紧是防潜伏误清的必要修正；frozenset 解决 formatter 反复复写元组导致的结构损坏（同一文件三次被复写）；度量数字与黑山重解析结果以提交态为权威。
- Alternatives: ①保留单字缩写但做全词锚定（否：复杂度高，安全缩写集已验证足够）；②province-conflict 规则整体移除（否：应星楼类已实测有效，收紧而非移除）
- Confidence: high
- Date: 2026-08-10T20:34:54.492Z

## D-015: 广东省内游 POI 精度策略：photon 裸名命中 → 策展已验证坐标 + destination_queries 裸名兜底变体 [Accepted]

- Context: 用户要求「继续修。优先广东省内游」（convlog L852）；68 个广东 fallback 点位（实测清单）；串行网络探测全部 68 个点超时不可行；改用 photon 单源裸名快速探测后发现：**带城市上下文的查询失败（photon 模糊搜索被额外行政词带偏），裸名查询反而命中**——「新丰云天海温泉度假村」(23.97,114.12)、「三水温泉度假村」(23.37,112.97)；裸名命中 7/63（可用约 4 个纯净度假村/酒店）；已策展进 `NAMED_PLACE_COORDINATES`（geo_catalog.py L898-924 实测）：新丰云天海(23.973643,114.1190575)、新丰云天海温泉(同)、三水温泉(23.3703983,112.9668712)、东莞观澜湖度假酒店(22.7831684,114.005058)，level=poi、coordinateSource=catalog；`destination_queries` 增加裸名兜底查询变体（L198-200 实测：直接 `queries.append(label)`，注释说明 photon/nominatim 以品牌全名索引度假村、加行政词反致 miss，验证闸门不变）；提交 851b47510（feat(geo): Guangdong resort precision - curate photon-verified centroids + bare-name query fallback）；广东精度推进：fallback 164（原 170）、catalog 288（实测 audit/map-precision-after.json）。
- Decision: 广东省内游精度采用「photon 裸名命中 → 策展进 NAMED_PLACE_COORDINATES + destination_queries 裸名兜底变体」策略：已验证坐标直接策展（立即生效、可回归）；裸名查询变体让未来抓取/重建自动受益（验证闸门不变，仍要求结果地址含行政证据）。
- Rationale: D-006 已证网络地理编码对国内温泉/度假村 POI 覆盖极低，但部分度假村以品牌全名被 photon 索引——裸名命中是实测可复现的（7/63）；策展坐标零运行时成本且坐标来源已验证；裸名变体针对"带城市上下文反而 miss"的实测失败模式，使管道长期受益而非一次性策展。
- Alternatives: ①继续串行网络探测全部 68 个广东点（否：串行查询超时，实测不可行）；②全量 photon 预填（否：对国内 POI 命中近 0，D-006 已证）；③手工逐个联网核实坐标（否：网络探测慢且收益有限，先策展已验证的 3 个）
- Confidence: high（策展坐标、裸名命中率、查询变体、提交均独立核实）
- Date: 2026-08-10T20:41:42.096Z

## D-016: fix 步骤 CI 顺序修正：从 rebuild 之后移到 rebuild 之前（L1 处方），Supersedes D-011 顺序条款 [Accepted]

- Context: D-011 记录「fix 步骤接入 rebuild 之后、split 之前」；L1 审计处方与 reviewer L3 均要求 fix 步骤移到 rebuild **之前**（理由：rebuild 的 `_preserve_existing_precise_geo` 会保留「标题证据支持的既有 geocoder 点」，若 fix 在 rebuild 之后运行，清除的错 pin 会被保留逻辑覆盖/残留过期 geoResolution.final）；实测 update-data.yml 当前顺序：merge → enrichment → split(L345) → **fix(L348)** → rebuild(L351) → split(L354)（fix 在 rebuild 之前）；提交 0b6fa7382（fix(geo): tests for fix script, reorder fix before rebuild, gitignore artifacts）。
- Decision: fix_label_only_geocode_mismatch.py 步骤移到 rebuild 之前（split 之后），D-011 中「rebuild 之后、split 之前」的顺序条款作废，以本条为准。
- Rationale: L1 处方 + reviewer 一致要求前移（避免清除后残留过期 geoResolution.final 被保留逻辑重新写回）；实测 CI 顺序已按新顺序落地；顺序修正与 D-011 的"接入 CI"决定不冲突，仅修正其步骤位置。
- Alternatives: ①保持 D-011 原顺序（rebuild 之后）（否：L1 处方明确要求前移，原顺序有残留机制问题）
- Confidence: high（CI 文件实测顺序核实）
- Supersedes: D-011（仅 CI 步骤顺序条款）
- Date: 2026-08-10T20:41:42.096Z

## D-017: fix 脚本测试化 + CI preflight 护栏（10 断言套件 + 测试接入 workflow Verify 步骤 + 原子写） [Accepted]

- Context: 交付前 reviewer M2「fix 脚本无测试无 CI 护栏」判为真实缺口（启发式故障 = 发布错误数据）；已建立 test_fix_label_only_geocode_mismatch.py（实测 10 个测试函数，含 test_no_wiener_marker/test_no_duplicate_markers/test_abbreviation_false_positives_kept 等）；测试当场抓出真 bug：「桂花梨」的「桂」被当广西缩写 → 罗定学宫→罗城街道（正确 pin）被误清 → PROVINCE_ALIASES 移除「桂」（D-014 已记录缩写移除）；测试已接入 CI preflight（update-data.yml L54 实测：`python scripts/test_fix_label_only_geocode_mismatch.py`，位于 Verify 步骤）；fix 脚本写入改原子写（temp+rename，防中断半写）；补充 .gitignore 忽略产物；提交 0b6fa7382（含 CI 顺序修正 D-016）。
- Decision: fix 脚本采用「测试套件（10 断言）+ CI preflight 接入 + 原子写」护栏：规则每改必测、测试入 CI 每轮必跑、数据写入 temp+rename 防半写。
- Rationale: reviewer 判定无护栏的启发式脚本是发布风险（单字缩写 substring 误报类已两次抓出真实误清：桂→桂花、苏→江苏/乌镇西栅）；测试入 CI 使回归成本为零；原子写防中断写坏数据文件。
- Alternatives: ①仅修规则不加测试（否：无护栏，同类误清无法防回归）；②测试只本地不接 CI（否：CI 是唯一强制运行点）
- Confidence: high（测试数量、CI 位置、抓出 bug 均独立核实）
- Date: 2026-08-10T20:41:42.096Z

## D-018: 采纳用户要求「正确提交代码，部署后E2E看看效果」——部署 + E2E 验证作为交付验收路径 [Accepted]

- Context: 用户 convlog L1190「正确提交代码，部署后E2E看看效果」；主 agent 采纳（L1204 回复「收到：提交 → 部署 → E2E 验证效果」）；提交 daa542908（pi-lens 重排 fix 脚本+测试，行为不变）已落地，工作树 2 个 reviewer 残留未跟踪文件（_review_out.txt/_review_out2.txt）；部署通道确认：push main → deploy.yml 构建发布 GitHub Pages；本地验证构建 + 查 E2E 工具进行中（in-flight，E2E 结果未出）。
- Decision: 采纳部署 + E2E 验证作为交付验收路径：提交全部产物 → 部署（GitHub Pages）→ E2E 验证地图标注实际效果；「精度满意」的验收标准从链上度量扩展到部署后 E2E 实测。
- Rationale: 用户明确要求部署后看实际效果（不是仅看度量文件）；E2E 可验证用户可见的地图 pin 行为（错 pin 清除、广东精确落点）与数据层修复一致，是比度量文件更直接的验收证据。
- Alternatives: ①仅以 audit/map-precision 度量文件验收（否：用户明确要求部署后 E2E 看效果）；②不做部署只提交（否：与用户指令相反）
- Confidence: medium（决策已采纳、部署通道已确认；E2E 执行结果待下轮验证，in-flight）
- Date: 2026-08-10T20:41:42.096Z

## D-019: 雅典娜船名碰撞：定向品牌排除集守卫（否决宽守卫，零误伤） [Accepted]
- Context: 已上线回归：新增 catalog「雅典」与船名「雅典娜」子串碰撞，tour_2210/2296（国内长江三峡游轮）被解析到希腊雅典（37.9838/23.7275）——与 D-007（维也纳国际酒店品牌碰撞）同一错误类。实测宽守卫（CJK 尾字符拒绝）误伤 91 个合法国际 tour；最终采用定向排除集 BRAND_CONTINUATIONS（雅典娜/罗马假日/威尼斯人/巴黎春天/米兰达），修复后 tour_2210→重庆、tour_2296→宜昌，雅典 place card 仅剩 5 个合法希腊/地中海 tour，零误伤（新加坡/多伦多/伦敦眼全保留）。已部署 + 线上 E2E 通过。
- Decision: 采用定向品牌名排除集守卫（BRAND_CONTINUATIONS，仿 INTERNATIONAL_MARKERS/D-007 模式）处理 catalog 城市与船名/品牌名子串碰撞；否决宽字符集守卫与语境守卫。
- Rationale: 宽守卫实测净负（91 误伤 vs 2 修复）；定向排除集零误伤且可扩展（后续发现新碰撞即追加）；与 D-007 维也纳决策先例一致；回归测试锁定。
- Alternatives: ①宽字符集守卫（尾 CJK 非 POI 字符拒绝）：实测误伤 91 个合法国际 tour（新加坡环球影城/加拿大落基山/巴黎深度游/伦敦眼），净负 → 否决；②语境守卫（国内线路拒外国提及）：无法区分 dest=广东 的出发地国际 tour 与国内 tour → 否决
- Confidence: high
- Date: 2026-08-10T21:56:53.426Z

## D-020: 巴黎人品牌碰撞：扩展 BRAND_CONTINUATIONS + 回归测试 + test_rebuild_geo_data.py 接入 CI（D-019 同类，修复轮在途） [Accepted]
- Context: reviewer run-43140/72320 发现 tour_4089/4098/4243（澳门/珠海国内游，标题含「巴黎人铁塔/巴黎人酒店」Macau 度假村品牌）被钉到 巴黎/法国（48.8566,2.3522，src=catalog）——与 D-019 雅典娜船名碰撞同一错误类；独立核实：3e04daed4（本轮前 origin 基线）中 tour_4089/4098 已是 巴黎 pin（预存在，非本轮 +42 catalog 引入）；committed HEAD（2509d0b45，已部署）实测 tour_4089/4098/4243 destName=巴黎 仍在。主 agent 决策（convlog L1648/1660/1666）：BRAND_CONTINUATIONS 追加「巴黎人→巴黎」（geo_catalog.py L1105，工作树未提交）；新增回归测试 test_rebuild_does_not_pin_macau_resort_brand_to_paris（test_rebuild_geo_data.py L321，未提交）；test_rebuild_geo_data.py 接入 CI preflight（update-data.yml L55，未提交）——此前 CI 仅接 test_fix_label_only_geocode_mismatch.py（D-017 声称的「测试接入 CI preflight」只覆盖 fix 脚本测试；含 D-019 回归测试的 test_rebuild_geo_data.py 未接入，reviewer 已标注机制缺口）。修复在途：重建后 4089/4098 仍为巴黎（守卫未生效，疑 pyc 过期，L851/857/861 调试中），尚未提交。
- Decision: 扩展 BRAND_CONTINUATIONS 定向排除集加入「巴黎人」（Macau 度假村品牌，与 catalog 巴黎子串碰撞），补 Macau 品牌回归测试，并把 test_rebuild_geo_data.py 接入 CI preflight。
- Rationale: 与 D-019 同一错误类（品牌/船名子串命中 catalog 城市）；定向排除集模式零误伤已验证（D-019）；回归测试所在文件未入 CI 是机制缺口（D-019 的雅典娜测试同文件，此前 CI 无法拦截该类回归）。
- Alternatives: ①宽字符集守卫（D-019 已否决：实测误伤 91 个合法国际 tour）；②语境守卫（D-019 已否决：无法区分出发地国际 tour 与国内 tour）
- Confidence: medium（决策已做出、代码已落工作树；守卫有效性未验证、未提交——修复轮在途）
- Date: 2026-08-10T22:06:00Z

## D-021: 毒化缓存持久清理：purge_poisoned_cache 并入 fix 脚本主流程（M1 根治） [Accepted]
- Context: reviewer M1（convlog L1316/1372）指出 geo-geocode-cache 含毒化键（被清除的错 pin 标签残留缓存，重建时会复活旧解析）；主 agent 将缓存清理并入 fix 脚本主流程：purge_poisoned_cache 定义 L27、main 调用 L281（HEAD 独立实测）；提交 03a1da551（E2E locator 修复 + durable geocode-cache purge + playwright devDep + rebuilt dist）；缓存 330→322（8 毒化键：硅谷/应星楼/餐饮/陈皮村），已部署。
- Decision: 把毒化缓存清理持久化进 fix 脚本（purge_poisoned_cache(cleared_labels)），使每轮 CI 重建自动清除被清标签的缓存键，防止错 pin 经缓存复活。
- Rationale: 一次性清理不持久（下轮 rebuild 毒化复发）；fix 脚本已入 CI 每轮必跑（D-011/D-016），并入后成为根治机制；与 D-012 交付模型（CI 重建再生数据）一致。
- Alternatives: ①仅一次性清理缓存（否：下轮重建复活）；②独立清理脚本（否：分散维护，fix 已入 CI 且已有原子写机制）
- Confidence: high（HEAD 代码 L27/L281 实测、提交 03a1da551 已部署、缓存计数与提交说明一致）
- Date: 2026-08-10T22:06:30Z

## D-022: CONTEXTUAL_BRANDS：语境感知品牌守卫（巴黎铁塔仅国内省份线路拒绝） [Accepted]
- Context: D-019 的 BRAND_CONTINUATIONS 处理无歧义品牌碰撞（雅典娜/罗马假日/威尼斯人/巴黎春天/巴黎人/米兰达）。实测发现 巴黎铁塔 有歧义：澳门复制品（tour_4098 dest=广东 "外观巴黎铁塔·澳门珠海2天"）vs 真实埃菲尔铁塔（tour_4716 dest=欧洲 "巴黎铁塔晚餐+少女峰"）。D-019 Alternatives ② 曾否决宽语境守卫「国内线路拒外国提及」（无法区分 dest=广东 的出发地国际 tour 与国内 tour，实测误伤 91 个合法国际 tour）。实测：现存含 巴黎铁塔 标题的 tour dest 分布为 广东/港澳/法国——无 dest=广东 的真实巴黎线路。
- Decision: 新增 CONTEXTUAL_BRANDS = {巴黎铁塔: 巴黎}，仅当 domestic_route=True（destination region 的 province==name，即真实国内省份如广东；港澳/欧洲等不触发）时拒绝该提及；BRAND_CONTINUATIONS 同时追加 伦敦人/巴黎轩（无歧义澳门品牌）。
- Rationale: 与 D-019 否决的宽语境守卫的区别在判别信号：宽守卫拒绝一切「国内线路上的外国城市提及」，误伤出发地国际 tour（纽约等 dest=广东 但真实国际行程）；窄守卫只拒绝「歧义品牌名（巴黎铁塔）」，且只在国内真实省份线路（province==name）生效——dest=广东 的出发地国际 tour 若真有真实巴黎行程，其 destination 字段会带外国语境（法国/欧洲）而不被门控。6 个澳门品牌 tour 实测修复（tour_4089/4098→广东、tour_4243/4252/4253/4255→澳门），真巴黎 tour_4716 保留。
- Alternatives: ① 将 巴黎铁塔 直接加入 BRAND_CONTINUATIONS（否决：误伤 tour_4716 真实埃菲尔铁塔）② D-019 已否决的宽语境守卫（否决：误伤 91 个合法国际 tour）③ 数据层手动修正单 tour（否决：每个新品牌碰撞都要人工补，不可扩展）
- Confidence: high
- Date: 2026-08-11T17:31:29.874Z

## D-023: geocoder 合并高分者胜不变量修复 + 防御加固（H1 排序回归 / 非有限值 / 原子写） [Accepted]
- Context: 提交 7f05d9584（fix(geocode): defensive numeric guards）引入 H1 回归：`_merge_geocoder_results` 的 `sorted(...)` 丢失 `reverse=True`（实测 git show 该提交无 reverse），`winner = ranked[0]` 从最高分胜出翻转为**最低分胜出**——photon Berlin(q=100/s=90) vs arcgis 柏林镇(q=70/s=40) 时错误选中 arcgis 柏林镇，正是 D-005 要消灭的错 pin 类别；同提交还遗留重复 `winner = dict(ranked[0])` 行。reviewer run-80988/97140 独立实测复现（"worst candidate now wins"）。修复提交 f7d04ae50（fix(geocode): restore highest-score winner in provider merge）实测：恢复 `reverse=True`、删除重复行；`_try_float` 加 `math.isfinite` 拒绝 NaN/inf（M2：`_try_int("inf")` 之前 OverflowError、NaN 坐标会写入缓存）；`_write_cache` 改原子写（temp+os.replace，M1：防中断写坏缓存被 `_load_cache` 静默当空）；新增回归测试 `test_geocoder_pool_prefers_highest_scoring_provider`（test_geocode_destinations.py L477+，高分者胜断言）。验证：HEAD=f7d04ae50，工作树 0 改动；`reverse=True` 在提交态 L574；`math.isfinite` 在 L544；`_write_cache` 原子写 L123-130；测试存在；MED-2 复现性（tour_1/254/2978 → 贺州姑婆山 poi/osm exact）在提交态数据保留。用户 convlog L1834「继续，发布了喊我」：主 agent 采纳为继续精度修复循环、发布后通知（G9）。
- Decision: ①恢复 `_merge_geocoder_results` 的高分者胜排序（reverse=True）并删除重复 winner 行，用回归测试锁定该不变量；②`_try_float` 拒绝非有限值（NaN/inf）、`_try_int` 捕获 OverflowError——非法坐标跳过而非写入缓存；③`_write_cache` 原子写（temp+os.replace）；④采纳用户「继续，发布了喊我」（精度修复继续，发布后通知）。
- Rationale: reviewer 实测证明排序翻转会让最低分 provider 胜出，直接复现 D-005 已消灭的错 pin 类别（柏林→柏林镇），是发布级回归；原子写与有限值守卫是数据管道健壮性底线（M1/M2 均被 reviewer 列为可操作项）；高分者胜测试补上了此前"分数相同测不出胜者选择"的断言盲区。
- Alternatives: ①整体回滚 7f05d9584（否：其防御守卫本身有价值，保留守卫+修复 reverse 是更小 diff）；②原子写改用文件锁（否：单进程管道，temp+os.replace 已足够）；③高分者胜不变量不测试（否：正因此前无测试，排序翻转才未被当场拦截）
- Confidence: high（HEAD 提交态 reverse=True/原子写/isfinite/回归测试/贺州数据全部独立实测）
- Date: 2026-08-11T17:36:47.745111+00:00

## D-024: 肇庆精度修复轮：8 个贵州错钉归位 + 景区 POI 独立行 + POI_OVER_CITY_PRIORITY 窄白名单 + 星湖复合词 alias [Accepted]

- Context: 用户 convlog L1956「肇庆 城市范围·模糊定位·6条线路…精度还有空间」、L1966「另外相同地点的坐标为什么没全部合并」、L1990「反正不停的优化精度，直到审计没意见就行了」。实测根因①title 肇庆不在 EXPLICIT_TITLE_DESTINATION_NAMES → dest=贵州 的 tour 丢失 named 候选 → fallback 贵州贵阳（26.8154）——8 个肇庆 tour 错钉贵州（含「相同地点坐标没合并」现象的直接来源）；根因②景区 POI（七星岩/紫云谷/蓝钟/鼎湖山）是肇庆 city 行 alias → mining 永远钉 city 级。修复（提交 28c197698，独立核实 diff）：肇庆加入 EXPLICIT_TITLE_DESTINATION_NAMES（L702 实测）；POI 拆独立 ALIAS_ROWS 行（七星岩 23.0805699/112.4727006、紫云谷 23.1267137/112.585637、蓝钟 24.0776019/111.9556435、鼎湖山 23.1836/112.5455）；新增 POI_OVER_CITY_PRIORITY={七星岩,星湖,紫云谷,蓝钟,鼎湖山} 窄白名单（注释明确：不用宽 EXPLICIT_POI_NAMES，因含沙巴/美奈/棉花堡等独立目的地，实测国际 tour 误伤 60+：纽约→普吉岛、伊斯坦布尔→棉花堡、万象→拈花湾）；星湖 alias 限复合词（星湖湿地/星湖绿道/星湖大酒店——裸「星湖」误匹配内蒙古「七星湖」，tour_393 七星大漠曾钉广东七星岩）；NAMED_PLACE_COORDINATES 补 蓝钟温泉/蓝钟森林温泉酒店/肇庆怀集蓝钟森林温泉酒店/七星岩星湖/肇庆星湖大酒店（OSM 验证 23.0571359）。提交态实测：23 个肇庆标题 tour 全部解析到 肇庆/七星岩/鼎湖山/蓝钟（无贵州残留）；tour_3696→鼎湖山宝鼎园 poi/osm（23.1797）、tour_278→蓝钟温泉 poi/catalog、tour_1411→肇庆七星岩 poi/geocoder；tour_393→纳林湖（回归保留）；49 测试全过；已部署（28c197698）+ 线上 E2E 662/662。遗留：28c197698 未更新 audit/map-precision-*.json（提交态度量仍是 D-014 时代的 659/666/0.381/0.374），主 agent 声称的「0.374→0.382」无入库佐证。
- Decision: 肇庆精度采用「title 目的地权威化（肇庆入 EXPLICIT_TITLE_DESTINATION_NAMES）+ 景区 POI 独立 ALIAS_ROWS 行（缓存验证坐标）+ POI_OVER_CITY_PRIORITY 窄白名单（策展景区 POI 优先于父城市）+ 星湖复合词 alias」组合修复；采纳用户「不停优化精度直到审计没意见」为持续循环要求。
- Rationale: 8 个贵州错钉是确定性缺陷（title 证据被丢弃 → fallback 错误省份），修复直接消除用户可见的「相同地点坐标没合并」；POI 独立行使 mining 能落到 POI 级（鼎湖山宝鼎园 OSM 精确点）；白名单窄化避免宽 EXPLICIT_POI_NAMES 的国际误伤（实测已发生 60+ 处）；星湖复合词防异地湖名子串误伤（内蒙古七星湖案例实证）。
- Alternatives: ①宽 EXPLICIT_POI_NAMES 优先（否决：实测误伤 60+ 国际 tour）；②裸「星湖」alias 保留（否决：误伤 tour_393）；③数据层手工改 8 tour（否决：不解决 mining 根因、不可扩展）
- Confidence: high（提交 diff、提交态数据 23 tour 解析、tour_393 回归、49 测试、部署+E2E 662/662 全部独立实测；遗留度量未更新已另记）
- Date: 2026-08-12T02:30:00Z

## D-025: 双地图控件收敛：App.tsx 移除 Hero 内嵌 MapView（双实例→单实例），在途未提交 [Accepted]

- Context: 用户 convlog L1942「为什么有两个地图控件」；主 agent 调查（L1944-1954）：App.tsx L43-44 渲染两个 MapView（Hero 内 embedded + 主区独立），各自创建 zoom 控件；判定为预存在结构（此前 E2E 用 .first() 兼容双实例，L1332/1336）。工作树实测（未提交）：App.tsx 已删除 Hero 的 embedded MapView 传参（`git diff HEAD` 实测 `- map={<MapView embedded .../>}`），保留主区独立 MapView——双实例→单实例收敛在途。同工作树未提交改动另含 geo_catalog.py 追加 天露山/象窝（云浮新兴 POI，22.4889055/112.2244895、22.5633143/112.290645）至 PLACE_ROWS/EXPLICIT_POI_NAMES/POI_OVER_CITY_PRIORITY（D-015/D-024 同类的广东 POI 策展延伸，与地图控件收敛属同一在途轮但不同主题）。
- Decision: 收敛双地图控件：移除 Hero 内嵌 MapView，保留主区独立实例（用户可见 zoom 控件 2→1）。
- Rationale: 用户明确质疑双控件；两实例功能重叠（同一 expanded 状态、各自 zoom 控件），embedded 在 Hero 内与主区重复；单实例化同时简化 E2E 定位器（.first() 兼容可去）。
- Alternatives: ①保留双实例（否：用户明确质疑）；②只改 E2E 不触代码（否：治标不治本）
- Confidence: medium（决策已执行但未提交、未验证 E2E 仍通过——在途）
- Date: 2026-08-12T02:30:00Z

## D-026: D-026/027：地图单实例定案 + POI 精度机制收敛（NAMED 策展 + 修辞/continuation guard + purge） [Accepted]
- Context: D-025 记录「移除 Hero 内嵌 MapView」——用户 L2444 纠正「你把错误的地图保留了下来，正确的地图删掉了」，最终 f0cfb99db 保留 Hero embedded（单实例）。D-025 后 10+ 提交（羚羊峡 704a2cae2、姑婆山/白水寨 86ccca37d、宽排序回退 7e4c4dd32、甘青 alias faa744d46、修辞/continuation/purge 7c432d295、真实形态测试 b868f9492）零入链。审计循环识别：chain 滞后产物一整个修复轮；本轮机制：DOMESTIC_POI_INDEX 元数据索引+NAMED 策展坐标、宽 POI 排序被撤销（D-024 否决重演）、修辞 guard（不是/齐名/仿造/身处）、POI_CONTINUATIONS（羚羊峡谷/胡志明亭）、五台山 catalog 行、phantom-anchor purge。
- Decision: D-026：地图控件最终态 = Hero embedded 单实例（D-025 反向，supersede）；D-027：POI 精度机制收敛为「DOMESTIC_POI_INDEX 元数据 + NAMED_PLACE_COORDINATES 策展坐标（D-024 先例）+ 候选 first-materializable + 修辞/continuation guard + phantom-anchor purge（fix 脚本，D-016 顺序）」，明确否决宽 suffix 排序（D-024 否决项重演，已撤销）。
- Rationale: D-025 与用户纠正后产物相反必须 supersede。机制收敛记录：宽排序两次引入两次被否决（86ccca37d/0dc04c639），NAMED 策展先例（D-024）证明可靠；修辞 guard 解决 detail 营销文案误当目的地（D-019 族）；purge 固化到 fix 脚本使修复持久（否则每次 rebuild 自传播）。
- Confidence: high
- Supersedes: D-025
- Date: 2026-08-12T00:02:16.357Z

## D-028: CONTEXTUAL_BRANDS 与 POI 索引门控解耦：brand_guard_domestic（province==name）vs poi_index_enabled（not-international） [Accepted]

- Context: 704a2cae2 为修羚羊峡碰撞把 domestic_route 语义从「dest 是真实国内省份（province==name）」放宽为「not (destination_international or title_international)」；但该变量同时门控 CONTEXTUAL_BRANDS（巴黎铁塔→巴黎 品牌抑制，D-022）。对 dest=其他 且标题无可识别国家（find_region=None）的真实国际线路，放宽后 domestic_route=True → 品牌抑制生效 → 真埃菲尔铁塔的「巴黎」mention 被抑制：tour_4716（【颂·精品小团】尊享法瑞意12天，标题含「巴黎铁塔晚餐+卢浮宫+凡尔赛宫」）在 28c197698/965ccab26 均为 巴黎/法国，704a2cae2 后变 佛罗伦萨/意大利（标题中佛罗伦萨 T 骨牛扒餐是次要城市）；同型 tour_4717（标题另有独立「巴黎」mention）仍=巴黎——同型线路解析不一致，直接违反 D-022 显式不变量「真巴黎 tour_4716 保留」。修复 0dc04c639（fix(geo): split domestic_route gates - brand guard vs POI index）：拆两个独立门控——brand_guard_domestic（destination_region.province==name，D-022 原语义，仅门控 CONTEXTUAL_BRANDS）+ poi_index_enabled（not-international，仅门控 DOMESTIC_POI_INDEX）。独立实测（HEAD=b868f9492）：geo_catalog.py L1706-1715 注释与两门控计算在位；tour_4716/4717 → 巴黎 48.8566；反例 dest=广东 + 澳门巴黎铁塔 → 澳门（品牌抑制仍生效）。
- Decision: 品牌抑制（CONTEXTUAL_BRANDS）与景区 POI 索引（DOMESTIC_POI_INDEX）使用两个独立的门控变量，不复用单一 domestic_route 语义：品牌抑制保持 D-022 的 province==name 窄语义，POI 索引用 not-international 宽语义。任何后续「放宽国内判定」改动必须先检查是否同时翻转品牌抑制。
- Rationale: 单一变量承载两个不同语义是本次回归的机制根源（一个语义变更同时翻转两个不相关行为）；D-022 的不变量（真巴黎保留）是审计明确记录的行为契约；拆分后两语义可独立演进（如 POI 索引可安全放宽而品牌抑制不受影响）。
- Alternatives: ①回滚 704a2cae2 的放宽（否：羚羊峡修复依赖宽语义）；②CONTEXTUAL_BRANDS 整体移除（否：澳门巴黎铁塔类误 pin 复发）；③品牌抑制改用标题关键词判定（否：无确定性信号，D-019 已证）
- Confidence: high（两门控代码、tour_4716/4717 数据、澳门反例全部独立实测）
- Date: 2026-08-12T08:05:38+0800

## D-029: 误匹配守卫终态：单向 title-region 守卫 + 无锚定拒绝 + 白名单国家集 + 修辞/continuation 扩展 + preserve 去自证循环 [Accepted]

- Context: 系列实测错误案例驱动（均见 convlog）：①东北 tour 营销文案「不是巴黎卢浮宫去不起」「北方的西湖」（镜泊湖比喻）被 mining 当地名 → tour_14 东北 tour 钉 杭州西湖（0dc04c639 引入，preserve 自证循环使其每次重建存活）；②tour_556 加拿大 title + 新丰 detail（模板污染）→ 加拿大 tour 钉新丰；③「甘青」倒序不在 region 表 → find_region=None → 无锚定拒绝误伤真实青海甘肃行程（tour_160 青海 tour 一度 unmapped）；④无锚定拒绝误拒国际 detail（tour_4609/4610 四王群岛 tour 的巴厘岛）；⑤「与纽约第五大道齐名/仿造巴黎街区样式/身处法国巴黎香榭丽舍」修辞未拦 → 新加坡马来西亚 tour_4372/4373 → 纽约、潮汕 tour_1434 → 巴黎；⑥「胡志明亭」（东兴中越界碑纪念亭）误命中胡志明市（tour_2900）；⑦「五台山」子串碰撞「台山」→ 山西 tour_1264/3436 类钉广东台山；⑧tour_3673 龙门云顶酒店幻影锚定（陈旧 destinationCity=龙门 覆盖 miner 正确的盐洲岛，每次重建自传播）。修复（7e4c4dd32/faa744d46/7c432d295，HEAD 独立实测）：单向守卫——仅 title 解析出 INTERNATIONAL_COUNTRIES 白名单国家（L743，青甘/华东/广东等国内大区/缩写永不触发）才拒绝国内 detail 提及（L1799）；移除「的」拒绝（误伤「愉快的重庆之行」），保留「不是」否定；无锚定拒绝（title 无 region 锚定 → detail 不可验证 → 拒绝）仅限中国 place；甘青 alias 补入 region 表（L430）；修辞 guard 扩展 后置「与X齐名/并称/媲美/仿造/仿制」+ 前置「身处/置身/宛如/仿佛/犹如/好像/仿若」（L1365-1385）；POI_CONTINUATIONS 覆盖 ALIAS 城市（胡志明亭，L1423-1424）；五台山 catalog 长 alias 行（38.983/113.573，L152-154）；_preserve_existing_precise_geo 不再把 preserve 自保的 sourceCandidates 当 evidence（去自证循环）；幻影锚定 purge 固化 fix 脚本（L222-230）。「宁缺毋滥」原则确立：不可验证时 unmapped 优于错 pin（tour_2900/1434 类）。
- Decision: 误匹配守卫采用「单向 title-region 守卫（INTERNATIONAL_COUNTRIES 白名单）+ 无锚定拒绝（仅限中国 place）+ 修辞 token 集（前置/后置）+ POI_CONTINUATIONS 覆盖 ALIAS 城市 + 长 alias catalog 行防子串 + preserve 去自证循环 + 幻影锚定 purge 固化」组合；明确否决黑名单方式（青甘缩写遗漏暴露其不完备，白名单更稳）。
- Rationale: 每个子修复都有确定性错误案例与验证（13/13 错 pin 修正：tour_4372/4373→新加坡、tour_1434/2900→unmapped、山西 tour→五台山）；白名单单向守卫不误伤国内大区（青甘/华东/广东 tour 真实行程保留）；修辞 token 集覆盖实测失败模式（齐名/仿造/身处）；preserve 自证循环是「每次重建自传播」类缺陷的机制根因；unmapped 诚实化符合 D-006 不声称精度原则。
- Alternatives: ①黑名单守卫（tour_157 敦煌→青甘 暴露黑名单不完备，改白名单）；②保留「的」拒绝（误伤「愉快的重庆之行」类合法表达）；③数据层手工修每个错 pin（否决：不可扩展，每个营销文案新形态都要人工补）
- Confidence: high（守卫代码、13 tour 修复数据、unmapped 结果、purge 规则全部独立实测）
- Date: 2026-08-12T08:05:38+0800

## D-030: 回归测试纪律：真实 tour 形态 + poi 级断言锁定（BLOCKER-C2 教训） [Accepted]

- Context: BLOCKER-C2（faa744d46 修复轮审计）指出：synthetic 测试放行回归——仙本那测试原断言 `in ("poi","city")`（允许 city 级降级）、羚羊峡测试只走 domestic_route 门（守卫本身未覆盖）；synthetic 测试正是 0dc04c639/86ccca37d 排序回归未被当场拦截的原因之一。修复 b868f9492（fix(geo): rhetoric-before guard + alias continuation guard + real-shape BLOCKER-C tests）独立实测（test_rebuild_geo_data.py）：test_rebuild_us_antelope_tour_keeps_poi_level_not_city 用真实 tour_4814 标题形态 + itinerary detail mention（自由女神在 detail，与真实记录一致）→ 断言 country=美国 + level=poi + lat=40.7128；test_rebuild_semporna_poi_not_degraded_by_hotel_label 用真实 tour_4464/4475 标题形态 → 断言 level=poi（4.4818/118.6112）；test_rebuild_keeps_guposhan_poi_on_hezhou_tours 覆盖伴山温泉/森林公园两种标题形态断言 lat/lon/level=poi。全部 55 测试 PASS。
- Decision: 回归测试纪律：新守卫/机制测试必须用真实 tour 标题与行程形态（含 detail 层 mention），断言 level=poi + 具体坐标；禁止 synthetic 弱断言（如 `in ("poi","city")`）；与 D-017 的「规则每改必测 + CI preflight」组合。
- Rationale: synthetic 测试两次放行同族排序回归（仙本那斗湖、POI_CLASS 降级）；真实形态测试同时覆盖 miner 入口与守卫出口，删守卫/改门控即挂；坐标级断言锁定精度不变量本身（D-005 根因①的验收形态）。
- Alternatives: ①仅补 synthetic 守卫测试（否：BLOCKER-C2 已证其放行 city 降级）；②不加测试只修数据（否：回归无法拦截）
- Confidence: high（三测试的标题形态、断言值、55 测试全过均独立实测）
- Date: 2026-08-12T08:05:38+0800

## D-031: mine 每轮重置 geoResolution.mining（防 ghost re-anchor） [Accepted]

- Context: tour_4791（挪威极地邮轮）每轮 rebuild 后仍钉威海/山东——title/detail 均无「威海」文本，但 geoResolution.mining.candidateLabels 残留旧轮威海 → selection 复用 → 错 pin 每轮复活。修复轮 audit（HEAD 277e10c67）实测：mine_destination_place 复用传入 resolution 的 mining（旧轮残留），pop 掉 candidateLabels/rejectedLabels/reasons/sourceCandidates 后重新 mine，威海（title「挪威海域」内 威海 substring 碰撞，见 D-034）与 detail 转机日 mention 均被拒 → unmapped。
- Decision: mine_destination_place 开头无条件重置 mining 候选字段（candidateLabels/rejectedLabels/reasons/sourceCandidates），每次 rebuild 从零重新评估；配合 D-016 fix-before-rebuild（purge 清 geo 字段）形成「purge 清锚点 + mine 清证据」双保险。
- Rationale: 旧 mining 是上一轮守卫的产物，守卫改版后旧候选失去合法性；保留即 sticky pin 循环（audit 第四次复现的 威海 ghost）。purge 只清 destination 输出字段，mining 是 selection 的输入证据，两者都要清。
- Alternatives: ①purge 名单持续扩张（否：TRANSIT_WRONG_PIN_TOURS 60+ tour 无退出条件，M1 已指出）；②只清 destinationCity（否：威海 ghost 证明 candidateLabels 才是 re-anchor 源）
- Confidence: high（tour_4791 修复前后数据独立实测；55 测试全过）
- Date: 2026-08-12

## D-032: cross-country guard——detail 外国提及须命中 title 国家集合 [Accepted]

- Context: A2 残余（tour_418→伊斯坦布尔/土耳其、tour_512→纽约、tour_822→巴黎、tour_764→赫尔辛基）均为跨洲 detail 提及：南美五国 tour 的 detail 出现 伊斯坦布尔（土耳其），加拿大 tour 出现 纽约（美国）——转机枢纽/修辞引用被误当目的地。auditor 处方③（D-029 宁缺毋滥）+ reviewer 实测：伊斯坦布尔 day24 纯转机（机上餐食/夜宿飞机，无游览语境），辩护不成立。修复（277e10c67）：candidate 循环加 title-country-conflict——detail（text_index>0）外国 mention 的 country 不在 title 的 INTERNATIONAL_COUNTRIES 命中集合 → 拒。集合语义（非单值）：新马 tour（title 新加坡+马来西亚）两个国家都锚定，detail 新加坡/马来西亚 都留；南美五国 tour 只锚定 title 五国，伊斯坦布尔（土耳其）拒。游览语境放行先加后撤（罗马 on 南意 tour 误放行 巴黎 on 南美 tour 修辞——巴黎入侵回归实测），终态：无条件拒。
- Decision: 国际 tour 的 detail 外国提及，country 不在 title 国际国家集合 → 拒（宁缺毋滥）。title 国家集合 = INTERNATIONAL_COUNTRIES 中 title 子串命中的所有国家。游览语境不作为放行条件。
- Rationale: 真实多国线 title 必列全部国家（巴西+秘鲁+智利+阿根廷+乌拉圭）；title 未列的国家 detail 提及 = 转机/修辞（伊斯坦布尔 on 南美、巴黎 on 南美、赫尔辛基 on 冰岛）。游览语境放行误伤（巴黎 on 南美 tour 的游览日描述 = 营销修辞）。
- Alternatives: ①游览语境硬规则（否：巴黎入侵实测——南美 tour 游览日描述含巴黎）；②token 白名单（否：reviewer 证实不完备）；③purge 清单（否：写死违背 L2120 机制化）
- Confidence: high（5 个 A2 残余 tour 修复 + 巴黎入侵回归 均独立实测）
- Date: 2026-08-12

## D-033: 国际 title 永不回退国内 province region 兜底 [Accepted]

- Context: tour_929（【西欧】南意+西西里+马耳他15天，dest_input=广东）→ 广东/中国——find_region(title) 未匹配（REGION_ROWS 无「南意/西西里/马耳他」直接行）→ title_international_flag=False → destination_region（广东）region 兜底 pin 广东。tour_4791（挪威邮轮，dest_input=山东 脏数据）同类。修复（277e10c67）：title_international_flag 用 title_has_international 子串扫描（马耳他 in title ✓ → True），国际 title 时 region_place=None → unmapped。与 mine 层 title_country_is_international（D-032 同子串判定）一致。
- Decision: 国际 title（INTERNATIONAL_COUNTRIES 子串命中）→ 国内 province region 兜底禁用（D-007 占位语义扩展到所有国际 title，不再依赖 find_region 命中）。
- Rationale: destination 字段常复制出发省（广东/山东），国际 tour 时它是占位非目的地；find_region 命中率低（南意/西西里 无行），子串扫描是唯一可靠判定。
- Alternatives: ①REGION_ROWS 补 马耳他/南意 等行（否：治标，每新线补一行）；②dest 脏数据修复（否：数据源不可控）
- Confidence: high（tour_929/4791 修复前后独立实测）
- Date: 2026-08-12

## D-034: 「威海」continuation 域（挪威海域 substring 碰撞） [Accepted]

- Context: tour_4791 挪威邮轮 title「挪威海域17天」→ 威海 mention——「威海」两字在「挪威海域」（挪+威海+域）中相邻，catalog alias「威海」substring 匹配 → title mention（text_index=0，title-region-conflict 不触发）→ 威海（NAMED 坐标）胜出 → 错 pin 山东。dbg 实测：T0 title 有 威海 mention（country=中国，dep=False）。修复（277e10c67）：POI_CONTINUATIONS 加 威海→("域",)——「威海」后跟「域」= 海域 拒；真实威海（tour_1200 惠游山东大连）后无「域」→ 留。
- Decision: POI_CONTINUATIONS 扩展 威海→域（海域碰撞）；continuation 检查从 tail-only 改 前后窗口（斯利马→利马 before「斯」也拒，D-019 模式统一）。
- Rationale: substring 匹配天然误伤跨语言相邻字符（威海 in 海域）；D-019 continuation 模式已验证（羚羊峡→谷、胡志明→亭）。
- Alternatives: ①威海撤出 catalog（否：tour_1200 真实威海需要）；②单词边界检测（否：中文无空格边界）
- Confidence: high（tour_4791→unmapped、tour_1200→威海 独立实测）
- Date: 2026-08-12

## D-035: 直飞/转机/经停 title 内也拒 + 无需否定 + in_title 豁免 tail 修辞 [Accepted]

- Context: tour_764（冰岛 title「上海直飞赫尔辛基」）→ 赫尔辛基——直飞 in title（text0）→ in_title 豁免 before 修辞（B2 标题豁免）→ 赫尔辛基留。reviewer B2 实测：tail 修辞 token（航班/机场/转机/歌剧院/大学/学院/美誉）作用于标题毁 50 个合法 pin（悉尼歌剧院入内→歌剧院、南航正点航班广州往返→航班距沙巴 30 字符内、新加坡国立大学→大学）。修复（277e10c67）：①before 直飞/转机/经停 无条件拒（含 title）——航班终点非目的地；②「无需转机/不用直飞」取负向放行（仙本那 tour）；③in_title 豁免 tail 修辞 token（沙巴/珠海 恢复）；④tail 集移除 大学/歌剧院/学院（悉尼歌剧院真实）。
- Decision: 航班终点 token（直飞/转机/经停）在任何文本位置拒（否定词 无需/不用 除外）；比较/修辞 tail token 只对 detail 生效（title 是目的地声明，含真实城市）；大学/歌剧院/学院 非修辞移除。
- Rationale: title 里「直飞X」的 X 是航班终点（转机/联运信息）非目的地；「X歌剧院/大学」的 X 是真实站点（悉尼歌剧院）；in_title 豁免让标题真实目的地（沙巴）不被营销模板（南航正点航班）误杀。
- Alternatives: ①token 白名单（否：reviewer 证实不完备）；②标题整体跳过修辞（否：直飞赫尔辛基 证明 before 航班 token 仍需拒）
- Confidence: high（tour_764→unmapped、tour_4877→悉尼、tour_4452→沙巴、tour_4237→仙本那 独立实测）
- Date: 2026-08-12

## D-036: 酒店 POI 统一入 POI 路径——禁止入 PLACE_ROWS 城市表 [Accepted]

- Context: 肇庆喜来登首轮修复放入 PLACE_ROWS（城市级表）→ 标题「肇庆喜来登酒店」label 无 NAMED 坐标 → coarse-parent-city-fallback 产出「肇庆喜来登范围（模糊定位）」city 级占位（tour_3692 实测：紫云谷 poi/exact → 喜来登 city/approximate 精度回退）。审计 BLOCKER-1/2 拦截。修复（2cb9fa1c7）：喜来登移出 PLACE_ROWS → NAMED_PLACE_COORDINATES（含 肇庆喜来登酒店 别名双 key，同坐标）+ EXPLICIT_POI_NAMES + DOMESTIC_POI_INDEX——完全同贞山/禅泉先例。重建后 tour_19/142/3692 全 poi/exact，geo-places city 级喜来登残留 0。
- Decision: 酒店/景区 POI 一律走 POI 路径（NAMED + EXPLICIT + DOMESTIC_POI_INDEX），禁止放入 PLACE_ROWS 城市表；PLACE_ROWS 只放行政城市/县。
- Rationale: city 级行让 coarse fallback 把 POI 当城市兜底（模糊定位标签）；POI 路径保证 materialize 走 NAMED 坐标 → poi/exact。
- Alternatives: ①PLACE_ROWS 行 + NAMED 双注册（否：city 级行仍触发 fallback 路径）；②只改 label 拼接（否：治标，任何标题含 POI 名且 geocoder 失败都落 city）
- Confidence: high（tour_19/142/3692 + geo-places 残留 独立实测，审计 passed）
- Date: 2026-08-12

## D-037: 全国城市 catalog 补全——省外 tour 错 pin 的根因修复 [Accepted]

- Context: tour_2877（【品鉴黔川】贵州遵义、赤水、宜宾…合江门…）→ 江门/广东——catalog 只有广东城市 + 少数省外，贵州 tour 的唯一 mention 是「合江门」（宜宾景点）substring 撞的江门——真实目的地 遵义/赤水/宜宾 无 catalog 行 → 挖掘失败。修复（35a156d9a）：数据驱动（title 省份名后 token 提取）补 69 个全国高频目的地城市（贵州/四川/云南/陕西/甘肃/新疆/湖南/湖北/广西/福建/浙江/江苏/山东/河南/安徽/江西/东北/海南/青海/西藏/河北/宁夏/山西），坐标用常识级地级市/州府中心。重建后 tour_2877 → 遵义（title「贵州遵义」first mention 胜出），合江门 substring 不再致错。
- Decision: catalog 按数据驱动高频目的地持续补全省外城市（title 省份后 token 提取），坐标用稳定常识级地级市中心（D-024 验证源要求对省外地级市放宽为常识级）。
- Rationale: substring 碰撞（合江门→江门）是 catalog 缺真实目的地时的唯一候选——补全真实目的地后 title 明确 mention 胜出，碰撞不再致错。这是数据基础设施，非模式匹配写死（用户 L2120 要求）。
- Alternatives: ①江门 continuation guard（否：模式写死，用户否决）；②REGION 级兜底（否：省级 pin 精度不够）
- Confidence: high（tour_2877→遵义 实测，E2E places 473→485）
- Date: 2026-08-12

## D-038: 双目的地「X、Y」departure 规则需 Y 后出发 token [Accepted]

- Context: tour_3637（【尚·美食】江门、佛山2天）→ 佛山、tour_3674（珠海江门联游2天）→ 江门——_is_departure_mention 的「X、Y」规则（L1815-1821）把双目的地第一城误判为出发地（DEPARTURE_CITY_NAMES + 紧邻分隔符 + 后随 catalog city → return True）。修复（2cb9fa1c7）：要求 Y（next mention）后跟显式出发 token（起止/出发/往返/双飞/起飞/返程/回程/集散）才判 X 出发——「江门、佛山2天」Y 后是「2天」→ 不判 → 江门保留 → first 胜出。
- Decision: 「X、Y」模式的出发判定必须由 Y 后的出发 token 证实；行程天数（N天）不是出发证据。
- Rationale: 「广州、深圳出发」是出发列表（Y 后出发 token），「江门、佛山2天」是双目的地（Y 后天数）——两者形态相同但语义不同，只有 Y 后 token 能区分。
- Alternatives: ①整条规则移除（否：会漏真实出发列表「广州、深圳出发」）；②X、Y 全保留（否：双目的地第一城被跳）
- Confidence: high（tour_3637→江门、tour_3674→珠海 独立实测）
- Date: 2026-08-12

## D-039: 转跳 URL 解析顺序定案——稳定链接 > bookingUrl > keyword（supersede 560dfc5fb 的 bookingUrl-first） [Accepted]

- Context: 560dfc5fb 修「转跳都是错的」把 bookingUrl 提到 printUrl 前（地图卡片 summary 无 meta.sourceAttributes → 旧序全降级 keyword 搜索页），但副作用是详情弹窗的稳定 tourname 链接被废（groupno bookingUrl 是旋转链接，0c771a658 已实测）；test_source_detail_url.mjs 仍断言旧行为（printUrl 优先）→ npm run test:source-detail-url 失败且 deploy.yml 不跑该测试（静默漂移，本轮实测抓出）。TourDetailModal 源码 `const tour = resolvedTour ?? summaryTour`（详情加载成功传完整 tour 含 sourceAttributes，卡片 summary 无）→ printUrl 分支非死代码。修复（65c60ceb7）：printUrl/tournameno → bookingUrl → keyword；测试断言对齐（测试 3/5 从 keyword 期望改为 staleGroupUrl，新增 keyword 兜底用例：bookingUrl 无效时）。
- Decision: 假日通稳定链接（printUrl/tournameno）最优先（详情弹窗场景，groupno 旋转），有效 http bookingUrl 次之（地图卡片场景，绝不静默降级 keyword 搜索页），keyword 搜索仅当两者都不可用时兜底；测试断言与此顺序对齐。
- Rationale: 两个历史提交的意图可合并：0c771a658「稳定链接优先」（详情页有 sourceAttributes 时）与 560dfc5fb「bookingUrl 优先于 keyword」（地图卡片无 sourceAttributes 时）并不冲突——按 sourceAttributes 可用性自然分层，唯一正确顺序即 稳定链接 → bookingUrl → keyword。
- Alternatives: ①保持 560dfc5fb 的 bookingUrl-first（否：详情弹窗退化到旋转/过期 groupno 链接）；②保持 0c771a658 的 printUrl-first（否：地图卡片全降级 keyword 搜索页——用户报障根因）；③按调用点分别处理（否：同一函数分层即可，无需两套逻辑）
- Confidence: high（test:source-detail-url 修复后通过；deploy guards 步骤实跑；线上部署验证）
- Date: 2026-08-14

## D-040: geo 挖掘回归修复——重复 alias 拼接、序列首城出发语义、英伦四国识别、武隆/仙女山拆行 [Accepted]

- Context: 全量 pytest 独立实测 5 failed（7 月初写入，f1bb159f7/35a156d9a 演进致断言过期，CI preflight 只跑 5 个脚本不覆盖）；真实数据影响量化：66 个 tour 重复 alias（巴厘岛巴厘/禾木村禾木，_place_label canonical+alias 拼接未处理 alias⊂canonical）、41 个英爱 tour 国际识别缺口（title 无「英国」字样 → title_international_flag=False → 出发省 region 兜底 pin 广东，tour_850/856 曾广东/空）、tour_1815（<必发><遇见巴渝>广州武隆仙女山、816核工厂、武陵山大裂谷双动/双飞5天 → 广州被当目的地——「双动」不在出发 token 表且 walk 断在顿号实体）、tour_1313 武隆 pin 重庆市中心（武隆/仙女山是重庆行 alias，place.name=重庆 → 出发集合按 name 匹配误伤 + 无独立坐标）。修复（65c60ceb7）：①_place_label alias⊂canonical → 直接用 canonical；②线路前缀出发判定（start==0 + 紧跟线路 + country==中国，防「欧洲线路」误判）+ is_run_leader（序列首城才是出发）+ run-tail walk 到序列末端 + 40 字符 re.search 出发 token（双动/双卧入表）+ round_trip_target 豁免（D-035 直飞X往返的 X 是往返目的地）；③INTERNATIONAL_COUNTRIES 补英格兰/苏格兰/威尔士/爱尔兰；④武隆(29.3254/107.7601)/仙女山(29.468/107.737) 从重庆行拆独立 PLACE_ROWS；⑤title_departure_names 收集 alias+name、拒绝判断改用 alias（重庆下属目的地不被出发误伤）。重建后独立实测：重复 alias 66→0、英爱 0 pin 广东、tour_1313→武隆/重庆出发、tour_1815→非广州。
- Decision: 出发判定语义定案：连续城市序列的**首城**才是出发（is_run_leader + 序列末端出发 token 证实）；「X线路」前缀仅国内城市是出发；alias⊂canonical 禁止拼接；英伦四国入国际白名单；重庆下属县/景区拆独立 catalog 行（D-037 alias 布局的修正）。
- Rationale: 每项修复都有确定性数据证据（66/41 tour 计数、tour_1815/1313 实测）；D-037 全国城市补全使重庆可被提及后，出发判定必须能区分「重庆线路」的重庆（出发）与武隆/仙女山（目的地）——按 name 匹配必然误伤 alias 下属目的地；run-tail walk 解决 token 在序列末端（武隆仙女山双动5天）而非第二城后的形态。
- Alternatives: ①测试断言回退到旧值（否：产品 bug 真实存在且用户可见）；②宽 departure 判定（序列所有城都判出发——实测武隆/仙女山全拒 no-candidate）；③武隆/仙女山留在重庆行仅改 label（否：无独立坐标，pin 仍落重庆市中心）
- Confidence: high（全量 pytest 113 passed；重建后 66→0/0 pin 广东/tour_1313→武隆/tour_1815 修复均独立实测；线上 tour_1313/tour_308 验证）
- Date: 2026-08-14

## D-041: CI 测试门禁扩展——schema/转跳/运行时测试入部署 preflight（防静默漂移） [Accepted]

- Context: 本轮两处静默漂移根因：①test:source-detail-url 失败但 deploy.yml 原只有 audit:deploy-workflow 不跑测试（560dfc5fb 声称「57 tests pass」未覆盖）；②update-data.yml preflight 只跑 5 个 python 脚本，test_geo_schema_guard.py（BLOCKER-4 新建）未挂 CI；test_geo_schema_guard.py 原只有 rebuild 直接路径 + 全量扫描两用例，缺 unmapped 路径（D-031 的第三返回路径）。修复（65c60ceb7）：package.json 加 test:geo-schema-guard script；update-data.yml preflight 加 python scripts/test_geo_schema_guard.py；deploy.yml 新增「Data & deeplink guards」步骤（test:source-detail-url + test:runtime-tour-schemas + python scripts/test_geo_schema_guard.py，位于 npm ci 后、Build 前）；test_geo_schema_guard.py 补 test_unmapped_path_leaves_mining_fields_as_arrays（无 catalog 匹配 tour 重建后 mining 四数组仍为 list）。部署验证：deploy run 31806247786 success（3m9s，含 guards 步骤实跑）。
- Decision: 数据/转跳相关测试纳入部署门禁（deploy.yml guards 步骤）与数据管道 preflight（update-data.yml）；schema 守卫测试显式覆盖 unmapped 路径；CI 结构上消除「测试失败但 CI 不跑」的静默漂移通道。
- Rationale: 静默漂移机制 = 测试失败 × CI 盲区；本轮 5 个历史失败测试与转跳测试漂移都是该机制的产物；部署门禁使任何数据/转跳回归在发布前拦截（数据是部署产物，schema 守卫必须在 Build 前）；unmapped 是 mine_destination_place 的三种返回路径之一（direct/region/unmapped），前两者已有覆盖，审计 BLOCKER-4 明确要求补全。
- Alternatives: ①只修代码不挂 CI（否：本轮失败测试即 CI 盲区产物，不挂则复发）；②测试只挂 update-data preflight（否：deploy 是发布闸门，schema 破坏必须阻断发布而非只阻断数据管道）；③guards 步骤并入 Build（否：Build 失败晚于测试失败，定位成本高）
- Confidence: high（deploy run 31806247786 success 实跑 guards；pytest 113 passed 独立复跑；三个 workflow/package.json 挂载点独立 grep 核实）
- Date: 2026-08-14

## D-042: crawler/URL-gate 政策轮次补记 + update-data.yml preflight 修复 [Accepted]

- Context: reviewer 第三轮发现 65c60ceb7 编辑 update-data.yml 时丢失 `run: |`（步骤只有 name 无 run/uses）→ preflight 步骤失效、数据管道门禁整体停摆（D-041 声称的 guard 为死配置）；契约测试 test_update_data_workflow.mjs:21 断言单引号 cron 与文件双引号漂移（d27cb9f90 窗口外改）→ audit:update-data-workflow 失败。另：c4abcf53c/a6dc2eb16/6330ccf3b/f447a9a3d 的康辉 KNOWN_BROKEN 门禁豁免、cct.cn 迁移、raw_kanghui_cct.json（50 产品未接入 merge 管线，0 条进 tours.json）等政策取舍仅存于 commit message，决策链零覆盖。修复（176532005/本轮）：恢复 run: | + cron 断言改双引号 + crawl_kanghui_cct.mjs 标 WIP。
- Decision: workflow 编辑后必须过 YAML 结构校验（每 step 有 run/uses）+ 契约测试实跑；决策链补记 crawler 政策轮次；未接入管线的爬虫产物标记 WIP 而非宣称恢复。
- Rationale: 静默漂移的两种通道（测试失败 × CI 不跑；workflow 结构损坏 × 契约测试未覆盖结构）本轮各出现一次，均须在门禁侧闭合。
- Alternatives: ①kanghui 数据接入 merge 管线（否：cct: sourceId 映射+字段适配是功能工程，WIP 标记先止血）；②cron 断言回退单引号（否：文件已是双引号，改断言对齐现状）
- Confidence: high（audit:update-data-workflow/deploy-workflow 修复后通过；YAML 结构校验脚本实测两 workflow OK；pytest 113 passed）
- Date: 2026-08-14


## D-043: URL 门禁双实现一致性纪律 + 无效 URL 防御性空串 [Accepted]

- Context: reviewer 第二轮独立审查发现 check_booking_urls.py（每周健康门禁）的 resolve_source_detail_url 镜像仍按 560dfc5fb 的 bookingUrl-first 顺序解析——TS 前端已在 65c60ceb7 改为 printUrl/tournameno → bookingUrl → keyword（D-039），Python 门禁未同步：门禁探测的是旋转/过期的 groupno URL 而非用户实际打开的稳定 printUrl（printUrl 宿主死亡门禁检测不到，groupno 旋转导致每周误报）。另：TS/Python 对非假日通且 bookingUrl 无效（javascript: 等非 http）的情况原样返回给 window.open。修复（176532005）：Python 镜像同步 D-039 顺序（补 JRT365_PRINT 常量 + sourceAttributes 分支）；TS/Python 对非 http bookingUrl 防御性返回空串（调用方 openExternalLink 已空检查，4034 卡片实测全 http 无实害）；test_geo_schema_guard.py MINING_ARRAY_KEYS 补 candidateSources。
- Decision: 前端 URL 解析与健康门禁探测必须共享同一顺序语义（双实现镜像纪律，改动一侧必须同步另一侧并实测对比）；不可解析的 URL 一律返回空串而非原样放行；schema guard 覆盖 zod 全部数组字段。
- Rationale: 门禁的价值 = 探测用户实际落地的 URL；双实现漂移会让门禁度量「错误的东西」（旋转 groupno）而漏掉「真实的东西」（printUrl 宿主死亡）——reviewer 实测两解析器同一输入不同结果证实。防御性空串消除 javascript: 注入面（数据受控但防御不留口）。
- Alternatives: ①Python 门禁直接调用 TS 解析器（否：门禁用 python/urllib 正是为绕过 cct.cn 对 node fetch 的 WAF 封锁，反着来会复现封锁）；②门禁只测 bookingUrl 不镜像（否：与用户实际打开不一致，本轮已实证漂移）；③无效 URL 保留原样返回（否：javascript: 进 window.open 是注入面）
- Confidence: high（6 场景镜像对比实测一致：printUrl 优先/tournameno 派生/无 attrs bookingUrl/bookingUrl 无效 keyword/非假日通有效/非假日通无效→空串；test:source-detail-url + schema guard 通过）
- Date: 2026-08-14

## D-044: formatter 缩进规范显式化——.prettierrc 声明 space/2（防 tab 四犯） [Accepted]

- Context: pi-lens formatter 的 tab 缩进违规三犯（61237a117 引入 → 176532005 fix_tabs 转换修复 → 017bbe1c1 前又复发于 crawl_kanghui_cct.mjs/test_update_data_workflow.mjs，分别 77/164 行）；项目 .editorconfig 声明 indent_style=space 但无 formatter 级配置，formatter 无配置时输出 tab。修复（017bbe1c1）：新增 .prettierrc（{"useTabs": false, "tabWidth": 2}）给 formatter 显式缩进声明。执行缺陷（审计独立实测）：fix_tabs 用 lstrip 删除全部 tab 而非逐层转 2-space → 两文件缩进塌陷（续行/块体顶格），且 formatter 的双引号输出全文件保留（父版本为单引号）。
- Decision: formatter 缩进规范显式化为 .prettierrc（useTabs:false + tabWidth:2，与 .editorconfig 一致）；缩进转换必须逐层展开（tab→2-space×层级）而非 lstrip 删除。
- Rationale: 三犯证明既有规范（.editorconfig/口头纪律）不足以约束无配置 formatter；显式配置文件是唯一可被工具读取的约束面。lstrip 删除缩进在「formatter 输出 tab 嵌套」场景下会毁坏层级结构——转换必须 preserve 层级。
- Alternatives: ①接受 tab 输出（否：违反 .editorconfig、跨编辑器显示错乱）；②禁用 pi-lens formatter（否：环境级行为，配置化更可控）；③tab 逐层转 2-space 脚本（对：正确执行方式，auditor blocker 已按此开出）
- Confidence: medium（.prettierrc 是否被 pi-lens formatter 实际读取未实测——防四犯验证留待下轮观察 formatter 行为）
- Date: 2026-08-14
