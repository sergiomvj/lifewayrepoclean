import { supabase } from '@/integrations/supabase/client';

export interface ToolAchievement {
  id: string;
  name: string;
  description: string;
  tool: 'dreams' | 'visa_match' | 'specialist_chat' | 'pdf_generation' | 'unified_dashboard' | 'all_tools';
  category: 'usage' | 'mastery' | 'consistency' | 'quality' | 'social' | 'milestone';
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  icon: string;
  color: string;
  points: number;
  criteria: {
    type: 'count' | 'streak' | 'quality_score' | 'time_based' | 'completion_rate' | 'combination';
    value: number;
    timeframe?: 'day' | 'week' | 'month' | 'all_time';
    conditions?: Record<string, any>;
  };
  isSecret?: boolean;
  prerequisites?: string[];
  rewards?: {
    badge?: string;
    title?: string;
    feature_unlock?: string;
    bonus_points?: number;
  };
}

class ToolAchievementsService {
  private readonly TOOL_ACHIEVEMENTS: ToolAchievement[] = [
    // === DREAMS TOOL ACHIEVEMENTS ===
    {
      id: 'dreams_first_creation',
      name: 'Primeiro Sonho',
      description: 'Criou seu primeiro sonho no Dreams',
      tool: 'dreams',
      category: 'milestone',
      difficulty: 'bronze',
      icon: 'Star',
      color: 'yellow',
      points: 50,
      criteria: { type: 'count', value: 1 },
      rewards: { badge: 'dreamer_badge', title: 'Sonhador Iniciante' }
    },
    {
      id: 'dreams_prolific_creator',
      name: 'Criador Prolífico',
      description: 'Criou 10 sonhos diferentes',
      tool: 'dreams',
      category: 'usage',
      difficulty: 'silver',
      icon: 'Lightbulb',
      color: 'blue',
      points: 200,
      criteria: { type: 'count', value: 10 },
      rewards: { bonus_points: 100, title: 'Criador de Sonhos' }
    },
    {
      id: 'dreams_master_planner',
      name: 'Planejador Mestre',
      description: 'Criou 25 sonhos com alta qualidade (score > 80%)',
      tool: 'dreams',
      category: 'quality',
      difficulty: 'gold',
      icon: 'Crown',
      color: 'gold',
      points: 500,
      criteria: { 
        type: 'combination', 
        value: 25,
        conditions: { min_quality_score: 80 }
      },
      rewards: { feature_unlock: 'dreams_advanced_analytics', title: 'Mestre dos Sonhos' }
    },
    {
      id: 'dreams_consistency_champion',
      name: 'Campeão da Consistência',
      description: 'Criou pelo menos 1 sonho por dia durante 30 dias',
      tool: 'dreams',
      category: 'consistency',
      difficulty: 'platinum',
      icon: 'Calendar',
      color: 'purple',
      points: 1000,
      criteria: { 
        type: 'streak', 
        value: 30,
        timeframe: 'day'
      },
      rewards: { feature_unlock: 'dreams_premium_templates', title: 'Sonhador Consistente' }
    },
    {
      id: 'dreams_visionary',
      name: 'Visionário',
      description: 'Criou 100 sonhos únicos e inspiradores',
      tool: 'dreams',
      category: 'mastery',
      difficulty: 'diamond',
      icon: 'Eye',
      color: 'diamond',
      points: 2500,
      criteria: { type: 'count', value: 100 },
      isSecret: true,
      rewards: { 
        feature_unlock: 'dreams_ai_assistant', 
        title: 'Visionário LifeWay',
        bonus_points: 1000
      }
    },

    // === VISA MATCH TOOL ACHIEVEMENTS ===
    {
      id: 'visa_first_match',
      name: 'Primeira Correspondência',
      description: 'Encontrou sua primeira correspondência de visto',
      tool: 'visa_match',
      category: 'milestone',
      difficulty: 'bronze',
      icon: 'Shield',
      color: 'green',
      points: 75,
      criteria: { type: 'count', value: 1 },
      rewards: { badge: 'visa_explorer_badge', title: 'Explorador de Vistos' }
    },
    {
      id: 'visa_thorough_researcher',
      name: 'Pesquisador Minucioso',
      description: 'Analisou 20 opções de visto diferentes',
      tool: 'visa_match',
      category: 'usage',
      difficulty: 'silver',
      icon: 'Search',
      color: 'blue',
      points: 300,
      criteria: { type: 'count', value: 20 },
      rewards: { bonus_points: 150, title: 'Pesquisador de Vistos' }
    },
    {
      id: 'visa_accuracy_expert',
      name: 'Especialista em Precisão',
      description: 'Obteve 95% de precisão em 10 análises de visto',
      tool: 'visa_match',
      category: 'quality',
      difficulty: 'gold',
      icon: 'Target',
      color: 'gold',
      points: 750,
      criteria: { 
        type: 'combination', 
        value: 10,
        conditions: { min_accuracy: 95 }
      },
      rewards: { feature_unlock: 'visa_premium_analysis', title: 'Especialista em Vistos' }
    },
    {
      id: 'visa_country_explorer',
      name: 'Explorador de Países',
      description: 'Pesquisou vistos para 15 países diferentes',
      tool: 'visa_match',
      category: 'mastery',
      difficulty: 'platinum',
      icon: 'Globe',
      color: 'purple',
      points: 1200,
      criteria: { 
        type: 'combination', 
        value: 15,
        conditions: { unique_countries: true }
      },
      rewards: { feature_unlock: 'visa_global_insights', title: 'Explorador Global' }
    },
    {
      id: 'visa_immigration_guru',
      name: 'Guru da Imigração',
      description: 'Completou análises para todos os tipos de visto disponíveis',
      tool: 'visa_match',
      category: 'mastery',
      difficulty: 'diamond',
      icon: 'Award',
      color: 'diamond',
      points: 3000,
      criteria: { 
        type: 'combination', 
        value: 100,
        conditions: { all_visa_types: true }
      },
      isSecret: true,
      rewards: { 
        feature_unlock: 'visa_expert_consultation', 
        title: 'Guru da Imigração',
        bonus_points: 1500
      }
    },

    // === SPECIALIST CHAT ACHIEVEMENTS ===
    {
      id: 'chat_first_conversation',
      name: 'Primeira Conversa',
      description: 'Iniciou sua primeira conversa com um especialista',
      tool: 'specialist_chat',
      category: 'milestone',
      difficulty: 'bronze',
      icon: 'MessageSquare',
      color: 'blue',
      points: 60,
      criteria: { type: 'count', value: 1 },
      rewards: { badge: 'communicator_badge', title: 'Comunicador' }
    },
    {
      id: 'chat_active_learner',
      name: 'Aprendiz Ativo',
      description: 'Participou de 25 conversas com especialistas',
      tool: 'specialist_chat',
      category: 'usage',
      difficulty: 'silver',
      icon: 'BookOpen',
      color: 'green',
      points: 400,
      criteria: { type: 'count', value: 25 },
      rewards: { bonus_points: 200, title: 'Aprendiz Dedicado' }
    },
    {
      id: 'chat_problem_solver',
      name: 'Solucionador de Problemas',
      description: 'Resolveu 15 questões complexas através do chat',
      tool: 'specialist_chat',
      category: 'quality',
      difficulty: 'gold',
      icon: 'Puzzle',
      color: 'gold',
      points: 800,
      criteria: { 
        type: 'combination', 
        value: 15,
        conditions: { problem_solved: true }
      },
      rewards: { feature_unlock: 'chat_priority_support', title: 'Solucionador Expert' }
    },
    {
      id: 'chat_mentor_candidate',
      name: 'Candidato a Mentor',
      description: 'Ajudou outros usuários em 10 conversas em grupo',
      tool: 'specialist_chat',
      category: 'social',
      difficulty: 'platinum',
      icon: 'Users',
      color: 'purple',
      points: 1500,
      criteria: { 
        type: 'combination', 
        value: 10,
        conditions: { helped_others: true }
      },
      rewards: { feature_unlock: 'chat_mentor_tools', title: 'Candidato a Mentor' }
    },
    {
      id: 'chat_wisdom_keeper',
      name: 'Guardião da Sabedoria',
      description: 'Acumulou 1000 horas de conversas produtivas',
      tool: 'specialist_chat',
      category: 'mastery',
      difficulty: 'diamond',
      icon: 'Brain',
      color: 'diamond',
      points: 4000,
      criteria: { 
        type: 'time_based', 
        value: 1000,
        conditions: { unit: 'hours', quality_threshold: 80 }
      },
      isSecret: true,
      rewards: { 
        feature_unlock: 'chat_wisdom_library', 
        title: 'Guardião da Sabedoria',
        bonus_points: 2000
      }
    },

    // === PDF GENERATION ACHIEVEMENTS ===
    {
      id: 'pdf_first_document',
      name: 'Primeiro Documento',
      description: 'Gerou seu primeiro PDF personalizado',
      tool: 'pdf_generation',
      category: 'milestone',
      difficulty: 'bronze',
      icon: 'FileText',
      color: 'red',
      points: 40,
      criteria: { type: 'count', value: 1 },
      rewards: { badge: 'documenter_badge', title: 'Documentador' }
    },
    {
      id: 'pdf_efficient_organizer',
      name: 'Organizador Eficiente',
      description: 'Gerou 50 documentos PDF organizados',
      tool: 'pdf_generation',
      category: 'usage',
      difficulty: 'silver',
      icon: 'FolderOpen',
      color: 'orange',
      points: 250,
      criteria: { type: 'count', value: 50 },
      rewards: { bonus_points: 125, title: 'Organizador Expert' }
    },
    {
      id: 'pdf_quality_curator',
      name: 'Curador de Qualidade',
      description: 'Gerou 20 PDFs com alta qualidade de formatação',
      tool: 'pdf_generation',
      category: 'quality',
      difficulty: 'gold',
      icon: 'Sparkles',
      color: 'gold',
      points: 600,
      criteria: { 
        type: 'combination', 
        value: 20,
        conditions: { quality_score: 90 }
      },
      rewards: { feature_unlock: 'pdf_premium_templates', title: 'Curador de Documentos' }
    },
    {
      id: 'pdf_automation_master',
      name: 'Mestre da Automação',
      description: 'Configurou 10 templates automáticos de PDF',
      tool: 'pdf_generation',
      category: 'mastery',
      difficulty: 'platinum',
      icon: 'Zap',
      color: 'purple',
      points: 1000,
      criteria: { 
        type: 'combination', 
        value: 10,
        conditions: { automated_templates: true }
      },
      rewards: { feature_unlock: 'pdf_ai_automation', title: 'Mestre da Automação' }
    },

    // === UNIFIED DASHBOARD ACHIEVEMENTS ===
    {
      id: 'dashboard_first_visit',
      name: 'Primeira Visita',
      description: 'Acessou o Dashboard Unificado pela primeira vez',
      tool: 'unified_dashboard',
      category: 'milestone',
      difficulty: 'bronze',
      icon: 'BarChart3',
      color: 'blue',
      points: 30,
      criteria: { type: 'count', value: 1 },
      rewards: { badge: 'navigator_badge', title: 'Navegador' }
    },
    {
      id: 'dashboard_daily_user',
      name: 'Usuário Diário',
      description: 'Acessou o dashboard todos os dias por 2 semanas',
      tool: 'unified_dashboard',
      category: 'consistency',
      difficulty: 'silver',
      icon: 'Calendar',
      color: 'green',
      points: 350,
      criteria: { 
        type: 'streak', 
        value: 14,
        timeframe: 'day'
      },
      rewards: { bonus_points: 175, title: 'Usuário Consistente' }
    },
    {
      id: 'dashboard_power_user',
      name: 'Usuário Avançado',
      description: 'Utilizou todas as funcionalidades do dashboard',
      tool: 'unified_dashboard',
      category: 'mastery',
      difficulty: 'gold',
      icon: 'Settings',
      color: 'gold',
      points: 700,
      criteria: { 
        type: 'combination', 
        value: 100,
        conditions: { all_features_used: true }
      },
      rewards: { feature_unlock: 'dashboard_customization', title: 'Usuário Avançado' }
    },

    // === CROSS-TOOL ACHIEVEMENTS ===
    {
      id: 'all_tools_explorer',
      name: 'Explorador Completo',
      description: 'Utilizou todas as ferramentas do LifeWay',
      tool: 'all_tools',
      category: 'milestone',
      difficulty: 'gold',
      icon: 'Compass',
      color: 'rainbow',
      points: 1000,
      criteria: { 
        type: 'combination', 
        value: 5,
        conditions: { all_tools_used: true }
      },
      rewards: { 
        feature_unlock: 'cross_tool_insights', 
        title: 'Explorador LifeWay',
        bonus_points: 500
      }
    },
    {
      id: 'all_tools_synergy_master',
      name: 'Mestre da Sinergia',
      description: 'Utilizou combinações eficazes de ferramentas em 20 projetos',
      tool: 'all_tools',
      category: 'mastery',
      difficulty: 'platinum',
      icon: 'Link',
      color: 'rainbow',
      points: 2000,
      criteria: { 
        type: 'combination', 
        value: 20,
        conditions: { synergy_projects: true }
      },
      rewards: { 
        feature_unlock: 'advanced_workflow_automation', 
        title: 'Mestre da Sinergia',
        bonus_points: 1000
      }
    },
    {
      id: 'all_tools_lifeway_legend',
      name: 'Lenda LifeWay',
      description: 'Alcançou maestria em todas as ferramentas e ajudou 100 usuários',
      tool: 'all_tools',
      category: 'mastery',
      difficulty: 'diamond',
      icon: 'Crown',
      color: 'rainbow',
      points: 5000,
      criteria: { 
        type: 'combination', 
        value: 100,
        conditions: { 
          all_tools_mastery: true,
          users_helped: 100
        }
      },
      isSecret: true,
      rewards: { 
        feature_unlock: 'lifeway_legend_status', 
        title: 'Lenda LifeWay',
        bonus_points: 3000
      }
    }
  ];

