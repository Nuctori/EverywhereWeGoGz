import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import {
  buildWeeklyArticleContext,
  ensureDir,
  fetchWeatherOutlook,
  getDefaultWebsiteUrl,
  loadEnvFiles,
  readToursData,
  toDateKey,
  validateGeneratedArticle,
  writeJson,
} from './weekly_wechat_article.mjs';

const DEFAULT_AIDER_MODEL = 'deepseek/deepseek-chat';
const DEFAULT_AIDER_BASE_URL = 'https://api.deepseek.com/v1';
const DEFAULT_CANDIDATE_VARIANTS = 2;

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

function stripMarkdownFence(text) {
  const trimmed = String(text || '').trim();
  const match = trimmed.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
  return match ? match[1].trim() : trimmed;
}

function parseJsonResponse(text) {
  return JSON.parse(stripMarkdownFence(text));
}

function getAiderBinary() {
  const userScripts = path.join(process.env.APPDATA || '', 'Python', 'Python310', 'Scripts', 'aider.exe');
  return fs.existsSync(userScripts) ? userScripts : 'aider';
}

function buildAiderEnv() {
  const env = { ...process.env };
  env.AIDER_MODEL = env.AIDER_MODEL || DEFAULT_AIDER_MODEL;
  env.AIDER_OPENAI_API_KEY = env.AIDER_OPENAI_API_KEY || env.DEEPSEEK_API_KEY || '';
  env.AIDER_OPENAI_API_BASE = env.AIDER_OPENAI_API_BASE || env.DEEPSEEK_BASE_URL || DEFAULT_AIDER_BASE_URL;
  env.AIDER_ANALYTICS = 'false';
  env.AIDER_SHOW_RELEASE_NOTES = 'false';
  env.AIDER_GITIGNORE = 'false';
  env.AIDER_AUTO_COMMITS = 'false';
  env.AIDER_DIRTY_COMMITS = 'false';
  env.AIDER_ATTRIBUTE_AUTHOR = 'false';
  env.AIDER_ATTRIBUTE_COMMITTER = 'false';
  env.AIDER_ATTRIBUTE_CO_AUTHORED_BY = 'false';
  env.AIDER_FANCY_INPUT = 'false';
  env.AIDER_SHOW_MODEL_WARNINGS = 'false';
  env.AIDER_CHECK_MODEL_ACCEPTS_SETTINGS = 'false';
  env.AIDER_DARK_MODE = 'false';
  env.AIDER_LIGHT_MODE = 'false';
  env.AIDER_PRETTY = 'false';
  env.AIDER_STREAM = 'false';
  env.AIDER_YES_ALWAYS = 'true';
  env.AIDER_DISABLE_PLAYWRIGHT = 'true';
  env.AIDER_ENCODING = 'utf-8';
  return env;
}

function buildResearchPrompt(context) {
  const sampleTours = context.candidateTours.slice(0, 18).map((tour, index) => ({
    rank: index + 1,
    id: tour.id,
    title: tour.title,
    destination: tour.destination,
    duration: tour.duration,
    price: tour.price,
    priceUnit: tour.priceUnit,
    departureDates: tour.departureDates,
    transportType: tour.transportType,
    bookingUrl: tour.bookingUrl,
    highlights: tour.highlights,
    tags: tour.tags,
    editorialReasons: tour.editorialReasons,
  }));

  return [
    '你是每周旅游选题研究员，不是写手。',
    '请基于天气、时令和候选线路，做本周公众号选题研究。',
    '只输出 JSON，不要输出任何解释或 Markdown。',
    'JSON 必须包含这些字段：',
    'opening_weather_summary, seasonal_observations, recommendation_groups, featured_route_ids, editorial_risks, duplicate_watchouts',
    '要求：',
    '- recommendation_groups 总条数要凑满 25 条',
    '- 不要把雅泡/带池/温泉写成词义解释题，只判断值不值得推荐',
    '- 要主动压制同质化',
    '',
    `运行日期：${context.runDate}`,
    `季节：${context.season}`,
    `天气：${context.weatherOutlook?.headline || '暂无'}`,
    `时令提示：${(context.seasonalOutlook || []).join(' | ')}`,
    '',
    '候选线路 JSON：',
    JSON.stringify(sampleTours, null, 2),
  ].join('\n');
}

