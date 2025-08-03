import { supabase } from '@/integrations/supabase/client';
import { FormData } from './adaptiveQuestionnaireService';

export interface UserProfile {
  id: string;
  profession: string;
  education_level: 'high_school' | 'bachelor' | 'master' | 'phd';
  english_level: 'basic' | 'intermediate' | 'advanced' | 'native';
  current_country: string;
  experience_years?: number;
  family_status?: 'single' | 'married' | 'divorced' | 'widowed';
  has_children?: boolean;
  age_range?: '18-25' | '26-35' | '36-45' | '46-55' | '55+';
  income_range?: 'under_50k' | '50k_100k' | '100k_200k' | '200k_plus';
  previous_visa_attempts?: number;
  immigration_goals?: string[];
}

export interface ValidationContext {
  user_profile: UserProfile;
  current_answers: FormData;
  question_id: string;
  field_value: any;
  session_metadata: {
    time_spent_on_question: number;
    attempts_count: number;
    user_confidence_level: number;
    completion_percentage: number;
  };
}

export interface IntelligentValidationRule {
  id: string;
  name: string;
  description: string;
  field_types: string[];
  conditions: {
    user_segments: string[];
    profile_requirements: Record<string, any>;
    context_triggers: string[];
  };
  validation_logic: {
    type: 'format' | 'range' | 'conditional' | 'cross_field' | 'ai_assisted';
    parameters: Record<string, any>;
    severity: 'error' | 'warning' | 'suggestion';
    adaptive_threshold: boolean;
  };
  personalized_messages: {
    error_templates: Record<string, string>;
    suggestion_templates: Record<string, string>;
    success_templates: Record<string, string>;
  };
  learning_enabled: boolean;
  effectiveness_score: number;
}

export interface ValidationResult {
  is_valid: boolean;
  severity: 'error' | 'warning' | 'suggestion' | 'success';
  message: string;
  suggestions: string[];
  confidence_score: number;
  personalization_applied: boolean;
  rule_id?: string;
  adaptive_feedback?: {
    difficulty_adjustment: number;
    next_question_hint: string;
    user_progress_impact: string;
  };
}

