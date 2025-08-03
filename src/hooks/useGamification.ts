import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  gamificationService, 
  Achievement, 
  GamificationStats, 
  UserLevel 
} from '@/services/gamificationService';
import { useUserContext } from './useUserContext';
import { toast } from 'sonner';

interface UseGamificationOptions {
  enableNotifications?: boolean;
  autoCheckAchievements?: boolean;
  enableLevelUpEffects?: boolean;
}

interface UseGamificationReturn {
  // Estados principais
  stats: GamificationStats | null;
  achievements: Achievement[];
  isLoading: boolean;
  isLoadingAchievements: boolean;
  error: string | null;

  // Ações principais
  checkAchievements: (context: any) => Promise<Achievement[]>;
  addPoints: (points: number, source: string, metadata?: any) => Promise<void>;
  refreshStats: () => void;
  refreshAchievements: () => void;

  // Utilitários
  getLevelProgress: () => { current: UserLevel; next?: UserLevel; progress: number };
  getAchievementsByCategory: (category: string) => Achievement[];
  getUnlockedAchievements: () => Achievement[];
  getLockedAchievements: () => Achievement[];
  calculateNextLevelPoints: () => number;

  // Estados derivados
  currentLevel: UserLevel | null;
  nextLevel: UserLevel | null;
  levelProgress: number;
  recentAchievements: Achievement[];
  totalProgress: number;
}

