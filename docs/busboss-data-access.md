> **更新（2026-11-27）**：已通过小程序抓包跑通真实数据接口，见
> [busboss-miniprogram-api.md](busboss-miniprogram-api.md)。本文是**匿名/公开面**的
> 摸底记录，仍然成立（匿名拿不到数据），但不再是唯一路径。

# 车盈网（busboss.cn）数据面摸底结论

日期：2026-11-27 ｜ 方式：CT 子域枚举 + 公开前端资产抓取 + 匿名接口探测（未解密小程序包、未做登录态复现）

## 一句话结论

**匿名拉不到班次数据，但网关是"可见的"**：数据接口暴露在公网，能打通 HTTP，卡在**报文规范 + 已注册的 appid/servicecode（签约后下发）**这一层。正规路径只有两条——商务对接拿凭据，或走省级聚合平台（岭南通）。

## 一、资产地图（实测）

| 主机 | 是什么 | 实测 |
|---|---|---|
| `api.class.busboss.cn` | **B2B/开放接口网关**（ASP.NET Web API） | `GET /Help` 200，可枚举全部接口；匿名调用能返回业务错误码 |
| `wxcs.busboss.cn` / `wx.open.class.busboss.cn` | 乘客 H5 入口（同一台机器 110.75.170.167） | 302/JS 跳 `/BookSeats/Index/cheyingwang/wx860ac2bf19c93283`；页面为客户端 WeChat UA 门禁壳 |
| `hd.class.busboss.cn` | 企业/检票/结算端 H5（Vue SPA） | 200，bundle 1.3 MB，`Authorization: Bearer` + SM2/SM3/SM4 + jsrsasign 签名 |
| `class.busboss.cn` | 后台管理登录（ASP.NET） | 200，阿里云验证码 2.0 |
| `docs.busboss.cn` | MinDoc 文档站 | 200，公开书只有「支付系统」「GPS定位系统」，**无开放接口文档** |
| `cyw-platform.busboss.cn` | 阿里云 OSS 桶 | 403 AccessDenied（匿名无权） |
| `h5.busboss.cn` | — | HTTP 403（nginx/1.14.1）；HTTPS 握手失败 |
| `dz/wxapp/sso/ws/datav/dingzhi/classab.busboss.cn` | 定制化/网关旁路 | HTTPS 直接握手失败或 502 |

子域全集见 `tmp/busboss-recon/subdomains.txt`（CT 取到 61 条）。

## 二、接口面实测证据

接口清单来自 `http://api.class.busboss.cn/Help`：

```
Commonroute: POST api/lock, api/unlock, api/sell, api/returnticket, api/orderquery, api/commonroute
GetData:    POST api/getSaleOrderList, api/getRefundOrderList, api/openApiGetData
票务:        POST api/Ticket, api/NanYueTongTicket, api/GBAOneTicket, api/FeiZhuTicket, api/Insurance
```

匿名调用返回（均为 200 + 业务错误码，不是 401）：

| 调用 | 返回 |
|---|---|
| `POST /api/commonroute {}` | `{"resultcode":"30000","resultmsg":"值不能为 null。参数名: s"}` |
| `POST /api/openApiGetData {}` | `{"statuscode":"8070","statusmsg":"参数无效"}` |
| `POST /api/Ticket {}` | `{"statuscode":13000,"message":"请求报文中没有request节点；…没有param节点；servicecode不能为空；appid不能为空；requesttime不能为空"}` |
| `POST /api/Ticket` + 完整 JSON 信封 | `{"statuscode":13000,"message":"请求报文中没有param节点；queryLine服务不存在"}` |

要点：
1. **鉴权不在 HTTP 层**（没有 401/403），在**报文语义层**：必须凑齐 `request/appid/servicecode/requesttime/param` 这套信封。
2. **servicecode 是注册制**：随便填一律「xx服务不存在」，说明渠道方拿到的是一份被授权的 servicecode 白名单。
3. 两个体系并存：`/api/Ticket` 等走「request 信封 + appid」，`/api/commonroute`、`/api/openApiGetData` 走「s/accesskey + publicresponse 信封」。对应不同对接年代/渠道。
4. 乘客端（小程序/H5）不直接打这个 B2B 网关，走 `BookSeats` ASP.NET 应用 + 微信 OAuth；`hd` 端则用 Bearer + 国密签名。

## 三、门槛到底在哪

- **小程序包**：本机缓存 240 个 `.wxapkg`，头部为 `V1MMWX`（微信 4.x 加密格式），明文不可读 → 不解包就不下结论（本次按非目标处理，未解密）。
- **乘客 H5**：`BookSeats` 页面只吐 1 KB 的 UA 门禁壳，真实内容要微信环境执行；无法匿名取数。
- **开放网关**：能通，但没有 appid/servicecode 就永远是错误码。

## 四、可执行路径

| 路径 | 需要什么 | 周期/确定性 |
|---|---|---|
| **A. 聚合平台（推荐先走）** | 广东省网络客运聚合平台（省交通运输厅 + 高德），已把 27 家平台/21 地市整合成统一入口 | 最快；但对外是"一个 App 一个入口"，第三方取数仍需走商务 |
| **B. 商务对接车盈网** | 签约 → 下发 appid + servicecode 白名单 + 签名密钥；走 `api.class.busboss.cn` 的 sell/orderquery/Ticket 体系 | 确定能拿全量；周期取决于商务 |
| **C. 岭南通** | 省级平台侧对接 | 上次结论：真正能对接的只有这一家 |
| **D. 小程序逆向** | 解密 wxapkg / WeChat 抓包（证书固定） | 不合规且脆弱，不推荐 |

## 五、下一步建议（若要继续）

1. 用 A 路先验证"聚合平台是否给第三方开放查询接口"——直接问高德开放平台是否有客运班次类目。
2. 同时发 B 路商务询问邮件，把 `servicecode` 清单要过来（这份清单决定能拿什么数据）。
3. 若只要"线路/班次有无"，可先用已有的结构化数据自建，接口只做校验，不做主数据源。
