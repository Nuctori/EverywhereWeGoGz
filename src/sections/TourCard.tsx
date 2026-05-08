import type { Tour } from '@/types/tour';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Clock, Users, Flame, Sparkles, Zap, Eye, ImageOff, Footprints, Mountain } from 'lucide-react';
import { useState, memo } from 'react';

interface TourCardProps {
  tour: Tour;
  onClick: () => void;
}

export const TourCard = memo(function TourCard({ tour, onClick }: TourCardProps) {
  const sourceColor = { 假日通: '#FF6B35', 广州去旅行: '#4ECDC4', 康辉: '#1A535C', 暴走村: '#B8860B', 广之旅: '#FF006E', 广东中旅: '#8338EC', 品途: '#3A86FF' }[tour.source] || '#666';
  const [imgError, setImgError] = useState(false);
  const hasImage = tour.images && tour.images.length > 0 && !imgError;

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-slate-200" onClick={onClick}>
      <div className="relative h-48 overflow-hidden bg-slate-100">
        {hasImage ? (
          <img src={tour.images[0]} alt={tour.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={() => setImgError(true)} loading="lazy" decoding="async" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100"><ImageOff className="w-12 h-12 text-slate-300" /></div>
        )}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-md" style={{ backgroundColor: sourceColor }}>{tour.source}</div>
        <div className="absolute top-3 right-3 flex gap-1.5">
          {tour.isHot && <Badge className="bg-orange-500 hover:bg-orange-600 text-white gap-1"><Flame className="w-3 h-3" />热门</Badge>}
          {tour.isNew && <Badge className="bg-blue-500 hover:bg-blue-600 text-white gap-1"><Sparkles className="w-3 h-3" />新品</Badge>}
          {tour.isFlashSale && <Badge className="bg-red-500 hover:bg-red-600 text-white gap-1"><Zap className="w-3 h-3" />限时</Badge>}
        </div>
        {tour.discountRate && tour.discountRate > 0 && <div className="absolute bottom-3 right-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">-{tour.discountRate}%</div>}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2 text-sm leading-relaxed group-hover:text-blue-600 transition-colors">{tour.title}</h3>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tour.tags?.slice(0, 3).map((tag) => <Badge key={tag} variant="secondary" className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200">{tag}</Badge>)}
          {tour.leisureLevel === 'medium' && (
            <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 gap-1">
              <Footprints className="w-3 h-3" />需体力
            </Badge>
          )}
          {tour.leisureLevel === 'hard' && (
            <Badge variant="secondary" className="text-xs bg-red-50 text-red-700 hover:bg-red-100 gap-1">
              <Mountain className="w-3 h-3" />高强度
            </Badge>
          )}
        </div>
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center text-xs text-slate-500 gap-3">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{tour.destination}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{tour.duration}天</span>
          </div>
          <div className="flex items-center text-xs text-slate-500 gap-3">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{tour.departureDate || '待定'}</span>
            {tour.groupSize && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{tour.groupSize}</span>}
          </div>
        </div>
        {/* 评价数据为算法生成的伪随机数，暂不展示 */}
        <div className="flex items-end justify-between pt-2 border-t border-slate-100">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-red-500">¥{tour.price.toLocaleString()}</span>
              {tour.originalPrice && tour.originalPrice > tour.price && <span className="text-xs text-slate-400 line-through">¥{tour.originalPrice.toLocaleString()}</span>}
            </div>
            <p className={`text-xs mt-0.5 ${tour.singleSupplement > 0 ? 'text-amber-700' : 'text-green-700'}`}>
              {tour.singleSupplement > 0 ? <>单人出行约补 <span className="font-semibold">¥{tour.singleSupplement}</span>（以预订为准）</> : '本产品无需补单房差，单人出行同价'}
            </p>
          </div>
          <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white gap-1.5" onClick={(e) => { e.stopPropagation(); onClick(); }}>
            <Eye className="w-3.5 h-3.5" />查看详情
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
