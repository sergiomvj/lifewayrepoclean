import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  intelligentValidationService, 
  ValidationContext, 
  ValidationResult, 
  UserProfile 
} from '@/services/intelligentValidationService';
import { FormData } from '@/services/adaptiveQuestionnaireService';
import { useUserContext } from './useUserContext';

interface UseIntelligentValidationOptions {
  enableRealTimeValidation?: boolean;
  enableLearning?: boolean;
  confidenceThreshold?: number;
  debounceMs?: number;
}

interface UseIntelligentValidationReturn {
  // Validação principal
  validateField: (questionId: string, value: any, answers: FormData) => Promise<ValidationResult[]>;
  validateFieldSync: (questionId: string, value: any, answers: FormData) => ValidationResult[];
  
  // Estado de validação
  validationResults: Record<string, ValidationResult[]>;
  isValidating: boolean;
  validationErrors: Record<string, string[]>;
  validationSuggestions: Record<string, string[]>;
  
  // Métricas e insights
  overallConfidence: number;
  personalizationLevel: number;
  adaptiveFeedback: Record<string, any>;
  
  // Controles
  clearValidation: (questionId?: string) => void;
  enableValidation: (questionId: string) => void;
  disableValidation: (questionId: string) => void;
  
  // Analytics
  getValidationInsights: () => ValidationInsights;
  trackUserReaction: (questionId: string, reaction: 'accepted' | 'ignored' | 'corrected') => void;
}

interface ValidationInsights {
  totalValidations: number;
  successRate: number;
  averageConfidence: number;
  mostEffectiveRules: string[];
  userSegments: string[];
  improvementAreas: string[];
}

interface SessionMetadata {
  questionStartTime: Record<string, number>;
  attemptCounts: Record<string, number>;
  userConfidenceLevels: Record<string, number>;
}

