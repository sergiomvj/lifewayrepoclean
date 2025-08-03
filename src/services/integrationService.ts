import { 
  UnifiedUserProfile,
  UnifiedImmigrationGoals,
  UnifiedFinancialSituation,
  ConsolidatedAnalysis,
  ConsolidatedInsights,
  IntegratedRecommendation,
  OverallScore,
  DataMapper,
  DreamsToContextMapper,
  VisaMatchToContextMapper,
  ContextToUnifiedProfileMapper,
  IntegrationWorkflow,
  WorkflowStep,
  EnhancedSpecialistContext,
  RiskFactor,
  ActionStep
} from '@/types/shared';
import {
  CriadorSonhosFormData,
  VisaMatchFormData,
  CriadorSonhosResponse,
  VisaMatchResponse
} from '@/types/forms';
import { UserContext } from '@/types/userContext';
import { userContextService } from './userContextService';
import { supabase } from '@/integrations/supabase/client';

class IntegrationService {
  
  // ===== DATA MAPPERS =====
  
  // Map Dreams form data to UserContext
  private dreamsToContextMapper: DreamsToContextMapper = {
    map: (dreamsData: CriadorSonhosFormData): Partial<UserContext> => {
      const now = new Date().toISOString();
      
      return {
        profile: {
          id: dreamsData.user_id || '',
          name: dreamsData.nome,
          age: parseInt(dreamsData.idade) || 0,
          profession: dreamsData.profissao,
          experience_years: parseInt(dreamsData.experiencia) || 0,
          education_level: 'bachelor', // Default, could be enhanced
          english_level: 'intermediate', // Default, could be enhanced
          current_country: 'Brazil', // Default
          created_at: now,
          updated_at: now
        },
        immigration_goals: {
          primary_objective: dreamsData.objetivo_principal,
          category: dreamsData.categoria === 'outro' ? 'outros' : dreamsData.categoria,
          timeline: dreamsData.timeline,
          priority: dreamsData.prioridade,
          motivation: dreamsData.motivacao,
          target_states: dreamsData.cidades_interesse || [],
          success_criteria: []
        },
        current_situation: {
          employment_status: 'employed', // Default
          available_funds: 0, // To be filled from recursos_disponiveis
          available_funds_currency: 'USD',
          obstacles: dreamsData.obstaculos ? [dreamsData.obstaculos] : [],
          strengths: []
        }
      };
    },
    
    validate: (data: CriadorSonhosFormData): boolean => {
      return !!(data.nome && data.profissao && data.objetivo_principal);
    }
  };

  // Map VisaMatch form data to UserContext
  private visaMatchToContextMapper: VisaMatchToContextMapper = {
    map: (visaData: VisaMatchFormData): Partial<UserContext> => {
      const now = new Date().toISOString();
      
      return {
        profile: {
          id: visaData.user_id || '',
          name: visaData.personal_info.full_name,
          age: visaData.personal_info.age,
          profession: visaData.professional_info.current_occupation,
          experience_years: visaData.professional_info.years_experience,
          education_level: visaData.personal_info.education_level,
          english_level: this.mapLanguageLevel(visaData.personal_info.languages),
          current_country: visaData.personal_info.nationality,
          marital_status: visaData.personal_info.marital_status,
          children_count: visaData.family_info.children.length,
          created_at: now,
          updated_at: now
        },
        immigration_goals: {
          primary_objective: visaData.goals_info.primary_goal,
          category: this.mapTravelPurpose(visaData.travel_info.purpose),
          timeline: `${visaData.travel_info.intended_duration} months`,
          priority: 'alta', // Default based on VisaMatch usage
          motivation: visaData.goals_info.primary_goal,
          target_states: visaData.travel_info.preferred_states,
          success_criteria: visaData.goals_info.career_goals
        },
        current_situation: {
          employment_status: this.mapEmploymentStatus(visaData.professional_info),
          available_funds: visaData.financial_info.liquid_assets,
          available_funds_currency: 'USD',
          obstacles: [],
          strengths: visaData.professional_info.skills,
          current_salary: visaData.professional_info.annual_income,
          current_salary_currency: 'USD',
          us_connections: this.mapUSConnections(visaData),
          previous_visa_attempts: this.mapVisaHistory(visaData.travel_info)
        }
      };
    },
    
    validate: (data: VisaMatchFormData): boolean => {
      return !!(data.personal_info?.full_name && 
               data.professional_info?.current_occupation && 
               data.goals_info?.primary_goal);
    }
  };

