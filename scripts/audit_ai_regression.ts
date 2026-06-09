// ???? AI ????????????????????????
import fs from 'node:fs/promises';
import path from 'node:path';
import { requestAiRecommendations } from '../src/lib/ai-recommendation.ts';
import type {
  AiPreferenceMemory,
  AiRecommendationCandidate,
  AiRecommendationMessage,
  AiRecommendationResult,
  FilterState,
} from '../src/types/tour.ts';

type RegressionCase = {
  id: string;
  query: string;
  carryContextFrom?: string;
  notes?: string;
};

type ScenarioState = {
  preferenceMemory?: AiPreferenceMemory;
  previousResult?: AiRecommendationResult | null;
};

const regressionCases: RegressionCase[] = [
  {
    id: 'case-01',
    query: '3天内出发，预算2000以内，想轻松一点，不要温泉，不想坐太久大巴',
  },
  {
    id: 'case-02',
    query: '下周带老人出行，4天左右，避暑、少爬山、别赶，预算3000以内',
  },
  {
    id: 'case-03',
    query: '端午前后想去海边，但怕下雨和风浪，2大1小，预算4000以内',
  },
  {
    id: 'case-04',
    query: '我要扶贫或者公益属性更强的路线，没有就直说最接近替代，不要硬编',
  },
  {
    id: 'case-05',
    query: '预算5000左右，想住好一点，行程别太赶，目的地不限，但不要购物团',
  },
  {
    id: 'case-06',
    query: '周五晚上出发，周日回来，短途放松，预算1500以内，偏广东周边',
  },
  {
    id: 'case-07',
    query: '带小朋友亲子游，5天左右，要有互动体验和室内备选，怕热，预算6000以内',
  },
  {
    id: 'case-08',
    query: '最近几天就能走，最好有明确未来班期，不要过去班期，不要候补感太强的团',
  },
  {
    id: 'case-09',
    query: '想去云南或者桂林，看自然风景，但如果天气窗口不好，可以换更稳的替代地',
  },
  {
    id: 'case-10',
    query: '再便宜一点，但还是要比上一轮更接近我原来的需求，不是单纯全站最低价',
    carryContextFrom: 'case-09',
    notes: '验证相对表达是否能继承上一轮上下文',
  },
];

const emptyFilters: FilterState = {
  destination: '',
  minPrice: null,
  maxPrice: null,
  duration: null,
  source: '',
  departureDate: '',
  departureDateStart: '',
  departureDateEnd: '',
  theme: '',
  sortBy: 'hot',
};

function getDisplayDepartureDate(tour: AiRecommendationCandidate | undefined) {
  if (!tour) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates = [
    ...(tour.departureDates || []),
    ...(tour.hotDepartureDates || []),
    tour.departureDate,
  ]
    .filter(Boolean)
    .filter((date, index, all) => all.indexOf(date) === index)
    .sort();

  const upcomingDate = dates.find((date) => {
    const parsed = new Date(`${date}T00:00:00`);
    return !Number.isNaN(parsed.getTime()) && parsed >= today;
  });

  return upcomingDate || tour.departureDate || '';
}

function getProjectRoot() {
  return path.resolve(process.cwd());
}

async function loadDotEnv(projectRoot: string) {
  for (const fileName of ['.env.local', '.env']) {
    try {
      const raw = await fs.readFile(path.join(projectRoot, fileName), 'utf8');
      for (const line of raw.split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!match) continue;
        const [, key, value] = match;
        if (!(key in process.env)) {
          process.env[key] = value.replace(/^['"]|['"]$/g, '');
        }
      }
    } catch {
      // Ignore missing local env files and continue with current process env.
    }
  }
}

async function loadCandidateTours(projectRoot: string) {
  const filePath = path.join(projectRoot, 'public', 'data', 'tours-list.json');
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as AiRecommendationCandidate[];
}

function getAiConfigFromEnv() {
  const apiKey =
    process.env.AI_API_KEY ||
    process.env.DEEPSEEK_API_KEY ||
    process.env.VITE_AI_DEFAULT_API_KEY ||
    (process.env.VITE_AI_DEFAULT_API_KEY_B64
      ? Buffer.from(process.env.VITE_AI_DEFAULT_API_KEY_B64, 'base64').toString('utf8')
      : '') ||
    '';
  const baseUrl =
    process.env.AI_BASE_URL ||
    process.env.DEEPSEEK_BASE_URL ||
    process.env.VITE_AI_DEFAULT_BASE_URL ||
    '';
  const model =
    process.env.AI_MODEL ||
    process.env.DEEPSEEK_MODEL ||
    process.env.VITE_AI_DEFAULT_MODEL ||
    '';

  if (!apiKey || !baseUrl || !model) {
    throw new Error(
      'Missing AI config. Please set AI_API_KEY, AI_BASE_URL and AI_MODEL (or DEEPSEEK_* equivalents).',
    );
  }

  return { apiKey, baseUrl, model };
}

function createUserMessage(content: string): AiRecommendationMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: 'user',
    content,
    createdAt: new Date().toISOString(),
  };
}

