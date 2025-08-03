import { supabase } from '@/integrations/supabase/client';

// Tipos para o sistema de gamificação
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'progress' | 'engagement' | 'milestone' | 'special';
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: {
    type: 'completion_percentage' | 'tool_usage' | 'time_spent' | 'streak' | 'custom';
    value: number;
    metadata?: any;
  };
  unlocked: boolean;
  unlocked_at?: string;
  progress?: number;
  max_progress?: number;
}

export interface UserLevel {
  level: number;
  title: string;
  min_points: number;
  max_points: number;
  benefits: string[];
  badge_color: string;
}

export interface GamificationStats {
  total_points: number;
  current_level: UserLevel;
  next_level?: UserLevel;
  points_to_next_level: number;
  achievements_unlocked: number;
  total_achievements: number;
  current_streak: number;
  longest_streak: number;
  badges: string[];
  recent_achievements: Achievement[];
}

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: 'tool_usage' | 'achievement_unlock' | 'level_up' | 'streak_milestone';
  tool_name?: string;
  points_earned: number;
  metadata: any;
  created_at: string;
}

class GamificationService {
  // Definições de níveis
  private readonly USER_LEVELS: UserLevel[] = [
    {
      level: 1,
      title: 'Explorador',
      min_points: 0,
      max_points: 99,
      benefits: ['Acesso básico às ferramentas'],
      badge_color: 'gray'
    },
    {
      level: 2,
      title: 'Sonhador',
      min_points: 100,
      max_points: 299,
      benefits: ['Acesso ao Criador de Sonhos', 'Relatórios básicos'],
      badge_color: 'blue'
    },
    {
      level: 3,
      title: 'Estrategista',
      min_points: 300,
      max_points: 599,
      benefits: ['Acesso ao VisaMatch', 'Análises detalhadas'],
      badge_color: 'green'
    },
    {
      level: 4,
      title: 'Especialista',
      min_points: 600,
      max_points: 999,
      benefits: ['Chat com especialistas', 'Relatórios premium'],
      badge_color: 'purple'
    },
    {
      level: 5,
      title: 'Mestre da Jornada',
      min_points: 1000,
      max_points: 1999,
      benefits: ['Todas as ferramentas', 'Suporte prioritário'],
      badge_color: 'gold'
    },
    {
      level: 6,
      title: 'Lenda LifeWay',
      min_points: 2000,
      max_points: Infinity,
      benefits: ['Status VIP', 'Acesso antecipado a novas features'],
      badge_color: 'rainbow'
    }
  ];

  // Definições de conquistas
  private readonly ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlocked_at' | 'progress'>[] = [
    // Conquistas de Progresso
    {
      id: 'first_steps',
      title: 'Primeiros Passos',
      description: 'Complete 10% da sua jornada',
      icon: 'footprints',
      category: 'progress',
      points: 50,
      rarity: 'common',
      requirements: {
        type: 'completion_percentage',
        value: 10
      }
    },
    {
      id: 'quarter_journey',
      title: 'Um Quarto do Caminho',
      description: 'Complete 25% da sua jornada',
      icon: 'map',
      category: 'progress',
      points: 100,
      rarity: 'common',
      requirements: {
        type: 'completion_percentage',
        value: 25
      }
    },
    {
      id: 'halfway_hero',
      title: 'Herói do Meio Caminho',
      description: 'Complete 50% da sua jornada',
      icon: 'star',
      category: 'progress',
      points: 200,
      rarity: 'rare',
      requirements: {
        type: 'completion_percentage',
        value: 50
      }
    },
    {
      id: 'three_quarters',
      title: 'Quase Lá',
      description: 'Complete 75% da sua jornada',
      icon: 'target',
      category: 'progress',
      points: 300,
      rarity: 'rare',
      requirements: {
        type: 'completion_percentage',
        value: 75
      }
    },
    {
      id: 'journey_complete',
      title: 'Jornada Completa',
      description: 'Complete 100% da sua jornada LifeWay',
      icon: 'trophy',
      category: 'milestone',
      points: 500,
      rarity: 'epic',
      requirements: {
        type: 'completion_percentage',
        value: 100
      }
    },

