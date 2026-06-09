// 线路过滤引擎：用标题、价格、来源和链接启发式识别真实旅游线路，排除广告、票务和商品噪音。
import type { Tour } from '@/types/tour';

const AD_HINTS = ['\u626b\u7801\u53ef\u8fdb', '\u6d3b\u52a8\u7fa4', '\u5df2\u7ed3\u675f'];

const TICKET_HINTS = [
  '\u95e8\u7968',
  '\u8f66\u7968',
  '\u5df4\u58eb\u7968',
  '\u95e8\u7968\u5957\u9910',
  '\u666f\u70b9\u5957\u7968',
  '\u5957\u7968',
  '\u901a\u7968',
  '\u4ee3\u91d1\u5238',
  '\u81ea\u52a9\u9910',
  '\u7a7a\u94c1',
  '\u673a\u573a\u5feb\u7ebf',
];

const TRANSPORT_ONLY_HINTS = ['\u76f4\u901a\u8f66', '\u62fc\u8f66', '\u63a5\u9001', '\u53e3\u5cb8', '\u4ee3\u8ba2'];
const TRANSPORT_PRICE_HINTS = ['\u5355\u7a0b', '\u53cc\u7a0b', '\u5f80\u8fd4'];
const TRANSPORT_ONLY_ROUTES = ['\u53bb\u7a0b\u5355\u7a0b', '\u8fd4\u7a0b\u5355\u7a0b', '\u5355\u53bb\u7a0b', '\u5355\u56de\u7a0b', '\u5f53\u5929\u5f80\u8fd4', '\u53cc\u7a0b\u4ea4\u901a'];
const MERCHANDISE_BRANDS = ['\u5c0f\u7ea2\u82b1', '\u7b2c\u4e00\u798f', 'NUSPA', 'ankale', 'FunVee'];
const GARBLED_TRANSPORT_HINTS = ['\u9419\u6394', '\u69c4\u68a1\u5a6b\u50fc', '\u95a8\u6d96\u6d62\u7d99', '\u95a8\u6d96\u9a53\u7d99', '\u7456\u672c\u6328\u9289\u5c25', '\u95bc\u5b98\u7269\u7a7a'];

