const SOURCE_ICON_MAP: Record<string, string> = {
  jiari: 'jiari.png',
  qu: 'qu.png',
  kanghui: 'kanghui.png',
  baozou: 'baozou.png',
  gzl: 'gzl.png',
  gdzl: 'gdzl.png',
  pintu: 'pintu.png',
};

export function resolveSourceIcon(sourceName: string): string {
  const normalized = sourceName.toLowerCase();
  if (normalized.includes('康辉')) return SOURCE_ICON_MAP.kanghui;
  if (normalized.includes('暴走')) return SOURCE_ICON_MAP.baozou;
  if (normalized.includes('广东中旅')) return SOURCE_ICON_MAP.gdzl;
  if (normalized.includes('广之旅')) return SOURCE_ICON_MAP.gzl;
  if (normalized.includes('品途')) return SOURCE_ICON_MAP.pintu;
  if (normalized.includes('假日通')) return SOURCE_ICON_MAP.jiari;
  if (normalized.includes('去旅行') || normalized.includes('广州')) return SOURCE_ICON_MAP.qu;
  return 'default.png';
}
