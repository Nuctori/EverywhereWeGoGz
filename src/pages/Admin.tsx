import { useState } from 'react';
import { useCrawlStatus } from '@/hooks/use-tours';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertCircle,
  BarChart3,
  Bug,
  CheckCircle,
  Clock,
  Database,
  Server,
} from 'lucide-react';

export default function Admin() {
  const { status } = useCrawlStatus();
  const [message, setMessage] = useState<string | null>(null);
  const baseUrl = import.meta.env.BASE_URL || '/';

  const handleTriggerCrawl = async () => {
    setMessage('静态站点不支持爬虫功能，请直接修改 src/data/tours.ts 更新数据。');
  };

  const handleGenerateMock = async () => {
    setMessage('静态站点不支持生成模拟数据，请直接修改 src/data/tours.ts 更新数据。');
  };

  const formatTime = (iso: string | null | undefined) => {
    if (!iso) return '从未';
    return new Date(iso).toLocaleString('zh-CN');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const statusColor = (value?: string) => {
    switch (value) {
      case 'success':
        return 'bg-green-500';
      case 'running':
        return 'bg-blue-500';
      case 'error':
        return 'bg-red-500';
      case 'mock':
        return 'bg-amber-500';
      default:
        return 'bg-slate-400';
    }
  };

  const statusLabel = (value?: string) => {
    switch (value) {
      case 'success':
        return '成功';
      case 'running':
        return '运行中';
      case 'error':
        return '失败';
      case 'mock':
        return '模拟数据';
      case 'never':
      default:
        return '从未运行';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">数据概览</h1>
              <p className="text-xs text-slate-500">旅行团静态数据状态</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => (window.location.href = baseUrl)}>返回首页</Button>
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
                  <p className="text-sm text-slate-500">数据状态</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${statusColor(status?.lastCrawlStatus)}`} />
                    <span className="text-sm font-medium">{statusLabel(status?.lastCrawlStatus)}</span>
                  </div>
                </div>
                <Bug className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">上次更新</p>
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
            <CardTitle className="text-base">静态站点说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700 space-y-2">
              <p className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                当前为纯静态站点，所有数据来自 src/data/tours.ts
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                如需更新数据，请直接修改 tours.ts 文件后重新构建
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                筛选、排序等功能均在浏览器端完成，无需后端服务器
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Button onClick={handleTriggerCrawl} variant="outline" className="gap-2" disabled>
                <Bug className="w-4 h-4" />
                启动爬虫（不可用）
              </Button>

              <Button variant="outline" onClick={handleGenerateMock} disabled className="gap-2">
                <Database className="w-4 h-4" />
                生成模拟数据（不可用）
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
      </main>
    </div>
  );
}
