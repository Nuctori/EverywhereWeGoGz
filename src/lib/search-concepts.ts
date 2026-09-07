// 搜索概念表：查询词与线路语料共用的唯一主题词表。
// 概念 = 用户口中的主题词（沙滩）与线路身上的证据（别名/地名/标签/亮点）之间的桥。
// 新增主题时只改这里，查询侧和线路侧同时生效。
import { collectDestinationHints } from './destination-resolver.ts';

export interface QuerySearchContext {
  normalized: string;
  concepts: string[];
  residues: string[];
}

interface ConceptGroup {
  label: string;
  // 语料证据：线路文本包含任一别名即视为拥有该概念
  aliases: readonly string[];
  // 地名证据：标题/语料包含地名即视为拥有该概念（如 沙扒湾 → 海边沙滩）
  places: readonly string[];
}

export const CONCEPT_GROUPS: readonly ConceptGroup[] = [
  {
    label: '海边沙滩',
    aliases: ['沙滩', '海滩', '海边', '海滨', '海景'],
    places: [
      '沙扒湾',
      '双月湾',
      '巽寮湾',
      '海陵岛',
      '南澳岛',
      '上川岛',
      '下川岛',
      '金町湾',
      '红海湾',
      '大角湾',
      '飞沙滩',
      '十里银滩',
    ],
  },
  {
    label: '温泉泡汤',
    aliases: [
      '温泉',
      '泡汤',
      '汤泉',
      '热泉',
      '铁泉',
      '御泉',
      '私汤',
      '带池',
      '泡池',
    ],
    places: [],
  },
  {
    label: '玩水清凉',
    aliases: [
      '玩水',
      '漂流',
      '溯溪',
      '桨板',
      '冲浪',
      '水上乐园',
      '水世界',
      '嬉水',
      '亲水',
      '泳池',
    ],
    places: [],
  },
  {
    label: '森林山水',
    aliases: [
      '森林',
      '山水',
      '瀑布',
      '峡谷',
      '溶洞',
      '氧吧',
      '湿地',
      '丹霞',
      '避暑',
      '清凉',
    ],
    places: [],
  },
  {
    label: '文化逛城',
    aliases: ['古城', '古镇', '博物馆', '非遗', '骑楼', '水乡', '碉楼', '文化'],
    places: [],
  },
  {
    label: '美食体验',
    aliases: ['美食', '海鲜', '早茶', '寻味', '烧鹅', '火锅'],
    places: [],
  },
  {
    label: '亲子家庭',
    aliases: ['亲子', '孩子', '小朋友', '乐园'],
    places: [],
  },
  {
    label: '户外徒步',
    aliases: ['徒步', '登山', '爬山', '穿越', '骑行'],
    places: [],
  },
  {
    label: '滑雪',
    aliases: ['滑雪'],
    places: [],
  },
  {
    label: '邮轮',
    aliases: ['邮轮', '游轮'],
    places: [],
  },
];

// 概念表未覆盖的未知词（如 阿那亚）切出的残渣，走弱信号兜底。
const RESIDUE_SPLIT_PATTERN = /\s+/;

export function extractQueryContext(query: string): QuerySearchContext {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return { normalized: '', concepts: [], residues: [] };

  const scan = normalized.replace(/[^\p{Script=Han}a-z0-9]+/gu, ' ');
  let stripped = scan;
  const concepts = new Set<string>();

  for (const group of CONCEPT_GROUPS) {
    for (const token of [...group.aliases, ...group.places]) {
      if (!scan.includes(token)) continue;
      concepts.add(group.label);
      stripped = stripped.split(token).join(' ');
    }
  }

  // 目的地实体（河源/桂林/双月湾）是相关性最强的信号：不切出来的话它会和
  // “便宜的”黏成整句残渣，任何线路都匹配不上，长尾与搜索全部失效。
  const destinations = collectDestinationHints(scan);
  for (const destination of destinations) {
    stripped = stripped.split(destination).join(' ');
  }

  const residues = [
    ...new Set(
      [
        ...destinations,
        ...stripped
          .split(RESIDUE_SPLIT_PATTERN)
          .map((part) => part.trim())
          // 残渣只兜概念表外的实体。纯汉字碎片在有概念覆盖时几乎都是连接词垃圾
          // （帮我找同时带/的团）；实体要么自带数字/字母（800内/hilton），要么
          // 用户查询本身无概念（如 阿那亚），保留全部纯汉字块。
          .filter((part) => {
            if (part.length < 2 || part.length > 16 || /^\d+$/.test(part))
              return false;
            return concepts.size === 0 || /[\da-z]/i.test(part);
          }),
      ],
    ),
  ].slice(0, 8);

  return { normalized, concepts: [...concepts], residues };
}

// 线路侧概念判定：corpus 已由调用方缓存，这里保持纯函数。
export function matchTourConcepts(corpus: string): string[] {
  const hits: string[] = [];
  for (const group of CONCEPT_GROUPS) {
    if (
      [...group.aliases, ...group.places].some((token) =>
        corpus.includes(token),
      )
    ) {
      hits.push(group.label);
    }
  }
  return hits;
}

// 相关度：整句直击 > 概念命中 > 残渣弱信号。概念表变更不影响权重结构。
export function getSearchRelevance(
  title: string,
  corpus: string,
  ctx: QuerySearchContext,
): number {
  if (!ctx.normalized) return 0;

  let score = 0;
  if (title.includes(ctx.normalized)) score += 32;
  else if (corpus.includes(ctx.normalized)) score += 18;

  if (ctx.concepts.length > 0) {
    const tourConcepts = new Set(matchTourConcepts(corpus));
    for (const concept of ctx.concepts) {
      if (tourConcepts.has(concept)) score += 16;
    }
  }

  for (const term of ctx.residues) {
    if (title.includes(term)) score += 14;
    else if (corpus.includes(term)) score += 4;
  }

  return score;
}
