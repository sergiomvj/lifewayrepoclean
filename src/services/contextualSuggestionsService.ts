import { supabase } from '@/integrations/supabase/client';
import { FormData } from './adaptiveQuestionnaireService';

export interface SuggestionContext {
  user_profile: any;
  current_answers: FormData;
  question_id: string;
  session_data: {
    time_spent: number;
    attempts: number;
    difficulty_score: number;
  };
  external_data?: {
    market_conditions: any;
    visa_updates: any;
    success_stories: any;
  };
}

export interface ContextualSuggestion {
  id: string;
  type: 'tip' | 'warning' | 'recommendation' | 'insight' | 'next_step';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  content: string;
  action?: {
    label: string;
    type: 'navigate' | 'external_link' | 'modal' | 'form_fill';
    target: string;
    data?: any;
  };
  conditions: {
    triggers: string[];
    user_segments: string[];
    timing: 'immediate' | 'delayed' | 'contextual';
  };
  personalization: {
    based_on: string[];
    confidence: number;
    relevance_score: number;
  };
  analytics: {
    shown_count: number;
    click_count: number;
    effectiveness_score: number;
  };
  expires_at?: string;
}

export interface SuggestionRule {
  id: string;
  name: string;
  description: string;
  trigger_conditions: string[];
  suggestion_template: {
    title: string;
    content: string;
    type: ContextualSuggestion['type'];
    priority: ContextualSuggestion['priority'];
  };
  personalization_rules: {
    profession_mapping: Record<string, Partial<ContextualSuggestion>>;
    family_size_mapping: Record<string, Partial<ContextualSuggestion>>;
    timeline_mapping: Record<string, Partial<ContextualSuggestion>>;
    budget_mapping: Record<string, Partial<ContextualSuggestion>>;
  };
  active: boolean;
  created_at: string;
  updated_at: string;
}

