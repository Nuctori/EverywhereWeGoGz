import type { Tour } from '@/types/tour';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { resolveAssetUrl } from '@/lib/utils';
import { getFallbackImage } from '@/lib/image';
import { MapPin, Calendar, Clock, Users, Flame, Sparkles, Zap, Eye, Footprints, Mountain } from 'lucide-react';
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
  const imageSrc = resolveAssetUrl(
    rawImageSrc.startsWith('http://') ? rawImageSrc.replace('http://', 'https://') : rawImageSrc,
  );
  const tags = tour.tags?.slice(0, 2) || [];

  return (
    <Card className="group overflow-hidden cursor-pointer border-slate-200 transition-shadow duration-200 hover:shadow-md" onClick={onClick}>
      <div className="relative h-48 overflow-hidden bg-slate-100">
        <img
          src={imageSrc}
          alt={tour.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          loading="lazy"
          decoding="async"
          onError={(event) => {
            if (event.currentTarget.dataset.fallbackApplied === 'true') return;
            event.currentTarget.dataset.fallbackApplied = 'true';
            event.currentTarget.src = getFallbackImage(tour.title);
          }}
        />
        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm">
          {tour.source}
        </div>
        <div className="absolute right-3 top-3 flex gap-1.5">
          {tour.isHot && (
            <Badge className="bg-orange-500 text-white gap-1 px-1.5 py-0.5 text-[10px] hover:bg-orange-600">
              <Flame className="h-3 w-3" />热门
            </Badge>
          )}
          {tour.isFlashSale && (
            <Badge className="bg-red-500 text-white gap-1 px-1.5 py-0.5 text-[10px] hover:bg-red-600">
              <Zap className="h-3 w-3" />限时
            </Badge>
          )}
          {!tour.isHot && !tour.isFlashSale && tour.isNew && (
            <Badge className="bg-blue-500 text-white gap-1 px-1.5 py-0.5 text-[10px] hover:bg-blue-600">
              <Sparkles className="h-3 w-3" />新品
            </Badge>
          )}
        </div>
        {tour.discountRate && tour.discountRate > 0 && (
          <div className="absolute bottom-3 right-3 rounded bg-red-500 px-2 py-1 text-xs font-bold text-white">
            -{tour.discountRate}%
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-relaxed text-slate-800 transition-colors group-hover:text-blue-600">
                {tour.title}
              </h3>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              <p>{tour.title}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="bg-slate-100 text-[10px] text-slate-600 hover:bg-slate-200">
              {tag}
            </Badge>
          ))}
          {tour.leisureLevel === 'medium' && (
            <Badge variant="secondary" className="gap-0.5 bg-amber-50 text-[10px] text-amber-700 hover:bg-amber-100">
              <Footprints className="h-2.5 w-2.5" />闇€浣撳姏
            </Badge>
          )}
          {tour.leisureLevel === 'hard' && (
            <Badge variant="secondary" className="gap-0.5 bg-red-50 text-[10px] text-red-700 hover:bg-red-100">
              <Mountain className="h-2.5 w-2.5" />楂樺己搴?
            </Badge>
          )}
        </div>

        <div className="mb-3 space-y-1.5">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{tour.destination}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{tour.duration}天</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(tour.departureDate)}</span>
            {tour.groupSize && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{tour.groupSize}</span>}
          </div>
        </div>

        <div className="flex items-end justify-between border-t border-slate-100 pt-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-red-500">¥{tour.price.toLocaleString()}</span>
              {tour.originalPrice && tour.originalPrice > tour.price && (
                <span className="text-xs text-slate-400 line-through">¥{tour.originalPrice.toLocaleString()}</span>
              )}
            </div>
            <p className={`mt-0.5 text-[11px] ${tour.singleSupplement > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {tour.singleSupplement > 0 ? (
                <>单人补差 <span className="font-semibold">¥{tour.singleSupplement}</span></>
              ) : (
                '单人同价，无需补差'
              )}
            </p>
          </div>
          <Button size="sm" className="gap-1 bg-blue-500 px-3 text-xs text-white hover:bg-blue-600" onClick={(e) => { e.stopPropagation(); onClick(); }}>
            <Eye className="h-3.5 w-3.5" />详情
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
