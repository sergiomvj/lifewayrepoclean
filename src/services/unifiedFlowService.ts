import { supabase } from '@/integrations/supabase/client';
import { contextService } from './contextService';

export type FlowStep = 
  | 'dreams_start'
  | 'dreams_completion' 
  | 'pdf_generation'
  | 'visamatch_analysis'
  | 'specialist_consultation'
  | 'action_plan_creation'
  | 'journey_completed';

export type FlowStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

export interface UserFlowProgress {
  user_id: string;
  current_step: FlowStep;
  completed_steps: FlowStep[];
  step_data: Record<FlowStep, any>;
  flow_metadata: {
    started_at: string;
    last_activity: string;
    completion_percentage: number;
    estimated_time_remaining: number;
    user_preferences: {
      skip_pdf?: boolean;
      priority_consultation?: boolean;
      preferred_specialist_type?: string;
    };
  };
  created_at: string;
  updated_at: string;
}

export interface FlowTransition {
  from: FlowStep;
  to: FlowStep;
  conditions: {
    required_data?: string[];
    user_actions?: string[];
    subscription_level?: 'free' | 'pro';
    time_constraints?: {
      min_time_spent?: number;
      max_time_since_start?: number;
    };
  };
  actions: {
    pre_transition?: () => Promise<void>;
    post_transition?: () => Promise<void>;
    data_transfer?: string[];
    notifications?: string[];
  };
}

class UnifiedFlowService {
  private flowTransitions: FlowTransition[] = [
    {
      from: 'dreams_start',
      to: 'dreams_completion',
      conditions: {
        required_data: ['family_profile', 'immigration_goals'],
        user_actions: ['form_submitted']
      },
      actions: {
        data_transfer: ['dreams_data'],
        notifications: ['dreams_completed']
      }
    },
    {
      from: 'dreams_completion',
      to: 'pdf_generation',
      conditions: {
        required_data: ['dreams_analysis'],
        subscription_level: 'free' // PDF disponível no período gratuito
      },
      actions: {
        pre_transition: async () => {
          await this.checkPDFAccess();
        },
        data_transfer: ['dreams_analysis', 'family_images'],
        notifications: ['pdf_ready']
      }
    },
    {
      from: 'pdf_generation',
      to: 'visamatch_analysis',
      conditions: {
        user_actions: ['pdf_downloaded', 'continue_journey']
      },
      actions: {
        data_transfer: ['user_profile', 'dreams_context'],
        notifications: ['visamatch_available']
      }
    },
    {
      from: 'visamatch_analysis',
      to: 'specialist_consultation',
      conditions: {
        required_data: ['visamatch_results'],
        user_actions: ['request_consultation']
      },
      actions: {
        pre_transition: async () => {
          await this.prepareSpecialistContext();
        },
        data_transfer: ['visamatch_results', 'user_context'],
        notifications: ['specialist_available']
      }
    },
    {
      from: 'specialist_consultation',
      to: 'action_plan_creation',
      conditions: {
        required_data: ['consultation_summary'],
        user_actions: ['consultation_completed']
      },
      actions: {
        data_transfer: ['consultation_notes', 'recommendations'],
        notifications: ['action_plan_ready']
      }
    },
    {
      from: 'action_plan_creation',
      to: 'journey_completed',
      conditions: {
        required_data: ['action_plan'],
        user_actions: ['plan_reviewed']
      },
      actions: {
        post_transition: async () => {
          await this.completeUserJourney();
        },
        notifications: ['journey_completed', 'follow_up_scheduled']
      }
    }
  ];

