import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Star, 
  Trophy, 
  Lock, 
  Unlock,
  Lightbulb,
  Crown,
  Calendar,
  Eye,
  Shield,
  Search,
  Target,
  Globe,
  Award,
  MessageSquare,
  BookOpen,
  Puzzle,
  Users,
  Brain,
  FileText,
  FolderOpen,
  Sparkles,
  Zap,
  BarChart3,
  Settings,
  Compass,
  Link
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToolAchievements } from '@/hooks/useToolAchievements';
import { ToolAchievement } from '@/services/toolAchievementsService';

interface ToolAchievementsDashboardProps {
  className?: string;
  variant?: 'full' | 'compact' | 'widget';
  tool?: ToolAchievement['tool'];
  showProgress?: boolean;
  showStats?: boolean;
}

const DIFFICULTY_COLORS = {
  bronze: 'bg-amber-100 text-amber-800 border-amber-300',
  silver: 'bg-gray-100 text-gray-800 border-gray-300',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  platinum: 'bg-purple-100 text-purple-800 border-purple-300',
  diamond: 'bg-blue-100 text-blue-800 border-blue-300'
};

const DIFFICULTY_GRADIENTS = {
  bronze: 'from-amber-50 to-amber-100',
  silver: 'from-gray-50 to-gray-100',
  gold: 'from-yellow-50 to-yellow-100',
  platinum: 'from-purple-50 to-purple-100',
  diamond: 'from-blue-50 to-blue-100'
};

const TOOL_COLORS = {
  dreams: 'text-pink-600',
  visa_match: 'text-green-600',
  specialist_chat: 'text-blue-600',
  pdf_generation: 'text-red-600',
  unified_dashboard: 'text-purple-600',
  all_tools: 'text-rainbow'
};

const TOOL_NAMES = {
  dreams: 'Dreams',
  visa_match: 'VisaMatch',
  specialist_chat: 'Chat Especialista',
  pdf_generation: 'Geração PDF',
  unified_dashboard: 'Dashboard',
  all_tools: 'Todas as Ferramentas'
};

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Star, Trophy, Lock, Unlock, Lightbulb, Crown, Calendar, Eye, Shield, Search,
  Target, Globe, Award, MessageSquare, BookOpen, Puzzle, Users, Brain, FileText,
  FolderOpen, Sparkles, Zap, BarChart3, Settings, Compass, Link
};

