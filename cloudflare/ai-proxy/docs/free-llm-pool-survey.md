# 免费 LLM 上游调研（2026-11-21）

目标：给 `ai.114124.xyz` 的号池找可长期白嫖的公开接口，并把"看起来像 OpenCode 客户端"的请求头结论落成可执行方案。

## 0. 结论先行

| 结论 | 依据 |
| --- | --- |
| 现号池里 Kilo 的两条免费 id 已经失效（404） | 2026-11-21 实测 `dots-studio/dots-3-note-preview:free`、`baidu/ernie-5.5-flash-preview:free` 均 404；同一网关的 `reflection/beam-free`、`nvidia/nemotron-3.5-super-vl:free` 仍 200 |
| 免 key 线路里最值得先开的是 BlockRun，OVH 只能垫底 | 同一句中文需求：BlockRun 1.5s 且字段最全；OVH 首次 0.9s 正确但 2 RPM/IP，第二次就 429 |
| OpenCode Zen 免费额度**不能**靠改请求头拿到 | 官方文档写明"Free-tier chat models require OpenCode"；实测带头/不带头都是 429 `FreeUsageLimitError` |
| 免费 key 里质量最高的是 Google AI Studio Gemini | 免费档、OpenAI 兼容、中文最强；限额不再公开，只能登录 AI Studio 看 |
| Cloudflare Worker 出口是最大约束 | 上游会对共享出口 IP 限流/WAF；`api.z.ai` 已被 WAF 拦成 405（仓库既有结论），OpenCode Zen 另有第三方报告直接封 CF Worker IP |

## 1. 现号池快照（`ai-worker/worker.ts`）

顺序：智谱 GLM-4.7-Flash（1–2 把 key）→ Kilo 免费两条（`ENABLE_KILO_FREE=1`）→ 硅基流动 Qwen3.5-4B → OpenRouter `:free`（1–2 把 key）→ Pollinations Classic（`ENABLE_POLLINATIONS_CLASSIC=1`，≤768 tokens JSON）→ AI Horde（配置模型 id 才启用）。

## 2. 证据等级

- **实测 200**：2026-11-21 从本机（中国大陆家宽出口）真实 POST，拿到正常正文。**不等于** Worker 出口可用。
- **文档**：厂商/聚合目录写明免费，但本次未打。
- **未验**：注册门槛或额度条件不明确。

## 3. 第一梯队：无 key 匿名（最适合 Worker）

| 供应商 | Base URL | 模型 id（示例） | 限额 | 本次实测 |
| --- | --- | --- | --- | --- |
| BlockRun | `https://blockrun.ai/api/v1/chat/completions` | `poolside/laguna-xs-2.1`、`nvidia/muse-glimmer-30b` | 30 RPM / 300 req/h/IP | 200（0.7s / 1.5s），会替换模型 |
| LLM7.io | `https://api.llm7.io/v1/chat/completions` | `gpt-oss:20b`、`nemotron-3-nano:30b`、`mistral-Nemo-Instruct-2407`、`codestral-latest` | 匿名可用 turbo 档；免费 token 60 RPM / 250 req/h / 100k tokens/24h | 200（3.2s） |
| Kilo Code | `https://ai-gateway.kilo.ai/api/v1/chat/completions` | `reflection/beam-free`、`nvidia/nemotron-3.5-super-vl:free`、`kilo-auto/free`、`openrouter/free` | 200 req/h/IP，全池共享 | 200，中文正常（1.8–4.7s） |
| OVHcloud AI Endpoints | `https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions` | `Qwen3.8-27B`、`Qwen3.6-27B`、`gpt-oss-120b`、`Meta-Llama-3_3-70B-Instruct` | 匿名 2 RPM/IP/模型 | 首次 200（0.9s），连续请求即 429 |
| Pollinations | `https://text.pollinations.ai/openai` | `openai` | 已接入，402 冷却 | 既有 |
| VLM Run Gateway | `https://gateway.vlm.run/v1/openai/chat/completions` | `qwen/qwen3.8-27b`、`qwen/qwen3.5-0.8b` | 10 RPM / 30 req/h / 100 req/day/IP | **失败**（本机 fetch 直接 TLS 失败，需再验） |

注意：这四家都会看到用户需求原文，且多数保留/可能训练数据；只适合放非敏感请求。

流式（`stream: true`）复测，2026-11-21：

