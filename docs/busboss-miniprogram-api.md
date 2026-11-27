# 车盈网出行助手：小程序 API 扒通记录（可拉数据）

日期：2026-11-27 ｜ 手段：本机 WeChat 4.x 小程序抓包（mitmproxy + 系统代理 + 401 注入逼刷新）｜ 全程在用户授权的本机环境内进行

## 一、结论

**能拉，已跑通。** 小程序的班次接口不在之前分析的 `api.class.busboss.cn`（那是 B2B 网关），而在：

```
POST https://sale-api-public.dz.busboss.cn/api/custombus/line-class-day/v2/list
Authorization: Bearer <JWT, RS256, 1h>
Content-Type: application/json
platform: mp-weixin
xweb_xhr: 1
Referer: https://servicewechat.com/wx353925c84ba5e295/90/page-frame.html
```

实测：广州(4401)→深圳(4403) 2026-11-27 = **203 条班次**，含发车时间、票价、余位、上/下车站点序列、坐标。

## 二、身份链

| 项 | 值 |
|---|---|
| 小程序 appid | `wx353925c84ba5e295`（车盈网出行助手，WeChat 4.x / XWEB 25819） |
| 授权端点 | `https://sale-auth.dz.busboss.cn/connect/token`（OpenIddict） |
| client_id | `WeChatMiniProgram` |
| grant | `refresh_token`（另有 `authorization_code`，wx.login 走它） |
| access_token | RS256 JWT，`expires_in=3600`，claims 含 `wx-openid` / `wx-userid` / `tenantid` / `session_id` |
| refresh_token | JWE，约 4400 字符，**每次刷新会下发新的**，旧值短期内仍可用 |

## 三、抓到的接口面（均需 Bearer）

| 方法 | 路径 | 作用 | 请求体样例 |
|---|---|---|---|
| POST | `/api/custombus/line-class-day/v2/list` | **班次列表（核心）** | `{"skipCount":0,"maxResultCount":50,"classDate":"2026-11-27","start":{"type":"Region","value":{"id":"4401","level":1}},"end":{"type":"Region","value":{"id":"4403","level":1}}}` |
| POST | `/api/custombus/line-class-day/v2/calendar` | 日历（每天有无班次/低价） | `{"start":{...,"id":"440105","level":2},"end":{...,"id":"4403","level":1}}` |
| POST | `/api/custombus/standard-node/v2/arrival` | 目的地候选节点树 | `{"withDetail":false,"start":{"type":"Region","value":{"id":"440105","level":2}}}` |
| GET | `/api/custombus/standard-node/fetch-nearest-node` | 定位最近站点 | — |
| GET | `/api/custombus/configuration-user` `/decoration-user/v3` `/member-user` `/user-public` | 用户态/装修配置 | — |
| POST | `/api/custombus/ticket-user-behavior-public/{lng},{lat}` | 埋点 | `null` |

### 返回结构（list）

```
{ filterNodes:{startNode[],arrivalNode[]}, totalClassCount, totalCount, items:[
  { lineName, classDate, classTime, lineClassDayPrice, canSaleCount, fareDisplayText,
    startNodeList:[{nodeName,classTime,geocoder,nodeAddress,...}],
    arrivalNodeList:[{nodeName,classTime,runTime,mileage,geocoder,nodeAddress,...}],
    dataSourceCode:"CheYingWang", id, lineId, ... } ] }
```

注意：`lineClassDayPrice` 是最低价，`fareDisplayText:"起"` 表示该价是起步价；上下车站点各有独立时间与价格矩阵 `priceList`（`节点id串:价格|服务费|x`）。

### 区划码

`id` 就是行政区划码，`level` 跟位数绑定：4 位 = 市（4401 广州、4403 深圳、4406 佛山、4419 东莞、4110 许昌），6 位 = 区县（440105 海珠区）。实测**区县级作为起点返回 0 条**，先用市级；区县筛选交给 `arrival` 接口。

## 四、工具（`tmp/busboss-recon/`）

| 文件 | 作用 |
|---|---|
| `auth.cjs` | 取/刷 token：`node auth.cjs --check`、`node auth.cjs --force`；状态存 `fixtures/auth-state.json`（0600） |
| `pull.cjs` | **拉数据**：`node pull.cjs --date 2026-11-27 --from 4401 --to 4403 [--all] [--json]` |
| `recapture.cjs` | 刷新链断了时，从抓包日志重新绑定：`node recapture.cjs` |
| `addon.py` + `probe*.cjs` | 抓包/探测工具，`flows/force401.flag` 存在时对下一个 list 请求注入 401，逼小程序走刷新分支 |

### 典型用法

