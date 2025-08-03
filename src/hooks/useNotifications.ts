import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService, type PushNotification, type NotificationSettings } from '@/services/notificationsService';
import { useUserContext } from '@/hooks/useUserContext';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

export const useNotifications = () => {
  const { user } = useUserContext();
  const queryClient = useQueryClient();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  // Verificar permissão de notificações no mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // Query para configurações de notificação
  const {
    data: notificationSettings,
    isLoading: isLoadingSettings,
    error: settingsError,
    refetch: refetchSettings
  } = useQuery({
    queryKey: ['notification-settings', user?.id],
    queryFn: () => user?.id ? notificationsService.getUserNotificationSettings(user.id) : null,
    staleTime: 10 * 60 * 1000, // 10 minutos
    enabled: !!user?.id
  });

  // Query para notificações do usuário
  const {
    data: notifications = [],
    isLoading: isLoadingNotifications,
    error: notificationsError,
    refetch: refetchNotifications
  } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => user?.id ? notificationsService.getUserNotifications(user.id, 50) : [],
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // Refetch a cada 5 minutos
    enabled: !!user?.id
  });

  // Query para notificações não lidas
  const {
    data: unreadNotifications = [],
    isLoading: isLoadingUnread,
    refetch: refetchUnread
  } = useQuery({
    queryKey: ['notifications', 'unread', user?.id],
    queryFn: () => user?.id ? notificationsService.getUserNotifications(user.id, 20, true) : [],
    staleTime: 1 * 60 * 1000, // 1 minuto
    refetchInterval: 2 * 60 * 1000, // Refetch a cada 2 minutos
    enabled: !!user?.id
  });

  // Mutation para solicitar permissão
  const requestPermissionMutation = useMutation({
    mutationFn: () => notificationsService.requestPermission(),
    onSuccess: (granted) => {
      if (granted) {
        setPermissionStatus('granted');
        toast.success('Notificações habilitadas!', {
          description: 'Você receberá notificações sobre conquistas e recompensas.'
        });
        
        // Registrar service worker
        notificationsService.registerServiceWorker();
      } else {
        setPermissionStatus('denied');
        toast.error('Permissão negada', {
          description: 'Você pode habilitar notificações nas configurações do navegador.'
        });
      }
    },
    onError: (error) => {
      console.error('Erro ao solicitar permissão:', error);
      toast.error('Erro ao solicitar permissão para notificações');
    }
  });

  // Mutation para atualizar configurações
  const updateSettingsMutation = useMutation({
    mutationFn: (settings: Partial<Omit<NotificationSettings, 'userId'>>) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      return notificationsService.updateNotificationSettings(user.id, settings);
    },
    onSuccess: (success) => {
      if (success) {
        toast.success('Configurações atualizadas!');
        queryClient.invalidateQueries({ queryKey: ['notification-settings', user?.id] });
      } else {
        toast.error('Erro ao atualizar configurações');
      }
    },
    onError: (error) => {
      console.error('Erro ao atualizar configurações:', error);
      toast.error('Erro ao atualizar configurações');
    }
  });

  // Mutation para marcar como lida
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationsService.markAsRead(notificationId),
    onSuccess: (success, notificationId) => {
      if (success) {
        // Atualizar cache local
        queryClient.setQueryData(['notifications', user?.id], (old: PushNotification[] = []) =>
          old.map(notif => 
            notif.id === notificationId ? { ...notif, isRead: true } : notif
          )
        );
        
        queryClient.setQueryData(['notifications', 'unread', user?.id], (old: PushNotification[] = []) =>
          old.filter(notif => notif.id !== notificationId)
        );
      }
    },
    onError: (error) => {
      console.error('Erro ao marcar como lida:', error);
    }
  });

  // Mutation para marcar todas como lidas
  const markAllAsReadMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      return notificationsService.markAllAsRead(user.id);
    },
    onSuccess: (success) => {
      if (success) {
        // Atualizar cache local
        queryClient.setQueryData(['notifications', user?.id], (old: PushNotification[] = []) =>
          old.map(notif => ({ ...notif, isRead: true }))
        );
        
        queryClient.setQueryData(['notifications', 'unread', user?.id], () => []);
        
        toast.success('Todas as notificações foram marcadas como lidas');
      }
    },
    onError: (error) => {
      console.error('Erro ao marcar todas como lidas:', error);
      toast.error('Erro ao marcar notificações como lidas');
    }
  });

  // Mutation para deletar notificação
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => notificationsService.deleteNotification(notificationId),
    onSuccess: (success, notificationId) => {
      if (success) {
        // Remover do cache local
        queryClient.setQueryData(['notifications', user?.id], (old: PushNotification[] = []) =>
          old.filter(notif => notif.id !== notificationId)
        );
        
        queryClient.setQueryData(['notifications', 'unread', user?.id], (old: PushNotification[] = []) =>
          old.filter(notif => notif.id !== notificationId)
        );
        
        toast.success('Notificação removida');
      }
    },
    onError: (error) => {
      console.error('Erro ao deletar notificação:', error);
      toast.error('Erro ao remover notificação');
    }
  });

  // Mutation para enviar notificação de teste
  const sendTestNotificationMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      return notificationsService.sendPushNotification(user.id, {
        type: 'reminder',
        title: '🧪 Notificação de Teste',
        message: 'Esta é uma notificação de teste do sistema LifeWay!',
        priority: 'normal',
        category: 'test',
        icon: 'Bell',
        actionUrl: '/dashboard',
        actionText: 'Ver Dashboard'
      });
    },
    onSuccess: (success) => {
      if (success) {
        toast.success('Notificação de teste enviada!');
        refetchNotifications();
        refetchUnread();
      } else {
        toast.error('Erro ao enviar notificação de teste');
      }
    },
    onError: (error) => {
      console.error('Erro ao enviar notificação de teste:', error);
      toast.error('Erro ao enviar notificação de teste');
    }
  });

  // Função para refresh geral
  const refreshAllData = async () => {
    await Promise.all([
      refetchSettings(),
      refetchNotifications(),
      refetchUnread()
    ]);
  };

  // Utilitários para análise de dados
  const getNotificationStats = () => {
    const total = notifications.length;
    const unread = unreadNotifications.length;
    const read = total - unread;
    
    const byType = notifications.reduce((acc, notif) => {
      acc[notif.type] = (acc[notif.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = notifications.reduce((acc, notif) => {
      acc[notif.priority] = (acc[notif.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recent = notifications.filter(notif => {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return notif.createdAt > dayAgo;
    }).length;

    return {
      total,
      unread,
      read,
      recent,
      byType,
      byPriority,
      readPercentage: total > 0 ? Math.round((read / total) * 100) : 0
    };
  };

  const getRecentNotifications = (limit: number = 5) => {
    return notifications
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  };

  const getNotificationsByType = (type: PushNotification['type']) => {
    return notifications.filter(notif => notif.type === type);
  };

  const getNotificationsByPriority = (priority: PushNotification['priority']) => {
    return notifications.filter(notif => notif.priority === priority);
  };

  const hasUnreadHighPriority = () => {
    return unreadNotifications.some(notif => 
      notif.priority === 'high' || notif.priority === 'urgent'
    );
  };

  // Métodos de conveniência para notificações específicas
  const notifyAchievementUnlocked = async (achievementName: string, category: string) => {
    if (!user?.id) return false;
    return await notificationsService.notifyAchievementUnlocked(user.id, achievementName, category);
  };

  const notifyRewardUnlocked = async (rewardName: string, level: number) => {
    if (!user?.id) return false;
    return await notificationsService.notifyRewardUnlocked(user.id, rewardName, level);
  };

  const notifyRankingChange = async (newRank: number, oldRank: number, category: string) => {
    if (!user?.id) return false;
    return await notificationsService.notifyRankingChange(user.id, newRank, oldRank, category);
  };

  const notifyLevelUp = async (newLevel: number) => {
    if (!user?.id) return false;
    return await notificationsService.notifyLevelUp(user.id, newLevel);
  };

  // Verificar se notificações estão configuradas corretamente
  const isNotificationSystemReady = () => {
    return (
      permissionStatus === 'granted' &&
      notificationSettings?.pushEnabled &&
      notificationSettings?.inAppEnabled
    );
  };

  const getNotificationSystemStatus = () => {
    if (permissionStatus === 'denied') {
      return {
        status: 'blocked',
        message: 'Notificações bloqueadas pelo navegador',
        action: 'Habilite nas configurações do navegador'
      };
    }

    if (permissionStatus === 'default') {
      return {
        status: 'permission_needed',
        message: 'Permissão necessária',
        action: 'Clique para permitir notificações'
      };
    }

    if (!notificationSettings?.pushEnabled) {
      return {
        status: 'disabled',
        message: 'Notificações desabilitadas',
        action: 'Habilite nas configurações'
      };
    }

    return {
      status: 'ready',
      message: 'Sistema de notificações ativo',
      action: null
    };
  };

  return {
    // Dados
    notifications,
    unreadNotifications,
    notificationSettings,
    permissionStatus,
    
    // Estados de carregamento
    isLoadingNotifications,
    isLoadingUnread,
    isLoadingSettings,
    
    // Erros
    notificationsError,
    settingsError,
    
    // Ações
    requestPermission: requestPermissionMutation.mutate,
    updateSettings: updateSettingsMutation.mutate,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    sendTestNotification: sendTestNotificationMutation.mutate,
    refreshAllData,
    
    // Estados das mutations
    isRequestingPermission: requestPermissionMutation.isPending,
    isUpdatingSettings: updateSettingsMutation.isPending,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeletingNotification: deleteNotificationMutation.isPending,
    isSendingTestNotification: sendTestNotificationMutation.isPending,
    
    // Utilitários
    getNotificationStats,
    getRecentNotifications,
    getNotificationsByType,
    getNotificationsByPriority,
    hasUnreadHighPriority,
    isNotificationSystemReady,
    getNotificationSystemStatus,
    
    // Métodos de conveniência
    notifyAchievementUnlocked,
    notifyRewardUnlocked,
    notifyRankingChange,
    notifyLevelUp,
    
    // Refetch functions
    refetchNotifications,
    refetchUnread,
    refetchSettings
  };
};

export default useNotifications;
