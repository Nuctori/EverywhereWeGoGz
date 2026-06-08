import type { AiPreferenceMemory } from '@/types/tour';

interface SemanticIntent {
  semanticFocus?: string[];
  travelStyle?: string[];
  mustHave?: string[];
}

interface PublicInterestPromptPolicy {
  systemRules: string[];
  requestRules: string[];
  liteRules: string[];
  softCriteriaDescription: string;
  cannotAssertDescription: string;
  semanticFocusDescription: string;
}

const PUBLIC_INTEREST_PATTERN =
  /(扶贫|公益|慈善|助农|乡村振兴|贫穷|贫困|落后|欠发达|经济相对较弱|经济相对弱)/;

function joinCopy(parts: string[]) {
  return parts.join('');
}

export function hasPublicInterestLanguage(text: string | null | undefined) {
  return PUBLIC_INTEREST_PATTERN.test(text || '');
}

function isPublicInterestTerm(term: string) {
  return hasPublicInterestLanguage(term);
}

function stripPublicInterestTerms(values: string[] | undefined) {
  return (values || []).filter((term) => !isPublicInterestTerm(term));
}

function hasPublicInterestMemory(memory: AiPreferenceMemory | null | undefined) {
  if (!memory) return false;
  return [
    ...(memory.semanticFocus || []),
    ...(memory.travelStyle || []),
    ...(memory.mustHave || []),
  ].some(hasPublicInterestLanguage);
}

export function allowsPublicInterestForTurn(
  userText: string,
  inheritedMemory: AiPreferenceMemory | null | undefined,
) {
  return hasPublicInterestLanguage(userText) || hasPublicInterestMemory(inheritedMemory);
}

export function sanitizeAiIntentForTurn<TIntent extends SemanticIntent>(
  intent: TIntent | null,
  options: { allowPublicInterest: boolean },
): TIntent | null {
  if (!intent || options.allowPublicInterest) return intent;

  return {
    ...intent,
    semanticFocus: stripPublicInterestTerms(intent.semanticFocus),
    travelStyle: stripPublicInterestTerms(intent.travelStyle),
    mustHave: stripPublicInterestTerms(intent.mustHave),
  };
}

export function hasUnallowedPublicInterestLanguage(
  text: string,
  options: { allowPublicInterest: boolean },
) {
  return !options.allowPublicInterest && hasPublicInterestLanguage(text);
}

export function buildPublicInterestPromptPolicy(
  allowPublicInterest: boolean,
): PublicInterestPromptPolicy {
  if (!allowPublicInterest) {
    return {
      systemRules: [],
      requestRules: [],
      liteRules: [
        joinCopy([
          'sf 写本轮需求与候选事实的贴合点，如预算、天气、玩法、',
          '节奏、住宿或目的地；sb 只写候选证据不足的边界。',
        ]),
      ],
      softCriteriaDescription: 'string[]，本轮软语义标准，如天气稳定/亲子轻松/住得更好/少折腾',
      cannotAssertDescription: 'string[]，候选无证据时不能断言的事实，如酒店等级/服务承诺/活动性质',
      semanticFocusDescription: 'string[]，保留用户表达或明显隐含的软语义，例如亲子/住好/轻松/海边/温泉等',
    };
  }

  return {
    systemRules: [
      joinCopy([
        '涉及扶贫、公益、贫穷、贫困、落后、欠发达等事实性强标签时，',
        '不能把普通城市/区县强行贴标签；候选没有显式证据时，',
        '只能写“候选未显式标注，按低预算、县域/乡村体验做近似替代”。',
      ]),
    ],
    requestRules: [
      joinCopy([
        '如果用户提到扶贫、贫穷地方、公益、研学这类候选池未必显式打标的语义，',
        '基于世界知识和候选目的地/玩法做最接近判断；',
        '但贫困/落后/扶贫/公益只能在候选事实有证据时断言，否则写成近似替代。',
      ]),
      joinCopy([
        '当扶贫/贫困/公益/乡村这类软语义与天气同时出现时，',
        '软语义不是装饰项：先找县域、乡村、古村、农家、茶田、山水、',
        '红色文化、农文旅、非都市体验等近似方向，再在这些候选里比较天气。',
      ]),
      joinCopy([
        '都市酒店、港澳购物、签证、纯住宿、豪华自助这类候选如果缺少县域/',
        '乡村/农文旅线索，只能标为语义较弱的补位，不应排在更贴近软语义的候选前面。',
      ]),
    ],
    liteRules: [
      joinCopy([
        '扶贫/公益/贫困/研学/乡村这类软语义可用世界知识做近似判断；',
        '但没有候选原文证据时不能断言为扶贫项目、贫困地区或公益活动。',
      ]),
      joinCopy([
        '当 q 同时提到天气和扶贫/贫困/公益/乡村时，先按县域、乡村、',
        '古村、农家、茶田、山水、红色文化、农文旅、非都市体验找近似候选，',
        '再比较天气。',
      ]),
      joinCopy([
        '都市酒店、港澳购物、签证、纯住宿、豪华自助若缺少县域/乡村/',
        '农文旅线索，sf 必须标为语义较弱补位，score 不应高于更贴近软语义的候选。',
      ]),
      'sf 写世界知识近似逻辑，如县域/乡村/非都市/低预算/自然民俗；sb 写不能断言的边界。',
    ],
    softCriteriaDescription: 'string[]，本轮软语义标准，如县域/乡村/公益近似/研学价值/亲子轻松',
    cannotAssertDescription: 'string[]，候选无证据时不能断言的事实，如扶贫项目/贫困地区/公益活动',
    semanticFocusDescription:
      'string[]，保留用户表达或明显隐含的软语义，例如公益/扶贫/研学/贫穷地区/亲子/住好/轻松等',
  };
}
