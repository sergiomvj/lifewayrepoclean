import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trophy, 
  Star, 
  Zap, 
  Target, 
  Award, 
  TrendingUp,
  Crown,
  Flame,
  Calendar,
  Clock,
  Users,
  Gift,
  Medal,
  Sparkles,
  ChevronRight,
  Lock,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGamification } from '@/hooks/useGamification';
import { Achievement } from '@/services/gamificationService';

interface GamificationDashboardProps {
  className?: string;
  compact?: boolean;
}

export function GamificationDashboard({ className, compact = false }: GamificationDashboardProps) {
  const {
    stats,
    achievements,
    isLoading,
    error,
    currentLevel,
    nextLevel,
    levelProgress,
    recentAchievements,
    totalProgress,
    getAchievementsByCategory,
    getUnlockedAchievements,
    getLockedAchievements
  } = useGamification();

  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando sistema de conquistas...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert className={className}>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const renderLevelCard = () => (
    <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-full">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl">
                Nível {currentLevel?.level || 1}
              </CardTitle>
              <CardDescription className="text-purple-100">
                {currentLevel?.title || 'Explorador'}
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {stats?.total_points || 0}
            </div>
            <div className="text-sm text-purple-100">
              pontos totais
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Progresso para próximo nível</span>
            <span>{Math.round(levelProgress)}%</span>
          </div>
          <Progress value={levelProgress} className="h-2 bg-white/20" />
          {nextLevel && (
            <div className="flex justify-between text-xs text-purple-100">
              <span>Próximo: {nextLevel.title}</span>
              <span>{stats?.points_to_next_level || 0} pontos restantes</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderStatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <div className="text-2xl font-bold">{stats?.achievements_unlocked || 0}</div>
          <div className="text-sm text-muted-foreground">Conquistas</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <div className="text-2xl font-bold">{stats?.current_streak || 0}</div>
          <div className="text-sm text-muted-foreground">Dias seguidos</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold">{Math.round(totalProgress)}%</div>
          <div className="text-sm text-muted-foreground">Progresso total</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <Medal className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold">{stats?.badges?.length || 0}</div>
          <div className="text-sm text-muted-foreground">Badges</div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRecentAchievements = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <span>Conquistas Recentes</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentAchievements.length > 0 ? (
          <div className="space-y-3">
            {recentAchievements.slice(0, 3).map((achievement, index) => (
              <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Trophy className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{achievement.title}</div>
                  <div className="text-xs text-muted-foreground">{achievement.description}</div>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  +{achievement.points}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma conquista recente</p>
            <p className="text-sm">Continue usando a plataforma para desbloquear conquistas!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderAchievementCard = (achievement: Achievement) => {
    const rarityColors = {
      common: 'border-gray-200 bg-gray-50',
      rare: 'border-blue-200 bg-blue-50',
      epic: 'border-purple-200 bg-purple-50',
      legendary: 'border-yellow-200 bg-yellow-50'
    };

    const rarityBadgeColors = {
      common: 'bg-gray-100 text-gray-800',
      rare: 'bg-blue-100 text-blue-800',
      epic: 'bg-purple-100 text-purple-800',
      legendary: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <Card key={achievement.id} className={cn(
        "relative transition-all duration-200 hover:shadow-md",
        rarityColors[achievement.rarity],
        achievement.unlocked ? 'opacity-100' : 'opacity-60'
      )}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className={cn(
              "p-2 rounded-full flex-shrink-0",
              achievement.unlocked ? 'bg-green-100' : 'bg-gray-100'
            )}>
              {achievement.unlocked ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Lock className="w-5 h-5 text-gray-400" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-sm truncate">{achievement.title}</h4>
                <Badge className={cn("text-xs", rarityBadgeColors[achievement.rarity])}>
                  {achievement.rarity}
                </Badge>
              </div>
              
              <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs font-medium">{achievement.points} pontos</span>
                </div>
                
                {achievement.unlocked && achievement.unlocked_at && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(achievement.unlocked_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>

              {!achievement.unlocked && achievement.progress !== undefined && achievement.max_progress && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progresso</span>
                    <span>{achievement.progress}/{achievement.max_progress}</span>
                  </div>
                  <Progress 
                    value={(achievement.progress / achievement.max_progress) * 100} 
                    className="h-1"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAchievementsTab = () => {
    const categories = [
      { id: 'progress', name: 'Progresso', icon: TrendingUp },
      { id: 'engagement', name: 'Engajamento', icon: Users },
      { id: 'milestone', name: 'Marcos', icon: Award },
      { id: 'special', name: 'Especiais', icon: Gift }
    ];

    return (
      <div className="space-y-6">
        {categories.map(category => {
          const categoryAchievements = getAchievementsByCategory(category.id);
          const unlockedCount = categoryAchievements.filter(a => a.unlocked).length;
          
          return (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <category.icon className="w-5 h-5" />
                    <span>{category.name}</span>
                  </div>
                  <Badge variant="outline">
                    {unlockedCount}/{categoryAchievements.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {categoryAchievements.map(renderAchievementCard)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {renderLevelCard()}
      {renderStatsCards()}
      {renderRecentAchievements()}
      
      {/* Próximas conquistas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-500" />
            <span>Próximas Conquistas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {getLockedAchievements()
              .slice(0, 4)
              .map(renderAchievementCard)}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (compact) {
    return (
      <div className={cn("space-y-4", className)}>
        {renderLevelCard()}
        {renderStatsCards()}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sistema de Conquistas</h2>
          <p className="text-muted-foreground">
            Acompanhe seu progresso e desbloqueie conquistas incríveis
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Gift className="w-4 h-4 mr-2" />
          Resgatar Recompensas
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="achievements">Todas as Conquistas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          {renderAchievementsTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente compacto para usar em outros lugares
export function GamificationWidget({ className }: { className?: string }) {
  const { stats, currentLevel, levelProgress } = useGamification();

  if (!stats || !currentLevel) {
    return null;
  }

  return (
    <Card className={cn("bg-gradient-to-r from-purple-500 to-pink-500 text-white", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Crown className="w-6 h-6" />
            <div>
              <div className="font-medium">Nível {currentLevel.level}</div>
              <div className="text-xs text-purple-100">{currentLevel.title}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold">{stats.total_points}</div>
            <div className="text-xs text-purple-100">pontos</div>
          </div>
        </div>
        <div className="mt-3">
          <Progress value={levelProgress} className="h-1 bg-white/20" />
        </div>
      </CardContent>
    </Card>
  );
}

export default GamificationDashboard;
