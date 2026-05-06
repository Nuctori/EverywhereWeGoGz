import path from 'path';

function toBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true';
}

export interface ServerEnv {
  port: number;
  dataDir: string;
  crawlerDir: string;
  cacheFile: string;
  rawFile: string;
  statusFile: string;
  crawlCron: string;
  autoSeedMockData: boolean;
}

export function loadServerEnv(cwd = process.cwd()): ServerEnv {
  const dataDir = process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.resolve(cwd, 'data');

  const crawlerDir = process.env.CRAWLER_DIR
    ? path.resolve(process.env.CRAWLER_DIR)
    : path.resolve(cwd, 'crawler');

  return {
    port: Number(process.env.API_PORT ?? 3001),
    dataDir,
    crawlerDir,
    cacheFile: path.join(dataDir, 'travel_frontend.json'),
    rawFile: path.join(dataDir, 'travel_agg_v4.json'),
    statusFile: path.join(dataDir, 'crawl_status.json'),
    crawlCron: process.env.CRAWL_CRON ?? '0 3 * * *',
    autoSeedMockData: toBoolean(process.env.AUTO_SEED_MOCK_DATA, true),
  };
}
