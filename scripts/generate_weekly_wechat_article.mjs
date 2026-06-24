import fs from 'node:fs';
import path from 'node:path';
import {
  enrichWeeklyArticleMedia,
  getDefaultWebsiteUrl,
} from './lib/weekly_wechat_article.mjs';
import { generateWeeklyArticleWithAgentCli } from './lib/weekly_wechat_agent_cli.mjs';

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--date' && next) {
      options.runDate = next;
      index += 1;
    } else if (arg === '--out-dir' && next) {
      options.outDir = next;
      index += 1;
    } else if (arg === '--window-days' && next) {
      options.windowDays = Number(next);
      index += 1;
    } else if (arg === '--max-candidates' && next) {
      options.maxCandidates = Number(next);
      index += 1;
    } else if (arg === '--max-article-items' && next) {
      options.maxArticleItems = Number(next);
      index += 1;
    } else if (arg === '--variant-count' && next) {
      options.variantCount = Number(next);
      index += 1;
    } else if (arg === '--aider-model' && next) {
      options.aiderModel = next;
      index += 1;
    }
  }
  return options;
}

async function main() {
  const rootDir = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const result = await generateWeeklyArticleWithAgentCli(rootDir, args);
  const articleWithMedia = enrichWeeklyArticleMedia(result.article, result.context, {
    websiteUrl: getDefaultWebsiteUrl(),
  });
  fs.writeFileSync(path.join(result.outDir, 'article.md'), `${articleWithMedia.trim()}\n`, 'utf8');
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
