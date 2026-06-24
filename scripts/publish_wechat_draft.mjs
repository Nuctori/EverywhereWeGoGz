import path from 'node:path';
import { publishMarkdownArticle } from './lib/wechat_publish.mjs';

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--article' && next) {
      options.articlePath = next;
      index += 1;
    } else if (arg === '--out-dir' && next) {
      options.outDir = next;
      index += 1;
    } else if (arg === '--date' && next) {
      options.runDate = next;
      index += 1;
    } else if (arg === '--source-url' && next) {
      options.sourceUrl = next;
      index += 1;
    }
  }
  return options;
}

async function main() {
  const rootDir = process.cwd();
  const options = parseArgs(process.argv.slice(2));
  const result = await publishMarkdownArticle(rootDir, options);
  console.log(JSON.stringify({
    ok: true,
    mediaId: result.mediaId,
    articlePath: path.relative(rootDir, result.articlePath),
    payloadPath: path.relative(rootDir, result.payloadPath),
    proxyUsed: result.proxyUsed,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