  // Map UserContext to UnifiedUserProfile
  private contextToUnifiedProfileMapper: ContextToUnifiedProfileMapper = {
    map: (context: UserContext): UnifiedUserProfile => {
      return {
        id: context.user_id,
        name: context.profile.name,
        age: context.profile.age || 0,
        email: context.profile.email,
        current_country: context.profile.current_country,
        current_city: context.profile.current_city,
        profession: context.profile.profession,
        experience_years: context.profile.experience_years || 0,
        annual_income: context.current_situation.current_salary,
        skills: context.current_situation.strengths || [],
        certifications: [],
        education_level: context.profile.education_level,
        languages: [{
          language: 'English',
          level: context.profile.english_level,
          certifications: []
        }],
        english_level: context.profile.english_level,
        marital_status: context.profile.marital_status || 'single',
        family_composition: {
          adults: 1,
          children: [],
          dependents: []
        },
        created_at: context.created_at,
        updated_at: context.updated_at
      };
    },
    
    validate: (data: UserContext): boolean => {
      return !!(data.profile?.name && data.profile?.profession);
    }
  };

  // ===== INTEGRATION METHODS =====

  // Create consolidated analysis from Dreams and VisaMatch data
  async createConsolidatedAnalysis(
    userId: string,
    dreamsData?: CriadorSonhosFormData,
    dreamsAnalysis?: CriadorSonhosResponse,
    visaData?: VisaMatchFormData,
    visaAnalysis?: VisaMatchResponse
  ): Promise<ConsolidatedAnalysis> {
    
    // Get or create user context
    let userContext = await userContextService.getContext(userId);
    if (!userContext) {
      // Create initial context from available data
      const initialData: Partial<UserContext> = {};
      
      if (dreamsData) {
        const dreamsContext = this.dreamsToContextMapper.map(dreamsData);
        Object.assign(initialData, dreamsContext);
      }
      
      if (visaData) {
        const visaContext = this.visaMatchToContextMapper.map(visaData);
        Object.assign(initialData, visaContext);
      }
      
      const newContext = await userContextService.createContext(userId, initialData);
      userContext = { context: newContext } as any;
    }

    const now = new Date().toISOString();
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Generate consolidated insights
    const consolidatedInsights = this.generateConsolidatedInsights(
      dreamsData,
      dreamsAnalysis,
      visaData,
      visaAnalysis,
      userContext.context as UserContext
    );

    // Generate integrated recommendations
    const integratedRecommendations = this.generateIntegratedRecommendations(
      consolidatedInsights,
      dreamsAnalysis,
      visaAnalysis
    );

    // Calculate overall score
    const overallScore = this.calculateOverallScore(
      dreamsData,
      visaData,
      consolidatedInsights,
      userContext.context as UserContext
    );

    const consolidatedAnalysis: ConsolidatedAnalysis = {
      id: analysisId,
      user_id: userId,
      created_at: now,
      updated_at: now,
      dreams_data: dreamsData,
      visamatch_data: visaData,
      user_context: userContext.context as UserContext,
      dreams_analysis: dreamsAnalysis,
      visa_analysis: visaAnalysis,
      consolidated_insights: consolidatedInsights,
      integrated_recommendations: integratedRecommendations,
      overall_score: overallScore,
      analysis_status: 'complete',
      specialist_reviewed: false
    };

    // Save to database
    await this.saveConsolidatedAnalysis(consolidatedAnalysis);

    return consolidatedAnalysis;
  }

