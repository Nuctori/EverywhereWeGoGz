import type { Tour } from '@/types/tour';

const GENERIC_DESTINATIONS = new Set(['其他', '产品特色']);
const GENERIC_HIGHLIGHT_PLACEHOLDERS = new Set([
  '产品特色',
  '其他必打卡',
  '特色美食',
  '精品住宿',
]);

export const DESTINATION_ALIASES: Record<string, string[]> = {
  桂林: ['桂林', '阳朔', '漓江'],
  三亚: ['三亚', '海南', '海口'],
  云南: ['云南', '昆明', '大理', '丽江', '香格里拉', '西双版纳', '腾冲', '瑞丽', '芒市', '保山'],
  张家界: ['张家界', '天门山', '武陵源'],
  西藏: ['西藏', '拉萨', '林芝'],
  新疆: ['新疆', '乌鲁木齐', '喀纳斯', '伊犁'],
  日本: ['日本', '东京', '大阪', '京都', '北海道'],
  韩国: ['韩国', '首尔', '济州'],
  欧洲: ['欧洲', '法国', '意大利', '瑞士', '德国', '西班牙'],
  贵州: ['贵州', '贵阳', '黄果树', '荔波'],
  四川: ['四川', '成都', '九寨沟', '峨眉山'],
  广东: ['广东', '广州', '深圳', '珠海', '潮汕', '阳江', '阳西', '海陵岛', '沙扒湾'],
  港澳: ['港澳', '香港', '澳门', '香港澳门', '香港/澳门'],
  广西: ['广西', '南宁', '桂平', '北海', '涠洲岛', '崇左', '德天瀑布', '靖西', '巴马', '柳州', '贺州', '南丹', '金秀'],
  越南: ['越南', '河内', '下龙湾', '芽庄', '胡志明', '富国岛', '岘港', '会安', '美奈'],
  东南亚: [
    '东南亚',
    '泰国',
    '普吉',
    '普吉岛',
    '苏梅',
    '芭提雅',
    '曼谷',
    '马来西亚',
    '沙巴',
    '仙本那',
    '巴厘',
    '巴厘岛',
    '印度尼西亚',
    '菲律宾',
    '长滩',
    '薄荷岛',
    '新加坡',
    '新马',
  ],
};

export const DESTINATION_ALIAS_FALSE_POSITIVES: Record<string, Array<{
  alias: string;
  blockedContexts: string[];
}>> = {
  广西: [
    {
      alias: '北海',
      blockedContexts: ['北海湿地'],
    },
  ],
};

const TITLE_DESTINATION_ALIASES: Record<string, string[]> = {
  湖南: ['湖南', '郴州', '崀山', '小东江', '高椅岭', '飞天山'],
  泰国: ['泰国', '曼谷', '芭堤雅', '芭提雅', '大皇宫', '玉佛寺'],
};

const DEPARTURE_CONTEXT_PATTERN =
  /(?:南航|东航|国航|港航|港龙|广航|深航|海航|川航|厦航)?(?:正点)?(?:航班)?(?:广州|香港|深圳|北京|上海|杭州|南京|天津|武汉|长沙|成都|重庆|西安|昆明|南宁|桂林|福州|厦门|珠海|澳门)(?:正点)?(?:航班)?(?:联运)?(?:往返|出发|直飞|飞|双飞|双动|动车往返|高铁往返|动车|高铁)/g;

function uniqueStrings(values: Array<string | undefined | null>) {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}

function normalizeFactText(value: string | undefined | null) {
  return (value || '').trim();
}

export function isBlockedDestinationAliasMatch(
  destination: string,
  alias: string,
  text: string,
  index: number,
) {
  const candidates = DESTINATION_ALIAS_FALSE_POSITIVES[destination];
  if (!candidates?.length) return false;

  const normalizedAlias = alias.toLowerCase();
  const normalizedText = text.toLowerCase();
  return candidates
    .filter((candidate) => candidate.alias.toLowerCase() === normalizedAlias)
    .some((candidate) =>
      candidate.blockedContexts.some((blockedContext) => {
        const blockedIndex = normalizedText.indexOf(blockedContext.toLowerCase());
        if (blockedIndex === -1) return false;
        return index >= blockedIndex && index < blockedIndex + blockedContext.length;
      }),
    );
}

function stripDepartureContext(text: string) {
  return text.replace(DEPARTURE_CONTEXT_PATTERN, ' ');
}

function stripHighlightSuffix(value: string) {
  return normalizeFactText(value).replace(/必打卡$/u, '').trim();
}

export function collectDestinationHints(text: string) {
  const matched = Object.entries(DESTINATION_ALIASES)
    .map(([destination, aliases]) => ({
      destination,
      index: aliases.reduce((bestIndex, alias) => {
        const index = text.toLowerCase().indexOf(alias.toLowerCase());
        if (index === -1 || isBlockedDestinationAliasMatch(destination, alias, text, index)) {
          return bestIndex;
        }
        return Math.min(bestIndex, index);
      }, Number.POSITIVE_INFINITY),
    }))
    .filter((entry) => Number.isFinite(entry.index))
    .sort((left, right) => left.index - right.index)
    .map(({ destination }) => destination);

  return matched.filter((destination) =>
    !matched.some((other) =>
      other !== destination &&
      (DESTINATION_ALIASES[destination] || []).includes(other),
    ));
}

