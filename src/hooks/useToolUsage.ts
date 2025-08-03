import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toolUsageService, ToolUsage, ToolUsageStats } from '@/services/toolUsageService';
import { useUserContext } from './useUserContext';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

export const useToolUsage = () => {
  const { user } = useUserContext();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Get current user from Supabase auth
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para obter todas as ferramentas do usuário
  const {
    data: allTools = [],
    isLoading: isLoadingTools,
    error: toolsError
  } = useQuery({
    queryKey: ['toolUsage', currentUser?.id],
    queryFn: () => toolUsageService.getUserToolUsage(currentUser!.id),
    enabled: !!currentUser?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false
  });

  // Query para ferramentas utilizadas
  const {
    data: usedTools = [],
    isLoading: isLoadingUsed
  } = useQuery({
    queryKey: ['usedTools', currentUser?.id],
    queryFn: () => toolUsageService.getUsedTools(currentUser!.id),
    enabled: !!currentUser?.id,
    staleTime: 5 * 60 * 1000
  });

  // Query para ferramentas não utilizadas
  const {
    data: unusedTools = [],
    isLoading: isLoadingUnused
  } = useQuery({
    queryKey: ['unusedTools', currentUser?.id],
    queryFn: () => toolUsageService.getUnusedTools(currentUser!.id),
    enabled: !!currentUser?.id,
    staleTime: 5 * 60 * 1000
  });

  // Query para estatísticas do usuário
  const {
    data: userStats,
    isLoading: isLoadingStats
  } = useQuery({
    queryKey: ['userStats', currentUser?.id],
    queryFn: () => toolUsageService.getUserStats(currentUser!.id),
    enabled: !!currentUser?.id,
    staleTime: 5 * 60 * 1000
  });

  // Mutation para rastrear uso de ferramenta
  const trackUsageMutation = useMutation({
    mutationFn: ({ 
      toolName, 
      timeSpent = 0, 
      additionalData = {} 
    }: { 
      toolName: string; 
      timeSpent?: number; 
      additionalData?: any; 
    }) => {
      if (!currentUser?.id) throw new Error('User not authenticated');
      return toolUsageService.trackToolUsage(currentUser.id, toolName, timeSpent, additionalData);
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['toolUsage', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['usedTools', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['unusedTools', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['userStats', currentUser?.id] });
    },
    onError: (error) => {
      console.error('Error tracking tool usage:', error);
      toast({
        title: "Erro ao registrar uso",
        description: "Não foi possível registrar o uso da ferramenta.",
        variant: "destructive"
      });
    }
  });

  // Mutation para marcar ferramenta como completa
  const markCompletedMutation = useMutation({
    mutationFn: ({ 
      toolName, 
      completionPercentage = 100 
    }: { 
      toolName: string; 
      completionPercentage?: number; 
    }) => {
      if (!currentUser?.id) throw new Error('User not authenticated');
      return toolUsageService.markToolCompleted(currentUser.id, toolName, completionPercentage);
    },
    onSuccess: (_, { toolName }) => {
      queryClient.invalidateQueries({ queryKey: ['toolUsage', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['userStats', currentUser?.id] });
      
      toast({
        title: "Ferramenta concluída! 🎉",
        description: `Parabéns por completar a ferramenta!`,
        variant: "default"
      });
    },
    onError: (error) => {
      console.error('Error marking tool as completed:', error);
      toast({
        title: "Erro ao marcar como concluída",
        description: "Não foi possível atualizar o status da ferramenta.",
        variant: "destructive"
      });
    }
  });

  // Mutation para registrar resultado gerado
  const trackResultMutation = useMutation({
    mutationFn: (toolName: string) => {
      if (!currentUser?.id) throw new Error('User not authenticated');
      return toolUsageService.trackResultGenerated(currentUser.id, toolName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toolUsage', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['userStats', currentUser?.id] });
    },
    onError: (error) => {
      console.error('Error tracking result generated:', error);
    }
  });

  // Mutation para inicializar ferramentas do usuário
  const initializeToolsMutation = useMutation({
    mutationFn: () => {
      if (!currentUser?.id) throw new Error('User not authenticated');
      return toolUsageService.initializeUserTools(currentUser.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toolUsage', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['unusedTools', currentUser?.id] });
    },
    onError: (error) => {
      console.error('Error initializing user tools:', error);
    }
  });

  // Funções de conveniência
  const trackToolUsage = (toolName: string, timeSpent?: number, additionalData?: any) => {
    trackUsageMutation.mutate({ toolName, timeSpent, additionalData });
  };

  const markToolCompleted = (toolName: string, completionPercentage?: number) => {
    markCompletedMutation.mutate({ toolName, completionPercentage });
  };

  const trackResultGenerated = (toolName: string) => {
    trackResultMutation.mutate(toolName);
  };

  const initializeTools = () => {
    initializeToolsMutation.mutate();
  };

  // Utilitários
  const getToolByName = (toolName: string): ToolUsage | undefined => {
    return allTools.find(tool => tool.tool_name === toolName);
  };

  const getToolProgress = (toolName: string): number => {
    const tool = getToolByName(toolName);
    return tool?.completion_percentage || 0;
  };

  const getToolUsageCount = (toolName: string): number => {
    const tool = getToolByName(toolName);
    return tool?.usage_count || 0;
  };

  const isToolUsed = (toolName: string): boolean => {
    return getToolUsageCount(toolName) > 0;
  };

  const isToolCompleted = (toolName: string): boolean => {
    const tool = getToolByName(toolName);
    return tool?.status === 'completed';
  };

  // Categorizar ferramentas
  const categorizedTools = {
    used: usedTools,
    unused: unusedTools,
    completed: allTools.filter(tool => tool.status === 'completed'),
    inProgress: allTools.filter(tool => tool.status === 'in_progress'),
    notStarted: allTools.filter(tool => tool.status === 'not_started')
  };

  return {
    // Dados
    allTools,
    usedTools,
    unusedTools,
    userStats,
    categorizedTools,

    // Estados de loading
    isLoading: isLoadingTools || isLoadingUsed || isLoadingUnused || isLoadingStats,
    isLoadingTools,
    isLoadingUsed,
    isLoadingUnused,
    isLoadingStats,

    // Erros
    error: toolsError,

    // Ações
    trackToolUsage,
    markToolCompleted,
    trackResultGenerated,
    initializeTools,

    // Estados das mutations
    isTrackingUsage: trackUsageMutation.isPending,
    isMarkingCompleted: markCompletedMutation.isPending,
    isTrackingResult: trackResultMutation.isPending,
    isInitializing: initializeToolsMutation.isPending,

    // Utilitários
    getToolByName,
    getToolProgress,
    getToolUsageCount,
    isToolUsed,
    isToolCompleted,

    // Refresh
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['toolUsage', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['usedTools', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['unusedTools', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['userStats', currentUser?.id] });
    }
  };
};