class ContextualSuggestionsService {
  private suggestionRules: Map<string, SuggestionRule> = new Map();
  private userSuggestionHistory: Map<string, ContextualSuggestion[]> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Inicializa regras padrão de sugestões
   */
  private initializeDefaultRules() {
    const defaultRules: SuggestionRule[] = [
      {
        id: 'family_education_focus',
        name: 'Foco em Educação para Famílias',
        description: 'Sugere foco educacional quando há crianças na família',
        trigger_conditions: [
          'family_composition.includes("children")',
          'children_ages.length > 0'
        ],
        suggestion_template: {
          title: 'Oportunidades Educacionais',
          content: 'Com crianças na família, considere as excelentes oportunidades educacionais nos EUA. Muitos distritos escolares oferecem programas especializados.',
          type: 'tip',
          priority: 'high'
        },
        personalization_rules: {
          profession_mapping: {
            'teacher': {
              content: 'Como educador, você pode se beneficiar dos programas de intercâmbio para professores e das oportunidades de desenvolvimento profissional.'
            },
            'tech': {
              content: 'Áreas como Silicon Valley oferecem excelentes escolas STEM para crianças interessadas em tecnologia.'
            }
          },
          family_size_mapping: {
            'large': {
              content: 'Para famílias grandes, considere estados com menor custo de vida mas boa qualidade educacional, como Texas ou Carolina do Norte.'
            }
          },
          timeline_mapping: {
            '6months': {
              priority: 'critical',
              content: 'Com cronograma agressivo e crianças, planeje a transição escolar com antecedência. Considere começar o processo de matrícula antes da mudança.'
            }
          },
          budget_mapping: {
            'under_50k': {
              content: 'Explore programas de bolsas de estudo e distritos escolares públicos de qualidade para otimizar custos educacionais.'
            }
          }
        },
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'tech_professional_opportunities',
        name: 'Oportunidades para Profissionais de Tech',
        description: 'Sugestões específicas para profissionais de tecnologia',
        trigger_conditions: [
          'user_profile.profession === "tech"',
          'primary_motivation === "career"'
        ],
        suggestion_template: {
          title: 'Mercado Tech nos EUA',
          content: 'O mercado de tecnologia nos EUA oferece salários competitivos e oportunidades de crescimento. Considere certificações específicas para aumentar suas chances.',
          type: 'recommendation',
          priority: 'high'
        },
        personalization_rules: {
          profession_mapping: {
            'software_engineer': {
              content: 'Para engenheiros de software, empresas como Google, Microsoft e startups oferecem vistos H1-B. Prepare seu portfólio no GitHub.'
            },
            'data_scientist': {
              content: 'Data Science está em alta demanda. Considere especializações em AI/ML para se destacar no mercado americano.'
            }
          },
          family_size_mapping: {},
          timeline_mapping: {
            '1year': {
              content: 'Com 1 ano de planejamento, você pode se preparar adequadamente para entrevistas técnicas e processos de visto.'
            }
          },
          budget_mapping: {
            'over_500k': {
              content: 'Com orçamento flexível, considere investir em um advogado especializado em vistos EB-1 para profissionais extraordinários.'
            }
          }
        },
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'budget_optimization',
        name: 'Otimização de Orçamento',
        description: 'Sugestões para otimizar custos baseado no orçamento disponível',
        trigger_conditions: [
          'budget_range === "under_50k" || budget_range === "50k_100k"'
        ],
        suggestion_template: {
          title: 'Otimização de Custos',
          content: 'Com orçamento limitado, considere estratégias como estudar primeiro (F-1) e depois transicionar para trabalho, ou explorar oportunidades em cidades com menor custo de vida.',
          type: 'tip',
          priority: 'medium'
        },
        personalization_rules: {
          profession_mapping: {
            'student': {
              content: 'Como estudante, explore programas de mestrado com assistantships que cobrem tuition e oferecem estipêndio.'
            }
          },
          family_size_mapping: {
            'single': {
              content: 'Sendo solteiro, você tem mais flexibilidade para escolher localizações com melhor custo-benefício.'
            }
          },
          timeline_mapping: {
            'flexible': {
              content: 'Com cronograma flexível, você pode aguardar melhores oportunidades e economizar mais dinheiro.'
            }
          },
          budget_mapping: {}
        },
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'location_lifestyle_match',
        name: 'Correspondência Localização-Estilo de Vida',
        description: 'Sugere localizações baseadas no estilo de vida preferido',
        trigger_conditions: [
          'location_preferences.length > 0'
        ],
        suggestion_template: {
          title: 'Localizações Recomendadas',
          content: 'Baseado em suas preferências, temos algumas recomendações de cidades que podem ser ideais para seu perfil.',
          type: 'insight',
          priority: 'medium'
        },
        personalization_rules: {
          profession_mapping: {
            'tech': {
              content: 'Para profissionais de tech: Austin (startup scene), Seattle (grandes empresas), ou Research Triangle Park na Carolina do Norte (custo-benefício).'
            },
            'healthcare': {
              content: 'Para profissionais de saúde: Houston (Texas Medical Center), Boston (hospitais de pesquisa), ou Rochester (Mayo Clinic).'
            }
          },
          family_size_mapping: {
            'large': {
              content: 'Para famílias grandes: subúrbios de Dallas, Atlanta, ou Phoenix oferecem boa qualidade de vida com custos moderados.'
            }
          },
          timeline_mapping: {},
          budget_mapping: {
            'under_50k': {
              content: 'Com orçamento limitado, considere cidades como Raleigh, Nashville, ou Salt Lake City - boa qualidade de vida com custos menores.'
            }
          }
        },
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'timeline_reality_check',
        name: 'Verificação de Realidade do Cronograma',
        description: 'Alerta sobre cronogramas muito agressivos',
        trigger_conditions: [
          'timeline_preference === "6months"'
        ],
        suggestion_template: {
          title: 'Cronograma Agressivo',
          content: 'Cronogramas de 6 meses são muito desafiadores. Considere se você tem todos os documentos prontos e suporte profissional adequado.',
          type: 'warning',
          priority: 'high'
        },
        personalization_rules: {
          profession_mapping: {
            'tech': {
              content: 'Para tech, 6 meses é possível com H1-B já aprovado ou transferência interna. Caso contrário, considere mais tempo.'
            }
          },
          family_size_mapping: {
            'large': {
              priority: 'critical',
              content: 'Com família grande, 6 meses é extremamente desafiador. Considere pelo menos 12-18 meses para uma transição suave.'
            }
          },
          timeline_mapping: {},
          budget_mapping: {
            'under_50k': {
              priority: 'critical',
              content: 'Cronograma agressivo + orçamento limitado = alta probabilidade de problemas. Considere mais tempo ou mais recursos.'
            }
          }
        },
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    defaultRules.forEach(rule => {
      this.suggestionRules.set(rule.id, rule);
    });
  }

  /**
   * Gera sugestões contextuais baseadas no contexto atual
   */
  async generateSuggestions(context: SuggestionContext): Promise<ContextualSuggestion[]> {
    try {
      const suggestions: ContextualSuggestion[] = [];
      const activeRules = Array.from(this.suggestionRules.values()).filter(rule => rule.active);

      for (const rule of activeRules) {
        if (await this.evaluateRuleTriggers(rule, context)) {
          const suggestion = await this.createSuggestionFromRule(rule, context);
          if (suggestion) {
            suggestions.push(suggestion);
          }
        }
      }

      // Ordenar por prioridade e relevância
      suggestions.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return b.personalization.relevance_score - a.personalization.relevance_score;
      });

      // Limitar número de sugestões para não sobrecarregar
      const limitedSuggestions = suggestions.slice(0, 5);

      // Registrar sugestões mostradas
      await this.logSuggestionsShown(context.user_profile.id, limitedSuggestions);

      return limitedSuggestions;
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      return [];
    }
  }