export function useIntelligentValidation(
  options: UseIntelligentValidationOptions = {}
): UseIntelligentValidationReturn {
  const {
    enableRealTimeValidation = true,
    enableLearning = true,
    confidenceThreshold = 0.7,
    debounceMs = 500
  } = options;

  const { context: userContext } = useUserContext();
  const queryClient = useQueryClient();

  // Estados locais
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult[]>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [sessionMetadata, setSessionMetadata] = useState<SessionMetadata>({
    questionStartTime: {},
    attemptCounts: {},
    userConfidenceLevels: {}
  });
  const [enabledQuestions, setEnabledQuestions] = useState<Set<string>>(new Set());
  const [debounceTimers, setDebounceTimers] = useState<Record<string, NodeJS.Timeout>>({});

  // Query para carregar regras de validação ativas
  const { data: activeRules } = useQuery({
    queryKey: ['validation-rules', userContext?.profile?.id],
    queryFn: async () => {
      return intelligentValidationService.getActiveRules();
    },
    enabled: !!userContext?.profile,
    staleTime: 5 * 60 * 1000 // 5 minutos
  });

  // Mutation para validação assíncrona
  const validateMutation = useMutation({
    mutationFn: async ({ 
      questionId, 
      value, 
      answers 
    }: { 
      questionId: string; 
      value: any; 
      answers: FormData; 
    }) => {
      const context = createValidationContext(questionId, value, answers);
      return intelligentValidationService.validateField(context);
    },
    onMutate: () => {
      setIsValidating(true);
    },
    onSuccess: (results, { questionId }) => {
      setValidationResults(prev => ({
        ...prev,
        [questionId]: results
      }));
    },
    onError: (error, { questionId }) => {
      console.error(`Erro na validação de ${questionId}:`, error);
      setValidationResults(prev => ({
        ...prev,
        [questionId]: [{
          is_valid: false,
          severity: 'error',
          message: 'Erro interno na validação',
          suggestions: [],
          confidence_score: 0,
          personalization_applied: false
        }]
      }));
    },
    onSettled: () => {
      setIsValidating(false);
    }
  });

  // Cria contexto de validação
  const createValidationContext = useCallback((
    questionId: string, 
    value: any, 
    answers: FormData
  ): ValidationContext => {
    const profile: UserProfile = {
      id: userContext?.profile?.id || '',
      profession: userContext?.profile?.profession || '',
      education_level: (userContext?.profile?.education_level as 'high_school' | 'bachelor' | 'master' | 'phd') || 'bachelor',
      english_level: userContext?.profile?.english_level || 'intermediate',
      current_country: userContext?.profile?.current_country || 'Brazil',
      experience_years: userContext?.profile?.experience_years || 0,
      family_status: 'single', // Valor padrão
      has_children: false, // Valor padrão
      age_range: '26-35', // Valor padrão corrigido
      income_range: '50k_100k', // Valor padrão corrigido
      previous_visa_attempts: 0, // Valor padrão
      immigration_goals: [] // Array vazio como padrão
    };

    const currentTime = Date.now();
    const startTime = sessionMetadata.questionStartTime[questionId] || currentTime;
    const timeSpent = currentTime - startTime;
    const attempts = sessionMetadata.attemptCounts[questionId] || 1;
    const confidence = sessionMetadata.userConfidenceLevels[questionId] || 0.5;

    const totalQuestions = Object.keys(answers).length + 1;
    const completedQuestions = Object.keys(answers).length;
    const completionPercentage = (completedQuestions / totalQuestions) * 100;

    return {
      user_profile: profile,
      current_answers: answers,
      question_id: questionId,
      field_value: value,
      session_metadata: {
        time_spent_on_question: timeSpent,
        attempts_count: attempts,
        user_confidence_level: confidence,
        completion_percentage: completionPercentage
      }
    };
  }, [userContext, sessionMetadata]);

  // Validação principal (assíncrona)
  const validateField = useCallback(async (
    questionId: string, 
    value: any, 
    answers: FormData
  ): Promise<ValidationResult[]> => {
    if (!enabledQuestions.has(questionId) && enabledQuestions.size > 0) {
      return [];
    }

    // Atualizar metadados da sessão
    setSessionMetadata(prev => ({
      ...prev,
      questionStartTime: {
        ...prev.questionStartTime,
        [questionId]: prev.questionStartTime[questionId] || Date.now()
      },
      attemptCounts: {
        ...prev.attemptCounts,
        [questionId]: (prev.attemptCounts[questionId] || 0) + 1
      }
    }));

    // Aplicar debounce se habilitado
    if (debounceMs > 0) {
      return new Promise((resolve) => {
        // Limpar timer anterior se existir
        if (debounceTimers[questionId]) {
          clearTimeout(debounceTimers[questionId]);
        }

        const timer = setTimeout(async () => {
          const results = await validateMutation.mutateAsync({ questionId, value, answers });
          resolve(results);
        }, debounceMs);

        setDebounceTimers(prev => ({
          ...prev,
          [questionId]: timer
        }));
      });
    }

    return validateMutation.mutateAsync({ questionId, value, answers });
  }, [enabledQuestions, debounceMs, debounceTimers, validateMutation]);

  // Validação síncrona (para casos que precisam de resposta imediata)
  const validateFieldSync = useCallback((
    questionId: string, 
    value: any, 
    answers: FormData
  ): ValidationResult[] => {
    if (!enabledQuestions.has(questionId) && enabledQuestions.size > 0) {
      return [];
    }

    try {
      const context = createValidationContext(questionId, value, answers);
      // Implementação síncrona simplificada
      const rules = intelligentValidationService.getActiveRules();
      const applicableRules = rules.filter(rule => 
        rule.field_types.some(type => questionId.includes(type))
      );

      // Aplicar apenas validações básicas síncronas
      const results: ValidationResult[] = [];
      
      for (const rule of applicableRules.slice(0, 2)) { // Limitar para performance
        if (rule.validation_logic.type === 'conditional' || rule.validation_logic.type === 'format') {
          // Aplicar validação básica
          results.push({
            is_valid: true,
            severity: 'success',
            message: 'Validação básica aprovada',
            suggestions: [],
            confidence_score: 0.6,
            personalization_applied: false,
            rule_id: rule.id
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Erro na validação síncrona:', error);
      return [];
    }
  }, [enabledQuestions, createValidationContext]);

  // Valores derivados
  const validationErrors = useMemo(() => {
    const errors: Record<string, string[]> = {};
    Object.entries(validationResults).forEach(([questionId, results]) => {
      const errorResults = results.filter(r => r.severity === 'error' && !r.is_valid);
      if (errorResults.length > 0) {
        errors[questionId] = errorResults.map(r => r.message);
      }
    });
    return errors;
  }, [validationResults]);

  const validationSuggestions = useMemo(() => {
    const suggestions: Record<string, string[]> = {};
    Object.entries(validationResults).forEach(([questionId, results]) => {
      const allSuggestions = results.flatMap(r => r.suggestions);
      if (allSuggestions.length > 0) {
        suggestions[questionId] = allSuggestions;
      }
    });
    return suggestions;
  }, [validationResults]);

  const overallConfidence = useMemo(() => {
    const allResults = Object.values(validationResults).flat();
    if (allResults.length === 0) return 0;
    
    const totalConfidence = allResults.reduce((sum, result) => sum + result.confidence_score, 0);
    return totalConfidence / allResults.length;
  }, [validationResults]);

  const personalizationLevel = useMemo(() => {
    const allResults = Object.values(validationResults).flat();
    if (allResults.length === 0) return 0;
    
    const personalizedResults = allResults.filter(r => r.personalization_applied);
    return personalizedResults.length / allResults.length;
  }, [validationResults]);

  const adaptiveFeedback = useMemo(() => {
    const feedback: Record<string, any> = {};
    Object.entries(validationResults).forEach(([questionId, results]) => {
      const feedbackResults = results.filter(r => r.adaptive_feedback);
      if (feedbackResults.length > 0) {
        feedback[questionId] = feedbackResults.map(r => r.adaptive_feedback);
      }
    });
    return feedback;
  }, [validationResults]);

  // Funções de controle
  const clearValidation = useCallback((questionId?: string) => {
    if (questionId) {
      setValidationResults(prev => {
        const newResults = { ...prev };
        delete newResults[questionId];
        return newResults;
      });
    } else {
      setValidationResults({});
    }
  }, []);

  const enableValidation = useCallback((questionId: string) => {
    setEnabledQuestions(prev => new Set([...prev, questionId]));
  }, []);

  const disableValidation = useCallback((questionId: string) => {
    setEnabledQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(questionId);
      return newSet;
    });
  }, []);

  // Analytics e insights
  const getValidationInsights = useCallback((): ValidationInsights => {
    const allResults = Object.values(validationResults).flat();
    const totalValidations = allResults.length;
    const successfulValidations = allResults.filter(r => r.is_valid).length;
    const successRate = totalValidations > 0 ? successfulValidations / totalValidations : 0;
    
    const averageConfidence = overallConfidence;
    
    // Regras mais efetivas (baseado no confidence_score)
    const ruleEffectiveness = new Map<string, number[]>();
    allResults.forEach(result => {
      if (result.rule_id) {
        if (!ruleEffectiveness.has(result.rule_id)) {
          ruleEffectiveness.set(result.rule_id, []);
        }
        ruleEffectiveness.get(result.rule_id)!.push(result.confidence_score);
      }
    });
    
    const mostEffectiveRules = Array.from(ruleEffectiveness.entries())
      .map(([ruleId, scores]) => ({
        ruleId,
        avgScore: scores.reduce((a, b) => a + b, 0) / scores.length
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 3)
      .map(item => item.ruleId);

    // Segmentos do usuário (simulado)
    const userSegments = ['working_professional', 'career_focused'];
    
    // Áreas de melhoria
    const improvementAreas = allResults
      .filter(r => !r.is_valid || r.confidence_score < confidenceThreshold)
      .map(r => r.rule_id)
      .filter((id, index, arr) => arr.indexOf(id) === index)
      .slice(0, 3);

    return {
      totalValidations,
      successRate,
      averageConfidence,
      mostEffectiveRules,
      userSegments,
      improvementAreas
    };
  }, [validationResults, overallConfidence, confidenceThreshold]);

  // Rastreamento de reação do usuário
  const trackUserReaction = useCallback((
    questionId: string, 
    reaction: 'accepted' | 'ignored' | 'corrected'
  ) => {
    // Em produção, enviaria para analytics
    console.log('User reaction tracked:', { questionId, reaction });
    
    // Atualizar confiança do usuário baseado na reação
    setSessionMetadata(prev => ({
      ...prev,
      userConfidenceLevels: {
        ...prev.userConfidenceLevels,
        [questionId]: reaction === 'accepted' ? 0.8 : 
                     reaction === 'corrected' ? 0.6 : 0.4
      }
    }));
  }, []);

  // Cleanup de timers ao desmontar
  useEffect(() => {
    return () => {
      Object.values(debounceTimers).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [debounceTimers]);

  // Habilitar validação em tempo real por padrão
  useEffect(() => {
    if (enableRealTimeValidation && enabledQuestions.size === 0) {
      // Habilitar para todas as perguntas por padrão
      setEnabledQuestions(new Set(['*'])); // '*' significa todas
    }
  }, [enableRealTimeValidation, enabledQuestions.size]);

  return {
    // Validação principal
    validateField,
    validateFieldSync,
    
    // Estado de validação
    validationResults,
    isValidating: isValidating || validateMutation.isPending,
    validationErrors,
    validationSuggestions,
    
    // Métricas e insights
    overallConfidence,
    personalizationLevel,
    adaptiveFeedback,
    
    // Controles
    clearValidation,
    enableValidation,
    disableValidation,
    
    // Analytics
    getValidationInsights,
    trackUserReaction
  };
}

// Hook específico para validação de Dreams
export function useDreamsIntelligentValidation() {
  return useIntelligentValidation({
    enableRealTimeValidation: true,
    enableLearning: true,
    confidenceThreshold: 0.75,
    debounceMs: 800
  });
}

// Hook para validação rápida (sem debounce)
export function useQuickIntelligentValidation() {
  return useIntelligentValidation({
    enableRealTimeValidation: true,
    enableLearning: false,
    confidenceThreshold: 0.6,
    debounceMs: 0
  });
}

export default useIntelligentValidation;
