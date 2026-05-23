import type { Tour } from '@/types/tour';
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

interface TourCardProps {
  tour: Tour;
  onClick: () => void;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '待定';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const month = d.getMonth() + 1;
  const day = d.getDate();
  if (diffDays >= 0 && diffDays <= 7) return `${month}月${day}日 · 即将出发`;
  return `${month}月${day}日`;
}

export const TourCard = memo(function TourCard({ tour, onClick }: TourCardProps) {
  const hasImage = tour.images && tour.images.length > 0;
  const rawImageSrc = hasImage ? tour.images[0] : getFallbackImage(tour.title);
  const imageSrc = resolveAssetUrl(rawImageSrc);
  const tags = tour.tags?.slice(0, 2) || [];
  const hasReliableSingleSupplement = Boolean(tour.singleSupplementNote?.trim());

  return (
    <Card
      className="group surface-panel cursor-pointer gap-0 overflow-hidden rounded-[26px] border border-stone-200/80 bg-white/95 py-0 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)]"
      onClick={onClick}
    >
      <div className="relative h-52 overflow-hidden bg-stone-100">
        <img
          src={imageSrc}
          alt={tour.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
          decoding="async"
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
            参考降幅 {tour.discountRate}%
          </div>
        )}
      </div>

      <CardContent className="p-5">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <h3 className="line-clamp-2 text-base font-semibold leading-7 text-stone-900 transition-colors group-hover:text-stone-700">
                {tour.title}
              </h3>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              <p>{tour.title}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

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
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{tour.destination}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{tour.duration}天</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-500">
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{formatDate(tour.departureDate)}</span>
            {tour.groupSize && <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{tour.groupSize}</span>}
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between border-t border-stone-100 pt-4">
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
            <p className={`mt-1 text-xs ${hasReliableSingleSupplement ? 'text-amber-700' : 'text-stone-500'}`}>
              {hasReliableSingleSupplement ? (
                <>单房差以详情页说明为准</>
              ) : (
                '单房差待确认'
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
