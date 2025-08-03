import { supabase } from '@/integrations/supabase/client';

export interface PushNotification {
  id: string;
  userId: string;
  type: 'achievement' | 'reward' | 'ranking' | 'competition' | 'level_up' | 'reminder' | 'social';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string;
  icon?: string;
  image?: string;
  actionUrl?: string;
  actionText?: string;
  isRead: boolean;
  isSent: boolean;
  scheduledFor?: Date;
  sentAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface NotificationTemplate {
  id: string;
  type: PushNotification['type'];
  category: string;
  titleTemplate: string;
  messageTemplate: string;
  priority: PushNotification['priority'];
  icon: string;
  actionUrl?: string;
  actionText?: string;
  isActive: boolean;
  conditions?: Record<string, any>;
}

export interface NotificationSettings {
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  achievements: boolean;
  rewards: boolean;
  rankings: boolean;
  competitions: boolean;
  levelUps: boolean;
  reminders: boolean;
  social: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;
  };
  frequency: 'immediate' | 'batched' | 'daily_digest';
  updatedAt: Date;
}

class NotificationsService {
  private readonly NOTIFICATION_TEMPLATES: Omit<NotificationTemplate, 'id'>[] = [
    // Achievement notifications
    {
      type: 'achievement',
      category: 'dreams',
      titleTemplate: '🌟 Nova Conquista Desbloqueada!',
      messageTemplate: 'Parabéns! Você desbloqueou "{achievementName}" no Dreams!',
      priority: 'high',
      icon: 'Star',
      actionUrl: '/dashboard?tab=conquistas-especificas',
      actionText: 'Ver Conquista',
      isActive: true
    },
    {
      type: 'achievement',
      category: 'visa_match',
      titleTemplate: '🛡️ Especialista em Vistos!',
      messageTemplate: 'Conquista "{achievementName}" desbloqueada no VisaMatch!',
      priority: 'high',
      icon: 'Shield',
      actionUrl: '/dashboard?tab=conquistas-especificas',
      actionText: 'Ver Conquista',
      isActive: true
    },
    {
      type: 'achievement',
      category: 'specialist_chat',
      titleTemplate: '💬 Comunicador Expert!',
      messageTemplate: 'Nova conquista "{achievementName}" no Chat com Especialista!',
      priority: 'high',
      icon: 'MessageSquare',
      actionUrl: '/dashboard?tab=conquistas-especificas',
      actionText: 'Ver Conquista',
      isActive: true
    },
    {
      type: 'achievement',
      category: 'cross_tool',
      titleTemplate: '🏆 Conquista Épica!',
      messageTemplate: 'Incrível! Você desbloqueou "{achievementName}" - uma conquista cross-tool!',
      priority: 'urgent',
      icon: 'Trophy',
      actionUrl: '/dashboard?tab=conquistas-especificas',
      actionText: 'Ver Conquista',
      isActive: true
    },

    // Reward notifications
    {
      type: 'reward',
      category: 'level_reward',
      titleTemplate: '🎁 Nova Recompensa Disponível!',
      messageTemplate: 'Você desbloqueou "{rewardName}" ao atingir o nível {level}!',
      priority: 'high',
      icon: 'Gift',
      actionUrl: '/dashboard?tab=recompensas',
      actionText: 'Resgatar',
      isActive: true
    },
    {
      type: 'reward',
      category: 'competition_prize',
      titleTemplate: '🏅 Prêmio de Competição!',
      messageTemplate: 'Parabéns! Você ganhou "{prizeName}" na competição "{competitionName}"!',
      priority: 'urgent',
      icon: 'Award',
      actionUrl: '/dashboard?tab=rankings',
      actionText: 'Ver Prêmio',
      isActive: true
    },

    // Ranking notifications
    {
      type: 'ranking',
      category: 'position_change',
      titleTemplate: '📈 Mudança no Ranking!',
      messageTemplate: 'Você {direction} para a posição #{newRank} no ranking {category}!',
      priority: 'normal',
      icon: 'TrendingUp',
      actionUrl: '/dashboard?tab=rankings',
      actionText: 'Ver Ranking',
      isActive: true
    },
    {
      type: 'ranking',
      category: 'top_performer',
      titleTemplate: '🌟 Top Performer!',
      messageTemplate: 'Incrível! Você está entre os top {percentage}% no ranking {category}!',
      priority: 'high',
      icon: 'Crown',
      actionUrl: '/dashboard?tab=rankings',
      actionText: 'Ver Posição',
      isActive: true
    },

    // Competition notifications
    {
      type: 'competition',
      category: 'new_competition',
      titleTemplate: '🎯 Nova Competição Disponível!',
      messageTemplate: 'A competição "{competitionName}" está aberta para participação!',
      priority: 'normal',
      icon: 'Target',
      actionUrl: '/dashboard?tab=rankings',
      actionText: 'Participar',
      isActive: true
    },
    {
      type: 'competition',
      category: 'ending_soon',
      titleTemplate: '⏰ Competição Terminando!',
      messageTemplate: 'A competição "{competitionName}" termina em {timeRemaining}!',
      priority: 'high',
      icon: 'Clock',
      actionUrl: '/dashboard?tab=rankings',
      actionText: 'Ver Status',
      isActive: true
    },
    {
      type: 'competition',
      category: 'results',
      titleTemplate: '🏆 Resultados da Competição!',
      messageTemplate: 'Você ficou em #{position} na competição "{competitionName}"!',
      priority: 'high',
      icon: 'Trophy',
      actionUrl: '/dashboard?tab=rankings',
      actionText: 'Ver Resultados',
      isActive: true
    },

    // Level up notifications
    {
      type: 'level_up',
      category: 'general',
      titleTemplate: '🚀 Nível Aumentou!',
      messageTemplate: 'Parabéns! Você atingiu o nível {newLevel}! Novas funcionalidades desbloqueadas!',
      priority: 'urgent',
      icon: 'Zap',
      actionUrl: '/dashboard?tab=gamification',
      actionText: 'Ver Progresso',
      isActive: true
    },

    // Reminder notifications
    {
      type: 'reminder',
      category: 'daily_activity',
      titleTemplate: '📅 Lembrete Diário',
      messageTemplate: 'Que tal continuar seu progresso hoje? Você está a {pointsNeeded} pontos do próximo nível!',
      priority: 'low',
      icon: 'Calendar',
      actionUrl: '/dashboard',
      actionText: 'Continuar',
      isActive: true
    },
    {
      type: 'reminder',
      category: 'streak_risk',
      titleTemplate: '🔥 Mantenha sua Sequência!',
      messageTemplate: 'Sua sequência de {streakDays} dias está em risco! Complete uma atividade hoje.',
      priority: 'normal',
      icon: 'Flame',
      actionUrl: '/dashboard',
      actionText: 'Continuar Sequência',
      isActive: true
    },

    // Social notifications
    {
      type: 'social',
      category: 'user_helped',
      titleTemplate: '🤝 Você Ajudou Alguém!',
      messageTemplate: '{username} agradeceu sua ajuda! Você ganhou {points} pontos sociais.',
      priority: 'normal',
      icon: 'Users',
      actionUrl: '/dashboard?tab=gamification',
      actionText: 'Ver Pontos',
      isActive: true
    }
  ];