// 这些关键词用于识别纯商品或特产；新增前要确认不会误伤真实旅游线路。
const MERCHANDISE_HINTS = [
  '\u4f18\u54c1',
  '\u7279\u4ea7',
  '\u6742\u7cae',
  '\u9ed1\u6728\u8033',
  '\u9738\u738b\u82b1',
  '\u83cc\u6c64\u5305',
  '\u6885\u83dc\u5e72',
  '\u83b2\u5b50',
  '\u7d2b\u7c73',
  '\u9a6c\u8e44\u7cd5',
  '\u59dc\u7cd6',
  '\u8300\u82d3',
  '\u5c0f\u9ea6\u7c89',
  '\u8d64\u85cd\u7cd6\u918b',
  '\u7f57\u6c49\u679c',
  '\u94f6\u8033',
  '\u4e94\u6307\u6bdb\u6843',
  '\u83dc\u5fc3\u5e72',
  '\u571f\u832f\u82b1',
  '\u67da\u76ae\u7cd6',
  '\u6838\u6843\u7c89',
  '\u7c89\u6761',
  '\u4e94\u6708\u827e',
  '\u725b\u4e73\u6811',
  '\u4e94\u53f6\u795e',
  '\u8702\u871c',
  '\u6728\u8033',
  '\u96ea\u68a8\u6c41',
  '\u9e2d\u86cb',
  '\u9f9f\u82b3\u818f',
  '\u8311\u8389\u82b1\u5e72',
  '\u866b\u8349\u82b1',
  '\u814a\u9762',
  '\u7c73\u7c89',
  '\u5976\u8336',
  '\u679c\u8336',
  '\u867e\u5b50\u9762',
  '\u867e\u4ec1\u9762',
  '\u9e21\u9aa8\u8349',
  '\u845b\u6839\u7247',
  '\u767e\u5408\u5e72',
  '\u82b1\u751f',
  '\u5c71\u836f',
  '\u7389\u7c73',
  '\u8c46\u89d2\u5e72',
  '\u94f6\u8033\u8fb9',
  '\u6dee\u5c71\u5e72',
  '\u65e0\u82b1\u679c\u5e72',
  '\u7259\u818f',
  '\u867e\u76ae',
  '\u8896\u5e26\u83dc',
  '\u8c61\u7259\u7c73',
  '\u7cd5',
  '\u91d1\u94f6\u82b1\u6c34',
  '\u523a\u68a8\u8336',
  '\u51c9\u7c89',
  '\u4ed9\u8349',
  '\u884c\u674e\u724c',
  '\u5546\u52a1\u5305',
  '\u632e\u5305',
  '\u51b0\u7bb1\u8d34',
  '\u98ce\u6247',
  '\u5305\u90ae',
  '\u793c\u76d2',
  '\u793c\u54c1',
  '\u51bb\u5e72',
  '\u751f\u6652',
  '\u519c\u5bb6',
  '\u52a9\u519c',
  '\u6d77\u5473',
  '\u571f\u8292\u7c73',
  '\u725b\u8089\u5e72',
  '\u51fa\u53d1\u5305',
  '\u6838\u6843\u7cd6',
  '\u9ed1\u9e21\u67f1',
  '\u9a6c\u8e44\u7c89',
  '\u5305\u6f06\u8c46\u8150',
  '\u9c9c\u4eba\u53c2',
  '\u7ef4\u4ed6',
  '\u539f\u7c73',
  '\u732a\u8089\u4e38',
  '\u6885\u5dde\u67da',
  '\u5c0f\u7b1b\u5305',
  '\u8c03\u548c\u6cb9',
  '\u5355\u4e1b',
  '\u7af9\u835f',
  '\u76d0\u717d\u9e21',
  '\u7cbe\u6cb9',
  '\u62a4\u53d1\u819c',
  '\u8c46\u8150\u76ae',
  '\u725b\u809a\u83cc',
  '\u7f8a\u809a\u83cc',
  '\u814a\u8089',
  '\u9999\u80a0',
  '\u67a3\u6c41\u679c',
  '\u77e5\u6696\u676f',
  '\u5e06\u5e03\u888b',
  '\u5355\u80a9\u5305',
  '\u6253\u849c\u5668',
  '\u6587\u521b',
  '\u53ef\u4e50\u732a',
  '\u53ef\u4e50\u732a\u814a',
  '\u62a4\u53d1',
  '\u706b\u821e\u79c0\u95e8\u7968',
  '\u9c7c\u997c',
  '\u9c7c\u8150',
  '\u9c7c\u76ae\u997c',
  '\u9c7c\u518c',
  '\u9e21\u6c64',
  '\u51c9\u8336',
  '\u5957\u9910',
  '\u4e0b\u5348\u8336',
  '\u7b7e\u8bc1',
  '\u918b',
  '\u7389\u7af9',
  '\u82b1\u82b3',
  '\u7cd5\u997c',
  '\u996e\u54c1',
  '\u539f\u6c41',
  '\u7535\u70d8\u76f8',
  '\u70d8\u9505',
];

const DAY_PATTERN = /(?:\d+\s*\u5929|\u534a\u5929)/;
const PACKAGING_PATTERN = /\d+\s*(?:g|kg|ml|l|\u65a4|\u888b|\u76d2|\u74f6|\u652f|\u5305|\u8d34)\b/i;
const MULTIPACK_PATTERN = /(?:x|\u00d7|\*)\s*\d+\b/i;

