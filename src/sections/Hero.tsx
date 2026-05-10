import { Search, MapPin, Plane, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface HeroProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: (value?: string) => void;
}

export function Hero({ searchQuery, onSearchChange, onSearch }: HeroProps) {
  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-8 sm:py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto text-center">
        <Badge className="bg-white/20 text-white border-white/30 mb-3 hover:bg-white/30 text-xs sm:text-sm">
          <TrendingUp className="w-3 h-3 mr-1" />
          已聚合 7 大平台 · 3500+ 条实时线路
        </Badge>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 leading-tight">
          广州出发旅行团
          <span className="block text-yellow-300 mt-1">聚合比价工具</span>
        </h1>

        <p className="text-blue-100 text-sm sm:text-lg mb-1 sm:mb-2 max-w-2xl mx-auto">
          从 7 大旅行平台实时抓取，30+ 维度横向对比
        </p>
        <p className="text-yellow-300 text-xs sm:text-sm font-medium mb-4 sm:mb-8 max-w-xl mx-auto">
          🔥 核心差异化：单房差透明提示 —— OTA 不会告诉你的真相，我们全部公开
        </p>

        {/* 搜索框 */}
        <div className="max-w-2xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="搜索目的地：桂林、三亚、云南..."
              className="pl-10 h-11 sm:h-12 bg-white text-slate-800 placeholder:text-slate-400 border-0 shadow-lg text-sm"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch(searchQuery)}
            />
          </div>
          <Button
            size="lg"
            className="h-11 sm:h-12 px-4 sm:px-6 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold shadow-lg text-sm"
            onClick={() => onSearch(searchQuery)}
          >
            <Search className="w-5 h-5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">搜索</span>
          </Button>
        </div>

        {/* 快捷标签 - 移动端横向滚动 */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide justify-start sm:justify-center px-1">
          {['桂林', '三亚', '云南', '张家界', '西藏', '新疆'].map((dest) => (
            <button
              key={dest}
              onClick={() => {
                onSearchChange(dest);
                onSearch(dest);
              }}
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-full text-sm text-white/90 transition-colors whitespace-nowrap shrink-0"
            >
              <Plane className="w-3 h-3 inline mr-1" />
              {dest}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