function buildWriterPrompt(context, researchJson, variantIndex) {
  return [
    '你是资深旅行编辑，要写公众号文章，而不是解释题面。',
    '请根据给定 context 和 research JSON 输出完整 Markdown 文章。',
    '必须包含 frontmatter：title, summary, author, cover。',
    '结构必须是：',
    '1. 本周天气与出游节奏',
    '2. 本周25条分组推荐速览',
    '3. 这周更值得细看的 6 条重点线路',
    '4. 结尾提醒',
    '要求：',
    '- 不要出现“可以理解为”“别误会成”“模型判断”',
    '- 导语至少 1 张图，每条重点线路至少 1 张图',
    '- 每条重点线路都要有 [查看行程](链接)',
    `- 当前是候选版本 ${variantIndex}，请把标题、导语和侧重点与另一版拉开`,
    `- 阅读原文固定：${getDefaultWebsiteUrl()}`,
    '',
    'research JSON：',
    JSON.stringify(researchJson, null, 2),
    '',
    'context JSON：',
    JSON.stringify({
      runDate: context.runDate,
      season: context.season,
      weatherOutlook: context.weatherOutlook,
      seasonalOutlook: context.seasonalOutlook,
      recommendationGroups: context.recommendationGroups,
      selectedTours: context.selectedTours,
    }, null, 2),
  ].join('\n');
}

function buildReviewerPrompt(context, researchJson, candidates) {
  return [
    '你是终审编辑，请从两篇候选稿里选出更适合发公众号的一篇，并直接输出修订后的最终 Markdown。',
    '只能输出最终 Markdown，不要解释。',
    '终审重点：文案口吻、天气开头、25条速览、重点线路差异、图片、链接、真实性。',
    '',
    'research JSON：',
    JSON.stringify(researchJson, null, 2),
    '',
    'context JSON：',
    JSON.stringify({
      runDate: context.runDate,
      season: context.season,
      recommendationGroups: context.recommendationGroups,
      selectedTours: context.selectedTours,
      weatherOutlook: context.weatherOutlook,
      seasonalOutlook: context.seasonalOutlook,
    }, null, 2),
    '',
    '候选稿 A：',
    candidates[0],
    '',
    '候选稿 B：',
    candidates[1] || '',
  ].join('\n');
}

