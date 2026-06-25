import fs from 'node:fs';
import path from 'node:path';
import {
  buildWeeklyArticleContext,
  buildWeeklyArticlePrompt,
  defaultOutputDir,
  ensureDir,
  generateWeeklyArticle,
  loadEnvFiles,
  readToursData,
  resolveDeepSeekConfig,
  toDateKey,
  validateGeneratedArticle,
  writeJson,
} from './lib/weekly_wechat_article.mjs';

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
    }
  }
  return options;
}

async function main() {
  const rootDir = process.cwd();
  loadEnvFiles(rootDir);
  const args = parseArgs(process.argv.slice(2));
  const runDate = args.runDate || toDateKey();
  const tours = readToursData(rootDir);
  const context = buildWeeklyArticleContext(tours, {
    runDate,
    windowDays: args.windowDays,
    maxCandidates: args.maxCandidates,
    maxArticleItems: args.maxArticleItems,
  });
  const outDir = args.outDir ? path.resolve(rootDir, args.outDir) : defaultOutputDir(rootDir, runDate);

  ensureDir(outDir);
  writeJson(path.join(outDir, 'weekly-context.json'), context);
  writeJson(path.join(outDir, 'selected-tours.json'), context.selectedTours);
  const config = resolveDeepSeekConfig();

  try {
    const generated = await generateWeeklyArticle(context, config, { outputDir: outDir });
    const validation = validateGeneratedArticle(generated.article, context);
    writeJson(path.join(outDir, 'validation.json'), validation);
    writeJson(path.join(outDir, 'generation-meta.json'), {
      runDate,
      generatedAt: new Date().toISOString(),
      model: config.model,
      baseUrl: config.baseUrl,
      validationOk: validation.ok,
    });
    fs.writeFileSync(path.join(outDir, 'prompt.md'), `${generated.prompt.trim()}\n`, 'utf8');
    fs.writeFileSync(path.join(outDir, 'article.md'), `${generated.article.trim()}\n`, 'utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeJson(path.join(outDir, 'validation.json'), {
      ok: false,
      issues: [message],
      mentionedSelectedTours: 0,
      expectedSelectedTours: context.selectedTours.length,
    });
    writeJson(path.join(outDir, 'generation-meta.json'), {
      runDate,
      generatedAt: new Date().toISOString(),
      model: config.model,
      baseUrl: config.baseUrl,
      validationOk: false,
      error: message,
    });
    fs.writeFileSync(path.join(outDir, 'prompt.md'), `${buildWeeklyArticlePrompt(context).trim()}\n`, 'utf8');
    throw error;
  }
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
