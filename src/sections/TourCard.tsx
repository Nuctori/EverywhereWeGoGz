import type { Tour } from '@/types/tour';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Star,
  Flame,
  Sparkles,
  Zap,
  AlertTriangle,
  Eye,
} from 'lucide-react';

interface TourCardProps {
  tour: Tour;
  onClick: () => void;
}

export function TourCard({ tour, onClick }: TourCardProps) {
  const sourceColor =
    {
      假日通: '#FF6B35',
      广州去旅行: '#4ECDC4',
      康辉: '#1A535C',
      暴走村: '#B8860B',
      广之旅: '#FF006E',
      广东中旅: '#8338EC',
      品途: '#3A86FF',
    }[tour.source] || '#666';

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-slate-200">
      <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="text-6xl opacity-20">🏞️</div>
        
        {/* 标签 */}
        <div className="absolute top-3 left-3 flex gap-2">
          {tour.isHot && (
            <Badge className="bg-orange-500 text-white gap-1">
              <Flame className="w-3 h-3" />
              热门
            </Badge>
          )}
          {tour.isNew && (
            <Badge className="bg-blue-500 text-white gap-1">
              <Sparkles className="w-3 h-3" />
              新品
            </Badge>
          )}
          {tour.isFlashSale && (
            <Badge className="bg-red-500 text-white gap-1">
              <Zap className="w-3 h-3" />
              限时抢
            </Badge>
          )}
        </div>

        {/* 来源标识 */}
        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-md"
          style={{ backgroundColor: sourceColor }}
        >
          {tour.source}
        </div>

        {/* 底部信息 */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {tour.destination}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {tour.duration}天
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              剩{tour.availableSeats}位
            </span>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2 text-sm leading-relaxed group-hover:text-blue-600 transition-colors">
          {tour.title}
        </h3>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {tour.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs font-normal">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-1 mb-3">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-medium text-slate-700">{tour.rating}</span>
          <span className="text-xs text-slate-400">({tour.reviewCount}条评价)</span>
        </div>

        {/* 单房差透明提示 */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-amber-800">单房差透明</p>
            <p className="text-xs text-amber-700 mt-0.5">
              单人出行需补 <span className="font-semibold">￥{tour.singleSupplement}</span>
            </p>
          </div>
        </div>

        <div className="flex items-end justify-between mb-3">
          <div>
            {tour.originalPrice && (
              <span className="text-xs text-slate-400 line-through mr-2">
                ￥{tour.originalPrice}
              </span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-red-500">￥</span>
              <span className="text-2xl font-bold text-red-500">{tour.price}</span>
              <span className="text-xs text-slate-400">/人起</span>
            </div>
          </div>
          {tour.discountRate && (
            <Badge className="bg-red-100 text-red-600 border-red-200">
              省{tour.discountRate}%
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
          <Calendar className="w-3.5 h-3.5" />
          <span>出发：{tour.departureDate}</span>
        </div>

        <Button
          className="w-full gap-2"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <Eye className="w-4 h-4" />
          查看详情
        </Button>
      </CardContent>
    </Card>
  );
}
