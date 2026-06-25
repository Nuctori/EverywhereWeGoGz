export function formatDepartureDateToggleLabel(totalCount: number, showAll: boolean) {
  if (totalCount <= 0) return '';
  return showAll ? '收起团期' : `查看全部 ${totalCount} 个团期`;
}
