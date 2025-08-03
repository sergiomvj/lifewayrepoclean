import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toolAchievementsService, ToolAchievement } from '@/services/toolAchievementsService';
import { useUserContext } from './useUserContext';

interface UseToolAchievementsOptions {
  tool?: ToolAchievement['tool'];
  enableAutoCheck?: boolean;
  enableNotifications?: boolean;
}

interface UseToolAchievementsReturn {
  // Dados principais
  allAchievements: ToolAchievement[];
  toolAchievements: ToolAchievement[];
  unlockedAchievements: any[];
  availableAchievements: ToolAchievement[];
  secretAchievements: ToolAchievement[];
  achievementStats: {
    totalUnlocked: number;
    totalPoints: number;
    byTool: Record<string, number>;
    byDifficulty: Record<string, number>;
    secretsUnlocked: number;
  };

  // Estados de carregamento
  isLoading: boolean;
  isLoadingStats: boolean;
  error: string | null;

  // Ações
  unlockAchievement: (achievementId: string) => Promise<boolean>;
  checkAndUnlockAchievements: (tool: ToolAchievement['tool'], userStats: Record<string, any>) => Promise<ToolAchievement[]>;
  refreshAchievements: () => void;

  // Utilitários
  getAchievementsByTool: (tool: ToolAchievement['tool']) => ToolAchievement[];
  getAchievementsByCategory: (category: ToolAchievement['category']) => ToolAchievement[];
  getAchievementsByDifficulty: (difficulty: ToolAchievement['difficulty']) => ToolAchievement[];
  isAchievementUnlocked: (achievementId: string) => boolean;
  canUnlockAchievement: (achievementId: string, userStats: Record<string, any>) => Promise<boolean>;
  getProgressToAchievement: (achievementId: string, userStats: Record<string, any>) => {
    current: number;
    required: number;
    percentage: number;
  } | null;

  // Notificações
  newAchievementsCount: number;
  markAchievementsAsSeen: () => void;
}

