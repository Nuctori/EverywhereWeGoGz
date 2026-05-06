# Server Architecture Baseline

This project now uses a layered backend structure inspired by the reference project's engineering style.

## Layers

- `server/Contracts`: Type contracts and repository interfaces.
- `server/Repositories`: File-system persistence for cache, raw crawl payload, and crawl status.
- `server/Services`: Crawl orchestration, tour mapping, query filtering/sorting/paging, mock-data generation.
- `server/Configs`: Environment and runtime path configuration.
- `server/Utils`: Logger and shared error primitives.
- `server/app.ts`: HTTP route composition and error middleware.
- `server/index.ts`: Process bootstrap, data initialization, and scheduled crawling.

## API Surface

- `GET /api/health`
- `GET /api/tours`
- `GET /api/tours/:id`
- `GET /api/stats/sources`
- `GET /api/crawl/status`
- `POST /api/crawl/trigger`
- `POST /api/crawl/mock`

## Architecture Guard

Use:

```bash
npm run arch:check
```

Current constraints:

- `Contracts` must not depend on `Repositories` or `Services`.
- `Repositories` must not depend on `Services`.
- `Services` must not depend on `Repositories`.

## Build and Verification

- `npm run build` (frontend typecheck + Vite build)
- `npm run build:server` (backend TypeScript compile)
- `npm run check` (lint + architecture guard + full build chain)
