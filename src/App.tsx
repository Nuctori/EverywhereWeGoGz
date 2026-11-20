import { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from './sections/Header';
import { Hero } from './sections/Hero';
import type { QuickIntent } from './sections/Hero';
import { TourList } from './sections/TourList';
import type { MapView } from './sections/MapView';

// Hero 的快捷入口换成"一句需求"而不是裸地名：点“广东”只会落一个地名筛选，
// 点“周末去广东泡温泉”能直接走需求解析，才符合搜索框的双动作设计。
const QUICK_INTENTS: QuickIntent[] = [
  { label: '周末去广东泡温泉', detail: '2天 · 温泉 · 大巴可达', query: '周末去广东泡温泉' },
  { label: '云南亲子游', detail: '5天以内 · 适合带娃', query: '云南亲子游 5天以内' },
  { label: '三亚海边度假', detail: '不赶路 · 住海景', query: '三亚海边度假 不赶路' },
  { label: '北京文化深度游', detail: '人文景点 · 讲解', query: '北京文化深度游 有讲解' },
  { label: '四川九寨沟看秋色', detail: '秋季 · 自然风光', query: '四川九寨沟看秋色' },
  { label: '新疆小团慢游', detail: '人少 · 节奏慢', query: '新疆小团慢游 节奏慢' },
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
  const [preferTextSearch, setPreferTextSearch] = useState(false);
  const startAiMode = useCallback(() => setPreferTextSearch(false), []);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [mapRequested, setMapRequested] = useState(false);
  const [MapComponent, setMapComponent] = useState<typeof MapView>();
  const [mapLoadFailed, setMapLoadFailed] = useState(false);
  const mapSlot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const slot = mapSlot.current;
    if (!slot || mapRequested) return;
    // The slot is display:none below the desktop breakpoint; it cannot intersect.
    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting && entry.intersectionRect.width > 0)) setMapRequested(true);
      });
      observer.observe(slot);
      return () => observer.disconnect();
    }
    if (slot.getClientRects().length) setMapRequested(true);
  }, [mapRequested]);

  useEffect(() => {
    if (!mapRequested) return;
    let current = true;
    void import('./sections/MapView').then(({ MapView }) => {
      if (current) setMapComponent(() => MapView);
    }).catch(() => { if (current) setMapLoadFailed(true); });
    return () => { current = false; };
  }, [mapRequested]);

  const openMap = () => {
    setMapRequested(true);
    setMapExpanded(true);
  };

  // handleSearch 全文检索文本匹配；handleAiSearch 触发 AI 推荐→无结果时自动回退 handleSearch
  const handleSearch = (nextQuery?: string) => {
    const query = typeof nextQuery === 'string' ? nextQuery : draftSearchQuery;
    if (typeof nextQuery === 'string') {
      setDraftSearchQuery(nextQuery);
    }
    setAiSearchRequest(null);
    setPreferTextSearch(true);
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

    setPreferTextSearch(false);
    setAiSearchRequest({
      id: Date.now(),
      prompt,
      searchQuery: prompt,
    });
    setSubmittedSearchQuery(prompt);

    const listEl = document.getElementById('tour-list');
    if (listEl) {
      listEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen text-slate-900">
      <a href="#tour-list" className="skip-link">跳到线路列表</a>
      <div className="relative min-h-screen">
        <Header onOpenMap={openMap} />

        <main id="main-content" className="pb-16">
          <Hero
            searchQuery={draftSearchQuery}
            onSearchChange={setDraftSearchQuery}
            onSearch={handleSearch}
            onAiSearch={handleAiSearch}
            quickIntents={QUICK_INTENTS}
            map={MapComponent ? <MapComponent embedded expanded={mapExpanded} onExpandedChange={setMapExpanded} />
              : <div ref={mapSlot} className="h-[280px] rounded-[22px] bg-stone-100" aria-hidden="true" />}
          />
          {mapExpanded && !MapComponent && (
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 text-sm text-stone-700">
              <p role={mapLoadFailed ? 'alert' : 'status'}>{mapLoadFailed ? '地图暂时无法加载' : '正在加载地图…'}</p>
              <button type="button" className="min-h-11 px-3" onClick={() => setMapExpanded(false)}>取消打开地图</button>
            </div>
          )}
          <div id="tour-list" tabIndex={-1} className="scroll-mt-24 outline-none">
            <TourList searchQuery={submittedSearchQuery} aiSearchRequest={aiSearchRequest} preferTextSearch={preferTextSearch} onAiModeStart={startAiMode} onClearSearch={() => { setDraftSearchQuery(''); setSubmittedSearchQuery(''); setAiSearchRequest(null); setPreferTextSearch(true); }} />
          </div>
        </main>

        <footer className="border-t border-stone-200/80 bg-white/75 px-4 py-8 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="text-xs leading-6 text-stone-400 md:text-right">
              <p>覆盖：假日通 · 广州去旅行 · 康辉 · 暴走村 · 广之旅 · 广东中旅 · 品途 · 天涯户外</p>
              <p>© {new Date().getFullYear()} 老广去边度 · 让线路信息更好读</p>
              <p>价格与班期仅供参考，预订前请向来源平台确认。</p>
              <a className="mt-1 inline-block text-orange-700 hover:underline" href="mailto:feedback@nuctori.github.io?subject=线路反馈">没找到合适的团？告诉我们</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
