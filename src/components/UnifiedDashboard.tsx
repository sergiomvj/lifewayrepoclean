import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  Clock, 
  Star, 
  Trophy, 
  Download, 
  Share2, 
  RefreshCw,
  Calendar,
  Target,
  Zap,
  Crown,
  Medal,
  Gift,
  Award,
  CheckCircle,
  BarChart3,
  MessageSquare,
  FileText,
  Settings,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnifiedFlow } from '@/hooks/useUnifiedFlow';
import { useDataSync } from '@/hooks/useDataSync';
import { useActivityCharts } from '@/hooks/useActivityCharts';
import { useUserContext } from '@/hooks/useUserContext';
import { useGamification, useActivityTracking } from '@/hooks/useGamification';
import { useRankings } from '@/hooks/useRankings';
import { useRewards } from '@/hooks/useRewards';
import { useToolAchievements } from '@/hooks/useToolAchievements';
import { useNotifications } from '@/hooks/useNotifications';
import { UnifiedFlowNavigation } from './UnifiedFlowNavigation';
import { DataSyncStatus } from './DataSyncStatus';
import { ActivityCharts } from './ActivityCharts';
import { AdvancedActivityCharts } from './AdvancedActivityCharts';
import { GamificationDashboard, GamificationWidget } from './GamificationDashboard';
import { RewardsDashboard } from './RewardsDashboard';
import { ToolAchievementsDashboard } from './ToolAchievementsDashboard';
import RankingsDashboard from '@/components/RankingsDashboard';
import NotificationsDashboard from '@/components/NotificationsDashboard';
import PDFGenerationDashboard from '@/components/PDFGenerationDashboard';
import { usePDFSimple } from '@/hooks/usePDFSimple';

interface UnifiedDashboardProps {
  className?: string;
}

interface DashboardStats {
  total_time_spent: number;
  completion_percentage: number;
  tools_used: number;
  pdfs_generated: number;
  specialist_sessions: number;
  last_activity: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  unlocked_at?: string;
  progress?: number;
  max_progress?: number;
}

