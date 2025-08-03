import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  activityChartsService,
  ActivityData,
  UserProgress,
  ValidationMetrics,
  ChartDataPoint,
  ActivityTrend
} from '@/services/activityChartsService';
import { useUserContext } from './useUserContext';

interface UseActivityChartsOptions {
  refreshInterval?: number;
  enableRealTime?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface UseActivityChartsReturn {
  // Dados principais
  activityData: ActivityData[];
  userProgress: UserProgress | null;
  validationMetrics: ValidationMetrics | null;
  activityTrends: ActivityTrend[];
  activityDistribution: ChartDataPoint[];
  validationPerformance: ChartDataPoint[];
  
  // Estados de carregamento
  isLoadingActivity: boolean;
  isLoadingProgress: boolean;
  isLoadingMetrics: boolean;
  isLoadingTrends: boolean;
  
  // Controles
  refreshData: () => void;
  trackActivity: (type: string, metadata?: any) => void;
  setDateRange: (start: Date, end: Date) => void;
  
  // Insights e análises
  engagementScore: number;
  insights: string[];
  chartColors: Record<string, string>;
  
  // Estatísticas derivadas
  totalSessions: number;
  averageDaily: number;
  mostUsedFeature: string;
  improvementRate: number;
}

export function useActivityCharts(options: UseActivityChartsOptions = {}): UseActivityChartsReturn {
  const {
    refreshInterval = 5 * 60 * 1000, // 5 minutos
    enableRealTime = true,
    dateRange
  } = options;

  const { context: userContext } = useUserContext();
  const queryClient = useQueryClient();
  
  // Estados locais
  const [currentDateRange, setCurrentDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30); // Últimos 30 dias por padrão
    return dateRange || { start, end };
  });

  const userId = userContext?.profile?.id || '';

  // Query para dados de atividade
  const {
    data: activityData = [],
    isLoading: isLoadingActivity,
    refetch: refetchActivity
  } = useQuery({
    queryKey: ['activity-data', userId, currentDateRange.start, currentDateRange.end],
    queryFn: () => activityChartsService.getActivityData(
      userId, 
      currentDateRange.start, 
      currentDateRange.end
    ),
    enabled: !!userId,
    refetchInterval: enableRealTime ? refreshInterval : false,
    staleTime: 2 * 60 * 1000 // 2 minutos
  });

  // Query para progresso do usuário
  const {
    data: userProgress,
    isLoading: isLoadingProgress,
    refetch: refetchProgress
  } = useQuery({
    queryKey: ['user-progress', userId],
    queryFn: () => activityChartsService.getUserProgress(userId),
    enabled: !!userId,
    refetchInterval: enableRealTime ? refreshInterval : false,
    staleTime: 5 * 60 * 1000 // 5 minutos
  });

  // Query para métricas de validação
  const {
    data: validationMetrics,
    isLoading: isLoadingMetrics,
    refetch: refetchMetrics
  } = useQuery({
    queryKey: ['validation-metrics', userId],
    queryFn: () => activityChartsService.getValidationMetrics(userId),
    enabled: !!userId,
    refetchInterval: enableRealTime ? refreshInterval : false,
    staleTime: 5 * 60 * 1000
  });

  // Query para tendências de atividade
  const {
    data: activityTrends = [],
    isLoading: isLoadingTrends,
    refetch: refetchTrends
  } = useQuery({
    queryKey: ['activity-trends', userId],
    queryFn: () => activityChartsService.getActivityTrends(userId, 'month'),
    enabled: !!userId,
    refetchInterval: enableRealTime ? refreshInterval : false,
    staleTime: 10 * 60 * 1000 // 10 minutos
  });

  // Query para distribuição de atividades
  const { data: activityDistribution = [] } = useQuery({
    queryKey: ['activity-distribution', userId],
    queryFn: () => activityChartsService.getActivityDistribution(userId),
    enabled: !!userId,
    staleTime: 15 * 60 * 1000 // 15 minutos
  });

  // Query para performance de validação
  const { data: validationPerformance = [] } = useQuery({
    queryKey: ['validation-performance', userId],
    queryFn: () => activityChartsService.getValidationPerformance(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000
  });

  // Mutation para rastrear atividade
  const trackActivityMutation = useMutation({
    mutationFn: ({ type, metadata }: { type: string; metadata?: any }) =>
      activityChartsService.trackActivity(userId, type as any, metadata),
    onSuccess: () => {
      // Invalidar queries relacionadas para atualizar dados
      queryClient.invalidateQueries({ queryKey: ['activity-data', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-progress', userId] });
      queryClient.invalidateQueries({ queryKey: ['activity-trends', userId] });
    }
  });

  // Cores para os gráficos
  const chartColors = useMemo(() => ({
    dreams: '#3b82f6', // blue-500
    visamatch: '#10b981', // emerald-500
    specialist: '#f59e0b', // amber-500
    pdf: '#8b5cf6', // violet-500
    validation: '#06b6d4', // cyan-500
    success: '#22c55e', // green-500
    warning: '#eab308', // yellow-500
    error: '#ef4444', // red-500
    info: '#6366f1' // indigo-500
  }), []);

  // Cálculos derivados
  const totalSessions = useMemo(() => {
    return activityData.reduce((sum, day) => 
      sum + day.dreams_sessions + day.visamatch_sessions + day.specialist_chats, 0
    );
  }, [activityData]);

  const averageDaily = useMemo(() => {
    if (activityData.length === 0) return 0;
    return totalSessions / activityData.length;
  }, [totalSessions, activityData.length]);

  const mostUsedFeature = useMemo(() => {
    const totals = activityData.reduce((acc, day) => ({
      dreams: acc.dreams + day.dreams_sessions,
      visamatch: acc.visamatch + day.visamatch_sessions,
      specialist: acc.specialist + day.specialist_chats
    }), { dreams: 0, visamatch: 0, specialist: 0 });

    const max = Math.max(totals.dreams, totals.visamatch, totals.specialist);
    if (max === totals.dreams) return 'dreams';
    if (max === totals.visamatch) return 'visamatch';
    return 'specialist';
  }, [activityData]);

  const improvementRate = useMemo(() => {
    if (activityTrends.length < 7) return 0;
    
    const recent = activityTrends.slice(-7);
    const previous = activityTrends.slice(-14, -7);
    
    const recentAvg = recent.reduce((sum, t) => sum + t.total, 0) / recent.length;
    const previousAvg = previous.reduce((sum, t) => sum + t.total, 0) / previous.length;
    
    if (previousAvg === 0) return 0;
    return ((recentAvg - previousAvg) / previousAvg) * 100;
  }, [activityTrends]);

  // Score de engajamento
  const engagementScore = useMemo(() => {
    if (!userProgress || !validationMetrics) return 0;
    
    return activityChartsService.calculateEngagementScore(
      userProgress.total_sessions,
      userProgress.active_days,
      userProgress.avg_session_time,
      {
        dreams: activityDistribution.find(d => d.category === 'dreams')?.value || 0,
        visamatch: activityDistribution.find(d => d.category === 'visamatch')?.value || 0,
        specialist: activityDistribution.find(d => d.category === 'specialist')?.value || 0
      }
    );
  }, [userProgress, validationMetrics, activityDistribution]);

  // Insights gerados
  const insights = useMemo(() => {
    if (!userProgress || !validationMetrics || activityTrends.length === 0) {
      return [];
    }
    
    return activityChartsService.generateInsights(
      userProgress,
      validationMetrics,
      activityTrends
    );
  }, [userProgress, validationMetrics, activityTrends]);

  // Funções de controle
  const refreshData = () => {
    refetchActivity();
    refetchProgress();
    refetchMetrics();
    refetchTrends();
  };

  const trackActivity = (type: string, metadata?: any) => {
    trackActivityMutation.mutate({ type, metadata });
  };

  const setDateRange = (start: Date, end: Date) => {
    setCurrentDateRange({ start, end });
  };

  // Efeito para rastrear visualização do dashboard
  useEffect(() => {
    if (userId) {
      trackActivity('dashboard_view', {
        timestamp: new Date().toISOString(),
        date_range: currentDateRange
      });
    }
  }, [userId]); // Executar apenas uma vez ao montar

  return {
    // Dados principais
    activityData,
    userProgress,
    validationMetrics,
    activityTrends,
    activityDistribution,
    validationPerformance,
    
    // Estados de carregamento
    isLoadingActivity,
    isLoadingProgress,
    isLoadingMetrics,
    isLoadingTrends,
    
    // Controles
    refreshData,
    trackActivity,
    setDateRange,
    
    // Insights e análises
    engagementScore,
    insights,
    chartColors,
    
    // Estatísticas derivadas
    totalSessions,
    averageDaily,
    mostUsedFeature,
    improvementRate
  };
}

// Hook especializado para métricas de validação
export function useValidationCharts(userId?: string) {
  return useQuery({
    queryKey: ['validation-charts', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const [metrics, performance] = await Promise.all([
        activityChartsService.getValidationMetrics(userId),
        activityChartsService.getValidationPerformance(userId)
      ]);
      
      return { metrics, performance };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000
  });
}

// Hook para estatísticas de engajamento
export function useEngagementStats(userId?: string) {
  return useQuery({
    queryKey: ['engagement-stats', userId],
    queryFn: () => userId ? activityChartsService.getEngagementStats(userId) : null,
    enabled: !!userId,
    staleTime: 10 * 60 * 1000
  });
}

export default useActivityCharts;
