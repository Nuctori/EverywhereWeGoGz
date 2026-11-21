# EWG AI Proxy

把 LLM 上游 key 收进 Cloudflare Worker 的服务端 secrets，前端只调本 Worker，
实现"客户端不明文"。Worker 内置整条供应商链（bigmodel GLM → SiliconFlow Qwen →
OpenRouter :free），按序重试，带 Origin 白名单 + 每 IP 限速。

## Kilo 免 Key 备用线路（默认关闭）

启用 `ENABLE_KILO_FREE=1` 后，智谱未成功时依次尝试 `reflection/beam-free` 和 `nvidia/nemotron-3.5-super-vl:free` 两个固定免费 id，再回到原有备用链。2026-11-21 原 `dots-studio/dots-3-note-preview:free`、`baidu/ernie-5.5-flash-preview:free` 已在网关 404，换成同网关实测 200 的两个 id。Kilo 不接收浏览器鉴权头；每个模型最多等 6 秒获得有效正文，并受整条链 25 秒预算约束；一旦开始转发响应，不拼接另一模型的流。

仅在实际 Worker 出口验证中文需求解析、完整排序流和故障切换后开启。这两个模型共享 Kilo 网关和出口限额，并非两个独立供应商。移除开关或设为 `0` 可恢复旧链。Kilo 免费池轮换很快，`/api/gateway/models` 里标 `:free` 的 id 才可用。

## 新增免费线路（默认关闭）

`ENABLE_EXTRA_KEYLESS=1`：按 BlockRun → LLM7 → OVHcloud 顺序尝试境外匿名线路，全部不带 key、不转发客户端鉴权。顺序来自 2026-11-21 的真实中文 JSON 抽取压测（BlockRun 1.5s 且字段最全，OVH 质量好但只有 2 RPM/IP，放最后）。

- BlockRun `https://blockrun.ai/api/v1`，默认 `poolside/laguna-xs-2.1`（`BLOCKRUN_MODEL` 可换），30 RPM / 300 req/h per IP；网关可能替换模型，不要假设模型身份。
- LLM7 `https://api.llm7.io/v1`，默认 `gpt-oss:20b`（`LLM7_MODEL` 可换），有免费 token 时放 `LLM7_TOKEN`。
- OVHcloud `https://oai.endpoints.kepler.ai.cloud.ovh.net/v1`，默认 `Qwen3.8-27B`（`OVH_MODEL` 可换），匿名 2 RPM/IP/模型。

2026-11-21 家宽出口实测三条均返回正常正文；Worker 是共享出口，限流表现会明显更差，开启前必须在隔离 Worker 里跑通中文需求解析与排序流。匿名不等于保密：这三家会看到用户需求原文，且可能用于训练。

`ENABLE_OPENCODE_ZEN=1`：OpenCode Zen 免费额度。按 `sst/opencode` 的 `session/llm/request.ts` 复刻客户端指纹（`User-Agent: opencode/<版本>` + `x-opencode-session` / `x-opencode-request` / `x-opencode-client`，配置了 `OPENCODE_PROJECT_ID` 才带 `x-opencode-project`），端点 `https://opencode.ai/inference/openai/v1`，鉴权默认 `Bearer public`（`OPENCODE_ZEN_KEY` 可覆盖），模型默认 `big-pickle`（`OPENCODE_ZEN_MODEL` 可换）。

2026-11-21 实测：Zen 的 `/v1/models` 列出 12 个 $0 模型，但 `/chat/completions` 带不带 opencode 头都返回 429 `FreeUsageLimitError`（官方文档同样写明免费额度需要 OpenCode 客户端）。头是必要条件而非充分条件，且第三方报告称 Zen 封 Cloudflare Worker 出口 IP。因此该线路只作 best-effort 保留，默认关闭；配额判定条件变化前不要依赖它。

