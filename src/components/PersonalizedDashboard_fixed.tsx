import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Target, 
  TrendingUp, 
  Trophy, 
  Clock, 
  Heart, 
  MessageCircle, 
  FileText, 
  Users, 
  Briefcase, 
  Globe, 
  CheckSquare, 
  Calculator, 
  PlayCircle, 
  ArrowRight, 
  Zap, 
  Info 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserContext } from '@/hooks/useUserContext';
import { useToolUsage } from '@/hooks/useToolUsage';
import { supabase } from '@/integrations/supabase/client';

interface PersonalizedDashboardProps {}

const PersonalizedDashboard: React.FC<PersonalizedDashboardProps> = () => {
  const { currentUser } = useUserContext();
  
  const {
    allTools,
    userStats,
    categorizedTools,
    isLoading,
    initializeTools,
    trackToolUsage
  } = useToolUsage();

  // Estado para verificar se o usuário tem perfil completo
  const [hasProfile, setHasProfile] = useState<boolean>(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  // Verificar se o usuário tem perfil completo
  useEffect(() => {
    const checkUserProfile = async () => {
      if (!currentUser?.id) {
        console.log('PersonalizedDashboard: Usuário não encontrado');
        setIsCheckingProfile(false);
        return;
      }
      
      console.log('PersonalizedDashboard: Verificando perfil para usuário:', currentUser.id);
      
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', currentUser.id)
          .single();
        
        console.log('PersonalizedDashboard: Resultado da consulta de perfil:', { data, error });
        
        const profileExists = !!data && !error;
        setHasProfile(profileExists);
        console.log('PersonalizedDashboard: Usuário tem perfil completo:', profileExists);
      } catch (error) {
        console.error('PersonalizedDashboard: Erro ao verificar perfil:', error);
        setHasProfile(false);
      } finally {
        setIsCheckingProfile(false);
      }
    };

    checkUserProfile();
  }, [currentUser?.id]);

  // Inicializar ferramentas para o usuário se necessário
  useEffect(() => {
    if (currentUser?.id && allTools.length === 0 && !isLoading) {
      initializeTools();
    }
  }, [currentUser?.id, allTools.length, isLoading, initializeTools]);

  // Mapeamento de ícones para ferramentas
  const toolIcons: Record<string, any> = {
    'dreams': Heart,
    'visa_match': Target,
    'specialist_chat': MessageCircle,
    'pdf_generator': FileText,
    'family_planner': Users,
    'get_opportunity': Briefcase,
    'project_usa': Globe,
    'service_way': CheckSquare,
    'calcway': Calculator,
    'interview_simulator': PlayCircle
  };

  // Mapeamento de rotas para ferramentas
  const toolRoutes: Record<string, string> = {
    'dreams': '/dreams',
    'visa_match': '/visa-match',
    'specialist_chat': '/especialista',
    'pdf_generator': '/pdf-generator',
    'family_planner': '/ferramentas/family-planner',
    'get_opportunity': '/ferramentas/get-opportunity',
    'project_usa': '/ferramentas/project-usa',
    'service_way': '/ferramentas/service-way',
    'calcway': '/ferramentas/calcway',
    'interview_simulator': '/ferramentas/simulador-entrevista'
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}min`;
  };

  if (isLoading || isCheckingProfile) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const usedTools = categorizedTools.used || [];
  const unusedTools = categorizedTools.unused || [];

  return (
    <div className="space-y-8">
      {/* Estatísticas Gerais */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ferramentas Usadas</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {userStats.used_tools}/{userStats.total_tools}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
                  <p className="text-2xl font-bold text-green-600">{userStats.completion_rate}%</p>
                </div>
                <Trophy className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tempo Total</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatTime(userStats.total_usage_time)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mais Usada</p>
                  <p className="text-lg font-bold text-orange-600">{userStats.most_used_tool}</p>
                </div>
                <Target className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Suas Ferramentas (Utilizadas) */}
      {usedTools.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-600" />
              Suas Ferramentas
            </h2>
            <Badge variant="secondary">{usedTools.length} ferramentas</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {usedTools.map((tool) => {
              const IconComponent = toolIcons[tool.tool_name] || Target;
              const route = toolRoutes[tool.tool_name];
              
              return (
                <Card 
                  key={tool.id} 
                  className={`hover:shadow-lg transition-all duration-200 ${
                    !hasProfile ? 'opacity-50 grayscale cursor-not-allowed' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          !hasProfile ? 'bg-gray-100' : 'bg-blue-100'
                        }`}>
                          <IconComponent className={`h-5 w-5 ${
                            !hasProfile ? 'text-gray-400' : 'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className={`font-semibold ${
                            !hasProfile ? 'text-gray-500' : 'text-gray-900'
                          }`}>{tool.tool_display_name}</h3>
                          <Badge 
                            variant={tool.status === 'completed' ? 'default' : 
                                   tool.status === 'in_progress' ? 'secondary' : 'outline'}
                            className="mt-1"
                          >
                            {tool.status === 'completed' ? 'Concluída' : 
                             tool.status === 'in_progress' ? 'Em andamento' : 'Iniciada'}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        Última vez: {new Date(tool.last_used_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Progresso */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progresso</span>
                        <span>{tool.completion_percentage}%</span>
                      </div>
                      <Progress value={tool.completion_percentage} className="h-2" />
                    </div>

                    {/* Estatísticas */}
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-600">Usos</p>
                        <p className="font-semibold text-blue-600">{tool.usage_count}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Tempo gasto</p>
                        <p className="font-semibold text-purple-600">{formatTime(tool.total_time_spent)}</p>
                      </div>
                    </div>

                    {/* Resultados gerados */}
                    {tool.results_generated > 0 && (
                      <div className="text-sm mb-4">
                        <p className="text-gray-600">Resultados gerados</p>
                        <p className="font-semibold text-green-600">{tool.results_generated}</p>
                      </div>
                    )}

                    {/* Botão de ação */}
                    <div className="pt-2">
                      {hasProfile ? (
                        route ? (
                          <Link to={route}>
                            <Button className="w-full" size="sm">
                              Continuar
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        ) : (
                          <Button 
                            className="w-full" 
                            size="sm"
                            onClick={() => trackToolUsage(tool.tool_name)}
                          >
                            Usar Ferramenta
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        )
                      ) : (
                        <Button 
                          className="w-full opacity-50 cursor-not-allowed" 
                          size="sm"
                          variant="outline"
                          disabled
                        >
                          Complete o Perfil
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Explore Novas Ferramentas (Não Utilizadas) */}
      {unusedTools.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="h-6 w-6 text-yellow-600" />
              Explore Novas Ferramentas
            </h2>
            <Badge variant="outline">{unusedTools.length} disponíveis</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {unusedTools.map((tool) => {
              const IconComponent = toolIcons[tool.tool_name] || Target;
              const route = toolRoutes[tool.tool_name];
              
              return (
                <Card 
                  key={tool.id} 
                  className={`hover:shadow-lg transition-all duration-200 border-dashed border-2 ${
                    !hasProfile ? 'opacity-50 grayscale border-gray-200 cursor-not-allowed' : 'border-gray-200'
                  }`}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`p-3 rounded-lg inline-block mb-3 ${
                      !hasProfile ? 'bg-gray-100' : 'bg-gray-100'
                    }`}>
                      <IconComponent className={`h-6 w-6 ${
                        !hasProfile ? 'text-gray-400' : 'text-gray-600'
                      }`} />
                    </div>
                    <h3 className={`font-semibold mb-2 ${
                      !hasProfile ? 'text-gray-500' : 'text-gray-900'
                    }`}>{tool.tool_display_name}</h3>
                    <Badge variant="outline" className="mb-4">
                      Não utilizada
                    </Badge>
                    
                    {hasProfile ? (
                      route ? (
                        <Link to={route}>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => trackToolUsage(tool.tool_name)}
                          >
                            Experimentar
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => trackToolUsage(tool.tool_name)}
                        >
                          Em breve
                        </Button>
                      )
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full opacity-50 cursor-not-allowed"
                        disabled
                      >
                        Complete o Perfil
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Próximos Passos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Próximos Passos Recomendados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!hasProfile && (
              <Alert className="border-orange-200 bg-orange-50">
                <User className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Complete seu perfil primeiro:</strong> Para usar todas as ferramentas e obter 
                  recomendações personalizadas, complete seu perfil clicando no botão abaixo.
                </AlertDescription>
              </Alert>
            )}
            
            {hasProfile && unusedTools.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Explore novas ferramentas:</strong> Você ainda tem {unusedTools.length} ferramentas 
                  para experimentar. Cada uma pode ajudar em diferentes aspectos da sua jornada.
                </AlertDescription>
              </Alert>
            )}
            
            {hasProfile && categorizedTools.inProgress.length > 0 && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>Continue seu progresso:</strong> Você tem {categorizedTools.inProgress.length} ferramentas 
                  em andamento. Complete-as para maximizar seus resultados.
                </AlertDescription>
              </Alert>
            )}

            {hasProfile && userStats && userStats.completion_rate < 50 && (
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <strong>Acelere seu progresso:</strong> Complete mais ferramentas para aumentar sua 
                  taxa de conclusão atual de {userStats.completion_rate}%.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Botão Completar Perfil (se necessário) */}
      {!hasProfile && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center">
            <User className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Complete seu Perfil
            </h3>
            <p className="text-blue-700 mb-4">
              Desbloqueie todas as funcionalidades criando seu perfil personalizado
            </p>
            <Link to="/profile">
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                <User className="mr-2 h-4 w-4" />
                Completar Perfil
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PersonalizedDashboard;
