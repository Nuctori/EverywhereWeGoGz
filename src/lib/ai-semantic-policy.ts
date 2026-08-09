import type { AiPreferenceMemory } from '@/types/tour';

// AI 语义策略：识别公益、扶贫、助农等敏感语义，并决定本轮是否允许进入推荐链路。
// 这里处理的是“这一轮能不能带着这类语义继续往下走”，不是最终推荐结果本身。
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

// 匹配公益、扶贫、助农等敏感语义。
// 这类词在旅游推荐场景里容易触发误分类，因此需要单独决策是否保留。
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
  // 本轮是否放行，只有两个入口：用户当前输入和继承下来的偏好记忆。
  // 这样既能延续上一轮的续写语义，又不会把无关历史误带进新搜索。
  return hasPublicInterestLanguage(userText) || hasPublicInterestMemory(inheritedMemory);
}

export function sanitizeAiIntentForTurn<TIntent extends SemanticIntent>(
  intent: TIntent | null,
  options: { allowPublicInterest: boolean },
): TIntent | null {
  if (!intent || options.allowPublicInterest) return intent;

  // 禁止时只清掉容易把推荐方向带偏的软语义字段，硬条件保留给后续排序继续使用。
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
      // 轻量模型只允许基于预算、天气、玩法等客观条件推荐，
      // 避免凭空假设用户存在公益、扶贫、助农等特殊偏好。
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
    systemRules: [],
    requestRules: [],
    // 已允许公益语义时，不再额外施加轻量模型的保守限制。
    liteRules: [],
    softCriteriaDescription: 'string[]，本轮软语义标准，保留用户表达或你的语义理解',
    cannotAssertDescription: 'string[]，候选无证据时不能断言的事实',
    semanticFocusDescription:
      'string[]，保留用户表达或明显隐含的软语义',
  };
}
