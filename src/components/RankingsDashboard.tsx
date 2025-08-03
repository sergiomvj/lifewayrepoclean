import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Trophy, 
  Crown, 
  Medal, 
  Star, 
  Users, 
  Calendar, 
  Target, 
  TrendingUp,
  Gift,
  Zap,
  Award,
  Timer,
  ChevronRight,
  Sparkles,
  Flame,
  Shield,
  MessageSquare,
  FileText,
  Compass
} from 'lucide-react';
import { useRankings } from '@/hooks/useRankings';
import { useUserContext } from '@/hooks/useUserContext';
import { type Competition } from '@/services/rankingsService';
import { cn } from '@/lib/utils';

interface RankingsDashboardProps {
  variant?: 'full' | 'compact' | 'widget';
  className?: string;
}

const RankingsDashboard: React.FC<RankingsDashboardProps> = ({ 
  variant = 'full',
  className 
}) => {
  const { user } = useUserContext();
  const {
    globalRanking,
    userPosition,
    activeCompetitions,
    userCompetitions,
    rankingStats,
    isLoadingGlobal,
    isLoadingPosition,
    isLoadingCompetitions,
    joinCompetition,
    isJoiningCompetition,
    getRankingAnalysis,
    getRecommendedCompetitions
  } = useRankings();

  const [selectedCategory, setSelectedCategory] = useState<Competition['category']>('global');
  const [selectedCompetition, setSelectedCompetition] = useState<string | null>(null);

  const rankingAnalysis = getRankingAnalysis();
  const recommendedCompetitions = getRecommendedCompetitions();

  const getCategoryIcon = (category: Competition['category']) => {
    const icons = {
      global: Crown,
      dreams: Star,
      visa_match: Shield,
      specialist_chat: MessageSquare,
      pdf_generation: FileText,
      cross_tool: Compass
    };
    return icons[category] || Trophy;
  };

  const getCompetitionTypeColor = (type: Competition['type']) => {
    const colors = {
      leaderboard: 'bg-blue-500',
      tournament: 'bg-purple-500',
      challenge: 'bg-green-500',
      seasonal: 'bg-orange-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-yellow-50';
    if (rank === 2) return 'bg-gray-400 text-gray-50';
    if (rank === 3) return 'bg-amber-600 text-amber-50';
    if (rank <= 10) return 'bg-blue-500 text-blue-50';
    if (rank <= 50) return 'bg-green-500 text-green-50';
    return 'bg-gray-500 text-gray-50';
  };

  const formatTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Finalizada';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  if (variant === 'widget') {
    return (
      <Card className={cn('h-full', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Rankings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoadingPosition ? (
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            </div>
          ) : userPosition ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Posição Global</span>
                <Badge className={getRankBadgeColor(userPosition.rank)}>
                  #{userPosition.rank}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Percentil</span>
                <span className="text-sm font-medium">{userPosition.percentile}%</span>
              </div>
              <Progress value={userPosition.percentile} className="h-2" />
            </div>
          ) : (
            <p className="text-sm text-gray-500">Dados não disponíveis</p>
          )}
          
          {recommendedCompetitions.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500 mb-2">Competições Recomendadas</p>
              <div className="space-y-1">
                {recommendedCompetitions.slice(0, 2).map((comp) => (
                  <div key={comp.id} className="flex items-center gap-2 text-xs">
                    <div className={cn('w-2 h-2 rounded-full', getCompetitionTypeColor(comp.type))} />
                    <span className="truncate">{comp.name}</span>
                  </div>
                ))}
              </div>
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
            <Trophy className="h-5 w-5 text-yellow-500" />
            Rankings & Competições
          </CardTitle>
          <CardDescription>
            Sua posição nos rankings e competições ativas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="position" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="position">Minha Posição</TabsTrigger>
              <TabsTrigger value="competitions">Competições</TabsTrigger>
            </TabsList>
            
            <TabsContent value="position" className="space-y-4">
              {isLoadingPosition ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : userPosition ? (
                <div className="grid gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Ranking Global</p>
                          <p className="text-2xl font-bold">#{userPosition.rank}</p>
                        </div>
                        <Badge className={getRankBadgeColor(userPosition.rank)} variant="secondary">
                          Top {userPosition.percentile}%
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {rankingAnalysis && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">Nível Competitivo</span>
                        </div>
                        <p className="text-lg font-semibold capitalize">{rankingAnalysis.competitiveLevel}</p>
                        <Progress value={userPosition.percentile} className="mt-2" />
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Complete algumas atividades para aparecer nos rankings!
                </p>
              )}
            </TabsContent>
            
            <TabsContent value="competitions" className="space-y-4">
              {isLoadingCompetitions ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : recommendedCompetitions.length > 0 ? (
                <div className="space-y-3">
                  {recommendedCompetitions.map((comp) => {
                    const Icon = getCategoryIcon(comp.category);
                    return (
                      <Card key={comp.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn('p-2 rounded-full', getCompetitionTypeColor(comp.type))}>
                                <Icon className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{comp.name}</p>
                                <p className="text-xs text-gray-500">
                                  {comp.currentParticipants} participantes
                                </p>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => joinCompetition({ competitionId: comp.id })}
                              disabled={isJoiningCompetition}
                            >
                              Participar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Nenhuma competição recomendada no momento
                </p>
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
          <h2 className="text-2xl font-bold tracking-tight">Rankings & Competições</h2>
          <p className="text-muted-foreground">
            Acompanhe sua posição e participe de competições emocionantes
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Criar Competição
        </Button>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Total de Usuários</span>
            </div>
            <p className="text-2xl font-bold mt-2">{rankingStats?.totalUsers || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Competições Ativas</span>
            </div>
            <p className="text-2xl font-bold mt-2">{rankingStats?.activeCompetitions || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Sua Posição</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {userPosition ? `#${userPosition.rank}` : '-'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Percentil</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {userPosition ? `${userPosition.percentile}%` : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rankings" className="w-full">
        <TabsList>
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="competitions">Competições Ativas</TabsTrigger>
          <TabsTrigger value="my-competitions">Minhas Competições</TabsTrigger>
          <TabsTrigger value="leaderboards">Leaderboards</TabsTrigger>
        </TabsList>

        <TabsContent value="rankings" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Ranking Global */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Ranking Global
                </CardTitle>
                <CardDescription>Top performers em todas as ferramentas</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingGlobal ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                        <div className="flex-1 space-y-1">
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {globalRanking.slice(0, 10).map((entry, index) => (
                      <div key={entry.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                        <Badge className={getRankBadgeColor(entry.rank)} variant="secondary">
                          #{entry.rank}
                        </Badge>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={entry.avatar} />
                          <AvatarFallback>{entry.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{entry.username}</p>
                          <p className="text-xs text-gray-500">
                            {entry.score} pontos • Nível {entry.level}
                          </p>
                        </div>
                        {entry.change !== 0 && (
                          <div className={cn(
                            'flex items-center gap-1 text-xs',
                            entry.change > 0 ? 'text-green-600' : 'text-red-600'
                          )}>
                            <TrendingUp className={cn(
                              'h-3 w-3',
                              entry.change < 0 && 'rotate-180'
                            )} />
                            {Math.abs(entry.change)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Minha Posição Detalhada */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-blue-500" />
                  Minha Performance
                </CardTitle>
                <CardDescription>Sua posição e análise detalhada</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPosition ? (
                  <div className="space-y-4">
                    <div className="h-20 bg-gray-100 rounded animate-pulse" />
                    <div className="h-16 bg-gray-100 rounded animate-pulse" />
                  </div>
                ) : userPosition && rankingAnalysis ? (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                      <p className="text-3xl font-bold text-blue-600">#{userPosition.rank}</p>
                      <p className="text-sm text-gray-600">de {userPosition.totalUsers} usuários</p>
                      <Badge className="mt-2" variant="secondary">
                        Top {userPosition.percentile}%
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Nível Competitivo</span>
                        <span className="font-medium capitalize">{rankingAnalysis.competitiveLevel}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Pontuação Total</span>
                        <span className="font-medium">{userPosition.score}</span>
                      </div>
                      
                      <Progress value={userPosition.percentile} className="h-2" />
                      
                      {rankingAnalysis.isTopPerformer && (
                        <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-2 rounded">
                          <Award className="h-4 w-4" />
                          <span className="text-sm font-medium">Top Performer!</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Complete atividades para aparecer nos rankings!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="competitions" className="space-y-4">
          {isLoadingCompetitions ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeCompetitions.map((comp) => {
                const Icon = getCategoryIcon(comp.category);
                const isParticipating = userCompetitions?.active.some(uc => uc.id === comp.id);
                
                return (
                  <Card key={comp.id} className="overflow-hidden">
                    <CardHeader className={cn('pb-3', comp.color === 'rainbow' ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500' : `bg-${comp.color}-500`)}>
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5" />
                          <Badge variant="secondary" className="text-xs">
                            {comp.type}
                          </Badge>
                        </div>
                        <Timer className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold">{comp.name}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{comp.description}</p>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            {comp.currentParticipants} participantes
                          </span>
                          <span className="font-medium">
                            {formatTimeRemaining(comp.endDate)}
                          </span>
                        </div>
                        
                        {comp.prize && (
                          <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                            <Gift className="h-4 w-4 text-yellow-600" />
                            <span className="text-xs text-yellow-700">{comp.prize.description}</span>
                          </div>
                        )}
                        
                        <Button 
                          className="w-full" 
                          variant={isParticipating ? "secondary" : "default"}
                          onClick={() => !isParticipating && joinCompetition({ competitionId: comp.id })}
                          disabled={isJoiningCompetition || isParticipating}
                        >
                          {isParticipating ? 'Participando' : 'Participar'}
                          {!isParticipating && <ChevronRight className="h-4 w-4 ml-1" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-competitions" className="space-y-4">
          {isLoadingCompetitions ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : userCompetitions ? (
            <div className="space-y-6">
              {userCompetitions.active.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    Competições Ativas
                  </h3>
                  <div className="space-y-3">
                    {userCompetitions.active.map((comp) => {
                      const Icon = getCategoryIcon(comp.category);
                      return (
                        <Card key={comp.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Icon className="h-5 w-5 text-blue-500" />
                                <div>
                                  <p className="font-medium">{comp.name}</p>
                                  <p className="text-sm text-gray-500">
                                    Termina em {formatTimeRemaining(comp.endDate)}
                                  </p>
                                </div>
                              </div>
                              <Button variant="outline" size="sm">
                                Ver Detalhes
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {userCompetitions.upcoming.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    Próximas Competições
                  </h3>
                  <div className="space-y-3">
                    {userCompetitions.upcoming.map((comp) => {
                      const Icon = getCategoryIcon(comp.category);
                      return (
                        <Card key={comp.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Icon className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="font-medium">{comp.name}</p>
                                  <p className="text-sm text-gray-500">
                                    Inicia em {formatTimeRemaining(comp.startDate)}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="secondary">Em breve</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {userCompetitions.active.length === 0 && userCompetitions.upcoming.length === 0 && (
                <div className="text-center py-12">
                  <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma competição ativa
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Explore as competições disponíveis e comece a competir!
                  </p>
                  <Button>
                    Explorar Competições
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="leaderboards" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(['global', 'dreams', 'visa_match', 'specialist_chat', 'pdf_generation', 'cross_tool'] as const).map((category) => {
              const Icon = getCategoryIcon(category);
              return (
                <Card key={category} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {category === 'global' ? 'Global' : 
                       category === 'dreams' ? 'Dreams' :
                       category === 'visa_match' ? 'VisaMatch' :
                       category === 'specialist_chat' ? 'Chat Especialista' :
                       category === 'pdf_generation' ? 'PDF Generation' :
                       'Cross-Tool'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Badge variant="secondary" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                            {i + 1}
                          </Badge>
                          <span className="text-gray-600">Usuário {i + 1}</span>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3">
                      Ver Completo
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RankingsDashboard;
