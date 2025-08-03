import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Trash2,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { openaiService } from '@/services/openaiService';
import { cacheService } from '@/services/cacheService';

interface OpenAIMonitorProps {
  className?: string;
}

const OpenAIMonitor: React.FC<OpenAIMonitorProps> = ({ className }) => {
  const [stats, setStats] = useState(openaiService.getStats());
  const [cacheStats, setCacheStats] = useState(cacheService.getStats());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshStats = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setStats(openaiService.getStats());
      setCacheStats(cacheService.getStats());
      setIsRefreshing(false);
    }, 500);
  };

  const clearLogs = () => {
    openaiService.clearLogs();
    setStats(openaiService.getStats());
  };

  const clearCache = async () => {
    await cacheService.clearAll();
    setCacheStats(cacheService.getStats());
  };

  useEffect(() => {
    // Auto-refresh stats every 10 seconds
    const interval = setInterval(() => {
      setStats(openaiService.getStats());
      setCacheStats(cacheService.getStats());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'generateChatResponse':
        return <Activity className="w-4 h-4" />;
      case 'generateVisaRecommendations':
        return <TrendingUp className="w-4 h-4" />;
      case 'generateDreamActionPlan':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatOperation = (operation: string) => {
    const operationNames = {
      generateChatResponse: 'Chat Response',
      generateVisaRecommendations: 'Visa Recommendations',
      generateDreamActionPlan: 'Dream Action Plan'
    };
    return operationNames[operation as keyof typeof operationNames] || operation;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">OpenAI Service Monitor</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshStats}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearLogs}
              disabled={stats.totalRequests === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Logs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCache}
              disabled={cacheStats.totalEntries === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cache
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalRequests}</div>
              <div className="text-sm text-gray-500">Total Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.successfulRequests}</div>
              <div className="text-sm text-gray-500">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failedRequests}</div>
              <div className="text-sm text-gray-500">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatDuration(stats.averageDuration)}</div>
              <div className="text-sm text-gray-500">Avg Duration</div>
            </div>
          </div>

          {/* Success Rate Progress */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Success Rate</span>
              <span className="text-sm text-gray-500">{stats.successRate.toFixed(1)}%</span>
            </div>
            <Progress 
              value={stats.successRate} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cache Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Cache Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{cacheStats.totalEntries}</div>
              <div className="text-sm text-gray-500">Cached Entries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{cacheStats.totalHits}</div>
              <div className="text-sm text-gray-500">Cache Hits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{cacheStats.expiredEntries}</div>
              <div className="text-sm text-gray-500">Expired</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{cacheStats.averageHits}</div>
              <div className="text-sm text-gray-500">Avg Hits/Entry</div>
            </div>
          </div>

          {/* Cache Hit Rate */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Cache Efficiency</span>
              <span className="text-sm text-gray-500">
                {cacheStats.totalEntries > 0 ? ((cacheStats.totalHits / cacheStats.totalEntries) * 100).toFixed(1) : 0}% hit rate
              </span>
            </div>
            <Progress 
              value={cacheStats.totalEntries > 0 ? (cacheStats.totalHits / cacheStats.totalEntries) * 100 : 0} 
              className="h-2"
            />
          </div>

          {/* Operation Breakdown */}
          {Object.keys(cacheStats.operationStats).length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Cache by Operation</h4>
              <div className="space-y-2">
                {Object.entries(cacheStats.operationStats).map(([operation, count]) => (
                  <div key={operation} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{operation.replace('_', ' ')}</span>
                    <Badge variant="outline">{count} entries</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentLogs.map((log, index) => (
                <div 
                  key={`${log.requestId}-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={getStatusColor(log.success)}>
                      {log.success ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {getOperationIcon(log.operation)}
                        <span className="font-medium">{formatOperation(log.operation)}</span>
                        {log.retryAttempt && (
                          <Badge variant="outline" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Retry #{log.retryAttempt}
                          </Badge>
                        )}
                      </div>
                      {log.error && (
                        <div className="text-sm text-red-600 mt-1">{log.error}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatDuration(log.duration)}</div>
                    <div className="text-xs text-gray-500">
                      {log.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Service Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Max Retries:</span>
              <span className="ml-2 text-gray-600">3</span>
            </div>
            <div>
              <span className="font-medium">Timeout:</span>
              <span className="ml-2 text-gray-600">30s</span>
            </div>
            <div>
              <span className="font-medium">Model:</span>
              <span className="ml-2 text-gray-600">gpt-3.5-turbo</span>
            </div>
            <div>
              <span className="font-medium">Retry Delay:</span>
              <span className="ml-2 text-gray-600">1s (exponential backoff)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OpenAIMonitor;