const BASE_TOUR_HINTS = [
  '\u65e5\u6e38',
  '\u5f92\u6b65',
  '\u8ddf\u56e2',
  '\u7ebf\u8def',
  '\u884c\u7a0b',
  '\u6210\u56e2',
  '\u9152\u5e97',
  '\u6e29\u6cc9',
  '\u5ea6\u5047',
  '\u666f\u533a',
  '\u53e4\u9547',
  '\u53e4\u6751',
  '\u4e50\u56ed',
  '\u9732\u8425',
  '\u7814\u5b66',
  '\u4eb2\u5b50',
  '\u90ae\u8f6e',
  '\u6444\u5f71',
  '\u63a2\u9669',
  '\u68ee\u6797',
  '\u516c\u56ed',
  '\u5c71\u8c37',
  '\u6f2b\u6e38',
  '\u51fa\u53d1',
  '\u9ad8\u94c1',
  '\u52a8\u8f66',
  '\u53cc\u98de',
];

function compact(text: string | undefined) {
  return (text || '').replace(/\s+/g, '');
}

function includesAny(text: string, hints: string[]) {
  return hints.some((hint) => text.includes(hint));
}

// 强旅游信号用于给模糊标题兜底，避免把真实线路误杀。
function hasStrongTourSignal(title: string) {
  const compactTitle = compact(title);
  const dynamicTourHints = compactTitle.includes('\u5c0f\u7ea2\u82b1')
    ? BASE_TOUR_HINTS.filter((hint) => hint !== '\u51fa\u53d1')
    : BASE_TOUR_HINTS;
  return DAY_PATTERN.test(compactTitle) || includesAny(compactTitle, dynamicTourHints);
}

// 商品识别同时看关键词、包装规格和多件装模式。
function looksLikeMerchandise(title: string) {
  return (
    includesAny(title, MERCHANDISE_HINTS) ||
    PACKAGING_PATTERN.test(title) ||
    MULTIPACK_PATTERN.test(title)
  );
}

type TourFilterCandidate = Pick<Tour, 'title' | 'bookingUrl'> &
  Partial<Pick<Tour, 'source' | 'price'>>;

export function isLikelyNonTour(tour: TourFilterCandidate) {
  const title = compact(tour.title);
  const bookingUrl = (tour.bookingUrl || '').toLowerCase();

  // 标题为空通常就是脏数据，直接过滤。
  if (!title) {
    return true;
  }

  // 广告拉群类文案直接过滤，避免营销内容进入线路列表。
  if (includesAny(title, AD_HINTS)) {
    return true;
  }

  if (bookingUrl.includes('/tickets/') || bookingUrl.includes('/hotel/')) {
    return true;
  }

  if (
    tour.source === '\u5eb7\u8f89' &&
    bookingUrl.includes('cctpage.com') &&
    (tour.price || 0) <= 150
  ) {
    return true;
  }

  if (includesAny(title, TICKET_HINTS)) {
    return true;
  }

  if (
    includesAny(title, TRANSPORT_ONLY_HINTS) &&
    (includesAny(title, TRANSPORT_PRICE_HINTS) ||
      includesAny(title, TRANSPORT_ONLY_ROUTES) ||
      title.includes('\u5df4\u58eb\u4ee3\u8ba2'))
  ) {
    return true;
  }

  if (title.includes('\u81ea\u7531\u884c') && includesAny(title, ['\u53cc\u7a0b\u4ea4\u901a', '\u62fc\u8f66', '\u53e3\u5cb8', '\u63a5\u9001'])) {
    return true;
  }

  // 已知乱码交通词也视为交通噪音，防止历史脏编码漏网。
  if (includesAny(title, GARBLED_TRANSPORT_HINTS)) {
    return true;
  }

  // 商品或特产命中后通常过滤，但若同时有强旅游信号则宁可保守保留。
  if (looksLikeMerchandise(title) && !hasStrongTourSignal(title)) {
    return true;
  }

  if (includesAny(title, MERCHANDISE_BRANDS)) {
    return true;
  }

  if (tour.source === '\u5e7f\u4e4b\u65c5' && (tour.price || 0) <= 120 && !hasStrongTourSignal(title)) {
    return true;
  }

  return false;
}

export function isDisplayableTour(tour: TourFilterCandidate) {
  return !isLikelyNonTour(tour);
}