function extractTopItems(
  result: AiRecommendationResult,
  toursById: Map<string, AiRecommendationCandidate>,
  limit = 8,
) {
  return result.items.slice(0, limit).map((item, index) => {
    const tour = toursById.get(item.tourId);
    return {
      rank: index + 1,
      id: item.tourId,
      title: tour?.title || '',
      destination: tour?.destination || '',
      duration: tour?.duration ?? null,
      price: tour?.price ?? null,
      departureDate: getDisplayDepartureDate(tour),
      reason: item.reason || '',
    };
  });
}

function getSeasonMismatchFlags(result: AiRecommendationResult) {
  const texts = [
    result.summary,
    ...result.items.slice(0, 12).map((item) => item.reason || ''),
  ].filter(Boolean);

  return texts.filter((text) => /(春季踏青|春季适宜|冬季适合|回南天)/.test(text));
}

function getCheapItemFlags(
  result: AiRecommendationResult,
  toursById: Map<string, AiRecommendationCandidate>,
) {
  return result.items.slice(0, 8)
    .map((item, index) => {
      const tour = toursById.get(item.tourId);
      if (!tour) return null;
      return tour.price <= 399
        ? {
            rank: index + 1,
            title: tour.title,
            price: tour.price,
          }
        : null;
    })
    .filter(Boolean);
}

function getPastDateFlags(
  result: AiRecommendationResult,
  toursById: Map<string, AiRecommendationCandidate>,
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return result.items.slice(0, 8)
    .map((item, index) => {
      const tour = toursById.get(item.tourId);
      const displayDepartureDate = getDisplayDepartureDate(tour);
      if (!displayDepartureDate) return null;
      const departure = new Date(`${displayDepartureDate}T00:00:00`);
      if (Number.isNaN(departure.getTime()) || departure >= today) return null;
      return {
        rank: index + 1,
        title: tour?.title || '',
        departureDate: displayDepartureDate,
      };
    })
    .filter(Boolean);
}

async function main() {
  const projectRoot = getProjectRoot();
  await loadDotEnv(projectRoot);
  const candidateTours = await loadCandidateTours(projectRoot);
  const toursById = new Map(candidateTours.map((tour) => [tour.id, tour]));
  const aiConfig = getAiConfigFromEnv();
  const scenarioState = new Map<string, ScenarioState>();
  const outputs: Array<Record<string, unknown>> = [];

  for (const testCase of regressionCases) {
    const inheritedState = testCase.carryContextFrom
      ? scenarioState.get(testCase.carryContextFrom) || {}
      : {};

    const result = await requestAiRecommendations({
      conversationId: `regression-${testCase.id}`,
      messages: [createUserMessage(testCase.query)],
      candidateTours,
      activeFilters: emptyFilters,
      searchQuery: '',
      aiConfig,
      preferenceMemory: inheritedState.preferenceMemory ?? null,
      previousResult: inheritedState.previousResult ?? null,
    });

    scenarioState.set(testCase.id, {
      preferenceMemory: result.preferenceMemory,
      previousResult: result,
    });

    outputs.push({
      id: testCase.id,
      query: testCase.query,
      notes: testCase.notes || '',
      resultCount: result.items.length,
      source: result.source,
      statusLabel: result.status?.label || '',
      summary: result.summary,
      topItems: extractTopItems(result, toursById),
      cheapTopFlags: getCheapItemFlags(result, toursById),
      pastDateFlags: getPastDateFlags(result, toursById),
      seasonMismatchFlags: getSeasonMismatchFlags(result),
    });
  }

  const outputDir = path.join(projectRoot, 'output', 'reports');
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'ai-regression-report.json');
  await fs.writeFile(outputPath, JSON.stringify(outputs, null, 2), 'utf8');

  console.log(`AI regression report written: ${outputPath}`);
  console.log(JSON.stringify(outputs, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