  /**
   * Avalia se os triggers de uma regra são atendidos
   */
  private async evaluateRuleTriggers(rule: SuggestionRule, context: SuggestionContext): Promise<boolean> {
    try {
      for (const trigger of rule.trigger_conditions) {
        const result = this.evaluateCondition(trigger, {
          ...context.current_answers,
          user_profile: context.user_profile,
          session_data: context.session_data
        });
        
        if (result) {
          return true; // OR logic - qualquer trigger ativo é suficiente
        }
      }
      return false;
    } catch (error) {
      console.error('Erro ao avaliar triggers:', error);
      return false;
    }
  }

  /**
   * Cria sugestão personalizada baseada na regra
   */
  private async createSuggestionFromRule(
    rule: SuggestionRule, 
    context: SuggestionContext
  ): Promise<ContextualSuggestion | null> {
    try {
      let suggestion: ContextualSuggestion = {
        id: `${rule.id}_${Date.now()}`,
        type: rule.suggestion_template.type,
        priority: rule.suggestion_template.priority,
        title: rule.suggestion_template.title,
        content: rule.suggestion_template.content,
        conditions: {
          triggers: rule.trigger_conditions,
          user_segments: this.identifyUserSegments(context),
          timing: 'immediate'
        },
        personalization: {
          based_on: ['profession', 'family_size', 'timeline', 'budget'],
          confidence: 0.8,
          relevance_score: 0.7
        },
        analytics: {
          shown_count: 0,
          click_count: 0,
          effectiveness_score: 0
        }
      };

      // Aplicar personalizações
      suggestion = await this.personalizesuggestion(suggestion, rule, context);

      // Calcular score de relevância
      suggestion.personalization.relevance_score = this.calculateRelevanceScore(suggestion, context);

      // Adicionar ações contextuais
      suggestion.action = this.generateContextualAction(suggestion, context);

      return suggestion;
    } catch (error) {
      console.error('Erro ao criar sugestão:', error);
      return null;
    }
  }

  /**
   * Personaliza sugestão baseada no perfil do usuário
   */
  private async personalizesuggestion(
    suggestion: ContextualSuggestion,
    rule: SuggestionRule,
    context: SuggestionContext
  ): Promise<ContextualSuggestion> {
    const { user_profile, current_answers } = context;
    
    // Personalização por profissão
    const profession = user_profile.profession;
    if (profession && rule.personalization_rules.profession_mapping[profession]) {
      const professionCustomization = rule.personalization_rules.profession_mapping[profession];
      suggestion = { ...suggestion, ...professionCustomization };
    }

    // Personalização por tamanho da família
    const familySize = this.determineFamilySize(current_answers);
    if (rule.personalization_rules.family_size_mapping[familySize]) {
      const familyCustomization = rule.personalization_rules.family_size_mapping[familySize];
      suggestion = { ...suggestion, ...familyCustomization };
    }

    // Personalização por cronograma
    const timeline = current_answers.timeline_preference;
    if (timeline && rule.personalization_rules.timeline_mapping[timeline]) {
      const timelineCustomization = rule.personalization_rules.timeline_mapping[timeline];
      suggestion = { ...suggestion, ...timelineCustomization };
    }

    // Personalização por orçamento
    const budget = current_answers.budget_range;
    if (budget && rule.personalization_rules.budget_mapping[budget]) {
      const budgetCustomization = rule.personalization_rules.budget_mapping[budget];
      suggestion = { ...suggestion, ...budgetCustomization };
    }

    return suggestion;
  }

