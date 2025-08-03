import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rewardsService, Reward, UserReward, LevelBenefit } from '@/services/rewardsService';
import { useUserContext } from './useUserContext';
import { useGamification } from './useGamification';

interface UseRewardsOptions {
  enableAutoUnlock?: boolean;
  enableNotifications?: boolean;
  refreshInterval?: number;
}

interface UseRewardsReturn {
  // Dados principais
  userRewards: UserReward[];
  currentLevelBenefits: LevelBenefit | null;
  nextLevelBenefits: LevelBenefit | null;
  allBenefitsUpToLevel: LevelBenefit[];
  rewardsStats: {
    totalUnlocked: number;
    totalUsed: number;
    availableRewards: number;
    rareRewards: number;
    epicRewards: number;
    legendaryRewards: number;
  };

  // Estados de carregamento
  isLoading: boolean;
  isLoadingRewards: boolean;
  isLoadingBenefits: boolean;
  error: string | null;

  // Ações
  unlockRewardsForLevel: (level: number) => Promise<UserReward[]>;
  useReward: (rewardId: string) => Promise<boolean>;
  refreshRewards: () => void;
  checkFeatureAccess: (featureValue: string) => Promise<boolean>;

  // Utilitários
  getRewardsByRarity: (rarity: Reward['rarity']) => UserReward[];
  getUnusedRewards: () => UserReward[];
  getRecentRewards: (days?: number) => UserReward[];
  hasUnlockedReward: (rewardId: string) => boolean;
  canUnlockNextLevel: () => boolean;
  getProgressToNextReward: () => {
    nextLevel: number;
    currentProgress: number;
    requiredProgress: number;
    progressPercentage: number;
  } | null;

  // Notificações
  newRewardsCount: number;
  markRewardsAsSeen: () => void;
}

