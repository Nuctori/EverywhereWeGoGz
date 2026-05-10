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
    <div className="min-h-screen bg-slate-50">
      <Header />
      <Hero
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
      />
      <div id="tour-list" className="scroll-mt-20">
        <TourList searchQuery={searchQuery} />
      </div>
      
      {/* 管理入口 */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setCurrentPage('admin')}
          className="w-12 h-12 bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          title="爬虫管理"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>
            <path d="M8.5 8.5v.01"/>
            <path d="M16 15.5v.01"/>
            <path d="M12 12v.01"/>
            <path d="M11 17v.01"/>
            <path d="M7 14v.01"/>
          </svg>
        </button>
      </div>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-slate-500 mb-2">
            本站为旅行团信息聚合比价工具，所有数据来源于合作平台公开信息
          </p>
          <p className="text-xs text-slate-400">
            覆盖：假日通 · 广州去旅行 · 康辉 · 暴走村 · 广之旅 · 广东中旅 · 品途
          </p>
          <p className="text-xs text-slate-400 mt-2">
            © 2024 旅比价 — 让旅行更透明
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