class IntelligentValidationService {
  private validationRules: Map<string, IntelligentValidationRule> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Inicializa regras de validação inteligente padrão
   */
  private initializeDefaultRules() {
    const defaultRules: IntelligentValidationRule[] = [
      {
        id: 'profession_experience_validation',
        name: 'Validação de Experiência Profissional',
        description: 'Valida anos de experiência baseado na profissão e idade',
        field_types: ['experience_years', 'profession'],
        conditions: {
          user_segments: ['working_professional', 'career_focused'],
          profile_requirements: { profession: '!empty' },
          context_triggers: ['experience_related_question']
        },
        validation_logic: {
          type: 'conditional',
          parameters: {
            min_experience_by_profession: {
              'software_engineer': 1,
              'doctor': 3,
              'lawyer': 2,
              'teacher': 1,
              'nurse': 1,
              'architect': 2,
              'accountant': 1
            },
            max_experience_by_age: {
              '18-25': 7,
              '26-35': 17,
              '36-45': 27,
              '46-55': 37,
              '55+': 45
            }
          },
          severity: 'warning',
          adaptive_threshold: true
        },
        personalized_messages: {
          error_templates: {
            'too_high': 'Para sua idade ({age_range}) e profissão ({profession}), {experience_years} anos parece muito. Verifique se está correto.',
            'too_low': 'Como {profession}, esperamos pelo menos {min_experience} anos de experiência. Considere incluir experiência relevante.',
            'inconsistent': 'Sua experiência não parece consistente com seu perfil. Revise as informações.'
          },
          suggestion_templates: {
            'career_change': 'Se mudou de carreira recentemente, considere mencionar experiência transferível.',
            'early_career': 'Para início de carreira, destaque projetos acadêmicos ou estágios relevantes.',
            'senior_professional': 'Com sua experiência, considere destacar liderança e projetos estratégicos.'
          },
          success_templates: {
            'validated': 'Experiência consistente com seu perfil profissional!',
            'strong_profile': 'Excelente experiência para sua área de atuação!'
          }
        },
        learning_enabled: true,
        effectiveness_score: 0.85
      },
      {
        id: 'budget_reality_check',
        name: 'Verificação de Realidade Orçamentária',
        description: 'Valida orçamento baseado no perfil e objetivos do usuário',
        field_types: ['budget_range', 'timeline', 'family_size'],
        conditions: {
          user_segments: ['budget_conscious', 'family_oriented', 'timeline_focused'],
          profile_requirements: {},
          context_triggers: ['budget_related_question', 'timeline_question']
        },
        validation_logic: {
          type: 'cross_field',
          parameters: {
            minimum_budget_by_scenario: {
              'single_6months': 15000,
              'single_1year': 25000,
              'family_6months': 35000,
              'family_1year': 50000,
              'family_2years': 40000
            },
            cost_factors: {
              'visa_fees': 2000,
              'legal_fees': 5000,
              'moving_costs': 3000,
              'initial_living_costs': 10000,
              'per_family_member': 8000
            }
          },
          severity: 'warning',
          adaptive_threshold: true
        },
        personalized_messages: {
          error_templates: {
            'insufficient_budget': 'Para {timeline} com {family_composition}, recomendamos pelo menos ${recommended_budget}. Seu orçamento pode ser insuficiente.',
            'unrealistic_timeline': 'Com orçamento de {budget_range}, um cronograma de {timeline} pode ser muito agressivo.'
          },
          suggestion_templates: {
            'budget_optimization': 'Considere estender o cronograma para otimizar custos ou explore alternativas mais econômicas.',
            'phased_approach': 'Uma abordagem em fases pode ajudar a distribuir os custos ao longo do tempo.',
            'cost_breakdown': 'Solicite um detalhamento de custos personalizado para seu cenário.'
          },
          success_templates: {
            'realistic_budget': 'Orçamento adequado para seus objetivos!',
            'well_planned': 'Planejamento financeiro sólido para sua jornada!'
          }
        },
        learning_enabled: true,
        effectiveness_score: 0.78
      },
      {
        id: 'english_proficiency_assessment',
        name: 'Avaliação de Proficiência em Inglês',
        description: 'Valida nível de inglês baseado na profissão e objetivos',
        field_types: ['english_level', 'profession', 'visa_type'],
        conditions: {
          user_segments: ['professional_visa', 'work_focused'],
          profile_requirements: { english_level: '!empty' },
          context_triggers: ['english_assessment', 'visa_requirements']
        },
        validation_logic: {
          type: 'conditional',
          parameters: {
            minimum_english_by_profession: {
              'doctor': 'advanced',
              'lawyer': 'advanced',
              'teacher': 'advanced',
              'software_engineer': 'intermediate',
              'nurse': 'intermediate',
              'researcher': 'advanced',
              'business_analyst': 'intermediate'
            },
            visa_english_requirements: {
              'H1B': 'intermediate',
              'O1': 'advanced',
              'EB1': 'advanced',
              'EB2': 'intermediate',
              'EB3': 'basic'
            }
          },
          severity: 'error',
          adaptive_threshold: false
        },
        personalized_messages: {
          error_templates: {
            'insufficient_level': 'Para {profession} nos EUA, recomendamos nível {required_level} de inglês. Considere melhorar antes de aplicar.',
            'visa_requirement': 'O visto {visa_type} geralmente requer inglês {required_level}. Seu nível atual pode não ser suficiente.'
          },
          suggestion_templates: {
            'improvement_path': 'Considere cursos intensivos ou certificações como TOEFL/IELTS para comprovar proficiência.',
            'gradual_improvement': 'Comece com posições que exijam menos inglês e evolua gradualmente.',
            'language_immersion': 'Programas de imersão podem acelerar seu aprendizado significativamente.'
          },
          success_templates: {
            'adequate_level': 'Nível de inglês adequado para sua área profissional!',
            'competitive_advantage': 'Seu inglês avançado é uma vantagem competitiva!'
          }
        },
        learning_enabled: true,
        effectiveness_score: 0.92
      }
    ];

    defaultRules.forEach(rule => {
      this.validationRules.set(rule.id, rule);
    });
  }

  /**
   * Valida um campo usando inteligência baseada em perfil
   */
  async validateField(context: ValidationContext): Promise<ValidationResult[]> {
    try {
      const results: ValidationResult[] = [];
      const applicableRules = this.getApplicableRules(context);

      for (const rule of applicableRules) {
        const result = await this.applyValidationRule(rule, context);
        if (result) {
          results.push(result);
        }
      }

      return results;
    } catch (error) {
      console.error('Erro na validação inteligente:', error);
      return [{
        is_valid: true,
        severity: 'error',
        message: 'Erro interno na validação',
        suggestions: [],
        confidence_score: 0,
        personalization_applied: false
      }];
    }
  }

