import { supabase } from '@/integrations/supabase/client';

export interface QuestionDefinition {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'date' | 'boolean' | 'scale' | 'file';
  title: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any, context: FormData) => string | null;
  };
  options?: Array<{
    value: string;
    label: string;
    description?: string;
    conditional?: ConditionalRule;
  }>;
  conditional?: ConditionalRule;
  suggestions?: SuggestionRule[];
  personalization?: PersonalizationRule;
  metadata?: {
    category: string;
    priority: number;
    estimatedTime: number;
    helpText?: string;
    examples?: string[];
  };
}

export interface ConditionalRule {
  condition: string; // JavaScript expression
  dependencies: string[]; // IDs das perguntas que afetam esta condição
  action: 'show' | 'hide' | 'require' | 'optional' | 'skip';
  message?: string;
}

export interface SuggestionRule {
  trigger: string; // Condição que ativa a sugestão
  suggestions: string[] | ((context: FormData) => Promise<string[]>);
  type: 'autocomplete' | 'recommendation' | 'warning' | 'tip';
  priority: number;
}

export interface PersonalizationRule {
  basedOn: 'profession' | 'family_size' | 'education' | 'goals' | 'country' | 'experience';
  mapping: Record<string, Partial<QuestionDefinition>>;
}

export interface FormData {
  [questionId: string]: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface QuestionnaireFlow {
  id: string;
  name: string;
  description: string;
  questions: QuestionDefinition[];
  flow_rules: {
    entry_conditions?: ConditionalRule[];
    completion_criteria: ConditionalRule[];
    skip_logic: Record<string, ConditionalRule[]>;
    branching: Record<string, string[]>; // questionId -> next possible questions
  };
  personalization: {
    enabled: boolean;
    rules: PersonalizationRule[];
    adaptive_ordering: boolean;
    smart_defaults: boolean;
  };
  analytics: {
    track_completion_time: boolean;
    track_abandonment: boolean;
    track_difficulty: boolean;
    a_b_testing: boolean;
  };
}

class AdaptiveQuestionnaireService {
  private questionnaireFlows: Map<string, QuestionnaireFlow> = new Map();
  private userProfiles: Map<string, any> = new Map();

  constructor() {
    this.initializeDefaultFlows();
  }

