import type { Tour } from '@/types/tour';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { resolveAssetUrl } from '@/lib/utils';
import { getFallbackImage } from '@/lib/image';
import {
  MapPin, Clock, Users, Star, Flame, Sparkles, Zap,
  AlertTriangle, CheckCircle2, XCircle, Info,
  Bus, Hotel, Utensils, Shield, Globe, Wifi, Baby,
  CreditCard, RotateCcw, Calendar, User, BarChart3,
  HeartHandshake, Plane, Footprints, Mountain, TreePine,
  ExternalLink, Search, X, ChevronRight,
} from 'lucide-react';

interface TourDetailModalProps {
  tour: Tour | null;
  onClose: () => void;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '待定';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function TourDetailModal({ tour, onClose }: TourDetailModalProps) {
  const isMobile = useIsMobile();
  if (!tour) return null;
  const heroImage = resolveAssetUrl(
    (tour.images?.[0] || '').startsWith('http://')
      ? (tour.images?.[0] || '').replace('http://', 'https://')
      : tour.images?.[0] || '',
  );
  const heroFallbackImage = getFallbackImage(tour.title);

  const sourceColor = {
    假日通: '#FF6B35', 广州去旅行: '#4ECDC4', 康辉: '#1A535C',
    暴走村: '#B8860B', 广之旅: '#FF006E', 广东中旅: '#8338EC', 品途: '#3A86FF',
  }[tour.source] || '#666';

  const searchUrls: Record<string, string> = {
    '广之旅': 'https://www.gzl.com.cn/search?keyword=',
    '广东中旅': 'http://m.gdcts.com/search?keyword=',
    '假日通': 'http://www.jrt365.com/tourgroup/tourgroup_list.aspx?keyword=',
    '品途': 'http://gz.ptotour.com/search?keyword=',
    '康辉': 'http://gz.cctpage.com/PC/Search?keyword=',
    '暴走村': 'http://gftblm.360jlb.cn/m/events?q=',
    '广州去旅行': 'http://gzqlx.360jlb.cn/m/events?q=',
  };

  const searchUrl = searchUrls[tour.source] + encodeURIComponent(tour.title.slice(0, 20));
  const openExternalLink = (url: string) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const content = (
    <>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {tour.isHot && (
          <Badge className="bg-orange-500 text-white gap-1 text-xs">
            <Flame className="w-3 h-3" />热门
          </Badge>
        )}
        {tour.isNew && (
          <Badge className="bg-blue-500 text-white gap-1 text-xs">
            <Sparkles className="w-3 h-3" />新品
          </Badge>
        )}
        {tour.isFlashSale && (
          <Badge className="bg-red-500 text-white gap-1 text-xs">
            <Zap className="w-3 h-3" />限时抢
          </Badge>
        )}
        <Badge className="text-white text-xs" style={{ backgroundColor: sourceColor }}>
          {tour.source}
        </Badge>
      </div>

      {(heroImage || heroFallbackImage) && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          <img
            src={heroImage || heroFallbackImage}
            alt={tour.title}
            className="h-56 w-full object-cover sm:h-72"
            loading="eager"
            decoding="async"
            onError={(event) => {
              const target = event.currentTarget;
              if (target.dataset.fallbackApplied === 'true') return;
              target.dataset.fallbackApplied = 'true';
              target.src = heroFallbackImage;
            }}
          />
        </div>
      )}

      {/* 核心信息 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <MapPin className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="text-xs text-slate-500">目的地</p>
          <p className="font-semibold text-sm">{tour.destination}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <Clock className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-xs text-slate-500">行程天数</p>
          <p className="font-semibold text-sm">{tour.duration}天</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <Users className="w-5 h-5 text-purple-500 mx-auto mb-1" />
          <p className="text-xs text-slate-500">剩余名额</p>
          <p className="font-semibold text-sm">{tour.availableSeats}/{tour.totalSeats}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <Star className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
          <p className="text-xs text-slate-500">评分</p>
          <p className="font-semibold text-sm text-slate-400">—</p>
        </div>
      </div>

      {/* 价格区域 */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl p-4 sm:p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            {tour.originalPrice && (
              <span className="text-sm text-slate-400 line-through mr-2">
                原价 ¥{tour.originalPrice.toLocaleString()}
              </span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-red-500 font-medium">¥</span>
              <span className="text-2xl sm:text-3xl font-bold text-red-500">{tour.price.toLocaleString()}</span>
              <span className="text-sm text-slate-500">/{tour.priceUnit}起</span>
            </div>
          </div>
          {tour.discountRate && (
            <Badge className="bg-red-500 text-white text-sm px-3 py-1">
              限时省 {tour.discountRate}%
            </Badge>
          )}
        </div>

        {/* 单房差提示 */}
        {tour.singleSupplement > 0 ? (
          <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 sm:p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-800 text-sm mb-1">
                单房差参考（以实际预订为准）
              </h4>
              <p className="text-xs sm:text-sm text-amber-700 leading-relaxed">
                {tour.singleSupplementNote}。单房差金额由各旅行社根据酒店实际报价确定，以上仅为参考估算。
              </p>
              <div className="mt-2 text-xs sm:text-sm text-amber-800">
                <span className="font-semibold">
                  单人出行预估 = 团费 ¥{tour.price.toLocaleString()} + 单房差约 ¥{tour.singleSupplement} = ¥{(tour.price + tour.singleSupplement).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <span className="text-sm text-green-700">本产品无需补单房差，单人出行同价</span>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button className="h-11 bg-slate-900 hover:bg-slate-800" size="lg" onClick={() => openExternalLink(tour.bookingUrl)}>
            <ExternalLink className="w-4 h-4 mr-2" />查看产品详情
          </Button>
          <Button variant="outline" className="h-11" size="lg" onClick={() => openExternalLink(searchUrl)}>
            <Search className="w-4 h-4 mr-2" />官网搜索
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        {/* 移动端Tab可滚动 */}
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">行程概览</TabsTrigger>
          <TabsTrigger value="itinerary" className="text-xs sm:text-sm py-2">每日安排</TabsTrigger>
          <TabsTrigger value="cost" className="text-xs sm:text-sm py-2">费用明细</TabsTrigger>
          <TabsTrigger value="service" className="text-xs sm:text-sm py-2">服务保障</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* 出团日期选择器 */}
          <DepartureDateSelector tour={tour} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoItem icon={<Calendar className="w-4 h-4" />} label="返程日期" value={formatDate(tour.returnDate)} />
            <InfoItem icon={<Bus className="w-4 h-4" />} label="交通方式" value={tour.transportType} />
            <InfoItem icon={<Hotel className="w-4 h-4" />} label="住宿标准" value={`${tour.accommodationLevel} (${tour.accommodationStars}星)`} />
            <InfoItem icon={<Utensils className="w-4 h-4" />} label="餐饮安排" value={tour.meals} />
            <InfoItem icon={<Users className="w-4 h-4" />} label="团队规模" value={tour.groupSize} />
            <InfoItem icon={<BarChart3 className="w-4 h-4" />} label="难度等级" value={tour.difficulty} />
            <LeisureLevelItem level={tour.leisureLevel} />
            <InfoItem icon={<Globe className="w-4 h-4" />} label="出行季节" value={tour.season} />
            <InfoItem icon={<HeartHandshake className="w-4 h-4" />} label="导游语言" value={tour.language} />
            <InfoItem icon={<Plane className="w-4 h-4" />} label="签证要求" value={tour.visaRequirements} />
          </div>

          <div className="mt-4">
            <h4 className="font-semibold text-slate-800 mb-2">行程亮点</h4>
            <div className="flex flex-wrap gap-2">
              {tour.highlights.map((h) => (
                <Badge key={h} variant="outline" className="text-sm py-1 px-3">
                  ✨ {h}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold text-slate-800 mb-2">适合人群</h4>
            <div className="flex flex-wrap gap-2">
              {tour.suitableFor.map((s) => (
                <Badge key={s} className="bg-blue-50 text-blue-600 border-blue-200">
                  {s}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold text-slate-800 mb-2">重要须知</h4>
            <ul className="space-y-2">
              {tour.importantNotes.map((note, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="itinerary" className="space-y-4 mt-4">
          {tour.itinerary.map((day) => (
            <div key={day.day} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-blue-500 text-white">第{day.day}天</Badge>
                <h4 className="font-semibold text-slate-800">{day.title}</h4>
              </div>
              <p className="text-sm text-slate-600 mb-3">{day.description}</p>
              <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Utensils className="w-3.5 h-3.5" />
                  {day.meals.join('、')}
                </span>
                <span className="flex items-center gap-1">
                  <Hotel className="w-3.5 h-3.5" />
                  {day.accommodation}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {day.activities.map((act) => (
                  <Badge key={act} variant="secondary" className="text-xs">
                    {act}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="cost" className="space-y-4 mt-4">
          <div>
            <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              费用包含
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tour.inclusions.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              费用不含
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tour.exclusions.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-slate-800">退改政策</h4>
            <InfoItem icon={<RotateCcw className="w-4 h-4" />} label="取消政策" value={tour.cancellationPolicy} />
            <InfoItem icon={<CreditCard className="w-4 h-4" />} label="退款说明" value={tour.refundPolicy} />
            <InfoItem icon={<Baby className="w-4 h-4" />} label="儿童政策" value={tour.childPolicy} />
          </div>
        </TabsContent>

        <TabsContent value="service" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <ServiceItem icon={<Shield className="w-5 h-5" />} label="旅游保险" available={tour.travelInsurance} />
            <ServiceItem icon={<User className="w-5 h-5" />} label="导游服务" available={tour.tourGuideService} />
            <ServiceItem icon={<Wifi className="w-5 h-5" />} label="免费WiFi" available={tour.freeWiFi} />
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              平台承诺
            </h4>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                真实价格：所有费用明码标价，无隐形消费
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                单房差透明：明确告知单人出行额外成本
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                多站比价：同一线路7大站点横向对比
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                信息实时：价格、余位每日同步更新
              </li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>

    </>
  );

  const actionButtons = (
    <div className="flex flex-col sm:flex-row gap-3 p-4 sm:p-6 border-t bg-white shrink-0">
      <Button className="flex-1 bg-slate-900 hover:bg-slate-800" size="lg" onClick={() => openExternalLink(tour.bookingUrl)}>
        <ExternalLink className="w-4 h-4 mr-2" />查看产品详情
      </Button>
      <Button variant="outline" size="lg" onClick={() => openExternalLink(searchUrl)}>
        <Search className="w-4 h-4 mr-2" />官网搜索
      </Button>
      {isMobile && <Button variant="outline" size="lg" onClick={onClose}>
        <X className="w-4 h-4 mr-2" />关闭
      </Button>}
    </div>
  );

  return (
    <>
      {/* 移动端 Sheet - 使用 CSS 隐藏桌面端 */}
      {isMobile && (
        <Sheet open={!!tour} onOpenChange={(open) => !open && onClose()}>
          <SheetContent side="bottom" className="h-[92vh] p-0 flex flex-col">
            <SheetHeader className="p-4 pb-2 border-b shrink-0">
              <SheetTitle className="text-base leading-relaxed pr-8">{tour.title}</SheetTitle>
              <SheetDescription>{tour.title} 的详细信息</SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-1 px-4 py-4">
              {content}
            </ScrollArea>
            {actionButtons}
          </SheetContent>
        </Sheet>
      )}

      {/* 桌面端 Dialog - 使用 CSS 隐藏移动端 */}
      {!isMobile && (
        <Dialog open={!!tour} onOpenChange={(open) => !open && onClose()}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
            <DialogHeader className="p-6 pb-0 shrink-0">
              <DialogTitle className="text-xl leading-relaxed">{tour.title}</DialogTitle>
              <DialogDescription>{tour.title} 的详细信息</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 px-6 py-4">
              {content}
            </ScrollArea>
            {actionButtons}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function DepartureDateSelector({ tour }: { tour: Tour }) {
  const [selectedDate, setSelectedDate] = useState(tour.departureDate);
  const [showAll, setShowAll] = useState(false);

  const allDates = tour.departureDates || [tour.departureDate];
  const hotDates = tour.hotDepartureDates || [];

  // 计算返程日期
  const getReturnDate = (departStr: string) => {
    const d = new Date(departStr);
    d.setDate(d.getDate() + tour.duration);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  // 格式化显示：今天、明天、周几
  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[d.getDay()];

    if (diff === 0) return { main: '今天', sub: `${month}/${day} ${weekday}`, tag: 'hot' };
    if (diff === 1) return { main: '明天', sub: `${month}/${day} ${weekday}`, tag: 'hot' };
    if (diff < 0) return { main: `${month}/${day}`, sub: weekday, tag: 'past' };
    if (diff <= 7) return { main: `${month}/${day}`, sub: `${weekday} · ${diff}天后`, tag: 'near' };
    return { main: `${month}/${day}`, sub: weekday, tag: 'normal' };
  };

  const displayDates = showAll ? allDates : allDates.slice(0, 4);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-slate-800 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          选择出团日期
          <span className="text-xs font-normal text-slate-400">（{allDates.length}个可选团期）</span>
        </h4>
        {selectedDate !== tour.departureDate && (
          <button
            className="text-xs text-blue-500 hover:text-blue-600"
            onClick={() => setSelectedDate(tour.departureDate)}
          >
            恢复默认
          </button>
        )}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {displayDates.map((date) => {
          const label = formatDateLabel(date);
          const isSelected = selectedDate === date;
          const isHot = hotDates.includes(date);
          const isPast = label.tag === 'past';

          return (
            <button
              key={date}
              onClick={() => !isPast && setSelectedDate(date)}
              disabled={isPast}
              className={`relative rounded-lg border p-2.5 text-left transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                  : isPast
                    ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                  {label.main}
                </span>
                {isHot && !isPast && (
                  <Flame className="w-3 h-3 text-orange-500" />
                )}
              </div>
              <p className={`text-xs mt-0.5 ${isSelected ? 'text-blue-500' : 'text-slate-400'}`}>
                {label.sub}
              </p>
              {isSelected && (
                <p className="text-[10px] text-blue-400 mt-1">
                  返程 {getReturnDate(date)}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* 展开/收起 */}
      {allDates.length > 4 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-3 py-2 text-xs text-slate-500 hover:text-blue-500 flex items-center justify-center gap-1 transition-colors"
        >
          {showAll ? '收起' : `查看全部 ${allDates.length} 个团期`}
          <ChevronRight className={`w-3 h-3 transition-transform ${showAll ? 'rotate-90' : ''}`} />
        </button>
      )}

      {/* 选中日期信息 */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">
            已选：{formatDate(selectedDate)} 出发
          </p>
          <p className="text-xs text-slate-400">
            {tour.duration}天行程 · 预计 {getReturnDate(selectedDate)} 返程
          </p>
        </div>
        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
          有位
        </Badge>
      </div>
    </div>
  );
}

function LeisureLevelItem({ level }: { level: 'easy' | 'medium' | 'hard' }) {
  const config = {
    easy: { icon: <TreePine className="w-4 h-4 text-green-500" />, label: '休闲指数', text: '轻松休闲，适合大多数人', color: 'text-green-700', bg: 'bg-green-50' },
    medium: { icon: <Footprints className="w-4 h-4 text-amber-500" />, label: '休闲指数', text: '中等强度，需要一定体力', color: 'text-amber-700', bg: 'bg-amber-50' },
    hard: { icon: <Mountain className="w-4 h-4 text-red-500" />, label: '休闲指数', text: '高强度/有挑战性，适合有户外经验者', color: 'text-red-700', bg: 'bg-red-50' },
  };
  const c = config[level] || config.easy;
  return (
    <div className={`flex items-start gap-3 rounded-lg p-3 ${c.bg}`}>
      <div className="shrink-0 mt-0.5">{c.icon}</div>
      <div>
        <p className="text-xs text-slate-500">{c.label}</p>
        <p className={`text-sm font-medium ${c.color}`}>{c.text}</p>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
      <div className="text-slate-400 shrink-0 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function ServiceItem({ icon, label, available }: { icon: React.ReactNode; label: string; available: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${available ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
      {icon}
      <span className="text-sm font-medium">{label}</span>
      {available ? <CheckCircle2 className="w-4 h-4 ml-auto" /> : <XCircle className="w-4 h-4 ml-auto opacity-50" />}
    </div>
  );
}