  /**
   * Inicializa o fluxo para um novo usuário
   */
  async initializeUserFlow(userId: string): Promise<UserFlowProgress> {
    try {
      const flowProgress: Omit<UserFlowProgress, 'created_at' | 'updated_at'> = {
        user_id: userId,
        current_step: 'dreams_start',
        completed_steps: [],
        step_data: {} as Record<FlowStep, any>,
        flow_metadata: {
          started_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          completion_percentage: 0,
          estimated_time_remaining: 45, // 45 minutos estimados
          user_preferences: {}
        }
      };

      const { data, error } = await supabase
        .from('user_flow_progress')
        .insert({
          ...flowProgress,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao inicializar fluxo do usuário:', error);
      throw new Error('Falha ao inicializar jornada do usuário');
    }
  }

  /**
   * Busca o progresso atual do usuário
   */
  async getUserFlowProgress(userId: string): Promise<UserFlowProgress | null> {
    try {
      const { data, error } = await supabase
        .from('user_flow_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data || null;
    } catch (error) {
      console.error('Erro ao buscar progresso do usuário:', error);
      return null;
    }
  }

  /**
   * Verifica se uma transição é possível
   */
  async canTransition(userId: string, toStep: FlowStep): Promise<{
    canTransition: boolean;
    missingRequirements: string[];
    nextActions: string[];
  }> {
    try {
      const progress = await this.getUserFlowProgress(userId);
      if (!progress) {
        return {
          canTransition: false,
          missingRequirements: ['User flow not initialized'],
          nextActions: ['Initialize user flow']
        };
      }

      const transition = this.flowTransitions.find(
        t => t.from === progress.current_step && t.to === toStep
      );

      if (!transition) {
        return {
          canTransition: false,
          missingRequirements: ['Invalid transition'],
          nextActions: [`Complete ${progress.current_step} first`]
        };
      }

      const missingRequirements: string[] = [];
      const nextActions: string[] = [];

      // Verificar dados obrigatórios
      if (transition.conditions.required_data) {
        for (const dataKey of transition.conditions.required_data) {
          if (!progress.step_data[progress.current_step]?.[dataKey]) {
            missingRequirements.push(`Missing ${dataKey}`);
            nextActions.push(`Provide ${dataKey}`);
          }
        }
      }

      // Verificar ações do usuário
      if (transition.conditions.user_actions) {
        for (const action of transition.conditions.user_actions) {
          const actionCompleted = progress.step_data[progress.current_step]?.completed_actions?.includes(action);
          if (!actionCompleted) {
            missingRequirements.push(`Action required: ${action}`);
            nextActions.push(`Complete ${action}`);
          }
        }
      }

      // Verificar nível de assinatura
      if (transition.conditions.subscription_level) {
        const userSubscription = await this.getUserSubscriptionLevel(userId);
        if (userSubscription !== transition.conditions.subscription_level && 
            transition.conditions.subscription_level === 'pro') {
          missingRequirements.push('PRO subscription required');
          nextActions.push('Upgrade to PRO');
        }
      }

      return {
        canTransition: missingRequirements.length === 0,
        missingRequirements,
        nextActions
      };
    } catch (error) {
      console.error('Erro ao verificar transição:', error);
      return {
        canTransition: false,
        missingRequirements: ['System error'],
        nextActions: ['Try again later']
      };
    }
  }

  /**
   * Executa transição para próximo passo
   */
  async transitionToStep(userId: string, toStep: FlowStep, stepData?: any): Promise<UserFlowProgress> {
    try {
      const canTransitionResult = await this.canTransition(userId, toStep);
      
      if (!canTransitionResult.canTransition) {
        throw new Error(`Cannot transition to ${toStep}: ${canTransitionResult.missingRequirements.join(', ')}`);
      }

      const progress = await this.getUserFlowProgress(userId);
      if (!progress) throw new Error('User flow not found');

      const transition = this.flowTransitions.find(
        t => t.from === progress.current_step && t.to === toStep
      );

      if (!transition) throw new Error('Invalid transition');

      // Executar ações pré-transição
      if (transition.actions.pre_transition) {
        await transition.actions.pre_transition();
      }

      // Atualizar progresso
      const updatedProgress: UserFlowProgress = {
        ...progress,
        current_step: toStep,
        completed_steps: [...progress.completed_steps, progress.current_step],
        step_data: {
          ...progress.step_data,
          [toStep]: stepData || {}
        },
        flow_metadata: {
          ...progress.flow_metadata,
          last_activity: new Date().toISOString(),
          completion_percentage: this.calculateCompletionPercentage([...progress.completed_steps, progress.current_step]),
          estimated_time_remaining: this.calculateRemainingTime([...progress.completed_steps, progress.current_step])
        },
        updated_at: new Date().toISOString()
      };

      // Salvar no banco
      const { data, error } = await supabase
        .from('user_flow_progress')
        .update(updatedProgress)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Executar ações pós-transição
      if (transition.actions.post_transition) {
        await transition.actions.post_transition();
      }

      // Enviar notificações
      if (transition.actions.notifications) {
        await this.sendFlowNotifications(userId, transition.actions.notifications);
      }

      return data;
    } catch (error) {
      console.error('Erro na transição de fluxo:', error);
      throw error;
    }
  }

  /**
   * Atualiza dados de um passo específico
   */
  async updateStepData(userId: string, step: FlowStep, data: any): Promise<void> {
    try {
      const progress = await this.getUserFlowProgress(userId);
      if (!progress) throw new Error('User flow not found');

      const updatedStepData = {
        ...progress.step_data,
        [step]: {
          ...progress.step_data[step],
          ...data,
          updated_at: new Date().toISOString()
        }
      };

      const { error } = await supabase
        .from('user_flow_progress')
        .update({
          step_data: updatedStepData,
          'flow_metadata.last_activity': new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar dados do passo:', error);
      throw error;
    }
  }

  /**
   * Marca uma ação como completada
   */
  async markActionCompleted(userId: string, action: string): Promise<void> {
    try {
      const progress = await this.getUserFlowProgress(userId);
      if (!progress) throw new Error('User flow not found');

      const currentStepData = progress.step_data[progress.current_step] || {};
      const completedActions = currentStepData.completed_actions || [];

      if (!completedActions.includes(action)) {
        await this.updateStepData(userId, progress.current_step, {
          completed_actions: [...completedActions, action]
        });
      }
    } catch (error) {
      console.error('Erro ao marcar ação como completada:', error);
      throw error;
    }
  }

  /**
   * Obtém próximos passos recomendados
   */
  async getNextRecommendedActions(userId: string): Promise<{
    currentStep: FlowStep;
    nextStep?: FlowStep;
    recommendedActions: string[];
    blockers: string[];
  }> {
    try {
      const progress = await this.getUserFlowProgress(userId);
      if (!progress) {
        return {
          currentStep: 'dreams_start',
          nextStep: 'dreams_completion',
          recommendedActions: ['Start your dreams journey'],
          blockers: []
        };
      }

      const nextTransition = this.flowTransitions.find(t => t.from === progress.current_step);
      
      if (!nextTransition) {
        return {
          currentStep: progress.current_step,
          recommendedActions: ['Journey completed'],
          blockers: []
        };
      }

      const canTransitionResult = await this.canTransition(userId, nextTransition.to);

      return {
        currentStep: progress.current_step,
        nextStep: nextTransition.to,
        recommendedActions: canTransitionResult.nextActions,
        blockers: canTransitionResult.missingRequirements
      };
    } catch (error) {
      console.error('Erro ao obter próximas ações:', error);
      return {
        currentStep: 'dreams_start',
        recommendedActions: ['System error - please try again'],
        blockers: ['System error']
      };
    }
  }

  /**
   * Métodos auxiliares privados
   */
  private calculateCompletionPercentage(completedSteps: FlowStep[]): number {
    const totalSteps = 6; // Total de passos no fluxo
    return Math.round((completedSteps.length / totalSteps) * 100);
  }

  private calculateRemainingTime(completedSteps: FlowStep[]): number {
    const stepTimes = {
      'dreams_start': 15,
      'dreams_completion': 10,
      'pdf_generation': 5,
      'visamatch_analysis': 10,
      'specialist_consultation': 20,
      'action_plan_creation': 5
    };

    const remainingSteps = Object.keys(stepTimes).filter(
      step => !completedSteps.includes(step as FlowStep)
    ) as FlowStep[];

    return remainingSteps.reduce((total, step) => total + stepTimes[step], 0);
  }

  private async getUserSubscriptionLevel(userId: string): Promise<'free' | 'pro'> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) return 'free';
      
      return data?.role === 'pro' ? 'pro' : 'free';
    } catch (error) {
      return 'free';
    }
  }

  private async checkPDFAccess(): Promise<void> {
    // Implementar verificação de acesso ao PDF baseada na data de lançamento
    const launchDate = new Date('2025-08-01');
    const currentDate = new Date();
    const daysSinceLaunch = Math.floor((currentDate.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLaunch > 60) {
      // Após 60 dias, verificar se é usuário PRO
      // Esta lógica será implementada no componente de PDF
    }
  }

  private async prepareSpecialistContext(): Promise<void> {
    // Preparar contexto para transferir ao especialista
    // Utiliza o contextService já implementado
  }

  private async completeUserJourney(): Promise<void> {
    // Ações finais quando a jornada é completada
    // Agendar follow-ups, enviar certificados, etc.
  }

  private async sendFlowNotifications(userId: string, notifications: string[]): Promise<void> {
    // Implementar sistema de notificações
    console.log(`Sending notifications to ${userId}:`, notifications);
  }

  /**
   * Reinicia o fluxo do usuário
   */
  async resetUserFlow(userId: string): Promise<UserFlowProgress> {
    try {
      const { error: deleteError } = await supabase
        .from('user_flow_progress')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      return await this.initializeUserFlow(userId);
    } catch (error) {
      console.error('Erro ao reiniciar fluxo:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas do fluxo
   */
  async getFlowAnalytics(userId: string): Promise<{
    totalTimeSpent: number;
    stepsCompleted: number;
    averageStepTime: number;
    dropOffPoints: FlowStep[];
    completionRate: number;
  }> {
    try {
      const progress = await this.getUserFlowProgress(userId);
      if (!progress) {
        return {
          totalTimeSpent: 0,
          stepsCompleted: 0,
          averageStepTime: 0,
          dropOffPoints: [],
          completionRate: 0
        };
      }

      const startTime = new Date(progress.flow_metadata.started_at);
      const lastActivity = new Date(progress.flow_metadata.last_activity);
      const totalTimeSpent = Math.floor((lastActivity.getTime() - startTime.getTime()) / (1000 * 60)); // em minutos

      return {
        totalTimeSpent,
        stepsCompleted: progress.completed_steps.length,
        averageStepTime: progress.completed_steps.length > 0 ? totalTimeSpent / progress.completed_steps.length : 0,
        dropOffPoints: [], // Implementar análise de drop-off
        completionRate: progress.flow_metadata.completion_percentage
      };
    } catch (error) {
      console.error('Erro ao obter analytics:', error);
      throw error;
    }
  }
}

export const unifiedFlowService = new UnifiedFlowService();
export default unifiedFlowService;
