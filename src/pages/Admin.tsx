// 读取 tours-meta.json 展示缓存快照，仅展示不发起爬虫
import { useState } from 'react';
import { useCrawlStatus } from '@/hooks/use-tours';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  Database,
  FileJson,
  RefreshCw,
  Server,
} from 'lucide-react';

interface AdminProps {
  onBackHome?: () => void;
}

export default function Admin({ onBackHome }: AdminProps) {
  const { status, loading, fetchStatus } = useCrawlStatus();
  const [message, setMessage] = useState<string | null>(null);
  const baseUrl = import.meta.env.BASE_URL || '/';

  // 刷新元信息，不含爬虫——仅重新读取 tours-meta.json
  const handleRefresh = async () => {
    setMessage(null);
    await fetchStatus();
  };

  const handleBackHome = () => {
    if (onBackHome) {
      onBackHome();
      return;
    }

    window.location.href = baseUrl;
  };

  const formatTime = (iso: string | null | undefined) => {
    if (!iso) return '从未';
    return new Date(iso).toLocaleString('zh-CN');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return ' B';
    if (bytes < 1024 * 1024) return ' KB';
    return ' MB';
  };

  const statusLabel = (value?: string) => {
    switch (value) {
      case 'success':
        return '已生成';
      case 'loading':
        return '读取中';
      case 'error':
        return '元信息缺失';
      case 'never':
      default:
        return '未知';
    }
  };

  const topSources = Object.entries(status.sourceStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">静态数据概览</h1>
              <p className="text-xs text-slate-500">读取 public/data 里的构建产物元信息</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleBackHome}>返回首页</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">数据总量</p>
                  <p className="text-2xl font-bold text-slate-800">{status?.totalRecords || 0}</p>
                </div>
                <Database className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">元信息状态</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={'w-2.5 h-2.5 rounded-full '} />
                    <span className="text-sm font-medium">{statusLabel(status?.lastCrawlStatus)}</span>
                  </div>
                </div>
                <FileJson className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">生成时间</p>
                  <p className="text-sm font-medium text-slate-800">{formatTime(status?.lastCrawl)}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">数据大小</p>
                  <p className="text-2xl font-bold text-slate-800">{formatSize(status?.cacheSize || 0)}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">当前数据链路</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700 space-y-2">
              <p className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                前台列表读取 public/data/tours-list.json，详情弹窗按需读取 public/data/tour-details/*.json
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                构建前会运行 scripts/split_tour_data.mjs，从 public/data/tours.json 生成列表、详情分片和 tours-meta.json
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                本页只展示静态数据快照，不提供浏览器端爬虫或模拟数据生成功能
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Button onClick={handleRefresh} variant="outline" className="gap-2" disabled={loading}>
                <RefreshCw className={'w-4 h-4 '} />
                重新读取元信息
              </Button>
            </div>

            {message && (
              <div className="p-3 rounded-lg text-sm flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle className="w-4 h-4" />
                {message}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">文件拆分</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">原始数据 public/data/tours.json</span>
                <span className="font-medium">{formatSize(status.rawSize)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">列表数据 public/data/tours-list.json</span>
                <span className="font-medium">{formatSize(status.listSize)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">详情分片 public/data/tour-details/</span>
                <span className="font-medium">
                  {status.detailFiles.toLocaleString()} 个/ {formatSize(status.detailSize)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">数据最新更新时间</span>
                <span className="font-medium">{formatTime(status.latestUpdatedAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">来源分布</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topSources.length > 0 ? topSources.map(([source, count]) => (
                <div key={source} className="flex items-center justify-between gap-4 text-sm">
                  <span className="truncate text-slate-600">{source}</span>
                  <span className="font-medium text-slate-800">{count.toLocaleString()}</span>
                </div>
              )) : (
                <p className="text-sm text-slate-500">尚未读取到来源统计。</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