  // Registrar service worker para push notifications
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications não são suportadas neste navegador');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrado:', registration);
      return registration;
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error);
      return null;
    }
  }

  // Solicitar permissão para notificações
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notificações não são suportadas neste navegador');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Obter configurações de notificação do usuário
  async getUserNotificationSettings(userId: string): Promise<NotificationSettings | null> {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        // Criar configurações padrão
        const defaultSettings: Omit<NotificationSettings, 'userId'> = {
          pushEnabled: true,
          emailEnabled: true,
          inAppEnabled: true,
          achievements: true,
          rewards: true,
          rankings: true,
          competitions: true,
          levelUps: true,
          reminders: true,
          social: true,
          quietHours: {
            enabled: false,
            startTime: '22:00',
            endTime: '08:00'
          },
          frequency: 'immediate',
          updatedAt: new Date()
        };

        await this.updateNotificationSettings(userId, defaultSettings);
        return { userId, ...defaultSettings };
      }

      return {
        userId: data.user_id,
        pushEnabled: data.push_enabled,
        emailEnabled: data.email_enabled,
        inAppEnabled: data.in_app_enabled,
        achievements: data.achievements,
        rewards: data.rewards,
        rankings: data.rankings,
        competitions: data.competitions,
        levelUps: data.level_ups,
        reminders: data.reminders,
        social: data.social,
        quietHours: data.quiet_hours,
        frequency: data.frequency,
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Erro ao obter configurações de notificação:', error);
      return null;
    }
  }

  // Atualizar configurações de notificação
  async updateNotificationSettings(
    userId: string, 
    settings: Partial<Omit<NotificationSettings, 'userId'>>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString()
        });

      return !error;
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      return false;
    }
  }

  // Criar notificação
  async createNotification(notification: Omit<PushNotification, 'id' | 'createdAt'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          priority: notification.priority,
          category: notification.category,
          icon: notification.icon,
          image: notification.image,
          action_url: notification.actionUrl,
          action_text: notification.actionText,
          is_read: notification.isRead,
          is_sent: notification.isSent,
          scheduled_for: notification.scheduledFor?.toISOString(),
          expires_at: notification.expiresAt?.toISOString(),
          metadata: notification.metadata,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      return null;
    }
  }

  // Enviar notificação push
  async sendPushNotification(userId: string, notification: Omit<PushNotification, 'id' | 'userId' | 'createdAt'>): Promise<boolean> {
    try {
      // Verificar configurações do usuário
      const settings = await this.getUserNotificationSettings(userId);
      if (!settings?.pushEnabled) return false;

      // Verificar se o tipo de notificação está habilitado
      const typeEnabled = this.isNotificationTypeEnabled(notification.type, settings);
      if (!typeEnabled) return false;

      // Verificar horário silencioso
      if (this.isQuietHours(settings.quietHours)) {
        // Agendar para depois do horário silencioso
        const scheduledFor = this.getNextAvailableTime(settings.quietHours);
        notification.scheduledFor = scheduledFor;
      }

      // Criar notificação no banco
      const notificationId = await this.createNotification({
        ...notification,
        userId,
        isRead: false,
        isSent: false
      });

      if (!notificationId) return false;

      // Enviar via service worker (se disponível) ou fallback para Notification API
      const success = await this.sendViaServiceWorker(notification) || 
                     await this.sendViaNotificationAPI(notification);

      if (success) {
        // Marcar como enviada
        await supabase
          .from('notifications')
          .update({ 
            is_sent: true, 
            sent_at: new Date().toISOString() 
          })
          .eq('id', notificationId);
      }

      return success;
    } catch (error) {
      console.error('Erro ao enviar notificação push:', error);
      return false;
    }
  }

  // Enviar via service worker
  private async sendViaServiceWorker(notification: Partial<PushNotification>): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (!registration) return false;

      await registration.showNotification(notification.title || '', {
        body: notification.message,
        icon: `/icons/${notification.icon || 'default'}.png`,
        badge: '/icons/badge.png',
        tag: notification.category,
        data: {
          url: notification.actionUrl,
          ...notification.data
        },
        requireInteraction: notification.priority === 'urgent'
      });

      return true;
    } catch (error) {
      console.error('Erro ao enviar via service worker:', error);
      return false;
    }
  }

  // Enviar via Notification API
  private async sendViaNotificationAPI(notification: Partial<PushNotification>): Promise<boolean> {
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') {
        return false;
      }

      const notif = new Notification(notification.title || '', {
        body: notification.message,
        icon: `/icons/${notification.icon || 'default'}.png`,
        tag: notification.category,
        requireInteraction: notification.priority === 'urgent'
      });

      if (notification.actionUrl) {
        notif.onclick = () => {
          window.open(notification.actionUrl, '_blank');
          notif.close();
        };
      }

      return true;
    } catch (error) {
      console.error('Erro ao enviar via Notification API:', error);
      return false;
    }
  }

  // Verificar se tipo de notificação está habilitado
  private isNotificationTypeEnabled(type: PushNotification['type'], settings: NotificationSettings): boolean {
    switch (type) {
      case 'achievement': return settings.achievements;
      case 'reward': return settings.rewards;
      case 'ranking': return settings.rankings;
      case 'competition': return settings.competitions;
      case 'level_up': return settings.levelUps;
      case 'reminder': return settings.reminders;
      case 'social': return settings.social;
      default: return true;
    }
  }

  // Verificar se está em horário silencioso
  private isQuietHours(quietHours: NotificationSettings['quietHours']): boolean {
    if (!quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = quietHours.startTime.split(':').map(Number);
    const [endHour, endMin] = quietHours.endTime.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Horário atravessa meia-noite
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Obter próximo horário disponível
  private getNextAvailableTime(quietHours: NotificationSettings['quietHours']): Date {
    const now = new Date();
    const [endHour, endMin] = quietHours.endTime.split(':').map(Number);
    
    const nextAvailable = new Date(now);
    nextAvailable.setHours(endHour, endMin, 0, 0);
    
    if (nextAvailable <= now) {
      nextAvailable.setDate(nextAvailable.getDate() + 1);
    }
    
    return nextAvailable;
  }

  // Obter notificações do usuário
  async getUserNotifications(
    userId: string, 
    limit: number = 50, 
    onlyUnread: boolean = false
  ): Promise<PushNotification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (onlyUnread) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.map(notif => ({
        id: notif.id,
        userId: notif.user_id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        data: notif.data,
        priority: notif.priority,
        category: notif.category,
        icon: notif.icon,
        image: notif.image,
        actionUrl: notif.action_url,
        actionText: notif.action_text,
        isRead: notif.is_read,
        isSent: notif.is_sent,
        scheduledFor: notif.scheduled_for ? new Date(notif.scheduled_for) : undefined,
        sentAt: notif.sent_at ? new Date(notif.sent_at) : undefined,
        createdAt: new Date(notif.created_at),
        expiresAt: notif.expires_at ? new Date(notif.expires_at) : undefined,
        metadata: notif.metadata
      })) || [];
    } catch (error) {
      console.error('Erro ao obter notificações:', error);
      return [];
    }
  }

  // Marcar notificação como lida
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      return !error;
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
      return false;
    }
  }

  // Marcar todas como lidas
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      return !error;
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      return false;
    }
  }

  // Deletar notificação
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      return !error;
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      return false;
    }
  }

  // Métodos de conveniência para tipos específicos de notificação

  // Notificação de conquista desbloqueada
  async notifyAchievementUnlocked(userId: string, achievementName: string, category: string): Promise<boolean> {
    const template = this.NOTIFICATION_TEMPLATES.find(t => 
      t.type === 'achievement' && t.category === category
    );

    if (!template) return false;

    return await this.sendPushNotification(userId, {
      type: 'achievement',
      title: template.titleTemplate,
      message: template.messageTemplate.replace('{achievementName}', achievementName),
      priority: template.priority,
      category: template.category,
      icon: template.icon,
      actionUrl: template.actionUrl,
      actionText: template.actionText,
      data: { achievementName, category },
      isRead: false,
      isSent: false
    });
  }

  // Notificação de recompensa desbloqueada
  async notifyRewardUnlocked(userId: string, rewardName: string, level: number): Promise<boolean> {
    const template = this.NOTIFICATION_TEMPLATES.find(t => 
      t.type === 'reward' && t.category === 'level_reward'
    );

    if (!template) return false;

    return await this.sendPushNotification(userId, {
      type: 'reward',
      title: template.titleTemplate,
      message: template.messageTemplate
        .replace('{rewardName}', rewardName)
        .replace('{level}', level.toString()),
      priority: template.priority,
      category: template.category,
      icon: template.icon,
      actionUrl: template.actionUrl,
      actionText: template.actionText,
      data: { rewardName, level },
      isRead: false,
      isSent: false
    });
  }

  // Notificação de mudança de ranking
  async notifyRankingChange(
    userId: string, 
    newRank: number, 
    oldRank: number, 
    category: string
  ): Promise<boolean> {
    const template = this.NOTIFICATION_TEMPLATES.find(t => 
      t.type === 'ranking' && t.category === 'position_change'
    );

    if (!template) return false;

    const direction = newRank < oldRank ? 'subiu' : 'desceu';

    return await this.sendPushNotification(userId, {
      type: 'ranking',
      title: template.titleTemplate,
      message: template.messageTemplate
        .replace('{direction}', direction)
        .replace('{newRank}', newRank.toString())
        .replace('{category}', category),
      priority: template.priority,
      category: template.category,
      icon: template.icon,
      actionUrl: template.actionUrl,
      actionText: template.actionText,
      data: { newRank, oldRank, category, direction },
      isRead: false,
      isSent: false
    });
  }

  // Notificação de level up
  async notifyLevelUp(userId: string, newLevel: number): Promise<boolean> {
    const template = this.NOTIFICATION_TEMPLATES.find(t => 
      t.type === 'level_up' && t.category === 'general'
    );

    if (!template) return false;

    return await this.sendPushNotification(userId, {
      type: 'level_up',
      title: template.titleTemplate,
      message: template.messageTemplate.replace('{newLevel}', newLevel.toString()),
      priority: template.priority,
      category: template.category,
      icon: template.icon,
      actionUrl: template.actionUrl,
      actionText: template.actionText,
      data: { newLevel },
      isRead: false,
      isSent: false
    });
  }

  // Inicializar templates no banco
  async initializeTemplates(): Promise<void> {
    try {
      for (const template of this.NOTIFICATION_TEMPLATES) {
        const { data: existing } = await supabase
          .from('notification_templates')
          .select('id')
          .eq('type', template.type)
          .eq('category', template.category)
          .single();

        if (!existing) {
          await supabase
            .from('notification_templates')
            .insert({
              type: template.type,
              category: template.category,
              title_template: template.titleTemplate,
              message_template: template.messageTemplate,
              priority: template.priority,
              icon: template.icon,
              action_url: template.actionUrl,
              action_text: template.actionText,
              is_active: template.isActive,
              conditions: template.conditions
            });
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar templates:', error);
    }
  }
}

export const notificationsService = new NotificationsService();
export default notificationsService;