  /**
   * Inicializa fluxos padrão do sistema
   */
  private initializeDefaultFlows() {
    // Fluxo do Criador de Sonhos adaptativo
    const dreamsFlow: QuestionnaireFlow = {
      id: 'dreams_adaptive',
      name: 'Criador de Sonhos Adaptativo',
      description: 'Questionário personalizado baseado no perfil familiar',
      questions: [
        {
          id: 'family_composition',
          type: 'multiselect',
          title: 'Composição Familiar',
          description: 'Quem fará parte da sua jornada para os EUA?',
          required: true,
          options: [
            { value: 'spouse', label: 'Cônjuge/Parceiro(a)' },
            { value: 'children', label: 'Filhos' },
            { value: 'parents', label: 'Pais' },
            { value: 'siblings', label: 'Irmãos' },
            { value: 'other', label: 'Outros familiares' }
          ],
          metadata: {
            category: 'family',
            priority: 1,
            estimatedTime: 2
          }
        },
        {
          id: 'children_ages',
          type: 'text',
          title: 'Idades dos Filhos',
          description: 'Informe as idades dos seus filhos (separadas por vírgula)',
          placeholder: 'Ex: 8, 12, 16',
          required: false,
          conditional: {
            condition: 'family_composition.includes("children")',
            dependencies: ['family_composition'],
            action: 'show'
          },
          validation: {
            pattern: '^[0-9,\\s]+$',
            custom: (value, context) => {
              if (!value) return null;
              const ages = value.split(',').map(age => parseInt(age.trim()));
              if (ages.some(age => isNaN(age) || age < 0 || age > 25)) {
                return 'Idades devem ser números entre 0 e 25 anos';
              }
              return null;
            }
          },
          suggestions: [
            {
              trigger: 'children_ages.length > 0',
              suggestions: ['Considere as necessidades educacionais específicas para cada idade'],
              type: 'tip',
              priority: 1
            }
          ],
          metadata: {
            category: 'family',
            priority: 2,
            estimatedTime: 1
          }
        },
        {
          id: 'primary_motivation',
          type: 'select',
          title: 'Principal Motivação',
          description: 'Qual é o principal motivo para imigrar para os EUA?',
          required: true,
          options: [
            { value: 'career', label: 'Oportunidades de carreira' },
            { value: 'education', label: 'Educação dos filhos' },
            { value: 'lifestyle', label: 'Qualidade de vida' },
            { value: 'business', label: 'Oportunidades de negócio' },
            { value: 'family', label: 'Reunificação familiar' },
            { value: 'safety', label: 'Segurança' },
            { value: 'other', label: 'Outros motivos' }
          ],
          personalization: {
            basedOn: 'profession',
            mapping: {
              'tech': {
                options: [
                  { value: 'career', label: 'Oportunidades em tecnologia' },
                  { value: 'innovation', label: 'Ambiente de inovação' },
                  { value: 'startup', label: 'Ecossistema de startups' }
                ]
              },
              'healthcare': {
                options: [
                  { value: 'career', label: 'Prática médica avançada' },
                  { value: 'research', label: 'Pesquisa médica' },
                  { value: 'specialization', label: 'Especialização' }
                ]
              }
            }
          },
          metadata: {
            category: 'goals',
            priority: 1,
            estimatedTime: 2
          }
        },
        {
          id: 'timeline_preference',
          type: 'select',
          title: 'Cronograma Desejado',
          description: 'Em quanto tempo você gostaria de estar nos EUA?',
          required: true,
          options: [
            { value: '6months', label: 'Até 6 meses' },
            { value: '1year', label: 'Até 1 ano' },
            { value: '2years', label: 'Até 2 anos' },
            { value: '3years', label: 'Até 3 anos' },
            { value: 'flexible', label: 'Flexível' }
          ],
          suggestions: [
            {
              trigger: 'timeline_preference === "6months"',
              suggestions: ['Cronogramas agressivos requerem preparação intensa e podem ter custos mais altos'],
              type: 'warning',
              priority: 2
            },
            {
              trigger: 'timeline_preference === "flexible"',
              suggestions: ['Flexibilidade no cronograma permite melhor planejamento e custos otimizados'],
              type: 'tip',
              priority: 1
            }
          ],
          metadata: {
            category: 'planning',
            priority: 1,
            estimatedTime: 1
          }
        },
        {
          id: 'budget_range',
          type: 'select',
          title: 'Orçamento Disponível',
          description: 'Qual é o orçamento total que você tem disponível para o processo?',
          required: true,
          options: [
            { value: 'under_50k', label: 'Até $50,000' },
            { value: '50k_100k', label: '$50,000 - $100,000' },
            { value: '100k_200k', label: '$100,000 - $200,000' },
            { value: '200k_500k', label: '$200,000 - $500,000' },
            { value: 'over_500k', label: 'Acima de $500,000' },
            { value: 'flexible', label: 'Flexível baseado na oportunidade' }
          ],
          conditional: {
            condition: 'primary_motivation !== "family"',
            dependencies: ['primary_motivation'],
            action: 'show',
            message: 'Orçamento é importante para determinar as melhores estratégias'
          },
          metadata: {
            category: 'financial',
            priority: 2,
            estimatedTime: 2
          }
        },
        {
          id: 'location_preferences',
          type: 'multiselect',
          title: 'Preferências de Localização',
          description: 'Que tipo de localização você prefere nos EUA?',
          required: false,
          options: [
            { value: 'major_city', label: 'Grandes centros urbanos (NYC, LA, Chicago)' },
            { value: 'tech_hub', label: 'Centros de tecnologia (Silicon Valley, Seattle, Austin)' },
            { value: 'suburban', label: 'Áreas suburbanas' },
            { value: 'small_town', label: 'Cidades menores' },
            { value: 'coastal', label: 'Regiões costeiras' },
            { value: 'no_preference', label: 'Sem preferência específica' }
          ],
          personalization: {
            basedOn: 'family_size',
            mapping: {
              'large': {
                suggestions: [
                  {
                    trigger: 'location_preferences.includes("major_city")',
                    suggestions: ['Grandes cidades oferecem mais oportunidades mas custos de vida mais altos para famílias grandes'],
                    type: 'tip',
                    priority: 1
                  }
                ]
              }
            }
          },
          metadata: {
            category: 'lifestyle',
            priority: 3,
            estimatedTime: 2
          }
        }
      ],
      flow_rules: {
        completion_criteria: [
          {
            condition: 'family_composition.length > 0 && primary_motivation && timeline_preference',
            dependencies: ['family_composition', 'primary_motivation', 'timeline_preference'],
            action: 'show'
          }
        ],
        skip_logic: {
          'children_ages': [
            {
              condition: '!family_composition.includes("children")',
              dependencies: ['family_composition'],
              action: 'skip'
            }
          ],
          'budget_range': [
            {
              condition: 'primary_motivation === "family"',
              dependencies: ['primary_motivation'],
              action: 'optional',
              message: 'Para reunificação familiar, o orçamento pode ser mais flexível'
            }
          ]
        },
        branching: {
          'primary_motivation': ['timeline_preference', 'budget_range'],
          'family_composition': ['children_ages', 'location_preferences'],
          'timeline_preference': ['budget_range', 'location_preferences']
        }
      },
      personalization: {
        enabled: true,
        rules: [],
        adaptive_ordering: true,
        smart_defaults: true
      },
      analytics: {
        track_completion_time: true,
        track_abandonment: true,
        track_difficulty: true,
        a_b_testing: false
      }
    };

    this.questionnaireFlows.set('dreams_adaptive', dreamsFlow);
  }

