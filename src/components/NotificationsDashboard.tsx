import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  BellOff, 
  Settings, 
  Check, 
  X, 
  Trash2, 
  Clock,
  Star,
  Trophy,
  Gift,
  TrendingUp,
  Users,
  Zap,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { type PushNotification } from '@/services/notificationsService';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationsDashboardProps {
  variant?: 'full' | 'compact' | 'widget';
  className?: string;
}

const NotificationsDashboard: React.FC<NotificationsDashboardProps> = ({ 
  variant = 'full',
  className 
}) => {
  const {
    notifications,
    unreadNotifications,
    notificationSettings,
    permissionStatus,
    isLoadingNotifications,
    requestPermission,
    updateSettings,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendTestNotification,
    getNotificationStats,
    getRecentNotifications,
    isNotificationSystemReady,
    getNotificationSystemStatus,
    isRequestingPermission,
    isUpdatingSettings
  } = useNotifications();

  const notificationStats = getNotificationStats();
  const recentNotifications = getRecentNotifications(5);
  const systemStatus = getNotificationSystemStatus();

  const getNotificationIcon = (type: PushNotification['type']) => {
    const icons = {
      achievement: Star,
      reward: Gift,
      ranking: TrendingUp,
      competition: Trophy,
      level_up: Zap,
      reminder: Clock,
      social: Users
    };
    return icons[type] || Bell;
  };

  const getPriorityColor = (priority: PushNotification['priority']) => {
    const colors = {
      low: 'text-gray-500',
      normal: 'text-blue-500',
      high: 'text-orange-500',
      urgent: 'text-red-500'
    };
    return colors[priority] || 'text-gray-500';
  };

  const formatNotificationTime = (date: Date) => {
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: ptBR 
    });
  };

  if (variant === 'widget') {
    return (
      <Card className={cn('h-full', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-500" />
            Notificações
            {unreadNotifications.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadNotifications.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!isNotificationSystemReady() && (
            <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-xs text-yellow-700">{systemStatus.message}</span>
              </div>
              {systemStatus.action && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2 h-6 text-xs"
                  onClick={requestPermission}
                  disabled={isRequestingPermission}
                >
                  {systemStatus.action}
                </Button>
              )}
            </div>
          )}
          
          {isLoadingNotifications ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : recentNotifications.length > 0 ? (
            <div className="space-y-2">
              {recentNotifications.map((notif) => {
                const Icon = getNotificationIcon(notif.type);
                return (
                  <div 
                    key={notif.id} 
                    className={cn(
                      'p-2 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors',
                      !notif.isRead && 'bg-blue-50 border-blue-200'
                    )}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={cn('h-4 w-4 mt-0.5', getPriorityColor(notif.priority))} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{notif.title}</p>
                        <p className="text-xs text-gray-500 truncate">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatNotificationTime(notif.createdAt)}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4">
              <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Nenhuma notificação</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            Notificações
            {unreadNotifications.length > 0 && (
              <Badge variant="destructive">
                {unreadNotifications.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Central de notificações e configurações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recent" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recent">Recentes</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>
            
            <TabsContent value="recent" className="space-y-4">
              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notif) => {
                    const Icon = getNotificationIcon(notif.type);
                    return (
                      <Card key={notif.id} className={cn(
                        'cursor-pointer hover:shadow-md transition-shadow',
                        !notif.isRead && 'ring-2 ring-blue-200'
                      )}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Icon className={cn('h-5 w-5 mt-0.5', getPriorityColor(notif.priority))} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{notif.title}</p>
                              <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                              <p className="text-xs text-gray-400">
                                {formatNotificationTime(notif.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {!notif.isRead && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => markAsRead(notif.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => deleteNotification(notif.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma notificação ainda</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4">
              {notificationSettings && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notificações Push</p>
                      <p className="text-sm text-gray-500">Receber notificações no navegador</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.pushEnabled}
                      onCheckedChange={(checked) => updateSettings({ pushEnabled: checked })}
                      disabled={isUpdatingSettings}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { key: 'achievements', label: 'Conquistas', icon: Star },
                      { key: 'rewards', label: 'Recompensas', icon: Gift },
                      { key: 'rankings', label: 'Rankings', icon: TrendingUp },
                      { key: 'competitions', label: 'Competições', icon: Trophy }
                    ].map(({ key, label, icon: Icon }) => (
                      <div key={key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{label}</span>
                        </div>
                        <Switch 
                          checked={notificationSettings[key as keyof typeof notificationSettings] as boolean}
                          onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                          disabled={isUpdatingSettings}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={sendTestNotification}
                  >
                    Enviar Notificação de Teste
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  // Variant 'full'
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-500" />
            Central de Notificações
            {unreadNotifications.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadNotifications.length} não lidas
              </Badge>
            )}
          </h2>
          <p className="text-muted-foreground">
            Gerencie suas notificações e configurações de alerta
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadNotifications.length > 0 && (
            <Button 
              variant="outline" 
              onClick={markAllAsRead}
            >
              <Check className="h-4 w-4 mr-2" />
              Marcar Todas como Lidas
            </Button>
          )}
          <Button 
            variant="outline"
            onClick={sendTestNotification}
          >
            <Bell className="h-4 w-4 mr-2" />
            Teste
          </Button>
        </div>
      </div>

      {/* Status do Sistema */}
      {!isNotificationSystemReady() && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800">{systemStatus.message}</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Configure as notificações para receber alertas sobre conquistas, recompensas e rankings.
                </p>
              </div>
              {systemStatus.action && (
                <Button 
                  onClick={requestPermission}
                  disabled={isRequestingPermission}
                >
                  {systemStatus.action}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <p className="text-2xl font-bold mt-2">{notificationStats.total}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Não Lidas</span>
            </div>
            <p className="text-2xl font-bold mt-2">{notificationStats.unread}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Últimas 24h</span>
            </div>
            <p className="text-2xl font-bold mt-2">{notificationStats.recent}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Taxa de Leitura</span>
            </div>
            <p className="text-2xl font-bold mt-2">{notificationStats.readPercentage}%</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notif) => {
                const Icon = getNotificationIcon(notif.type);
                return (
                  <Card key={notif.id} className={cn(
                    'transition-all hover:shadow-md',
                    !notif.isRead && 'ring-2 ring-blue-200 bg-blue-50'
                  )}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'p-2 rounded-full',
                          !notif.isRead ? 'bg-blue-100' : 'bg-gray-100'
                        )}>
                          <Icon className={cn('h-5 w-5', getPriorityColor(notif.priority))} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{notif.title}</h3>
                            {!notif.isRead && (
                              <Badge variant="default" className="bg-blue-500">
                                Nova
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-gray-600 mb-3">{notif.message}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{formatNotificationTime(notif.createdAt)}</span>
                            <span>•</span>
                            <span className="capitalize">{notif.category}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!notif.isRead && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => markAsRead(notif.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => deleteNotification(notif.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma notificação
              </h3>
              <p className="text-gray-500">
                Você não tem notificações ainda.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {notificationSettings && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Gerais</CardTitle>
                  <CardDescription>
                    Configure como você quer receber notificações
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notificações Push</p>
                      <p className="text-sm text-gray-500">Receber no navegador</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.pushEnabled}
                      onCheckedChange={(checked) => updateSettings({ pushEnabled: checked })}
                      disabled={isUpdatingSettings}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notificações In-App</p>
                      <p className="text-sm text-gray-500">Mostrar dentro da aplicação</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.inAppEnabled}
                      onCheckedChange={(checked) => updateSettings({ inAppEnabled: checked })}
                      disabled={isUpdatingSettings}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tipos de Notificação</CardTitle>
                  <CardDescription>
                    Escolha quais tipos de notificação receber
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'achievements', label: 'Conquistas', icon: Star },
                    { key: 'rewards', label: 'Recompensas', icon: Gift },
                    { key: 'rankings', label: 'Rankings', icon: TrendingUp },
                    { key: 'competitions', label: 'Competições', icon: Trophy },
                    { key: 'levelUps', label: 'Level Up', icon: Zap },
                    { key: 'reminders', label: 'Lembretes', icon: Clock },
                    { key: 'social', label: 'Social', icon: Users }
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">{label}</p>
                        </div>
                      </div>
                      <Switch 
                        checked={notificationSettings[key as keyof typeof notificationSettings] as boolean}
                        onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                        disabled={isUpdatingSettings}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationsDashboard;