| 供应商 | SSE | 备注 |
| --- | --- | --- |
| OVHcloud | 首次 JSON 200；连续请求后 429 `API rate limit exceeded` | 2 RPM/IP/模型 的限额是真的，只能当低频兜底 |
| LLM7 | 200 `text/event-stream`，首个 `chat.completion.chunk` 正常 | 可用 |
| BlockRun | 200 `text/event-stream` | 网关会**替换模型**：请求 `poolside/laguna-xs-2.1`，分片里回的是 `nvidia/nemotron-…`，不要假设模型身份 |
| OpenCode Zen | 429 `FreeUsageLimitError` | 见第 6 节 |

### 3.1 中文 JSON 抽取压测（决定顺序）

同一句真实需求（桂林四天、带爸妈、坐船看漓江、人均 3000），要求只输出 JSON：

| 线路 | 延迟 | 结果 | 判断 |
| --- | --- | --- | --- |
| BlockRun `poolside/laguna-xs-2.1` | 1.5s | ✅ `{"destination":"桂林","days":4,"must":["带爸妈","坐船看漓江"],"budget":3000}` | 最快且 `must` 更全 |
| Kilo `reflection/beam-free` | 4.7s | ✅ 同结构，字段正确 | 稳定但慢 |
| LLM7 `gpt-oss:20b` | 3.3s | ✅ 同结构 | 可用 |
| Kilo `openrouter/free` | 3.1s | ⚠️ 路由到 `nemotron-3-nano-omni…`，`content` 时有时无 | 只作末位 |
| Kilo `nemotron-3.5-super-vl/lightning` | 1.8–2.1s | ⚠️ 本机间歇 TLS 失败 | 网关侧不稳 |
| OVH `Qwen3.8-27B` | 0.9s | ✅ 首次正确，第 2 次起 429 | 质量好但 2 RPM 太紧 |

结论：匿名线路顺序定为 **BlockRun → LLM7 → OVH**（`worker.ts` 已按此排序）。

## 4. 第二梯队：免费 key（注册、无卡）

按对本项目（中文出行意图解析 + 排序流）的价值排序。

| 供应商 | Base URL | 代表模型 | 免费额度 | 备注 |
| --- | --- | --- | --- | --- |
| Google AI Studio | `https://generativelanguage.googleapis.com/v1beta/openai/` | `gemini-3.8-flash`、`gemini-3.6-flash`、`gemini-3.5-flash-lite`、`gemma-4-31b-it` | 免费档按模型计，具体限额登录 AI Studio 看 | 中文最好；免费档数据会被 Google 用于改进产品 |
| Groq | `https://api.groq.com/openai/v1` | `openai/gpt-oss-120b`、`qwen/qwen3.8-27b` | 30 RPM / 1000 RPD / 8k TPM / 200k TPD | 速度极快，适合兜底首字延迟 |
| NVIDIA NIM | `https://integrate.api.nvidia.com/v1` | `z-ai/glm-5.3-flash`、`deepseek-ai/deepseek-v4.1-flash`、`nvidia/nemotron-3-ultra-550b-a55b` | 40 RPM / 10k RPD | 需 NVIDIA 开发者账号；NVIDIA 免费端点仅供试用，勿发敏感数据 |
| Cloudflare Workers AI | `https://api.cloudflare.com/client/v4/accounts/{id}/ai/v1` | `@cf/qwen/qwen3.8-27b`、`@cf/zai-org/glm-4.7-flash`、`@cf/openai/gpt-oss-120b`、`@cf/google/gemma-4-26b-a4b-it` | 10k neurons/day | 同账号内调用，**没有跨厂商出口问题**，是 Worker 架构最省事的一条 |
| Mistral | `https://api.mistral.ai/v1` | `mistral-small-4`、`mistral-medium-3.5` | Free mode 默认开启，数值限额不公开 | 免费档数据默认用于训练（可 opt-out） |
| OpenRouter（已有） | `https://openrouter.ai/api/v1` | 现有 `:free` + `openrouter/free` 路由 | 20 RPM / 50 RPD；累计充值 ≥10 credits 放宽到 1000 RPD | 多把 key 轮换可叠加日额度 |
| Requesty | `https://router.requesty.ai/v1` | `nvidia/nemotron-3-ultra-550b-a55b` 等 | 200 RPD | 免费计划只服务 free 模型 |
| AIHubMix | `https://aihubmix.com/v1` | `coding-glm-5.2-free`、`coding-kimi-k3-free` | 5 RPM / 100 req/day / 1M tokens/day | 另有 Anthropic 格式端点 |
| Infron | `https://llm.onerouter.pro/v1` | `qwen/qwen3.8-27b:free` | 1000 RPD | 需保持 ≥$5 余额才可用标准模型 |
| AnyAPI | `https://api.anyapi.ai/v1` | `qwen/qwen3.8-27b:free`、`ling-3.0-flash-fin:free` | 100k AnyTokens/day | — |
| BazaarLink | `https://api.bazaarlink.ai/v1` | `auto:free`、`deepseek-v4-flash-0731free:free` | 10 RPM / 60 units/day（无充值） | — |
| Routeway | `https://api.routeway.ai/v1` | `deepseek-v4.1-flash:free`、`muse-glimmer-30b:free` | 文档口径不一致（5–20 RPM） | — |
| Token Harbor | `https://tokenharbor.ai/v1` | `deepseek-v4.1-flash:free`、`mimo-v2.6-flash:free` | 滚动 7 天价值额度 | — |
| Nous Portal | `https://inference-api.nousresearch.com/v1` | `stepfun/step-3.7-flash:free` | 免费计划 | — |
| ModelScope | `https://api-inference.modelscope.cn/v1` | `Qwen/Qwen3.5-35B-A3B`、`deepseek-ai/DeepSeek-V4.1-Flash` | 2000 RPD/账号（单模型 ≤500） | 需阿里云绑定 + 实名，境内出口友好 |
| 阿里百炼（国际站） | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `qwen3.8-flash`、`qwen3.8-max` | 每模型 1M tokens 一次性（90 天） | 试用，不是长期免费 |
| 火山方舟 | `https://ark.cn-beijing.volces.com/api/v3` | 新用户推理试用 | 一次性 token 额度 | 需手机号注册 |
| 讯飞星火 Lite | `https://spark-api-open.xf-yun.com/v1` | `lite` | 不公开 | 境内、中文稳 |
| 腾讯 TokenHub | `https://tokenhub.tencentmaas.com/v1` | `kimi-k3`、`glm-5.3`、`hy3` | 促销包 1M tokens/模型 | 促销，随时结束 |
| 商汤 SenseNova | `https://token.sensenova.cn/v1` | `sensenova-6.8-flash-lite` | 公测期不公开 | 公测可能随时收紧 |
| 硅基流动（已有） | `https://api.siliconflow.cn/v1` | `Qwen/Qwen3.5-4B` | 需实名 | 既有 |