export function ToolAchievementsDashboard({ 
  className, 
  variant = 'full',
  tool,
  showProgress = true,
  showStats = true 
}: ToolAchievementsDashboardProps) {
  const {
    allAchievements,
    toolAchievements,
    unlockedAchievements,
    availableAchievements,
    secretAchievements,
    achievementStats,
    isLoading,
    error,
    getAchievementsByTool,
    getAchievementsByCategory,
    getAchievementsByDifficulty,
    isAchievementUnlocked,
    getProgressToAchievement,
    newAchievementsCount,
    markAchievementsAsSeen
  } = useToolAchievements({ tool });

  const [activeTab, setActiveTab] = useState('by-tool');
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolAchievement['tool']>('dreams');

  const getAchievementIcon = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName] || Trophy;
    return IconComponent;
  };

  const renderAchievementCard = (achievement: ToolAchievement, showProgressBar = false, userStats?: Record<string, any>) => {
    const IconComponent = getAchievementIcon(achievement.icon);
    const isUnlocked = isAchievementUnlocked(achievement.id);
    const progress = showProgressBar && userStats ? getProgressToAchievement(achievement.id, userStats) : null;

    return (
      <Card 
        key={achievement.id}
        className={cn(
          'transition-all duration-200 hover:shadow-md cursor-pointer relative',
          `bg-gradient-to-br ${DIFFICULTY_GRADIENTS[achievement.difficulty]}`,
          selectedAchievement === achievement.id && 'ring-2 ring-blue-500',
          !isUnlocked && 'opacity-70',
          achievement.isSecret && !isUnlocked && 'border-dashed'
        )}
        onClick={() => setSelectedAchievement(selectedAchievement === achievement.id ? null : achievement.id)}
      >
        {achievement.isSecret && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs">
              Secreto
            </Badge>
          </div>
        )}
        
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <div className={cn(
              'p-2 rounded-full',
              isUnlocked ? 'bg-white shadow-sm' : 'bg-gray-200'
            )}>
              {isUnlocked ? (
                <IconComponent className={cn('w-5 h-5', TOOL_COLORS[achievement.tool])} />
              ) : (
                <Lock className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm font-semibold">
                {achievement.isSecret && !isUnlocked ? '???' : achievement.name}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={cn('text-xs', DIFFICULTY_COLORS[achievement.difficulty])}>
                  {achievement.difficulty}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {TOOL_NAMES[achievement.tool]}
                </Badge>
                <span className="text-xs text-gray-600">{achievement.points} pts</span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <p className="text-xs text-gray-600 mb-3">
            {achievement.isSecret && !isUnlocked ? 'Conquista secreta - continue explorando para descobrir!' : achievement.description}
          </p>
          
          {progress && !isUnlocked && (
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span>Progresso</span>
                <span>{progress.current} / {progress.required}</span>
              </div>
              <Progress value={progress.percentage} className="h-1" />
            </div>
          )}
          
          {selectedAchievement === achievement.id && !achievement.isSecret && (
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Categoria:</span>
                <span className="font-medium capitalize">{achievement.category}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Critério:</span>
                <span className="font-medium">{achievement.criteria.type}</span>
              </div>
              {achievement.rewards && (
                <div className="text-xs">
                  <span className="text-gray-500">Recompensas:</span>
                  <ul className="mt-1 space-y-1">
                    {achievement.rewards.title && (
                      <li className="flex items-center">
                        <Crown className="w-3 h-3 mr-1 text-yellow-500" />
                        Título: {achievement.rewards.title}
                      </li>
                    )}
                    {achievement.rewards.feature_unlock && (
                      <li className="flex items-center">
                        <Unlock className="w-3 h-3 mr-1 text-green-500" />
                        Funcionalidade: {achievement.rewards.feature_unlock}
                      </li>
                    )}
                    {achievement.rewards.bonus_points && (
                      <li className="flex items-center">
                        <Star className="w-3 h-3 mr-1 text-blue-500" />
                        Bônus: {achievement.rewards.bonus_points} pontos
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderStatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <Card>
        <CardContent className="p-4 text-center">
          <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
          <div className="text-2xl font-bold">{achievementStats.totalUnlocked}</div>
          <div className="text-xs text-gray-600">Desbloqueadas</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <Star className="w-8 h-8 mx-auto mb-2 text-blue-500" />
          <div className="text-2xl font-bold">{achievementStats.totalPoints}</div>
          <div className="text-xs text-gray-600">Pontos</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <Crown className="w-8 h-8 mx-auto mb-2 text-purple-500" />
          <div className="text-2xl font-bold">{achievementStats.byDifficulty.diamond || 0}</div>
          <div className="text-xs text-gray-600">Diamante</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <Eye className="w-8 h-8 mx-auto mb-2 text-gray-500" />
          <div className="text-2xl font-bold">{achievementStats.secretsUnlocked}</div>
          <div className="text-xs text-gray-600">Secretas</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <Target className="w-8 h-8 mx-auto mb-2 text-green-500" />
          <div className="text-2xl font-bold">{availableAchievements.length}</div>
          <div className="text-xs text-gray-600">Disponíveis</div>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando conquistas...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Widget compacto
  if (variant === 'widget') {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Trophy className="w-5 h-5" />
            <span>Conquistas</span>
            {newAchievementsCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {newAchievementsCount} nova{newAchievementsCount > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Desbloqueadas:</span>
              <span className="font-semibold">{achievementStats.totalUnlocked}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Pontos ganhos:</span>
              <span className="font-semibold">{achievementStats.totalPoints}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Secretas:</span>
              <span className="font-semibold">{achievementStats.secretsUnlocked}</span>
            </div>
            {unlockedAchievements.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-600 mb-2">Recentes:</p>
                <div className="space-y-1">
                  {unlockedAchievements.slice(0, 2).map(ua => {
                    const achievement = allAchievements.find(a => a.id === ua.achievement_id);
                    if (!achievement) return null;
                    return (
                      <div key={ua.id} className="text-xs flex items-center space-x-2">
                        <Badge className={cn('text-xs', DIFFICULTY_COLORS[achievement.difficulty])}>
                          {achievement.difficulty}
                        </Badge>
                        <span>{achievement.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Dashboard completo
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-100 rounded-full">
                <Trophy className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Conquistas por Ferramenta</CardTitle>
                <CardDescription className="text-base">
                  Suas conquistas especializadas em cada ferramenta LifeWay
                </CardDescription>
              </div>
            </div>
            {newAchievementsCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={markAchievementsAsSeen}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {newAchievementsCount} Nova{newAchievementsCount > 1 ? 's' : ''}
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas */}
      {showStats && renderStatsCards()}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="by-tool">Por Ferramenta</TabsTrigger>
          <TabsTrigger value="by-difficulty">Por Dificuldade</TabsTrigger>
          <TabsTrigger value="by-category">Por Categoria</TabsTrigger>
          <TabsTrigger value="secrets">Secretas</TabsTrigger>
        </TabsList>

        <TabsContent value="by-tool" className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {(['dreams', 'visa_match', 'specialist_chat', 'pdf_generation', 'unified_dashboard', 'all_tools'] as const).map(toolKey => (
              <Button
                key={toolKey}
                variant={selectedTool === toolKey ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool(toolKey)}
              >
                {TOOL_NAMES[toolKey]} ({getAchievementsByTool(toolKey).length})
              </Button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getAchievementsByTool(selectedTool).map(achievement => 
              renderAchievementCard(achievement, showProgress)
            )}
          </div>
        </TabsContent>

        <TabsContent value="by-difficulty" className="space-y-4">
          {(['diamond', 'platinum', 'gold', 'silver', 'bronze'] as const).map(difficulty => {
            const achievements = getAchievementsByDifficulty(difficulty);
            if (achievements.length === 0) return null;
            
            return (
              <div key={difficulty}>
                <h3 className="text-lg font-semibold mb-3 capitalize flex items-center">
                  <Crown className={cn('w-5 h-5 mr-2', {
                    'text-blue-500': difficulty === 'diamond',
                    'text-purple-500': difficulty === 'platinum',
                    'text-yellow-500': difficulty === 'gold',
                    'text-gray-500': difficulty === 'silver',
                    'text-amber-500': difficulty === 'bronze'
                  })} />
                  {difficulty} ({achievements.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map(achievement => renderAchievementCard(achievement))}
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="by-category" className="space-y-4">
          {(['mastery', 'quality', 'consistency', 'social', 'usage', 'milestone'] as const).map(category => {
            const achievements = getAchievementsByCategory(category);
            if (achievements.length === 0) return null;
            
            return (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-3 capitalize flex items-center">
                  <Target className="w-5 h-5 mr-2 text-green-500" />
                  {category} ({achievements.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map(achievement => renderAchievementCard(achievement))}
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="secrets" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {secretAchievements.map(achievement => renderAchievementCard(achievement))}
          </div>
          
          {secretAchievements.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Nenhuma conquista secreta encontrada</p>
                <p className="text-sm text-gray-500 mt-2">Continue explorando para descobrir conquistas ocultas!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ToolAchievementsDashboard;
