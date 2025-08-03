import { supabase } from '@/integrations/supabase/client';

export interface UserRanking {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  rank: number;
  level: number;
  achievements: number;
  streakDays: number;
  lastActivity: Date;
  metadata?: Record<string, any>;
}

export interface Competition {
  id: string;
  name: string;
  description: string;
  type: 'leaderboard' | 'tournament' | 'challenge' | 'seasonal';
  category: 'global' | 'dreams' | 'visa_match' | 'specialist_chat' | 'pdf_generation' | 'cross_tool';
  status: 'upcoming' | 'active' | 'completed' | 'paused';
  startDate: Date;
  endDate: Date;
  maxParticipants?: number;
  currentParticipants: number;
  prize?: {
    type: 'points' | 'badge' | 'feature_unlock' | 'title' | 'physical';
    value: string | number;
    description: string;
  };
  rules: string[];
  criteria: {
    metric: string;
    target?: number;
    timeframe?: string;
  };
  icon: string;
  color: string;
  isPublic: boolean;
  createdBy: string;
}

export interface CompetitionParticipant {
  id: string;
  competitionId: string;
  userId: string;
  username: string;
  avatar?: string;
  currentScore: number;
  rank: number;
  joinedAt: Date;
  lastUpdate: Date;
  isActive: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  rank: number;
  change: number; // Mudança de posição desde última atualização
  badge?: string;
  level: number;
  metadata?: Record<string, any>;
}