## 5. 不建议 / 已死

- **客户端绑定型**：Cline、Kiro、Cursor、Google Antigravity、GitHub Copilot Free、CodeBuddy、TRAE、Qoder、JetBrains AI、ZCode。它们的"免费"只存在于自家客户端内，没有可复用的公开 API；接入等于逆向客户端，超出范围。
- **一次性试用**：Together AI（需预付激活）、AMD Radeon Token Factory、Fireworks、Hetzner Inference、FreeInference、Dahl、Regolo、IteraCompute、Sarvam、Sail Research。数字好看但一次性，不适合做长期兜底。
- **已下架/停服**（聚合目录 2026-11 记录）：Cerebras（要卡）、SambaNova（要卡）、GitHub Models（2026-07-30 关停）、HuggingFace Inference（免费额度取消）、DeepSeek Platform（无免费额度）、Poolside Platform（2026-10-31 关停）、MiMo Code（匿名通道 2026-07-26 结束）、LongCat、Reka、AI21、Scaleway、Infomaniak、Kenari（逆向池化 ChatGPT/Codex 凭据，已按"有因拒绝"剔除）。
- **`api.z.ai`**：key 有效但 Worker 出口被 WAF 拦成 405 HTML（仓库既有结论），不要再试。

## 6. OpenCode 请求头（核心结论）

### 6.1 官方实现

源码 `sst/opencode` → `packages/opencode/src/session/llm/request.ts`（提交 47f33329 可读）：

```ts
const USER_AGENT = `opencode/${InstallationVersion}`

headers: {
  ...(input.model.providerID.startsWith("opencode")
    ? {
        ...(opencodeProjectID ? { "x-opencode-project": opencodeProjectID } : {}),
        "x-opencode-session": input.sessionID,
        "x-opencode-request": input.user.id,
        "x-opencode-client": input.flags.client,
        "User-Agent": USER_AGENT,
      }
    : {
        "x-session-affinity": input.sessionID,
        ...(input.parentSessionID ? { "x-parent-session-id": input.parentSessionID } : {}),
        "User-Agent": USER_AGENT,
      }),
  ...input.model.headers,
  ...headers,   // 插件 chat.headers 钩子
}
```

要点：

