import { supabase } from '@/integrations/supabase/client';

export interface Reward {
  id: string;
  name: string;
  description: string;
  type: 'feature_unlock' | 'discount' | 'badge' | 'content' | 'priority_support' | 'exclusive_access';
  value: string | number;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requiredLevel: number;
  isActive: boolean;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface UserReward {
  id: string;
  userId: string;
  rewardId: string;
  unlockedAt: Date;
  usedAt?: Date;
  isUsed: boolean;
  reward: Reward;
}

export interface LevelBenefit {
  level: number;
  title: string;
  description: string;
  rewards: Reward[];
  features: string[];
  perks: string[];
  badge?: {
    name: string;
    icon: string;
    color: string;
  };
}

class RewardsService {
  // Definir recompensas por nível
  private readonly LEVEL_BENEFITS: LevelBenefit[] = [
    {
      level: 1,
      title: "Explorador Iniciante",
      description: "Bem-vindo à jornada LifeWay!",
      rewards: [
        {
          id: 'welcome_badge',
          name: 'Badge de Boas-vindas',
          description: 'Seu primeiro badge na jornada LifeWay',
          type: 'badge',
          value: 'welcome',
          icon: 'Star',
          rarity: 'common',
          requiredLevel: 1,
          isActive: true
        }
      ],
      features: ['Acesso ao Dashboard', 'Criador de Sonhos básico'],
      perks: ['Tutorial personalizado', 'Suporte por email'],
      badge: { name: 'Explorador', icon: 'Compass', color: 'blue' }
    },
    {
      level: 5,
      title: "Sonhador Dedicado",
      description: "Você está construindo seus sonhos consistentemente!",
      rewards: [
        {
          id: 'dreams_pro',
          name: 'Dreams Pro Features',
          description: 'Acesso a recursos avançados do Criador de Sonhos',
          type: 'feature_unlock',
          value: 'dreams_pro',
          icon: 'Crown',
          rarity: 'rare',
          requiredLevel: 5,
          isActive: true
        },
        {
          id: 'priority_support',
          name: 'Suporte Prioritário',
          description: 'Atendimento prioritário com especialistas',
          type: 'priority_support',
          value: 'priority',
          icon: 'Headphones',
          rarity: 'rare',
          requiredLevel: 5,
          isActive: true
        }
      ],
      features: ['Templates de sonhos premium', 'Análise avançada de viabilidade'],
      perks: ['Chat prioritário', 'Webinars exclusivos'],
      badge: { name: 'Sonhador', icon: 'Heart', color: 'pink' }
    },
    {
      level: 10,
      title: "Planejador Estratégico",
      description: "Você domina o planejamento estratégico!",
      rewards: [
        {
          id: 'visa_premium',
          name: 'VisaMatch Premium',
          description: 'Acesso completo ao VisaMatch com análises detalhadas',
          type: 'feature_unlock',
          value: 'visa_premium',
          icon: 'Shield',
          rarity: 'epic',
          requiredLevel: 10,
          isActive: true
        },
        {
          id: 'consultation_discount',
          name: '20% Desconto em Consultorias',
          description: 'Desconto em consultorias especializadas',
          type: 'discount',
          value: 20,
          icon: 'Percent',
          rarity: 'epic',
          requiredLevel: 10,
          isActive: true
        }
      ],
      features: ['VisaMatch completo', 'Relatórios personalizados'],
      perks: ['Consultoria mensal gratuita', 'Acesso antecipado a novos recursos'],
      badge: { name: 'Estrategista', icon: 'Target', color: 'purple' }
    },
    {
      level: 15,
      title: "Especialista em Imigração",
      description: "Você é um verdadeiro especialista!",
      rewards: [
        {
          id: 'ai_assistant',
          name: 'Assistente IA Pessoal',
          description: 'Assistente IA dedicado para sua jornada',
          type: 'feature_unlock',
          value: 'ai_assistant',
          icon: 'Bot',
          rarity: 'legendary',
          requiredLevel: 15,
          isActive: true
        },
        {
          id: 'exclusive_content',
          name: 'Conteúdo Exclusivo',
          description: 'Acesso a materiais e cursos exclusivos',
          type: 'exclusive_access',
          value: 'premium_content',
          icon: 'BookOpen',
          rarity: 'legendary',
          requiredLevel: 15,
          isActive: true
        }
      ],
      features: ['IA personalizada', 'Biblioteca premium'],
      perks: ['Mentoria individual', 'Rede de networking exclusiva'],
      badge: { name: 'Especialista', icon: 'Award', color: 'gold' }
    },
    {
      level: 20,
      title: "Mentor LifeWay",
      description: "Você alcançou o nível máximo de expertise!",
      rewards: [
        {
          id: 'mentor_program',
          name: 'Programa de Mentoria',
          description: 'Torne-se mentor de outros usuários',
          type: 'exclusive_access',
          value: 'mentor_access',
          icon: 'Users',
          rarity: 'legendary',
          requiredLevel: 20,
          isActive: true
        },
        {
          id: 'lifetime_access',
          name: 'Acesso Vitalício',
          description: 'Acesso vitalício a todos os recursos LifeWay',
          type: 'feature_unlock',
          value: 'lifetime',
          icon: 'Infinity',
          rarity: 'legendary',
          requiredLevel: 20,
          isActive: true
        }
      ],
      features: ['Todas as funcionalidades', 'Ferramentas de mentoria'],
      perks: ['Status VIP', 'Influência no roadmap do produto'],
      badge: { name: 'Mentor', icon: 'Crown', color: 'rainbow' }
    }
  ];