完整调研（各供应商 base URL、免费额度、实测证据、已下架名单）见 [`docs/free-llm-pool-survey.md`](docs/free-llm-pool-survey.md)。

## 额外匿名兜底（默认关闭）

- `ENABLE_POLLINATIONS_CLASSIC=1`：仅用于明确设置了短输出预算（不超过 768 tokens）的非流式请求。使用 Classic 公共入口，402 时按 `Retry-After` 冷却，不支付也不补发。
- `AI_HORDE_JSON_MODEL` / `AI_HORDE_SSE_MODEL`：分别配置通过验证的固定模型 ID。匿名调用，只用受信节点，无法及时服务就快速失败，不自动缩短输入。

这两条线路在现有上游之后、共享 25 秒预算，不转发客户端鉴权。仅在隔离 Worker 实测相应模式通过后配置生产变量；匿名不等于保密，不应发送凭据或敏感信息。

## 被动健康路由

每个 Worker 实例按上游候选和 JSON/SSE 模式记录冷却；失败后跳过，冷却到期只放行一条真实请求试探。429/503 有有效 `Retry-After` 时按它冷却，默认 30 秒。所有候选暂不可用且本次未发上游请求时，返回 503 和 `Retry-After`。已转发的响应不会与其他上游拼接。

通过 Worker 实时日志查看 `ai_upstream` 的跳过、试探、首个有效正文判定和耗时；不记录用户正文或 Key。流式成功仅代表已出现有效正文，不代表后续流完整。明确的 Kilo 全网关限流跨两个模型和 JSON/SSE 共享冷却；其他 429 只影响当前上游与模式。健康状态不会跨实例共享，且没有定时探测。

## 布署

```bash
npx wrangler secret put BIGMODEL_API_KEY      # 智谱开放平台 key（账号 1）
npx wrangler secret put BIGMODEL_API_KEY_2    # 智谱第二账号 key（可选；配置即启用双 key 轮换）
npx wrangler secret put SILICONFLOW_API_KEY   # 硅基流动 key（新 key 只进这里，不进前端）
npx wrangler secret put OPENROUTER_API_KEY    # OpenRouter key
npx wrangler secret put OPENROUTER_API_KEY_2  # OpenRouter 第二把 key（双把轮换免费日额度）
npx wrangler deploy --keep-vars --var ENABLE_KILO_FREE:1
```

可选开关（同样走 `--var`）：`ENABLE_EXTRA_KEYLESS=1`、`ENABLE_OPENCODE_ZEN=1`；可选覆盖 `OVH_MODEL` / `LLM7_MODEL` / `LLM7_TOKEN` / `BLOCKRUN_MODEL` / `OPENCODE_ZEN_MODEL` / `OPENCODE_ZEN_KEY` / `OPENCODE_VERSION` / `OPENCODE_CLIENT` / `OPENCODE_PROJECT_ID` / `OPENROUTER_MODEL`。

OpenRouter 线路的默认免费 id 为 `google/gemma-4-26b-a4b-it:free`。2026-11-21 原来的 `poolside/laguna-xs-2.1:free` 已从 OpenRouter 目录整体下架（`/api/v1/models` 里已无任何 poolside 条目），换 id 前保持 `:free` 后缀，否则该候选会被 `endsWith(':free')` 判断直接跳过。

从 `cloudflare/ai-proxy` 目录执行。现有前端继续使用 `https://ai.114124.xyz/v1`，不需要重新发布前端。

故障优先切换可用候选；仅智谱明确返回 1305 且没有 `Retry-After` 时，首次请求在预算内短等 800 毫秒再试一次。请求级 400、413、422 不触发冷却；持续推理帧延长空闲窗口，但不突破整条链预算。

## 注意

- 免费版 Workers 无持久化存储，限速是每 isolate 内存近似值，防脚本小子足够，
  防不了分布式；上游仍有各自的硬限额兜底。
- 上游、免费模型白名单和路由顺序由 `ai-worker/worker.ts` 固定。