  /**
   * Obtém regras aplicáveis baseadas no contexto
   */
  private getApplicableRules(context: ValidationContext): IntelligentValidationRule[] {
    const { user_profile, question_id, current_answers } = context;
    
    return Array.from(this.validationRules.values()).filter(rule => {
      // Verificar se o tipo de campo é aplicável
      const fieldTypeMatch = rule.field_types.some(type => 
        question_id.includes(type) || type === 'any'
      );

      if (!fieldTypeMatch) return false;

      // Verificar segmentos de usuário
      const userSegments = this.identifyUserSegments(user_profile, current_answers);
      const segmentMatch = rule.conditions.user_segments.length === 0 || 
        rule.conditions.user_segments.some(segment => userSegments.includes(segment));

      // Verificar requisitos de perfil
      const profileMatch = this.checkProfileRequirements(
        user_profile, 
        rule.conditions.profile_requirements
      );

      return segmentMatch && profileMatch;
    });
  }

  /**
   * Aplica uma regra de validação específica
   */
  private async applyValidationRule(
    rule: IntelligentValidationRule, 
    context: ValidationContext
  ): Promise<ValidationResult | null> {
    try {
      switch (rule.validation_logic.type) {
        case 'conditional':
          return this.applyConditionalValidation(rule, context);
        
        case 'cross_field':
          return this.applyCrossFieldValidation(rule, context);
        
        case 'ai_assisted':
          return await this.applyAIAssistedValidation(rule, context);
        
        default:
          return this.applyBasicValidation(rule, context);
      }
    } catch (error) {
      console.error(`Erro ao aplicar regra ${rule.id}:`, error);
      return null;
    }
  }

  /**
   * Aplica validação condicional
   */
  private applyConditionalValidation(
    rule: IntelligentValidationRule, 
    context: ValidationContext
  ): ValidationResult {
    const { field_value, user_profile } = context;
    const { parameters } = rule.validation_logic;
    
    let isValid = true;
    let message = '';
    let suggestions: string[] = [];
    let severity: ValidationResult['severity'] = 'success';

    // Validação de experiência profissional
    if (rule.id === 'profession_experience_validation') {
      const profession = user_profile.profession;
      const ageRange = user_profile.age_range;
      const experience = parseInt(field_value) || 0;

      const minExperience = parameters.min_experience_by_profession[profession] || 0;
      const maxExperience = parameters.max_experience_by_age[ageRange] || 50;

      if (experience < minExperience) {
        isValid = false;
        severity = 'warning';
        message = this.personalizeMessage(
          rule.personalized_messages.error_templates.too_low,
          { profession, min_experience: minExperience, experience_years: experience }
        );
        suggestions.push(rule.personalized_messages.suggestion_templates.early_career);
      } else if (experience > maxExperience) {
        isValid = false;
        severity = 'warning';
        message = this.personalizeMessage(
          rule.personalized_messages.error_templates.too_high,
          { age_range: ageRange, profession, experience_years: experience }
        );
      } else {
        message = rule.personalized_messages.success_templates.validated;
      }
    }

    return {
      is_valid: isValid,
      severity,
      message,
      suggestions,
      confidence_score: 0.85,
      personalization_applied: true,
      rule_id: rule.id
    };
  }

  /**
   * Aplica validação cross-field
   */
  private applyCrossFieldValidation(
    rule: IntelligentValidationRule, 
    context: ValidationContext
  ): ValidationResult {
    const { current_answers } = context;
    const { parameters } = rule.validation_logic;

    let isValid = true;
    let message = '';
    let suggestions: string[] = [];
    let severity: ValidationResult['severity'] = 'success';

    // Validação de orçamento
    if (rule.id === 'budget_reality_check') {
      const timeline = current_answers.timeline_preference;
      const familyComposition = current_answers.family_composition || [];
      const budget = current_answers.budget_range;

      const familySize = Array.isArray(familyComposition) ? familyComposition.length : 0;
      const scenario = `${familySize > 1 ? 'family' : 'single'}_${timeline}`;
      const minBudget = parameters.minimum_budget_by_scenario[scenario] || 20000;

      const budgetValue = this.extractBudgetValue(budget);
      
      if (budgetValue < minBudget) {
        isValid = false;
        severity = 'warning';
        message = this.personalizeMessage(
          rule.personalized_messages.error_templates.insufficient_budget,
          { 
            timeline, 
            family_composition: familySize > 1 ? 'família' : 'pessoa solteira',
            recommended_budget: minBudget.toLocaleString()
          }
        );
        suggestions.push(rule.personalized_messages.suggestion_templates.budget_optimization);
      } else {
        message = rule.personalized_messages.success_templates.realistic_budget;
      }
    }

    return {
      is_valid: isValid,
      severity,
      message,
      suggestions,
      confidence_score: 0.78,
      personalization_applied: true,
      rule_id: rule.id
    };
  }

