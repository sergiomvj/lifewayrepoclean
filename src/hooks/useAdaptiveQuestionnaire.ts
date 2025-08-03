import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  adaptiveQuestionnaireService, 
  QuestionDefinition, 
  FormData, 
  ValidationResult,
  QuestionnaireFlow
} from '@/services/adaptiveQuestionnaireService';
import { useUserContext } from './useUserContext';
import { useUnifiedFlow } from './useUnifiedFlow';
import { useDataSync } from './useDataSync';

interface UseAdaptiveQuestionnaireOptions {
  flowId: string;
  autoSave?: boolean;
  saveInterval?: number;
  enableAnalytics?: boolean;
  personalizeQuestions?: boolean;
}

interface UseAdaptiveQuestionnaireReturn {
  // Estado do questionário
  questions: QuestionDefinition[];
  currentAnswers: FormData;
  progress: number;
  estimatedTimeRemaining: number;
  suggestions: string[];
  
  // Estado de carregamento
  isLoading: boolean;
  isSaving: boolean;
  isValidating: boolean;
  
  // Ações principais
  updateAnswer: (questionId: string, value: any) => Promise<void>;
  validateAnswer: (questionId: string, value: any) => Promise<ValidationResult>;
  submitQuestionnaire: () => Promise<void>;
  resetQuestionnaire: () => Promise<void>;
  
  // Navegação
  goToQuestion: (questionId: string) => void;
  getNextQuestion: () => QuestionDefinition | null;
  getPreviousQuestion: () => QuestionDefinition | null;
  
  // Validação e estado
  validationResults: Record<string, ValidationResult>;
  isQuestionValid: (questionId: string) => boolean;
  isQuestionnaireComplete: boolean;
  canSubmit: boolean;
  
  // Utilitários
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
  clearErrors: () => void;
  
  // Estado de erro
  error: string | null;
  fieldErrors: Record<string, string[]>;
}