  // Generate consolidated insights
  private generateConsolidatedInsights(
    dreamsData?: CriadorSonhosFormData,
    dreamsAnalysis?: CriadorSonhosResponse,
    visaData?: VisaMatchFormData,
    visaAnalysis?: VisaMatchResponse,
    userContext?: UserContext
  ): ConsolidatedInsights {
    
    const profileStrengths: string[] = [];
    const profileChallenges: string[] = [];
    const profileUniqueness: string[] = [];
    const majorRisks: RiskFactor[] = [];
    const hiddenOpportunities: string[] = [];
    const alternativePaths: string[] = [];

    // Analyze profile strengths
    if (userContext?.profile.experience_years && userContext.profile.experience_years > 5) {
      profileStrengths.push('Experiência profissional sólida');
    }
    if (userContext?.profile.education_level === 'master' || userContext?.profile.education_level === 'phd') {
      profileStrengths.push('Alta qualificação educacional');
    }
    if (userContext?.profile.english_level === 'advanced' || userContext?.profile.english_level === 'native') {
      profileStrengths.push('Excelente nível de inglês');
    }
    if (userContext?.current_situation.available_funds && userContext.current_situation.available_funds > 50000) {
      profileStrengths.push('Recursos financeiros adequados');
    }

    // Analyze challenges
    if (userContext?.current_situation.obstacles && userContext.current_situation.obstacles.length > 0) {
      profileChallenges.push(...userContext.current_situation.obstacles);
    }
    if (userContext?.profile.english_level === 'basic') {
      profileChallenges.push('Necessidade de melhorar o inglês');
    }
    if (userContext?.current_situation.available_funds && userContext.current_situation.available_funds < 20000) {
      profileChallenges.push('Recursos financeiros limitados');
    }

    // Calculate alignment between dreams and visa goals
    let dreamsVisaAlignment = 50; // Default
    if (dreamsData && visaData) {
      // Compare objectives
      if (dreamsData.objetivo_principal.toLowerCase().includes('trabalh') && 
          visaData.travel_info.purpose === 'work') {
        dreamsVisaAlignment += 30;
      }
      // Compare timelines
      if (dreamsData.timeline && visaData.travel_info.intended_duration) {
        dreamsVisaAlignment += 10;
      }
      // Compare priorities
      if (dreamsData.prioridade === 'alta') {
        dreamsVisaAlignment += 10;
      }
    }

    // Identify risks
    if (userContext?.current_situation.available_funds && userContext.current_situation.available_funds < 10000) {
      majorRisks.push({
        category: 'financial',
        risk: 'Recursos financeiros insuficientes',
        severity: 'high',
        probability: 'likely',
        impact: 'Pode impedir ou atrasar significativamente o processo de imigração',
        mitigation: ['Desenvolver plano de poupança', 'Buscar financiamento', 'Considerar opções de menor custo']
      });
    }

    if (userContext?.profile.english_level === 'basic') {
      majorRisks.push({
        category: 'personal',
        risk: 'Barreira do idioma',
        severity: 'medium',
        probability: 'certain',
        impact: 'Dificuldades na adaptação e oportunidades profissionais limitadas',
        mitigation: ['Curso intensivo de inglês', 'Certificação internacional', 'Prática conversacional']
      });
    }

    // Identify opportunities
    if (userContext?.profile.profession.toLowerCase().includes('tecnologia') || 
        userContext?.profile.profession.toLowerCase().includes('engenharia')) {
      hiddenOpportunities.push('Setor de alta demanda nos EUA');
      alternativePaths.push('Visto H-1B para profissionais especializados');
    }

    if (userContext?.current_situation.us_connections && userContext.current_situation.us_connections.length > 0) {
      hiddenOpportunities.push('Rede de contatos nos EUA para facilitar transição');
    }

    return {
      profile_strengths: profileStrengths,
      profile_challenges: profileChallenges,
      profile_uniqueness: profileUniqueness,
      dreams_visa_alignment: Math.min(dreamsVisaAlignment, 100),
      alignment_analysis: `Alinhamento de ${dreamsVisaAlignment}% entre sonhos e estratégia de visto`,
      potential_conflicts: [],
      overall_feasibility: this.calculateFeasibility(userContext, dreamsData, visaData),
      timeline_realism: this.assessTimelineRealism(dreamsData, visaData),
      resource_adequacy: this.assessResourceAdequacy(userContext),
      major_risks: majorRisks,
      mitigation_strategies: majorRisks.flatMap(risk => risk.mitigation),
      hidden_opportunities: hiddenOpportunities,
      alternative_paths: alternativePaths,
      leverage_points: profileStrengths
    };
  }