```powershell
cd D:\react\app\tmp\busboss-recon
node pull.cjs --date 2026-11-27 --from 4401 --to 4403 --all --json > out.json   # 全量 203 条
node pull.cjs --date 2026-11-28 --from 4401 --to 4419                           # 表格
```

`pull.cjs` 会自动调 `auth.cjs`：access token 剩余 <120s 时用 refresh_token 换新，并把轮换后的 refresh_token 写回状态文件。

## 五、抓包复现（要重新取 token 时）

1. `~/.mitmproxy/mitmproxy-ca-cert.cer` 导入「当前用户 → 受信任的根证书颁发机构」：
   `certutil -user -addstore -f Root "$env:USERPROFILE\.mitmproxy\mitmproxy-ca-cert.cer"`
2. 起代理（上游走本机 7890）：
   `mitmdump -q -p 8899 --mode upstream:http://127.0.0.1:7890 -s addon.py -w flows/all.dump`
3. 系统代理指到 `127.0.0.1:8899`（`HKCU:\...\Internet Settings` 的 `ProxyServer`/`ProxyEnable`，改完调 `InternetSetOption` 刷新）。
4. 打开/重进「车盈网出行助手」，随便查一次，流量即落 `flows/requests.jsonl`。

**关键技巧**：小程序只在 token 快过期时才刷新，等待很麻烦。`addon.py` 支持一次性 401 注入——写一个 `flows/force401.flag`，下次 list 请求返回 401，客户端拦截器立刻走 refresh 分支，完整的 `refresh_token` 和响应就被抓到（本次就是这么拿到的）。

## 六、注意事项

- **token 是用户身份的**：JWT 里带 `wx-openid`/`wx-userid`，等于用这个微信账号身份调接口。别外传状态文件，别拿去做越权操作。
- **refresh 轮换**：我们刷新会拿到新 refresh_token，小程序手里的旧值可能失效；它下次会用 `wx.login` 重新授权（用户无感），但那一刻我们的链也会断，需要 `node recapture.cjs` 重绑。
- **合规**：这是第三方生产系统的接口，无公开文档。个人查询用途风险低；接进产品对外提供数据前必须走商务（见 `docs/busboss-data-access.md`），否则违反对方服务条款。
- mitmproxy 根证书目前留在当前用户 Root 存储里。不用了可以撤：
  `certutil -user -delstore Root mitmproxy`（或按指纹删除）。

## 七、全量抓取（已跑完一轮）

### 抓取拓扑

```
城市发现：china-division 的 337 个市码 → 逐个调 standard-node/v2/arrival
          → 有返回的才是起点城市（75 个）
          → 同时拿到每个起点可达的省份集合（合计 204 个 起点×省 组合）
抓取：每个 (起点城市, 到达省, 日期) 一次 list 请求，maxResultCount=2000
      → 75 × 19 省 × 46 天 = 9,384 个任务
```

**关键技巧**：`end` 传 **2 位省级码 + level:0**（如 `{id:"44",level:0}`）一次返回全省，
广州→广东单日就是 1,470 条；传 4 位市级只能拿到单个市。

### 本轮结果

| 指标 | 数值 |
|---|---|
| 唯一班次行 | **87,798** |
| 线路数 | 1,192 |
| 起点城市 | 71（有实售的） |
| 日期窗口 | 2026-11-27 → 2027-01-11（46 天） |
| 到达省 | 广东 75,840 / 香港 8,856 / 广西 1,449 / 海南 437 / 河南 287 / 云南 183 / 福建 183 / 湖南 157 / 贵州 119 … |
| 起点 top | 广州 19,616 / 珠海 11,729 / 深圳 11,664 / 佛山 9,643 / 东莞 4,331 |
| 票价 | <50 元 49,207；50–100 21,168；100–200 14,525；200–300 2,116；300+ 782 |
| 每日班次 | 11-27:7,731 → 12-11:2,314 → 01-01:186 → 01-11:9（远端逐步开售） |
| 落盘 | `data/records.jsonl.gz` 41 MB → `data/cyw.db` 87,798 行 |

### 工具链

```powershell
node crawl.cjs discover --gap 2000   # 337 个市码探活 → fixtures/origins.json
node crawl.cjs crawl --days 46 --concurrency 10 --gap 120   # 可断点续跑（data/progress.json）
node crawl.cjs status                # 进度/记录数
node build-db.cjs                    # JSONL → SQLite（data/cyw.db，带索引）
node stats.cjs                       # 覆盖统计
```

### 限流与坑（重要）

- **arrival 接口限流严**：1 req/s 连打 11 次就 429；list 接口宽松（5 req/s 无压力）。
  发现阶段用 2s 间隔；抓取阶段 10 并发 + 120ms 间隔可行。
