import { Badge } from '@/components/ui/badge';
import { Plane } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-lg hidden sm:inline">
              旅比价
            </span>
            <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50 hidden sm:inline-flex">
              Beta
            </Badge>
          </div>

          <nav className="flex items-center gap-6 text-sm text-slate-600">
            <span className="hidden md:inline">首页</span>
            <span className="hidden md:inline">热门线路</span>
            <span className="hidden md:inline">单房差说明</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">数据来源</span>
              <div className="flex -space-x-1">
                {['假', '广', '康', '暴', '旅', '中', '品'].map((c, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[10px] font-medium text-slate-500"
                  >
                    {c}
                  </div>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