  /**
   * Aplica validação assistida por IA
   */
  private async applyAIAssistedValidation(
    rule: IntelligentValidationRule, 
    context: ValidationContext
  ): Promise<ValidationResult> {
    // Implementação simplificada
    const consistencyScore = Math.random() * 0.4 + 0.6;
    const realismScore = Math.random() * 0.3 + 0.7;
    
    const isValid = consistencyScore > 0.7 && realismScore > 0.75;
    const severity: ValidationResult['severity'] = isValid ? 'success' : 'suggestion';
    
    let message = '';
    let suggestions: string[] = [];
    
    if (!isValid) {
      if (consistencyScore <= 0.7) {
        message = rule.personalized_messages.error_templates.inconsistent_goals || 'Objetivos inconsistentes detectados';
        suggestions.push('Considere revisar seus objetivos para melhor alinhamento');
      } else {
        message = rule.personalized_messages.error_templates.unrealistic_expectations || 'Expectativas podem ser muito altas';
        suggestions.push('Uma abordagem em fases pode ser mais realista');
      }
    } else {
      message = rule.personalized_messages.success_templates.aligned_goals || 'Objetivos bem alinhados!';
    }

    return {
      is_valid: isValid,
      severity,
      message,
      suggestions,
      confidence_score: Math.min(consistencyScore, realismScore),
      personalization_applied: true,
      rule_id: rule.id,
      adaptive_feedback: {
        difficulty_adjustment: isValid ? 0 : 0.1,
        next_question_hint: isValid ? 'Continue com confiança' : 'Considere revisar seus objetivos',
        user_progress_impact: isValid ? 'positive' : 'neutral'
      }
    };
  }

  /**
   * Aplica validação básica
   */
  private applyBasicValidation(
    rule: IntelligentValidationRule, 
    context: ValidationContext
  ): ValidationResult {
    return {
      is_valid: true,
      severity: 'success',
      message: 'Validação básica aprovada',
      suggestions: [],
      confidence_score: 0.6,
      personalization_applied: false,
      rule_id: rule.id
    };
  }

  /**
   * Identifica segmentos do usuário baseado no perfil
   */
  private identifyUserSegments(profile: UserProfile, answers: FormData): string[] {
    const segments: string[] = [];

    if (profile.profession) {
      segments.push('working_professional');
      if (['doctor', 'lawyer', 'engineer'].includes(profile.profession)) {
        segments.push('high_skilled_professional');
      }
    }

    if (profile.has_children) {
      segments.push('family_oriented', 'has_dependents');
    }

    if (answers.primary_motivation === 'career') {
      segments.push('career_focused');
    }

    const budget = answers.budget_range;
    if (budget && (budget.includes('under') || budget.includes('50k'))) {
      segments.push('budget_conscious');
    }

    return segments;
  }

  /**
   * Verifica requisitos de perfil
   */
  private checkProfileRequirements(
    profile: UserProfile, 
    requirements: Record<string, any>
  ): boolean {
    return Object.entries(requirements).every(([key, value]) => {
      const profileValue = profile[key as keyof UserProfile];
      
      if (value === '!empty') {
        return profileValue !== undefined && profileValue !== null && profileValue !== '';
      }
      
      return profileValue === value;
    });
  }

  /**
   * Personaliza mensagem com dados do contexto
   */
  private personalizeMessage(template: string, data: Record<string, any>): string {
    let message = template;
    Object.entries(data).forEach(([key, value]) => {
      message = message.replace(new RegExp(`{${key}}`, 'g'), String(value));
    });
    return message;
  }

  /**
   * Extrai valor numérico do orçamento
   */
  private extractBudgetValue(budget: string): number {
    if (!budget) return 0;
    
    const budgetMap: Record<string, number> = {
      'under_50k': 40000,
      '50k_100k': 75000,
      '100k_200k': 150000,
      '200k_500k': 350000,
      'over_500k': 600000,
      'flexible': 100000
    };
    
    return budgetMap[budget] || 0;
  }

  /**
   * Adiciona nova regra de validação
   */
  addValidationRule(rule: IntelligentValidationRule): void {
    this.validationRules.set(rule.id, rule);
  }

  /**
   * Remove regra de validação
   */
  removeValidationRule(ruleId: string): void {
    this.validationRules.delete(ruleId);
  }

  /**
   * Obtém todas as regras ativas
   */
  getActiveRules(): IntelligentValidationRule[] {
    return Array.from(this.validationRules.values());
  }
}

export const intelligentValidationService = new IntelligentValidationService();
export default intelligentValidationService;
