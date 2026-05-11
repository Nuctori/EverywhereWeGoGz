import { Compass } from 'lucide-react';

export function Header() {
  const navItems = ['目的地', '时间', '单房差', '平台'];

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-[rgba(247,246,243,0.82)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-white shadow-sm">
                <Compass className="h-4.5 w-4.5 text-stone-700" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold tracking-tight text-stone-900">
                    旅比价
                  </span>
                </div>
              </div>
            </div>

          <nav className="flex items-center gap-3">
            <div className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <span
                  key={item}
                  className="rounded-full px-3 py-1 text-sm text-stone-500 transition-colors hover:bg-white/70 hover:text-stone-900"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-stone-200 bg-white/70 px-2.5 py-2 lg:flex">
              <span className="text-xs text-stone-400">7 个平台</span>
              <div className="flex gap-1">
                {['假', '广', '康', '暴', '旅', '中', '品'].map((c, i) => (
                  <div
                    key={i}
                    className="flex h-5 w-5 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-[10px] font-medium text-stone-500"
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
