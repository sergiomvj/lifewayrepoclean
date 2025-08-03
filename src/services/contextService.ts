import { UserContext, ContextUpdate, ContextQuery, ContextResponse } from '@/types/userContext';
import { CriadorSonhosFormData } from '@/types/forms';
import { supabase } from '@/integrations/supabase/client';

interface SpecialistContextData {
  user_id: string;
  timestamp: string;
  visamatch_analysis: {
    recommended_strategy: string;
    probability_score: number;
    requirements: string[];
    timeline: string;
    investment_needed: string;
    strategies: Array<{
      type: string;
      probability: number;
      timeline: string;
      requirements: string[];
      benefits: string[];
      risks: string[];
    }>;
  };
  family_profile: {
    composition: {
      adults: number;
      children: Array<{ age: number }>;
    };
    professional: {
      primary_applicant: any;
      spouse?: any;
    };
    goals: {
      primary: string;
      secondary: string[];
    };
    resources: {
      financial: 'low' | 'medium' | 'high';
      time_flexibility: 'low' | 'medium' | 'high';
    };
  };
  dreams_analysis?: {
    family_overview: string;
    dream_mapping: string;
    transformation_scenarios: string[];
    timeline: string;
    practical_tools: string[];
  };
  specialist_session: {
    session_id?: string;
    start_time?: string;
    status: 'pending' | 'active' | 'completed';
    specialist_id?: string;
    topics_to_discuss: string[];
    priority_level: 'low' | 'medium' | 'high' | 'urgent';
  };
}

class ContextService {
  /**
   * Cria contexto JSON estruturado para IA especialista
   */
  async createSpecialistContext(userId: string): Promise<SpecialistContextData> {
    try {
      // Buscar dados do usuário
      const userContext = await this.getUserContext(userId);
      const visaMatchResults = await this.getLatestVisaMatchAnalysis(userId);
      const dreamsData = await this.getLatestDreamsAnalysis(userId);

      // Estruturar contexto para especialista
      const specialistContext: SpecialistContextData = {
        user_id: userId,
        timestamp: new Date().toISOString(),
        
        visamatch_analysis: {
          recommended_strategy: visaMatchResults?.top_recommendation?.visa_type || 'H-1B',
          probability_score: visaMatchResults?.top_recommendation?.match_percentage || 0,
          requirements: visaMatchResults?.top_recommendation?.requirements || [],
          timeline: visaMatchResults?.top_recommendation?.timeline || '12-18 meses',
          investment_needed: visaMatchResults?.top_recommendation?.estimated_cost || '$15,000',
          strategies: visaMatchResults?.recommendations?.map(rec => ({
            type: rec.visa_type,
            probability: rec.match_percentage,
            timeline: rec.timeline,
            requirements: rec.requirements,
            benefits: rec.pros,
            risks: rec.cons
          })) || []
        },

        family_profile: {
          composition: {
            adults: this.calculateAdults(userContext),
            children: this.extractChildren(userContext)
          },
          professional: {
            primary_applicant: {
              profession: userContext?.profile?.profession,
              experience_years: userContext?.profile?.experience_years,
              education_level: userContext?.profile?.education_level,
              english_level: userContext?.profile?.english_level
            },
            spouse: userContext?.current_situation?.us_connections?.find(c => c.type === 'family')
          },
          goals: {
            primary: userContext?.immigration_goals?.primary_objective || 'career_advancement',
            secondary: userContext?.immigration_goals?.success_criteria || []
          },
          resources: {
            financial: this.categorizeFinancialResources(userContext?.current_situation?.available_funds),
            time_flexibility: this.categorizeTimeFlexibility(userContext?.immigration_goals?.timeline)
          }
        },

        dreams_analysis: dreamsData ? {
          family_overview: dreamsData.family_overview || '',
          dream_mapping: dreamsData.dream_mapping || '',
          transformation_scenarios: dreamsData.scenarios || [],
          timeline: dreamsData.timeline || '',
          practical_tools: dreamsData.tools || []
        } : undefined,

        specialist_session: {
          status: 'pending',
          topics_to_discuss: this.generateDiscussionTopics(visaMatchResults, userContext),
          priority_level: this.calculatePriorityLevel(userContext, visaMatchResults)
        }
      };

      // Salvar contexto na base de dados
      await this.saveSpecialistContext(userId, specialistContext);

      return specialistContext;
    } catch (error) {
      console.error('Erro ao criar contexto do especialista:', error);
      throw new Error('Falha na criação do contexto para especialista');
    }
  }