  /**
   * Obtém o próximo conjunto de perguntas baseado no contexto atual
   */
  async getNextQuestions(
    flowId: string,
    currentAnswers: FormData,
    userProfile?: any
  ): Promise<{
    questions: QuestionDefinition[];
    progress: number;
    estimatedTimeRemaining: number;
    suggestions: string[];
  }> {
    try {
      const flow = this.questionnaireFlows.get(flowId);
      if (!flow) {
        throw new Error(`Fluxo ${flowId} não encontrado`);
      }

      // Aplicar personalização se habilitada
      let personalizedQuestions = flow.questions;
      if (flow.personalization.enabled && userProfile) {
        personalizedQuestions = await this.personalizeQuestions(flow.questions, userProfile);
      }

      // Filtrar perguntas baseado nas regras condicionais
      const visibleQuestions = personalizedQuestions.filter(question => 
        this.shouldShowQuestion(question, currentAnswers)
      );

      // Ordenar perguntas baseado na lógica adaptativa
      const orderedQuestions = flow.personalization.adaptive_ordering
        ? this.adaptiveOrderQuestions(visibleQuestions, currentAnswers, userProfile)
        : visibleQuestions;

      // Calcular progresso
      const totalQuestions = personalizedQuestions.length;
      const answeredQuestions = Object.keys(currentAnswers).length;
      const progress = Math.round((answeredQuestions / totalQuestions) * 100);

      // Estimar tempo restante
      const remainingQuestions = orderedQuestions.filter(q => !currentAnswers[q.id]);
      const estimatedTimeRemaining = remainingQuestions.reduce(
        (total, q) => total + (q.metadata?.estimatedTime || 1), 0
      );

      // Gerar sugestões contextuais
      const suggestions = await this.generateContextualSuggestions(
        orderedQuestions, 
        currentAnswers, 
        userProfile
      );

      return {
        questions: orderedQuestions,
        progress,
        estimatedTimeRemaining,
        suggestions
      };
    } catch (error) {
      console.error('Erro ao obter próximas perguntas:', error);
      throw error;
    }
  }