  // Generate integrated recommendations
  private generateIntegratedRecommendations(
    insights: ConsolidatedInsights,
    dreamsAnalysis?: CriadorSonhosResponse,
    visaAnalysis?: VisaMatchResponse
  ): IntegratedRecommendation[] {
    
    const recommendations: IntegratedRecommendation[] = [];
    let recId = 1;

    // Financial preparation recommendation
    if (insights.resource_adequacy === 'insufficient') {
      recommendations.push({
        id: `rec_${recId++}`,
        type: 'immediate',
        category: 'financial',
        title: 'Fortalecer Situação Financeira',
        description: 'Desenvolver estratégia para aumentar recursos disponíveis para imigração',
        rationale: 'Recursos financeiros insuficientes identificados como risco principal',
        action_steps: [
          {
            id: 'step_1',
            step_number: 1,
            title: 'Auditoria Financeira Completa',
            description: 'Mapear todas as fontes de renda e despesas',
            estimated_duration: '1 semana',
            required_resources: ['Planilhas financeiras', 'Extratos bancários'],
            completion_criteria: ['Orçamento detalhado criado', 'Metas de economia definidas'],
            status: 'pending'
          },
          {
            id: 'step_2',
            step_number: 2,
            title: 'Plano de Poupança Agressivo',
            description: 'Implementar estratégias para maximizar economia mensal',
            estimated_duration: '6 meses',
            required_resources: ['Disciplina financeira', 'Possíveis fontes de renda extra'],
            completion_criteria: ['Meta mensal de economia atingida', 'Fundo de imigração estabelecido'],
            status: 'pending'
          }
        ],
        timeline: '6-12 meses',
        priority: 'critical',
        prerequisites: [],
        dependencies: [],
        estimated_cost: 0,
        required_time: '6-12 meses',
        required_resources: ['Disciplina financeira', 'Possível consultoria financeira'],
        status: 'not_started',
        progress_percentage: 0,
        source_tool: 'integrated',
        confidence_level: 90
      });
    }

    // English improvement recommendation
    if (insights.profile_challenges.includes('Necessidade de melhorar o inglês')) {
      recommendations.push({
        id: `rec_${recId++}`,
        type: 'short_term',
        category: 'personal',
        title: 'Aprimoramento do Inglês',
        description: 'Programa intensivo para alcançar nível avançado de inglês',
        rationale: 'Inglês avançado é crucial para sucesso profissional e integração nos EUA',
        action_steps: [
          {
            id: 'step_1',
            step_number: 1,
            title: 'Avaliação de Nível Atual',
            description: 'Teste de proficiência para estabelecer baseline',
            estimated_duration: '1 dia',
            required_resources: ['Teste online ou presencial'],
            completion_criteria: ['Nível atual documentado', 'Plano de estudos personalizado'],
            status: 'pending'
          },
          {
            id: 'step_2',
            step_number: 2,
            title: 'Curso Intensivo',
            description: 'Matrícula em curso focado em business English',
            estimated_duration: '6 meses',
            required_resources: ['Curso de inglês', 'Tempo para estudos diários'],
            completion_criteria: ['Certificação internacional obtida', 'Conversação fluente'],
            status: 'pending'
          }
        ],
        timeline: '6-9 meses',
        priority: 'high',
        prerequisites: [],
        dependencies: [],
        estimated_cost: 3000,
        required_time: '6-9 meses',
        required_resources: ['Curso de inglês', 'Material didático', 'Tempo de estudo'],
        status: 'not_started',
        progress_percentage: 0,
        source_tool: 'integrated',
        confidence_level: 85
      });
    }

    // Professional development recommendation
    if (insights.hidden_opportunities.includes('Setor de alta demanda nos EUA')) {
      recommendations.push({
        id: `rec_${recId++}`,
        type: 'long_term',
        category: 'professional',
        title: 'Especialização Profissional',
        description: 'Desenvolver competências específicas valorizadas no mercado americano',
        rationale: 'Profissão em setor de alta demanda oferece melhores oportunidades de visto',
        action_steps: [
          {
            id: 'step_1',
            step_number: 1,
            title: 'Pesquisa de Mercado',
            description: 'Identificar competências mais valorizadas na sua área nos EUA',
            estimated_duration: '2 semanas',
            required_resources: ['Pesquisa online', 'Networking profissional'],
            completion_criteria: ['Lista de competências prioritárias', 'Plano de desenvolvimento'],
            status: 'pending'
          }
        ],
        timeline: '12-18 meses',
        priority: 'medium',
        prerequisites: [],
        dependencies: [],
        estimated_cost: 5000,
        required_time: '12-18 meses',
        required_resources: ['Cursos especializados', 'Certificações'],
        status: 'not_started',
        progress_percentage: 0,
        source_tool: 'integrated',
        confidence_level: 75
      });
    }

    return recommendations;
  }

