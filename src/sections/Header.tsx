export function Header() {
  const logoSrc = 'brand/laoguang-logo-tight.jpg';

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-[rgba(247,246,243,0.88)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[64px] items-center">
          <img
            src={logoSrc}
            alt="老广去边度"
            className="h-11 w-auto max-w-[172px] object-contain sm:h-12 sm:max-w-[200px]"
          />
        </div>
      </div>
    </header>
  );
}
