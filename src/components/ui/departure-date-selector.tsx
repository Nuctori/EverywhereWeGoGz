import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Flame, ChevronRight } from 'lucide-react';
import type { Tour } from '@/types/tour';
import { formatDate } from '@/lib/tour-display';
import { formatDepartureDateToggleLabel } from '@/lib/departure-date-display';
import {
  addCalendarDays,
  compareCalendarDates,
  daysBetweenCalendarDates,
  parseCalendarDate,
  todayCalendarDate,
} from '@/lib/calendar-date';

interface DepartureDateSelectorProps {
  tour: Tour;
}

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function getWeekdayIndex(calendarDate: string) {
  const [year, month, day] = calendarDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

// 出发日期选择器，用于旅游线路详情页展示可选团期
export function DepartureDateSelector({ tour }: DepartureDateSelectorProps) {
  const todayStr = todayCalendarDate();
  const dates = (tour.departureDates || [])
    .map((value) => parseCalendarDate(value))
    .filter((value): value is string => Boolean(value));
  // 优先选中最近的未来日期，已过期默认不再被选中
  const upcoming = dates.filter((d) => d >= todayStr).sort(compareCalendarDates);
  const fallbackDate = upcoming[0] || parseCalendarDate(tour.departureDate) || dates[0] || '';
  const initialDate = (() => {
    // 若默认 departureDate 已过期，改选最近未来日期
    const defaultDate = parseCalendarDate(tour.departureDate);
    if (defaultDate && defaultDate < todayStr && upcoming.length > 0) return upcoming[0]!;
    return fallbackDate;
  })();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [showAll, setShowAll] = useState(false);
  const allDates = dates.length > 0 ? dates : (fallbackDate ? [fallbackDate] : []);
  const hotDates = tour.hotDepartureDates || [];

  // 无可用团期时直接隐藏组件
  if (allDates.length === 0 || !selectedDate) {
    return null;
  }

  // 计算返程日期 departureDate + duration（日历日加法，不经过本地时区换算）
  const getReturnDate = (departStr: string) => {
    const returnDate = addCalendarDays(departStr, tour.duration);
    if (!returnDate) return '';
    const [, month, day] = returnDate.split('-');
    return `${Number(month)}月${Number(day)}日`;
  };

  // 格式化日期标签：今天/明天/周几/N天后/已过期
  // 返回值 tag 含义：hot=热门/past=已过期/near=临近出发/normal=普通
  const formatDateLabel = (dateStr: string) => {
    const diff = daysBetweenCalendarDates(todayStr, dateStr) ?? 0;
    const [, monthText, dayText] = dateStr.split('-');
    const month = Number(monthText);
    const day = Number(dayText);
    const weekday = WEEKDAY_LABELS[getWeekdayIndex(dateStr)];

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
          <span className="text-xs font-normal text-slate-400">（共{allDates.length}个可选团期）</span>
        </h4>
        {/* 已选日期非默认值时，显示"恢复默认"按钮 */}
        {selectedDate !== fallbackDate && (
          <button
            className="text-xs text-blue-500 hover:text-blue-600"
            onClick={() => setSelectedDate(fallbackDate)}
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
          // 已过期团期禁用点击
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
                {/* 热门团期显示火焰图标 */}
                {isHot && !isPast && (
                  <Flame className="w-3 h-3 text-orange-500" />
                )}
              </div>
              <p className={`text-xs mt-0.5 ${isSelected ? 'text-blue-500' : 'text-slate-400'}`}>
                {label.sub}
              </p>
              {/* 选中项显示返程日期 */}
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
          {formatDepartureDateToggleLabel(allDates.length, showAll)}
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
          {upcoming.length === 0 && allDates.length > 0 && (
            <p className="text-xs text-amber-600 mt-1">当前班期均已过期，请以源站最新日历为准</p>
          )}
        </div>
        <Badge variant="outline" className={`text-xs ${upcoming.length === 0 && allDates.length > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
          {upcoming.length === 0 && allDates.length > 0 ? '待确认' : '有位'}
        </Badge>
      </div>
    </div>
  );
}