  // Calculate overall score
  private calculateOverallScore(
    dreamsData?: CriadorSonhosFormData,
    visaData?: VisaMatchFormData,
    insights?: ConsolidatedInsights,
    userContext?: UserContext
  ): OverallScore {
    
    // Component scores
    const dreamsScore = dreamsData ? 75 : 0; // Simplified scoring
    const visaFeasibilityScore = insights?.overall_feasibility || 50;
    const financialReadinessScore = this.calculateFinancialScore(userContext);
    const preparationScore = this.calculatePreparationScore(userContext);
    const timelineScore = insights?.timeline_realism === 'realistic' ? 80 : 
                         insights?.timeline_realism === 'optimistic' ? 60 : 40;

    // Calculate weighted overall score
    const weights = {
      dreams: 0.15,
      visa: 0.25,
      financial: 0.25,
      preparation: 0.20,
      timeline: 0.15
    };

    const overallReadiness = Math.round(
      dreamsScore * weights.dreams +
      visaFeasibilityScore * weights.visa +
      financialReadinessScore * weights.financial +
      preparationScore * weights.preparation +
      timelineScore * weights.timeline
    );

    const successProbability = Math.min(overallReadiness + 10, 95); // Slightly optimistic

    return {
      dreams_score: dreamsScore,
      visa_feasibility_score: visaFeasibilityScore,
      financial_readiness_score: financialReadinessScore,
      preparation_score: preparationScore,
      timeline_score: timelineScore,
      overall_readiness: overallReadiness,
      success_probability: successProbability,
      score_breakdown: [
        {
          category: 'Sonhos e Objetivos',
          current_score: dreamsScore,
          max_possible: 100,
          weight: weights.dreams,
          contributing_factors: ['Clareza dos objetivos', 'Motivação', 'Planejamento'],
          improvement_potential: 100 - dreamsScore
        },
        {
          category: 'Viabilidade do Visto',
          current_score: visaFeasibilityScore,
          max_possible: 100,
          weight: weights.visa,
          contributing_factors: ['Qualificações', 'Experiência', 'Adequação ao perfil'],
          improvement_potential: 100 - visaFeasibilityScore
        }
      ],
      improvement_areas: [
        {
          area: 'Preparação Financeira',
          current_score: financialReadinessScore,
          target_score: 85,
          impact_on_overall: 25,
          recommended_actions: ['Aumentar poupança', 'Reduzir dívidas', 'Diversificar renda'],
          estimated_timeline: '6-12 meses'
        }
      ],
      percentile_ranking: Math.min(overallReadiness + 5, 95),
      similar_success_rate: Math.max(successProbability - 10, 30)
    };
  }

  // ===== HELPER METHODS =====

  private mapLanguageLevel(languages: any[]): 'basic' | 'intermediate' | 'advanced' | 'native' {
    const englishLang = languages?.find(lang => lang.language.toLowerCase().includes('english'));
    return englishLang?.proficiency || 'intermediate';
  }

  private mapTravelPurpose(purpose: string): 'trabalho' | 'estudo' | 'investimento' | 'familia' | 'outros' {
    const purposeMap: Record<string, any> = {
      'work': 'trabalho',
      'study': 'estudo',
      'investment': 'investimento',
      'family': 'familia'
    };
    return purposeMap[purpose] || 'outros';
  }

