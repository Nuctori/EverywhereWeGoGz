# Travel Aggregation App

React + Vite frontend with a TypeScript Express backend for crawl-driven tour aggregation.

## Quick Start

```bash
npm install
npm run dev
```

This starts:

- frontend: `http://localhost:3000`
- backend: `http://localhost:3001`

## Core Scripts

- `npm run dev`: run frontend + backend concurrently
- `npm run build`: frontend typecheck + production build
- `npm run build:server`: backend compile
- `npm run lint`: frontend lint
- `npm run arch:check`: backend layering constraint check
- `npm run check`: lint + architecture + frontend build + backend build

## Backend Baseline

The backend is split by responsibility:

- `server/Contracts`
- `server/Repositories`
- `server/Services`
- `server/Configs`
- `server/Utils`

Detailed notes: [`docs/server-architecture.md`](docs/server-architecture.md)

## Environment

Copy `.env.example` and override values as needed:

- `API_PORT`
- `DATA_DIR`
- `CRAWLER_DIR`
- `CRAWL_CRON`
- `AUTO_SEED_MOCK_DATA`