1. **所有上游**都带 `User-Agent: opencode/<版本>`。
2. **只有 OpenCode 自家 provider**（`opencode/*`，即 Zen/Console）才带 `x-opencode-project` / `x-opencode-session` / `x-opencode-request` / `x-opencode-client`。
3. 第三方 provider 走 `x-session-affinity`（+ 可选 `x-parent-session-id`），**没有** `x-opencode-*`。
4. 头之外还有一层：`model.headers` 与插件钩子可以再追加头。

### 6.2 Zen 免费额度到底怎么放行

官方文档 `opencode.ai/docs/console/models` 原话：

> "Free-tier chat models require OpenCode; use paid models or Go from other clients."

2026-11-21 实测（家宽出口，`Authorization: Bearer public`）：

| 请求 | 结果 |
| --- | --- |
| `GET /zen/v1/models` | 200，104 个模型，其中 12 个 input/output 价格 = 0 |
| `POST /zen/v1/chat/completions`（`big-pickle`，带完整 opencode 头） | **429** `FreeUsageLimitError` |
| 同上（不带任何 opencode 头） | **429**，同样文案 |
| `POST /inference/openai/v1/chat/completions` | **429**，同样文案 |
| 响应头 | `retry-after: 37477`（≈10.4h，接近次日 UTC 零点重置） |

12 个 $0 模型：`big-pickle`、`mimo-v2.6-flash-free`、`deepseek-v4.1-flash-free`、`longcat-2.5-free`、`iceman-free`、`beam-free`、`flint-40b-free`、`nemotron-3.5-super-vl-free`、`jev-1.13-free`、`nemotron-3.5-lightning-free`、`hy4-flash-free`、`tidepool-alpha-free`。

**结论：改头不等于拿到额度。** 发头是必要条件，额度另外由「每日 IP/会话配额 + 客户端身份」共同裁定；公开 token `public` 只负责免登录，不负责免限流。另有第三方报告称 Zen 直接封 Cloudflare Worker 出口 IP，若要在 Worker 里试，必须先在生产出口实测（Worker 内是共享 IP，命中率更低）。

### 6.3 落地方式

`worker.ts` 里的 `opencodeClientHeaders()` 已按源码复刻（UA + 四个头，`x-opencode-project` 仅在配置 `OPENCODE_PROJECT_ID` 时附带），挂在 `ENABLE_OPENCODE_ZEN=1` 的候选上：

- 端点 `https://opencode.ai/inference/openai/v1/chat/completions`
- 鉴权 `Authorization: Bearer ${OPENCODE_ZEN_KEY || 'public'}`
- 模型默认 `big-pickle`，可用 `OPENCODE_ZEN_MODEL` 换
- 默认关闭；429 只冷却该候选 30 秒（或按 `Retry-After`），不影响主链

## 7. 建议的接入顺序

1. **修 Kilo**（零成本、已验证）：换成 `reflection/beam-free` + `nvidia/nemotron-3.5-super-vl:free`。
2. **加匿名组**（零注册）：`ENABLE_EXTRA_KEYLESS=1`，顺序 BlockRun → LLM7 → OVH，`BLOCKRUN_MODEL` / `LLM7_MODEL` / `OVH_MODEL` 可换。
3. **加 Workers AI**（最稳，不跨出口）：同账号绑 `@cf/zai-org/glm-4.7-flash` 作境内兜底。
4. **加 Gemini**（质量优先）：拿 AI Studio key 进 secret，放主链之后第一位有 key 的兜底。
5. **再考虑** Groq / NIM / Requesty / AIHubMix 扩面，按 key 数量堆叠。
6. **OpenCode Zen**：等 Worker 出口实测通过再开，否则只留代码不启用。

## 8. 风险

- **数据出境**：OVH（EU）、LLM7（UK）、BlockRun、Gemini、Groq 都会看到原始需求文本；用户输入里可能有日期、人数、偏好，不含身份信息，但仍是出境。
- **训练条款**：Gemini 免费档、Mistral Free、LLM7、BlockRun、Kilo 部分模型都声明可能用于训练/改进。
- **额度共享**：Kilo 200 req/h 与 Zen 的日额度都按 IP；Worker 是共享出口，实际可用量远低于本机测试。
- **随时消失**：免费 id 下架速度很快（本次就抓到两条 404），必须靠 `X-EWG-Upstream` 日志 + 冷却统计持续观察。
- **不要做的事**：不要把客户端 `Authorization` 转发给匿名线路（现实现已保证），不要用匿名线路传用户凭据，不要为了额度去逆向私有客户端。
