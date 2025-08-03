import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Gift, 
  Crown, 
  Star, 
  Trophy, 
  Zap, 
  Lock, 
  Unlock,
  Sparkles,
  Award,
  Target,
  Users,
  Shield,
  Percent,
  Bot,
  BookOpen,
  Infinity,
  Heart,
  Compass,
  Headphones
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRewards } from '@/hooks/useRewards';
import { Reward, LevelBenefit } from '@/services/rewardsService';

interface RewardsDashboardProps {
  className?: string;
  variant?: 'full' | 'compact' | 'widget';
  showProgress?: boolean;
  showStats?: boolean;
}

const RARITY_COLORS = {
  common: 'bg-gray-100 text-gray-800 border-gray-300',
  rare: 'bg-blue-100 text-blue-800 border-blue-300',
  epic: 'bg-purple-100 text-purple-800 border-purple-300',
  legendary: 'bg-yellow-100 text-yellow-800 border-yellow-300'
};

const RARITY_GRADIENTS = {
  common: 'from-gray-50 to-gray-100',
  rare: 'from-blue-50 to-blue-100',
  epic: 'from-purple-50 to-purple-100',
  legendary: 'from-yellow-50 to-yellow-100'
};

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Star, Crown, Trophy, Zap, Gift, Award, Target, Users, Shield, Percent, 
  Bot, BookOpen, Infinity, Heart, Compass, Headphones
};