    // Conquistas de Ferramentas
    {
      id: 'dream_creator',
      title: 'Criador de Sonhos',
      description: 'Use o Criador de Sonhos pela primeira vez',
      icon: 'cloud',
      category: 'engagement',
      points: 75,
      rarity: 'common',
      requirements: {
        type: 'tool_usage',
        value: 1,
        metadata: { tool: 'dreams' }
      }
    },
    {
      id: 'visa_strategist',
      title: 'Estrategista de Visto',
      description: 'Complete uma análise VisaMatch',
      icon: 'shield',
      category: 'engagement',
      points: 100,
      rarity: 'common',
      requirements: {
        type: 'tool_usage',
        value: 1,
        metadata: { tool: 'visamatch' }
      }
    },
    {
      id: 'pdf_master',
      title: 'Mestre do PDF',
      description: 'Gere seu primeiro relatório PDF',
      icon: 'file-text',
      category: 'engagement',
      points: 125,
      rarity: 'rare',
      requirements: {
        type: 'tool_usage',
        value: 1,
        metadata: { tool: 'pdf_generation' }
      }
    },
    {
      id: 'expert_consulter',
      title: 'Consultor Expert',
      description: 'Converse com um especialista',
      icon: 'message-circle',
      category: 'engagement',
      points: 150,
      rarity: 'rare',
      requirements: {
        type: 'tool_usage',
        value: 1,
        metadata: { tool: 'specialist_chat' }
      }
    },

    // Conquistas de Engajamento
    {
      id: 'active_user',
      title: 'Usuário Ativo',
      description: 'Use a plataforma por 3 dias consecutivos',
      icon: 'calendar',
      category: 'engagement',
      points: 100,
      rarity: 'common',
      requirements: {
        type: 'streak',
        value: 3
      }
    },
    {
      id: 'dedicated_user',
      title: 'Usuário Dedicado',
      description: 'Use a plataforma por 7 dias consecutivos',
      icon: 'flame',
      category: 'engagement',
      points: 200,
      rarity: 'rare',
      requirements: {
        type: 'streak',
        value: 7
      }
    },
    {
      id: 'power_user',
      title: 'Power User',
      description: 'Passe mais de 2 horas na plataforma',
      icon: 'zap',
      category: 'engagement',
      points: 150,
      rarity: 'rare',
      requirements: {
        type: 'time_spent',
        value: 120 // minutos
      }
    },

