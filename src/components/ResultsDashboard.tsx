import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Target, 
  Award, 
  Clock, 
  DollarSign, 
  Users, 
  CheckCircle,
  AlertTriangle,
  Star,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Trophy
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Interfaces for data structures
interface VisaRecommendation {
  type: string;
  name: string;
  match: number;
  description: string;
  requirements: string[];
  timeline: string;
  cost: string;
  pros: string[];
  cons: string[];
  score?: number;
}

interface DreamGoal {
  id: string;
  form_data: any;
  action_plan?: string;
  status: 'draft' | 'completed';
  created_at: string;
  score?: number;
}

interface UserStats {
  totalDreams: number;
  completedDreams: number;
  totalVisaMatches: number;
  averageScore: number;
  topVisaType: string;
  progressPercentage: number;
}

interface ResultsDashboardProps {
  className?: string;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ className }) => {
  const [dreams, setDreams] = useState<DreamGoal[]>([]);
  const [visaRecommendations, setVisaRecommendations] = useState<VisaRecommendation[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalDreams: 0,
    completedDreams: 0,
    totalVisaMatches: 0,
    averageScore: 0,
    topVisaType: '',
    progressPercentage: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      // Fetch dreams
      const { data: dreamsData, error: dreamsError } = await supabase
        .from('dream_goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (dreamsError) throw dreamsError;

      // Calculate scores for dreams
      const scoredDreams = (dreamsData || []).map(dream => ({
        ...dream,
        score: calculateDreamScore(dream)
      }));

      setDreams(scoredDreams);

      // Calculate user statistics
      const stats = calculateUserStats(scoredDreams, visaRecommendations);
      setUserStats(stats);

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate dream score based on completeness and progress
  const calculateDreamScore = (dream: DreamGoal): number => {
    let score = 0;
    
    // Base score for having a dream
    score += 20;
    
    // Score for completeness of form data
    const formData = dream.form_data;
    const requiredFields = ['nome', 'objetivo_principal', 'categoria', 'timeline', 'situacao_atual'];
    const completedFields = requiredFields.filter(field => formData[field] && formData[field].trim() !== '');
    score += (completedFields.length / requiredFields.length) * 30;
    
    // Score for having action plan
    if (dream.action_plan) {
      score += 25;
    }
    
    // Score for status
    if (dream.status === 'completed') {
      score += 25;
    }
    
    // Bonus for priority level
    if (formData.prioridade === 'alta') {
      score += 10;
    } else if (formData.prioridade === 'media') {
      score += 5;
    }
    
    return Math.min(100, Math.round(score));
  };

  // Calculate visa recommendation score
  const calculateVisaScore = (visa: VisaRecommendation): number => {
    let score = visa.match || 0;
    
    // Adjust score based on timeline (faster = better)
    const timelineScore = getTimelineScore(visa.timeline);
    score = (score * 0.7) + (timelineScore * 0.3);
    
    // Adjust score based on cost (lower = better for most users)
    const costScore = getCostScore(visa.cost);
    score = (score * 0.8) + (costScore * 0.2);
    
    return Math.min(100, Math.round(score));
  };

  const getTimelineScore = (timeline: string): number => {
    const timelineLower = timeline.toLowerCase();
    if (timelineLower.includes('6') && timelineLower.includes('month')) return 90;
    if (timelineLower.includes('1') && timelineLower.includes('year')) return 75;
    if (timelineLower.includes('2') && timelineLower.includes('year')) return 60;
    if (timelineLower.includes('3') && timelineLower.includes('year')) return 45;
    return 30;
  };

  const getCostScore = (cost: string): number => {
    const costLower = cost.toLowerCase();
    if (costLower.includes('1,000') || costLower.includes('2,000')) return 90;
    if (costLower.includes('3,000') || costLower.includes('5,000')) return 75;
    if (costLower.includes('10,000')) return 60;
    if (costLower.includes('50,000')) return 45;
    return 30;
  };

  const calculateUserStats = (dreams: DreamGoal[], visas: VisaRecommendation[]): UserStats => {
    const totalDreams = dreams.length;
    const completedDreams = dreams.filter(d => d.status === 'completed').length;
    const totalVisaMatches = visas.length;
    
    const dreamScores = dreams.map(d => d.score || 0);
    const averageScore = dreamScores.length > 0 
      ? dreamScores.reduce((sum, score) => sum + score, 0) / dreamScores.length 
      : 0;
    
    const topVisaType = visas.length > 0 
      ? visas.sort((a, b) => (b.match || 0) - (a.match || 0))[0]?.type || ''
      : '';
    
    const progressPercentage = totalDreams > 0 ? (completedDreams / totalDreams) * 100 : 0;
    
    return {
      totalDreams,
      completedDreams,
      totalVisaMatches,
      averageScore: Math.round(averageScore),
      topVisaType,
      progressPercentage: Math.round(progressPercentage)
    };
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Sonhos</p>
                <p className="text-2xl font-bold text-blue-600">{userStats.totalDreams}</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sonhos Concluídos</p>
                <p className="text-2xl font-bold text-green-600">{userStats.completedDreams}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Score Médio</p>
                <p className={`text-2xl font-bold ${getScoreColor(userStats.averageScore)}`}>
                  {userStats.averageScore}
                </p>
              </div>
              <Trophy className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progresso</p>
                <p className="text-2xl font-bold text-purple-600">{userStats.progressPercentage}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Visão Geral do Progresso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Conclusão de Sonhos</span>
                <span className="text-sm text-gray-500">{userStats.progressPercentage}%</span>
              </div>
              <Progress value={userStats.progressPercentage} className="h-3" />
            </div>
            
            {userStats.averageScore > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Score Médio</span>
                  <span className="text-sm text-gray-500">{userStats.averageScore}/100</span>
                </div>
                <Progress value={userStats.averageScore} className="h-3" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <Tabs defaultValue="dreams" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dreams" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Sonhos ({dreams.length})
          </TabsTrigger>
          <TabsTrigger value="visas" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Vistos ({visaRecommendations.length})
          </TabsTrigger>
        </TabsList>

        {/* Dreams Tab */}
        <TabsContent value="dreams">
          <div className="space-y-4">
            {dreams.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Nenhum sonho criado ainda</p>
                </CardContent>
              </Card>
            ) : (
              dreams.map((dream) => (
                <Card key={dream.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Sonho de {dream.form_data.nome}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={getScoreBadgeVariant(dream.score || 0)}>
                          <Star className="w-3 h-3 mr-1" />
                          {dream.score}/100
                        </Badge>
                        <Badge variant={dream.status === 'completed' ? 'default' : 'secondary'}>
                          {dream.status === 'completed' ? 'Concluído' : 'Em Progresso'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Objetivo:</p>
                        <p className="text-sm text-gray-600">{dream.form_data.objetivo_principal}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Categoria:</p>
                        <Badge variant="outline" className="capitalize">
                          {dream.form_data.categoria}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Timeline:</p>
                        <p className="text-sm text-gray-600">{dream.form_data.timeline}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Prioridade:</p>
                        <Badge 
                          variant="outline"
                          className={`capitalize ${
                            dream.form_data.prioridade === 'alta' ? 'bg-red-50 text-red-700' :
                            dream.form_data.prioridade === 'media' ? 'bg-yellow-50 text-yellow-700' :
                            'bg-green-50 text-green-700'
                          }`}
                        >
                          {dream.form_data.prioridade}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Score Breakdown */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Análise de Score</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Completude do formulário:</span>
                          <span className="font-medium">30%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Plano de ação:</span>
                          <span className="font-medium">{dream.action_plan ? '25%' : '0%'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status de conclusão:</span>
                          <span className="font-medium">{dream.status === 'completed' ? '25%' : '0%'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Prioridade:</span>
                          <span className="font-medium">
                            {dream.form_data.prioridade === 'alta' ? '10%' : 
                             dream.form_data.prioridade === 'media' ? '5%' : '0%'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Visas Tab */}
        <TabsContent value="visas">
          <div className="space-y-4">
            {visaRecommendations.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Nenhuma recomendação de visto ainda</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Use o VisaMatch para obter recomendações personalizadas
                  </p>
                </CardContent>
              </Card>
            ) : (
              visaRecommendations.map((visa, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{visa.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={getScoreBadgeVariant(visa.score || visa.match)}>
                          <Zap className="w-3 h-3 mr-1" />
                          {visa.score || visa.match}% match
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{visa.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">{visa.timeline}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{visa.cost}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span className="text-sm">{visa.type}</span>
                      </div>
                    </div>

                    {/* Pros and Cons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-green-700 mb-2">Vantagens:</h4>
                        <ul className="text-xs space-y-1">
                          {visa.pros.map((pro, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-red-700 mb-2">Desvantagens:</h4>
                        <ul className="text-xs space-y-1">
                          {visa.cons.map((con, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <AlertTriangle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResultsDashboard;
