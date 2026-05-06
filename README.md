# 旅比价 - 静态旅行团聚合比价工具

纯静态站点，所有数据来自 `src/data/tours.ts`，筛选排序在浏览器端完成。

## 本地开发

```bash
npm install
npm run dev      # 开发服务器
npm run build    # 构建到 dist/
npm run preview  # 预览构建结果
```

## 数据更新

数据文件：`src/data/tours.ts`

### 手动更新

直接修改 `src/data/tours.ts` 中的 `tours` 数组，然后运行 `npm run build`。

### 自动更新（CI）

项目包含 GitHub Actions 工作流，支持定时自动更新数据并部署：

1. **部署工作流** (`.github/workflows/deploy.yml`)
   - 每次 push 到 master/main 时自动构建部署
   - 也可手动触发

2. **数据更新工作流** (`.github/workflows/update-data.yml`)
   - 每天凌晨 3 点自动运行
   - 可手动触发
   - 更新数据后自动提交并重新部署

### 接入真实数据源

在 `update-data.yml` 的 `数据更新步骤` 区域添加你的数据获取逻辑：

**方式一：API 接口**
```yaml
- name: Fetch tour data
  run: node scripts/fetch-data.js
  env:
    API_KEY: ${{ secrets.API_KEY }}
```

**方式二：Python 爬虫**
```yaml
- name: Setup Python
  uses: actions/setup-python@v5
  with:
    python-version: '3.11'
- name: Run crawler
  run: |
    pip install requests beautifulsoup4
    python scripts/crawler.py > data/tours.json
```

**方式三：远程 JSON 文件**
```yaml
- name: Download data
  run: curl -o src/data/tours.json ${{ secrets.DATA_URL }}
```

参考示例脚本：
- `scripts/fetch-data.example.js` — Node.js 数据获取脚本
- `scripts/crawler.example.py` — Python 爬虫脚本

复制示例文件并修改为你的实际逻辑即可。

## 部署到 GitHub Pages

1. 在仓库 Settings → Pages 中，Source 选择 "GitHub Actions"
2. push 代码到 master/main 分支，自动触发部署
3. 访问 `https://<username>.github.io/<repo-name>/`

## 项目结构

```
├── .github/workflows/     # CI/CD 工作流
│   ├── deploy.yml         # 构建部署
│   └── update-data.yml    # 定时更新数据
├── scripts/               # 数据更新脚本
│   ├── fetch-data.example.js
│   └── crawler.example.py
├── src/
│   ├── data/tours.ts      # 旅行团数据（手动或 CI 更新）
│   ├── hooks/use-tours.ts # 数据 hook（已移除 API 调用）
│   ├── sections/          # 页面组件
│   └── pages/             # 页面
└── dist/                  # 构建输出（静态站点）
```
