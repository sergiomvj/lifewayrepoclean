import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  unifiedFlowService, 
  FlowStep, 
  UserFlowProgress 
} from '@/services/unifiedFlowService';
import { useUserContext } from './useUserContext';
// Router functionality for Vite/React (not Next.js)
// import { useNavigate } from 'react-router-dom';

interface UseUnifiedFlowOptions {
  autoInitialize?: boolean;
  trackAnalytics?: boolean;
  enableNotifications?: boolean;
}

interface UseUnifiedFlowReturn {
  // Estado do fluxo
  flowProgress: UserFlowProgress | null;
  currentStep: FlowStep;
  completedSteps: FlowStep[];
  completionPercentage: number;
  estimatedTimeRemaining: number;
  
  // Status de carregamento
  isLoading: boolean;
  isInitializing: boolean;
  isTransitioning: boolean;
  
  // Ações principais
  initializeFlow: () => Promise<void>;
  transitionToStep: (step: FlowStep, data?: any) => Promise<void>;
  updateStepData: (step: FlowStep, data: any) => Promise<void>;
  markActionCompleted: (action: string) => Promise<void>;
  
  // Navegação inteligente
  canTransitionTo: (step: FlowStep) => Promise<{
    canTransition: boolean;
    missingRequirements: string[];
    nextActions: string[];
  }>;
  getNextRecommendedActions: () => Promise<{
    currentStep: FlowStep;
    nextStep?: FlowStep;
    recommendedActions: string[];
    blockers: string[];
  }>;
  
  // Navegação automática
  navigateToCurrentStep: () => void;
  navigateToNextStep: () => Promise<void>;
  
  // Utilitários
  resetFlow: () => Promise<void>;
  getFlowAnalytics: () => Promise<any>;
  
  // Estado de erro
  error: string | null;
  clearError: () => void;
}