function getDestinationAliasesForHint(hint: string) {
  const normalizedHint = hint.trim().toLowerCase();
  if (!normalizedHint) return [];

  const directAliases = DESTINATION_ALIASES[hint];
  if (directAliases) return [hint, ...directAliases];

  const aliasEntry = Object.entries(DESTINATION_ALIASES).find(([, aliases]) =>
    aliases.some((alias) => alias.toLowerCase() === normalizedHint),
  );

  return aliasEntry ? [aliasEntry[0], ...aliasEntry[1]] : [hint];
}

export function destinationHintsMatchCorpus(destinationHints: string[] | undefined, corpus: string) {
  if (!destinationHints?.length) return true;
  const normalizedCorpus = corpus.toLowerCase();

  return destinationHints.some((hint) =>
    getDestinationAliasesForHint(hint).some((alias) =>
      (() => {
        const aliasIndex = normalizedCorpus.indexOf(alias.toLowerCase());
        if (aliasIndex === -1) return false;
        return !isBlockedDestinationAliasMatch(hint, alias, corpus, aliasIndex);
      })(),
    ),
  );
}

function collectDestinationHintsFromCorpus(corpus: string) {
  return Object.entries(DESTINATION_ALIASES)
    .map(([destination, aliases]) => ({
      destination,
      index: aliases.reduce((bestIndex, alias) => {
        const index = corpus.toLowerCase().indexOf(alias.toLowerCase());
        if (index === -1 || isBlockedDestinationAliasMatch(destination, alias, corpus, index)) {
          return bestIndex;
        }
        return Math.min(bestIndex, index);
      }, Number.POSITIVE_INFINITY),
    }))
    .filter((entry) => Number.isFinite(entry.index))
    .sort((left, right) => left.index - right.index)
    .map(({ destination }) => destination);
}

export function collectTitleDestinationHints(title: string) {
  const cleanedTitle = stripDepartureContext(title);
  const normalizedTitle = cleanedTitle.toLowerCase();
  const explicitHints = Object.entries(TITLE_DESTINATION_ALIASES)
    .filter(([, aliases]) => aliases.some((alias) => normalizedTitle.includes(alias.toLowerCase())))
    .map(([destination]) => destination);
  return uniqueStrings([
    ...collectDestinationHintsFromCorpus(cleanedTitle),
    ...explicitHints,
  ]);
}

export function resolveTourDestination(tour: Pick<Tour, 'destination' | 'title' | 'highlights'>) {
  const rawDestination = (tour.destination || '').trim();
  const titleHints = collectTitleDestinationHints(tour.title || '');
  const highlightHints = uniqueStrings((tour.highlights || []).flatMap((item) => collectDestinationHints(item)));
  const inferredDestination = titleHints[0] || highlightHints[0] || '';
  const cleanedTitle = stripDepartureContext(tour.title || '');

  if (!rawDestination || GENERIC_DESTINATIONS.has(rawDestination)) {
    return inferredDestination || rawDestination || '';
  }
  if (!inferredDestination) {
    return rawDestination;
  }
  if (titleHints.length > 0 && !destinationHintsMatchCorpus([rawDestination], cleanedTitle)) {
    return titleHints[0];
  }
  if (destinationHintsMatchCorpus([rawDestination], inferredDestination)) {
    return rawDestination;
  }
  if (!destinationHintsMatchCorpus([rawDestination], `${cleanedTitle} ${(tour.highlights || []).join(' ')}`)) {
    return inferredDestination;
  }
  return rawDestination;
}

export function sanitizeTourHighlights(tour: Pick<Tour, 'destination' | 'title' | 'highlights'>) {
  const rawDestination = normalizeFactText(tour.destination);
  const resolvedDestination = normalizeFactText(resolveTourDestination(tour));
  const titleHints = collectTitleDestinationHints(tour.title || '');
  const destinationLabels = new Set(uniqueStrings([
    rawDestination,
    resolvedDestination,
    ...titleHints,
  ]));
  const seen = new Set<string>();

  return (tour.highlights || [])
    .map((value) => ({
      raw: normalizeFactText(value),
      stripped: stripHighlightSuffix(value),
    }))
    .filter(({ raw, stripped }) =>
      Boolean(stripped) &&
      !GENERIC_HIGHLIGHT_PLACEHOLDERS.has(raw) &&
      !GENERIC_HIGHLIGHT_PLACEHOLDERS.has(stripped) &&
      !GENERIC_DESTINATIONS.has(stripped) &&
      !destinationLabels.has(stripped),
    )
    .map(({ stripped }) => stripped)
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

export function buildTourDestinationSearchCorpus(tour: Pick<Tour, 'destination' | 'title' | 'highlights'>) {
  return [
    resolveTourDestination(tour),
    stripDepartureContext(tour.title || ''),
    ...sanitizeTourHighlights(tour),
  ]
    .filter(Boolean)
    .join(' ');
}