import fs from 'fs/promises';

import type { ServerEnv } from '../Configs/env';
import type { CrawlStatus, RawCrawlerPayload, Tour } from '../Contracts/Tour';
import type { FileSnapshot, ITourRepository } from '../Contracts/TourRepository';

const DEFAULT_STATUS: CrawlStatus = {
  lastCrawl: null,
  lastCrawlStatus: 'never',
  totalRecords: 0,
  sourceStats: {},
};

export class FileTourRepository implements ITourRepository {
  constructor(private readonly env: ServerEnv) {}

  async ensureDataDirectory(): Promise<void> {
    await fs.mkdir(this.env.dataDir, { recursive: true });
  }

  async readCachedTours(): Promise<Tour[]> {
    try {
      const raw = await fs.readFile(this.env.cacheFile, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (Array.isArray(parsed?.data)) {
        return parsed.data;
      }
      return [];
    } catch {
      return [];
    }
  }

  async writeCachedTours(tours: Tour[]): Promise<void> {
    await fs.writeFile(this.env.cacheFile, JSON.stringify(tours, null, 2), 'utf-8');
  }

  async readRawCrawlerPayload(): Promise<RawCrawlerPayload> {
    try {
      const raw = await fs.readFile(this.env.rawFile, 'utf-8');
      return JSON.parse(raw) as RawCrawlerPayload;
    } catch {
      return { data: [], total: 0 };
    }
  }

  async readCrawlStatus(): Promise<CrawlStatus> {
    try {
      const raw = await fs.readFile(this.env.statusFile, 'utf-8');
      return JSON.parse(raw) as CrawlStatus;
    } catch {
      return DEFAULT_STATUS;
    }
  }

  async writeCrawlStatus(status: CrawlStatus): Promise<void> {
    await fs.writeFile(this.env.statusFile, JSON.stringify(status, null, 2), 'utf-8');
  }

  async getFileSnapshot(): Promise<FileSnapshot> {
    const [cacheStat, rawStat] = await Promise.allSettled([
      fs.stat(this.env.cacheFile),
      fs.stat(this.env.rawFile),
    ]);

    return {
      cacheExists: cacheStat.status === 'fulfilled',
      rawExists: rawStat.status === 'fulfilled',
      cacheSize:
        cacheStat.status === 'fulfilled'
          ? cacheStat.value.size
          : 0,
    };
  }
}
