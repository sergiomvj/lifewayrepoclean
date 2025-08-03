import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Target,
  Calendar,
  RefreshCw,
  PieChart,
  LineChart,
  Award,
  Zap,
  Clock,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActivityCharts } from '@/hooks/useActivityCharts';

interface ActivityChartsProps {
  className?: string;
  showInsights?: boolean;
  compactMode?: boolean;
}

// Componente de gráfico de barras simples
const SimpleBarChart: React.FC<{
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number;
}> = ({ data, height = 200 }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="w-20 text-xs font-medium truncate">{item.name}</div>
          <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color || '#3b82f6'
              }}
            />
          </div>
          <div className="w-8 text-xs font-bold text-right">{item.value}</div>
        </div>
      ))}
    </div>
  );
};

// Componente de gráfico de linha simples
const SimpleLineChart: React.FC<{
  data: Array<{ name: string; value: number }>;
  height?: number;
  color?: string;
}> = ({ data, height = 150, color = '#3b82f6' }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  
  return (
    <div className="relative" style={{ height }}>
      <svg width="100%" height="100%" className="overflow-visible">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={data.map((point, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - ((point.value - minValue) / range) * 80;
            return `${x},${y}`;
          }).join(' ')}
        />
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - ((point.value - minValue) / range) * 80;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="3"
              fill={color}
              className="hover:r-4 transition-all"
            />
          );
        })}
      </svg>
    </div>
  );
};

// Componente de gráfico de pizza simples
const SimplePieChart: React.FC<{
  data: Array<{ name: string; value: number; color?: string }>;
  size?: number;
}> = ({ data, size = 120 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
  
  return (
    <div className="flex items-center space-x-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {data.map((item, index) => {
            const percentage = item.value / total;
            const angle = percentage * 360;
            const radius = size / 2 - 10;
            const centerX = size / 2;
            const centerY = size / 2;
            
            const startAngle = (currentAngle * Math.PI) / 180;
            const endAngle = ((currentAngle + angle) * Math.PI) / 180;
            
            const x1 = centerX + radius * Math.cos(startAngle);
            const y1 = centerY + radius * Math.sin(startAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            currentAngle += angle;
            
            return (
              <path
                key={index}
                d={pathData}
                fill={item.color || colors[index % colors.length]}
                className="hover:opacity-80 transition-opacity"
              />
            );
          })}
        </svg>
      </div>
      <div className="space-y-1">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-2 text-xs">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color || colors[index % colors.length] }}
            />
            <span className="font-medium">{item.name}</span>
            <span className="text-muted-foreground">({item.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export function ActivityCharts({ 
  className, 
  showInsights = true, 
  compactMode = false 
}: ActivityChartsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  
  const {
    activityData,
    userProgress,
    validationMetrics,
    activityTrends,
    activityDistribution,
    validationPerformance,
    isLoadingActivity,
    isLoadingProgress,
    refreshData,
    engagementScore,
    insights,
    chartColors,
    totalSessions,
    averageDaily,
    mostUsedFeature,
    improvementRate
  } = useActivityCharts({
    enableRealTime: true,
    refreshInterval: 5 * 60 * 1000
  });

  const isLoading = isLoadingActivity || isLoadingProgress;

  // Preparar dados para os gráficos
  const trendsChartData = activityTrends.map(trend => ({
    name: trend.period,
    value: trend.total
  }));

  const distributionChartData = activityDistribution.map(item => ({
    name: item.name,
    value: item.value,
    color: chartColors[item.category || 'info']
  }));

  const performanceChartData = validationPerformance.map(perf => ({
    name: perf.name,
    value: Math.round(perf.value * 100)
  }));

  const featureUsageData = [
    { name: 'Criador de Sonhos', value: activityTrends.reduce((sum, t) => sum + t.dreams, 0), color: chartColors.dreams },
    { name: 'VisaMatch', value: activityTrends.reduce((sum, t) => sum + t.visamatch, 0), color: chartColors.visamatch },
    { name: 'Chat Especialista', value: activityTrends.reduce((sum, t) => sum + t.specialist, 0), color: chartColors.specialist }
  ];

  if (compactMode) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Métricas principais em modo compacto */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Sessões</p>
                <p className="font-bold">{totalSessions}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Engajamento</p>
                <p className="font-bold">{engagementScore}%</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-xs text-muted-foreground">Validação</p>
                <p className="font-bold">{validationMetrics ? Math.round(validationMetrics.success_rate * 100) : 0}%</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-xs text-muted-foreground">Média/dia</p>
                <p className="font-bold">{averageDaily.toFixed(1)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Gráfico de tendência compacto */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2">
              <LineChart className="w-4 h-4" />
              <span>Atividade Recente</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleLineChart data={trendsChartData.slice(-7)} height={100} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Gráficos de Atividade</h2>
          <Badge variant="secondary">Dashboard</Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Sessões</p>
                <p className="text-2xl font-bold">{totalSessions}</p>
                <p className="text-xs text-green-600">
                  {improvementRate > 0 ? '+' : ''}{improvementRate.toFixed(1)}% vs semana anterior
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score de Engajamento</p>
                <p className="text-2xl font-bold">{engagementScore}%</p>
                <p className="text-xs text-muted-foreground">
                  {engagementScore >= 80 ? 'Excelente' : engagementScore >= 60 ? 'Bom' : 'Pode melhorar'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">
                  {validationMetrics ? Math.round(validationMetrics.success_rate * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Validações aprovadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Média Diária</p>
                <p className="text-2xl font-bold">{averageDaily.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">sessões por dia</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principais */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="features">Recursos</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <LineChart className="w-5 h-5" />
                <span>Tendência de Atividade</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleLineChart 
                data={trendsChartData} 
                height={250} 
                color={chartColors.info}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="w-5 h-5" />
                <span>Distribuição de Atividades</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <SimplePieChart data={distributionChartData} size={200} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span>Performance de Validação</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleLineChart 
                data={performanceChartData.slice(-15)} 
                height={250} 
                color={chartColors.success}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Uso por Recurso</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={featureUsageData} height={200} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Insights */}
      {showInsights && insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Insights Personalizados</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg"
                >
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status de carregamento */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-muted-foreground">Carregando dados...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivityCharts;
