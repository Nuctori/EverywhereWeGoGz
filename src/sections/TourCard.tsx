import type { Tour } from '@/types/tour';
// 线路卡片组件件：展示标題、图片、价格、强度标签和 AI推荐理由的容器单元。
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { resolveAssetUrl } from '@/lib/utils';
import { getFallbackImage } from '@/lib/image';
import {
  Calendar,
  Clock,
  Eye,
  Footprints,
  MapPin,
  Mountain,
  Users,
} from 'lucide-react';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getReadableDestination, getDepartureDateBadgeLabel, buildTitleSummary } from '@/lib/tour-display';

interface TourCardProps {
  tour: Tour;
  onClick: () => void;
  recommendationReason?: string;
  recommendationRank?: number;
}

export const TourCard = memo(function TourCard({
  tour,
  onClick,
  recommendationReason,
}: TourCardProps) {
  const hasImage = tour.images && tour.images.length > 0;
  // 图片不可用时（含模板占位图或加载失败），用 getFallbackImage 生成来源占位图冒底。
  const rawImageSrc = hasImage ? tour.images[0] : getFallbackImage(tour.title);
  const imageSrc = resolveAssetUrl(rawImageSrc);
  const tags = tour.tags?.slice(0, 2) || [];
  // 单房差说明非空时标注“已提供”，否则提示“单人出行费用待确认”。
  const hasReliableSingleSupplement = Boolean(tour.singleSupplementNote?.trim());
  const titleSummary = buildTitleSummary(tour);
  const destinationLabel = getReadableDestination(tour);
  const departureDateLabel = getDepartureDateBadgeLabel(tour);

  return (
    <Card
      className="group surface-panel cursor-pointer gap-0 overflow-hidden rounded-[22px] border border-stone-200/80 bg-white/95 py-0 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)] sm:rounded-[26px]"
      onClick={onClick}
    >
      <div className="relative h-44 overflow-hidden bg-stone-100 sm:h-52">
        <img
          src={imageSrc}
          alt={tour.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          onError={(event) => {
            if (event.currentTarget.dataset.fallbackApplied === 'true') return;
            event.currentTarget.dataset.fallbackApplied = 'true';
            event.currentTarget.src = getFallbackImage(tour.title);
          }}
        />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-stone-950/32 via-stone-950/10 to-transparent" />
        <div className="absolute left-4 top-4 rounded-full border border-white/85 bg-white/96 px-3 py-1.5 text-[11px] font-semibold tracking-[0.01em] text-stone-800 shadow-[0_8px_24px_rgba(15,23,42,0.18)] ring-1 ring-black/6 backdrop-blur-md">
          {tour.source}
        </div>
        {tour.discountRate && tour.discountRate > 0 && (
          <div className="absolute bottom-4 right-4 rounded-full border border-white/85 bg-white/96 px-3 py-1.5 text-[11px] font-semibold tracking-[0.01em] text-stone-800 shadow-[0_8px_24px_rgba(15,23,42,0.18)] ring-1 ring-black/6 backdrop-blur-md">
            参考降价 {tour.discountRate}%
          </div>
        )}
      </div>

      <CardContent className="p-4 sm:p-5">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <h3 className="line-clamp-2 text-base font-semibold leading-7 text-stone-900 transition-colors group-hover:text-stone-700 sm:line-clamp-3">
                {tour.title}
              </h3>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              <p>{tour.title}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <p className="mt-2 line-clamp-2 text-sm text-stone-500">
          {titleSummary}
        </p>

        {/* AI 推荐理由，来自 AiRecommendPanel 结果 */}
        {recommendationReason && (
          <div
            className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-800"
            title={recommendationReason}
          >
            <p className="line-clamp-3">
              <span className="font-medium">
                推荐理由：
              </span>
              {recommendationReason}
            </p>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-normal text-stone-600 hover:bg-stone-100"
            >
              {tag}
            </Badge>
          ))}
          {tour.leisureLevel === 'medium' && (
            <Badge
              variant="secondary"
              className="gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-normal text-amber-700 hover:bg-amber-50"
            >
              <Footprints className="h-3 w-3" />
              行程强度中等
            </Badge>
          )}
          {tour.leisureLevel === 'hard' && (
            <Badge
              variant="secondary"
              className="gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-normal text-red-700 hover:bg-red-50"
            >
              <Mountain className="h-3 w-3" />
              行程强度较高
            </Badge>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-500">
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{destinationLabel}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{tour.duration}天</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-500">
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{departureDateLabel}</span>
            {tour.groupSize && <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{tour.groupSize}</span>}
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-stone-100 pt-4 sm:mt-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">参考价格</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold tracking-tight text-stone-950">
                ¥{tour.price.toLocaleString()}
              </span>
              {tour.originalPrice && tour.originalPrice > tour.price && (
                <span className="text-sm text-stone-400 line-through">
                  ¥{tour.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            <p className={'mt-1 text-xs '}>
              {hasReliableSingleSupplement ? (
                <>已提供单房差说明</>
              ) : (
                '单人出行费用待确认'
              )}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-9 rounded-xl border-stone-200 bg-white px-3 text-xs text-stone-700 hover:bg-stone-50 hover:text-stone-900"
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
