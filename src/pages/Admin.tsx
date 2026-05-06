import { useState } from 'react';
import { useCrawlStatus } from '@/hooks/use-tours';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  AlertCircle,
  BarChart3,
  Bug,
  CheckCircle,
  Clock,
  Database,
  Play,
  RefreshCw,
  Server,
} from 'lucide-react';

function readErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '未知错误';
}

export default function Admin() {
  const { status, loading, fetchStatus, triggerCrawl, generateMock } = useCrawlStatus();
  const [message, setMessage] = useState<string | null>(null);

  const handleTriggerCrawl = async () => {
    try {
      setMessage('正在启动爬虫...');
      await triggerCrawl();
      setMessage('爬虫已启动，请稍后刷新查看结果。');
    } catch (error: unknown) {
      setMessage(readErrorMessage(error));
    }
  };

  const handleGenerateMock = async () => {
    try {
      setMessage('正在生成模拟数据...');
      await generateMock(100);
      setMessage('模拟数据已生成。');
      fetchStatus();
    } catch (error: unknown) {
      setMessage(readErrorMessage(error));
    }
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
              <h1 className="text-lg font-bold text-slate-800">爬虫管理后台</h1>
              <p className="text-xs text-slate-500">旅行团数据聚合与监控</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => (window.location.href = '/')}>
            返回首页
          </Button>
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
                  <p className="text-sm text-slate-500">爬虫状态</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        status?.isCrawling ? 'bg-blue-500 animate-pulse' : statusColor(status?.lastCrawlStatus)
                      }`}
                    />
                    <span className="text-sm font-medium">
                      {status?.isCrawling ? '运行中' : statusLabel(status?.lastCrawlStatus)}
                    </span>
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
                  <p className="text-sm text-slate-500">缓存大小</p>
                  <p className="text-2xl font-bold text-slate-800">{formatSize(status?.cacheSize || 0)}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">爬虫控制</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 flex-wrap">
              <Button onClick={handleTriggerCrawl} disabled={loading || status?.isCrawling} className="gap-2">
                <Play className="w-4 h-4" />
                {status?.isCrawling ? '爬虫运行中...' : '启动爬虫'}
              </Button>

              <Button variant="outline" onClick={handleGenerateMock} disabled={loading} className="gap-2">
                <Database className="w-4 h-4" />
                生成模拟数据
              </Button>

              <Button variant="ghost" onClick={fetchStatus} disabled={loading} className="gap-2">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                刷新状态
              </Button>
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                  message.includes('失败') || message.includes('错误')
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {message.includes('失败') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                {message}
              </div>
            )}

            {status?.isCrawling && (
              <div className="space-y-2">
                <p className="text-sm text-slate-500">爬虫正在运行，请勿重复启动。</p>
                <Progress value={undefined} className="animate-pulse" />
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
