import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rankingsService, type Competition, type LeaderboardEntry, type CompetitionParticipant } from '@/services/rankingsService';
import { useUserContext } from '@/hooks/useUserContext';
import { toast } from 'sonner';

export const useRankings = () => {
  const { user } = useUserContext();
  const queryClient = useQueryClient();

  // Query para ranking global
  const {
    data: globalRanking = [],
    isLoading: isLoadingGlobal,
    error: globalError,
    refetch: refetchGlobal
  } = useQuery({
    queryKey: ['rankings', 'global'],
    queryFn: () => rankingsService.getGlobalRanking(50),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false
  });

  // Query para ranking por categoria
  const getRankingByCategory = (category: Competition['category']) => {
    return useQuery({
      queryKey: ['rankings', 'category', category],
      queryFn: () => rankingsService.getCategoryRanking(category, 50),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      enabled: !!category
    });
  };

  // Query para posição do usuário
  const {
    data: userPosition,
    isLoading: isLoadingPosition,
    refetch: refetchPosition
  } = useQuery({
    queryKey: ['rankings', 'user-position', user?.id],
    queryFn: () => user?.id ? rankingsService.getUserRankPosition(user.id) : null,
    staleTime: 2 * 60 * 1000, // 2 minutos
    enabled: !!user?.id
  });

  // Query para competições ativas
  const {
    data: activeCompetitions = [],
    isLoading: isLoadingCompetitions,
    error: competitionsError,
    refetch: refetchCompetitions
  } = useQuery({
    queryKey: ['competitions', 'active'],
    queryFn: () => rankingsService.getActiveCompetitions(),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  });

  // Query para competições do usuário
  const {
    data: userCompetitions,
    isLoading: isLoadingUserCompetitions,
    refetch: refetchUserCompetitions
  } = useQuery({
    queryKey: ['competitions', 'user', user?.id],
    queryFn: () => user?.id ? rankingsService.getUserCompetitions(user.id) : { active: [], completed: [], upcoming: [] },
    staleTime: 5 * 60 * 1000,
    enabled: !!user?.id
  });

  // Query para participantes de uma competição
  const getCompetitionParticipants = (competitionId: string) => {
    return useQuery({
      queryKey: ['competitions', 'participants', competitionId],
      queryFn: () => rankingsService.getCompetitionParticipants(competitionId, 50),
      staleTime: 2 * 60 * 1000,
      enabled: !!competitionId
    });
  };

  // Query para estatísticas gerais
  const {
    data: rankingStats,
    isLoading: isLoadingStats,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['rankings', 'stats'],
    queryFn: () => rankingsService.getRankingStats(),
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000
  });

  // Mutation para participar de competição
  const joinCompetitionMutation = useMutation({
    mutationFn: ({ competitionId }: { competitionId: string }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      return rankingsService.joinCompetition(user.id, competitionId);
    },
    onSuccess: (success, { competitionId }) => {
      if (success) {
        toast.success('Você entrou na competição!', {
          description: 'Boa sorte! Acompanhe seu progresso no dashboard.'
        });
        
        // Invalidar queries relacionadas
        queryClient.invalidateQueries({ queryKey: ['competitions', 'active'] });
        queryClient.invalidateQueries({ queryKey: ['competitions', 'user', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['competitions', 'participants', competitionId] });
      } else {
        toast.error('Não foi possível entrar na competição', {
          description: 'Verifique se há vagas disponíveis ou se você já está participando.'
        });
      }
    },
    onError: (error) => {
      console.error('Erro ao entrar na competição:', error);
      toast.error('Erro ao entrar na competição', {
        description: 'Tente novamente em alguns instantes.'
      });
    }
  });

  // Mutation para atualizar pontuação
  const updateScoreMutation = useMutation({
    mutationFn: ({ 
      competitionId, 
      newScore 
    }: { 
      competitionId: string; 
      newScore: number; 
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      return rankingsService.updateParticipantScore(user.id, competitionId, newScore);
    },
    onSuccess: (success, { competitionId }) => {
      if (success) {
        // Invalidar queries relacionadas
        queryClient.invalidateQueries({ queryKey: ['competitions', 'participants', competitionId] });
        queryClient.invalidateQueries({ queryKey: ['rankings'] });
      }
    },
    onError: (error) => {
      console.error('Erro ao atualizar pontuação:', error);
    }
  });

  // Mutation para criar competição personalizada
  const createCompetitionMutation = useMutation({
    mutationFn: (competition: Omit<Competition, 'id' | 'currentParticipants' | 'createdBy'>) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      return rankingsService.createCustomCompetition(competition, user.id);
    },
    onSuccess: (competitionId) => {
      if (competitionId) {
        toast.success('Competição criada com sucesso!', {
          description: 'Sua competição personalizada está ativa.'
        });
        
        // Invalidar queries
        queryClient.invalidateQueries({ queryKey: ['competitions'] });
      } else {
        toast.error('Erro ao criar competição', {
          description: 'Tente novamente com dados diferentes.'
        });
      }
    },
    onError: (error) => {
      console.error('Erro ao criar competição:', error);
      toast.error('Erro ao criar competição', {
        description: 'Verifique os dados e tente novamente.'
      });
    }
  });

  // Função para obter posição do usuário em categoria específica
  const getUserCategoryPosition = async (category: Competition['category']) => {
    if (!user?.id) return null;
    return await rankingsService.getUserRankPosition(user.id, category);
  };

  // Função para refresh geral
  const refreshAllData = async () => {
    await Promise.all([
      refetchGlobal(),
      refetchPosition(),
      refetchCompetitions(),
      refetchUserCompetitions(),
      refetchStats()
    ]);
  };

  // Utilitários para análise de dados
  const getRankingAnalysis = () => {
    if (!globalRanking.length || !userPosition) return null;

    const userInTop10 = userPosition.rank <= 10;
    const userInTop50 = userPosition.rank <= 50;
    const userInTop100 = userPosition.rank <= 100;

    return {
      isTopPerformer: userInTop10,
      isHighRanked: userInTop50,
      isWellRanked: userInTop100,
      percentile: userPosition.percentile,
      rankImprovement: calculateRankImprovement(),
      competitiveLevel: getCompetitiveLevel()
    };
  };

  const calculateRankImprovement = () => {
    // Lógica para calcular melhoria de ranking
    // Baseado em dados históricos (implementar quando disponível)
    return 0;
  };

  const getCompetitiveLevel = () => {
    if (!userPosition) return 'iniciante';
    
    if (userPosition.percentile >= 95) return 'elite';
    if (userPosition.percentile >= 80) return 'avançado';
    if (userPosition.percentile >= 60) return 'intermediário';
    if (userPosition.percentile >= 40) return 'básico';
    return 'iniciante';
  };

  const getActiveCompetitionsForUser = () => {
    return activeCompetitions.filter(comp => {
      // Filtrar competições relevantes para o usuário
      const now = new Date();
      return comp.status === 'active' && 
             comp.startDate <= now && 
             comp.endDate >= now &&
             (!comp.maxParticipants || comp.currentParticipants < comp.maxParticipants);
    });
  };

  const getRecommendedCompetitions = () => {
    const userLevel = user?.level || 1;
    const activeComps = getActiveCompetitionsForUser();
    
    return activeComps.filter(comp => {
      // Recomendar baseado no nível e atividade do usuário
      if (comp.category === 'global') return userLevel >= 5;
      if (comp.type === 'tournament') return userLevel >= 3;
      if (comp.type === 'challenge') return userLevel >= 1;
      return true;
    }).slice(0, 3);
  };

  return {
    // Dados
    globalRanking,
    userPosition,
    activeCompetitions,
    userCompetitions,
    rankingStats,
    
    // Estados de carregamento
    isLoadingGlobal,
    isLoadingPosition,
    isLoadingCompetitions,
    isLoadingUserCompetitions,
    isLoadingStats,
    
    // Erros
    globalError,
    competitionsError,
    
    // Ações
    joinCompetition: joinCompetitionMutation.mutate,
    updateScore: updateScoreMutation.mutate,
    createCompetition: createCompetitionMutation.mutate,
    refreshAllData,
    
    // Estados das mutations
    isJoiningCompetition: joinCompetitionMutation.isPending,
    isUpdatingScore: updateScoreMutation.isPending,
    isCreatingCompetition: createCompetitionMutation.isPending,
    
    // Queries dinâmicas
    getRankingByCategory,
    getCompetitionParticipants,
    getUserCategoryPosition,
    
    // Utilitários
    getRankingAnalysis,
    getActiveCompetitionsForUser,
    getRecommendedCompetitions,
    
    // Refetch functions
    refetchGlobal,
    refetchPosition,
    refetchCompetitions,
    refetchUserCompetitions,
    refetchStats
  };
};

export default useRankings;