  // Obter conquistas por ferramenta
  getAchievementsByTool(tool: ToolAchievement['tool']): ToolAchievement[] {
    return this.TOOL_ACHIEVEMENTS.filter(achievement => 
      achievement.tool === tool || achievement.tool === 'all_tools'
    );
  }

  // Obter conquistas por categoria
  getAchievementsByCategory(category: ToolAchievement['category']): ToolAchievement[] {
    return this.TOOL_ACHIEVEMENTS.filter(achievement => achievement.category === category);
  }

  // Obter conquistas por dificuldade
  getAchievementsByDifficulty(difficulty: ToolAchievement['difficulty']): ToolAchievement[] {
    return this.TOOL_ACHIEVEMENTS.filter(achievement => achievement.difficulty === difficulty);
  }

  // Obter conquistas secretas
  getSecretAchievements(): ToolAchievement[] {
    return this.TOOL_ACHIEVEMENTS.filter(achievement => achievement.isSecret);
  }

  // Verificar se usuário pode desbloquear uma conquista
  async canUnlockAchievement(
    userId: string, 
    achievementId: string, 
    userStats: Record<string, any>
  ): Promise<boolean> {
    const achievement = this.TOOL_ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return false;

    // Verificar pré-requisitos
    if (achievement.prerequisites) {
      const unlockedAchievements = await this.getUserUnlockedAchievements(userId);
      const hasPrerequisites = achievement.prerequisites.every(prereq =>
        unlockedAchievements.some(ua => ua.achievement_id === prereq)
      );
      if (!hasPrerequisites) return false;
    }

    // Verificar critérios
    return this.checkCriteria(achievement.criteria, userStats);
  }

