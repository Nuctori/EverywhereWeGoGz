import { useEffect, useState } from 'react';
import { Header } from './sections/Header';
import { Hero } from './sections/Hero';
import { TourList } from './sections/TourList';

const HERO_DESTINATION_COUNT = 6;

function getDataUrl(path: string) {
  const baseUrl = import.meta.env.BASE_URL || '/';
  return `${baseUrl}data/${path}`;
}

function getDynamicHeroDestinations(tours: Array<{ destination?: string }>) {
  const counts = new Map<string, number>();

  for (const tour of tours) {
    const destination = String(tour.destination || '').trim();
    if (!destination || destination === '其他') continue;
    counts.set(destination, (counts.get(destination) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, HERO_DESTINATION_COUNT)
    .map(([destination]) => destination);
}

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [quickDestinations, setQuickDestinations] = useState<string[]>([
    '广东',
    '云南',
    '三亚',
    '北京',
    '四川',
    '新疆',
  ]);

  useEffect(() => {
    fetch(getDataUrl('tours-list.json'))
      .then((response) => response.json())
      .then((data) => {
        const dynamicDestinations = getDynamicHeroDestinations(Array.isArray(data) ? data : []);
        if (dynamicDestinations.length > 0) {
          setQuickDestinations(dynamicDestinations);
        }
      })
      .catch(() => {
        // Keep the safe static fallback when the list cannot be loaded.
      });
  }, []);

  const handleSearch = (nextQuery?: string) => {
    if (typeof nextQuery === 'string') {
      setSearchQuery(nextQuery);
    }

    const listEl = document.getElementById('tour-list');
    if (listEl) {
      listEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen text-slate-900">
      <div className="relative min-h-screen">
        <Header />

        <main className="pb-16">
          <Hero
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearch={handleSearch}
            quickDestinations={quickDestinations}
          />
          <div id="tour-list" className="scroll-mt-24">
            <TourList searchQuery={searchQuery} />
          </div>
        </main>

        <footer className="border-t border-stone-200/80 bg-white/75 px-4 py-8 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="text-xs leading-6 text-stone-400 md:text-right">
              <p>覆盖：假日通 · 广州去旅行 · 康辉 · 暴走村 · 广之旅 · 广东中旅 · 品途 · 天涯户外</p>
              <p>© 2024 老广去边度 · 让线路信息更好读</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
