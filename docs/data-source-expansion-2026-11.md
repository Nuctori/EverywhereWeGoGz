# 广州旅行团数据源扩展调研（2026-11-23）

> 结论先行：**还能加，而且有两个"当天可接"的新源**（上品旅行、广州康辉 thyoo），另有 3 类可挖方向。
> 所有"通/不通"均来自本机实测，证据脚本与产物在 `tmp/` 下（清单见文末）。

## 1. 现状盘点（`public/data/tours.json`，6483 条）

| 来源 | 总条数 | 1-3天 | 广东目的地 | 广东且1-3天 | 均价(元) | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 康辉 | 2641 | 410 | 548 | 157 | 11160 | 活（m.cct.cn JSON API） |
| 广之旅 | 2014 | 860 | 766 | 438 | 6995 | 活 |
| 广东中旅 | 1155 | 103 | 402 | 62 | 14781 | 活 |
| 假日通 | 377 | 162 | 24 | 22 | 2023 | 活（有健康检查） |
| 天涯户外 | 254 | 77 | 62 | 52 | 2803 | 活 |
| 广州去旅行 | 42 | 16 | 9 | 9 | 2255 | 活（赛会通租户，Selenium） |
| **合计** | **6483** | 1628 | 1811 | **740 (11.4%)** | — | — |

失效/空转（已在管线里但不出货）：

- **品途**（ptotour.com）：`raw_pintu_full.json` = 2 字节，0 条。
- **赛惠通/暴走村**：`raw_saihuitong_full.json` 9KB；租户站 `gftblm.360jlb.cn` 仍 200 但无有效期次，终库 0 条。
- **康辉旧站 cctpage.com**：已列入 `DEAD_SOURCE_HOSTS`。

结构性缺口与此前立案一致（`docs/quality-gap-checklist.md` A6）：**广东 + 1-3 天只占 11.4%**，而 6 个源里 3 个是长线大社。

## 2. 两个已实测抓通的新源

### 2.1 上品旅行 / 广州市海外国际旅行社（`gz.tootour.com`）✅ 推荐第一

- **实测**：`GET /around/` 单页 183KB，**173 条唯一线路，173 条带价，全部标"广州出发"**；天数分布 1天24 / 2天113 / 3天18 / 4天1 → **1-3 天 155 条**。
- 全站清点：`/around/` 173（1-3天 155）+ `/domestic/` 373（29）+ `/hongkong/` 34（25）+ `/abroad/` 360（0）= **940 条在架线路，其中 1-3 天 209 条**。
- 覆盖：清远、惠州、增城、从化、肇庆、珠海等省内短线，正是 A6 缺的那类货。
- 抓取成本：`requests` 直连即可，**无需 JS、无需登录**；无分页（`/around/` 即全量，`/domestic/` 可再补国内线）。
- 详情页可解析（`/travel/<id>.html`，53KB）：行程/价格/住宿/儿童/预订字段齐全；**没有"班期/上车点"结构化字段**（需要时走富集）。
- 产出预期：+155 条省内短线（现有 740 → +21%），单源工程量约 0.5 人日（列表 + 详情解析 + merge 映射）。
- robots：Cloudflare Content-Signal `search=yes, use=reference`（做检索索引/引用允许，禁止 AI 训练）。

### 2.2 广州康辉 网络销售部（`thyoo.com` / `m.thyoo.com`）✅ 推荐第二

- **实测**：`/sitemap.xml` 4.2MB，**28,141 个 URL，其中 9,622 条线路**；robots `Allow: /`。
- 抽样 40 条详情页：**广州市出发 25%**、1-3天 8% → **外推广州出发省内短线约 720 条**。
- 详情页字段最全：`班期`(20%)、`上车/集合`(42%)、价格(62%)，正文带"目的地 广东省 XX市"结构化行；手机版 `m.thyoo.com` 更干净（含"穿插上下车点"文本）。
- 风险：与现有"康辉"（cct.cn）**品牌重叠**，需按 `sourceId/URL` 去重，否则会拉高重复率；建议以独立 source 名（如"广州康辉"）入库并做跨源去重审计。
- 工程量：约 1 人日（sitemap 拉取 → 详情页解析 → 去重）。

## 3. 候选清单（按性价比排序）

