import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  Clock, 
  Star, 
  FileText, 
  MessageSquare, 
  Target,
  Trophy,
  AlertCircle,
  ChevronRight,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useUnifiedFlow, useFlowNavigation } from '@/hooks/useUnifiedFlow';
import { FlowStep } from '@/services/unifiedFlowService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UnifiedFlowNavigationProps {
  variant?: 'full' | 'compact' | 'sidebar';
  showProgress?: boolean;
  showRecommendations?: boolean;
  showAnalytics?: boolean;
  className?: string;
}

export function UnifiedFlowNavigation({
  variant = 'full',
  showProgress = true,
  showRecommendations = true,
  showAnalytics = false,
  className = ''
}: UnifiedFlowNavigationProps) {
  const {
    flowProgress,
    currentStep,
    completedSteps,
    completionPercentage,
    estimatedTimeRemaining,
    isLoading,
    error,
    clearError,
    resetFlow
  } = useUnifiedFlow();

  const { navigateWithFlow } = useFlowNavigation();
  const [recommendations, setRecommendations] = useState<any>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  // Configuração dos passos do fluxo
  const flowSteps: Array<{
    step: FlowStep;
    title: string;
    description: string;
    icon: React.ReactNode;
    route: string;
    estimatedTime: number;
  }> = [
    {
      step: 'dreams_start',
      title: 'Criador de Sonhos',
      description: 'Defina sua visão familiar',
      icon: <Star className="w-5 h-5" />,
      route: '/dreams',
      estimatedTime: 15
    },
    {
      step: 'pdf_generation',
      title: 'Relatório PDF',
      description: 'Gere seu plano visual',
      icon: <FileText className="w-5 h-5" />,
      route: '/dreams/pdf',
      estimatedTime: 5
    },
    {
      step: 'visamatch_analysis',
      title: 'VisaMatch',
      description: 'Análise de estratégias',
      icon: <Target className="w-5 h-5" />,
      route: '/visamatch',
      estimatedTime: 10
    },
    {
      step: 'specialist_consultation',
      title: 'Chat Especialista',
      description: 'Consultoria personalizada',
      icon: <MessageSquare className="w-5 h-5" />,
      route: '/especialista',
      estimatedTime: 20
    },
    {
      step: 'action_plan_creation',
      title: 'Plano de Ação',
      description: 'Cronograma detalhado',
      icon: <CheckCircle className="w-5 h-5" />,
      route: '/dashboard/action-plan',
      estimatedTime: 5
    },
    {
      step: 'journey_completed',
      title: 'Jornada Completa',
      description: 'Parabéns!',
      icon: <Trophy className="w-5 h-5" />,
      route: '/dashboard/completed',
      estimatedTime: 0
    }
  ];

  const loadRecommendations = async () => {
    setIsLoadingRecommendations(true);
    try {
      // Implementar carregamento de recomendações
      // const recs = await getNextRecommendedActions();
      // setRecommendations(recs);
    } catch (error) {
      console.error('Erro ao carregar recomendações:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const handleStepClick = async (step: FlowStep, route: string) => {
    const result = await navigateWithFlow(route);
    if (!result.success) {
      // Mostrar erro ou sugestões
      console.error(result.message);
    }
  };

  const getStepStatus = (step: FlowStep): 'completed' | 'current' | 'locked' | 'available' => {
    if (completedSteps.includes(step)) return 'completed';
    if (currentStep === step) return 'current';
    
    // Verificar se o passo está acessível baseado na sequência
    const stepIndex = flowSteps.findIndex(s => s.step === step);
    const currentIndex = flowSteps.findIndex(s => s.step === currentStep);
    
    if (stepIndex <= currentIndex + 1) return 'available';
    return 'locked';
  };

  const renderCompactView = () => (
    <Card className={`${className} border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Progress value={completionPercentage} className="w-20 h-2" />
              <span className="absolute -top-6 left-0 text-xs font-medium text-blue-600">
                {completionPercentage}%
              </span>
            </div>
            
            <div>
              <h3 className="font-semibold text-sm">
                {flowSteps.find(s => s.step === currentStep)?.title}
              </h3>
              <p className="text-xs text-gray-600">
                {estimatedTimeRemaining}min restantes
              </p>
            </div>
          </div>
          
          <Button 
            size="sm"
            onClick={() => {
              const currentStepData = flowSteps.find(s => s.step === currentStep);
              if (currentStepData) {
                handleStepClick(currentStep, currentStepData.route);
              }
            }}
          >
            Continuar
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderSidebarView = () => (
    <Card className={`${className} w-64`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-blue-600" />
          Sua Jornada
        </CardTitle>
        <div className="space-y-2">
          <Progress value={completionPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-600">
            <span>{completedSteps.length} de {flowSteps.length} concluídos</span>
            <span>{completionPercentage}%</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {flowSteps.map((stepData, index) => {
          const status = getStepStatus(stepData.step);
          const isClickable = status === 'current' || status === 'completed' || status === 'available';
          
          return (
            <div
              key={stepData.step}
              className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                isClickable 
                  ? 'hover:bg-gray-50' 
                  : 'opacity-50 cursor-not-allowed'
              } ${
                status === 'current' ? 'bg-blue-50 border border-blue-200' : ''
              }`}
              onClick={() => isClickable && handleStepClick(stepData.step, stepData.route)}
            >
              <div className="flex-shrink-0">
                {status === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : status === 'current' ? (
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <Play className="w-3 h-3 text-white" />
                  </div>
                ) : status === 'available' ? (
                  <Circle className="w-5 h-5 text-gray-400" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {stepData.title}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {stepData.description}
                </div>
              </div>
              
              {status === 'current' && (
                <ChevronRight className="w-4 h-4 text-blue-600" />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );

  const renderFullView = () => (
    <div className={`${className} space-y-6`}>
      {/* Header com progresso geral */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center">
                <Trophy className="w-6 h-6 mr-2 text-blue-600" />
                Sua Jornada LifeWay
              </CardTitle>
              <CardDescription className="text-base">
                Transformando sonhos em realidade americana
              </CardDescription>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                {completionPercentage}%
              </div>
              <div className="text-sm text-gray-600">
                {estimatedTimeRemaining}min restantes
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <Progress value={completionPercentage} className="h-3" />
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>{completedSteps.length} de {flowSteps.length} etapas concluídas</span>
              <span>
                {flowProgress && formatDistanceToNow(
                  new Date(flowProgress.flow_metadata.started_at), 
                  { addSuffix: true, locale: ptBR }
                )}
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grid de passos */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flowSteps.map((stepData, index) => {
          const status = getStepStatus(stepData.step);
          const isClickable = status === 'current' || status === 'completed' || status === 'available';
          
          return (
            <Card
              key={stepData.step}
              className={`cursor-pointer transition-all duration-200 ${
                isClickable 
                  ? 'hover:shadow-lg hover:scale-105' 
                  : 'opacity-50 cursor-not-allowed'
              } ${
                status === 'current' 
                  ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' 
                  : status === 'completed'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200'
              }`}
              onClick={() => isClickable && handleStepClick(stepData.step, stepData.route)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      status === 'completed' 
                        ? 'bg-green-100' 
                        : status === 'current'
                        ? 'bg-blue-100'
                        : 'bg-gray-100'
                    }`}>
                      {status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        stepData.icon
                      )}
                    </div>
                    
                    <div>
                      <CardTitle className="text-lg">{stepData.title}</CardTitle>
                      <CardDescription>{stepData.description}</CardDescription>
                    </div>
                  </div>
                  
                  <Badge 
                    variant={
                      status === 'completed' ? 'default' :
                      status === 'current' ? 'secondary' :
                      status === 'available' ? 'outline' : 'secondary'
                    }
                    className={
                      status === 'completed' ? 'bg-green-100 text-green-800' :
                      status === 'current' ? 'bg-blue-100 text-blue-800' :
                      ''
                    }
                  >
                    {status === 'completed' ? 'Concluído' :
                     status === 'current' ? 'Atual' :
                     status === 'available' ? 'Disponível' : 'Bloqueado'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {stepData.estimatedTime}min
                  </span>
                  
                  {status === 'current' && (
                    <span className="flex items-center text-blue-600 font-medium">
                      Continuar
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recomendações e ações */}
      {showRecommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Próximos Passos Recomendados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Passo Atual:</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {flowSteps.find(s => s.step === currentStep)?.title}
                </Badge>
              </div>
              
              <div className="text-sm text-gray-600">
                Continue sua jornada completando o passo atual e desbloqueando novas funcionalidades.
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={() => {
                    const currentStepData = flowSteps.find(s => s.step === currentStep);
                    if (currentStepData) {
                      handleStepClick(currentStep, currentStepData.route);
                    }
                  }}
                >
                  Continuar Jornada
                </Button>
                
                <Button variant="outline" onClick={loadRecommendations}>
                  Ver Detalhes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics (opcional) */}
      {showAnalytics && flowProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estatísticas da Jornada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.floor((new Date().getTime() - new Date(flowProgress.flow_metadata.started_at).getTime()) / (1000 * 60))}
                </div>
                <div className="text-sm text-gray-600">Minutos gastos</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {completedSteps.length}
                </div>
                <div className="text-sm text-gray-600">Etapas concluídas</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {estimatedTimeRemaining}
                </div>
                <div className="text-sm text-gray-600">Min. restantes</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {completionPercentage}%
                </div>
                <div className="text-sm text-gray-600">Progresso</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controles de fluxo */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Precisa de ajuda ou quer recomeçar?
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <MessageSquare className="w-4 h-4 mr-1" />
                Ajuda
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetFlow}
                className="text-red-600 hover:text-red-700"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reiniciar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Erro */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {error}
            <Button 
              variant="link" 
              size="sm" 
              onClick={clearError}
              className="ml-2 text-red-600 p-0 h-auto"
            >
              Dispensar
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando sua jornada...</p>
        </CardContent>
      </Card>
    );
  }

  // Renderizar baseado na variante
  switch (variant) {
    case 'compact':
      return renderCompactView();
    case 'sidebar':
      return renderSidebarView();
    case 'full':
    default:
      return renderFullView();
  }
}

export default UnifiedFlowNavigation;
