import { useState } from 'react';
import { Header } from './sections/Header';
import { Hero } from './sections/Hero';
import { TourList } from './sections/TourList';
import Admin from './pages/Admin';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState<'home' | 'admin'>('home');

  const handleSearch = (nextQuery?: string) => {
    if (typeof nextQuery === 'string') {
      setSearchQuery(nextQuery);
    }

    const listEl = document.getElementById('tour-list');
    if (listEl) {
      listEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (currentPage === 'admin') {
    return <Admin />;
  }

  return (
    <div className="min-h-screen text-slate-900">
      <div className="relative min-h-screen">
        <Header />

        <main className="pb-16">
          <Hero
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearch={handleSearch}
          />
          <div id="tour-list" className="scroll-mt-24">
            <TourList searchQuery={searchQuery} />
          </div>
        </main>

        <div className="fixed bottom-5 right-5 z-50">
          <button
            onClick={() => setCurrentPage('admin')}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-stone-200/80 bg-white/90 px-4 text-sm font-medium text-stone-700 shadow-[0_12px_32px_rgba(15,23,42,0.10)] backdrop-blur transition hover:-translate-y-0.5 hover:border-stone-300 hover:text-stone-900"
            title="爬虫管理"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
              <path d="M8.5 8.5v.01" />
              <path d="M16 15.5v.01" />
              <path d="M12 12v.01" />
              <path d="M11 17v.01" />
              <path d="M7 14v.01" />
            </svg>
            <span className="hidden sm:inline">后台</span>
          </button>
        </div>

        <footer className="border-t border-stone-200/80 bg-white/75 px-4 py-8 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="text-xs leading-6 text-stone-400 md:text-right">
              <p>覆盖：假日通 · 广州去旅行 · 康辉 · 暴走村 · 广之旅 · 广东中旅 · 品途</p>
              <p>© 2024 旅比价 · 让线路信息更好读</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
