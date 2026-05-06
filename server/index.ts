import cron from 'node-cron';

import { createServerApp } from './app';
import { loadServerEnv } from './Configs/env';
import { FileTourRepository } from './Repositories/FileTourRepository';
import { CrawlerService } from './Services/CrawlerService';
import { TourQueryService } from './Services/TourQueryService';
import { logger } from './Utils/Logger';

async function bootstrap() {
  const env = loadServerEnv();
  const repository = new FileTourRepository(env);
  const crawlerService = new CrawlerService(env, repository, logger);
  const tourQueryService = new TourQueryService();

  await repository.ensureDataDirectory();

  const existingTours = await repository.readCachedTours();
  if (existingTours.length === 0 && env.autoSeedMockData) {
    await crawlerService.createMockData(50);
    logger.info('no cache found, seeded mock tours');
  }

  const app = createServerApp({
    env,
    repository,
    crawlerService,
    tourQueryService,
    logger,
  });

  if (process.argv.includes('--crawl-only')) {
    logger.info('crawl-only mode enabled');
    const result = await crawlerService.triggerCrawlInBackground();
    logger.info(`crawl started at ${result.startedAt}`);
    while (crawlerService.isCrawling()) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    logger.info('crawl-only mode completed');
    return;
  }

  app.listen(env.port, () => {
    logger.info(`API server running on http://localhost:${env.port}`);
    logger.info(`Data directory: ${env.dataDir}`);
    logger.info(`Crawler directory: ${env.crawlerDir}`);
  });

  cron.schedule(env.crawlCron, () => {
    if (crawlerService.isCrawling()) {
      return;
    }
    logger.info('scheduled crawl triggered');
    void crawlerService.triggerCrawlInBackground().catch((error: unknown) => {
      logger.error('scheduled crawl failed to start', error);
    });
  });
}

void bootstrap().catch((error: unknown) => {
  logger.error('server bootstrap failed', error);
  process.exitCode = 1;
});
