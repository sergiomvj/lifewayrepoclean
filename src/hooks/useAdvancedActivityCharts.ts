import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { activityChartsService } from '@/services/activityChartsService';
import { useUserContext } from './useUserContext';

interface UseAdvancedActivityChartsOptions {
  period?: 'week' | 'month' | 'quarter';
  enableRealTime?: boolean;
  enableBenchmarks?: boolean;
  enableHeatmap?: boolean;
}

interface UseAdvancedActivityChartsReturn {
  // Dados principais
  insights: any[];
  recommendations: any[];
  benchmarkData: any;
  heatmapData: any[];
  activityTrends: any[];
  distributionData: any[];
  validationPerformance: any[];
  engagementStats: any;

  // Estados de carregamento
  isLoading: boolean;
  isLoadingInsights: boolean;
  isLoadingBenchmarks: boolean;
  isLoadingHeatmap: boolean;
  error: string | null;

  // Ações
  refreshData: () => void;
  refreshInsights: () => void;
  refreshBenchmarks: () => void;
  changePeriod: (period: 'week' | 'month' | 'quarter') => void;

  // Utilitários
  getInsightsByType: (type: 'positive' | 'warning' | 'info') => any[];
  getRecommendationsByPriority: (priority: 'high' | 'medium' | 'low') => any[];
  calculateOverallScore: () => number;
  getActivitySummary: () => {
    totalActivities: number;
    averageDaily: number;
    mostActiveDay: string;
    improvementAreas: string[];
  };
}