export function UnifiedDashboard({ className }: UnifiedDashboardProps) {
  const [activeView, setActiveView] = useState<'overview' | 'progress' | 'tools' | 'achievements' | 'analytics'>('overview');
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    flowProgress,
    currentStep,
    completedSteps,
    completionPercentage,
    isLoading: flowLoading,
    transitionToStep,
    navigateToCurrentStep
  } = useUnifiedFlow();
  
  const {
    syncStatus,
    isSyncing,
    syncError,
    forceSyncAll,
    refreshSyncStatus
  } = useDataSync();
  
  const {
    totalSessions,
    engagementScore,
    validationMetrics,
    insights,
    isLoadingActivity,
    refreshData: refreshCharts
  } = useActivityCharts({ enableRealTime: true });

  const { context: userContext } = useUserContext();

  // Hook de gamificação expandido
  const {
    stats: gamificationStats,
    achievements: userAchievements,
    isLoading: isLoadingGamification,
    currentLevel,
    levelProgress,
    recentAchievements,
    totalProgress: gamificationProgress,
    addPoints,
    checkAchievements
  } = useGamification();

  // Hook de tracking de atividades
  const { trackToolUsage, trackCompletion } = useActivityTracking();

  const rewardsData = useRewards();
  const { rewards = [], isLoadingRewards = false } = rewardsData || {};
  const toolAchievementsData = useToolAchievements();
  const { achievements: toolAchievements = [], isLoadingAchievements = false } = toolAchievementsData || {};
  const { userPosition, activeCompetitions, isLoadingPosition } = useRankings();
  const { unreadNotifications, isNotificationSystemReady } = useNotifications();
  
  // Hook de geração de PDF
  const {
    pdfAccess,
    pdfHistory,
    isGenerating,
    generatePDF,
    isLoadingAccess
  } = usePDFSimple();

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // Carregar estatísticas do dashboard
  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        setIsLoadingStats(true);
        
        // Simular dados (implementar busca real posteriormente)
        const stats: DashboardStats = {
          total_time_spent: totalSessions * 15 || 0, // Estimativa baseada em sessões
          completion_percentage: completionPercentage || 0,
          tools_used: completedSteps?.length || 0,
          pdfs_generated: pdfHistory?.length || 0, // Dados reais do PDF
          specialist_sessions: 0, // Buscar do serviço de chat
          last_activity: flowProgress?.updated_at || new Date().toISOString()
        };
        
        setDashboardStats(stats);
        
        // Carregar conquistas
        loadAchievements();

        // Tracking automático de atividade no dashboard
        await trackToolUsage('dashboard', {
          completion_percentage: completionPercentage,
          total_sessions: totalSessions,
          engagement_score: engagementScore
        });

        // Verificar conquistas baseadas no progresso atual
        if (completionPercentage && completionPercentage > 0) {
          await checkAchievements({
            completionPercentage,
            timeSpent: totalSessions * 15,
            toolUsage: { tool: 'dashboard', count: 1 },
            customConditions: {
              highEngagement: (engagementScore || 0) >= 80,
              consistentUsage: totalSessions >= 5
            }
          });
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    if (userContext?.profile?.id) {
      loadDashboardStats();
    }
  }, [userContext?.profile?.id, completionPercentage, completedSteps?.length, totalSessions, engagementScore, trackToolUsage, checkAchievements]);

  const loadAchievements = () => {
    // Simplificar verificação de conquistas baseada em completion percentage
    const allAchievements: Achievement[] = [
      {
        id: 'first_dream',
        title: 'Primeiro Sonho',
        description: 'Complete o Criador de Sonhos',
        icon: <Star className="w-5 h-5 text-yellow-500" />,
        unlocked: (completionPercentage || 0) >= 25,
        unlocked_at: (completionPercentage || 0) >= 25 ? new Date().toISOString() : undefined
      },
      {
        id: 'pdf_master',
        title: 'Mestre do PDF',
        description: 'Gere seu primeiro relatório PDF',
        icon: <FileText className="w-5 h-5 text-blue-500" />,
        unlocked: (completionPercentage || 0) >= 50,
        unlocked_at: (completionPercentage || 0) >= 50 ? new Date().toISOString() : undefined
      },
      {
        id: 'visa_strategist',
        title: 'Estrategista de Visto',
        description: 'Complete a análise VisaMatch',
        icon: <Target className="w-5 h-5 text-green-500" />,
        unlocked: (completionPercentage || 0) >= 75,
        unlocked_at: (completionPercentage || 0) >= 75 ? new Date().toISOString() : undefined
      },
      {
        id: 'expert_consulter',
        title: 'Consultor Expert',
        description: 'Converse com um especialista',
        icon: <MessageSquare className="w-5 h-5 text-purple-500" />,
        unlocked: (totalSessions || 0) >= 3,
        unlocked_at: (totalSessions || 0) >= 3 ? new Date().toISOString() : undefined
      },
      {
        id: 'journey_complete',
        title: 'Jornada Completa',
        description: 'Complete toda a jornada LifeWay',
        icon: <Trophy className="w-5 h-5 text-gold-500" />,
        unlocked: (completionPercentage || 0) >= 100,
        unlocked_at: (completionPercentage || 0) >= 100 ? new Date().toISOString() : undefined
      },
      {
        id: 'speed_runner',
        title: 'Velocista',
        description: 'Complete a jornada em menos de 2 horas',
        icon: <Zap className="w-5 h-5 text-orange-500" />,
        unlocked: false,
        progress: dashboardStats?.total_time_spent || 0,
        max_progress: 120 // 2 horas em minutos
      }
    ];

    // setAchievements(allAchievements); // Removed - not needed
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        forceSyncAll(),
        refreshCharts()
      ]);
      // Recarregar estatísticas
      if (userContext?.profile?.id) {
        const stats: DashboardStats = {
          total_time_spent: totalSessions * 15 || 0,
          completion_percentage: completionPercentage || 0,
          tools_used: completedSteps?.length || 0,
          pdfs_generated: 0,
          specialist_sessions: 0,
          last_activity: flowProgress?.updated_at || new Date().toISOString()
        };
        setDashboardStats(stats);
      }
      refreshSyncStatus();
    } catch (error) {
      console.error('Erro ao atualizar dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Sessões</p>
                <p className="text-2xl font-bold">{totalSessions || 0}</p>
                <p className="text-xs text-green-600">+2 esta semana</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Engajamento</p>
                <p className="text-2xl font-bold">{engagementScore || 0}%</p>
                <p className="text-xs text-muted-foreground">
                  {(engagementScore || 0) >= 80 ? 'Excelente' : (engagementScore || 0) >= 60 ? 'Bom' : 'Pode melhorar'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">
                  {validationMetrics ? Math.round(validationMetrics.success_rate * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Validações</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conquistas</p>
                <p className="text-2xl font-bold">{toolAchievements.filter(a => a.unlocked).length}</p>
                <p className="text-xs text-green-600">+{toolAchievements.filter(a => a.unlocked).length} esta semana</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Widget de Gamificação */}
      <GamificationWidget className="mb-6" />

      {/* Widget de Gráficos de Atividade */}
      <AdvancedActivityCharts 
        variant="compact"
        showInsights={true}
        showBenchmarks={false}
        showHeatmap={true}
        className="mb-6"
      />

      {/* Widget de Recompensas */}
      <RewardsDashboard 
        variant="widget"
        showProgress={false}
        showStats={false}
        className="mb-6"
      />

      {/* Widget de Conquistas Específicas */}
      <ToolAchievementsDashboard 
        variant="widget"
        showProgress={false}
        showStats={false}
        className="mb-6"
      />

      {/* Rankings Widget */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          Rankings
        </h3>
        <RankingsDashboard variant="widget" className="h-64" />
      </div>

      {/* Notifications Widget */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notificações
          {unreadNotifications.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadNotifications.length}
            </Badge>
          )}
        </h3>
        <NotificationsDashboard variant="widget" className="h-64" />
      </div>

      {/* PDF Generation Widget */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Download className="h-4 w-4" />
          Geração de PDF
          {pdfHistory?.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {pdfHistory.length} PDFs
            </Badge>
          )}
        </h3>
        <PDFGenerationDashboard variant="widget" />
      </div>

      {/* Navegação do fluxo */}
      <UnifiedFlowNavigation 
        variant="full" 
        showProgress={true}
        showRecommendations={true}
        showAnalytics={false}
      />

      {/* Status de sincronização */}
      <DataSyncStatus 
        variant="compact" 
        showControls={true}
        showConflicts={true}
      />

      {/* Ações rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          <CardDescription>
            Acesse rapidamente suas ferramentas favoritas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={async () => {
                await trackToolUsage('dreams', {
                  completion_percentage: completionPercentage,
                  total_sessions: totalSessions,
                  engagement_score: engagementScore
                });
                window.location.href = '/dreams';
              }}
            >
              <Star className="w-6 h-6" />
              <span className="text-xs">Dreams</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={async () => {
                await trackToolUsage('visamatch', { source: 'dashboard_quick_action' });
                window.location.href = '/visamatch';
              }}
            >
              <Target className="w-6 h-6" />
              <span className="text-xs">VisaMatch</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={async () => {
                await trackToolUsage('specialist_chat', { source: 'dashboard_quick_action' });
                window.location.href = '/especialista';
              }}
            >
              <Users className="w-6 h-6" />
              <span className="text-xs">Especialista</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={async () => {
                await trackToolUsage('pdf_generation', { source: 'dashboard_quick_action' });
                window.location.href = '/dreams/pdf';
              }}
            >
              <Download className="w-6 h-6" />
              <span className="text-xs">PDF</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProgressTab = () => (
    <div className="space-y-6">
      {/* Progresso detalhado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Análise de Progresso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Progresso Geral</span>
              <span>{completionPercentage || 0}%</span>
            </div>
            <Progress value={completionPercentage || 0} className="h-3" />
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div>
              <h4 className="font-semibold mb-3">Tempo por Etapa</h4>
              <div className="space-y-2">
                {[
                  { name: 'Criador de Sonhos', time: 15, completed: (completionPercentage || 0) >= 25 },
                  { name: 'PDF Generation', time: 5, completed: (completionPercentage || 0) >= 50 },
                  { name: 'VisaMatch', time: 10, completed: (completionPercentage || 0) >= 75 },
                  { name: 'Chat Especialista', time: 20, completed: (completionPercentage || 0) >= 90 }
                ].map((step, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      {step.completed ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-400" />
                      )}
                      <span>{step.name}</span>
                    </div>
                    <span className="text-gray-600">{step.time}min</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Estatísticas</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Sessões ativas:</span>
                  <span>1</span>
                </div>
                <div className="flex justify-between">
                  <span>Última atividade:</span>
                  <span>
                    {dashboardStats?.last_activity ? 
                      new Date(dashboardStats.last_activity).toLocaleDateString('pt-BR') :
                      'Nunca'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Ferramentas usadas:</span>
                  <span>{dashboardStats?.tools_used || 0}/4</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de atividade (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Gráfico de atividade será implementado</p>
              <p className="text-sm">Mostrará progresso ao longo do tempo</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAchievementsTab = () => (
    <div className="space-y-6">
      {/* Resumo de conquistas */}
      <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Trophy className="w-8 h-8 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Suas Conquistas</h3>
                <p className="text-gray-600">
                  {toolAchievements.filter(a => a.unlocked).length} de {toolAchievements.length} desbloqueadas
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-600">
                {Math.round((toolAchievements.filter(a => a.unlocked).length / toolAchievements.length) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Completude</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de conquistas */}
      <div className="grid md:grid-cols-2 gap-4">
        {toolAchievements.map((achievement) => (
          <Card 
            key={achievement.id}
            className={`transition-all ${
              achievement.unlocked 
                ? 'border-green-200 bg-green-50' 
                : 'border-gray-200 opacity-75'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${
                  achievement.unlocked ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {achievement.unlocked ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    achievement.icon
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-semibold">{achievement.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {achievement.description}
                  </p>
                  
                  {achievement.unlocked ? (
                    <Badge className="bg-green-100 text-green-800">
                      Desbloqueada
                      {achievement.unlocked_at && (
                        <span className="ml-1 text-xs">
                          {new Date(achievement.unlocked_at).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </Badge>
                  ) : achievement.progress !== undefined ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progresso</span>
                        <span>{achievement.progress}/{achievement.max_progress}</span>
                      </div>
                      <Progress 
                        value={(achievement.progress / (achievement.max_progress || 1)) * 100} 
                        className="h-2" 
                      />
                    </div>
                  ) : (
                    <Badge variant="secondary">Bloqueada</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-6">
      {/* Status de sincronização detalhado */}
      <DataSyncStatus 
        variant="full" 
        showControls={true}
        showConflicts={true}
      />

      {/* Dados das ferramentas */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Star className="w-5 h-5 mr-2" />
              Criador de Sonhos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <Badge variant={(completionPercentage || 0) >= 25 ? 'default' : 'secondary'}>
                  {(completionPercentage || 0) >= 25 ? 'Concluído' : 'Pendente'}
                </Badge>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Dados sincronizados:</span>
                <span>{syncStatus?.sync_health === 'healthy' ? 'Sim' : 'Não'}</span>
              </div>
              
              <Button variant="outline" size="sm" className="w-full">
                <Download className="w-4 h-4 mr-1" />
                Exportar Dados
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Target className="w-5 h-5 mr-2" />
              VisaMatch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <Badge variant={completedSteps.includes('visamatch_analysis') ? 'default' : 'secondary'}>
                  {completedSteps.includes('visamatch_analysis') ? 'Concluído' : 'Pendente'}
                </Badge>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Dados sincronizados:</span>
                <span>{syncStatus?.tools_synced.includes('visamatch') ? 'Sim' : 'Não'}</span>
              </div>
              
              <Button variant="outline" size="sm" className="w-full">
                <Download className="w-4 h-4 mr-1" />
                Exportar Dados
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de dados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Controles de Dados</CardTitle>
          <CardDescription>
            Gerencie seus dados e privacidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar Tudo
            </Button>
            
            <Button variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
            
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      {/* Insights e Recomendações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Recomendações</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.slice(0, 3).map((rec, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{rec.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => console.log('Navigate to:', rec.title)}>
                    Ir
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Insights Inteligentes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.slice(0, 3).map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2" />
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
              {insights.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Continue usando as ferramentas para gerar insights personalizados
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de atividade */}
      <ActivityCharts />
    </div>
  );

  const renderRankingsTab = () => (
    <div className="space-y-6">
      <RankingsDashboard variant="full" />
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <NotificationsDashboard variant="full" />
    </div>
  );

  if (isLoadingStats) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando seu dashboard...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`${className} space-y-6`}>
      {/* Header do Dashboard */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Trophy className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  Olá, {userContext?.profile?.name || 'Usuário'}! 👋
                </CardTitle>
                <CardDescription className="text-base">
                  Bem-vindo ao seu painel de controle LifeWay
                </CardDescription>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                {completionPercentage}%
              </div>
              <div className="text-sm text-gray-600">
                Jornada Completa
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs do Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="progress">Progresso</TabsTrigger>
          <TabsTrigger value="gamification">Gamificação</TabsTrigger>
          <TabsTrigger value="rewards">Recompensas</TabsTrigger>
          <TabsTrigger value="tool-achievements">Conquistas Específicas</TabsTrigger>     
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="pdf-generation">Geração PDF</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="progress">
          {renderProgressTab()}
        </TabsContent>

        <TabsContent value="achievements">
          {renderAchievementsTab()}
        </TabsContent>

        <TabsContent value="gamification">
          <GamificationDashboard />
        </TabsContent>

        <TabsContent value="rewards">
          <RewardsDashboard 
            variant="full"
            showProgress={true}
            showStats={true}
          />
        </TabsContent>

        <TabsContent value="tool-achievements">
          <ToolAchievementsDashboard 
            variant="full"
            showProgress={true}
            showStats={true}
          />
        </TabsContent>

        <TabsContent value="rankings">
          {renderRankingsTab()}
        </TabsContent>
        
        <TabsContent value="notifications">
          <NotificationsDashboard variant="full" />
        </TabsContent>

        <TabsContent value="pdf-generation">
          <PDFGenerationDashboard
            variant="full"
          />
        </TabsContent>

        <TabsContent value="analytics">
          <AdvancedActivityCharts 
            variant="full"
            showInsights={true}
            showBenchmarks={true}
            showHeatmap={true}
            period="month"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default UnifiedDashboard;
