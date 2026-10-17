import type { ReactNode } from 'react';
import { ArrowUpRight, Map } from 'lucide-react';

interface HeaderProps {
  children?: ReactNode;
  onOpenMap?: () => void;
}

export function Header({ children, onOpenMap }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <a href="#" aria-label="老广去边度，返回首页" className="flex min-w-0 items-center gap-3 rounded-lg">
          <img src="brand/laoguang-logo-tight.jpg" alt="老广去边度" className="h-11 w-auto max-w-[160px] object-contain sm:max-w-[185px]" />
          <span className="hidden border-l border-stone-300 pl-3 text-xs tracking-wider text-stone-500 md:block">把想去的地方，变成下一站</span>
        </a>
        <nav aria-label="主导航" className="flex shrink-0 items-center gap-2 sm:gap-5">
          <a href="#tour-list" className="hidden min-h-11 items-center gap-1 text-sm font-medium text-orange-900 sm:inline-flex">发现线路<ArrowUpRight className="h-3.5 w-3.5" /></a>
          {onOpenMap && <button type="button" onClick={onOpenMap} aria-label="打开目的地地图" className="inline-flex h-11 items-center gap-2 rounded-full border border-orange-900/15 bg-white px-4 text-xs font-medium text-orange-900 transition-colors hover:bg-orange-50"><Map className="h-4 w-4" /><span>地图探索</span></button>}
          {children}
        </nav>
      </div>
    </header>
  );
}