  private mapEmploymentStatus(professionalInfo: any): 'employed' | 'unemployed' | 'self_employed' | 'student' {
    // Simplified mapping - could be enhanced with more data
    return 'employed';
  }

  private mapUSConnections(visaData: VisaMatchFormData): any[] {
    // Extract US connections from visa data
    return [];
  }

  private mapVisaHistory(travelInfo: any): any[] {
    if (travelInfo.visa_rejections > 0) {
      return [{
        visa_type: 'Unknown',
        application_date: 'Unknown',
        status: 'denied',
        denial_reason: 'Previous rejection mentioned'
      }];
    }
    return [];
  }

  private calculateFeasibility(userContext?: UserContext, dreamsData?: any, visaData?: any): number {
    let score = 50; // Base score
    
    if (userContext?.profile.experience_years && userContext.profile.experience_years > 5) score += 15;
    if (userContext?.profile.education_level === 'master' || userContext?.profile.education_level === 'phd') score += 15;
    if (userContext?.current_situation.available_funds && userContext.current_situation.available_funds > 30000) score += 20;
    
    return Math.min(score, 100);
  }

  private assessTimelineRealism(dreamsData?: any, visaData?: any): 'realistic' | 'optimistic' | 'challenging' {
    // Simplified assessment
    return 'realistic';
  }

  private assessResourceAdequacy(userContext?: UserContext): 'sufficient' | 'adequate' | 'insufficient' {
    const funds = userContext?.current_situation.available_funds || 0;
    if (funds > 50000) return 'sufficient';
    if (funds > 20000) return 'adequate';
    return 'insufficient';
  }

  private calculateFinancialScore(userContext?: UserContext): number {
    const funds = userContext?.current_situation.available_funds || 0;
    const income = userContext?.current_situation.current_salary || 0;
    
    let score = 0;
    if (funds > 50000) score += 40;
    else if (funds > 20000) score += 25;
    else if (funds > 10000) score += 15;
    
    if (income > 100000) score += 30;
    else if (income > 50000) score += 20;
    else if (income > 30000) score += 10;
    
    return Math.min(score, 100);
  }

  private calculatePreparationScore(userContext?: UserContext): number {
    let score = 30; // Base score
    
    if (userContext?.profile.english_level === 'advanced' || userContext?.profile.english_level === 'native') score += 25;
    else if (userContext?.profile.english_level === 'intermediate') score += 15;
    
    if (userContext?.dream_goals && userContext.dream_goals.length > 0) score += 20;
    if (userContext?.visa_analyses && userContext.visa_analyses.length > 0) score += 25;
    
    return Math.min(score, 100);
  }

  // Save consolidated analysis to database
  private async saveConsolidatedAnalysis(analysis: ConsolidatedAnalysis): Promise<void> {
    try {
      const { error } = await supabase
        .from('consolidated_analyses')
        .insert([analysis]);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving consolidated analysis:', error);
      throw new Error('Failed to save consolidated analysis');
    }
  }

  // ===== PUBLIC API =====

  // Get consolidated analysis by user ID
  async getConsolidatedAnalysis(userId: string): Promise<ConsolidatedAnalysis | null> {
    try {
      const { data, error } = await supabase
        .from('consolidated_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data as ConsolidatedAnalysis;
    } catch (error) {
      console.error('Error fetching consolidated analysis:', error);
      return null;
    }
  }

  // Create unified user profile
  async createUnifiedProfile(userId: string): Promise<UnifiedUserProfile | null> {
    const contextResponse = await userContextService.getContext(userId);
    if (!contextResponse) return null;

    return this.contextToUnifiedProfileMapper.map(contextResponse.context as UserContext);
  }

  // Sync data between Dreams and VisaMatch
  async syncToolsData(userId: string): Promise<boolean> {
    try {
      const contextResponse = await userContextService.getContext(userId);
      if (!contextResponse) return false;

      // Update context with latest data from both tools
      // This would involve fetching latest Dreams and VisaMatch submissions
      // and updating the user context accordingly

      return true;
    } catch (error) {
      console.error('Error syncing tools data:', error);
      return false;
    }
  }
}

// Create singleton instance
export const integrationService = new IntegrationService();

export default integrationService;
