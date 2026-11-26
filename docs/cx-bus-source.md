# 创想巴士（车盈网白牌小程序）数据接入

日期：2026-11-27 ｜ 手段：本机微信小程序抓包（mitmproxy + 系统代理），全程在用户授权的本机环境内

## 一、结论

**创想巴士小程序就是车盈网的租户实例**：它的接口不是 `wechat.transrouter.com`（那是旧 H5 入口，
要 `partner` 渠道号），而是车盈网的 `sale-api-public.dz.busboss.cn`，`appId=wxb5f1e7327d7fbb6a`。
所以"创想巴士"不需要渠道号，走的是和小程序一样的微信登录令牌。

| 项 | 值 |
|---|---|
| 小程序 appid | `wxb5f1e7327d7fbb6a`（创想巴士） |
| 租户 tenantid | `3a23bb6d-2c63-3725-8241-1fe3e5f05f11` |
| 登录 | `POST https://sale-auth.dz.busboss.cn/connect/token`，`grant_type=wx-mp`，`client_id=WeChatMiniProgram` |
| 数据 | `POST https://sale-api-public.dz.busboss.cn/api/custombus/line-class-day/v2/list`（Bearer JWT，1h） |
| 来源码 | `dataSourceCode: CheYingWang` |

实测覆盖（2026-11-27，广东 21 个地级市两两组合 420 个方向）：**529 条线路**，
广州→深圳 121 班、深圳→珠海 184 班、珠海→深圳 190 班。

## 二、采集与接入

```powershell
# 1) 令牌：tmp/cx-token.json（抓包得到，含 access_token + refresh_token；只放 tmp/，不入库）
# 2) 拉数据：按城市对翻页，结果按线路归并，写 src/data/raw_cx_lines.json
node scripts/pull_cx_lines.mjs       # 今天；--days 1 取明天；--pairs 4401:4403 只拉一对
# 3) 建库：写 public/data/bus-lines.json（主线）与 public/data/bus-lines-cx.json（创想巴士）
npm run data:bus-lines
```

- `scripts/pull_cx_lines.mjs`：令牌 401/网关 429 都会退避重试；每对城市对缓存到 `tmp/cx-pairs/`，中断可续跑。
- `scripts/build_bus_lines.mjs`：创想巴士单独出一个文件（主线 1.85MB + 创想 1.94MB，单文件 3.8MB 会拖慢首屏）；
  前端 `use-bus-lines` 并行取、合并使用，附加源失败不影响主线。
- `scripts/test_bus_lines_contract.mjs`：两个文件都校验，且要求原始线路数与成品一致。

## 三、注意事项

- **令牌是用户本人微信身份**（JWT 带 `wx-openid`/`wx-userid`），只在 `tmp/` 本地使用，不入库、不外传。
- 刷新令牌会轮换；轮换后旧值很快失效。令牌过期就重开一次创想巴士小程序（会自动 `wx.login`），重新抓一次 `/connect/token`。
- 坐标是接口原生 GCJ-02，与滴滴一致；混进 WGS-84 会让整条线偏 500 米，所以建库时逐条声明 `coordinateSystem`。
- 这是第三方生产接口，无公开文档：个人查询用途风险低，接进产品对外提供数据前仍需走商务（见 `docs/busboss-data-access.md`）。
