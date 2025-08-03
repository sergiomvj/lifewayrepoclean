import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Activity, 
  Target, 
  Calendar,
  Clock,
  Users,
  Zap,
  Award,
  AlertTriangle,
  Info,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  Filter,
  Download,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActivityCharts } from '@/hooks/useActivityCharts';
import { useUserContext } from '@/hooks/useUserContext';
import { activityChartsService } from '@/services/activityChartsService';

interface AdvancedActivityChartsProps {
  className?: string;
  variant?: 'full' | 'compact' | 'minimal';
  showInsights?: boolean;
  showBenchmarks?: boolean;
  showHeatmap?: boolean;
  period?: 'week' | 'month' | 'quarter';
}

export function AdvancedActivityCharts({ 
  className, 
  variant = 'full',
  showInsights = true,
  showBenchmarks = true,
  showHeatmap = true,
  period = 'month'
}: AdvancedActivityChartsProps) {
  const { context: userContext } = useUserContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [benchmarkData, setBenchmarkData] = useState<any>(null);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [activityTrends, setActivityTrends] = useState<any[]>([]);
  const [distributionData, setDistributionData] = useState<any[]>([]);
  const [validationPerformance, setValidationPerformance] = useState<any[]>([]);

  const userId = userContext?.profile?.id;

  // Carregar dados avançados
  useEffect(() => {
    const loadAdvancedData = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        
        const [
          insightsData,
          benchmarks,
          heatmap,
          trends,
          distribution,
          validation
        ] = await Promise.all([
          activityChartsService.getInsightsAndRecommendations(userId),
          showBenchmarks ? activityChartsService.getBenchmarkData(userId) : null,
          showHeatmap ? activityChartsService.getActivityHeatmap(userId) : [],
          activityChartsService.getActivityTrends(userId, period),
          activityChartsService.getActivityDistribution(userId),
          activityChartsService.getValidationPerformance(userId)
        ]);

        setInsights(insightsData.insights);
        setRecommendations(insightsData.recommendations);
        setBenchmarkData(benchmarks);
        setHeatmapData(heatmap);
        setActivityTrends(trends);
        setDistributionData(distribution);
        setValidationPerformance(validation);
      } catch (error) {
        console.error('Erro ao carregar dados avançados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAdvancedData();
  }, [userId, period, showBenchmarks, showHeatmap]);

  const renderInsightCard = (insight: any, index: number) => {
    const iconMap = {
      positive: CheckCircle,
      warning: AlertTriangle,
      info: Info
    };

    const colorMap = {
      positive: 'text-green-600 bg-green-50 border-green-200',
      warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      info: 'text-blue-600 bg-blue-50 border-blue-200'
    };

    const trendIconMap = {
      up: ArrowUp,
      down: ArrowDown,
      stable: Minus
    };

    const Icon = iconMap[insight.type];
    const TrendIcon = insight.trend ? trendIconMap[insight.trend] : null;

    return (
      <Card key={index} className={cn('border-l-4', colorMap[insight.type])}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className={cn('p-2 rounded-full', colorMap[insight.type])}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-sm">{insight.title}</h4>
                {TrendIcon && (
                  <div className="flex items-center space-x-1">
                    <TrendIcon className="w-3 h-3 text-gray-500" />
                    {insight.metric && (
                      <span className="text-xs text-gray-600">
                        {typeof insight.metric === 'number' && insight.metric < 1 
                          ? `${Math.round(insight.metric * 100)}%` 
                          : insight.metric}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-600">{insight.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderRecommendationCard = (rec: any, index: number) => {
    const priorityColors = {
      high: 'bg-red-50 border-red-200 text-red-800',
      medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      low: 'bg-green-50 border-green-200 text-green-800'
    };

    return (
      <Card key={index} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Badge className={cn('text-xs', priorityColors[rec.priority])}>
                {rec.priority.toUpperCase()}
              </Badge>
              <span className="text-xs text-gray-500">{rec.category}</span>
            </div>
          </div>
          <h4 className="font-medium text-sm mb-1">{rec.title}</h4>
          <p className="text-xs text-gray-600 mb-3">{rec.description}</p>
          <Button size="sm" variant="outline" className="text-xs h-7">
            {rec.action}
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderActivityHeatmap = () => {
    if (!showHeatmap || !heatmapData.length) return null;

    const weeks = Math.ceil(heatmapData.length / 7);
    const heatmapGrid = [];

    for (let week = 0; week < weeks; week++) {
      const weekData = [];
      for (let day = 0; day < 7; day++) {
        const dataIndex = week * 7 + day;
        const dayData = heatmapData[dataIndex];
        weekData.push(dayData);
      }
      heatmapGrid.push(weekData);
    }

    const levelColors = {
      0: 'bg-gray-100',
      1: 'bg-green-100',
      2: 'bg-green-200',
      3: 'bg-green-300',
      4: 'bg-green-400'
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Heatmap de Atividade
          </CardTitle>
          <CardDescription>
            Visualização da sua atividade ao longo do último ano
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {heatmapGrid.slice(-52).map((week, weekIndex) => (
              <div key={weekIndex} className="flex space-x-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={cn(
                      'w-3 h-3 rounded-sm',
                      day ? levelColors[day.level] : 'bg-gray-100'
                    )}
                    title={day ? `${day.date}: ${day.value} atividades` : ''}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
            <span>Menos</span>
            <div className="flex space-x-1">
              {Object.entries(levelColors).map(([level, color]) => (
                <div key={level} className={cn('w-3 h-3 rounded-sm', color)} />
              ))}
            </div>
            <span>Mais</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderBenchmarkComparison = () => {
    if (!showBenchmarks || !benchmarkData) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Comparação com Outros Usuários
          </CardTitle>
          <CardDescription>
            Veja como você se compara com outros usuários da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">
              {benchmarkData.user_percentile}º
            </div>
            <div className="text-sm text-blue-600">percentil geral</div>
          </div>

          <div className="space-y-3">
            {Object.entries(benchmarkData.category_rankings).map(([category, data]: [string, any]) => (
              <div key={category} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{category.replace('_', ' ')}</span>
                  <span className="font-medium">{data.percentile}º percentil</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={data.percentile} className="flex-1" />
                  <span className="text-xs text-gray-500">
                    {Math.round(data.user_score * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {benchmarkData.improvement_areas.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-sm text-yellow-800 mb-2">
                Áreas de Melhoria
              </h4>
              <div className="flex flex-wrap gap-1">
                {benchmarkData.improvement_areas.map((area: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {area.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Insights */}
      {showInsights && insights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Insights Personalizados</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {insights.map(renderInsightCard)}
          </div>
        </div>
      )}

      {/* Recomendações */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recomendações</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {recommendations.map(renderRecommendationCard)}
          </div>
        </div>
      )}

      {/* Heatmap */}
      {renderActivityHeatmap()}

      {/* Benchmark */}
      {renderBenchmarkComparison()}
    </div>
  );

  const renderTrendsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Tendências de Atividade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activityTrends.slice(-7).map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium">{trend.period}</div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-xs text-gray-600">
                    Dreams: {trend.dreams}
                  </div>
                  <div className="text-xs text-gray-600">
                    VisaMatch: {trend.visamatch}
                  </div>
                  <div className="text-xs text-gray-600">
                    Chat: {trend.specialist}
                  </div>
                  <div className="text-sm font-medium">
                    Total: {trend.total}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando gráficos avançados...</p>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={cn("space-y-4", className)}>
        {insights.slice(0, 2).map(renderInsightCard)}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid gap-4 md:grid-cols-2">
          {insights.slice(0, 4).map(renderInsightCard)}
        </div>
        {renderActivityHeatmap()}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gráficos de Atividade Avançados</h2>
          <p className="text-gray-600">
            Análise detalhada do seu progresso e engajamento
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          {renderTrendsTab()}
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance de Validação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {validationPerformance.slice(-10).map((perf, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{perf.name}</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={perf.value * 100} className="w-20" />
                        <span className="text-xs text-gray-600">
                          {Math.round(perf.value * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdvancedActivityCharts;