| 源 | 类型 | 实测状态 | 结论 |
| --- | --- | --- | --- |
| 上品旅行 gz.tootour.com | 广州本地社 | ✅ 173 条/155 条短线 | **立即接** |
| 广州康辉 thyoo.com | 广州康辉分销站 | ✅ 9,622 条线路，~720 条短线 | **立即接**（需去重） |
| 春秋旅游 trip.ch.com | 平台 | ⚠️ 开放 JSON，`queryAllCity` 可得广州 `cqCityId=10`，但列表接口带 `springsign` 签名 | 需逆向签名，1-2 人日 |
| 游侠客 youxiake.com/gz | 户外短线 | ⚠️ 广州站 200/104KB，列表为 JS | 可挖，户外与天涯户外重叠 |
| 32号 32hike.com | 户外短线 | ⚠️ 200/128KB，未解列表接口 | 备选 |
| 赛会通其它广州租户 | 俱乐部 SaaS | ⚠️ 平台首页无租户目录，列表页为 Vue 渲染（现有源用 Selenium） | 需先人工找到租户 slug，再复用现有适配 |
| 去哪儿 一日游 piao.qunar.com/daytrip | 平台 | ⚠️ 200 但返回空壳 | 备选 |
| 携程 vacations / 途牛 / 同程 / 飞猪 | OTA | ❌ `verify.ctrip.com` 验证墙；途牛返回 WAF 拦截页；`m.ly.com` 返回 `Illegal request` | **不做**（属反爬对抗，超红线） |
| 金马国旅 jinma.com.cn | 广州本地社 | ❌ 域名已停放（跳 whois.com.cn） | 死源 |
| 南湖国旅 nanhu.com | 广州本地社 | ❌ 域名出售页 | 死源 |
| 广州康辉旧站 gdkhly.com | 广州康辉 | ❌ 域名已易主成"360直播网" | 死源 |
| 广东青旅 gdcyts.com / 广州中旅 gzhcts.com / 铁青 tieqing.com / 骑驴游 qilvyou.com / 驴妈妈 / 一起飞 | — | ❌ 502 / 不可达 / 访问验证页 | 死源或已废 |

## 4. 一个必须记录的环境坑

本机 `HTTP(S)_PROXY` 走 `127.0.0.1:7890`，**出口 IP 在日本**。经代理访问时：上品/gdkhly 触发 Cloudflare 挑战（403 "请稍候…"），驴妈妈/南湖/广州中旅/骑驴游/广东青旅返回 502 或 TLS 失败。
**直连（`proxies={'http':None,'https':None}`）后，上品 200/261KB、thyoo 200/86KB 立刻正常。**
→ 新源适配必须显式直连，否则会误判成"死站"，也会把真实可用源全部挡掉。

## 5. 建议的接入顺序

1. **上品旅行**（0.5 人日）：`/around/` + `/travel/<id>.html` → `src/data/raw_tootour_full.json` → merge 映射（source="上品旅行"，色板 + logo）→ 跑 `data:merge` 与 `audit:data-integrity`。
2. **广州康辉 thyoo**（1 人日）：sitemap → 详情页（限 1-3 天 + 广州市出发）→ 独立 source 名 + 跨源去重。
3. **春秋**（1-2 人日，可选）：逆向 `springsign` 后拿全量 JSON，覆盖全国平台货。
4. 户外方向（游侠客/32号/其他赛会通租户）：等 1、2 落地、看短线占比再决定。

完成 1+2 后，广州出发省内短线供给预计从 740 条 → **1600 条左右**（+115%），来源数 6 → 8。

## 6. 未验证 / 风险

- 上品 `/around/` 之外（`/domestic/`、`/hongkong/`）已清点：`/domestic/` 373 条（1-3 天 29）、`/hongkong/` 34 条（25）。
- thyoo 的"广州市出发 25%/1-3天 8%"是 40 条抽样外推，非全量清点；sitemap 9,622 条 URL 里实际在架 1,646 条（`/travel/` 自述），低 id 段大量 404 与旧模板页（无班期/上车点）。
- 上品的 `robots` 允许检索/引用但禁 AI 训练；thyoo `Allow: /`。两个源都**未验证长期稳定性**（此前康辉旧站、品途、金马均属突然死亡）。
- 上品与 thyoo 不是同一 CMS（上品为 ASP.NET 传统站，thyoo 为新模板站），字段结构差异大。
- thyoo 有限流：连续约 1,500 次详情请求后 sitemap 会下发 985 字节 JS 挑战页。爬虫已加挑战页识别 + 降速（并发 4、0.15s 间隔、默认 400 页/轮），被拦时保留存量并返回 0 而不是清空。