  /**
   * Atualiza contexto com novos dados do VisaMatch
   */
  async updateContextWithVisaMatch(
    userId: string, 
    visaMatchResults: any
  ): Promise<SpecialistContextData> {
    try {
      const existingContext = await this.getSpecialistContext(userId);
      
      const updatedContext: SpecialistContextData = {
        ...existingContext,
        timestamp: new Date().toISOString(),
        visamatch_analysis: {
          recommended_strategy: visaMatchResults.top_recommendation?.visa_type || 'H-1B',
          probability_score: visaMatchResults.top_recommendation?.match_percentage || 0,
          requirements: visaMatchResults.top_recommendation?.requirements || [],
          timeline: visaMatchResults.top_recommendation?.timeline || '12-18 meses',
          investment_needed: visaMatchResults.top_recommendation?.estimated_cost || '$15,000',
          strategies: visaMatchResults.recommendations?.map((rec: any) => ({
            type: rec.visa_type,
            probability: rec.match_percentage,
            timeline: rec.timeline,
            requirements: rec.requirements,
            benefits: rec.pros,
            risks: rec.cons
          })) || []
        },
        specialist_session: {
          ...existingContext.specialist_session,
          topics_to_discuss: this.generateDiscussionTopics(visaMatchResults, null),
          priority_level: this.calculatePriorityFromVisaMatch(visaMatchResults)
        }
      };

      await this.saveSpecialistContext(userId, updatedContext);
      return updatedContext;
    } catch (error) {
      console.error('Erro ao atualizar contexto com VisaMatch:', error);
      throw error;
    }
  }

  /**
   * Atualiza contexto com dados do Criador de Sonhos
   */
  async updateContextWithDreams(
    userId: string,
    formData: CriadorSonhosFormData,
    aiAnalysis: string
  ): Promise<SpecialistContextData> {
    try {
      const existingContext = await this.getSpecialistContext(userId);
      const parsedAnalysis = this.parseAIAnalysis(aiAnalysis);

      const updatedContext: SpecialistContextData = {
        ...existingContext,
        timestamp: new Date().toISOString(),
        dreams_analysis: {
          family_overview: parsedAnalysis.familyOverview || '',
          dream_mapping: parsedAnalysis.dreamMapping || '',
          transformation_scenarios: parsedAnalysis.scenarios || [],
          timeline: parsedAnalysis.timeline || '',
          practical_tools: parsedAnalysis.tools || []
        },
        family_profile: {
          ...existingContext.family_profile,
          composition: {
            adults: this.extractAdultsFromForm(formData),
            children: this.extractChildrenFromForm(formData)
          },
          goals: {
            primary: formData.objetivo_principal || existingContext.family_profile.goals.primary,
            secondary: formData.detalhes_especificos ? [formData.detalhes_especificos] : existingContext.family_profile.goals.secondary
          }
        }
      };

      await this.saveSpecialistContext(userId, updatedContext);
      return updatedContext;
    } catch (error) {
      console.error('Erro ao atualizar contexto com Dreams:', error);
      throw error;
    }
  }

  /**
   * Prepara contexto otimizado para chat com especialista
   */
  async prepareForSpecialistChat(userId: string, specialistId: string): Promise<{
    context: SpecialistContextData;
    briefing: string;
    suggestedQuestions: string[];
    riskFactors: string[];
    opportunities: string[];
  }> {
    try {
      const context = await this.getSpecialistContext(userId);
      
      // Gerar briefing automático
      const briefing = this.generateSpecialistBriefing(context);
      
      // Sugerir perguntas baseadas no contexto
      const suggestedQuestions = this.generateSuggestedQuestions(context);
      
      // Identificar fatores de risco
      const riskFactors = this.identifyRiskFactors(context);
      
      // Identificar oportunidades
      const opportunities = this.identifyOpportunities(context);

      // Atualizar contexto com dados da sessão
      const updatedContext = {
        ...context,
        specialist_session: {
          ...context.specialist_session,
          specialist_id: specialistId,
          start_time: new Date().toISOString(),
          status: 'active' as const
        }
      };

      await this.saveSpecialistContext(userId, updatedContext);

      return {
        context: updatedContext,
        briefing,
        suggestedQuestions,
        riskFactors,
        opportunities
      };
    } catch (error) {
      console.error('Erro ao preparar contexto para chat:', error);
      throw error;
    }
  }