export function useAdaptiveQuestionnaire(
  options: UseAdaptiveQuestionnaireOptions
): UseAdaptiveQuestionnaireReturn {
  const {
    flowId,
    autoSave = true,
    saveInterval = 30000, // 30 segundos
    enableAnalytics = true,
    personalizeQuestions = true
  } = options;
  
  const { userContext } = useUserContext();
  const { updateStepData, markActionCompleted } = useUnifiedFlow();
  const { syncDreamsData } = useDataSync();
  const queryClient = useQueryClient();
  
  // Estados locais
  const [currentAnswers, setCurrentAnswers] = useState<FormData>({});
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({});
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isValidating, setIsValidating] = useState(false);

  // Query para carregar progresso salvo
  const {
    data: savedProgress,
    isLoading: isLoadingProgress
  } = useQuery({
    queryKey: ['questionnaire-progress', userContext?.user_id, flowId],
    queryFn: async () => {
      if (!userContext?.user_id) return null;
      return adaptiveQuestionnaireService.loadProgress(userContext.user_id, flowId);
    },
    enabled: !!userContext?.user_id,
    staleTime: 5 * 60 * 1000 // 5 minutos
  });

  // Query para obter perguntas adaptativas
  const {
    data: questionnaireData,
    isLoading: isLoadingQuestions,
    refetch: refetchQuestions
  } = useQuery({
    queryKey: ['adaptive-questions', flowId, currentAnswers, userContext?.profile],
    queryFn: async () => {
      const userProfile = personalizeQuestions ? userContext?.profile : undefined;
      return adaptiveQuestionnaireService.getNextQuestions(
        flowId,
        currentAnswers,
        userProfile
      );
    },
    enabled: !!flowId,
    staleTime: 30000 // 30 segundos
  });

  // Mutation para salvar progresso
  const saveProgressMutation = useMutation({
    mutationFn: async (answers: FormData) => {
      if (!userContext?.user_id) {
        throw new Error('Usuário não autenticado');
      }
      
      return adaptiveQuestionnaireService.saveProgress(
        userContext.user_id,
        flowId,
        answers,
        {
          completion_time: Date.now(),
          user_agent: navigator.userAgent,
          current_question_index: currentQuestionIndex
        }
      );
    },
    onSuccess: () => {
      setError(null);
      
      // Invalidar cache de progresso
      queryClient.invalidateQueries({
        queryKey: ['questionnaire-progress', userContext?.user_id, flowId]
      });
    },
    onError: (error: Error) => {
      setError(`Erro ao salvar progresso: ${error.message}`);
    }
  });

  // Mutation para validar resposta
  const validateAnswerMutation = useMutation({
    mutationFn: async ({ questionId, value }: { questionId: string; value: any }) => {
      return adaptiveQuestionnaireService.validateAnswer(
        questionId,
        value,
        currentAnswers,
        flowId
      );
    },
    onMutate: () => {
      setIsValidating(true);
    },
    onSuccess: (result, { questionId }) => {
      setValidationResults(prev => ({
        ...prev,
        [questionId]: result
      }));
      setError(null);
    },
    onError: (error: Error, { questionId }) => {
      setValidationResults(prev => ({
        ...prev,
        [questionId]: {
          isValid: false,
          errors: [error.message],
          warnings: [],
          suggestions: []
        }
      }));
    },
    onSettled: () => {
      setIsValidating(false);
    }
  });

  // Mutation para submeter questionário
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!userContext?.user_id) {
        throw new Error('Usuário não autenticado');
      }

      // Validar todas as respostas obrigatórias
      const requiredQuestions = questions.filter(q => q.required);
      const missingAnswers = requiredQuestions.filter(q => !currentAnswers[q.id]);
      
      if (missingAnswers.length > 0) {
        throw new Error(`Perguntas obrigatórias não respondidas: ${missingAnswers.map(q => q.title).join(', ')}`);
      }

      // Salvar progresso final
      await adaptiveQuestionnaireService.saveProgress(
        userContext.user_id,
        flowId,
        currentAnswers,
        {
          completed: true,
          completion_time: Date.now(),
          final_submission: true
        }
      );

      return currentAnswers;
    },
    onSuccess: async (finalAnswers) => {
      // Marcar como completado no fluxo unificado
      await markActionCompleted(`questionnaire_${flowId}_completed`);
      
      // Atualizar dados do passo no fluxo
      await updateStepData('dreams_completion', {
        questionnaire_answers: finalAnswers,
        completion_date: new Date().toISOString()
      });

      // Sincronizar dados se for o questionário de Dreams
      if (flowId === 'dreams_adaptive') {
        await syncDreamsData({
          questionnaire_data: finalAnswers,
          is_completed: true,
          completion_date: new Date().toISOString()
        });
      }

      setError(null);
    },
    onError: (error: Error) => {
      setError(`Erro ao submeter questionário: ${error.message}`);
    }
  });

  // Carregar progresso salvo ao inicializar
  useEffect(() => {
    if (savedProgress && Object.keys(savedProgress).length > 0) {
      setCurrentAnswers(savedProgress);
    }
  }, [savedProgress]);

  // Auto-save periódico
  useEffect(() => {
    if (!autoSave || Object.keys(currentAnswers).length === 0) return;

    const interval = setInterval(() => {
      if (!saveProgressMutation.isPending) {
        saveProgressMutation.mutate(currentAnswers);
      }
    }, saveInterval);

    return () => clearInterval(interval);
  }, [autoSave, saveInterval, currentAnswers, saveProgressMutation]);

  // Analytics de tempo gasto por pergunta
  useEffect(() => {
    if (!enableAnalytics) return;

    const startTime = Date.now();
    
    return () => {
      const timeSpent = Date.now() - startTime;
      // Registrar tempo gasto na pergunta atual
      console.log(`Time spent on question ${currentQuestionIndex}: ${timeSpent}ms`);
    };
  }, [currentQuestionIndex, enableAnalytics]);

  // Ações expostas
  const updateAnswer = useCallback(async (questionId: string, value: any) => {
    try {
      // Atualizar resposta localmente
      const newAnswers = { ...currentAnswers, [questionId]: value };
      setCurrentAnswers(newAnswers);

      // Validar resposta
      const validationResult = await validateAnswerMutation.mutateAsync({ questionId, value });
      
      // Auto-save se habilitado
      if (autoSave && validationResult.isValid) {
        await saveProgressMutation.mutateAsync(newAnswers);
      }

      // Refetch questions para aplicar lógica condicional
      refetchQuestions();
    } catch (error) {
      console.error('Erro ao atualizar resposta:', error);
    }
  }, [currentAnswers, validateAnswerMutation, saveProgressMutation, autoSave, refetchQuestions]);

  const validateAnswer = useCallback(async (questionId: string, value: any): Promise<ValidationResult> => {
    return validateAnswerMutation.mutateAsync({ questionId, value });
  }, [validateAnswerMutation]);

  const submitQuestionnaire = useCallback(async () => {
    await submitMutation.mutateAsync();
  }, [submitMutation]);

  const resetQuestionnaire = useCallback(async () => {
    setCurrentAnswers({});
    setValidationResults({});
    setCurrentQuestionIndex(0);
    setError(null);
    
    // Limpar progresso salvo
    if (userContext?.user_id) {
      await adaptiveQuestionnaireService.saveProgress(
        userContext.user_id,
        flowId,
        {},
        { reset: true }
      );
    }
  }, [userContext?.user_id, flowId]);

  const goToQuestion = useCallback((questionId: string) => {
    const index = questions.findIndex(q => q.id === questionId);
    if (index !== -1) {
      setCurrentQuestionIndex(index);
    }
  }, [questions]);

  const getNextQuestion = useCallback((): QuestionDefinition | null => {
    const unansweredQuestions = questions.filter(q => !currentAnswers[q.id]);
    return unansweredQuestions[0] || null;
  }, [questions, currentAnswers]);

  const getPreviousQuestion = useCallback((): QuestionDefinition | null => {
    const answeredQuestions = questions.filter(q => currentAnswers[q.id] !== undefined);
    return answeredQuestions[answeredQuestions.length - 1] || null;
  }, [questions, currentAnswers]);

  const isQuestionValid = useCallback((questionId: string): boolean => {
    const result = validationResults[questionId];
    return result ? result.isValid : true;
  }, [validationResults]);

  const saveProgress = useCallback(async () => {
    await saveProgressMutation.mutateAsync(currentAnswers);
  }, [saveProgressMutation, currentAnswers]);

  const loadProgress = useCallback(async () => {
    queryClient.invalidateQueries({
      queryKey: ['questionnaire-progress', userContext?.user_id, flowId]
    });
  }, [queryClient, userContext?.user_id, flowId]);

  const clearErrors = useCallback(() => {
    setError(null);
    setValidationResults({});
  }, []);

  // Valores derivados
  const questions = questionnaireData?.questions || [];
  const progress = questionnaireData?.progress || 0;
  const estimatedTimeRemaining = questionnaireData?.estimatedTimeRemaining || 0;
  const suggestions = questionnaireData?.suggestions || [];
  
  const isLoading = isLoadingProgress || isLoadingQuestions;
  const isSaving = saveProgressMutation.isPending;
  
  const fieldErrors = useMemo(() => {
    const errors: Record<string, string[]> = {};
    Object.entries(validationResults).forEach(([questionId, result]) => {
      if (!result.isValid) {
        errors[questionId] = result.errors;
      }
    });
    return errors;
  }, [validationResults]);

  const isQuestionnaireComplete = useMemo(() => {
    const requiredQuestions = questions.filter(q => q.required);
    return requiredQuestions.every(q => currentAnswers[q.id] !== undefined);
  }, [questions, currentAnswers]);

  const canSubmit = useMemo(() => {
    return isQuestionnaireComplete && 
           Object.values(validationResults).every(result => result.isValid) &&
           !submitMutation.isPending;
  }, [isQuestionnaireComplete, validationResults, submitMutation.isPending]);

  return {
    // Estado do questionário
    questions,
    currentAnswers,
    progress,
    estimatedTimeRemaining,
    suggestions,
    
    // Estado de carregamento
    isLoading,
    isSaving,
    isValidating,
    
    // Ações principais
    updateAnswer,
    validateAnswer,
    submitQuestionnaire,
    resetQuestionnaire,
    
    // Navegação
    goToQuestion,
    getNextQuestion,
    getPreviousQuestion,
    
    // Validação e estado
    validationResults,
    isQuestionValid,
    isQuestionnaireComplete,
    canSubmit,
    
    // Utilitários
    saveProgress,
    loadProgress,
    clearErrors,
    
    // Estado de erro
    error,
    fieldErrors
  };
}