export function useGamification(options: UseGamificationOptions = {}): UseGamificationReturn {
  const {
    enableNotifications = true,
    autoCheckAchievements = true,
    enableLevelUpEffects = true
  } = options;

  const { context: userContext } = useUserContext();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const userId = userContext?.profile?.id;

  // Query para estatísticas de gamificação
  const {
    data: stats,
    isLoading,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['gamification-stats', userId],
    queryFn: () => gamificationService.getUserGamificationStats(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (substituindo cacheTime)
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Query para conquistas
  const {
    data: achievements = [],
    isLoading: isLoadingAchievements,
    error: achievementsError,
    refetch: refetchAchievements
  } = useQuery({
    queryKey: ['user-achievements', userId],
    queryFn: () => gamificationService.getUserAchievements(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000, // 10 minutos (substituindo cacheTime)
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Mutation para verificar conquistas
  const checkAchievementsMutation = useMutation({
    mutationFn: async (context: any) => {
      if (!userId) throw new Error('Usuário não autenticado');
      return gamificationService.checkAndUnlockAchievements(userId, context);
    },
    onSuccess: (newAchievements) => {
      if (newAchievements.length > 0) {
        // Invalidar queries para atualizar dados
        queryClient.invalidateQueries({ queryKey: ['gamification-stats', userId] });
        queryClient.invalidateQueries({ queryKey: ['user-achievements', userId] });

        // Mostrar notificações de conquistas
        if (enableNotifications) {
          newAchievements.forEach(achievement => {
            toast.success(`🏆 Conquista desbloqueada: ${achievement.title}`, {
              description: achievement.description,
              duration: 5000,
              action: {
                label: 'Ver Conquistas',
                onClick: () => {
                  // Navegar para aba de conquistas
                  console.log('Navigate to achievements');
                }
              }
            });
          });
        }

        // Efeitos de level up
        if (enableLevelUpEffects && stats) {
          const totalNewPoints = newAchievements.reduce((sum, ach) => sum + ach.points, 0);
          const oldLevel = gamificationService.calculateLevelProgress(stats.total_points);
          const newLevel = gamificationService.calculateLevelProgress(stats.total_points + totalNewPoints);

          if (newLevel.current.level > oldLevel.current.level) {
            toast.success(`🎉 Parabéns! Você subiu para o nível ${newLevel.current.level}!`, {
              description: `Novo título: ${newLevel.current.title}`,
              duration: 7000
            });
          }
        }
      }
    },
    onError: (error) => {
      console.error('Erro ao verificar conquistas:', error);
      setError('Erro ao verificar conquistas');
    }
  });

  // Mutation para adicionar pontos
  const addPointsMutation = useMutation({
    mutationFn: async ({ points, source, metadata }: { points: number; source: string; metadata?: any }) => {
      if (!userId) throw new Error('Usuário não autenticado');
      return gamificationService.addPoints(userId, points, source, metadata);
    },
    onSuccess: () => {
      // Invalidar queries para atualizar dados
      queryClient.invalidateQueries({ queryKey: ['gamification-stats', userId] });
      
      // Auto-verificar conquistas se habilitado
      if (autoCheckAchievements && stats) {
        checkAchievementsMutation.mutate({
          completionPercentage: stats.total_points / 20, // Estimativa baseada em pontos
          timeSpent: stats.total_points / 10 // Estimativa
        });
      }
    },
    onError: (error) => {
      console.error('Erro ao adicionar pontos:', error);
      setError('Erro ao adicionar pontos');
    }
  });

  // Funções principais
  const checkAchievements = useCallback(async (context: any): Promise<Achievement[]> => {
    try {
      setError(null);
      const result = await checkAchievementsMutation.mutateAsync(context);
      return result;
    } catch (error) {
      console.error('Erro ao verificar conquistas:', error);
      return [];
    }
  }, [checkAchievementsMutation]);

  const addPoints = useCallback(async (points: number, source: string, metadata?: any): Promise<void> => {
    try {
      setError(null);
      await addPointsMutation.mutateAsync({ points, source, metadata });
    } catch (error) {
      console.error('Erro ao adicionar pontos:', error);
    }
  }, [addPointsMutation]);

  const refreshStats = useCallback(() => {
    refetchStats();
  }, [refetchStats]);

  const refreshAchievements = useCallback(() => {
    refetchAchievements();
  }, [refetchAchievements]);

  // Utilitários
  const getLevelProgress = useCallback(() => {
    if (!stats) {
      const defaultLevel = gamificationService.getAllLevels()[0];
      return { current: defaultLevel, progress: 0 };
    }
    return gamificationService.calculateLevelProgress(stats.total_points);
  }, [stats]);

  const getAchievementsByCategory = useCallback((category: string) => {
    return achievements.filter(achievement => achievement.category === category);
  }, [achievements]);

  const getUnlockedAchievements = useCallback(() => {
    return achievements.filter(achievement => achievement.unlocked);
  }, [achievements]);

  const getLockedAchievements = useCallback(() => {
    return achievements.filter(achievement => !achievement.unlocked);
  }, [achievements]);

  const calculateNextLevelPoints = useCallback(() => {
    if (!stats || !stats.next_level) return 0;
    return stats.points_to_next_level;
  }, [stats]);

  // Estados derivados
  const levelProgress = getLevelProgress();
  const currentLevel = stats?.current_level || null;
  const nextLevel = stats?.next_level || null;
  const recentAchievements = stats?.recent_achievements || [];
  const totalProgress = stats ? (stats.achievements_unlocked / stats.total_achievements) * 100 : 0;

  // Efeitos
  useEffect(() => {
    if (statsError) {
      setError('Erro ao carregar estatísticas de gamificação');
    } else if (achievementsError) {
      setError('Erro ao carregar conquistas');
    } else {
      setError(null);
    }
  }, [statsError, achievementsError]);

  // Auto-verificação de conquistas baseada em mudanças de contexto
  useEffect(() => {
    if (autoCheckAchievements && userId && stats && userContext) {
      const context = {
        completionPercentage: stats.total_points / 20, // Estimativa
        timeSpent: stats.total_points / 10, // Estimativa
        streak: stats.current_streak,
        customConditions: {
          perfectCompletion: false // Pode ser calculado baseado em outros dados
        }
      };

      // Verificar conquistas periodicamente (debounced)
      const timeoutId = setTimeout(() => {
        checkAchievements(context);
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [autoCheckAchievements, userId, stats, userContext, checkAchievements]);

  return {
    // Estados principais
    stats,
    achievements,
    isLoading,
    isLoadingAchievements,
    error,

    // Ações principais
    checkAchievements,
    addPoints,
    refreshStats,
    refreshAchievements,

    // Utilitários
    getLevelProgress,
    getAchievementsByCategory,
    getUnlockedAchievements,
    getLockedAchievements,
    calculateNextLevelPoints,

    // Estados derivados
    currentLevel,
    nextLevel,
    levelProgress: levelProgress.progress,
    recentAchievements,
    totalProgress
  };
}

// Hook específico para tracking de atividades
export function useActivityTracking() {
  const { addPoints, checkAchievements } = useGamification();

  const trackToolUsage = useCallback(async (toolName: string, metadata?: any) => {
    const pointsMap: Record<string, number> = {
      'dreams': 25,
      'visamatch': 30,
      'pdf_generation': 35,
      'specialist_chat': 40,
      'adaptive_questionnaire': 20
    };

    const points = pointsMap[toolName] || 15;
    
    await addPoints(points, `tool_usage_${toolName}`, {
      tool: toolName,
      ...metadata
    });

    // Verificar conquistas relacionadas a uso de ferramentas
    await checkAchievements({
      toolUsage: { tool: toolName, count: 1 },
      ...metadata
    });
  }, [addPoints, checkAchievements]);

  const trackCompletion = useCallback(async (completionPercentage: number, timeSpent?: number) => {
    // Pontos baseados em marcos de progresso
    const milestones = [10, 25, 50, 75, 100];
    const milestone = milestones.find(m => completionPercentage >= m);
    
    if (milestone) {
      const points = milestone * 2; // 20, 50, 100, 150, 200 pontos
      await addPoints(points, `completion_milestone_${milestone}`, {
        completion_percentage: completionPercentage,
        time_spent: timeSpent
      });
    }

    // Verificar conquistas de progresso
    await checkAchievements({
      completionPercentage,
      timeSpent,
      customConditions: {
        fastCompletion: timeSpent && timeSpent <= 120 && completionPercentage >= 100
      }
    });
  }, [addPoints, checkAchievements]);

  const trackStreak = useCallback(async (streakDays: number) => {
    const streakPoints = streakDays * 10; // 10 pontos por dia de streak
    
    await addPoints(streakPoints, 'daily_streak', {
      streak_days: streakDays
    });

    await checkAchievements({
      streak: streakDays
    });
  }, [addPoints, checkAchievements]);

  const trackSpecialActivity = useCallback(async (activityType: string, metadata?: any) => {
    const specialPoints: Record<string, number> = {
      'early_morning': 25,
      'late_night': 25,
      'weekend_usage': 15,
      'perfect_score': 50,
      'help_others': 30
    };

    const points = specialPoints[activityType] || 10;
    
    await addPoints(points, `special_${activityType}`, metadata);

    await checkAchievements({
      customConditions: {
        [activityType]: true,
        ...metadata
      }
    });
  }, [addPoints, checkAchievements]);

  return {
    trackToolUsage,
    trackCompletion,
    trackStreak,
    trackSpecialActivity
  };
}

export default useGamification;
