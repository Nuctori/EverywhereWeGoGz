import { useState } from 'react';
import { Header } from './sections/Header';
import { Hero } from './sections/Hero';
import { TourList } from './sections/TourList';

const QUICK_DESTINATIONS = [
  '广东',
  '云南',
  '三亚',
  '北京',
  '四川',
  '新疆',
];

export interface AiSearchRequest {
  id: number;
  prompt: string;
  searchQuery: string;
}

function App() {
  const [draftSearchQuery, setDraftSearchQuery] = useState('');
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState('');
  const [aiSearchRequest, setAiSearchRequest] = useState<AiSearchRequest | null>(null);

  // handleSearch 全文检索文本匹配；handleAiSearch 触发 AI 推荐→无结果时自动回退 handleSearch
  const handleSearch = (nextQuery?: string) => {
    const query = typeof nextQuery === 'string' ? nextQuery : draftSearchQuery;
    if (typeof nextQuery === 'string') {
      setDraftSearchQuery(nextQuery);
    }
    setSubmittedSearchQuery(query);

    const listEl = document.getElementById('tour-list');
    if (listEl) {
      listEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAiSearch = (nextQuery?: string) => {
    const prompt = (nextQuery ?? draftSearchQuery).trim();
    if (!prompt) {
      // 空输入降级为普通全文检索
      handleSearch(nextQuery);
      return;
    }

    setAiSearchRequest({
      id: Date.now(),
      prompt,
      searchQuery: prompt,
    });
    const listEl = document.getElementById('tour-list');
    if (listEl) {
      window.requestAnimationFrame(() => {
        listEl.scrollIntoView({ behavior: 'smooth' });
      });
    }
  };

  return (
    <div className="min-h-screen text-slate-900">
      <div className="relative min-h-screen">
        <Header />

        <main className="pb-16">
          <Hero
            searchQuery={draftSearchQuery}
            onSearchChange={setDraftSearchQuery}
            onSearch={handleSearch}
            onAiSearch={handleAiSearch}
            quickDestinations={QUICK_DESTINATIONS}
          />
          <div id="tour-list" className="scroll-mt-24">
            <TourList searchQuery={submittedSearchQuery} aiSearchRequest={aiSearchRequest} />
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
