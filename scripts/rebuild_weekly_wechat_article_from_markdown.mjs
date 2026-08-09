import fs from 'node:fs';
import path from 'node:path';
import {
  buildWeeklyArticleContext,
  ensureReferencedQrAssets,
  loadEnvFiles,
  readToursData,
  rebuildWeeklyArticleFromStructured,
  toDateKey,
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
    } else if (arg === '--source' && next) {
      options.sourcePath = next;
      index += 1;
    } else if (arg === '--out-dir' && next) {
      options.outDir = next;
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

function extractSectionBody(markdown, title) {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`##\\s+\\d+\\.\\s+${escaped}\\n([\\s\\S]*?)(?=\\n##\\s+\\d+\\.|\\n$)`);
  const match = markdown.match(regex);
  return match ? match[1].trim() : '';
}

function extractReasonAndReminder(sectionBody) {
  const lines = sectionBody.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const textLines = [];
  let reminder = '';
  for (const line of lines) {
    if (line.startsWith('![') || line.startsWith('[查看行程]') || line.startsWith('地址：') || line === '扫码查看详情') {
      continue;
    }
    if (line.startsWith('- 出发提醒：')) {
      reminder = line.replace(/^- 出发提醒：/, '').trim();
      continue;
    }
    if (line.startsWith('- ')) continue;
    textLines.push(line);
  }
  return {
    reason: textLines.join('\n\n').trim(),
    reminder,
  };
}

function buildStructuredFromMarkdown(markdown, context) {
  const lines = markdown.split(/\r?\n/);
  const headingLine = lines.find((line) => line.startsWith('# ')) || '# 本周值得认真看的线路';
  const title = headingLine.replace(/^#\s+/, '').trim();
  const summaryMatch = markdown.match(/summary:\s*"([^"]+)"/);
  const summary = summaryMatch ? summaryMatch[1] : '';

  const introStart = markdown.indexOf('\n# ');
  const weatherHeading = markdown.indexOf('\n## 1. 本周天气');
  const intro = introStart >= 0 && weatherHeading > introStart
    ? markdown.slice(introStart + 3 + title.length, weatherHeading).replace(/^.*?\n\n/, '').trim()
    : '';

  const weatherLead = (() => {
    const weatherBlock = markdown.match(/##\s+1\.\s+本周天气与出游节奏\s+([\s\S]*?)\n##\s+/);
    return weatherBlock ? weatherBlock[1].trim() : '';
  })();

  const items = context.selectedTours.map((tour) => {
    const sectionBody = extractSectionBody(markdown, tour.title) || extractSectionBody(markdown, `${tour.id}`);
    const { reason, reminder } = extractReasonAndReminder(sectionBody);
    return {
      id: tour.id,
      recommendationTitle: tour.title,
      reason,
      reminder,
    };
  });

  return { title, summary, intro, weatherLead, items };
}

async function main() {
  const rootDir = process.cwd();
  loadEnvFiles(rootDir);
  const args = parseArgs(process.argv.slice(2));
  const runDate = args.runDate || toDateKey();
  const sourcePath = path.resolve(rootDir, args.sourcePath || 'tmp/wechat-republish-2026-06-25/article.md');
  const outDir = path.resolve(rootDir, args.outDir || `tmp/wechat-republish-${runDate}`);

  const tours = readToursData(rootDir);
  const context = buildWeeklyArticleContext(tours, {
    runDate,
    maxCandidates: args.maxCandidates,
    maxArticleItems: args.maxArticleItems,
  });
  const sourceMarkdown = fs.readFileSync(sourcePath, 'utf8');
  const structured = buildStructuredFromMarkdown(sourceMarkdown, context);
  const article = rebuildWeeklyArticleFromStructured(context, structured);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'article.md'), `${article.trim()}\n`, 'utf8');
  await ensureReferencedQrAssets(outDir, article);
  writeJson(path.join(outDir, 'weekly-context.json'), context);
  writeJson(path.join(outDir, 'structured-source.json'), structured);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