class RankingsService {
  // Competições predefinidas
  private readonly PREDEFINED_COMPETITIONS: Omit<Competition, 'id' | 'currentParticipants' | 'createdBy'>[] = [
    {
      name: 'Ranking Global LifeWay',
      description: 'Classificação geral baseada em pontos, conquistas e atividade',
      type: 'leaderboard',
      category: 'global',
      status: 'active',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      rules: [
        'Pontuação baseada em atividades em todas as ferramentas',
        'Bônus por conquistas desbloqueadas',
        'Penalidade por inatividade prolongada',
        'Atualização diária dos rankings'
      ],
      criteria: {
        metric: 'total_points_with_bonuses'
      },
      icon: 'Crown',
      color: 'gold',
      isPublic: true
    },
    {
      name: 'Mestres dos Sonhos',
      description: 'Competição mensal para criadores mais ativos no Dreams',
      type: 'tournament',
      category: 'dreams',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      maxParticipants: 100,
      prize: {
        type: 'badge',
        value: 'dream_master_monthly',
        description: 'Badge exclusivo de Mestre dos Sonhos do mês'
      },
      rules: [
        'Pontuação baseada na qualidade e quantidade de sonhos criados',
        'Bônus por consistência diária',
        'Avaliação por outros usuários conta pontos extras'
      ],
      criteria: {
        metric: 'dreams_quality_score',
        timeframe: 'monthly'
      },
      icon: 'Star',
      color: 'pink',
      isPublic: true
    },
    {
      name: 'Especialistas em Vistos',
      description: 'Torneio trimestral de precisão no VisaMatch',
      type: 'tournament',
      category: 'visa_match',
      status: 'upcoming',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 97 * 24 * 60 * 60 * 1000),
      maxParticipants: 50,
      prize: {
        type: 'feature_unlock',
        value: 'visa_expert_tools',
        description: 'Acesso antecipado a ferramentas avançadas de análise'
      },
      rules: [
        'Pontuação baseada na precisão das análises',
        'Mínimo de 10 análises para participar',
        'Bônus por diversidade de países analisados'
      ],
      criteria: {
        metric: 'visa_accuracy_score',
        target: 90,
        timeframe: 'quarterly'
      },
      icon: 'Shield',
      color: 'green',
      isPublic: true
    },
    {
      name: 'Comunicadores Expert',
      description: 'Desafio semanal de engajamento no chat com especialistas',
      type: 'challenge',
      category: 'specialist_chat',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      prize: {
        type: 'points',
        value: 500,
        description: '500 pontos bônus + prioridade no atendimento'
      },
      rules: [
        'Participação ativa em conversas',
        'Qualidade das perguntas e interações',
        'Ajuda prestada a outros usuários'
      ],
      criteria: {
        metric: 'chat_engagement_score',
        timeframe: 'weekly'
      },
      icon: 'MessageSquare',
      color: 'blue',
      isPublic: true
    },
    {
      name: 'Organizadores Supremos',
      description: 'Competição anual de geração e organização de documentos',
      type: 'seasonal',
      category: 'pdf_generation',
      status: 'active',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      prize: {
        type: 'title',
        value: 'Organizador Supremo 2024',
        description: 'Título exclusivo + acesso vitalício a templates premium'
      },
      rules: [
        'Qualidade e organização dos documentos',
        'Uso criativo de templates',
        'Consistência na geração de PDFs'
      ],
      criteria: {
        metric: 'pdf_quality_and_volume',
        timeframe: 'yearly'
      },
      icon: 'FileText',
      color: 'red',
      isPublic: true
    },
    {
      name: 'Liga dos Exploradores',
      description: 'Competição especial para usuários que dominam múltiplas ferramentas',
      type: 'tournament',
      category: 'cross_tool',
      status: 'upcoming',
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 44 * 24 * 60 * 60 * 1000),
      maxParticipants: 25,
      prize: {
        type: 'physical',
        value: 'lifeway_explorer_kit',
        description: 'Kit físico exclusivo + menção no hall da fama'
      },
      rules: [
        'Uso efetivo de pelo menos 3 ferramentas diferentes',
        'Projetos que demonstrem sinergia entre ferramentas',
        'Contribuição para a comunidade LifeWay'
      ],
      criteria: {
        metric: 'cross_tool_mastery_score',
        target: 80,
        timeframe: 'monthly'
      },
      icon: 'Compass',
      color: 'rainbow',
      isPublic: true
    }
  ];

  // Obter ranking global
  async getGlobalRanking(limit: number = 50, offset: number = 0): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_global_ranking', {
          limit_count: limit,
          offset_count: offset
        });

      if (error) throw error;

      return data?.map((entry: any, index: number) => ({
        userId: entry.user_id,
        username: entry.username || 'Usuário',
        avatar: entry.avatar_url,
        score: entry.total_score,
        rank: offset + index + 1,
        change: entry.rank_change || 0,
        badge: entry.current_badge,
        level: entry.level,
        metadata: entry.metadata
      })) || [];
    } catch (error) {
      console.error('Erro ao obter ranking global:', error);
      return [];
    }
  }

  // Obter ranking por categoria
  async getCategoryRanking(
    category: Competition['category'], 
    limit: number = 50, 
    offset: number = 0
  ): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_category_ranking', {
          category_name: category,
          limit_count: limit,
          offset_count: offset
        });

      if (error) throw error;

      return data?.map((entry: any, index: number) => ({
        userId: entry.user_id,
        username: entry.username || 'Usuário',
        avatar: entry.avatar_url,
        score: entry.category_score,
        rank: offset + index + 1,
        change: entry.rank_change || 0,
        badge: entry.category_badge,
        level: entry.level,
        metadata: entry.metadata
      })) || [];
    } catch (error) {
      console.error('Erro ao obter ranking por categoria:', error);
      return [];
    }
  }

  // Obter posição do usuário no ranking
  async getUserRankPosition(userId: string, category?: Competition['category']): Promise<{
    rank: number;
    score: number;
    totalUsers: number;
    percentile: number;
  } | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_rank_position', {
          user_id: userId,
          category_name: category
        });

      if (error) throw error;

      return data ? {
        rank: data.rank,
        score: data.score,
        totalUsers: data.total_users,
        percentile: Math.round((1 - (data.rank / data.total_users)) * 100)
      } : null;
    } catch (error) {
      console.error('Erro ao obter posição do usuário:', error);
      return null;
    }
  }

  // Obter competições ativas
  async getActiveCompetitions(): Promise<Competition[]> {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .in('status', ['active', 'upcoming'])
        .order('start_date', { ascending: true });

      if (error) throw error;

      return data?.map(comp => ({
        ...comp,
        startDate: new Date(comp.start_date),
        endDate: new Date(comp.end_date)
      })) || [];
    } catch (error) {
      console.error('Erro ao obter competições ativas:', error);
      return [];
    }
  }

  // Participar de uma competição
  async joinCompetition(userId: string, competitionId: string): Promise<boolean> {
    try {
      // Verificar se já está participando
      const { data: existing } = await supabase
        .from('competition_participants')
        .select('id')
        .eq('user_id', userId)
        .eq('competition_id', competitionId)
        .single();

      if (existing) return false; // Já está participando

      // Verificar limite de participantes
      const { data: competition } = await supabase
        .from('competitions')
        .select('max_participants, current_participants')
        .eq('id', competitionId)
        .single();

      if (competition?.max_participants && 
          competition.current_participants >= competition.max_participants) {
        return false; // Competição lotada
      }

      // Adicionar participante
      const { error: insertError } = await supabase
        .from('competition_participants')
        .insert({
          user_id: userId,
          competition_id: competitionId,
          current_score: 0,
          joined_at: new Date().toISOString(),
          last_update: new Date().toISOString(),
          is_active: true
        });

      if (insertError) throw insertError;

      // Atualizar contador de participantes
      const { error: updateError } = await supabase
        .from('competitions')
        .update({
          current_participants: (competition?.current_participants || 0) + 1
        })
        .eq('id', competitionId);

      if (updateError) throw updateError;

      return true;
    } catch (error) {
      console.error('Erro ao participar da competição:', error);
      return false;
    }
  }

  // Obter participantes de uma competição
  async getCompetitionParticipants(
    competitionId: string, 
    limit: number = 50
  ): Promise<CompetitionParticipant[]> {
    try {
      const { data, error } = await supabase
        .from('competition_participants')
        .select(`
          *,
          profiles:user_id (username, avatar_url)
        `)
        .eq('competition_id', competitionId)
        .eq('is_active', true)
        .order('current_score', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map((participant: any, index: number) => ({
        id: participant.id,
        competitionId: participant.competition_id,
        userId: participant.user_id,
        username: participant.profiles?.username || 'Usuário',
        avatar: participant.profiles?.avatar_url,
        currentScore: participant.current_score,
        rank: index + 1,
        joinedAt: new Date(participant.joined_at),
        lastUpdate: new Date(participant.last_update),
        isActive: participant.is_active
      })) || [];
    } catch (error) {
      console.error('Erro ao obter participantes da competição:', error);
      return [];
    }
  }

  // Atualizar pontuação de participante
  async updateParticipantScore(
    userId: string, 
    competitionId: string, 
    newScore: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('competition_participants')
        .update({
          current_score: newScore,
          last_update: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('competition_id', competitionId);

      return !error;
    } catch (error) {
      console.error('Erro ao atualizar pontuação:', error);
      return false;
    }
  }

  // Obter competições do usuário
  async getUserCompetitions(userId: string): Promise<{
    active: Competition[];
    completed: Competition[];
    upcoming: Competition[];
  }> {
    try {
      const { data, error } = await supabase
        .from('competition_participants')
        .select(`
          competitions (*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      const competitions = data?.map((p: any) => ({
        ...p.competitions,
        startDate: new Date(p.competitions.start_date),
        endDate: new Date(p.competitions.end_date)
      })) || [];

      const now = new Date();
      
      return {
        active: competitions.filter(c => c.status === 'active' && c.startDate <= now && c.endDate >= now),
        completed: competitions.filter(c => c.status === 'completed' || c.endDate < now),
        upcoming: competitions.filter(c => c.status === 'upcoming' || c.startDate > now)
      };
    } catch (error) {
      console.error('Erro ao obter competições do usuário:', error);
      return { active: [], completed: [], upcoming: [] };
    }
  }

  // Criar competição personalizada
  async createCustomCompetition(
    competition: Omit<Competition, 'id' | 'currentParticipants'>,
    creatorId: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .insert({
          ...competition,
          start_date: competition.startDate.toISOString(),
          end_date: competition.endDate.toISOString(),
          current_participants: 0,
          created_by: creatorId
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Erro ao criar competição:', error);
      return null;
    }
  }

  // Obter estatísticas de rankings
  async getRankingStats(): Promise<{
    totalUsers: number;
    activeCompetitions: number;
    totalCompetitions: number;
    topPerformers: LeaderboardEntry[];
    recentWinners: any[];
  }> {
    try {
      const [
        { count: totalUsers },
        { count: activeCompetitions },
        { count: totalCompetitions },
        topPerformers,
        recentWinners
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('competitions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('competitions').select('*', { count: 'exact', head: true }),
        this.getGlobalRanking(5),
        supabase.from('competition_winners').select(`
          *,
          competitions (name),
          profiles (username, avatar_url)
        `).order('created_at', { ascending: false }).limit(5)
      ]);

      return {
        totalUsers: totalUsers || 0,
        activeCompetitions: activeCompetitions || 0,
        totalCompetitions: totalCompetitions || 0,
        topPerformers,
        recentWinners: recentWinners.data?.map(winner => ({
          username: winner.profiles?.username || 'Usuário',
          avatar: winner.profiles?.avatar_url,
          competitionName: winner.competitions?.name,
          prize: winner.prize,
          date: new Date(winner.created_at)
        })) || []
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de rankings:', error);
      return {
        totalUsers: 0,
        activeCompetitions: 0,
        totalCompetitions: 0,
        topPerformers: [],
        recentWinners: []
      };
    }
  }

  // Inicializar competições predefinidas
  async initializePredefinedCompetitions(): Promise<void> {
    try {
      for (const comp of this.PREDEFINED_COMPETITIONS) {
        const { data: existing } = await supabase
          .from('competitions')
          .select('id')
          .eq('name', comp.name)
          .single();

        if (!existing) {
          await supabase
            .from('competitions')
            .insert({
              ...comp,
              start_date: comp.startDate.toISOString(),
              end_date: comp.endDate.toISOString(),
              current_participants: 0,
              created_by: 'system'
            });
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar competições:', error);
    }
  }
}

export const rankingsService = new RankingsService();
export default rankingsService;
