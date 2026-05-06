import { spawn } from 'child_process';
import path from 'path';

import type { ServerEnv } from '../Configs/env';
import type { CrawlStatus } from '../Contracts/Tour';
import type { ITourRepository } from '../Contracts/TourRepository';
import type { Logger } from '../Utils/Logger';
import { createMockTours } from './MockTourFactory';
import { mapRawItemsToTours } from './TourMapper';

export class CrawlerService {
  private crawling = false;

  constructor(
    private readonly env: ServerEnv,
    private readonly repository: ITourRepository,
    private readonly log: Logger,
  ) {}

  isCrawling(): boolean {
    return this.crawling;
  }

  async triggerCrawlInBackground(): Promise<{ startedAt: string }> {
    if (this.crawling) {
      throw new Error('crawler is already running');
    }

    this.crawling = true;
    const startedAt = new Date().toISOString();
    const current = await this.repository.readCrawlStatus();
    await this.repository.writeCrawlStatus({
      ...current,
      lastCrawl: startedAt,
      lastCrawlStatus: 'running',
    });

    void this.runPipeline()
      .catch((error: unknown) => {
        this.log.error('crawler pipeline failed', error);
      })
      .finally(() => {
        this.crawling = false;
      });

    return { startedAt };
  }

  async createMockData(count: number): Promise<number> {
    const tours = createMockTours(count);
    await this.repository.writeCachedTours(tours);
    await this.repository.writeCrawlStatus({
      lastCrawl: new Date().toISOString(),
      lastCrawlStatus: 'mock',
      totalRecords: tours.length,
      sourceStats: tours.reduce<Record<string, number>>((acc, tour) => {
        acc[tour.source] = (acc[tour.source] ?? 0) + 1;
        return acc;
      }, {}),
    });
    return tours.length;
  }

  async getStatus(): Promise<CrawlStatus> {
    return this.repository.readCrawlStatus();
  }

  private async runPipeline(): Promise<void> {
    const startedAt = Date.now();

    try {
      await this.runPythonScript(path.join(this.env.crawlerDir, 'travel_spider_v4.py'));
      await this.runPythonScript(path.join(this.env.crawlerDir, 'normalizer_v3.py'));

      const payload = await this.repository.readRawCrawlerPayload();
      const rawItems = payload.data ?? [];
      const tours = rawItems.length > 0 ? mapRawItemsToTours(rawItems) : createMockTours(50);
      await this.repository.writeCachedTours(tours);

      await this.repository.writeCrawlStatus({
        lastCrawl: new Date().toISOString(),
        lastCrawlStatus: 'success',
        totalRecords: tours.length,
        sourceStats: tours.reduce<Record<string, number>>((acc, tour) => {
          acc[tour.source] = (acc[tour.source] ?? 0) + 1;
          return acc;
        }, {}),
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      await this.repository.writeCrawlStatus({
        lastCrawl: new Date().toISOString(),
        lastCrawlStatus: 'error',
        totalRecords: (await this.repository.readCachedTours()).length,
        sourceStats: {},
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startedAt,
      });
      throw error;
    }
  }

  private runPythonScript(scriptFilePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
      const child = spawn(pythonExecutable, [scriptFilePath], {
        cwd: this.env.crawlerDir,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      });

      let stderr = '';

      child.stdout.on('data', (chunk) => {
        this.log.info(String(chunk).trim());
      });

      child.stderr.on('data', (chunk) => {
        stderr += String(chunk);
        this.log.warn(String(chunk).trim());
      });

      child.on('error', (error) => reject(error));
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
          return;
        }
        reject(new Error(`python exited with code ${code}: ${stderr}`));
      });
    });
  }
}