  // Verificar critérios de conquista
  private checkCriteria(criteria: ToolAchievement['criteria'], userStats: Record<string, any>): boolean {
    switch (criteria.type) {
      case 'count':
        return userStats.count >= criteria.value;
      
      case 'streak':
        return userStats.streak >= criteria.value;
      
      case 'quality_score':
        return userStats.quality_score >= criteria.value;
      
      case 'time_based':
        return userStats.time_spent >= criteria.value;
      
      case 'completion_rate':
        return userStats.completion_rate >= criteria.value;
      
      case 'combination':
        if (!criteria.conditions) return false;
        return Object.entries(criteria.conditions).every(([key, value]) => {
          if (typeof value === 'boolean') {
            return !!userStats[key] === value;
          }
          return userStats[key] >= value;
        });
      
      default:
        return false;
    }
  }

  // Desbloquear conquista para usuário
  async unlockAchievement(userId: string, achievementId: string): Promise<boolean> {
    try {
      const achievement = this.TOOL_ACHIEVEMENTS.find(a => a.id === achievementId);
      if (!achievement) return false;

      // Verificar se já foi desbloqueada
      const { data: existing } = await supabase
        .from('user_tool_achievements')
        .select('*')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .single();

      if (existing) return false;

      // Desbloquear conquista
      const { error } = await supabase
        .from('user_tool_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievementId,
          unlocked_at: new Date().toISOString(),
          points_earned: achievement.points
        });

      if (error) throw error;

      // Adicionar pontos ao usuário
      await this.addPointsToUser(userId, achievement.points);

      return true;
    } catch (error) {
      console.error('Erro ao desbloquear conquista:', error);
      return false;
    }
  }

  // Obter conquistas desbloqueadas do usuário
  async getUserUnlockedAchievements(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_tool_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar conquistas do usuário:', error);
      return [];
    }
  }

  // Obter estatísticas de conquistas do usuário
  async getUserAchievementStats(userId: string): Promise<{
    totalUnlocked: number;
    totalPoints: number;
    byTool: Record<string, number>;
    byDifficulty: Record<string, number>;
    secretsUnlocked: number;
  }> {
    try {
      const unlockedAchievements = await this.getUserUnlockedAchievements(userId);
      const achievements = unlockedAchievements.map(ua => 
        this.TOOL_ACHIEVEMENTS.find(a => a.id === ua.achievement_id)
      ).filter(Boolean) as ToolAchievement[];

      const byTool: Record<string, number> = {};
      const byDifficulty: Record<string, number> = {};
      let secretsUnlocked = 0;
      let totalPoints = 0;

      achievements.forEach(achievement => {
        byTool[achievement.tool] = (byTool[achievement.tool] || 0) + 1;
        byDifficulty[achievement.difficulty] = (byDifficulty[achievement.difficulty] || 0) + 1;
        totalPoints += achievement.points;
        if (achievement.isSecret) secretsUnlocked++;
      });

      return {
        totalUnlocked: achievements.length,
        totalPoints,
        byTool,
        byDifficulty,
        secretsUnlocked
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de conquistas:', error);
      return {
        totalUnlocked: 0,
        totalPoints: 0,
        byTool: {},
        byDifficulty: {},
        secretsUnlocked: 0
      };
    }
  }

  // Adicionar pontos ao usuário
  private async addPointsToUser(userId: string, points: number): Promise<void> {
    try {
      const { error } = await supabase.rpc('add_user_points', {
        user_id: userId,
        points_to_add: points
      });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao adicionar pontos:', error);
    }
  }

  // Obter todas as conquistas
  getAllAchievements(): ToolAchievement[] {
    return this.TOOL_ACHIEVEMENTS;
  }

  // Obter conquista por ID
  getAchievementById(id: string): ToolAchievement | undefined {
    return this.TOOL_ACHIEVEMENTS.find(achievement => achievement.id === id);
  }

  // Verificar múltiplas conquistas para desbloqueio
  async checkAndUnlockAchievements(
    userId: string, 
    tool: ToolAchievement['tool'], 
    userStats: Record<string, any>
  ): Promise<ToolAchievement[]> {
    const toolAchievements = this.getAchievementsByTool(tool);
    const unlockedAchievements: ToolAchievement[] = [];

    for (const achievement of toolAchievements) {
      const canUnlock = await this.canUnlockAchievement(userId, achievement.id, userStats);
      if (canUnlock) {
        const unlocked = await this.unlockAchievement(userId, achievement.id);
        if (unlocked) {
          unlockedAchievements.push(achievement);
        }
      }
    }

    return unlockedAchievements;
  }
}

export const toolAchievementsService = new ToolAchievementsService();
export default toolAchievementsService;
