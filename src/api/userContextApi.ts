import { supabase } from '@/integrations/supabase/client';
import { userContextService } from '@/services/userContextService';
import { 
  UserContext, 
  ContextQuery, 
  ContextResponse, 
  ContextUpdate,
  ContextValidation 
} from '@/types/userContext';

// API endpoints for AI specialist to interact with user context
export class UserContextAPI {
  
  // Get user context for AI specialist consultation
  async getContextForAI(userId: string, purpose: string = 'specialist_chat'): Promise<{
    success: boolean;
    data?: ContextResponse;
    aiContext?: string;
    error?: string;
  }> {
    try {
      // Validate user exists and has permission
      const { data: user, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: 'Authentication required' };
      }

      // Get context response
      const contextResponse = await userContextService.getContext(userId);
      if (!contextResponse) {
        return { success: false, error: 'User context not found' };
      }

      // Generate AI-friendly context
      const aiContext = await userContextService.generateAIContext(userId, purpose);

      return {
        success: true,
        data: contextResponse,
        aiContext: aiContext
      };
    } catch (error) {
      console.error('Error getting context for AI:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Update user context from AI specialist insights
  async updateContextFromAI(userId: string, updates: {
    aiInsights?: Partial<import('@/types/userContext').AIInsights>;
    specialistNotes?: string;
    recommendations?: string[];
    actionItems?: import('@/types/userContext').ActionItem[];
    progressUpdate?: Partial<import('@/types/userContext').ProgressTracking>;
  }): Promise<{
    success: boolean;
    data?: UserContext;
    error?: string;
  }> {
    try {
      const contextUpdates: ContextUpdate[] = [];
      const now = new Date().toISOString();

      // Prepare AI insights update
      if (updates.aiInsights) {
        contextUpdates.push({
          operation: 'update',
          section: 'ai_insights',
          data: {
            ...updates.aiInsights,
            last_analysis_date: now
          },
          timestamp: now,
          source: 'ai',
          reason: 'AI specialist analysis update'
        });
      }

      // Prepare progress tracking update
      if (updates.progressUpdate) {
        contextUpdates.push({
          operation: 'update',
          section: 'progress_tracking',
          data: updates.progressUpdate,
          timestamp: now,
          source: 'ai',
          reason: 'Progress update from AI analysis'
        });
      }

      // Add specialist interaction record
      if (updates.specialistNotes || updates.recommendations) {
        const specialistInteraction = {
          id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          specialist_id: 'ai_system',
          specialist_name: 'AI Assistant',
          interaction_type: 'review' as const,
          start_time: now,
          end_time: now,
          duration_minutes: 0,
          topics_discussed: updates.recommendations ? ['AI Analysis', 'Recommendations'] : ['AI Analysis'],
          recommendations_given: updates.recommendations || [],
          action_items: updates.actionItems || [],
          specialist_notes: updates.specialistNotes || ''
        };

        contextUpdates.push({
          operation: 'append',
          section: 'specialist_interactions',
          data: specialistInteraction,
          timestamp: now,
          source: 'ai',
          reason: 'AI specialist review session'
        });
      }

      // Apply updates
      const updatedContext = await userContextService.updateContext(userId, contextUpdates);

      return {
        success: true,
        data: updatedContext
      };
    } catch (error) {
      console.error('Error updating context from AI:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Validate user context completeness for AI analysis
  async validateContextForAI(userId: string): Promise<{
    success: boolean;
    validation?: ContextValidation;
    recommendations?: string[];
    error?: string;
  }> {
    try {
      const contextResponse = await userContextService.getContext(userId);
      if (!contextResponse) {
        return { success: false, error: 'User context not found' };
      }

      const context = contextResponse.context as UserContext;
      const validation = userContextService.validateContext(context);

      // Generate AI-specific recommendations
      const recommendations: string[] = [];
      
      if (validation.completeness_score < 30) {
        recommendations.push('Critical: User profile is severely incomplete. Request basic information before proceeding.');
      } else if (validation.completeness_score < 60) {
        recommendations.push('Warning: User profile needs more details for accurate analysis.');
      }

      if (context.dream_goals.length === 0) {
        recommendations.push('Suggest user complete the Criador de Sonhos tool to define clear goals.');
      }

      if (context.visa_analyses.length === 0) {
        recommendations.push('Recommend user complete VisaMatch analysis for visa strategy.');
      }

      if (context.current_situation.obstacles.length === 0) {
        recommendations.push('Ask user about potential obstacles to better prepare strategies.');
      }

      if (!context.current_situation.us_connections?.length) {
        recommendations.push('Inquire about US connections (family, friends, employers) for additional opportunities.');
      }

      return {
        success: true,
        validation,
        recommendations
      };
    } catch (error) {
      console.error('Error validating context for AI:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Search contexts by criteria (for AI to find similar cases)
  async searchSimilarContexts(criteria: {
    profession?: string;
    goalCategory?: string;
    country?: string;
    ageRange?: [number, number];
    fundsRange?: [number, number];
    excludeUserId?: string;
    limit?: number;
  }): Promise<{
    success: boolean;
    contexts?: Array<{
      userId: string;
      similarity: number;
      keyMatches: string[];
      summary: string;
    }>;
    error?: string;
  }> {
    try {
      let query = supabase
        .from('user_contexts_summary')
        .select('*');

      // Apply filters
      if (criteria.profession) {
        query = query.ilike('profession', `%${criteria.profession}%`);
      }

      if (criteria.goalCategory) {
        query = query.eq('goal_category', criteria.goalCategory);
      }

      if (criteria.country) {
        query = query.eq('country', criteria.country);
      }

      if (criteria.ageRange) {
        query = query
          .gte('age', criteria.ageRange[0])
          .lte('age', criteria.ageRange[1]);
      }

      if (criteria.fundsRange) {
        query = query
          .gte('available_funds', criteria.fundsRange[0])
          .lte('available_funds', criteria.fundsRange[1]);
      }

      if (criteria.excludeUserId) {
        query = query.neq('user_id', criteria.excludeUserId);
      }

      query = query
        .order('data_completeness_score', { ascending: false })
        .limit(criteria.limit || 10);

      const { data, error } = await query;

      if (error) throw error;

      // Calculate similarity and format results
      const contexts = data?.map(context => {
        const keyMatches: string[] = [];
        let similarity = 0;

        if (criteria.profession && context.profession?.toLowerCase().includes(criteria.profession.toLowerCase())) {
          keyMatches.push('profession');
          similarity += 30;
        }

        if (criteria.goalCategory && context.goal_category === criteria.goalCategory) {
          keyMatches.push('goal category');
          similarity += 25;
        }

        if (criteria.country && context.country === criteria.country) {
          keyMatches.push('country');
          similarity += 20;
        }

        if (criteria.ageRange && context.age && 
            context.age >= criteria.ageRange[0] && context.age <= criteria.ageRange[1]) {
          keyMatches.push('age range');
          similarity += 15;
        }

        if (criteria.fundsRange && context.available_funds && 
            context.available_funds >= criteria.fundsRange[0] && context.available_funds <= criteria.fundsRange[1]) {
          keyMatches.push('budget range');
          similarity += 10;
        }

        const summary = `${context.user_name || 'User'} - ${context.profession || 'N/A'} from ${context.country || 'N/A'}, seeking ${context.primary_goal || 'immigration'} (${context.progress_percentage || 0}% complete)`;

        return {
          userId: context.user_id,
          similarity,
          keyMatches,
          summary
        };
      }) || [];

      // Sort by similarity score
      contexts.sort((a, b) => b.similarity - a.similarity);

      return {
        success: true,
        contexts
      };
    } catch (error) {
      console.error('Error searching similar contexts:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get context analytics for AI insights
  async getContextAnalytics(userId: string): Promise<{
    success: boolean;
    analytics?: {
      profileCompleteness: number;
      progressVelocity: number;
      engagementScore: number;
      riskFactors: string[];
      successIndicators: string[];
      benchmarkComparison: {
        betterThan: number;
        averageProgress: number;
        timeToCompletion: string;
      };
    };
    error?: string;
  }> {
    try {
      const contextResponse = await userContextService.getContext(userId);
      if (!contextResponse) {
        return { success: false, error: 'User context not found' };
      }

      const context = contextResponse.context as UserContext;
      
      // Calculate analytics
      const profileCompleteness = context.data_completeness_score;
      
      // Calculate progress velocity (progress per day since start)
      const daysSinceStart = context.progress_tracking.days_since_start || 1;
      const progressVelocity = context.progress_tracking.overall_progress_percentage / daysSinceStart;
      
      // Calculate engagement score based on activities
      let engagementScore = 0;
      engagementScore += context.dream_goals.length * 20; // 20 points per dream
      engagementScore += context.visa_analyses.length * 30; // 30 points per analysis
      engagementScore += context.specialist_interactions.length * 25; // 25 points per interaction
      engagementScore = Math.min(engagementScore, 100); // Cap at 100

      // Identify risk factors
      const riskFactors: string[] = [];
      if (profileCompleteness < 40) riskFactors.push('Low profile completeness');
      if (progressVelocity < 1) riskFactors.push('Slow progress velocity');
      if (context.progress_tracking.blockers.length > 2) riskFactors.push('Multiple blockers identified');
      if (context.current_situation.available_funds < 5000) riskFactors.push('Limited financial resources');
      if (!context.current_situation.us_connections?.length) riskFactors.push('No US connections');

      // Identify success indicators
      const successIndicators: string[] = [];
      if (profileCompleteness > 70) successIndicators.push('High profile completeness');
      if (progressVelocity > 2) successIndicators.push('Good progress velocity');
      if (context.current_situation.available_funds > 20000) successIndicators.push('Strong financial position');
      if (context.current_situation.us_connections?.length) successIndicators.push('Has US connections');
      if (context.specialist_interactions.length > 0) successIndicators.push('Engaged with specialists');

      // Get benchmark data (simplified - in real implementation, query similar users)
      const benchmarkComparison = {
        betterThan: Math.min(profileCompleteness + engagementScore / 2, 95), // Simplified calculation
        averageProgress: 45, // Would be calculated from database
        timeToCompletion: progressVelocity > 1 ? '3-6 months' : '6-12 months'
      };

      return {
        success: true,
        analytics: {
          profileCompleteness,
          progressVelocity,
          engagementScore,
          riskFactors,
          successIndicators,
          benchmarkComparison
        }
      };
    } catch (error) {
      console.error('Error getting context analytics:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Export user context for AI training or analysis
  async exportContextForAI(userId: string, format: 'json' | 'summary' | 'training'): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const contextResponse = await userContextService.getContext(userId);
      if (!contextResponse) {
        return { success: false, error: 'User context not found' };
      }

      const context = contextResponse.context as UserContext;

      switch (format) {
        case 'json':
          return { success: true, data: context };

        case 'summary':
          return { 
            success: true, 
            data: {
              summary: contextResponse.summary,
              keyPoints: contextResponse.key_points,
              recommendations: contextResponse.recommendations,
              completeness: context.data_completeness_score
            }
          };

        case 'training':
          // Anonymized data for AI training
          const trainingData = {
            profile: {
              age: context.profile.age,
              profession: context.profile.profession,
              education: context.profile.education_level,
              english_level: context.profile.english_level,
              country: context.profile.current_country
            },
            goals: {
              category: context.immigration_goals.category,
              priority: context.immigration_goals.priority,
              timeline: context.immigration_goals.timeline
            },
            situation: {
              employment: context.current_situation.employment_status,
              funds_range: context.current_situation.available_funds > 50000 ? 'high' : 
                          context.current_situation.available_funds > 20000 ? 'medium' : 'low',
              obstacles_count: context.current_situation.obstacles.length,
              strengths_count: context.current_situation.strengths.length
            },
            outcomes: {
              completeness: context.data_completeness_score,
              progress: context.progress_tracking.overall_progress_percentage,
              dreams_created: context.dream_goals.length,
              analyses_completed: context.visa_analyses.length,
              specialist_sessions: context.specialist_interactions.length
            }
          };
          return { success: true, data: trainingData };

        default:
          return { success: false, error: 'Invalid export format' };
      }
    } catch (error) {
      console.error('Error exporting context for AI:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Create singleton instance
export const userContextAPI = new UserContextAPI();

export default userContextAPI;
