import cors from 'cors';
import express, { type Request, type Response } from 'express';

import type { ServerEnv } from './Configs/env';
import type { TourQueryFilters } from './Contracts/Tour';
import type { ITourRepository } from './Contracts/TourRepository';
import { CrawlerService } from './Services/CrawlerService';
import { TourQueryService } from './Services/TourQueryService';
import { HttpError } from './Utils/HttpError';
import type { Logger } from './Utils/Logger';

function parseNumber(value: string | undefined): number | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toFilters(request: Request): TourQueryFilters {
  return {
    destination: typeof request.query.destination === 'string' ? request.query.destination : undefined,
    source: typeof request.query.source === 'string' ? request.query.source : undefined,
    theme: typeof request.query.theme === 'string' ? request.query.theme : undefined,
    minPrice: parseNumber(typeof request.query.minPrice === 'string' ? request.query.minPrice : undefined),
    maxPrice: parseNumber(typeof request.query.maxPrice === 'string' ? request.query.maxPrice : undefined),
    duration: parseNumber(typeof request.query.duration === 'string' ? request.query.duration : undefined),
    sortBy: typeof request.query.sortBy === 'string' ? request.query.sortBy as TourQueryFilters['sortBy'] : 'hot',
    page: parseNumber(typeof request.query.page === 'string' ? request.query.page : undefined),
    limit: parseNumber(typeof request.query.limit === 'string' ? request.query.limit : undefined),
  };
}

export interface ServerDependencies {
  env: ServerEnv;
  repository: ITourRepository;
  crawlerService: CrawlerService;
  tourQueryService: TourQueryService;
  logger: Logger;
}

export function createServerApp(deps: ServerDependencies) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      isCrawling: deps.crawlerService.isCrawling(),
    });
  });

  app.get('/api/tours', async (req, res, next) => {
    try {
      const filters = toFilters(req);
      let tours = await deps.repository.readCachedTours();
      if (tours.length === 0 && deps.env.autoSeedMockData) {
        await deps.crawlerService.createMockData(50);
        tours = await deps.repository.readCachedTours();
      }
      const result = deps.tourQueryService.query(tours, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/tours/:id', async (req, res, next) => {
    try {
      const tours = await deps.repository.readCachedTours();
      const tour = tours.find((item) => item.id === req.params.id);
      if (!tour) {
        throw new HttpError(404, 'Tour not found');
      }
      res.json(tour);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/stats/sources', async (_req, res, next) => {
    try {
      const tours = await deps.repository.readCachedTours();
      const stats = tours.reduce<Record<string, number>>((acc, tour) => {
        acc[tour.source] = (acc[tour.source] ?? 0) + 1;
        return acc;
      }, {});
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/crawl/status', async (_req, res, next) => {
    try {
      const [status, snapshot] = await Promise.all([
        deps.crawlerService.getStatus(),
        deps.repository.getFileSnapshot(),
      ]);
      res.json({
        ...status,
        isCrawling: deps.crawlerService.isCrawling(),
        ...snapshot,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/crawl/trigger', async (_req, res, next) => {
    try {
      if (deps.crawlerService.isCrawling()) {
        throw new HttpError(409, 'Crawler is already running');
      }
      const result = await deps.crawlerService.triggerCrawlInBackground();
      res.json({ message: 'Crawler started', ...result });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/crawl/mock', async (req, res, next) => {
    try {
      const requestedCount = typeof req.body?.count === 'number' ? req.body.count : 50;
      const count = Math.max(1, Math.min(500, Math.floor(requestedCount)));
      const created = await deps.crawlerService.createMockData(count);
      res.json({ message: 'Mock data generated', count: created });
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: Request, res: Response, next: () => void) => {
    void next;
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    deps.logger.error('unhandled server error', error);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