// Hook específico para o questionário de Dreams
export function useDreamsQuestionnaire() {
  return useAdaptiveQuestionnaire({
    flowId: 'dreams_adaptive',
    autoSave: true,
    saveInterval: 30000,
    enableAnalytics: true,
    personalizeQuestions: true
  });
}

// Hook para estatísticas do questionário
export function useQuestionnaireAnalytics(flowId: string) {
  const { userContext } = useUserContext();
  
  return useQuery({
    queryKey: ['questionnaire-analytics', userContext?.user_id, flowId],
    queryFn: async () => {
      if (!userContext?.user_id) return null;
      
      // Implementar busca de analytics
      // Por enquanto retorna dados mock
      return {
        completion_rate: 85,
        average_time: 12, // minutos
        abandonment_points: ['budget_range', 'location_preferences'],
        difficulty_scores: {
          'family_composition': 2,
          'primary_motivation': 3,
          'timeline_preference': 2,
          'budget_range': 4,
          'location_preferences': 3
        }
      };
    },
    enabled: !!userContext?.user_id,
    staleTime: 5 * 60 * 1000 // 5 minutos
  });
}

// Hook para comparar respostas com outros usuários similares
export function useQuestionnaireInsights(answers: FormData) {
  const { userContext } = useUserContext();
  
  return useQuery({
    queryKey: ['questionnaire-insights', userContext?.user_id, answers],
    queryFn: async () => {
      if (!userContext?.user_id || Object.keys(answers).length === 0) return null;
      
      // Implementar comparação com outros usuários
      // Por enquanto retorna insights mock
      return {
        similar_users: 127,
        common_goals: ['career', 'education'],
        success_rate: 73,
        recommended_next_steps: [
          'Considere começar o processo de certificação profissional',
          'Explore oportunidades em cidades com menor custo de vida',
          'Conecte-se com outros profissionais da sua área'
        ]
      };
    },
    enabled: !!userContext?.user_id && Object.keys(answers).length > 0,
    staleTime: 10 * 60 * 1000 // 10 minutos
  });
}