- **429 要指数退避**（1→2→4→8→16s），否则整批失败；失败的 task 不写 progress，重跑会补。
- **禁止两个 crawl 同时跑**：`progress.json` 会互相覆盖（已加 `data/crawl.lock` 单实例锁）。
- **token 轮换会互相踢**：我们 refresh 一次，小程序手里的 refresh_token 就失效；
  它下次打开会走 `authorization_code` 重新登录（用户无感），**我们的链随即断掉**。
  修法：抓包开着 → 点一下小程序触发重新登录 → `node recapture.cjs` 重新绑定。
- 远端日期大多为空：46 天里 7,007 个 (起点,省,日) 组合是 0 条，属正常（车次还没放票）。

## 八、下一步

1. 把 `data/cyw.db` 接进 `D:\react\app` 的数据层（城市名 ↔ 区划码映射可从 DB 里 `origin`/`province_name` 反推）。
2. 班次详情/座位图需要再抓「选班次 → 详情」的请求（本次只到列表层）。
3. 每天增量跑 `node crawl.cjs crawl --days 46` 即可滚动更新（已完成 task 会跳过）。

## 九、接入本项目（已落地）

车盈网在项目里是**独立附加源**，三层落地，各管一段：

| 层 | 文件 | 内容 | 体积 |
|---|---|---|---|
| 全量线路 | `public/data/cyw/lines.json` | 1,191 条线路 **完整站点序列**（20,001 个站点，不截断） | 2.9MB |
| 全量班次 | `public/data/cyw/schedule.json` | **46 天 × 全部班次**（79,218 条 `[时间,票价分,余位]`） | 1.6MB |
| 地图视图 | `public/data/bus-lines-cyw.json` | 最早可售日 + 站点截断，走图层预算 | 1.7MB |
| 原始件 | `src/data/raw_cyw_full.json` | 线路 + 日程归档，审计用 | 4.6MB |

| 代码 | 作用 |
|---|---|
| [`scripts/build_bus_lines_cyw.mjs`](../scripts/build_bus_lines_cyw.mjs) | 抓取产物 → 以上四份（一次构建，四份同源） |
| [`src/lib/cyw-schedule.ts`](../src/lib/cyw-schedule.ts) | 全量数据 loader：zod schema + `loadCywLines/loadCywSchedule/departuresFor` |
| [`src/hooks/use-bus-lines.ts`](../src/hooks/use-bus-lines.ts) | 地图图层把车盈网当第三个可选源合并 |
| [`scripts/test_bus_lines_cyw_contract.mjs`](../scripts/test_bus_lines_cyw_contract.mjs) | 契约：线路/日期/班次数量、坐标越界、**图层日期必须与班次同源**、2MB 预算 |

```powershell
npm run data:bus-lines-cyw     # 重建四份产物
npm run test:bus-lines-cyw     # 契约校验
```

**刷新节奏：每两周一次。** 车盈网的班次窗口约 46 天、远端日期逐日放票，两周刷新的颗粒度足够；
刷新流程是「重抓 token → 跑 crawl → 重建」：

```powershell
# 1) token 失效后（OpenIddict 刷新链会被小程序重登踢掉）先重启 mitm 抓包并点一次小程序，或直接用有效 token
cd tmp\busboss-recon; node auth.cjs --check
# 2) 增量抓取（已完成的任务会跳过，只补新放票的日期）
node crawl.cjs crawl --days 46 --concurrency 10 --gap 120
# 3) 重建数据层并校验
cd ..\..; npm run data:bus-lines-cyw; npm run test:bus-lines-cyw
```

**体积为什么分三层**：全量 46 天班次 79,218 条若塞进一个文件前端 parse 会卡；
`schedule.json` 与 `lines.json` 按需加载（进线路详情/查班次时才取），图层只拿 2MB 内的视图。
坐标系为小程序端 **GCJ-02**，逐条声明 `coordinateSystem: 'gcj02'`，由 `bus-route-geometry.ts` 换算。

## 十、智惠大巴（第二个小程序，独立 API + 多供应商）

同一个「车盈网」体系下的另一个小程序，**appid、域名、协议全都不同**，而且它是个**聚合平台**：
除车盈网自营外还接了广之旅、空港快线、珠江客运等，这部分是出行助手完全没有的增量。

| | 出行助手 | 智惠大巴 |
|---|---|---|
| appid | `wx353925c84ba5e295` | `wx823dcefe5a4b4e75` |
| 域名 | `sale-api-public.dz.busboss.cn` | `wx823dcefe5a4b4e75.dz.busboss.cn` |
| 风格 | RESTful + JSON body | `BookSeatsApi/*`，GET + query，PascalCase |
| 鉴权 | OIDC Bearer（refresh_token 轮换） | 自定义 JWT（HS256，**无 Bearer 前缀**），3 天有效且**无刷新接口** |