  /**
   * Métodos auxiliares privados
   */
  private async getUserContext(userId: string): Promise<UserContext | null> {
    const { data, error } = await supabase
      .from('user_contexts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Erro ao buscar contexto do usuário:', error);
      return null;
    }

    return data;
  }

  private async getLatestVisaMatchAnalysis(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('visa_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Erro ao buscar análise VisaMatch:', error);
      return null;
    }

    return data;
  }

  private async getLatestDreamsAnalysis(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('dream_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Erro ao buscar análise Dreams:', error);
      return null;
    }

    return data;
  }

  private async saveSpecialistContext(userId: string, context: SpecialistContextData): Promise<void> {
    const { error } = await supabase
      .from('specialist_contexts')
      .upsert({
        user_id: userId,
        context_data: context,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Erro ao salvar contexto do especialista:', error);
      throw error;
    }
  }

  private async getSpecialistContext(userId: string): Promise<SpecialistContextData> {
    const { data, error } = await supabase
      .from('specialist_contexts')
      .select('context_data')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // Se não existe, criar um novo
      return await this.createSpecialistContext(userId);
    }

    return data.context_data;
  }

  private calculateAdults(userContext: UserContext | null): number {
    if (!userContext) return 2; // Default
    
    let adults = 1; // Primary applicant
    if (userContext.profile.marital_status === 'married') adults++;
    
    return adults;
  }

  private extractChildren(userContext: UserContext | null): Array<{ age: number }> {
    if (!userContext?.profile.children_count) return [];
    
    // Mock children data - em produção, buscar dados reais
    return Array.from({ length: userContext.profile.children_count }, (_, i) => ({
      age: 8 + i * 3 // Mock ages
    }));
  }

  private categorizeFinancialResources(funds?: number): 'low' | 'medium' | 'high' {
    if (!funds) return 'medium';
    
    if (funds < 50000) return 'low';
    if (funds < 200000) return 'medium';
    return 'high';
  }

  private categorizeTimeFlexibility(timeline?: string): 'low' | 'medium' | 'high' {
    if (!timeline) return 'medium';
    
    if (timeline.includes('urgent') || timeline.includes('6 meses')) return 'low';
    if (timeline.includes('1 ano')) return 'medium';
    return 'high';
  }

  private generateDiscussionTopics(visaMatchResults: any, userContext: UserContext | null): string[] {
    const topics = [];
    
    if (visaMatchResults?.top_recommendation) {
      topics.push(`Estratégia ${visaMatchResults.top_recommendation.visa_type}`);
      topics.push('Requisitos e documentação necessária');
      topics.push('Timeline realista de implementação');
    }
    
    // Note: obstacles property doesn't exist in ImmigrationGoals type
    // Using a generic approach since specific challenge properties don't exist
    topics.push('Superação de obstáculos identificados');
    
    topics.push('Próximos passos práticos');
    topics.push('Preparação para entrevistas');
    
    return topics;
  }

  private calculatePriorityLevel(
    userContext: UserContext | null, 
    visaMatchResults: any
  ): 'low' | 'medium' | 'high' | 'urgent' {
    let priority = 'medium';
    
    // Aumentar prioridade baseado em fatores
    if (userContext?.immigration_goals?.timeline?.includes('urgent')) {
      priority = 'urgent';
    } else if (visaMatchResults?.top_recommendation?.match_percentage > 80) {
      priority = 'high';
    } else if (visaMatchResults?.top_recommendation?.match_percentage < 40) {
      priority = 'high'; // Casos difíceis precisam mais atenção
    }
    
    return priority as any;
  }

  private calculatePriorityFromVisaMatch(visaMatchResults: any): 'low' | 'medium' | 'high' | 'urgent' {
    const topScore = visaMatchResults?.top_recommendation?.match_percentage || 0;
    
    if (topScore > 85) return 'low'; // Caso fácil
    if (topScore > 60) return 'medium';
    if (topScore > 30) return 'high';
    return 'urgent'; // Caso muito difícil
  }

  private parseAIAnalysis(aiAnalysis: string): any {
    // Parser simples - em produção, usar parser mais sofisticado
    return {
      familyOverview: this.extractSection(aiAnalysis, 'VISÃO GERAL DA FAMÍLIA'),
      dreamMapping: this.extractSection(aiAnalysis, 'MAPEAMENTO DE SONHOS'),
      scenarios: this.extractScenarios(aiAnalysis),
      timeline: this.extractSection(aiAnalysis, 'TIMELINE'),
      tools: this.extractTools(aiAnalysis)
    };
  }

  private extractSection(text: string, sectionTitle: string): string {
    const regex = new RegExp(`${sectionTitle}[\\s\\S]*?(?=\\n\\n|$)`, 'i');
    const match = text.match(regex);
    return match ? match[0] : '';
  }

  private extractScenarios(text: string): string[] {
    const scenarios = [];
    const conservadorMatch = text.match(/Cenário Conservador[\s\S]*?(?=Cenário|$)/i);
    const realistaMatch = text.match(/Cenário Realista[\s\S]*?(?=Cenário|$)/i);
    const aceleradoMatch = text.match(/Cenário Acelerado[\s\S]*?(?=\n\n|$)/i);
    
    if (conservadorMatch) scenarios.push(conservadorMatch[0]);
    if (realistaMatch) scenarios.push(realistaMatch[0]);
    if (aceleradoMatch) scenarios.push(aceleradoMatch[0]);
    
    return scenarios;
  }

  private extractTools(text: string): string[] {
    const toolsSection = this.extractSection(text, 'FERRAMENTAS PRÁTICAS');
    return toolsSection.split('\n').filter(line => line.trim().startsWith('-')).map(line => line.trim());
  }

  private extractAdultsFromForm(formData: CriadorSonhosFormData): number {
    return formData.familia_composicao?.adults || 2;
  }

  private extractChildrenFromForm(formData: CriadorSonhosFormData): Array<{ age: number }> {
    return formData.familia_composicao?.children || [];
  }

  private generateSpecialistBriefing(context: SpecialistContextData): string {
    return `
BRIEFING DO CLIENTE

Usuário: ${context.user_id}
Estratégia Recomendada: ${context.visamatch_analysis.recommended_strategy}
Score de Probabilidade: ${context.visamatch_analysis.probability_score}%
Timeline: ${context.visamatch_analysis.timeline}
Investimento Estimado: ${context.visamatch_analysis.investment_needed}

COMPOSIÇÃO FAMILIAR:
- Adultos: ${context.family_profile.composition.adults}
- Crianças: ${context.family_profile.composition.children.length}

OBJETIVO PRINCIPAL: ${context.family_profile.goals.primary}

RECURSOS FINANCEIROS: ${context.family_profile.resources.financial}
FLEXIBILIDADE DE TEMPO: ${context.family_profile.resources.time_flexibility}

PRIORIDADE DA SESSÃO: ${context.specialist_session.priority_level}
    `.trim();
  }

  private generateSuggestedQuestions(context: SpecialistContextData): string[] {
    const questions = [
      `Como posso melhorar minhas chances para o visto ${context.visamatch_analysis.recommended_strategy}?`,
      'Quais documentos devo começar a preparar primeiro?',
      `Com o timeline de ${context.visamatch_analysis.timeline}, quais são os marcos mais importantes?`
    ];

    if (context.visamatch_analysis.probability_score < 60) {
      questions.push('Quais são as alternativas se essa estratégia não funcionar?');
    }

    if (context.family_profile.composition.children.length > 0) {
      questions.push('Como o processo afeta meus filhos e sua educação?');
    }

    return questions;
  }

  private identifyRiskFactors(context: SpecialistContextData): string[] {
    const risks = [];

    if (context.visamatch_analysis.probability_score < 50) {
      risks.push('Baixa probabilidade de aprovação na estratégia principal');
    }

    if (context.family_profile.resources.financial === 'low') {
      risks.push('Recursos financeiros limitados');
    }

    if (context.family_profile.resources.time_flexibility === 'low') {
      risks.push('Timeline apertado pode limitar opções');
    }

    return risks;
  }

  private identifyOpportunities(context: SpecialistContextData): string[] {
    const opportunities = [];

    if (context.visamatch_analysis.probability_score > 75) {
      opportunities.push('Alta probabilidade de sucesso na estratégia principal');
    }

    if (context.family_profile.resources.financial === 'high') {
      opportunities.push('Recursos financeiros permitem estratégias premium');
    }

    if (context.visamatch_analysis.strategies.length > 2) {
      opportunities.push('Múltiplas estratégias viáveis disponíveis');
    }

    return opportunities;
  }
}

export const contextService = new ContextService();
export type { SpecialistContextData };