export function RewardsDashboard({ 
  className, 
  variant = 'full',
  showProgress = true,
  showStats = true 
}: RewardsDashboardProps) {
  const {
    userRewards,
    currentLevelBenefits,
    nextLevelBenefits,
    allBenefitsUpToLevel,
    rewardsStats,
    isLoading,
    error,
    useReward,
    getUnusedRewards,
    getRecentRewards,
    getProgressToNextReward,
    newRewardsCount,
    markRewardsAsSeen
  } = useRewards();

  const [activeTab, setActiveTab] = useState('rewards');
  const [selectedReward, setSelectedReward] = useState<string | null>(null);

  const unusedRewards = getUnusedRewards();
  const recentRewards = getRecentRewards(7);
  const progressToNext = getProgressToNextReward();

  const handleUseReward = async (rewardId: string) => {
    const success = await useReward(rewardId);
    if (success) {
      setSelectedReward(null);
    }
  };

  const getRewardIcon = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName] || Gift;
    return IconComponent;
  };

  const renderRewardCard = (reward: Reward, userReward?: any, showActions = true) => {
    const IconComponent = getRewardIcon(reward.icon);
    const isUnlocked = !!userReward;
    const isUsed = userReward?.isUsed || false;

    return (
      <Card 
        key={reward.id}
        className={cn(
          'transition-all duration-200 hover:shadow-md cursor-pointer',
          `bg-gradient-to-br ${RARITY_GRADIENTS[reward.rarity]}`,
          selectedReward === reward.id && 'ring-2 ring-blue-500',
          !isUnlocked && 'opacity-60'
        )}
        onClick={() => setSelectedReward(selectedReward === reward.id ? null : reward.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn(
                'p-2 rounded-full',
                isUnlocked ? 'bg-white shadow-sm' : 'bg-gray-200'
              )}>
                {isUnlocked ? (
                  <IconComponent className="w-5 h-5 text-blue-600" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">{reward.name}</CardTitle>
                <Badge className={cn('text-xs', RARITY_COLORS[reward.rarity])}>
                  {reward.rarity}
                </Badge>
              </div>
            </div>
            {isUnlocked && (
              <div className="flex items-center space-x-1">
                {isUsed ? (
                  <Badge variant="secondary" className="text-xs">Usado</Badge>
                ) : (
                  <Badge variant="default" className="text-xs">Disponível</Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <p className="text-xs text-gray-600 mb-3">{reward.description}</p>
          
          {selectedReward === reward.id && (
            <div className="space-y-3 border-t pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Tipo:</span>
                <span className="font-medium">{reward.type}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Nível necessário:</span>
                <span className="font-medium">{reward.requiredLevel}</span>
              </div>
              
              {showActions && isUnlocked && !isUsed && (
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUseReward(reward.id);
                  }}
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Usar Recompensa
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderLevelBenefits = (benefits: LevelBenefit) => (
    <Card key={benefits.level} className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Crown className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Nível {benefits.level}</CardTitle>
              <CardDescription>{benefits.title}</CardDescription>
            </div>
          </div>
          {benefits.badge && (
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              {benefits.badge.name}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{benefits.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recompensas */}
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center">
              <Gift className="w-4 h-4 mr-1" />
              Recompensas
            </h4>
            <div className="space-y-2">
              {benefits.rewards.map(reward => {
                const userReward = userRewards.find(ur => ur.rewardId === reward.id);
                return renderRewardCard(reward, userReward, false);
              })}
            </div>
          </div>
          
          {/* Funcionalidades e Benefícios */}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center">
                <Unlock className="w-4 h-4 mr-1" />
                Funcionalidades
              </h4>
              <ul className="text-xs space-y-1">
                {benefits.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Star className="w-3 h-3 mr-1 text-yellow-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center">
                <Sparkles className="w-4 h-4 mr-1" />
                Benefícios
              </h4>
              <ul className="text-xs space-y-1">
                {benefits.perks.map((perk, index) => (
                  <li key={index} className="flex items-center">
                    <Zap className="w-3 h-3 mr-1 text-blue-500" />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4 text-center">
          <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
          <div className="text-2xl font-bold">{rewardsStats.totalUnlocked}</div>
          <div className="text-xs text-gray-600">Desbloqueadas</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <Gift className="w-8 h-8 mx-auto mb-2 text-blue-500" />
          <div className="text-2xl font-bold">{rewardsStats.availableRewards}</div>
          <div className="text-xs text-gray-600">Disponíveis</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <Crown className="w-8 h-8 mx-auto mb-2 text-purple-500" />
          <div className="text-2xl font-bold">{rewardsStats.epicRewards + rewardsStats.legendaryRewards}</div>
          <div className="text-xs text-gray-600">Épicas/Lendárias</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <Zap className="w-8 h-8 mx-auto mb-2 text-green-500" />
          <div className="text-2xl font-bold">{rewardsStats.totalUsed}</div>
          <div className="text-xs text-gray-600">Utilizadas</div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProgressCard = () => {
    if (!progressToNext) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Progresso para Próximo Nível</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Nível {progressToNext.nextLevel}</span>
              <span>{progressToNext.currentProgress} / {progressToNext.requiredProgress} pontos</span>
            </div>
            <Progress value={progressToNext.progressPercentage} className="h-2" />
            <p className="text-xs text-gray-600">
              Faltam {progressToNext.requiredProgress - progressToNext.currentProgress} pontos para o próximo nível
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando recompensas...</p>
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
            <Gift className="w-5 h-5" />
            <span>Recompensas</span>
            {newRewardsCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {newRewardsCount} nova{newRewardsCount > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Disponíveis:</span>
              <span className="font-semibold">{rewardsStats.availableRewards}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total desbloqueadas:</span>
              <span className="font-semibold">{rewardsStats.totalUnlocked}</span>
            </div>
            {recentRewards.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-600 mb-2">Recentes:</p>
                <div className="space-y-1">
                  {recentRewards.slice(0, 2).map(ur => (
                    <div key={ur.id} className="text-xs flex items-center space-x-2">
                      <Badge className={cn('text-xs', RARITY_COLORS[ur.reward.rarity])}>
                        {ur.reward.rarity}
                      </Badge>
                      <span>{ur.reward.name}</span>
                    </div>
                  ))}
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
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <Gift className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Sistema de Recompensas</CardTitle>
                <CardDescription className="text-base">
                  Suas conquistas e benefícios desbloqueados
                </CardDescription>
              </div>
            </div>
            {newRewardsCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={markRewardsAsSeen}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {newRewardsCount} Nova{newRewardsCount > 1 ? 's' : ''}
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas */}
      {showStats && renderStatsCards()}

      {/* Progresso */}
      {showProgress && renderProgressCard()}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rewards">Minhas Recompensas</TabsTrigger>
          <TabsTrigger value="benefits">Benefícios por Nível</TabsTrigger>
          <TabsTrigger value="upcoming">Próximos Níveis</TabsTrigger>
        </TabsList>

        <TabsContent value="rewards" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userRewards.map(ur => renderRewardCard(ur.reward, ur))}
          </div>
          
          {userRewards.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Gift className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Nenhuma recompensa desbloqueada ainda</p>
                <p className="text-sm text-gray-500 mt-2">Continue progredindo para desbloquear recompensas!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="benefits" className="space-y-4">
          {allBenefitsUpToLevel.map(benefits => renderLevelBenefits(benefits))}
          
          {allBenefitsUpToLevel.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Crown className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Nenhum benefício desbloqueado ainda</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {nextLevelBenefits && renderLevelBenefits(nextLevelBenefits)}
          
          {!nextLevelBenefits && (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                <p className="text-gray-600">Parabéns! Você alcançou o nível máximo!</p>
                <p className="text-sm text-gray-500 mt-2">Você desbloqueou todos os benefícios disponíveis.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RewardsDashboard;
