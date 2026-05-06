import type { CrawlStatus, RawCrawlerPayload, Tour } from './Tour';

export interface FileSnapshot {
  cacheExists: boolean;
  rawExists: boolean;
  cacheSize: number;
}

export interface ITourRepository {
  ensureDataDirectory(): Promise<void>;
  readCachedTours(): Promise<Tour[]>;
  writeCachedTours(tours: Tour[]): Promise<void>;
  readRawCrawlerPayload(): Promise<RawCrawlerPayload>;
  readCrawlStatus(): Promise<CrawlStatus>;
  writeCrawlStatus(status: CrawlStatus): Promise<void>;
  getFileSnapshot(): Promise<FileSnapshot>;
}
