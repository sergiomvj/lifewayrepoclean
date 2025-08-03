import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userContextService } from '@/services/userContextService';
import { userContextAPI } from '@/api/userContextApi';
import { 
  UserContext, 
  ContextUpdate, 
  ContextResponse, 
  ContextValidation,
  AIInsights,
  ProgressTracking,
  ActionItem
} from '@/types/userContext';
import { supabase } from '@/integrations/supabase/client';

// Hook for managing user context
export function useUserContext(userId?: string) {
  const queryClient = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(userId || null);

  // Get current user ID from auth if not provided
  useEffect(() => {
    if (!userId) {
      const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
        }
      };
      getCurrentUser();
    }
  }, [userId]);

  // Query for user context
  const {
    data: contextResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['userContext', currentUserId],
    queryFn: () => currentUserId ? userContextService.getContext(currentUserId) : null,
    enabled: !!currentUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Mutation for updating context
  const updateContextMutation = useMutation({
    mutationFn: ({ updates }: { updates: ContextUpdate[] }) => {
      if (!currentUserId) throw new Error('User ID not available');
      return userContextService.updateContext(currentUserId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userContext', currentUserId] });
    },
  });

  // Mutation for creating context
  const createContextMutation = useMutation({
    mutationFn: ({ initialData }: { initialData: Partial<UserContext> }) => {
      if (!currentUserId) throw new Error('User ID not available');
      return userContextService.createContext(currentUserId, initialData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userContext', currentUserId] });
    },
  });

  // Helper functions
  const updateProfile = useCallback((profileData: Partial<UserContext['profile']>) => {
    const update: ContextUpdate = {
      operation: 'update',
      section: 'profile',
      data: profileData,
      timestamp: new Date().toISOString(),
      source: 'user',
      reason: 'Profile update'
    };
    return updateContextMutation.mutateAsync({ updates: [update] });
  }, [updateContextMutation]);

  const updateImmigrationGoals = useCallback((goalsData: Partial<UserContext['immigration_goals']>) => {
    const update: ContextUpdate = {
      operation: 'update',
      section: 'immigration_goals',
      data: goalsData,
      timestamp: new Date().toISOString(),
      source: 'user',
      reason: 'Immigration goals update'
    };
    return updateContextMutation.mutateAsync({ updates: [update] });
  }, [updateContextMutation]);

  const updateCurrentSituation = useCallback((situationData: Partial<UserContext['current_situation']>) => {
    const update: ContextUpdate = {
      operation: 'update',
      section: 'current_situation',
      data: situationData,
      timestamp: new Date().toISOString(),
      source: 'user',
      reason: 'Current situation update'
    };
    return updateContextMutation.mutateAsync({ updates: [update] });
  }, [updateContextMutation]);

  const addDreamGoal = useCallback((dreamGoal: UserContext['dream_goals'][0]) => {
    const update: ContextUpdate = {
      operation: 'append',
      section: 'dream_goals',
      data: dreamGoal,
      timestamp: new Date().toISOString(),
      source: 'user',
      reason: 'New dream goal added'
    };
    return updateContextMutation.mutateAsync({ updates: [update] });
  }, [updateContextMutation]);

  const addVisaAnalysis = useCallback((visaAnalysis: UserContext['visa_analyses'][0]) => {
    const update: ContextUpdate = {
      operation: 'append',
      section: 'visa_analyses',
      data: visaAnalysis,
      timestamp: new Date().toISOString(),
      source: 'system',
      reason: 'New visa analysis completed'
    };
    return updateContextMutation.mutateAsync({ updates: [update] });
  }, [updateContextMutation]);

  const updateProgress = useCallback((progressData: Partial<ProgressTracking>) => {
    const update: ContextUpdate = {
      operation: 'update',
      section: 'progress_tracking',
      data: progressData,
      timestamp: new Date().toISOString(),
      source: 'system',
      reason: 'Progress tracking update'
    };
    return updateContextMutation.mutateAsync({ updates: [update] });
  }, [updateContextMutation]);

  const updateAIInsights = useCallback((insightsData: Partial<AIInsights>) => {
    const update: ContextUpdate = {
      operation: 'update',
      section: 'ai_insights',
      data: {
        ...insightsData,
        last_analysis_date: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      source: 'ai',
      reason: 'AI insights update'
    };
    return updateContextMutation.mutateAsync({ updates: [update] });
  }, [updateContextMutation]);

  // Create initial context if it doesn't exist
  const createContext = useCallback((initialData: Partial<UserContext> = {}) => {
    return createContextMutation.mutateAsync({ initialData });
  }, [createContextMutation]);

  // Get context for AI
  const getContextForAI = useCallback(async (purpose: string = 'specialist_chat') => {
    if (!currentUserId) throw new Error('User ID not available');
    return userContextAPI.getContextForAI(currentUserId, purpose);
  }, [currentUserId]);

  // Validate context
  const validateContext = useCallback(() => {
    if (!contextResponse?.context) return null;
    return userContextService.validateContext(contextResponse.context as UserContext);
  }, [contextResponse]);

  // Get analytics
  const getAnalytics = useCallback(async () => {
    if (!currentUserId) throw new Error('User ID not available');
    return userContextAPI.getContextAnalytics(currentUserId);
  }, [currentUserId]);

  return {
    // Data
    context: contextResponse?.context as UserContext | null,
    userContext: contextResponse?.context as UserContext | null, // Alias for backward compatibility
    user: contextResponse?.context as UserContext | null, // Alias for user property
    contextResponse,
    isLoading,
    error,
    
    // Status
    hasContext: !!contextResponse?.context,
    isUpdating: updateContextMutation.isPending || createContextMutation.isPending,
    
    // Actions
    refetch,
    createContext,
    updateProfile,
    updateImmigrationGoals,
    updateCurrentSituation,
    addDreamGoal,
    addVisaAnalysis,
    updateProgress,
    updateAIInsights,
    
    // AI Integration
    getContextForAI,
    validateContext,
    getAnalytics,
    
    // Raw mutations for advanced use
    updateContext: updateContextMutation.mutateAsync,
    
    // Computed values
    completenessScore: contextResponse?.data_quality_score || 0,
    keyPoints: contextResponse?.key_points || [],
    recommendations: contextResponse?.recommendations || [],
    missingData: contextResponse?.missing_data || []
  };
}

// Hook specifically for AI specialist integration
export function useAIContext(userId?: string) {
  const { context, getContextForAI, validateContext, getAnalytics } = useUserContext(userId);
  
  const [aiContext, setAIContext] = useState<string | null>(null);
  const [validation, setValidation] = useState<ContextValidation | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  // Generate AI context
  const generateAIContext = useCallback(async (purpose: string = 'specialist_chat') => {
    try {
      const result = await getContextForAI(purpose);
      if (result.success && result.aiContext) {
        setAIContext(result.aiContext);
      }
      return result;
    } catch (error) {
      console.error('Error generating AI context:', error);
      return { success: false, error: 'Failed to generate AI context' };
    }
  }, [getContextForAI]);

  // Validate context for AI
  const validateForAI = useCallback(async () => {
    try {
      const contextValidation = validateContext();
      setValidation(contextValidation);
      return contextValidation;
    } catch (error) {
      console.error('Error validating context:', error);
      return null;
    }
  }, [validateContext]);

  // Get analytics for AI
  const getAIAnalytics = useCallback(async () => {
    try {
      const result = await getAnalytics();
      if (result.success && result.analytics) {
        setAnalytics(result.analytics);
      }
      return result;
    } catch (error) {
      console.error('Error getting analytics:', error);
      return { success: false, error: 'Failed to get analytics' };
    }
  }, [getAnalytics]);

  // Update context from AI insights
  const updateFromAI = useCallback(async (updates: {
    aiInsights?: Partial<AIInsights>;
    specialistNotes?: string;
    recommendations?: string[];
    actionItems?: ActionItem[];
    progressUpdate?: Partial<ProgressTracking>;
  }) => {
    if (!userId) throw new Error('User ID not available');
    return userContextAPI.updateContextFromAI(userId, updates);
  }, [userId]);

  return {
    context,
    aiContext,
    validation,
    analytics,
    
    // Actions
    generateAIContext,
    validateForAI,
    getAIAnalytics,
    updateFromAI,
    
    // Status
    isReady: !!context && !!aiContext,
    needsValidation: !validation || validation.completeness_score < 50
  };
}

// Hook for context search and comparison
export function useContextSearch() {
  const searchSimilarContexts = useCallback(async (criteria: {
    profession?: string;
    goalCategory?: string;
    country?: string;
    ageRange?: [number, number];
    fundsRange?: [number, number];
    excludeUserId?: string;
    limit?: number;
  }) => {
    return userContextAPI.searchSimilarContexts(criteria);
  }, []);

  return {
    searchSimilarContexts
  };
}

export default useUserContext;