  /**
   * Calcula score de relevância da sugestão
   */
  private calculateRelevanceScore(suggestion: ContextualSuggestion, context: SuggestionContext): number {
    let score = 0.5; // Base score

    // Boost baseado na prioridade
    const priorityBoost = { critical: 0.4, high: 0.3, medium: 0.2, low: 0.1 };
    score += priorityBoost[suggestion.priority];

    // Boost baseado no tempo gasto na pergunta (indica dificuldade)
    if (context.session_data.time_spent > 60) { // mais de 1 minuto
      score += 0.2;
    }

    // Boost baseado no número de tentativas
    if (context.session_data.attempts > 1) {
      score += 0.1;
    }

    // Penalidade se já foi mostrada muitas vezes
    if (suggestion.analytics.shown_count > 3) {
      score -= 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Gera ação contextual para a sugestão
   */
  private generateContextualAction(
    suggestion: ContextualSuggestion, 
    context: SuggestionContext
  ): ContextualSuggestion['action'] {
    switch (suggestion.type) {
      case 'recommendation':
        return {
          label: 'Ver Detalhes',
          type: 'modal',
          target: 'recommendation_details',
          data: { suggestion_id: suggestion.id }
        };
      
      case 'tip':
        return {
          label: 'Saiba Mais',
          type: 'external_link',
          target: 'https://lifeway.com/tips/' + suggestion.id.split('_')[0]
        };
      
      case 'warning':
        return {
          label: 'Revisar Resposta',
          type: 'form_fill',
          target: context.question_id,
          data: { highlight: true }
        };
      
      case 'next_step':
        return {
          label: 'Próximo Passo',
          type: 'navigate',
          target: '/next-steps'
        };
      
      default:
        return undefined;
    }
  }

  /**
   * Identifica segmentos do usuário
   */
  private identifyUserSegments(context: SuggestionContext): string[] {
    const segments: string[] = [];
    const { user_profile, current_answers } = context;

    // Segmento por profissão
    if (user_profile.profession) {
      segments.push(`profession_${user_profile.profession}`);
    }

    // Segmento por composição familiar
    const familyComposition = current_answers.family_composition;
    if (Array.isArray(familyComposition)) {
      if (familyComposition.includes('children')) segments.push('has_children');
      if (familyComposition.includes('spouse')) segments.push('has_spouse');
      if (familyComposition.length > 2) segments.push('large_family');
    }

    // Segmento por orçamento
    const budget = current_answers.budget_range;
    if (budget) {
      segments.push(`budget_${budget}`);
    }

    // Segmento por cronograma
    const timeline = current_answers.timeline_preference;
    if (timeline) {
      segments.push(`timeline_${timeline}`);
    }

    return segments;
  }

  /**
   * Determina tamanho da família
   */
  private determineFamilySize(answers: FormData): string {
    const composition = answers.family_composition;
    if (!Array.isArray(composition)) return 'single';
    
    let size = 1; // Próprio usuário
    if (composition.includes('spouse')) size++;
    if (composition.includes('children')) {
      const childrenAges = answers.children_ages;
      if (typeof childrenAges === 'string') {
        size += childrenAges.split(',').length;
      }
    }
    if (composition.includes('parents')) size += 2;
    if (composition.includes('siblings')) size += 1;
    if (composition.includes('other')) size += 1;

    if (size === 1) return 'single';
    if (size <= 3) return 'small';
    if (size <= 5) return 'medium';
    return 'large';
  }

  /**
   * Avalia condição de forma segura
   */
  private evaluateCondition(condition: string, context: any): boolean {
    try {
      const func = new Function(...Object.keys(context), `return ${condition}`);
      return func(...Object.values(context));
    } catch (error) {
      console.error('Erro ao avaliar condição:', error);
      return false;
    }
  }

  /**
   * Registra sugestões mostradas para analytics
   */
  private async logSuggestionsShown(userId: string, suggestions: ContextualSuggestion[]): Promise<void> {
    try {
      const logData = suggestions.map(suggestion => ({
        user_id: userId,
        suggestion_id: suggestion.id,
        suggestion_type: suggestion.type,
        priority: suggestion.priority,
        shown_at: new Date().toISOString(),
        context_data: {
          relevance_score: suggestion.personalization.relevance_score,
          based_on: suggestion.personalization.based_on
        }
      }));

      const { error } = await supabase
        .from('suggestion_analytics')
        .insert(logData);

      if (error) {
        console.error('Erro ao registrar analytics de sugestões:', error);
      }
    } catch (error) {
      console.error('Erro ao fazer log de sugestões:', error);
    }
  }

  /**
   * Registra clique em sugestão
   */
  async trackSuggestionClick(suggestionId: string, userId: string, actionTaken: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('suggestion_analytics')
        .update({
          clicked_at: new Date().toISOString(),
          action_taken: actionTaken
        })
        .eq('suggestion_id', suggestionId)
        .eq('user_id', userId);

      if (error) {
        console.error('Erro ao registrar clique em sugestão:', error);
      }
    } catch (error) {
      console.error('Erro ao rastrear clique:', error);
    }
  }

  /**
   * Obtém sugestões baseadas em dados externos (mercado, visa updates, etc.)
   */
  async getExternalDataSuggestions(context: SuggestionContext): Promise<ContextualSuggestion[]> {
    try {
      // Implementar integração com APIs externas
      // Por enquanto retorna sugestões mock baseadas em dados externos
      const externalSuggestions: ContextualSuggestion[] = [];

      // Exemplo: Sugestão baseada em mudanças de política de visto
      if (context.user_profile.profession === 'tech') {
        externalSuggestions.push({
          id: 'h1b_update_2024',
          type: 'insight',
          priority: 'high',
          title: 'Atualização H1-B 2024',
          content: 'Novas regras do H1-B favorecem profissionais com mestrado em STEM. Considere especialização adicional.',
          conditions: {
            triggers: ['profession_tech', 'timeline_flexible'],
            user_segments: ['profession_tech'],
            timing: 'contextual'
          },
          personalization: {
            based_on: ['profession', 'education'],
            confidence: 0.9,
            relevance_score: 0.8
          },
          analytics: {
            shown_count: 0,
            click_count: 0,
            effectiveness_score: 0
          },
          action: {
            label: 'Ver Detalhes',
            type: 'external_link',
            target: 'https://uscis.gov/h1b-updates'
          },
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
        });
      }

      return externalSuggestions;
    } catch (error) {
      console.error('Erro ao obter sugestões de dados externos:', error);
      return [];
    }
  }

  /**
   * Adiciona nova regra de sugestão
   */
  addSuggestionRule(rule: SuggestionRule): void {
    this.suggestionRules.set(rule.id, rule);
  }

  /**
   * Remove regra de sugestão
   */
  removeSuggestionRule(ruleId: string): void {
    this.suggestionRules.delete(ruleId);
  }

  /**
   * Obtém todas as regras ativas
   */
  getActiveSuggestionRules(): SuggestionRule[] {
    return Array.from(this.suggestionRules.values()).filter(rule => rule.active);
  }

  /**
   * Atualiza regra existente
   */
  updateSuggestionRule(ruleId: string, updates: Partial<SuggestionRule>): void {
    const existingRule = this.suggestionRules.get(ruleId);
    if (existingRule) {
      this.suggestionRules.set(ruleId, {
        ...existingRule,
        ...updates,
        updated_at: new Date().toISOString()
      });
    }
  }
}

export const contextualSuggestionsService = new ContextualSuggestionsService();
export default contextualSuggestionsService;
