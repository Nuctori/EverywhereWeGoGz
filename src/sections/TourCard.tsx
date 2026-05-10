import type { Tour } from '@/types/tour';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin, Calendar, Clock, Users, Flame, Sparkles, Zap,
  Eye, ImageOff, Footprints, Mountain,
} from 'lucide-react';
import { useState, memo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TourCardProps {
  tour: Tour;
  onClick: () => void;
}

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=400&h=300&fit=crop',
];

function getFallbackImage(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  const index = Math.abs(hash) % FALLBACK_IMAGES.length;
  return FALLBACK_IMAGES[index];
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
  const [imgError, setImgError] = useState(false);
  const hasImage = tour.images && tour.images.length > 0 && !imgError;
  const rawImageSrc = hasImage ? tour.images[0] : getFallbackImage(tour.title);
  // 自动将 http 升级为 https，避免 Mixed Content 警告
  const imageSrc = rawImageSrc.startsWith('http://') ? rawImageSrc.replace('http://', 'https://') : rawImageSrc;

  // 限制标签数量，来源标签用灰色
  const tags = tour.tags?.slice(0, 2) || [];

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-slate-200" onClick={onClick}>
      <div className="relative h-48 overflow-hidden bg-slate-100">
        <img
          src={imageSrc}
          alt={tour.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => setImgError(true)}
          loading="lazy"
          decoding="async"
        />
        {imgError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <ImageOff className="w-12 h-12 text-slate-300" />
          </div>
        )}
        {/* 来源标签 - 灰色系 */}
        <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium text-slate-600 bg-white/90 shadow-sm backdrop-blur-sm">
          {tour.source}
        </div>
        {/* 促销标签 - 限制最多2个 */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          {tour.isHot && (
            <Badge className="bg-orange-500 hover:bg-orange-600 text-white gap-1 text-[10px] px-1.5 py-0.5">
              <Flame className="w-3 h-3" />热门
            </Badge>
          )}
          {tour.isFlashSale && (
            <Badge className="bg-red-500 hover:bg-red-600 text-white gap-1 text-[10px] px-1.5 py-0.5">
              <Zap className="w-3 h-3" />限时
            </Badge>
          )}
          {!tour.isHot && !tour.isFlashSale && tour.isNew && (
            <Badge className="bg-blue-500 hover:bg-blue-600 text-white gap-1 text-[10px] px-1.5 py-0.5">
              <Sparkles className="w-3 h-3" />新品
            </Badge>
          )}
        </div>
        {tour.discountRate && tour.discountRate > 0 && (
          <div className="absolute bottom-3 right-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
            -{tour.discountRate}%
          </div>
        )}
      </div>
      <CardContent className="p-4">
        {/* 标题带 Tooltip */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2 text-sm leading-relaxed group-hover:text-blue-600 transition-colors">
                {tour.title}
              </h3>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              <p>{tour.title}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200">
              {tag}
            </Badge>
          ))}
          {tour.leisureLevel === 'medium' && (
            <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 hover:bg-amber-100 gap-0.5">
              <Footprints className="w-2.5 h-2.5" />需体力
            </Badge>
          )}
          {tour.leisureLevel === 'hard' && (
            <Badge variant="secondary" className="text-[10px] bg-red-50 text-red-700 hover:bg-red-100 gap-0.5">
              <Mountain className="w-2.5 h-2.5" />高强度
            </Badge>
          )}
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center text-xs text-slate-500 gap-3">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{tour.destination}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{tour.duration}天</span>
          </div>
          <div className="flex items-center text-xs text-slate-500 gap-3">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(tour.departureDate)}</span>
            {tour.groupSize && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{tour.groupSize}</span>}
          </div>
        </div>

        <div className="flex items-end justify-between pt-2 border-t border-slate-100">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-red-500">¥{tour.price.toLocaleString()}</span>
              {tour.originalPrice && tour.originalPrice > tour.price && (
                <span className="text-xs text-slate-400 line-through">¥{tour.originalPrice.toLocaleString()}</span>
              )}
            </div>
            <p className={`text-[11px] mt-0.5 ${tour.singleSupplement > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {tour.singleSupplement > 0
                ? <>单人约补 <span className="font-semibold">¥{tour.singleSupplement}</span></>
                : '✓ 单人同价，无需补差'}
            </p>
          </div>
          <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white gap-1 text-xs px-3" onClick={(e) => { e.stopPropagation(); onClick(); }}>
            <Eye className="w-3.5 h-3.5" />详情
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
