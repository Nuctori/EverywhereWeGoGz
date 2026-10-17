import type { Tour } from '@/types/tour';
// 线路卡片：一屏之内要回答"去哪儿、哪天能走、怎么去、多少钱、凭什么选它"。
//
// 设计取舍（对应 2026-10 的 UI 复盘）：
// - 抬头只留"目的地 · 天数 · 交通"，不再把主题词、地点、天数在标签行重复一遍；
// - 差异点（上车点/餐食/住宿/班期密度）前置，比"资料待补充"这种系统词更重要；
// - 日期徽标只展示真正的下一个可出发班期，过期团期明说"现有班期均已结束"；
// - 价格永远带"按双人入住折算"口径，不裸挂一个 ¥249 让人误解。
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { resolveAssetUrl } from '@/lib/utils';
import { getFallbackImage, getImagePoolCandidates } from '@/lib/image';
import {
  Building2,
  Calendar,
  Clock,
  Eye,
  Heart,
  Info,
  MapPin,
  Navigation,
  Users,
  Utensils,
} from 'lucide-react';
import { memo } from 'react';
import { formatRelativeDayLabel, getReadableDestination, getReadableTheme } from '@/lib/tour-display';
import { todayCalendarDate } from '@/lib/calendar-date';
import {
  getDepartureLeadLabel,
  getDeparturePlan,
  getDistinctFacts,
  getPriceBasisLabel,
  getSingleSupplementAmountLabel,
} from '@/lib/tour-facts';

