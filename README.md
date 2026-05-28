# 旅游比价 - 静态旅行团聚合工具

这是一个纯静态 React/Vite 站点。前台不直接读取 TypeScript 数据数组，而是读取 `public/data` 下的 JSON 构建产物：

- 列表页：`public/data/tours-list.json`
- 详情弹窗：`public/data/tour-details/*.json`
- 后台数据概览：`public/data/tours-meta.json`
- 原始全量数据：`public/data/tours.json`

筛选、排序、搜索和详情弹窗都在浏览器端完成，不依赖后端服务。

## 本地开发

```bash
npm install
npm run dev
npm run build
npm run preview
```

## 数据更新流程

1. 更新或重新生成 `public/data/tours.json`。
2. 运行 `npm run data:split`，生成：
   - `public/data/tours-list.json`
   - `public/data/tour-details/*.json`
   - `public/data/tours-meta.json`
3. 运行 `npm run build` 验证构建产物。

`npm run build` 会自动先执行 `npm run data:split`，再进行 TypeScript 检查和 Vite 构建。

## 静态数据说明

`src/data/tours.ts` 目前只保留来源、目的地、主题等前台筛选元数据，不再作为旅行团列表的真实数据源。

后台页显示的是 `public/data/tours-meta.json` 中的静态快照，包括记录数、文件大小、详情分片数、来源分布和生成时间。它不会在浏览器里启动爬虫，也不会生成模拟数据。

## 目录结构

```text
public/data/
  tours.json              原始全量数据
  tours-list.json         前台列表数据
  tours-meta.json         后台概览元信息
  tour-details/           按线路 id 拆分的详情数据

scripts/
  split_tour_data.mjs     将全量数据拆成列表、详情和元信息

src/
  sections/               前台页面组件
  pages/Admin.tsx         静态数据概览页
  hooks/use-tours.ts      后台元信息读取 hook
  data/tours.ts           筛选选项元数据
```

## 部署

仓库已配置 Cloudflare Workers workflow。push 到 `master` 或手动触发 `.github/workflows/deploy.yml` 后，会自动运行构建并通过 `wrangler deploy` 发布 `dist/`。

GitHub Actions 需要配置仓库密钥 `CLOUDFLARE_API_TOKEN`，否则 Workers 发布会在鉴权阶段失败。

部署前构建会重新生成 `public/data` 下的 JSON、详情分片和元信息，并执行数据完整性审计。
