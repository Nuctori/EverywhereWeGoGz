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

const LEGACY_POLICY_PLACEHOLDERS = new Set([
  '2-12岁儿童不占床享半价',
  '出发前7天可无损退改',
  '未消费项目按实结算退还',
]);

const LEGACY_NOTE_PLACEHOLDERS = new Set([
  '请携带有效身份证件',
  '行程可能因天气调整',
]);

const LEGACY_FEE_PLACEHOLDERS = new Set([
  '往返交通',
  '酒店住宿',
  '景点门票',
  '导游服务',
  '个人消费',
  '单房差',
  '自费项目',
]);

function normalizeText(value: string | undefined) {
  return (value || '').trim();
}

function isLegacyPlaceholderItineraryDay(day: Tour['itinerary'][number]) {
  const description = normalizeText(day.description);
  const accommodation = normalizeText(day.accommodation);
  const activities = (day.activities || []).map((item) => normalizeText(item)).filter(Boolean);
  const meals = (day.meals || []).map((item) => normalizeText(item)).filter(Boolean);

  const hasPlaceholderDescription = /^今日安排.*精彩活动，感受当地独特魅力。?$/.test(description);
  const hasPlaceholderActivities =
    activities.length === 2 && activities[0] === '景点游览' && activities[1] === '自由活动';
  const hasPlaceholderAccommodation = accommodation === '当地酒店' || accommodation === '温馨的家';
  const hasPlaceholderMeals =
    meals.length > 0 && meals.every((item) => item === '早餐' || item === '午餐');

  return hasPlaceholderDescription && hasPlaceholderActivities && hasPlaceholderAccommodation && hasPlaceholderMeals;
}

function filterReliableList(items: string[] | undefined, placeholders: Set<string>) {
  return (items || []).map((item) => normalizeText(item)).filter((item) => item && !placeholders.has(item));
}

