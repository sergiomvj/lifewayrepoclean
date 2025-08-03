import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Target, 
  TrendingUp, 
  Brain, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Download,
  Eye,
  Settings
} from 'lucide-react';
import { useUserContext, useAIContext } from '@/hooks/useUserContext';
import { UserContext, ContextValidation } from '@/types/userContext';

interface UserContextManagerProps {
  userId?: string;
  showAIIntegration?: boolean;
  compact?: boolean;
}

export function UserContextManager({ 
  userId, 
  showAIIntegration = true, 
  compact = false 
}: UserContextManagerProps) {
  const {
    context,
    contextResponse,
    isLoading,
    error,
    hasContext,
    isUpdating,
    createContext,
    validateContext,
    completenessScore,
    keyPoints,
    recommendations,
    missingData,
    refetch
  } = useUserContext(userId);

  const {
    aiContext,
    validation,
    analytics,
    generateAIContext,
    validateForAI,
    getAIAnalytics,
    isReady,
    needsValidation
  } = useAIContext(userId);

  const [activeTab, setActiveTab] = useState('overview');
  const [showAIContext, setShowAIContext] = useState(false);

  // Initialize context if it doesn't exist (only for authenticated users)
  useEffect(() => {
    if (!isLoading && !hasContext && !error && userId) {
      createContext({
        profile: {
          id: '',
          name: '',
          profession: '',
          education_level: 'bachelor',
          english_level: 'intermediate',
          current_country: 'Brazil',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        immigration_goals: {
          primary_objective: '',
          category: 'trabalho',
          timeline: '',
          priority: 'media',
          motivation: ''
        }
      });
    }
  }, [isLoading, hasContext, error, createContext, userId]);

  // Generate AI context when component mounts
  useEffect(() => {
    if (hasContext && showAIIntegration && !aiContext) {
      generateAIContext('dashboard_view');
    }
  }, [hasContext, showAIIntegration, aiContext, generateAIContext]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Carregando contexto do usuário...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar contexto: {error instanceof Error ? error.message : 'Erro desconhecido'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => refetch()} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!hasContext) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Contexto não encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Vamos criar seu perfil personalizado para melhor atendimento.
            </p>
            <Button onClick={() => createContext()} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Perfil'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getCompletenessColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletenessLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Regular';
    return 'Incompleto';
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Contexto do Usuário</CardTitle>
            <Badge variant={completenessScore >= 70 ? 'default' : 'secondary'}>
              {completenessScore}% completo
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={completenessScore} className="mb-4" />
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <User className="h-4 w-4 mr-2" />
              <span>{context?.profile.name || 'Nome não informado'}</span>
            </div>
            <div className="flex items-center text-sm">
              <Target className="h-4 w-4 mr-2" />
              <span>{context?.immigration_goals.primary_objective || 'Objetivo não definido'}</span>
            </div>
          </div>
          {recommendations.length > 0 && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {recommendations[0]}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completude do Perfil</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              <span className={getCompletenessColor(completenessScore)}>
                {completenessScore}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {getCompletenessLabel(completenessScore)}
            </p>
            <Progress value={completenessScore} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso Geral</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {context?.progress_tracking.overall_progress_percentage || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {context?.progress_tracking.current_phase || 'Fase inicial'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IA Insights</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {context?.ai_insights.confidence_score || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Confiança da análise
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Contexto</CardTitle>
          <CardDescription>
            Visualize e gerencie as informações do seu perfil para melhor atendimento da IA especialista
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="validation">Validação</TabsTrigger>
              {showAIIntegration && <TabsTrigger value="ai">IA Integration</TabsTrigger>}
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Pontos-Chave</h4>
                  <ul className="space-y-1">
                    {keyPoints.map((point, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Recomendações</h4>
                  <ul className="space-y-1">
                    {recommendations.map((rec, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Target className="h-3 w-3 mr-2 text-blue-500" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {missingData.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Dados em falta:</strong> {missingData.join(', ')}
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="validation" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Status de Validação</h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => validateForAI()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Revalidar
                </Button>
              </div>

              {validation && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    {validation.is_valid ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium">
                      {validation.is_valid ? 'Contexto válido' : 'Contexto com problemas'}
                    </span>
                    <Badge variant={validation.is_valid ? 'default' : 'destructive'}>
                      {validation.completeness_score}% completo
                    </Badge>
                  </div>

                  {validation.errors.length > 0 && (
                    <div>
                      <h5 className="font-medium text-red-600 mb-2">Erros:</h5>
                      <ul className="space-y-1">
                        {validation.errors.map((error, index) => (
                          <li key={index} className="text-sm text-red-600">
                            • {error.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {validation.warnings.length > 0 && (
                    <div>
                      <h5 className="font-medium text-yellow-600 mb-2">Avisos:</h5>
                      <ul className="space-y-1">
                        {validation.warnings.map((warning, index) => (
                          <li key={index} className="text-sm text-yellow-600">
                            • {warning.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {validation.suggested_improvements.length > 0 && (
                    <div>
                      <h5 className="font-medium text-blue-600 mb-2">Melhorias Sugeridas:</h5>
                      <ul className="space-y-1">
                        {validation.suggested_improvements.map((improvement, index) => (
                          <li key={index} className="text-sm text-blue-600">
                            • {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {showAIIntegration && (
              <TabsContent value="ai" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Contexto para IA Especialista</h4>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowAIContext(!showAIContext)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {showAIContext ? 'Ocultar' : 'Visualizar'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => generateAIContext('specialist_chat')}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerar
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Badge variant={isReady ? 'default' : 'secondary'} className="mb-2">
                      {isReady ? 'Pronto para IA' : 'Preparando...'}
                    </Badge>
                    {needsValidation && (
                      <Badge variant="destructive" className="ml-2">
                        Precisa validação
                      </Badge>
                    )}
                  </div>
                </div>

                {showAIContext && aiContext && (
                  <div className="mt-4">
                    <h5 className="font-medium mb-2">Contexto JSON para IA:</h5>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
                      {aiContext}
                    </pre>
                  </div>
                )}
              </TabsContent>
            )}

            <TabsContent value="analytics" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Analytics e Insights</h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => getAIAnalytics()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>

              {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Métricas de Engajamento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Score de Engajamento:</span>
                        <Badge>{analytics.engagementScore}%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Velocidade de Progresso:</span>
                        <Badge>{analytics.progressVelocity.toFixed(1)}%/dia</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Comparação</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Melhor que:</span>
                        <Badge>{analytics.benchmarkComparison.betterThan}% dos usuários</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Tempo estimado:</span>
                        <Badge variant="outline">{analytics.benchmarkComparison.timeToCompletion}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {analytics?.riskFactors.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Fatores de Risco:</strong> {analytics.riskFactors.join(', ')}
                  </AlertDescription>
                </Alert>
              )}

              {analytics?.successIndicators.length > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Indicadores de Sucesso:</strong> {analytics.successIndicators.join(', ')}
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default UserContextManager;