## 7. 证据文件

- `tmp/probe_sources.py` / `tmp/probe_direct.py` — 存活探测（代理 vs 直连对比）
- `tmp/probe_extract.py`、`tmp/probe_tootour3.py`、`tmp/tootour_around.json` — 上品 173 条线路明细
- `tmp/probe_sitemap2.py`、`tmp/thyoo_travel_urls.txt` — thyoo 9,622 条线路 URL
- `tmp/probe_thyoo_sample2.py` — 40 条详情页抽样与外推
- `tmp/probe_pw.mjs`、`tmp/probe_ch.py`、`tmp/probe_saas.py` — JS 站/春秋/赛会通探测
- `tmp/source_stats.py` — 现有 6 源供给分布

## 8. 接入实现（2026-11-23，已落地）

### 8.1 新增文件

| 文件 | 作用 |
| --- | --- |
| `scripts/crawl_tootour_full.py` | 上品旅行爬虫：`/around/ /domestic/ /hongkong/` 三页全量，`requests` 直连，卡片解析 + 详情解析（行程/费用） |
| `scripts/crawl_thyoo_full.py` | 广州康辉爬虫：sitemap 数字 id 倒序 + 游标（`src/data/thyoo_sitemap_cursor.json`），每轮有界抓详情，命中"广州市出发 + 1-3 天"入库，顺带写上车点缓存 |
| `scripts/test_tootour_source.py` | 上品解析契约（fixture 离线）：条数/字段/天数/详情行程 |
| `scripts/test_thyoo_source.py` | thyoo 解析契约（fixture 离线）：班期归一化/上车点/挑战页识别/上车点缓存格式 |
| `scripts/test_new_source_integration.mjs` | 端到端：raw 注册、色板、tours.json 出货、广东 1-3 天超过基线 |
| `scripts/fixtures/*.html` | 4 份真实页面快照，供上述离线测试 |
| `src/data/raw_tootour_full.json` | 570 条（1-3 天 216） |
| `src/data/raw_thyoo_full.json` | 首轮 59 条（全部广州出发 1-3 天） |

### 8.2 管线接线

- `scripts/merge_data.py`：`RAW_FILE_PRIORITIES` + `raw_files` 加入两个 raw；`SOURCE_COLORS` 加 `上品旅行 #E76F51`、`广州康辉 #C1121F`。
- `scripts/detail_parsers.py`：`_parse_tootour_detail`（请求详情页，复用爬虫解析器）+ `_parse_thyoo_detail`（复用爬虫已解析的行程/费用，合并阶段不再二次请求，避免继续触发限流）。
- `scripts/crawl_unified_sources.py`：`data:crawl` 纳入 `tootour` / `thyoo`。
- `scripts/test_crawler_syntax.mjs`：两个新爬虫纳入语法门禁。
- `package.json`：新增 `audit:tootour-source`、`audit:thyoo-source`。

### 8.3 首轮结果（`npm run data:merge` 全默认参数）

- 上品旅行：raw 570 → 目录 **515** 条（1-3 天 194，广东目的地 144），详情行程覆盖 503/515、费用包含 512/515。
- 广州康辉：raw 59 → 目录 **53** 条（全部 1-3 天，广东目的地 37），行程 40/53、费用包含 52/53。
- 全库「广东目的地 + 1-3 天」：740 → **886 条（+19.7%）**，占全库 15.0%。
- 同轮可用性过滤移除了 465 条死链（386 个 404 + 79 条 unavailable），全库总量 6483 → 5910 —— 供给是净减的背景下，省内短线仍然净增 146 条。

### 8.4 已知限制

- 广州康辉首轮只覆盖 sitemap 前 700 条（按 id 倒序），全量 1,646 条需多轮游标累积；每轮默认 400 页，避免触发挑战页。
- 上车点：约 4 成 thyoo 产品详情页带 `[A]08:45 昌岗地铁…` 结构，爬虫已写入 `public/data/boarding-points/thyoo.json`；首轮 59 条恰好都不带，故暂无数据。
- 上品旅行详情页无班期表，`departureDates` 为空（走既有推断逻辑）；如需真实班期需改抓其"排期"接口。