interface TourCardProps {
  tour: Tour;
  onClick: () => void;
  recommendationReason?: string;
  recommendationRank?: number;
  recommendationTier?: 'ai-detailed' | 'ai-brief' | 'local-supplement';
  recommendationSignals?: string[];
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const FACT_ICONS = {
  boarding: Navigation,
  meal: Utensils,
  stay: Building2,
  group: Users,
  cadence: Calendar,
} as const;

export const TourCard = memo(function TourCard({
  tour,
  onClick,
  recommendationReason,
  recommendationTier,
  recommendationSignals,
  isFavorite = false,
  onToggleFavorite,
}: TourCardProps) {
  const hasImage = tour.images && tour.images.length > 0;
  // 图片不可用时（含模板占位图或加载失败），用 getFallbackImage 生成来源占位图兜底。
  const rawImageSrc = hasImage ? tour.images[0] : getFallbackImage(tour.title);
  const imageSrc = resolveAssetUrl(rawImageSrc);

  const today = todayCalendarDate();
  const destination = getReadableDestination(tour);
  const departurePlan = getDeparturePlan(tour, today);
  const departureLead = getDepartureLeadLabel(tour, today);
  const relativeDay = formatRelativeDayLabel(departurePlan.nextDate, today);
  const facts = getDistinctFacts(tour, today);
  const theme = getReadableTheme(tour);
  const singleSupplement = getSingleSupplementAmountLabel(tour);
  const firstTags = (tour.tags || []).filter(Boolean).slice(0, 2);
  const isExpired = departurePlan.status === 'expired';

  return (
    <Card
      className="tour-card group surface-panel flex h-full cursor-pointer flex-col gap-0 overflow-hidden rounded-[22px] border border-stone-200/80 bg-white py-0 transition duration-200 hover:-translate-y-1 hover:border-orange-900/20 hover:shadow-[0_18px_42px_rgba(28,25,23,0.10)] [contain-intrinsic-size:auto_380px] [content-visibility:auto] sm:rounded-[26px]"
      onClick={onClick}
    >
      <div className="relative h-36 overflow-hidden bg-stone-100 sm:h-48">
        <img
          src={imageSrc}
          alt={tour.title}
          className={`absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${isExpired ? 'saturate-[0.6]' : ''}`}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          onError={(event) => {
            const image = event.currentTarget;
            if (image.dataset.fallbackApplied === 'true') return;
            // 本地图库在 Pages 产物里已被剥离，同源 404 时先按 CDN 池候选重试
            // （SW 未接管/未选优的窗口），全部失败才换占位图。
            const poolCandidates = getImagePoolCandidates(rawImageSrc);
            const retryIndex = Number(image.dataset.poolRetryIndex || '0');
            if (retryIndex < poolCandidates.length) {
              image.dataset.poolRetryIndex = String(retryIndex + 1);
              image.src = poolCandidates[retryIndex];
              return;
            }
            image.dataset.fallbackApplied = 'true';
            image.src = getFallbackImage(tour.title);
          }}
        />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-stone-950/30 via-stone-950/8 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-white/85 bg-white/96 px-3 py-1.5 text-[11px] font-semibold tracking-[0.01em] text-stone-800 shadow-[0_8px_24px_rgba(15,23,42,0.18)] ring-1 ring-black/6 backdrop-blur-md">
            {tour.source}
          </span>
          {departurePlan.status === 'scheduled' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-700/92 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-[0_8px_24px_rgba(15,23,42,0.18)] backdrop-blur-md">
              <Calendar className="h-3 w-3" />
              {/* 图片角标是"哪天最早能走"的唯一出处；价格行不再重复日期 */}
              最早 {departureLead.label} 出发
            </span>
          )}
        </div>
        {onToggleFavorite && (
          <button
            type="button"
            aria-label={isFavorite ? '取消收藏' : '收藏线路'}
            aria-pressed={isFavorite}
            title={isFavorite ? '已收藏，点击取消' : '收藏这条线路'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-stone-600 shadow-sm backdrop-blur hover:bg-white"
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-orange-500 text-orange-500' : ''}`} />
          </button>
        )}
        {tour.discountRate && tour.discountRate > 0 && (
          <div className="absolute bottom-3 right-3 rounded-full border border-white/85 bg-white/96 px-3 py-1.5 text-[11px] font-semibold tracking-[0.01em] text-stone-800 shadow-[0_8px_24px_rgba(15,23,42,0.18)] ring-1 ring-black/6 backdrop-blur-md">
            参考降价 {tour.discountRate}%
          </div>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-[15px] font-semibold leading-6 text-stone-900 transition-colors group-hover:text-orange-900 sm:text-base sm:leading-7">
          <button
            type="button"
            className="line-clamp-2 rounded-md text-left sm:line-clamp-3"
            onClick={(event) => {
              event.stopPropagation();
              onClick();
            }}
          >
            {tour.title}
          </button>
        </h3>

        {/* 抬头：去哪儿 · 去多久 · 怎么去 · 什么调性，一行讲完基础信息 */}
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-stone-500">
          <span className="flex items-center gap-1 font-medium text-stone-700">
            <MapPin className="h-3.5 w-3.5" />
            {destination}
          </span>
          <span className="text-stone-300">/</span>
          <span>{tour.duration}天</span>
          {theme && (
            <>
              <span className="text-stone-300">/</span>
              <span className="text-orange-800">{theme}</span>
            </>
          )}
        </p>

        {/* 差异点：先给能区分两条线路的信息，而不是到处都写的"自然风光" */}
        {facts.length > 0 && (
          <ul className="mt-3 space-y-1.5 rounded-2xl bg-stone-50/90 px-3 py-2.5">
            {facts.slice(0, 3).map((fact) => {
              const Icon = FACT_ICONS[fact.key];
              return (
                <li key={fact.key} className="flex items-start gap-2 text-xs leading-5 text-stone-600" title={fact.detail}>
                  <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />
                  <span className="line-clamp-1">{fact.label}</span>
                </li>
              );
            })}
          </ul>
        )}

        {firstTags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {firstTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-normal text-stone-500 ring-1 ring-stone-200 hover:bg-white"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* 简要推荐位：一句话简单介绍 + 看点短语，轻量展示 */}
        {recommendationTier === 'ai-brief' && (recommendationReason || (recommendationSignals || []).length > 0) && (
          <div className="mt-3 rounded-2xl border border-orange-100 bg-orange-50/60 px-3 py-2 text-xs leading-5 text-stone-700">
            <p className="line-clamp-2">{recommendationReason}</p>
            {(recommendationSignals || []).length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {(recommendationSignals || []).slice(0, 3).map((signal) => (
                  <span key={signal} className="rounded-full bg-white px-2 py-0.5 text-[11px] text-stone-500 ring-1 ring-stone-200">
                    {signal}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI 详细推荐理由，来自 AiRecommendPanel 结果（简要位走上面的轻量样式） */}
        {recommendationReason && recommendationTier !== 'ai-brief' && (
          <div
            className="mt-3 rounded-2xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs leading-5 text-orange-800"
            title={recommendationReason}
          >
            <p className="line-clamp-3">
              <span className="font-medium">推荐理由：</span>
              {recommendationReason}
            </p>
          </div>
        )}

        {recommendationTier === 'local-supplement' && (
          <div className="mt-2 text-xs text-stone-400">比较备选</div>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-stone-100 pt-3.5 sm:pt-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium">
              {departurePlan.status === 'scheduled' ? (
                // 日期只在图片角标出现一次；这里只补充"今天/明天"和时间感受。
                <span className="inline-flex items-center gap-1 text-stone-600">
                  <Clock className="h-3 w-3" />
                  {relativeDay ? `${relativeDay}就能出发` : `还能选 ${departurePlan.upcomingCount} 个班期`}
                </span>
              ) : (
                <span className={departurePlan.status === 'expired' ? 'inline-flex items-center gap-1 text-amber-700' : 'inline-flex items-center gap-1 text-stone-500'}>
                  <Info className="h-3 w-3" />
                  {departureLead.label}
                </span>
              )}
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
              <span className="text-2xl font-semibold tracking-tight text-stone-950">¥{tour.price.toLocaleString()}</span>
              <span className="text-[11px] text-stone-500">/ 人起</span>
              {tour.originalPrice && tour.originalPrice > tour.price && (
                <span className="text-sm text-stone-400 line-through">¥{tour.originalPrice.toLocaleString()}</span>
              )}
            </div>
            <p className="mt-0.5 truncate text-[11px] text-stone-400" title={tour.singleSupplementNote || undefined}>
              {getPriceBasisLabel(tour)}
              {singleSupplement ? ` · ${singleSupplement}` : ''}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-11 shrink-0 rounded-xl border-orange-900/15 bg-orange-50/70 px-3 text-xs text-orange-900 hover:bg-orange-100 hover:text-orange-950"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Eye className="h-3.5 w-3.5" />
            详情
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
