import { supabase } from '@/integrations/supabase/client';
import { 
  UserContext, 
  ContextUpdate, 
  ContextQuery, 
  ContextResponse, 
  ContextValidation,
  ValidationError,
  ValidationWarning,
  UserProfile,
  ImmigrationGoals,
  CurrentSituation,
  DreamGoal,
  VisaAnalysis,
  SpecialistInteraction,
  ProgressTracking,
  AIInsights,
  PrivacySettings,
  USER_CONTEXT_SCHEMA_VERSION,
  REQUIRED_SECTIONS
} from '@/types/userContext';

class UserContextService {
  private readonly TABLE_NAME = 'user_contexts';
  private readonly HISTORY_TABLE_NAME = 'user_context_history';

  // Create new user context
  async createContext(userId: string, initialData: Partial<UserContext>): Promise<UserContext> {
    const contextId = `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const defaultContext: UserContext = {
      context_id: contextId,
      user_id: userId,
      version: 1,
      created_at: now,
      updated_at: now,
      last_accessed: now,
      
      profile: {
        id: userId,
        name: '',
        profession: '',
        education_level: 'bachelor',
        english_level: 'intermediate',
        current_country: 'Brazil',
        created_at: now,
        updated_at: now,
        ...initialData.profile
      },
      
      immigration_goals: {
        primary_objective: '',
        category: 'trabalho',
        timeline: '',
        priority: 'media',
        motivation: '',
        ...initialData.immigration_goals
      },
      
      current_situation: {
        employment_status: 'employed',
        available_funds: 0,
        available_funds_currency: 'USD',
        obstacles: [],
        strengths: [],
        ...initialData.current_situation
      },
      
      dream_goals: initialData.dream_goals || [],
      visa_analyses: initialData.visa_analyses || [],
      specialist_interactions: initialData.specialist_interactions || [],
      
      progress_tracking: {
        overall_progress_percentage: 0,
        goals_completed: 0,
        goals_total: 0,
        milestones_completed: 0,
        milestones_total: 0,
        days_since_start: 0,
        current_phase: 'Initial Assessment',
        next_recommended_action: 'Complete your profile information',
        blockers: [],
        recent_achievements: [],
        ...initialData.progress_tracking
      },
      
      ai_insights: {
        last_analysis_date: now,
        confidence_score: 0,
        key_insights: [],
        risk_factors: [],
        opportunities: [],
        recommended_focus_areas: ['Complete profile', 'Define clear goals'],
        predicted_timeline: 'To be determined',
        success_probability: 0,
        alternative_strategies: [],
        ...initialData.ai_insights
      },
      
      data_completeness_score: 0,
      privacy_settings: {
        share_with_specialists: true,
        share_analytics: true,
        allow_ai_analysis: true,
        data_retention_days: 365,
        anonymize_data: false,
        export_allowed: true,
        ...initialData.privacy_settings
      },
      
      tags: initialData.tags || [],
      notes: initialData.notes || []
    };

    // Calculate initial completeness score
    defaultContext.data_completeness_score = this.calculateCompletenessScore(defaultContext);

    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert([defaultContext])
        .select()
        .single();

      if (error) throw error;

      // Log creation in history
      await this.logContextUpdate({
        operation: 'create',
        section: 'profile',
        data: defaultContext,
        timestamp: now,
        source: 'system',
        reason: 'Initial context creation'
      }, userId);

      return data;
    } catch (error) {
      console.error('Error creating user context:', error);
      throw new Error('Failed to create user context');
    }
  }

  // Get user context by user ID
  async getContext(userId: string, query?: ContextQuery): Promise<ContextResponse | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('user_id', userId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null;
        }
        throw error;
      }

      // Update last accessed timestamp
      await this.updateLastAccessed(userId);

      const context = data as UserContext;
      
      // Filter sections based on query
      let filteredContext: UserContext | Partial<UserContext> = context;
      if (query?.sections) {
        filteredContext = this.filterContextSections(context, query.sections);
      }

      // Format response based on query format
      const response: ContextResponse = {
        context: filteredContext,
        summary: this.generateContextSummary(context),
        key_points: this.extractKeyPoints(context),
        recommendations: this.generateRecommendations(context),
        missing_data: this.identifyMissingData(context),
        data_quality_score: context.data_completeness_score,
        last_updated: context.updated_at
      };

      return response;
    } catch (error) {
      console.error('Error fetching user context:', error);
      throw new Error('Failed to fetch user context');
    }
  }

  // Update user context
  async updateContext(userId: string, updates: ContextUpdate[]): Promise<UserContext> {
    try {
      // Get current context
      const currentResponse = await this.getContext(userId);
      if (!currentResponse) {
        throw new Error('User context not found');
      }

      const currentContext = currentResponse.context as UserContext;
      const now = new Date().toISOString();

      // Apply updates
      let updatedContext = { ...currentContext };
      for (const update of updates) {
        updatedContext = this.applyUpdate(updatedContext, update);
      }

      // Increment version and update timestamps
      updatedContext.version += 1;
      updatedContext.updated_at = now;
      updatedContext.data_completeness_score = this.calculateCompletenessScore(updatedContext);

      // Save updated context
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .update(updatedContext)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Log updates in history
      for (const update of updates) {
        await this.logContextUpdate(update, userId);
      }

      return data;
    } catch (error) {
      console.error('Error updating user context:', error);
      throw new Error('Failed to update user context');
    }
  }

  // Validate context data
  validateContext(context: UserContext): ContextValidation {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let completenessScore = 0;
    const requiredFieldsMissing: string[] = [];
    const suggestedImprovements: string[] = [];

    // Validate required sections
    for (const section of REQUIRED_SECTIONS) {
      if (!context[section]) {
        errors.push({
          field: section,
          message: `Required section '${section}' is missing`,
          severity: 'error'
        });
        requiredFieldsMissing.push(section);
      }
    }

    // Validate profile completeness
    if (context.profile) {
      const profile = context.profile;
      if (!profile.name?.trim()) {
        requiredFieldsMissing.push('profile.name');
      }
      if (!profile.profession?.trim()) {
        warnings.push({
          field: 'profile.profession',
          message: 'Profession is not specified',
          suggestion: 'Add your profession for better visa recommendations'
        });
      }
      if (!profile.age || profile.age < 18 || profile.age > 100) {
        warnings.push({
          field: 'profile.age',
          message: 'Age is missing or invalid',
          suggestion: 'Provide your age for accurate analysis'
        });
      }
    }

    // Validate immigration goals
    if (context.immigration_goals) {
      const goals = context.immigration_goals;
      if (!goals.primary_objective?.trim()) {
        requiredFieldsMissing.push('immigration_goals.primary_objective');
      }
      if (!goals.timeline?.trim()) {
        warnings.push({
          field: 'immigration_goals.timeline',
          message: 'Timeline is not specified',
          suggestion: 'Define your target timeline for better planning'
        });
      }
    }

    // Calculate completeness score
    completenessScore = this.calculateCompletenessScore(context);

    // Generate improvement suggestions
    if (completenessScore < 50) {
      suggestedImprovements.push('Complete basic profile information');
      suggestedImprovements.push('Define clear immigration goals');
    }
    if (completenessScore < 75) {
      suggestedImprovements.push('Add more details about your current situation');
      suggestedImprovements.push('Specify your available resources');
    }
    if (context.dream_goals.length === 0) {
      suggestedImprovements.push('Create at least one dream goal using the Criador de Sonhos');
    }
    if (context.visa_analyses.length === 0) {
      suggestedImprovements.push('Complete a visa analysis using VisaMatch');
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
      completeness_score: completenessScore,
      required_fields_missing: requiredFieldsMissing,
      suggested_improvements: suggestedImprovements
    };
  }

  // Generate context for AI specialist
  async generateAIContext(userId: string, purpose: string): Promise<string> {
    const response = await this.getContext(userId);
    if (!response) {
      throw new Error('User context not found');
    }

    const context = response.context as UserContext;
    const validation = this.validateContext(context);

    // Create AI-friendly context summary
    const aiContext = {
      user_profile: {
        name: context.profile.name,
        age: context.profile.age,
        profession: context.profile.profession,
        experience: context.profile.experience_years,
        education: context.profile.education_level,
        english_level: context.profile.english_level,
        location: `${context.profile.current_city || ''}, ${context.profile.current_country}`.trim().replace(/^,\s*/, '')
      },
      immigration_goals: {
        objective: context.immigration_goals.primary_objective,
        category: context.immigration_goals.category,
        timeline: context.immigration_goals.timeline,
        priority: context.immigration_goals.priority,
        motivation: context.immigration_goals.motivation,
        target_locations: context.immigration_goals.target_states || []
      },
      current_situation: {
        employment: context.current_situation.employment_status,
        funds_available: `${context.current_situation.available_funds} ${context.current_situation.available_funds_currency}`,
        main_obstacles: context.current_situation.obstacles,
        key_strengths: context.current_situation.strengths,
        us_connections: context.current_situation.us_connections || []
      },
      progress_summary: {
        overall_progress: `${context.progress_tracking.overall_progress_percentage}%`,
        current_phase: context.progress_tracking.current_phase,
        goals_completed: `${context.progress_tracking.goals_completed}/${context.progress_tracking.goals_total}`,
        next_action: context.progress_tracking.next_recommended_action,
        blockers: context.progress_tracking.blockers
      },
      recent_activities: {
        dreams_created: context.dream_goals.length,
        visa_analyses: context.visa_analyses.length,
        specialist_sessions: context.specialist_interactions.length
      },
      ai_insights: {
        confidence: context.ai_insights.confidence_score,
        success_probability: context.ai_insights.success_probability,
        key_insights: context.ai_insights.key_insights,
        recommended_focus: context.ai_insights.recommended_focus_areas
      },
      data_quality: {
        completeness_score: validation.completeness_score,
        missing_data: validation.required_fields_missing,
        suggestions: validation.suggested_improvements
      }
    };

    return JSON.stringify(aiContext, null, 2);
  }

  // Private helper methods
  private applyUpdate(context: UserContext, update: ContextUpdate): UserContext {
    const updatedContext = { ...context };
    
    switch (update.operation) {
      case 'update':
        if (update.section in updatedContext) {
          const currentSection = updatedContext[update.section] as any;
          const newData = update.data as any;
          (updatedContext as any)[update.section] = { ...currentSection, ...newData };
        }
        break;
      case 'append':
        if (Array.isArray(updatedContext[update.section])) {
          (updatedContext[update.section] as any[]).push(update.data);
        }
        break;
      case 'delete':
        if (Array.isArray(updatedContext[update.section])) {
          const array = updatedContext[update.section] as any[];
          const index = array.findIndex(item => item.id === update.data.id);
          if (index > -1) {
            array.splice(index, 1);
          }
        }
        break;
    }

    return updatedContext;
  }

  private calculateCompletenessScore(context: UserContext): number {
    let score = 0;
    let maxScore = 0;

    // Profile completeness (30 points)
    maxScore += 30;
    if (context.profile.name?.trim()) score += 5;
    if (context.profile.age && context.profile.age > 0) score += 3;
    if (context.profile.profession?.trim()) score += 5;
    if (context.profile.experience_years && context.profile.experience_years > 0) score += 3;
    if (context.profile.education_level) score += 4;
    if (context.profile.english_level) score += 3;
    if (context.profile.current_country?.trim()) score += 2;
    if (context.profile.email?.trim()) score += 2;
    if (context.profile.marital_status) score += 2;
    if (context.profile.children_count !== undefined) score += 1;

    // Immigration goals completeness (25 points)
    maxScore += 25;
    if (context.immigration_goals.primary_objective?.trim()) score += 8;
    if (context.immigration_goals.category) score += 3;
    if (context.immigration_goals.timeline?.trim()) score += 5;
    if (context.immigration_goals.priority) score += 2;
    if (context.immigration_goals.motivation?.trim()) score += 4;
    if (context.immigration_goals.target_states?.length) score += 2;
    if (context.immigration_goals.success_criteria?.length) score += 1;

    // Current situation completeness (20 points)
    maxScore += 20;
    if (context.current_situation.employment_status) score += 3;
    if (context.current_situation.available_funds > 0) score += 5;
    if (context.current_situation.obstacles?.length) score += 3;
    if (context.current_situation.strengths?.length) score += 3;
    if (context.current_situation.current_salary && context.current_situation.current_salary > 0) score += 2;
    if (context.current_situation.us_connections?.length) score += 2;
    if (context.current_situation.previous_visa_attempts?.length) score += 2;

    // Activities completeness (25 points)
    maxScore += 25;
    if (context.dream_goals.length > 0) score += 10;
    if (context.visa_analyses.length > 0) score += 10;
    if (context.specialist_interactions.length > 0) score += 5;

    return Math.round((score / maxScore) * 100);
  }

  private filterContextSections(context: UserContext, sections: (keyof UserContext)[]): Partial<UserContext> {
    const filtered: Partial<UserContext> = {};
    for (const section of sections) {
      if (section in context) {
        (filtered as any)[section] = (context as any)[section];
      }
    }
    return filtered;
  }

  private generateContextSummary(context: UserContext): string {
    const profile = context.profile;
    const goals = context.immigration_goals;
    const situation = context.current_situation;
    
    return `${profile.name || 'User'} is a ${profile.age || 'N/A'}-year-old ${profile.profession || 'professional'} from ${profile.current_country || 'unknown location'} seeking to ${goals.primary_objective || 'immigrate to the USA'} with a ${goals.priority || 'medium'} priority timeline of ${goals.timeline || 'unspecified'}. Current situation includes ${situation.available_funds || 0} ${situation.available_funds_currency || 'USD'} in available funds and ${situation.employment_status || 'unknown employment status'}. Progress: ${context.progress_tracking.overall_progress_percentage}% complete with ${context.dream_goals.length} dreams and ${context.visa_analyses.length} visa analyses.`;
  }

  private extractKeyPoints(context: UserContext): string[] {
    const points: string[] = [];
    
    if (context.profile.profession) {
      points.push(`Professional: ${context.profile.profession}`);
    }
    if (context.immigration_goals.primary_objective) {
      points.push(`Goal: ${context.immigration_goals.primary_objective}`);
    }
    if (context.current_situation.available_funds > 0) {
      points.push(`Budget: ${context.current_situation.available_funds} ${context.current_situation.available_funds_currency}`);
    }
    if (context.progress_tracking.current_phase) {
      points.push(`Phase: ${context.progress_tracking.current_phase}`);
    }
    if (context.ai_insights.success_probability > 0) {
      points.push(`Success Probability: ${context.ai_insights.success_probability}%`);
    }

    return points;
  }

  private generateRecommendations(context: UserContext): string[] {
    const recommendations: string[] = [];
    
    if (context.data_completeness_score < 50) {
      recommendations.push('Complete your profile information for better recommendations');
    }
    if (context.dream_goals.length === 0) {
      recommendations.push('Create your first dream using the Criador de Sonhos tool');
    }
    if (context.visa_analyses.length === 0) {
      recommendations.push('Analyze your visa options using VisaMatch');
    }
    if (context.specialist_interactions.length === 0) {
      recommendations.push('Consider scheduling a consultation with an immigration specialist');
    }
    if (context.progress_tracking.blockers.length > 0) {
      recommendations.push('Address current blockers to continue progress');
    }

    return recommendations;
  }

  private identifyMissingData(context: UserContext): string[] {
    const missing: string[] = [];
    
    if (!context.profile.name?.trim()) missing.push('Full name');
    if (!context.profile.age) missing.push('Age');
    if (!context.profile.profession?.trim()) missing.push('Profession');
    if (!context.immigration_goals.primary_objective?.trim()) missing.push('Primary immigration objective');
    if (!context.immigration_goals.timeline?.trim()) missing.push('Target timeline');
    if (context.current_situation.available_funds <= 0) missing.push('Available funds information');

    return missing;
  }

  private async updateLastAccessed(userId: string): Promise<void> {
    try {
      await supabase
        .from(this.TABLE_NAME)
        .update({ last_accessed: new Date().toISOString() })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error updating last accessed:', error);
    }
  }

  private async logContextUpdate(update: ContextUpdate, userId: string): Promise<void> {
    try {
      await supabase
        .from(this.HISTORY_TABLE_NAME)
        .insert([{
          user_id: userId,
          operation: update.operation,
          section: update.section,
          data: update.data,
          timestamp: update.timestamp,
          source: update.source,
          reason: update.reason
        }]);
    } catch (error) {
      console.error('Error logging context update:', error);
    }
  }
}

// Create singleton instance
export const userContextService = new UserContextService();

export default userContextService;