### 接口

```
GET /BookSeatsApi/API_LineClassDayLineSaleQuery?ClassDate=&StartCityCode=&ArrivalCityCode=&PageNumber=&PageSize=
GET /BookSeatsApi/WX_ArrivalCityQuery    目的地城市树（174 组 / 19 省）
GET /BookSeatsApi/WX_CarPoolLineQuery    合乘拼车
```

必需请求头（缺一个就返回 200 空体）：
```
Authorization: <JWT>   IsWxApp: 1   AgentAppID: cywzhdbID   xweb_xhr: 1
Referer: https://servicewechat.com/wx823dcefe5a4b4e75/323/page-frame.html
```

**关键口径**：不传 `ArrivalCityCode` 时返回该出发城市的「多供应商直通车/包车」全量
（含广之旅中港直通、空港快线等），**不包含车盈网自营**；传了目的地才会掺入 cheyingwang。
所以这条路径拿到的就是纯增量，与出行助手那份天然不重复。

### 本轮抓取结果

```
23 个有班次的出发城市（含香港湾仔/中西/油尖旺等区）× 46 天 = 1,058 个任务
29,105 行 → 1,010 条线路 / 5,126 个站点 / 29 天 / 28,036 个班次
```

7 家供应商（**独立标签**，前端按 `supplier` 过滤/着色）：

| 标签 | supplier | 线路数 | 出现城市数 | 说明 |
|---|---|---|---|---|
| 广之旅·中港直通 | `gzl` | 811 | 18 | 广州⇄香港（灣仔/尖沙咀/机场/迪士尼），繁体站名 |
| 珠江客运·中港巴士 | `zhjc` | 84 | 2 | 珠海/香港出发为主 |
| 空港快线·白云机场 | `kgyx` | 69 | 11 | 机场大巴，站点自带里程与分段票价 |
| 大队巴士 | `dadui` | 20 | 4 | OTA 渠道 |
| TBS 对公 | `tbs` | 16 | 3 | 对公渠道 |
| 一路行·扬扬巴士 | `ylx` | 7 | 2 | — |
| 广东联网售票·新和 | `xh` | 3 | 1 | 仅深圳出发 |

### 供应商全集已收敛（不需要再扫）

用**多日期探测**（181 个城市 × 3 个日期：11-27 / 12-24 / 01-01，共 543 请求）复核：

```
node zhihuiba-discover-multi.cjs          # → data/zhihuiba-cities-multi.json
命中城市 23 个（与单日探测完全一致，无新增）
供应商 7 家（与已抓数据完全一致，无新增）
12-24 只有广州有 6 条，其余城市 0；01-01 全 0
```

结论：**智惠大巴的聚合面就是 8 家**——7 家增量 + `cheyingwang`
（车盈网自营，只在"传 `ArrivalCityCode`"那条路径出现，已由出行助手源覆盖，不重复抓）。
再扫也不会有新供应商，除非对方新增渠道。

### 工具与接入

```powershell
cd tmp\busboss-recon
node zhihuiba-crawl.cjs discover --date 2026-11-27   # 扫 181 个城市码，找出有班次的起点
node zhihuiba-discover-multi.cjs                     # 多日期复核（换季/节假日渠道变化时再跑）
node zhihuiba-crawl.cjs crawl --days 46 --gap 700    # 断点续跑（data/zhihuiba-progress.json）
node zhihuiba-crawl.cjs status

cd ..\..
npm run data:bus-lines-zhd    # → public/data/zhd/{lines,schedule}.json + public/data/bus-lines-zhd.json
npm run test:bus-lines-zhd    # 契约：id 前缀 zhd-<supplier>-、班次必须带供应商下标、图层日期同源、<2MB
```

| 产物 | 内容 | 体积 |
|---|---|---|
| `public/data/zhd/lines.json` | 1,010 线路 + 完整站点 + `supplier`/`supplierLabel` | 878KB |
| `public/data/zhd/schedule.json` | 29 天 × 28,036 班次 `[时间,票价分,余位,供应商下标]` | 676KB |
| `public/data/bus-lines-zhd.json` | 图层视图，`id=zhd-<supplier>-<hash>`，带 supplier 字段 | 991KB |

前端：`use-bus-lines.ts` 已把它作为第四个可选源合并；`BusLine.supplier` / `supplierLabel`
经 `busLineDataSchema` 保留，可据此渲染供应商标签。

**注意**：JWT 3 天到期且无刷新接口，过期只能重开小程序抓一次（`zhihuiba-crawl.cjs` 会在启动时
检查 `exp` 并直接报错，不会带过期 token 空跑）。

## 十一、更早的内容（保留）

见上方第一～六节：接口清单、鉴权链、抓包复现、单点查询用法。
