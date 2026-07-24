// 统一加载态/错误态/就绪态、移动端 Sheet vs 桌面端 Dialog
import type { DayItinerary, ResolvedTour, TourSummary } from '@/types/tour';
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
import { cn, resolveAssetUrl } from '@/lib/utils';
import { getFallbackImage } from '@/lib/image';
import { getReadableDestination, getReadableHighlights, formatDate, hasReliableField } from '@/lib/tour-display';
import { DepartureDateSelector } from '@/components/ui/departure-date-selector';
import {
  MapPin, Clock, Users, Star, Flame, Sparkles, Zap,
  AlertTriangle, CheckCircle2, XCircle, Info,
  Bus, Hotel, Utensils, Shield, Globe, Wifi, Baby,
  CreditCard, RotateCcw, Calendar, User, BarChart3,
  HeartHandshake, Plane, Footprints, Mountain, TreePine,
  ExternalLink, Search, X,
} from 'lucide-react';

interface TourDetailModalProps {
  summaryTour: TourSummary | null;
  resolvedTour: ResolvedTour | null;
  status?: 'closed' | 'loading' | 'ready' | 'error';
  error?: string | null;
  loading?: boolean;
  onClose: () => void;
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

function isLegacyPlaceholderItineraryDay(day: DayItinerary) {
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

// 从数组中过滤掉属于占位符集合的文本项
function filterReliableList(items: string[] | undefined, placeholders: Set<string>) {
  return (items || []).map((item) => normalizeText(item)).filter((item) => item && !placeholders.has(item));
}

function getReliablePolicy(value: string | undefined) {
  const normalized = normalizeText(value);
  return normalized && !LEGACY_POLICY_PLACEHOLDERS.has(normalized) ? normalized : '';
}

export function TourDetailModal({
  summaryTour,
  resolvedTour,
  status = 'closed',
  error = null,
  loading = false,
  onClose,
}: TourDetailModalProps) {
  const isMobile = useIsMobile();
  const tour = resolvedTour ?? summaryTour;
  if (!tour) return null;
  const heroImage = resolveAssetUrl(tour.images?.[0] || '');
  const heroFallbackImage = getFallbackImage(tour.title);
  const destinationLabel = getReadableDestination(tour);
  const readableHighlights = getReadableHighlights(tour);

  const searchUrls: Record<string, string> = {
    '广之旅': 'https://www.gzl.com.cn/search?keyword=',
    '广东中旅': 'http://m.gdcts.com/search?keyword=',
    '假日通': 'http://www.jrt365.com/tourgroup/tourgroup_list.aspx?keyword=',
    '品途': 'http://gz.ptotour.com/search?keyword=',
    '康辉': 'http://gz.cctpage.com/PC/Search?keyword=',
    '暴走村': 'http://gftblm.360jlb.cn/m/events?q=',
    '广州去旅行': 'http://gzqlx.360jlb.cn/m/events?q=',
  };

  const searchUrl = (searchUrls[tour.source] || '') + encodeURIComponent(tour.title.slice(0, 20));
  const openExternalLink = (url: string) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 过滤管道：逐一清洗行程/费用/退改/备注字段，移除爬虫遗留占位文本（仅过滤不修改原始数据）
  const reliableItinerary = (resolvedTour?.itinerary || []).filter((day) => !isLegacyPlaceholderItineraryDay(day));
  const reliableInclusions = filterReliableList(resolvedTour?.inclusions, LEGACY_FEE_PLACEHOLDERS);
  const reliableExclusions = filterReliableList(resolvedTour?.exclusions, LEGACY_FEE_PLACEHOLDERS);
  const reliableOptionalExpenses = filterReliableList(resolvedTour?.optionalExpenses, LEGACY_FEE_PLACEHOLDERS);
  const reliableImportantNotes = filterReliableList(resolvedTour?.importantNotes, LEGACY_NOTE_PLACEHOLDERS);
  const cancellationPolicy = getReliablePolicy(resolvedTour?.cancellationPolicy);
  const refundPolicy = getReliablePolicy(resolvedTour?.refundPolicy);
  const childPolicy = getReliablePolicy(resolvedTour?.childPolicy);
  const hasReliableSingleSupplement = Boolean(normalizeText(tour.singleSupplementNote));
  const hasAvailabilityData =
    (resolvedTour?.availableSeats ?? 0) > 0 && (resolvedTour?.totalSeats ?? 0) > 0;
  const hasDepartureDates = (tour.departureDates || []).filter(Boolean).length > 0 || Boolean(tour.departureDate);
  const hasReliableCostData =
    reliableInclusions.length > 0 ||
    reliableExclusions.length > 0 ||
    reliableOptionalExpenses.length > 0 ||
    Boolean(cancellationPolicy) ||
    Boolean(refundPolicy) ||
    Boolean(childPolicy);
  const reliableAccommodation = hasReliableField(tour, 'accommodationLevel');
  const reliableAccommodationStars = hasReliableField(tour, 'accommodationStars');
  const reliableMeals = hasReliableField(tour, 'meals');
  const reliableGroupSize = hasReliableField(tour, 'groupSize');
  const reliableTransport = hasReliableField(tour, 'transportType');
  const reliableDifficulty = hasReliableField(tour, 'difficulty');
  const reliableLanguage = hasReliableField(tour, 'language');
  const reliableVisaRequirements = hasReliableField(tour, 'visaRequirements');
  const reliableLeisureLevel = hasReliableField(tour, 'leisureLevel');
  const reliableSeason = hasReliableField(tour, 'season');
  const reliableTravelInsurance = hasReliableField(tour, 'travelInsurance');
  const reliableTourGuideService = hasReliableField(tour, 'tourGuideService');
  const reliableFreeWiFi = hasReliableField(tour, 'freeWiFi');
  const hasReliableServiceData = reliableTravelInsurance || reliableTourGuideService || reliableFreeWiFi;


  // 根据 detailStatus 切换加载态/错误态/就绪态
  const content = (
    <>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {tour.isHot && (
          <Badge variant="outline" className="gap-1 border-stone-200 bg-white text-xs text-stone-600">
            <Flame className="w-3 h-3" />推荐线路
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
        <div className="mb-5 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 sm:mb-6">
          <img
            src={heroImage || heroFallbackImage}
            alt={tour.title}
            className="h-44 w-full object-cover sm:h-72"
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
      <div className="mb-5 grid grid-cols-2 gap-2 sm:mb-6 sm:grid-cols-4 sm:gap-3">
        <div className="rounded-lg border border-stone-200 bg-white p-2.5 text-center sm:p-3">
          <MapPin className="mx-auto mb-1 h-5 w-5 text-stone-500" />
          <p className="text-xs text-stone-500">目的地</p>
          <p className="text-sm font-semibold text-stone-900">{destinationLabel}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-2.5 text-center sm:p-3">
          <Clock className="mx-auto mb-1 h-5 w-5 text-stone-500" />
          <p className="text-xs text-stone-500">行程天数</p>
          <p className="text-sm font-semibold text-stone-900">{tour.duration}天</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-2.5 text-center sm:p-3">
          <Users className="mx-auto mb-1 h-5 w-5 text-stone-500" />
          <p className="text-xs text-stone-500">剩余名额</p>
          <p className="text-sm font-semibold text-stone-900">
            {hasAvailabilityData ? `${resolvedTour?.availableSeats}/${resolvedTour?.totalSeats}` : '待确认'}
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-2.5 text-center sm:p-3">
          <Star className="mx-auto mb-1 h-5 w-5 text-stone-500" />
          <p className="text-xs text-stone-500">数据状态</p>
          <p className="text-sm font-semibold text-stone-900">
            {tour.dataQuality?.isDepartureDateReliable ? '班期已核验' : '以源站为准'}
          </p>
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

        {hasReliableSingleSupplement ? (
          <div className="flex items-start gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3 sm:p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-stone-500" />
            <div>
              <h4 className="mb-1 text-sm font-semibold text-stone-800">
                单房差说明
              </h4>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {tour.singleSupplementNote}。
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3">
            <Info className="h-5 w-5 shrink-0 text-stone-500" />
            <span className="text-sm text-stone-600">当前未抓到可靠单房差，单人出行前建议打开源站核对</span>
          </div>
        )}

      </div>

      <Tabs defaultValue="overview" className="w-full">
        {status === 'error' && error && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            详情加载失败，当前先展示摘要信息。{error}
          </div>
        )}
        {loading && (
          <div className="mb-3 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-500">
            正在加载详情...
          </div>
        )}
        {/* 移动端Tab可滚动 */}
        <div className="sticky top-0 z-10 bg-background/95 pb-1 pt-1 backdrop-blur sm:static sm:bg-transparent sm:pt-0">
          <TabsList className="grid h-11 w-full grid-cols-4 rounded-xl p-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">概览</TabsTrigger>
            <TabsTrigger value="itinerary" className="text-xs sm:text-sm py-2">每日安排</TabsTrigger>
            <TabsTrigger value="cost" className="text-xs sm:text-sm py-2">费用</TabsTrigger>
            <TabsTrigger value="service" className="text-xs sm:text-sm py-2">说明</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* 出团日期选择器 */}
          {hasDepartureDates ? (
            <DepartureDateSelector tour={tour} />
          ) : (
            <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-500">
              该线路暂未抓取到可靠的出发日期，避免误导，这里不展示推测团期。请以来源页面的发团日历或客服确认为准。
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoItem icon={<Calendar className="w-4 h-4" />} label="返程日期" value={resolvedTour?.returnDate ? formatDate(resolvedTour.returnDate) : ''} />
            <InfoItem icon={<Bus className="w-4 h-4" />} label="交通方式" value={reliableTransport ? tour.transportType : ''} />
            <InfoItem icon={<Hotel className="w-4 h-4" />} label="住宿标准" value={reliableAccommodation ? (reliableAccommodationStars && resolvedTour?.accommodationStars ? `${tour.accommodationLevel} (${resolvedTour.accommodationStars}星)` : tour.accommodationLevel) : ''} />
            <InfoItem icon={<Utensils className="w-4 h-4" />} label="餐饮安排" value={reliableMeals ? tour.meals : ''} />
            <InfoItem icon={<Users className="w-4 h-4" />} label="团队规模" value={reliableGroupSize ? tour.groupSize : ''} />
            <InfoItem icon={<BarChart3 className="w-4 h-4" />} label="难度等级" value={reliableDifficulty ? (resolvedTour?.difficulty || '') : ''} />
            {reliableLeisureLevel && <LeisureLevelItem level={tour.leisureLevel} />}
            <InfoItem icon={<Globe className="w-4 h-4" />} label="出行季节" value={reliableSeason ? tour.season : ''} />
            <InfoItem icon={<HeartHandshake className="w-4 h-4" />} label="导游语言" value={reliableLanguage ? (resolvedTour?.language || '') : ''} />
            <InfoItem icon={<Plane className="w-4 h-4" />} label="签证要求" value={reliableVisaRequirements ? (resolvedTour?.visaRequirements || '') : ''} />
          </div>

          <div className="mt-4">
            <h4 className="font-semibold text-stone-800 mb-2">行程要点</h4>
            {readableHighlights.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {readableHighlights.map((highlight) => (
                  <Badge key={highlight} variant="outline" className="border-stone-200 bg-white text-sm py-1 px-3 text-stone-600">
                    {highlight}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-500">
                该线路暂未抓取到足够具体的行程要点，避免把模板标签当成真实卖点展示，请以来源页面为准。
              </div>
            )}
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

          <div>
            <h4 className="mb-3 flex items-center gap-2 font-semibold text-stone-800">
              <AlertTriangle className="w-5 h-5" />
              自费项目 / 额外收费
            </h4>
            {reliableOptionalExpenses.length > 0 ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {reliableOptionalExpenses.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-stone-600">
                    <AlertTriangle className="w-4 h-4 text-stone-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 p-4 text-sm text-stone-500">
                暂未抓取到可靠的自费项目或额外收费说明。
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
            {reliableTravelInsurance && <ServiceItem icon={<Shield className="w-5 h-5" />} label="旅游保险" available={Boolean(resolvedTour?.travelInsurance)} />}
            {reliableTourGuideService && <ServiceItem icon={<User className="w-5 h-5" />} label="导游服务" available={Boolean(resolvedTour?.tourGuideService)} />}
            {reliableFreeWiFi && <ServiceItem icon={<Wifi className="w-5 h-5" />} label="免费WiFi" available={Boolean(resolvedTour?.freeWiFi)} />}
          </div>
          {!hasReliableServiceData && (
            <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-500">
              暂未抓取到可靠的服务信息，请以来源页面为准。
            </div>
          )}

          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <h4 className="mb-2 flex items-center gap-2 font-semibold text-stone-800">
              <Info className="w-4 h-4" />
              使用提醒
            </h4>
            <ul className="space-y-2 text-sm text-stone-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                班期和价格会变动，下单前请再打开源站确认
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                费用包含、退改和单房差是最值得二次核对的三项
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                这个页面更适合先比线路，再决定跳去源站完成预订
              </li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>

    </>
  );


  // 底部操作按钮：打开来源/平台搜索，移动端额外有关闭按钮
  const actionButtons = (
    <div
      className={cn(
        'shrink-0 border-t bg-white',
        isMobile
          ? 'grid grid-cols-2 gap-2 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3'
          : 'flex flex-col gap-3 p-4 sm:flex-row sm:p-6',
      )}
    >
      <Button
        className={cn(
          'bg-stone-900 hover:bg-stone-800',
          isMobile ? 'col-span-2 h-11 rounded-2xl' : 'flex-1',
        )}
        size="lg"
        onClick={() => openExternalLink(tour.bookingUrl)}
      >
        <ExternalLink className="w-4 h-4 mr-2" />打开来源页面
      </Button>
      <Button
        variant="outline"
        className={cn(isMobile && 'h-11 rounded-2xl')}
        size="lg"
        onClick={() => openExternalLink(searchUrl)}
      >
        <Search className="w-4 h-4 mr-2" />打开平台搜索
      </Button>
      {isMobile && (
        <Button variant="outline" className="h-11 rounded-2xl" size="lg" onClick={onClose}>
          <X className="w-4 h-4 mr-2" />关闭
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* 移动端 Sheet - 使用 CSS 隐藏桌面端 */}
      {isMobile && (
        <Sheet open={Boolean(summaryTour)} onOpenChange={(open) => !open && onClose()}>
          <SheetContent side="bottom" className="h-[100dvh] max-h-[100dvh] min-h-0 gap-0 overflow-hidden rounded-t-[22px] border-stone-200 p-0">
            <SheetHeader className="shrink-0 border-b border-stone-200 bg-white px-4 pb-3 pt-3 text-left">
              <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-stone-300" />
              <SheetTitle className="line-clamp-2 pr-10 text-left text-sm leading-6 text-stone-950">{tour.title}</SheetTitle>
              <SheetDescription className="sr-only">{tour.title} 的详细信息</SheetDescription>
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
        <Dialog open={Boolean(summaryTour)} onOpenChange={(open) => !open && onClose()}>
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