function runAiderMessage({ cwd, prompt, outputPath, model }) {
  return new Promise((resolve, reject) => {
    const env = buildAiderEnv();
    if (!env.AIDER_OPENAI_API_KEY) {
      reject(new Error('Missing DeepSeek token for Aider. Expected DEEPSEEK_API_KEY in environment.'));
      return;
    }

    const args = [
      '--model',
      model || env.AIDER_MODEL || DEFAULT_AIDER_MODEL,
      '--openai-api-key',
      env.AIDER_OPENAI_API_KEY,
      '--openai-api-base',
      env.AIDER_OPENAI_API_BASE,
      '--message',
      prompt,
      '--yes-always',
      '--no-gitignore',
      '--no-auto-commits',
      '--no-dirty-commits',
      '--no-pretty',
      '--no-stream',
      '--no-check-update',
      '--no-show-model-warnings',
      '--no-check-model-accepts-settings',
      '--encoding',
      'utf-8',
      '--line-endings',
      'lf',
    ];

    const child = spawn(getAiderBinary(), args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env,
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', reject);
    child.on('close', (code) => {
      const combined = `${stdout}\n${stderr}`.trim();
      if (code !== 0) {
        reject(new Error(`aider failed (${code})\n${combined}`.trim()));
        return;
      }
      fs.writeFileSync(outputPath, `${combined.trim()}\n`, 'utf8');
      resolve({ stdout, stderr });
    });
  });
}

export async function generateWeeklyArticleWithAgentCli(rootDir, options = {}) {
  loadEnvFiles(rootDir);
  const runDate = options.runDate || toDateKey();
  const tours = readToursData(rootDir);
  const execRunner = options.execRunner || runAiderMessage;

  let weatherOutlook = options.weatherOutlook;
  if (!weatherOutlook) {
    try {
      weatherOutlook = await fetchWeatherOutlook({ location: '广州' });
    } catch (error) {
      console.warn(error instanceof Error ? error.message : String(error));
    }
  }

  const context = buildWeeklyArticleContext(tours, {
    runDate,
    windowDays: options.windowDays,
    maxCandidates: options.maxCandidates,
    maxArticleItems: options.maxArticleItems,
    weatherOutlook,
    generationMode: 'aider-deepseek-multi-pass',
  });

  const outDir = options.outDir ? path.resolve(rootDir, options.outDir) : path.join(rootDir, 'weekly-wechat-posts', runDate);
  ensureDir(outDir);

  writeJson(path.join(outDir, 'weekly-context.json'), context);
  writeJson(path.join(outDir, 'selected-tours.json'), context.selectedTours);

  const aiderModel = options.aiderModel || process.env.AIDER_MODEL || DEFAULT_AIDER_MODEL;
  const researchPath = path.join(outDir, 'agent-research.json');
  const variantCount = Math.max(2, Number(options.variantCount || DEFAULT_CANDIDATE_VARIANTS));

  await execRunner({
    cwd: rootDir,
    prompt: buildResearchPrompt(context),
    outputPath: researchPath,
    model: aiderModel,
  });

  const research = parseJsonResponse(fs.readFileSync(researchPath, 'utf8'));
  const candidatePaths = [];
  const candidates = [];

  await Promise.all(
    Array.from({ length: variantCount }, async (_, index) => {
      const variantNo = index + 1;
      const outputPath = path.join(outDir, `candidate-${variantNo}.md`);
      candidatePaths.push(outputPath);
      await execRunner({
        cwd: rootDir,
        prompt: buildWriterPrompt(context, research, variantNo),
        outputPath,
        model: aiderModel,
      });
      candidates[index] = stripMarkdownFence(fs.readFileSync(outputPath, 'utf8'));
    }),
  );

  const finalPath = path.join(outDir, 'article.raw.md');
  await execRunner({
    cwd: rootDir,
    prompt: buildReviewerPrompt(context, research, candidates),
    outputPath: finalPath,
    model: aiderModel,
  });

  const finalArticle = stripMarkdownFence(fs.readFileSync(finalPath, 'utf8'));
  const validation = validateGeneratedArticle(finalArticle, context);
  writeJson(path.join(outDir, 'validation.json'), validation);
  writeJson(path.join(outDir, 'generation-meta.json'), {
    runDate,
    generatedAt: new Date().toISOString(),
    generationMode: context.generationMode,
    aiderModel,
    validationOk: validation.ok,
    candidatePaths: candidatePaths.map((filePath) => path.relative(rootDir, filePath)),
  });

  return {
    context,
    outDir,
    article: finalArticle,
    validation,
    research,
    candidatePaths,
    finalPath,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rootDir = process.cwd();
  const options = parseArgs(process.argv.slice(2));

  generateWeeklyArticleWithAgentCli(rootDir, options)
    .then((result) => {
      process.stdout.write(`${JSON.stringify({
        ok: true,
        outDir: path.relative(rootDir, result.outDir),
        generationMode: result.context.generationMode,
        validationOk: result.validation.ok,
      }, null, 2)}\n`);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