export function useAdvancedActivityCharts(
  options: UseAdvancedActivityChartsOptions = {}
): UseAdvancedActivityChartsReturn {
  const {
    period = 'month',
    enableRealTime = false,
    enableBenchmarks = true,
    enableHeatmap = true
  } = options;

  const { context: userContext } = useUserContext();
  const [currentPeriod, setCurrentPeriod] = useState(period);
  const [error, setError] = useState<string | null>(null);

  const userId = userContext?.profile?.id;

  // Query para insights e recomendações
  const {
    data: insightsData,
    isLoading: isLoadingInsights,
    error: insightsError,
    refetch: refetchInsights
  } = useQuery({
    queryKey: ['activity-insights', userId],
    queryFn: () => activityChartsService.getInsightsAndRecommendations(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Query para dados de benchmark
  const {
    data: benchmarkData,
    isLoading: isLoadingBenchmarks,
    error: benchmarksError,
    refetch: refetchBenchmarks
  } = useQuery({
    queryKey: ['activity-benchmarks', userId],
    queryFn: () => activityChartsService.getBenchmarkData(userId!),
    enabled: !!userId && enableBenchmarks,
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Query para heatmap de atividade
  const {
    data: heatmapData = [],
    isLoading: isLoadingHeatmap,
    error: heatmapError,
    refetch: refetchHeatmap
  } = useQuery({
    queryKey: ['activity-heatmap', userId],
    queryFn: () => activityChartsService.getActivityHeatmap(userId!),
    enabled: !!userId && enableHeatmap,
    staleTime: 60 * 60 * 1000, // 1 hora
    gcTime: 2 * 60 * 60 * 1000, // 2 horas
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Query para tendências de atividade
  const {
    data: activityTrends = [],
    isLoading: isLoadingTrends,
    error: trendsError,
    refetch: refetchTrends
  } = useQuery({
    queryKey: ['activity-trends', userId, currentPeriod],
    queryFn: () => activityChartsService.getActivityTrends(userId!, currentPeriod),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Query para distribuição de atividades
  const {
    data: distributionData = [],
    isLoading: isLoadingDistribution,
    error: distributionError,
    refetch: refetchDistribution
  } = useQuery({
    queryKey: ['activity-distribution', userId],
    queryFn: () => activityChartsService.getActivityDistribution(userId!),
    enabled: !!userId,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Query para performance de validação
  const {
    data: validationPerformance = [],
    isLoading: isLoadingValidation,
    error: validationError,
    refetch: refetchValidation
  } = useQuery({
    queryKey: ['validation-performance', userId],
    queryFn: () => activityChartsService.getValidationPerformance(userId!),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Query para estatísticas de engajamento
  const {
    data: engagementStats,
    isLoading: isLoadingEngagement,
    error: engagementError,
    refetch: refetchEngagement
  } = useQuery({
    queryKey: ['engagement-stats', userId],
    queryFn: () => activityChartsService.getEngagementStats(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Estados derivados
  const insights = insightsData?.insights || [];
  const recommendations = insightsData?.recommendations || [];
  const isLoading = isLoadingInsights || isLoadingTrends || isLoadingDistribution || isLoadingValidation || isLoadingEngagement;

  // Ações
  const refreshData = useCallback(() => {
    refetchInsights();
    refetchTrends();
    refetchDistribution();
    refetchValidation();
    refetchEngagement();
    if (enableBenchmarks) refetchBenchmarks();
    if (enableHeatmap) refetchHeatmap();
  }, [
    refetchInsights,
    refetchTrends,
    refetchDistribution,
    refetchValidation,
    refetchEngagement,
    refetchBenchmarks,
    refetchHeatmap,
    enableBenchmarks,
    enableHeatmap
  ]);

  const refreshInsights = useCallback(() => {
    refetchInsights();
  }, [refetchInsights]);

  const refreshBenchmarks = useCallback(() => {
    if (enableBenchmarks) refetchBenchmarks();
  }, [refetchBenchmarks, enableBenchmarks]);

  const changePeriod = useCallback((newPeriod: 'week' | 'month' | 'quarter') => {
    setCurrentPeriod(newPeriod);
  }, []);

  // Utilitários
  const getInsightsByType = useCallback((type: 'positive' | 'warning' | 'info') => {
    return insights.filter(insight => insight.type === type);
  }, [insights]);

  const getRecommendationsByPriority = useCallback((priority: 'high' | 'medium' | 'low') => {
    return recommendations.filter(rec => rec.priority === priority);
  }, [recommendations]);

  const calculateOverallScore = useCallback(() => {
    if (!engagementStats || !benchmarkData) return 0;
    
    const engagementScore = (1 - engagementStats.bounce_rate) * 100;
    const benchmarkScore = benchmarkData.user_percentile;
    const validationScore = validationPerformance.length > 0 
      ? validationPerformance[validationPerformance.length - 1]?.value * 100 || 0
      : 0;

    return Math.round((engagementScore + benchmarkScore + validationScore) / 3);
  }, [engagementStats, benchmarkData, validationPerformance]);

  const getActivitySummary = useCallback(() => {
    const totalActivities = activityTrends.reduce((sum, trend) => sum + trend.total, 0);
    const averageDaily = totalActivities / Math.max(activityTrends.length, 1);
    
    // Encontrar o dia mais ativo
    const mostActiveDay = activityTrends.reduce((max, trend) => 
      trend.total > max.total ? trend : max, 
      { period: 'N/A', total: 0 }
    ).period;

    // Áreas de melhoria baseadas em benchmarks
    const improvementAreas = benchmarkData?.improvement_areas || [];

    return {
      totalActivities: Math.round(totalActivities),
      averageDaily: Math.round(averageDaily * 10) / 10,
      mostActiveDay,
      improvementAreas
    };
  }, [activityTrends, benchmarkData]);

  // Gerenciamento de erros
  useEffect(() => {
    const errors = [
      insightsError,
      benchmarksError,
      heatmapError,
      trendsError,
      distributionError,
      validationError,
      engagementError
    ].filter(Boolean);

    if (errors.length > 0) {
      setError('Erro ao carregar alguns dados dos gráficos de atividade');
    } else {
      setError(null);
    }
  }, [
    insightsError,
    benchmarksError,
    heatmapError,
    trendsError,
    distributionError,
    validationError,
    engagementError
  ]);

  // Atualização em tempo real
  useEffect(() => {
    if (!enableRealTime || !userId) return;

    const interval = setInterval(() => {
      refreshInsights();
      refetchEngagement();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [enableRealTime, userId, refreshInsights, refetchEngagement]);

  return {
    // Dados principais
    insights,
    recommendations,
    benchmarkData,
    heatmapData,
    activityTrends,
    distributionData,
    validationPerformance,
    engagementStats,

    // Estados de carregamento
    isLoading,
    isLoadingInsights,
    isLoadingBenchmarks,
    isLoadingHeatmap,
    error,

    // Ações
    refreshData,
    refreshInsights,
    refreshBenchmarks,
    changePeriod,

    // Utilitários
    getInsightsByType,
    getRecommendationsByPriority,
    calculateOverallScore,
    getActivitySummary
  };
}

export default useAdvancedActivityCharts;
