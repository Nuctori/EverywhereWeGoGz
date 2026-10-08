# EWG AI Proxy

把 LLM 上游 key 收进 Cloudflare Worker 的服务端 secrets，前端只调本 Worker，
实现"客户端不明文"。Worker 内置整条供应商链（bigmodel GLM → SiliconFlow Qwen →
OpenRouter :free），按序重试，带 Origin 白名单 + 每 IP 限速。

## 布署

```bash
npx wrangler secret put BIGMODEL_API_KEY      # 智谱开放平台 key
npx wrangler secret put SILICONFLOW_API_KEY   # 硅基流动 key（新 key 只进这里，不进前端）
npx wrangler secret put OPENROUTER_API_KEY    # OpenRouter key
npx wrangler deploy
```

（src/worker.ts 因 Mimosa 对代理形态的 SSRF 误报无法由 agent 写入，需手动创建，
代码见会话记录；wrangler.toml 已指向 src/worker.ts。）

部署后把输出的 `https://ewg-ai-proxy.<子域>.workers.dev` 填进
`deploy.yml` / `.env.local` 的 `VITE_AI_DEFAULT_BASE_URL`（加 `/v1` 后缀）。

## 注意

- 免费版 Workers 无持久化存储，限速是每 isolate 内存近似值，防脚本小子足够，
  防不了分布式；上游仍有各自的硬限额兜底。
- 上游模型/顺序改动直接改 `src/index.js` 的 `UPSTREAMS`。