  /**
   * Valida uma resposta baseada nas regras da pergunta
   */
  async validateAnswer(
    questionId: string,
    answer: any,
    context: FormData,
    flowId: string
  ): Promise<ValidationResult> {
    try {
      const flow = this.questionnaireFlows.get(flowId);
      if (!flow) {
        throw new Error(`Fluxo ${flowId} não encontrado`);
      }

      const question = flow.questions.find(q => q.id === questionId);
      if (!question) {
        throw new Error(`Pergunta ${questionId} não encontrada`);
      }

      const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      };

      // Validação de campo obrigatório
      if (question.required && (!answer || answer === '' || (Array.isArray(answer) && answer.length === 0))) {
        result.isValid = false;
        result.errors.push('Este campo é obrigatório');
        return result;
      }

      // Validações específicas do tipo
      if (answer !== undefined && answer !== null && answer !== '') {
        switch (question.type) {
          case 'number':
            if (isNaN(Number(answer))) {
              result.isValid = false;
              result.errors.push('Deve ser um número válido');
            } else {
              const num = Number(answer);
              if (question.validation?.min !== undefined && num < question.validation.min) {
                result.isValid = false;
                result.errors.push(`Valor mínimo é ${question.validation.min}`);
              }
              if (question.validation?.max !== undefined && num > question.validation.max) {
                result.isValid = false;
                result.errors.push(`Valor máximo é ${question.validation.max}`);
              }
            }
            break;

          case 'text':
            if (question.validation?.pattern) {
              const regex = new RegExp(question.validation.pattern);
              if (!regex.test(answer)) {
                result.isValid = false;
                result.errors.push('Formato inválido');
              }
            }
            break;

          case 'select':
            const validOptions = question.options?.map(opt => opt.value) || [];
            if (!validOptions.includes(answer)) {
              result.isValid = false;
              result.errors.push('Opção inválida');
            }
            break;

          case 'multiselect':
            if (Array.isArray(answer)) {
              const validOptions = question.options?.map(opt => opt.value) || [];
              const invalidOptions = answer.filter(val => !validOptions.includes(val));
              if (invalidOptions.length > 0) {
                result.isValid = false;
                result.errors.push(`Opções inválidas: ${invalidOptions.join(', ')}`);
              }
            } else {
              result.isValid = false;
              result.errors.push('Deve ser uma lista de opções');
            }
            break;
        }
      }

      // Validação customizada
      if (question.validation?.custom && answer !== undefined) {
        const customError = question.validation.custom(answer, context);
        if (customError) {
          result.isValid = false;
          result.errors.push(customError);
        }
      }

      // Gerar sugestões baseadas na resposta
      if (question.suggestions) {
        for (const suggestionRule of question.suggestions) {
          if (this.evaluateCondition(suggestionRule.trigger, { ...context, [questionId]: answer })) {
            const suggestions = typeof suggestionRule.suggestions === 'function'
              ? await suggestionRule.suggestions(context)
              : suggestionRule.suggestions;
            
            result.suggestions.push(...suggestions);
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Erro na validação:', error);
      return {
        isValid: false,
        errors: ['Erro interno na validação'],
        warnings: [],
        suggestions: []
      };
    }
  }

  /**
   * Verifica se uma pergunta deve ser exibida baseado nas condições
   */
  private shouldShowQuestion(question: QuestionDefinition, answers: FormData): boolean {
    if (!question.conditional) return true;

    try {
      return this.evaluateCondition(question.conditional.condition, answers);
    } catch (error) {
      console.error(`Erro ao avaliar condição para pergunta ${question.id}:`, error);
      return true; // Mostrar por padrão em caso de erro
    }
  }

  /**
   * Avalia uma condição JavaScript de forma segura
   */
  private evaluateCondition(condition: string, context: FormData): boolean {
    try {
      // Criar função segura para avaliar a condição
      const func = new Function(...Object.keys(context), `return ${condition}`);
      return func(...Object.values(context));
    } catch (error) {
      console.error('Erro ao avaliar condição:', error);
      return false;
    }
  }

  /**
   * Personaliza perguntas baseado no perfil do usuário
   */
  private async personalizeQuestions(
    questions: QuestionDefinition[],
    userProfile: any
  ): Promise<QuestionDefinition[]> {
    return questions.map(question => {
      if (!question.personalization) return question;

      const { basedOn, mapping } = question.personalization;
      const userValue = userProfile[basedOn];

      if (userValue && mapping[userValue]) {
        return {
          ...question,
          ...mapping[userValue]
        };
      }

      return question;
    });
  }

  /**
   * Ordena perguntas de forma adaptativa
   */
  private adaptiveOrderQuestions(
    questions: QuestionDefinition[],
    answers: FormData,
    userProfile?: any
  ): QuestionDefinition[] {
    return questions.sort((a, b) => {
      // Priorizar perguntas obrigatórias não respondidas
      const aAnswered = answers[a.id] !== undefined;
      const bAnswered = answers[b.id] !== undefined;
      
      if (!aAnswered && bAnswered) return -1;
      if (aAnswered && !bAnswered) return 1;

      // Priorizar por prioridade definida
      const aPriority = a.metadata?.priority || 999;
      const bPriority = b.metadata?.priority || 999;
      
      return aPriority - bPriority;
    });
  }

  /**
   * Gera sugestões contextuais
   */
  private async generateContextualSuggestions(
    questions: QuestionDefinition[],
    answers: FormData,
    userProfile?: any
  ): Promise<string[]> {
    const suggestions: string[] = [];

    // Sugestões baseadas no progresso
    const answeredCount = Object.keys(answers).length;
    const totalCount = questions.length;
    const progress = answeredCount / totalCount;

    if (progress > 0.5 && progress < 0.8) {
      suggestions.push('Você está fazendo um ótimo progresso! Continue assim.');
    }

    if (progress > 0.8) {
      suggestions.push('Quase terminando! Suas respostas estão ajudando a criar um plano personalizado.');
    }

    // Sugestões baseadas nas respostas
    if (answers.timeline_preference === '6months') {
      suggestions.push('Cronogramas agressivos requerem preparação intensiva. Considere nosso serviço de consultoria especializada.');
    }

    if (answers.family_composition?.includes('children')) {
      suggestions.push('Para famílias com crianças, recomendamos focar nas oportunidades educacionais disponíveis.');
    }

    return suggestions;
  }

  /**
   * Salva progresso do questionário
   */
  async saveProgress(
    userId: string,
    flowId: string,
    answers: FormData,
    metadata?: any
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('questionnaire_progress')
        .upsert({
          user_id: userId,
          flow_id: flowId,
          answers,
          metadata: {
            ...metadata,
            last_updated: new Date().toISOString(),
            completion_percentage: this.calculateCompletionPercentage(flowId, answers)
          },
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
      throw error;
    }
  }

  /**
   * Carrega progresso salvo
   */
  async loadProgress(userId: string, flowId: string): Promise<FormData | null> {
    try {
      const { data, error } = await supabase
        .from('questionnaire_progress')
        .select('answers')
        .eq('user_id', userId)
        .eq('flow_id', flowId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data?.answers || null;
    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
      return null;
    }
  }

  /**
   * Calcula percentual de completude
   */
  private calculateCompletionPercentage(flowId: string, answers: FormData): number {
    const flow = this.questionnaireFlows.get(flowId);
    if (!flow) return 0;

    const totalQuestions = flow.questions.length;
    const answeredQuestions = Object.keys(answers).length;
    
    return Math.round((answeredQuestions / totalQuestions) * 100);
  }

  /**
   * Registra um novo fluxo de questionário
   */
  registerFlow(flow: QuestionnaireFlow): void {
    this.questionnaireFlows.set(flow.id, flow);
  }

  /**
   * Obtém definição de um fluxo
   */
  getFlow(flowId: string): QuestionnaireFlow | undefined {
    return this.questionnaireFlows.get(flowId);
  }

  /**
   * Lista todos os fluxos disponíveis
   */
  getAvailableFlows(): QuestionnaireFlow[] {
    return Array.from(this.questionnaireFlows.values());
  }
}

export const adaptiveQuestionnaireService = new AdaptiveQuestionnaireService();
export default adaptiveQuestionnaireService;
