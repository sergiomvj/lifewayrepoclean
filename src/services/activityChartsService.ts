import { supabase } from '@/integrations/supabase/client';

export interface ActivityData {
  date: string;
  dreams_sessions: number;
  visamatch_sessions: number;
  specialist_chats: number;
  pdf_generations: number;
  validation_score: number;
  completion_rate: number;
}

export interface UserProgress {
  total_sessions: number;
  completed_dreams: number;
  completed_visamatch: number;
  active_days: number;
  avg_session_time: number;
  last_activity: string;
}

export interface ValidationMetrics {
  total_validations: number;
  success_rate: number;
  avg_confidence: number;
  personalization_rate: number;
  user_satisfaction: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  date?: string;
  category?: string;
}

export interface ActivityTrend {
  period: string;
  dreams: number;
  visamatch: number;
  specialist: number;
  total: number;
}

class ActivityChartsService {
  // Buscar dados de atividade por período
  async getActivityData(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<ActivityData[]> {
    try {
      // Simular dados por enquanto - em produção viria do Supabase
      const mockData: ActivityData[] = this.generateMockActivityData(startDate, endDate);
      
      // TODO: Implementar query real do Supabase
      /*
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      return this.processActivityData(data);
      */
      
      return mockData;
    } catch (error) {
      console.error('Erro ao buscar dados de atividade:', error);
      return [];
    }
  }

  // Buscar progresso geral do usuário
  async getUserProgress(userId: string): Promise<UserProgress> {
    try {
      // Dados simulados
      const mockProgress: UserProgress = {
        total_sessions: 24,
        completed_dreams: 3,
        completed_visamatch: 5,
        active_days: 12,
        avg_session_time: 18.5, // minutos
        last_activity: new Date().toISOString()
      };

      // TODO: Query real do Supabase
      /*
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
      */

      return mockProgress;
    } catch (error) {
      console.error('Erro ao buscar progresso do usuário:', error);
      throw error;
    }
  }

  // Buscar métricas de validação
  async getValidationMetrics(userId: string): Promise<ValidationMetrics> {
    try {
      const mockMetrics: ValidationMetrics = {
        total_validations: 156,
        success_rate: 0.87,
        avg_confidence: 0.82,
        personalization_rate: 0.74,
        user_satisfaction: 0.91
      };

      return mockMetrics;
    } catch (error) {
      console.error('Erro ao buscar métricas de validação:', error);
      throw error;
    }
  }

  // Gerar dados de tendência de atividade
  async getActivityTrends(
    userId: string, 
    period: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<ActivityTrend[]> {
    try {
      const trends: ActivityTrend[] = [];
      const now = new Date();
      const periodsBack = period === 'week' ? 7 : period === 'month' ? 30 : 90;

      for (let i = periodsBack; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        trends.push({
          period: this.formatPeriod(date, period),
          dreams: Math.floor(Math.random() * 5) + 1,
          visamatch: Math.floor(Math.random() * 3) + 1,
          specialist: Math.floor(Math.random() * 2),
          total: 0
        });
      }

      // Calcular totais
      trends.forEach(trend => {
        trend.total = trend.dreams + trend.visamatch + trend.specialist;
      });

      return trends;
    } catch (error) {
      console.error('Erro ao buscar tendências:', error);
      return [];
    }
  }

  // Buscar dados para gráfico de pizza (distribuição de atividades)
  async getActivityDistribution(userId: string): Promise<ChartDataPoint[]> {
    try {
      return [
        { name: 'Criador de Sonhos', value: 45, category: 'dreams' },
        { name: 'VisaMatch', value: 30, category: 'visamatch' },
        { name: 'Chat Especialista', value: 15, category: 'specialist' },
        { name: 'PDF Gerados', value: 10, category: 'pdf' }
      ];
    } catch (error) {
      console.error('Erro ao buscar distribuição:', error);
      return [];
    }
  }

  // Buscar dados de performance de validação ao longo do tempo
  async getValidationPerformance(userId: string): Promise<ChartDataPoint[]> {
    try {
      const performance: ChartDataPoint[] = [];
      const now = new Date();

      for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        performance.push({
          name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          value: Math.random() * 0.3 + 0.7, // Entre 0.7 e 1.0
          date: date.toISOString()
        });
      }

      return performance;
    } catch (error) {
      console.error('Erro ao buscar performance de validação:', error);
      return [];
    }
  }

  // Buscar estatísticas de engajamento
  async getEngagementStats(userId: string): Promise<{
    daily_active: number;
    weekly_active: number;
    monthly_active: number;
    avg_session_duration: number;
    bounce_rate: number;
    feature_adoption: Record<string, number>;
  }> {
    try {
      return {
        daily_active: 1,
        weekly_active: 5,
        monthly_active: 12,
        avg_session_duration: 18.5,
        bounce_rate: 0.23,
        feature_adoption: {
          dreams: 0.85,
          visamatch: 0.72,
          specialist: 0.45,
          pdf: 0.38,
          validation: 0.91
        }
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de engajamento:', error);
      throw error;
    }
  }

  // Buscar insights e recomendações baseadas em dados
  async getInsightsAndRecommendations(userId: string): Promise<{
    insights: Array<{
      type: 'positive' | 'warning' | 'info';
      title: string;
      description: string;
      metric?: number;
      trend?: 'up' | 'down' | 'stable';
    }>;
    recommendations: Array<{
      priority: 'high' | 'medium' | 'low';
      category: string;
      title: string;
      description: string;
      action: string;
    }>;
  }> {
    try {
      const progress = await this.getUserProgress(userId);
      const metrics = await this.getValidationMetrics(userId);
      const engagement = await this.getEngagementStats(userId);

      const insights: Array<{
        type: 'positive' | 'warning' | 'info';
        title: string;
        description: string;
        metric?: number;
        trend?: 'up' | 'down' | 'stable';
      }> = [
        {
          type: 'positive',
          title: 'Excelente Taxa de Validação',
          description: `Sua taxa de sucesso de ${Math.round(metrics.success_rate * 100)}% está acima da média`,
          metric: metrics.success_rate,
          trend: 'up'
        },
        {
          type: 'info',
          title: 'Uso Consistente',
          description: `Você está ativo há ${progress.active_days} dias`,
          metric: progress.active_days,
          trend: 'stable'
        },
        {
          type: engagement.bounce_rate > 0.3 ? 'warning' : 'positive',
          title: 'Engajamento por Sessão',
          description: `Taxa de abandono de ${Math.round(engagement.bounce_rate * 100)}%`,
          metric: engagement.bounce_rate,
          trend: engagement.bounce_rate > 0.3 ? 'up' : 'down'
        }
      ];

      const recommendations = [
        {
          priority: 'high' as const,
          category: 'Produtividade',
          title: 'Complete mais sessões do Dreams',
          description: 'Você tem potencial para criar mais cenários familiares',
          action: 'Acesse o Criador de Sonhos'
        },
        {
          priority: 'medium' as const,
          category: 'Engajamento',
          title: 'Explore o Chat com Especialista',
          description: 'Tire dúvidas específicas sobre seu processo',
          action: 'Iniciar conversa'
        },
        {
          priority: 'low' as const,
          category: 'Documentação',
          title: 'Gere seu PDF personalizado',
          description: 'Documente seu progresso em um relatório elegante',
          action: 'Gerar PDF'
        }
      ];

      return { insights, recommendations };
    } catch (error) {
      console.error('Erro ao buscar insights:', error);
      return { insights: [], recommendations: [] };
    }
  }

  // Buscar dados de heatmap de atividade
  async getActivityHeatmap(userId: string): Promise<Array<{
    date: string;
    day: number;
    week: number;
    value: number;
    level: 0 | 1 | 2 | 3 | 4;
  }>> {
    try {
      const heatmapData = [];
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 365); // Último ano

      let currentDate = new Date(startDate);
      while (currentDate <= now) {
        const dayOfWeek = currentDate.getDay();
        const weekOfYear = this.getWeekOfYear(currentDate);
        const activityLevel = Math.floor(Math.random() * 5);

        heatmapData.push({
          date: currentDate.toISOString().split('T')[0],
          day: dayOfWeek,
          week: weekOfYear,
          value: activityLevel * 2,
          level: activityLevel as 0 | 1 | 2 | 3 | 4
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return heatmapData;
    } catch (error) {
      console.error('Erro ao buscar heatmap:', error);
      return [];
    }
  }

  // Buscar comparação com outros usuários (anonimizada)
  async getBenchmarkData(userId: string): Promise<{
    user_percentile: number;
    category_rankings: Record<string, {
      user_score: number;
      average_score: number;
      percentile: number;
    }>;
    improvement_areas: string[];
  }> {
    try {
      return {
        user_percentile: 78,
        category_rankings: {
          completion_rate: {
            user_score: 0.85,
            average_score: 0.72,
            percentile: 82
          },
          engagement: {
            user_score: 0.91,
            average_score: 0.68,
            percentile: 89
          },
          validation_accuracy: {
            user_score: 0.87,
            average_score: 0.75,
            percentile: 76
          },
          tool_adoption: {
            user_score: 0.65,
            average_score: 0.58,
            percentile: 68
          }
        },
        improvement_areas: ['tool_adoption', 'consistency']
      };
    } catch (error) {
      console.error('Erro ao buscar dados de benchmark:', error);
      throw error;
    }
  }

  // Métodos auxiliares expandidos
  private getWeekOfYear(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  private formatPeriod(date: Date, period: 'week' | 'month' | 'quarter'): string {
    switch (period) {
      case 'week':
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      case 'month':
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      case 'quarter':
        return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      default:
        return date.toLocaleDateString('pt-BR');
    }
  }

  // Métodos auxiliares
  private generateMockActivityData(startDate: Date, endDate: Date): ActivityData[] {
    const data: ActivityData[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      data.push({
        date: currentDate.toISOString().split('T')[0],
        dreams_sessions: Math.floor(Math.random() * 3),
        visamatch_sessions: Math.floor(Math.random() * 2),
        specialist_chats: Math.floor(Math.random() * 2),
        pdf_generations: Math.floor(Math.random() * 2),
        validation_score: Math.random() * 0.3 + 0.7,
        completion_rate: Math.random() * 0.4 + 0.6
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
  }

  // Função formatPeriod removida - usando a implementação anterior

  // Salvar atividade do usuário
  async trackActivity(
    userId: string,
    activityType: 'dreams' | 'visamatch' | 'specialist' | 'pdf' | 'validation',
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // TODO: Implementar salvamento no Supabase
      /*
      const { error } = await supabase
        .from('user_activities')
        .insert({
          user_id: userId,
          activity_type: activityType,
          metadata: metadata || {},
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      */

      console.log('Atividade rastreada:', { userId, activityType, metadata });
    } catch (error) {
      console.error('Erro ao rastrear atividade:', error);
    }
  }

  // Calcular score de engajamento
  calculateEngagementScore(
    totalSessions: number,
    activeDays: number,
    avgSessionTime: number,
    featureUsage: Record<string, number>
  ): number {
    const sessionScore = Math.min(totalSessions / 50, 1) * 0.3;
    const consistencyScore = Math.min(activeDays / 30, 1) * 0.3;
    const durationScore = Math.min(avgSessionTime / 30, 1) * 0.2;
    const diversityScore = Object.values(featureUsage).reduce((a, b) => a + b, 0) / Object.keys(featureUsage).length * 0.2;

    return Math.round((sessionScore + consistencyScore + durationScore + diversityScore) * 100);
  }

  // Gerar insights baseados nos dados
  generateInsights(
    progress: UserProgress,
    metrics: ValidationMetrics,
    trends: ActivityTrend[]
  ): string[] {
    const insights: string[] = [];

    // Análise de progresso
    if (progress.active_days >= 7) {
      insights.push(`🔥 Excelente consistência! Você está ativo há ${progress.active_days} dias.`);
    }

    if (progress.avg_session_time > 15) {
      insights.push(`⏰ Suas sessões são produtivas com média de ${progress.avg_session_time.toFixed(1)} minutos.`);
    }

    // Análise de validação
    if (metrics.success_rate > 0.8) {
      insights.push(`✅ Alta taxa de sucesso nas validações (${Math.round(metrics.success_rate * 100)}%).`);
    }

    if (metrics.personalization_rate > 0.7) {
      insights.push(`🎯 Sistema bem personalizado para seu perfil (${Math.round(metrics.personalization_rate * 100)}%).`);
    }

    // Análise de tendências
    const recentTrend = trends.slice(-7);
    const avgRecent = recentTrend.reduce((sum, t) => sum + t.total, 0) / recentTrend.length;
    const previousTrend = trends.slice(-14, -7);
    const avgPrevious = previousTrend.reduce((sum, t) => sum + t.total, 0) / previousTrend.length;

    if (avgRecent > avgPrevious * 1.2) {
      insights.push(`📈 Atividade crescendo! ${Math.round(((avgRecent - avgPrevious) / avgPrevious) * 100)}% de aumento.`);
    }

    return insights;
  }
}

export const activityChartsService = new ActivityChartsService();
export default activityChartsService;
