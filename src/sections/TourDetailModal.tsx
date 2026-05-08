import type { Tour } from '@/types/tour';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MapPin,
  Clock,
  Users,
  Star,
  Flame,
  Sparkles,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Bus,
  Hotel,
  Utensils,
  Shield,
  Globe,
  Wifi,
  Baby,
  CreditCard,
  RotateCcw,
  Calendar,
  User,
  BarChart3,
  HeartHandshake,
  Plane,
} from 'lucide-react';

interface TourDetailModalProps {
  tour: Tour | null;
  onClose: () => void;
}

export function TourDetailModal({ tour, onClose }: TourDetailModalProps) {
  if (!tour) return null;

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
    <Dialog open={!!tour} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-2 mb-2">
            {tour.isHot && (
              <Badge className="bg-orange-500 text-white gap-1">
                <Flame className="w-3 h-3" />热门
              </Badge>
            )}
            {tour.isNew && (
              <Badge className="bg-blue-500 text-white gap-1">
                <Sparkles className="w-3 h-3" />新品
              </Badge>
            )}
            {tour.isFlashSale && (
              <Badge className="bg-red-500 text-white gap-1">
                <Zap className="w-3 h-3" />限时抢
              </Badge>
            )}
            <Badge
              className="text-white"
              style={{ backgroundColor: sourceColor }}
            >
              {tour.source}
            </Badge>
          </div>
          <DialogTitle className="text-xl leading-relaxed">{tour.title}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="px-6 pb-6 max-h-[calc(90vh-100px)]">
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
              <p className="font-semibold text-sm">
                {tour.availableSeats}/{tour.totalSeats}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <Star className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
              <p className="text-xs text-slate-500">评分</p>
              <p className="font-semibold text-sm text-slate-400">—</p>
            </div>
          </div>

          {/* 价格区域 */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                {tour.originalPrice && (
                  <span className="text-sm text-slate-400 line-through mr-2">
                    原价 ￥{tour.originalPrice}
                  </span>
                )}
                <div className="flex items-baseline gap-1">
                  <span className="text-red-500 font-medium">￥</span>
                  <span className="text-3xl font-bold text-red-500">{tour.price}</span>
                  <span className="text-sm text-slate-500">/{tour.priceUnit}起</span>
                </div>
              </div>
              {tour.discountRate && (
                <Badge className="bg-red-500 text-white text-sm px-3 py-1">
                  限时省 {tour.discountRate}%
                </Badge>
              )}
            </div>

            {/* 单房差参考提示 */}
            <div className="bg-amber-100 border border-amber-300 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800 text-sm mb-1">
                  ⚠️ 单房差参考（以实际预订为准）
                </h4>
                <p className="text-sm text-amber-700 leading-relaxed">
                  {tour.singleSupplementNote}。单房差金额由各旅行社根据酒店实际报价确定，以上仅为参考估算。
                </p>
                <div className="mt-2 flex items-center gap-4 text-sm text-amber-800">
                  <span className="font-semibold">
                    单人出行预估 = 团费 ￥{tour.price} + 单房差约 ￥{tour.singleSupplement} = ￥
                    {tour.price + tour.singleSupplement}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">行程概览</TabsTrigger>
              <TabsTrigger value="itinerary">每日安排</TabsTrigger>
              <TabsTrigger value="cost">费用明细</TabsTrigger>
              <TabsTrigger value="service">服务保障</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem icon={<Calendar className="w-4 h-4" />} label="出发日期" value={tour.departureDate} />
                <InfoItem icon={<Calendar className="w-4 h-4" />} label="返程日期" value={tour.returnDate} />
                <InfoItem icon={<Bus className="w-4 h-4" />} label="交通方式" value={tour.transportType} />
                <InfoItem icon={<Hotel className="w-4 h-4" />} label="住宿标准" value={`${tour.accommodationLevel} (${tour.accommodationStars}星)`} />
                <InfoItem icon={<Utensils className="w-4 h-4" />} label="餐饮安排" value={tour.meals} />
                <InfoItem icon={<Users className="w-4 h-4" />} label="团队规模" value={tour.groupSize} />
                <InfoItem icon={<BarChart3 className="w-4 h-4" />} label="难度等级" value={tour.difficulty} />
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
                <div
                  key={day.day}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
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
                <ServiceItem
                  icon={<Shield className="w-5 h-5" />}
                  label="旅游保险"
                  available={tour.travelInsurance}
                />
                <ServiceItem
                  icon={<User className="w-5 h-5" />}
                  label="导游服务"
                  available={tour.tourGuideService}
                />
                <ServiceItem
                  icon={<Wifi className="w-5 h-5" />}
                  label="免费WiFi"
                  available={tour.freeWiFi}
                />
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

          <div className="mt-6 flex gap-3">
            <Button className="flex-1" size="lg" onClick={() => window.open(tour.bookingUrl, '_blank')}>
              查看产品详情
            </Button>
            <Button variant="outline" size="lg" onClick={() => {
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
              window.open(searchUrl, '_blank');
            }}>
              官网搜索
            </Button>
            <Button variant="outline" size="lg" onClick={onClose}>
              关闭
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
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

function ServiceItem({
  icon,
  label,
  available,
}: {
  icon: React.ReactNode;
  label: string;
  available: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        available
          ? 'bg-green-50 border-green-200 text-green-700'
          : 'bg-slate-50 border-slate-200 text-slate-400'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
      {available ? (
        <CheckCircle2 className="w-4 h-4 ml-auto" />
      ) : (
        <XCircle className="w-4 h-4 ml-auto opacity-50" />
      )}
    </div>
  );
}