export function useUnifiedFlow(options: UseUnifiedFlowOptions = {}): UseUnifiedFlowReturn {
  const {
    autoInitialize = true,
    trackAnalytics = true,
    enableNotifications = true
  } = options;
  
  const { userContext } = useUserContext();
  // const router = useRouter(); // Disabled for Vite project
  const queryClient = useQueryClient();
  
  // Estados locais
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Query para buscar progresso do fluxo
  const {
    data: flowProgress,
    isLoading,
    refetch: refetchProgress
  } = useQuery({
    queryKey: ['user-flow-progress', userContext?.user_id],
    queryFn: async () => {
      if (!userContext?.user_id) return null;
      return unifiedFlowService.getUserFlowProgress(userContext.user_id);
    },
    enabled: !!userContext?.user_id,
    staleTime: 30000, // 30 segundos
    refetchOnWindowFocus: true
  });

  // Mutation para inicializar fluxo
  const initializeFlowMutation = useMutation({
    mutationFn: async () => {
      if (!userContext?.user_id) {
        throw new Error('Usuário não autenticado');
      }
      return unifiedFlowService.initializeUserFlow(userContext.user_id);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user-flow-progress', userContext?.user_id], data);
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  // Mutation para transição de passos
  const transitionMutation = useMutation({
    mutationFn: async ({ step, data }: { step: FlowStep; data?: any }) => {
      if (!userContext?.user_id) {
        throw new Error('Usuário não autenticado');
      }
      return unifiedFlowService.transitionToStep(userContext.user_id, step, data);
    },
    onMutate: () => {
      setIsTransitioning(true);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user-flow-progress', userContext?.user_id], data);
      setError(null);
      
      // Navegar automaticamente para a nova etapa
      if (options.autoInitialize) {
        navigateToStep(data.current_step);
      }
    },
    onError: (error: Error) => {
      setError(error.message);
    },
    onSettled: () => {
      setIsTransitioning(false);
    }
  });

  // Mutation para atualizar dados do passo
  const updateStepMutation = useMutation({
    mutationFn: async ({ step, data }: { step: FlowStep; data: any }) => {
      if (!userContext?.user_id) {
        throw new Error('Usuário não autenticado');
      }
      await unifiedFlowService.updateStepData(userContext.user_id, step, data);
    },
    onSuccess: () => {
      refetchProgress();
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  // Mutation para marcar ação como completada
  const markActionMutation = useMutation({
    mutationFn: async (action: string) => {
      if (!userContext?.user_id) {
        throw new Error('Usuário não autenticado');
      }
      await unifiedFlowService.markActionCompleted(userContext.user_id, action);
    },
    onSuccess: () => {
      refetchProgress();
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  // Auto-inicializar fluxo se necessário
  useEffect(() => {
    if (autoInitialize && userContext?.user_id && !flowProgress && !isLoading) {
      initializeFlowMutation.mutate();
    }
  }, [autoInitialize, userContext?.user_id, flowProgress, isLoading]);

  // Mapear rotas para passos do fluxo
  const getRouteForStep = useCallback((step: FlowStep): string => {
    const stepRoutes: Record<FlowStep, string> = {
      'dreams_start': '/dreams',
      'dreams_completion': '/dreams',
      'pdf_generation': '/dreams/pdf',
      'visamatch_analysis': '/visamatch',
      'specialist_consultation': '/especialista',
      'action_plan_creation': '/dashboard/action-plan',
      'journey_completed': '/dashboard/completed'
    };
    
    return stepRoutes[step] || '/dashboard';
  }, []);

  // Navegar para um passo específico
  const navigateToStep = useCallback((step: FlowStep) => {
    const route = getRouteForStep(step);
    // router.push(route); // Disabled for Vite project
    console.log('Navigate to:', route);
  }, [getRouteForStep]);

  // Ações expostas
  const initializeFlow = useCallback(async () => {
    await initializeFlowMutation.mutateAsync();
  }, [initializeFlowMutation]);

  const transitionToStep = useCallback(async (step: FlowStep, data?: any) => {
    await transitionMutation.mutateAsync({ step, data });
  }, [transitionMutation]);

  const updateStepData = useCallback(async (step: FlowStep, data: any) => {
    await updateStepMutation.mutateAsync({ step, data });
  }, [updateStepMutation]);

  const markActionCompleted = useCallback(async (action: string) => {
    await markActionMutation.mutateAsync(action);
  }, [markActionMutation]);

  const canTransitionTo = useCallback(async (step: FlowStep) => {
    if (!userContext?.user_id) {
      return {
        canTransition: false,
        missingRequirements: ['User not authenticated'],
        nextActions: ['Please login']
      };
    }
    
    return unifiedFlowService.canTransition(userContext.user_id, step);
  }, [userContext?.user_id]);

  const getNextRecommendedActions = useCallback(async () => {
    if (!userContext?.user_id) {
      return {
        currentStep: 'dreams_start' as FlowStep,
        recommendedActions: ['Please login'],
        blockers: ['User not authenticated']
      };
    }
    
    return unifiedFlowService.getNextRecommendedActions(userContext.user_id);
  }, [userContext?.user_id]);

  const navigateToCurrentStep = useCallback(() => {
    if (flowProgress) {
      navigateToStep(flowProgress.current_step);
    }
  }, [flowProgress, navigateToStep]);

  const navigateToNextStep = useCallback(async () => {
    const recommendations = await getNextRecommendedActions();
    if (recommendations.nextStep) {
      const canTransition = await canTransitionTo(recommendations.nextStep);
      if (canTransition.canTransition) {
        await transitionToStep(recommendations.nextStep);
      } else {
        setError(`Cannot proceed: ${canTransition.missingRequirements.join(', ')}`);
      }
    }
  }, [getNextRecommendedActions, canTransitionTo, transitionToStep]);

  const resetFlow = useCallback(async () => {
    if (!userContext?.user_id) return;
    
    try {
      const newFlow = await unifiedFlowService.resetUserFlow(userContext.user_id);
      queryClient.setQueryData(['user-flow-progress', userContext.user_id], newFlow);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to reset flow');
    }
  }, [userContext?.user_id, queryClient]);

  const getFlowAnalytics = useCallback(async () => {
    if (!userContext?.user_id) return null;
    
    try {
      return await unifiedFlowService.getFlowAnalytics(userContext.user_id);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get analytics');
      return null;
    }
  }, [userContext?.user_id]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Valores derivados
  const currentStep = flowProgress?.current_step || 'dreams_start';
  const completedSteps = flowProgress?.completed_steps || [];
  const completionPercentage = flowProgress?.flow_metadata.completion_percentage || 0;
  const estimatedTimeRemaining = flowProgress?.flow_metadata.estimated_time_remaining || 45;

  return {
    // Estado do fluxo
    flowProgress,
    currentStep,
    completedSteps,
    completionPercentage,
    estimatedTimeRemaining,
    
    // Status de carregamento
    isLoading,
    isInitializing: initializeFlowMutation.isPending,
    isTransitioning,
    
    // Ações principais
    initializeFlow,
    transitionToStep,
    updateStepData,
    markActionCompleted,
    
    // Navegação inteligente
    canTransitionTo,
    getNextRecommendedActions,
    
    // Navegação automática
    navigateToCurrentStep,
    navigateToNextStep,
    
    // Utilitários
    resetFlow,
    getFlowAnalytics,
    
    // Estado de erro
    error,
    clearError
  };
}

// Hook específico para componentes de passo
export function useFlowStep(stepName: FlowStep) {
  const flow = useUnifiedFlow();
  
  const isCurrentStep = flow.currentStep === stepName;
  const isCompleted = flow.completedSteps.includes(stepName);
  const isAccessible = flow.completedSteps.includes(stepName) || flow.currentStep === stepName;
  
  const completeStep = useCallback(async (data?: any) => {
    if (!isCurrentStep) return;
    
    // Marcar ações como completadas baseado no tipo de passo
    const stepActions: Record<FlowStep, string[]> = {
      'dreams_start': ['form_started'],
      'dreams_completion': ['form_submitted'],
      'pdf_generation': ['pdf_downloaded'],
      'visamatch_analysis': ['analysis_completed'],
      'specialist_consultation': ['consultation_completed'],
      'action_plan_creation': ['plan_reviewed'],
      'journey_completed': ['journey_finished']
    };
    
    const actions = stepActions[stepName] || [];
    for (const action of actions) {
      await flow.markActionCompleted(action);
    }
    
    // Atualizar dados do passo se fornecidos
    if (data) {
      await flow.updateStepData(stepName, data);
    }
  }, [isCurrentStep, stepName, flow]);
  
  return {
    ...flow,
    isCurrentStep,
    isCompleted,
    isAccessible,
    completeStep
  };
}

// Hook para navegação contextual
export function useFlowNavigation() {
  const flow = useUnifiedFlow();
  // const router = useRouter(); // Disabled for Vite project
  
  const navigateWithFlow = useCallback(async (targetRoute: string) => {
    // Determinar se a rota corresponde a um passo do fluxo
    const routeStepMap: Record<string, FlowStep> = {
      '/dreams': 'dreams_start',
      '/dreams/pdf': 'pdf_generation',
      '/visamatch': 'visamatch_analysis',
      '/especialista': 'specialist_consultation',
      '/dashboard/action-plan': 'action_plan_creation',
      '/dashboard/completed': 'journey_completed'
    };
    
    const targetStep = routeStepMap[targetRoute];
    
    if (targetStep) {
      // Verificar se pode acessar o passo
      const canTransition = await flow.canTransitionTo(targetStep);
      
      if (canTransition.canTransition || flow.completedSteps.includes(targetStep)) {
        // router.push(targetRoute); // Disabled for Vite project
        console.log('Navigate to:', targetRoute);
      } else {
        // Redirecionar para o passo atual com mensagem de erro
        flow.navigateToCurrentStep();
        return {
          success: false,
          message: `Cannot access ${targetStep}: ${canTransition.missingRequirements.join(', ')}`,
          suggestions: canTransition.nextActions
        };
      }
    } else {
      // Navegação normal para rotas que não fazem parte do fluxo
      // router.push(targetRoute); // Disabled for Vite project
      console.log('Navigate to:', targetRoute);
    }
    
    return { success: true };
  }, [flow]);
  
  return {
    navigateWithFlow,
    currentStep: flow.currentStep,
    canAccessStep: flow.canTransitionTo
  };
}