  // Obter benefícios por nível
  async getLevelBenefits(level: number): Promise<LevelBenefit | null> {
    return this.LEVEL_BENEFITS.find(benefit => benefit.level === level) || null;
  }

  // Obter todos os benefícios até um nível
  async getBenefitsUpToLevel(level: number): Promise<LevelBenefit[]> {
    return this.LEVEL_BENEFITS.filter(benefit => benefit.level <= level);
  }

  // Obter próximo nível com benefícios
  async getNextLevelBenefits(currentLevel: number): Promise<LevelBenefit | null> {
    return this.LEVEL_BENEFITS.find(benefit => benefit.level > currentLevel) || null;
  }

  // Desbloquear recompensas para um usuário
  async unlockRewardsForLevel(userId: string, level: number): Promise<UserReward[]> {
    try {
      const benefits = await this.getLevelBenefits(level);
      if (!benefits) return [];

      const userRewards: UserReward[] = [];

      for (const reward of benefits.rewards) {
        // Verificar se a recompensa já foi desbloqueada
        const { data: existingReward } = await supabase
          .from('user_rewards')
          .select('*')
          .eq('user_id', userId)
          .eq('reward_id', reward.id)
          .single();

        if (!existingReward) {
          // Desbloquear nova recompensa
          const { data: newReward, error } = await supabase
            .from('user_rewards')
            .insert({
              user_id: userId,
              reward_id: reward.id,
              unlocked_at: new Date().toISOString(),
              is_used: false
            })
            .select('*')
            .single();

          if (!error && newReward) {
            userRewards.push({
              ...newReward,
              id: newReward.id,
              userId: newReward.user_id,
              rewardId: newReward.reward_id,
              unlockedAt: new Date(newReward.unlocked_at),
              usedAt: newReward.used_at ? new Date(newReward.used_at) : undefined,
              isUsed: newReward.is_used,
              reward
            });
          }
        }
      }

      return userRewards;
    } catch (error) {
      console.error('Erro ao desbloquear recompensas:', error);
      return [];
    }
  }

  // Obter recompensas do usuário
  async getUserRewards(userId: string): Promise<UserReward[]> {
    try {
      const { data: userRewards, error } = await supabase
        .from('user_rewards')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;

      return userRewards?.map(ur => {
        const reward = this.findRewardById(ur.reward_id);
        return {
          id: ur.id,
          userId: ur.user_id,
          rewardId: ur.reward_id,
          unlockedAt: new Date(ur.unlocked_at),
          usedAt: ur.used_at ? new Date(ur.used_at) : undefined,
          isUsed: ur.is_used,
          reward: reward!
        };
      }).filter(ur => ur.reward) || [];
    } catch (error) {
      console.error('Erro ao buscar recompensas do usuário:', error);
      return [];
    }
  }

  // Usar uma recompensa
  async useReward(userId: string, rewardId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_rewards')
        .update({
          used_at: new Date().toISOString(),
          is_used: true
        })
        .eq('user_id', userId)
        .eq('reward_id', rewardId);

      return !error;
    } catch (error) {
      console.error('Erro ao usar recompensa:', error);
      return false;
    }
  }

  // Verificar se usuário tem acesso a uma funcionalidade
  async hasFeatureAccess(userId: string, featureValue: string): Promise<boolean> {
    try {
      const userRewards = await this.getUserRewards(userId);
      return userRewards.some(ur => 
        ur.reward.type === 'feature_unlock' && 
        ur.reward.value === featureValue &&
        !ur.isUsed
      );
    } catch (error) {
      console.error('Erro ao verificar acesso à funcionalidade:', error);
      return false;
    }
  }

  // Obter estatísticas de recompensas
  async getRewardsStats(userId: string): Promise<{
    totalUnlocked: number;
    totalUsed: number;
    availableRewards: number;
    rareRewards: number;
    epicRewards: number;
    legendaryRewards: number;
  }> {
    try {
      const userRewards = await this.getUserRewards(userId);
      
      return {
        totalUnlocked: userRewards.length,
        totalUsed: userRewards.filter(ur => ur.isUsed).length,
        availableRewards: userRewards.filter(ur => !ur.isUsed).length,
        rareRewards: userRewards.filter(ur => ur.reward.rarity === 'rare').length,
        epicRewards: userRewards.filter(ur => ur.reward.rarity === 'epic').length,
        legendaryRewards: userRewards.filter(ur => ur.reward.rarity === 'legendary').length
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de recompensas:', error);
      return {
        totalUnlocked: 0,
        totalUsed: 0,
        availableRewards: 0,
        rareRewards: 0,
        epicRewards: 0,
        legendaryRewards: 0
      };
    }
  }

  // Métodos auxiliares
  private findRewardById(rewardId: string): Reward | undefined {
    for (const benefit of this.LEVEL_BENEFITS) {
      const reward = benefit.rewards.find(r => r.id === rewardId);
      if (reward) return reward;
    }
    return undefined;
  }

  // Obter todas as recompensas disponíveis
  getAllRewards(): Reward[] {
    return this.LEVEL_BENEFITS.flatMap(benefit => benefit.rewards);
  }

  // Obter recompensas por raridade
  getRewardsByRarity(rarity: Reward['rarity']): Reward[] {
    return this.getAllRewards().filter(reward => reward.rarity === rarity);
  }
}

export const rewardsService = new RewardsService();
export default rewardsService;