export function useToolAchievements(options: UseToolAchievementsOptions = {}): UseToolAchievementsReturn {
  const {
    tool,
    enableAutoCheck = true,
    enableNotifications = true
  } = options;

  const { context: userContext } = useUserContext();
  const queryClient = useQueryClient();

  const [error, setError] = useState<string | null>(null);
  const [newAchievementsCount, setNewAchievementsCount] = useState(0);
  const [lastSeenAchievementsCount, setLastSeenAchievementsCount] = useState(0);

  const userId = userContext?.profile?.id;

  // Obter todas as conquistas
  const allAchievements = toolAchievementsService.getAllAchievements();
  const toolAchievements = tool ? toolAchievementsService.getAchievementsByTool(tool) : allAchievements;
  const secretAchievements = toolAchievementsService.getSecretAchievements();

  // Query para conquistas desbloqueadas do usuário
  const {
    data: unlockedAchievements = [],
    isLoading: isLoadingUnlocked,
    error: unlockedError,
    refetch: refetchUnlocked
  } = useQuery({
    queryKey: ['user-tool-achievements', userId],
    queryFn: () => toolAchievementsService.getUserUnlockedAchievements(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Query para estatísticas de conquistas
  const {
    data: achievementStats = {
      totalUnlocked: 0,
      totalPoints: 0,
      byTool: {},
      byDifficulty: {},
      secretsUnlocked: 0
    },
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['user-achievement-stats', userId],
    queryFn: () => toolAchievementsService.getUserAchievementStats(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Mutation para desbloquear conquista
  const unlockAchievementMutation = useMutation({
    mutationFn: ({ userId, achievementId }: { userId: string; achievementId: string }) =>
      toolAchievementsService.unlockAchievement(userId, achievementId),
    onSuccess: (success, { achievementId }) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['user-tool-achievements', userId] });
        queryClient.invalidateQueries({ queryKey: ['user-achievement-stats', userId] });
        
        if (enableNotifications) {
          setNewAchievementsCount(prev => prev + 1);
        }
      }
    },
    onError: (error) => {
      console.error('Erro ao desbloquear conquista:', error);
      setError('Erro ao desbloquear conquista');
    }
  });

  // Mutation para verificar e desbloquear múltiplas conquistas
  const checkAndUnlockMutation = useMutation({
    mutationFn: ({ 
      userId, 
      tool, 
      userStats 
    }: { 
      userId: string; 
      tool: ToolAchievement['tool']; 
      userStats: Record<string, any> 
    }) => toolAchievementsService.checkAndUnlockAchievements(userId, tool, userStats),
    onSuccess: (newAchievements) => {
      if (newAchievements.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['user-tool-achievements', userId] });
        queryClient.invalidateQueries({ queryKey: ['user-achievement-stats', userId] });
        
        if (enableNotifications) {
          setNewAchievementsCount(prev => prev + newAchievements.length);
        }
      }
    },
    onError: (error) => {
      console.error('Erro ao verificar conquistas:', error);
      setError('Erro ao verificar conquistas');
    }
  });

  // Estados derivados
  const isLoading = isLoadingUnlocked || isLoadingStats;
  const availableAchievements = allAchievements.filter(achievement => 
    !unlockedAchievements.some(ua => ua.achievement_id === achievement.id)
  );

  // Ações
  const unlockAchievement = useCallback(async (achievementId: string): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      const result = await unlockAchievementMutation.mutateAsync({ userId, achievementId });
      return result;
    } catch (error) {
      console.error('Erro ao desbloquear conquista:', error);
      return false;
    }
  }, [userId, unlockAchievementMutation]);

  const checkAndUnlockAchievements = useCallback(async (
    targetTool: ToolAchievement['tool'], 
    userStats: Record<string, any>
  ): Promise<ToolAchievement[]> => {
    if (!userId) return [];
    
    try {
      const result = await checkAndUnlockMutation.mutateAsync({ 
        userId, 
        tool: targetTool, 
        userStats 
      });
      return result;
    } catch (error) {
      console.error('Erro ao verificar conquistas:', error);
      return [];
    }
  }, [userId, checkAndUnlockMutation]);

  const refreshAchievements = useCallback(() => {
    refetchUnlocked();
    refetchStats();
  }, [refetchUnlocked, refetchStats]);

  // Utilitários
  const getAchievementsByTool = useCallback((targetTool: ToolAchievement['tool']) => {
    return toolAchievementsService.getAchievementsByTool(targetTool);
  }, []);

  const getAchievementsByCategory = useCallback((category: ToolAchievement['category']) => {
    return toolAchievementsService.getAchievementsByCategory(category);
  }, []);

  const getAchievementsByDifficulty = useCallback((difficulty: ToolAchievement['difficulty']) => {
    return toolAchievementsService.getAchievementsByDifficulty(difficulty);
  }, []);

  const isAchievementUnlocked = useCallback((achievementId: string) => {
    return unlockedAchievements.some(ua => ua.achievement_id === achievementId);
  }, [unlockedAchievements]);

  const canUnlockAchievement = useCallback(async (
    achievementId: string, 
    userStats: Record<string, any>
  ): Promise<boolean> => {
    if (!userId) return false;
    return toolAchievementsService.canUnlockAchievement(userId, achievementId, userStats);
  }, [userId]);

  const getProgressToAchievement = useCallback((
    achievementId: string, 
    userStats: Record<string, any>
  ) => {
    const achievement = toolAchievementsService.getAchievementById(achievementId);
    if (!achievement) return null;

    const { criteria } = achievement;
    let current = 0;
    let required = criteria.value;

    switch (criteria.type) {
      case 'count':
        current = userStats.count || 0;
        break;
      case 'streak':
        current = userStats.streak || 0;
        break;
      case 'quality_score':
        current = userStats.quality_score || 0;
        break;
      case 'time_based':
        current = userStats.time_spent || 0;
        break;
      case 'completion_rate':
        current = userStats.completion_rate || 0;
        break;
      case 'combination':
        // Para combinações, usar o valor principal como progresso
        current = userStats.count || userStats.main_metric || 0;
        break;
      default:
        return null;
    }

    const percentage = Math.min((current / required) * 100, 100);

    return {
      current,
      required,
      percentage
    };
  }, []);

  const markAchievementsAsSeen = useCallback(() => {
    setLastSeenAchievementsCount(unlockedAchievements.length);
    setNewAchievementsCount(0);
  }, [unlockedAchievements.length]);

  // Atualizar contador de novas conquistas
  useEffect(() => {
    if (enableNotifications && unlockedAchievements.length > lastSeenAchievementsCount) {
      setNewAchievementsCount(unlockedAchievements.length - lastSeenAchievementsCount);
    }
  }, [enableNotifications, unlockedAchievements.length, lastSeenAchievementsCount]);

  // Gerenciamento de erros
  useEffect(() => {
    const errors = [unlockedError, statsError].filter(Boolean);

    if (errors.length > 0) {
      setError('Erro ao carregar conquistas');
    } else {
      setError(null);
    }
  }, [unlockedError, statsError]);

  return {
    // Dados principais
    allAchievements,
    toolAchievements,
    unlockedAchievements,
    availableAchievements,
    secretAchievements,
    achievementStats,

    // Estados de carregamento
    isLoading,
    isLoadingStats,
    error,

    // Ações
    unlockAchievement,
    checkAndUnlockAchievements,
    refreshAchievements,

    // Utilitários
    getAchievementsByTool,
    getAchievementsByCategory,
    getAchievementsByDifficulty,
    isAchievementUnlocked,
    canUnlockAchievement,
    getProgressToAchievement,

    // Notificações
    newAchievementsCount,
    markAchievementsAsSeen
  };
}

export default useToolAchievements;
