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
import { Link, useNavigate } from 'react-router-dom';
import { useUserContext } from '@/hooks/useUserContext';
import { useToolUsage } from '@/hooks/useToolUsage';
import { supabase } from '@/integrations/supabase/client';

interface PersonalizedDashboardProps {}

const PersonalizedDashboard: React.FC<PersonalizedDashboardProps> = () => {
  const { currentUser } = useUserContext();
  const navigate = useNavigate();
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
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  // Verificar se o usuário tem perfil completo
  useEffect(() => {
    const checkUserProfile = async () => {
      if (!currentUser?.user_id) {
        setHasProfile(false);
        setIsProfileComplete(false);
        setIsCheckingProfile(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', currentUser.user_id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao verificar perfil:', error);
          setHasProfile(false);
          setIsProfileComplete(false);
        } else {
          const profileExists = !!data;
          setHasProfile(profileExists);
          setIsProfileComplete(profileExists);
          console.log('✅ Perfil encontrado:', profileExists);
        }
      } catch (error) {
        console.error('Erro na verificação do perfil:', error);
        setHasProfile(false);
        setIsProfileComplete(false);
      } finally {
        setIsCheckingProfile(false);
      }
    };

    checkUserProfile();
  }, [currentUser]);

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

  // Função para obter os próximos passos baseados no perfil do usuário
  const getNextSteps = () => {
    const steps = [];
    
    if (!hasProfile) {
      steps.push({
        title: "Complete seu perfil",
        description: "Crie seu perfil para desbloquear todas as ferramentas",
        action: "Criar Perfil",
        route: "/profile",
        priority: "high"
      });
    }
    
    if (usedTools.length === 0) {
      steps.push({
        title: "Explore suas primeiras ferramentas",
        description: "Comece com o Criador de Sonhos para mapear seus objetivos",
        action: "Começar",
        route: "/dreams",
        priority: "medium"
      });
    }
    
    if (usedTools.length > 0 && !usedTools.find(t => t.name === 'visa_match')) {
      steps.push({
        title: "Analise suas opções de visto",
        description: "Use o VisaMatch para descobrir as melhores estratégias",
        action: "Analisar",
        route: "/visa-match",
        priority: "medium"
      });
    }
    
    if (usedTools.length >= 2) {
      steps.push({
        title: "Converse com um especialista",
        description: "Tire suas dúvidas com nossos consultores especializados",
        action: "Conversar",
        route: "/especialista",
        priority: "low"
      });
    }
    
    return steps;
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
    <div style={{margin: '0px', padding: '0px'}}>
      {/* Layout Desktop: 2 colunas | Mobile: 1 coluna */}
      <div className="grid grid-cols-1 xl:grid-cols-3" style={{gap: '2px'}}>
        
        {/* Coluna Principal - Ferramentas */}
        <div className="xl:col-span-2" style={{margin: '0px', padding: '0px'}}>
          
          {/* Estatísticas Gerais */}
          {userStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4" style={{gap: '2px', marginBottom: '2px'}}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-600">Ferramentas</p>
                      <p className="text-xl font-bold text-blue-600">
                        {userStats.used_tools}/{userStats.total_tools}
                      </p>
                    </div>
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-600">Conclusão</p>
                      <p className="text-xl font-bold text-green-600">{userStats.completion_rate}%</p>
                    </div>
                    <Trophy className="h-6 w-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-600">Tempo</p>
                      <p className="text-xl font-bold text-purple-600">
                        {formatTime(userStats.total_usage_time)}
                      </p>
                    </div>
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-600">Favorita</p>
                      <p className="text-sm font-bold text-orange-600">{userStats.most_used_tool}</p>
                    </div>
                    <Target className="h-6 w-6 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Suas Ferramentas (Utilizadas) */}
          {usedTools.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Suas Ferramentas
                </h2>
                <Badge variant="secondary">{usedTools.length} ferramentas</Badge>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
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
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progresso</span>
                        <span>{tool.completion_percentage}%</span>
                      </div>
                      <Progress value={tool.completion_percentage} className="h-1" />
                    </div>

                    {/* Estatísticas */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
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
                      <div className="text-xs mb-2">
                        <p className="text-gray-600">Resultados gerados</p>
                        <p className="font-semibold text-green-600">{tool.results_generated}</p>
                      </div>
                    )}

                    {/* Botão de ação */}
                    <div className="pt-1">
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
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Explore Novas Ferramentas
                </h2>
                <Badge variant="outline">{unusedTools.length} disponíveis</Badge>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <CardContent className="p-3 text-center">
                    <div className={`p-2 rounded-lg inline-block mb-2 ${
                      !hasProfile ? 'bg-gray-100' : 'bg-gray-100'
                    }`}>
                      <IconComponent className={`h-5 w-5 ${
                        !hasProfile ? 'text-gray-400' : 'text-gray-600'
                      }`} />
                    </div>
                    <h3 className={`font-semibold mb-1 text-sm ${
                      !hasProfile ? 'text-gray-500' : 'text-gray-900'
                    }`}>{tool.tool_display_name}</h3>
                    <Badge variant="outline" className="mb-2 text-xs">
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

        </div>

        {/* Coluna Direita - Seções Complementares */}
        <div className="space-y-1">
          {/* Próximos Passos */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
            <h2 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-blue-600" />
              Próximos Passos
            </h2>
            
            <div className="space-y-2">
              {getNextSteps().map((step, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-white rounded-lg border border-blue-100">
                  <div className="flex-shrink-0 w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1 text-xs">{step.title}</h3>
                    <p className="text-xs text-gray-600 mb-1">{step.description}</p>
                    {step.action && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={step.action}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs h-7"
                      >
                        {step.actionText}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botão Criar Perfil - Condicional */}
          {!isProfileComplete && (
            <Card className="p-2 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    Complete seu perfil
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">
                    Desbloqueie funcionalidades personalizadas
                  </p>
                  <Button 
                    onClick={() => navigate('/create-profile')}
                    className="bg-green-600 hover:bg-green-700 text-xs h-7"
                    size="sm"
                  >
                    Completar Perfil
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalizedDashboard;
