import type { ReactNode } from 'react';
import { Map } from 'lucide-react';

interface HeaderProps {
  children?: ReactNode;
  onOpenMap?: () => void;
}

export function Header({ children, onOpenMap }: HeaderProps) {
  const logoSrc = 'brand/laoguang-logo-tight.jpg';

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-[rgba(247,246,243,0.88)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[64px] items-center justify-between gap-4">
          <img
            src={logoSrc}
            alt="老广去边度"
            className="h-11 w-auto max-w-[172px] object-contain sm:h-12 sm:max-w-[200px]"
          />
          {onOpenMap && (
            <button
              type="button"
              onClick={onOpenMap}
              className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 shadow-sm transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-stone-950"
              title="打开地图"
            >
              <Map className="h-4 w-4 text-orange-600" />
              地图
            </button>
          )}
          {children}
        </div>
      </div>
    </header>
  );
}