    // Conquistas Especiais
    {
      id: 'early_bird',
      title: 'Madrugador',
      description: 'Use a plataforma antes das 7h da manhã',
      icon: 'sunrise',
      category: 'special',
      points: 75,
      rarity: 'rare',
      requirements: {
        type: 'custom',
        value: 1,
        metadata: { condition: 'early_morning_usage' }
      }
    },
    {
      id: 'night_owl',
      title: 'Coruja Noturna',
      description: 'Use a plataforma depois das 23h',
      icon: 'moon',
      category: 'special',
      points: 75,
      rarity: 'rare',
      requirements: {
        type: 'custom',
        value: 1,
        metadata: { condition: 'late_night_usage' }
      }
    },
    {
      id: 'speed_runner',
      title: 'Velocista',
      description: 'Complete a jornada em menos de 2 horas',
      icon: 'rocket',
      category: 'special',
      points: 300,
      rarity: 'epic',
      requirements: {
        type: 'custom',
        value: 1,
        metadata: { condition: 'fast_completion', max_time: 120 }
      }
    },
    {
      id: 'perfectionist',
      title: 'Perfeccionista',
      description: 'Complete todas as ferramentas com 100% de precisão',
      icon: 'award',
      category: 'special',
      points: 400,
      rarity: 'legendary',
      requirements: {
        type: 'custom',
        value: 1,
        metadata: { condition: 'perfect_completion' }
      }
    }
  ];

  // Buscar estatísticas de gamificação do usuário
  async getUserGamificationStats(userId: string): Promise<GamificationStats> {
    try {
      // Buscar pontos totais do usuário
      const { data: userPoints, error: pointsError } = await supabase
        .from('user_gamification')
        .select('total_points, current_streak, longest_streak')
        .eq('user_id', userId)
        .single();

      if (pointsError && pointsError.code !== 'PGRST116') {
        throw pointsError;
      }

      const totalPoints = userPoints?.total_points || 0;
      const currentStreak = userPoints?.current_streak || 0;
      const longestStreak = userPoints?.longest_streak || 0;

      // Determinar nível atual
      const currentLevel = this.getUserLevel(totalPoints);
      const nextLevel = this.getNextLevel(currentLevel.level);
      const pointsToNextLevel = nextLevel ? nextLevel.min_points - totalPoints : 0;

      // Buscar conquistas desbloqueadas
      const { data: unlockedAchievements, error: achievementsError } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', userId)
        .eq('unlocked', true);

      if (achievementsError) {
        throw achievementsError;
      }

      const achievementsUnlocked = unlockedAchievements?.length || 0;

      // Buscar atividades recentes para conquistas recentes
      const { data: recentActivities, error: activitiesError } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .eq('activity_type', 'achievement_unlock')
        .order('created_at', { ascending: false })
        .limit(5);

      if (activitiesError) {
        throw activitiesError;
      }

      const recentAchievements = this.mapActivitiesToAchievements(recentActivities || []);

      return {
        total_points: totalPoints,
        current_level: currentLevel,
        next_level: nextLevel,
        points_to_next_level: Math.max(0, pointsToNextLevel),
        achievements_unlocked: achievementsUnlocked,
        total_achievements: this.ACHIEVEMENTS.length,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        badges: this.getUserBadges(unlockedAchievements || []),
        recent_achievements: recentAchievements
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de gamificação:', error);
      return this.getDefaultStats();
    }
  }

  // Buscar conquistas do usuário
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      const { data: userAchievements, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return this.ACHIEVEMENTS.map(achievement => {
        const userAchievement = userAchievements?.find(ua => ua.achievement_id === achievement.id);
        
        return {
          ...achievement,
          unlocked: userAchievement?.unlocked || false,
          unlocked_at: userAchievement?.unlocked_at,
          progress: userAchievement?.progress || 0,
          max_progress: achievement.requirements.value
        };
      });
    } catch (error) {
      console.error('Erro ao buscar conquistas:', error);
      return this.ACHIEVEMENTS.map(achievement => ({
        ...achievement,
        unlocked: false,
        progress: 0,
        max_progress: achievement.requirements.value
      }));
    }
  }

  // Verificar e desbloquear conquistas
  async checkAndUnlockAchievements(userId: string, context: {
    completionPercentage?: number;
    toolUsage?: { tool: string; count: number };
    timeSpent?: number;
    streak?: number;
    customConditions?: any;
  }): Promise<Achievement[]> {
    const newlyUnlocked: Achievement[] = [];

    try {
      const userAchievements = await this.getUserAchievements(userId);
      
      for (const achievement of userAchievements) {
        if (achievement.unlocked) continue;

        const shouldUnlock = await this.checkAchievementRequirement(achievement, context);
        
        if (shouldUnlock) {
          await this.unlockAchievement(userId, achievement);
          newlyUnlocked.push({
            ...achievement,
            unlocked: true,
            unlocked_at: new Date().toISOString()
          });
        }
      }

      return newlyUnlocked;
    } catch (error) {
      console.error('Erro ao verificar conquistas:', error);
      return [];
    }
  }

  // Adicionar pontos ao usuário
  async addPoints(userId: string, points: number, source: string, metadata?: any): Promise<void> {
    try {
      // Buscar pontos atuais
      const { data: currentData, error: fetchError } = await supabase
        .from('user_gamification')
        .select('total_points')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      const currentPoints = currentData?.total_points || 0;
      const newTotal = currentPoints + points;

      // Atualizar pontos
      const { error: updateError } = await supabase
        .from('user_gamification')
        .upsert({
          user_id: userId,
          total_points: newTotal,
          updated_at: new Date().toISOString()
        });

      if (updateError) {
        throw updateError;
      }

      // Registrar atividade
      await this.logActivity(userId, 'tool_usage', {
        source,
        points_earned: points,
        metadata
      });

      // Verificar se subiu de nível
      const oldLevel = this.getUserLevel(currentPoints);
      const newLevel = this.getUserLevel(newTotal);

      if (newLevel.level > oldLevel.level) {
        await this.logActivity(userId, 'level_up', {
          old_level: oldLevel.level,
          new_level: newLevel.level,
          points_earned: 0
        });
      }

    } catch (error) {
      console.error('Erro ao adicionar pontos:', error);
    }
  }

  // Métodos privados
  private getUserLevel(points: number): UserLevel {
    return this.USER_LEVELS.find(level => 
      points >= level.min_points && points <= level.max_points
    ) || this.USER_LEVELS[0];
  }

  private getNextLevel(currentLevel: number): UserLevel | undefined {
    return this.USER_LEVELS.find(level => level.level === currentLevel + 1);
  }

  private async checkAchievementRequirement(
    achievement: Achievement, 
    context: any
  ): Promise<boolean> {
    const { requirements } = achievement;

    switch (requirements.type) {
      case 'completion_percentage':
        return (context.completionPercentage || 0) >= requirements.value;

      case 'tool_usage':
        if (!context.toolUsage) return false;
        const toolMatch = !requirements.metadata?.tool || 
          context.toolUsage.tool === requirements.metadata.tool;
        return toolMatch && context.toolUsage.count >= requirements.value;

      case 'time_spent':
        return (context.timeSpent || 0) >= requirements.value;

      case 'streak':
        return (context.streak || 0) >= requirements.value;

      case 'custom':
        return this.checkCustomCondition(achievement, context);

      default:
        return false;
    }
  }

  private checkCustomCondition(achievement: Achievement, context: any): boolean {
    const condition = achievement.requirements.metadata?.condition;

    switch (condition) {
      case 'early_morning_usage':
        const morningHour = new Date().getHours();
        return morningHour >= 5 && morningHour < 7;

      case 'late_night_usage':
        const nightHour = new Date().getHours();
        return nightHour >= 23 || nightHour < 5;

      case 'fast_completion':
        const maxTime = achievement.requirements.metadata?.max_time || 120;
        return (context.timeSpent || 0) <= maxTime && (context.completionPercentage || 0) >= 100;

      case 'perfect_completion':
        return context.customConditions?.perfectCompletion === true;

      default:
        return false;
    }
  }

  private async unlockAchievement(userId: string, achievement: Achievement): Promise<void> {
    const { error } = await supabase
      .from('user_achievements')
      .upsert({
        user_id: userId,
        achievement_id: achievement.id,
        unlocked: true,
        unlocked_at: new Date().toISOString(),
        progress: achievement.requirements.value
      });

    if (error) {
      throw error;
    }

    // Adicionar pontos pela conquista
    await this.addPoints(userId, achievement.points, 'achievement_unlock', {
      achievement_id: achievement.id,
      achievement_title: achievement.title
    });

    // Registrar atividade
    await this.logActivity(userId, 'achievement_unlock', {
      achievement_id: achievement.id,
      achievement_title: achievement.title,
      points_earned: achievement.points
    });
  }

  private async logActivity(userId: string, activityType: string, data: any): Promise<void> {
    const { error } = await supabase
      .from('user_activities')
      .insert({
        user_id: userId,
        activity_type: activityType,
        points_earned: data.points_earned || 0,
        metadata: data,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Erro ao registrar atividade:', error);
    }
  }

  private getUserBadges(unlockedAchievements: any[]): string[] {
    const badges: string[] = [];
    
    // Badges baseados em conquistas específicas
    const achievementBadges = {
      'journey_complete': 'journey_master',
      'perfectionist': 'perfectionist_badge',
      'speed_runner': 'speed_demon',
      'dedicated_user': 'loyalty_badge'
    };

    for (const achievement of unlockedAchievements) {
      const badge = achievementBadges[achievement.achievement_id as keyof typeof achievementBadges];
      if (badge) {
        badges.push(badge);
      }
    }

    return badges;
  }

  private mapActivitiesToAchievements(activities: any[]): Achievement[] {
    return activities
      .map(activity => {
        const achievementId = activity.metadata?.achievement_id;
        const baseAchievement = this.ACHIEVEMENTS.find(a => a.id === achievementId);
        
        if (!baseAchievement) return null;

        return {
          ...baseAchievement,
          unlocked: true,
          unlocked_at: activity.created_at
        };
      })
      .filter(Boolean) as Achievement[];
  }

  private getDefaultStats(): GamificationStats {
    return {
      total_points: 0,
      current_level: this.USER_LEVELS[0],
      next_level: this.USER_LEVELS[1],
      points_to_next_level: this.USER_LEVELS[1].min_points,
      achievements_unlocked: 0,
      total_achievements: this.ACHIEVEMENTS.length,
      current_streak: 0,
      longest_streak: 0,
      badges: [],
      recent_achievements: []
    };
  }

  // Métodos públicos para integração
  getAllAchievements(): Omit<Achievement, 'unlocked' | 'unlocked_at' | 'progress'>[] {
    return this.ACHIEVEMENTS;
  }

  getAllLevels(): UserLevel[] {
    return this.USER_LEVELS;
  }

  calculateLevelProgress(points: number): { current: UserLevel; next?: UserLevel; progress: number } {
    const current = this.getUserLevel(points);
    const next = this.getNextLevel(current.level);
    
    if (!next) {
      return { current, progress: 100 };
    }

    const levelRange = next.min_points - current.min_points;
    const currentProgress = points - current.min_points;
    const progress = Math.min(100, (currentProgress / levelRange) * 100);

    return { current, next, progress };
  }
}

export const gamificationService = new GamificationService();
export default gamificationService;