export function useRewards(options: UseRewardsOptions = {}): UseRewardsReturn {
  const {
    enableAutoUnlock = true,
    enableNotifications = true,
    refreshInterval = 30000 // 30 segundos
  } = options;

  const { context: userContext } = useUserContext();
  const { stats: userStats, currentLevel } = useGamification();
  const queryClient = useQueryClient();

  const [error, setError] = useState<string | null>(null);
  const [newRewardsCount, setNewRewardsCount] = useState(0);
  const [lastSeenRewardsCount, setLastSeenRewardsCount] = useState(0);

  const userId = userContext?.profile?.id;
  const level = typeof currentLevel === 'object' ? currentLevel.level : currentLevel;

  // Query para recompensas do usuário
  const {
    data: userRewards = [],
    isLoading: isLoadingRewards,
    error: rewardsError,
    refetch: refetchRewards
  } = useQuery({
    queryKey: ['user-rewards', userId],
    queryFn: () => rewardsService.getUserRewards(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,
    refetchInterval: enableNotifications ? refreshInterval : false,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Query para benefícios do nível atual
  const {
    data: currentLevelBenefits,
    isLoading: isLoadingCurrentBenefits,
    error: currentBenefitsError
  } = useQuery({
    queryKey: ['level-benefits', level],
    queryFn: () => rewardsService.getLevelBenefits(level),
    enabled: level > 0,
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Query para benefícios do próximo nível
  const {
    data: nextLevelBenefits,
    isLoading: isLoadingNextBenefits,
    error: nextBenefitsError
  } = useQuery({
    queryKey: ['next-level-benefits', level],
    queryFn: () => rewardsService.getNextLevelBenefits(level),
    enabled: level > 0,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Query para todos os benefícios até o nível atual
  const {
    data: allBenefitsUpToLevel = [],
    isLoading: isLoadingAllBenefits,
    error: allBenefitsError
  } = useQuery({
    queryKey: ['all-benefits-up-to-level', level],
    queryFn: () => rewardsService.getBenefitsUpToLevel(level),
    enabled: level > 0,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Query para estatísticas de recompensas
  const {
    data: rewardsStats = {
      totalUnlocked: 0,
      totalUsed: 0,
      availableRewards: 0,
      rareRewards: 0,
      epicRewards: 0,
      legendaryRewards: 0
    },
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery({
    queryKey: ['rewards-stats', userId],
    queryFn: () => rewardsService.getRewardsStats(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Mutation para desbloquear recompensas
  const unlockRewardsMutation = useMutation({
    mutationFn: ({ userId, level }: { userId: string; level: number }) =>
      rewardsService.unlockRewardsForLevel(userId, level),
    onSuccess: (newRewards) => {
      queryClient.invalidateQueries({ queryKey: ['user-rewards', userId] });
      queryClient.invalidateQueries({ queryKey: ['rewards-stats', userId] });
      
      if (enableNotifications && newRewards.length > 0) {
        setNewRewardsCount(prev => prev + newRewards.length);
      }
    },
    onError: (error) => {
      console.error('Erro ao desbloquear recompensas:', error);
      setError('Erro ao desbloquear recompensas');
    }
  });

  // Mutation para usar recompensa
  const useRewardMutation = useMutation({
    mutationFn: ({ userId, rewardId }: { userId: string; rewardId: string }) =>
      rewardsService.useReward(userId, rewardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-rewards', userId] });
      queryClient.invalidateQueries({ queryKey: ['rewards-stats', userId] });
    },
    onError: (error) => {
      console.error('Erro ao usar recompensa:', error);
      setError('Erro ao usar recompensa');
    }
  });

  // Estados derivados
  const isLoadingBenefits = isLoadingCurrentBenefits || isLoadingNextBenefits || isLoadingAllBenefits;
  const isLoading = isLoadingRewards || isLoadingBenefits || isLoadingStats;

  // Ações
  const unlockRewardsForLevel = useCallback(async (targetLevel: number): Promise<UserReward[]> => {
    if (!userId) return [];
    
    try {
      const result = await unlockRewardsMutation.mutateAsync({ userId, level: targetLevel });
      return result;
    } catch (error) {
      console.error('Erro ao desbloquear recompensas:', error);
      return [];
    }
  }, [userId, unlockRewardsMutation]);

  const useReward = useCallback(async (rewardId: string): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      const result = await useRewardMutation.mutateAsync({ userId, rewardId });
      return result;
    } catch (error) {
      console.error('Erro ao usar recompensa:', error);
      return false;
    }
  }, [userId, useRewardMutation]);

  const refreshRewards = useCallback(() => {
    refetchRewards();
    queryClient.invalidateQueries({ queryKey: ['rewards-stats', userId] });
  }, [refetchRewards, queryClient, userId]);

  const checkFeatureAccess = useCallback(async (featureValue: string): Promise<boolean> => {
    if (!userId) return false;
    return rewardsService.hasFeatureAccess(userId, featureValue);
  }, [userId]);

  // Utilitários
  const getRewardsByRarity = useCallback((rarity: Reward['rarity']) => {
    return userRewards.filter(ur => ur.reward.rarity === rarity);
  }, [userRewards]);

  const getUnusedRewards = useCallback(() => {
    return userRewards.filter(ur => !ur.isUsed);
  }, [userRewards]);

  const getRecentRewards = useCallback((days: number = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return userRewards.filter(ur => ur.unlockedAt >= cutoffDate);
  }, [userRewards]);

  const hasUnlockedReward = useCallback((rewardId: string) => {
    return userRewards.some(ur => ur.rewardId === rewardId);
  }, [userRewards]);

  const canUnlockNextLevel = useCallback(() => {
    if (!nextLevelBenefits || !userStats) return false;
    return level >= nextLevelBenefits.level;
  }, [nextLevelBenefits, userStats, level]);

  const getProgressToNextReward = useCallback(() => {
    if (!nextLevelBenefits || !userStats) return null;

    const nextLevel = nextLevelBenefits.level;
    const currentProgress = userStats.total_points || 0;
    const requiredProgress = nextLevel * 1000; // Assumindo 1000 pontos por nível
    const progressPercentage = Math.min((currentProgress / requiredProgress) * 100, 100);

    return {
      nextLevel,
      currentProgress,
      requiredProgress,
      progressPercentage
    };
  }, [nextLevelBenefits, userStats]);

  const markRewardsAsSeen = useCallback(() => {
    setLastSeenRewardsCount(userRewards.length);
    setNewRewardsCount(0);
  }, [userRewards.length]);

  // Auto-desbloqueio de recompensas quando o nível aumenta
  useEffect(() => {
    if (enableAutoUnlock && userId && level > 0 && currentLevelBenefits) {
      const hasCurrentLevelRewards = userRewards.some(ur => 
        currentLevelBenefits.rewards.some(r => r.id === ur.rewardId)
      );

      if (!hasCurrentLevelRewards) {
        unlockRewardsForLevel(level);
      }
    }
  }, [enableAutoUnlock, userId, level, currentLevelBenefits, userRewards, unlockRewardsForLevel]);

  // Atualizar contador de novas recompensas
  useEffect(() => {
    if (enableNotifications && userRewards.length > lastSeenRewardsCount) {
      setNewRewardsCount(userRewards.length - lastSeenRewardsCount);
    }
  }, [enableNotifications, userRewards.length, lastSeenRewardsCount]);

  // Gerenciamento de erros
  useEffect(() => {
    const errors = [
      rewardsError,
      currentBenefitsError,
      nextBenefitsError,
      allBenefitsError,
      statsError
    ].filter(Boolean);

    if (errors.length > 0) {
      setError('Erro ao carregar dados de recompensas');
    } else {
      setError(null);
    }
  }, [rewardsError, currentBenefitsError, nextBenefitsError, allBenefitsError, statsError]);

  return {
    // Dados principais
    userRewards,
    currentLevelBenefits,
    nextLevelBenefits,
    allBenefitsUpToLevel,
    rewardsStats,

    // Estados de carregamento
    isLoading,
    isLoadingRewards,
    isLoadingBenefits,
    error,

    // Ações
    unlockRewardsForLevel,
    useReward,
    refreshRewards,
    checkFeatureAccess,

    // Utilitários
    getRewardsByRarity,
    getUnusedRewards,
    getRecentRewards,
    hasUnlockedReward,
    canUnlockNextLevel,
    getProgressToNextReward,

    // Notificações
    newRewardsCount,
    markRewardsAsSeen
  };
}

export default useRewards;