function getReliablePolicy(value: string | undefined) {
  const normalized = normalizeText(value);
  return normalized && !LEGACY_POLICY_PLACEHOLDERS.has(normalized) ? normalized : '';
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

  const reliableItinerary = (tour.itinerary || []).filter((day) => !isLegacyPlaceholderItineraryDay(day));
  const reliableInclusions = filterReliableList(tour.inclusions, LEGACY_FEE_PLACEHOLDERS);
  const reliableExclusions = filterReliableList(tour.exclusions, LEGACY_FEE_PLACEHOLDERS);
  const reliableImportantNotes = filterReliableList(tour.importantNotes, LEGACY_NOTE_PLACEHOLDERS);
  const cancellationPolicy = getReliablePolicy(tour.cancellationPolicy);
  const refundPolicy = getReliablePolicy(tour.refundPolicy);
  const childPolicy = getReliablePolicy(tour.childPolicy);
  const hasReliableCostData =
    reliableInclusions.length > 0 ||
    reliableExclusions.length > 0 ||
    Boolean(cancellationPolicy) ||
    Boolean(refundPolicy) ||
    Boolean(childPolicy);

  const content = (
    <>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {tour.isHot && (
          <Badge variant="outline" className="gap-1 border-stone-200 bg-white text-xs text-stone-600">
            <Flame className="w-3 h-3" />热度较高
          </Badge>
        )}
        {tour.isNew && (
          <Badge variant="outline" className="gap-1 border-stone-200 bg-white text-xs text-stone-600">
            <Sparkles className="w-3 h-3" />新上线
          </Badge>
        )}
        {tour.isFlashSale && (
          <Badge variant="outline" className="gap-1 border-stone-200 bg-white text-xs text-stone-600">
            <Zap className="w-3 h-3" />价格变动
          </Badge>
        )}
        <Badge variant="outline" className="border-stone-200 bg-white text-xs text-stone-600">
          {tour.source}
        </Badge>
      </div>

      {(heroImage || heroFallbackImage) && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
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
        <div className="rounded-lg border border-stone-200 bg-white p-3 text-center">
          <MapPin className="mx-auto mb-1 h-5 w-5 text-stone-500" />
          <p className="text-xs text-stone-500">目的地</p>
          <p className="text-sm font-semibold text-stone-900">{tour.destination}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-3 text-center">
          <Clock className="mx-auto mb-1 h-5 w-5 text-stone-500" />
          <p className="text-xs text-stone-500">行程天数</p>
          <p className="text-sm font-semibold text-stone-900">{tour.duration}天</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-3 text-center">
          <Users className="mx-auto mb-1 h-5 w-5 text-stone-500" />
          <p className="text-xs text-stone-500">剩余名额</p>
          <p className="text-sm font-semibold text-stone-900">{tour.availableSeats}/{tour.totalSeats}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-3 text-center">
          <Star className="mx-auto mb-1 h-5 w-5 text-stone-500" />
          <p className="text-xs text-stone-500">评分</p>
          <p className="text-sm font-semibold text-stone-400">—</p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            {tour.originalPrice && (
              <span className="mr-2 text-sm text-stone-400 line-through">
                原价 ¥{tour.originalPrice.toLocaleString()}
              </span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-stone-500 font-medium">¥</span>
              <span className="text-2xl sm:text-3xl font-semibold text-stone-900">{tour.price.toLocaleString()}</span>
              <span className="text-sm text-stone-500">/{tour.priceUnit}起</span>
            </div>
          </div>
          {tour.discountRate && (
            <Badge variant="outline" className="border-stone-200 bg-white px-3 py-1 text-sm text-stone-600">
              参考降幅 {tour.discountRate}%
            </Badge>
          )}
        </div>

        {tour.singleSupplement > 0 ? (
          <div className="flex items-start gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3 sm:p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-stone-500" />
            <div>
              <h4 className="mb-1 text-sm font-semibold text-stone-800">
                单房差说明
              </h4>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {tour.singleSupplementNote}。
              </p>
              <div className="mt-2 text-xs sm:text-sm text-stone-700">
                <span className="font-semibold">
                  单人出行预估 = 团费 ¥{tour.price.toLocaleString()} + 单房差约 ¥{tour.singleSupplement} = ¥{(tour.price + tour.singleSupplement).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-stone-500" />
            <span className="text-sm text-stone-600">单人同价</span>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button className="h-11 bg-stone-900 hover:bg-stone-800" size="lg" onClick={() => openExternalLink(tour.bookingUrl)}>
            <ExternalLink className="w-4 h-4 mr-2" />打开来源页面
          </Button>
          <Button variant="outline" className="h-11" size="lg" onClick={() => openExternalLink(searchUrl)}>
            <Search className="w-4 h-4 mr-2" />打开平台搜索
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        {/* 移动端Tab可滚动 */}
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">概览</TabsTrigger>
          <TabsTrigger value="itinerary" className="text-xs sm:text-sm py-2">每日安排</TabsTrigger>
          <TabsTrigger value="cost" className="text-xs sm:text-sm py-2">费用</TabsTrigger>
          <TabsTrigger value="service" className="text-xs sm:text-sm py-2">说明</TabsTrigger>
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
            <h4 className="font-semibold text-stone-800 mb-2">行程要点</h4>
            <div className="flex flex-wrap gap-2">
              {tour.highlights.map((h) => (
                <Badge key={h} variant="outline" className="border-stone-200 bg-white text-sm py-1 px-3 text-stone-600">
                  {h}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold text-stone-800 mb-2">适合人群</h4>
            <div className="flex flex-wrap gap-2">
              {tour.suitableFor.map((s) => (
                <Badge key={s} variant="outline" className="border-stone-200 bg-white text-stone-600">
                  {s}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold text-stone-800 mb-2">重要须知</h4>
            {reliableImportantNotes.length > 0 ? (
              <ul className="space-y-2">
                {reliableImportantNotes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                    <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                    {note}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-500">
                该线路暂未抓取到可靠的注意事项，请以下单前的来源页面说明为准。
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="itinerary" className="space-y-4 mt-4">
          {reliableItinerary.length > 0 ? reliableItinerary.map((day) => (
            <div key={day.day} className="rounded-lg border border-stone-200 bg-white p-4 transition-shadow hover:shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="border-stone-200 bg-white text-stone-600">第{day.day}天</Badge>
                <h4 className="font-semibold text-stone-800">{day.title}</h4>
              </div>
              <p className="text-sm text-stone-600 mb-3">{day.description}</p>
              <div className="flex flex-wrap gap-4 text-xs text-stone-500">
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
                  <Badge key={act} variant="secondary" className="bg-stone-100 text-xs text-stone-600">
                    {act}
                  </Badge>
                ))}
              </div>
            </div>
          )) : (
            <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 p-5 text-sm leading-6 text-stone-500">
              该线路暂未抓取到可靠的每日安排，避免误导，这里不再展示模板行程。请打开来源页面查看详细行程。
            </div>
          )}
        </TabsContent>

        <TabsContent value="cost" className="space-y-4 mt-4">
          {!hasReliableCostData && (
            <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
              该线路暂未结构化抓取到可靠的费用说明。门票、景区小交通、自费项目、儿童附加费、退改规则等额外收费，请以来源页面的“费用说明 / 预订须知”为准。
            </div>
          )}
          <div>
            <h4 className="mb-3 flex items-center gap-2 font-semibold text-stone-800">
              <CheckCircle2 className="w-5 h-5" />
              费用包含
            </h4>
            {reliableInclusions.length > 0 ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {reliableInclusions.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-stone-600">
                    <CheckCircle2 className="w-4 h-4 text-stone-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 p-4 text-sm text-stone-500">
                暂未抓取到可靠的费用包含明细。
              </div>
            )}
          </div>

          <div>
            <h4 className="mb-3 flex items-center gap-2 font-semibold text-stone-800">
              <XCircle className="w-5 h-5" />
              费用不含
            </h4>
            {reliableExclusions.length > 0 ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {reliableExclusions.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-stone-600">
                    <XCircle className="w-4 h-4 text-stone-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 p-4 text-sm text-stone-500">
                暂未抓取到可靠的费用不含、自费或额外收费说明。
              </div>
            )}
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-4 space-y-3">
            {!cancellationPolicy && !refundPolicy && !childPolicy && (
              <div className="text-sm text-stone-500">
                暂未抓取到可靠的退改、退款或儿童政策说明，请以来源页面为准。
              </div>
            )}
            <h4 className="font-semibold text-stone-800">退改政策</h4>
            <InfoItem icon={<RotateCcw className="w-4 h-4" />} label="取消政策" value={cancellationPolicy} />
            <InfoItem icon={<CreditCard className="w-4 h-4" />} label="退款说明" value={refundPolicy} />
            <InfoItem icon={<Baby className="w-4 h-4" />} label="儿童政策" value={childPolicy} />
          </div>
        </TabsContent>

        <TabsContent value="service" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <ServiceItem icon={<Shield className="w-5 h-5" />} label="旅游保险" available={tour.travelInsurance} />
            <ServiceItem icon={<User className="w-5 h-5" />} label="导游服务" available={tour.tourGuideService} />
            <ServiceItem icon={<Wifi className="w-5 h-5" />} label="免费WiFi" available={tour.freeWiFi} />
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <h4 className="mb-2 flex items-center gap-2 font-semibold text-stone-800">
              <Info className="w-4 h-4" />
              数据说明
            </h4>
            <ul className="space-y-2 text-sm text-stone-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                价格与单房差仅供参考
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                以来源平台页面为准
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                同线路可横向比较
              </li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>

    </>
  );

  const actionButtons = (
    <div className="flex flex-col sm:flex-row gap-3 p-4 sm:p-6 border-t bg-white shrink-0">
      <Button className="flex-1 bg-stone-900 hover:bg-stone-800" size="lg" onClick={() => openExternalLink(tour.bookingUrl)}>
        <ExternalLink className="w-4 h-4 mr-2" />打开来源页面
      </Button>
      <Button variant="outline" size="lg" onClick={() => openExternalLink(searchUrl)}>
        <Search className="w-4 h-4 mr-2" />打开平台搜索
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
          <SheetContent side="bottom" className="h-[100dvh] max-h-[100dvh] overflow-hidden p-0 flex min-h-0 flex-col">
            <SheetHeader className="p-4 pb-2 border-b shrink-0">
              <SheetTitle className="text-base leading-relaxed pr-8">{tour.title}</SheetTitle>
              <SheetDescription>{tour.title} 的详细信息</SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y px-4 py-4 [-webkit-overflow-scrolling:touch]">
              <div className="pb-4">
                {content}
              </div>
            </div>
            {actionButtons}
          </SheetContent>
        </Sheet>
      )}

      {/* 桌面端 Dialog - 使用 CSS 隐藏移动端 */}
      {!isMobile && (
        <Dialog open={!!tour} onOpenChange={(open) => !open && onClose()}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex min-h-0 flex-col">
            <DialogHeader className="p-6 pb-0 shrink-0">
              <DialogTitle className="text-xl leading-relaxed">{tour.title}</DialogTitle>
              <DialogDescription>{tour.title} 的详细信息</DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y px-6 py-4 [-webkit-overflow-scrolling:touch]">
              <div className="pb-4">
                {content}
              </div>
            </div>
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
  if (!value?.trim()) return null;
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
