import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  MessageSquare, 
  Users, 
  Clock, 
  Star, 
  ArrowRight, 
  FileText, 
  CheckCircle,
  AlertTriangle,
  Crown
} from 'lucide-react';
import SpecialistChat from './SpecialistChat';
import { useSpecialistChat } from '@/hooks/useSpecialistChat';
import { useUserContext } from '@/hooks/useUserContext';

interface ChatIntegrationProps {
  // Contexto do VisaMatch para transferir para o chat
  visaMatchResults?: {
    recommended_strategy: string;
    probability_score: number;
    analysis_summary: string;
    risk_factors: string[];
    opportunities: string[];
  };
  
  // Contexto do Criador de Sonhos
  dreamsContext?: {
    family_vision: string;
    transformation_scenarios: string[];
    timeline_phases: string[];
  };
  
  // Configurações do chat
  chatTopic?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  
  // Callbacks
  onChatStarted?: () => void;
  onChatCompleted?: () => void;
  
  className?: string;
}

export function ChatIntegration({
  visaMatchResults,
  dreamsContext,
  chatTopic,
  priority = 'medium',
  onChatStarted,
  onChatCompleted,
  className = ''
}: ChatIntegrationProps) {
  const { userContext } = useUserContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [chatMode, setChatMode] = useState<'quick' | 'detailed'>('quick');
  
  const {
    availableSpecialists,
    isLoadingSpecialists,
    chatState,
    startChat,
    error
  } = useSpecialistChat({
    topic: chatTopic || generateChatTopic(),
    priority,
    autoConnect: false
  });

  // Gerar tópico baseado no contexto disponível
  function generateChatTopic(): string {
    if (visaMatchResults) {
      return `Consulta sobre ${visaMatchResults.recommended_strategy}`;
    }
    
    if (dreamsContext) {
      return 'Orientação sobre plano de imigração familiar';
    }
    
    return 'Consulta geral sobre imigração';
  }

  // Determinar prioridade baseada no contexto
  function determinePriority(): 'low' | 'medium' | 'high' | 'urgent' {
    if (visaMatchResults) {
      if (visaMatchResults.probability_score < 30) return 'high';
      if (visaMatchResults.risk_factors.length > 3) return 'high';
      if (visaMatchResults.probability_score > 70) return 'medium';
    }
    
    return priority;
  }

  // Preparar contexto para transferir ao especialista
  function prepareSpecialistContext() {
    const context = {
      has_visamatch: !!visaMatchResults,
      has_dreams: !!dreamsContext,
      user_profile: userContext?.profile,
      immigration_goals: userContext?.immigration_goals
    };

    if (visaMatchResults) {
      context['visamatch_results'] = {
        strategy: visaMatchResults.recommended_strategy,
        probability: visaMatchResults.probability_score,
        summary: visaMatchResults.analysis_summary,
        risks: visaMatchResults.risk_factors,
        opportunities: visaMatchResults.opportunities
      };
    }

    if (dreamsContext) {
      context['dreams_context'] = {
        vision: dreamsContext.family_vision,
        scenarios: dreamsContext.transformation_scenarios,
        timeline: dreamsContext.timeline_phases
      };
    }

    return context;
  }

  const handleStartChat = async () => {
    try {
      await startChat();
      onChatStarted?.();
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Erro ao iniciar chat:', error);
    }
  };

  const handleChatCompleted = () => {
    onChatCompleted?.();
    setIsDialogOpen(false);
  };

  // Renderizar card de integração rápida
  const renderQuickChatCard = () => (
    <Card className={`${className} border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Fale com um Especialista</CardTitle>
              <CardDescription>
                Tire suas dúvidas com nossos consultores especializados
              </CardDescription>
            </div>
          </div>
          
          {availableSpecialists.length > 0 && (
            <Badge className="bg-green-100 text-green-800">
              <Users className="w-3 h-3 mr-1" />
              {availableSpecialists.length} online
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Contexto disponível */}
        {(visaMatchResults || dreamsContext) && (
          <div className="bg-white rounded-lg p-3 border">
            <h4 className="font-medium text-sm mb-2">Contexto disponível para consulta:</h4>
            <div className="flex flex-wrap gap-2">
              {visaMatchResults && (
                <Badge variant="outline" className="text-xs">
                  <FileText className="w-3 h-3 mr-1" />
                  Análise VisaMatch
                </Badge>
              )}
              {dreamsContext && (
                <Badge variant="outline" className="text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Plano Familiar
                </Badge>
              )}
              {userContext?.profile && (
                <Badge variant="outline" className="text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  Perfil Completo
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Especialistas em destaque */}
        {availableSpecialists.slice(0, 2).map(specialist => (
          <div key={specialist.specialist_id} className="flex items-center justify-between bg-white rounded-lg p-3 border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {specialist.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <div className="font-medium text-sm">{specialist.name}</div>
                <div className="text-xs text-gray-600">
                  {specialist.specialties.slice(0, 2).join(', ')}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center text-xs text-gray-600">
                <Clock className="w-3 h-3 mr-1" />
                ~{specialist.average_response_time}min
              </div>
              <div className="flex items-center mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-3 h-3 ${i < specialist.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Botões de ação */}
        <div className="flex space-x-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleStartChat}
                disabled={isLoadingSpecialists}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Iniciar Chat
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
              <DialogHeader className="sr-only">
                <DialogTitle>Chat com Especialista</DialogTitle>
                <DialogDescription>
                  Converse com nossos especialistas em imigração
                </DialogDescription>
              </DialogHeader>
              
              <SpecialistChat
                topic={generateChatTopic()}
                priority={determinePriority()}
                onClose={handleChatCompleted}
                className="border-0 shadow-none"
              />
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="sm">
            <Clock className="w-4 h-4 mr-1" />
            Agendar
          </Button>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Renderizar integração detalhada (para páginas de resultados)
  const renderDetailedIntegration = () => (
    <div className={`${className} space-y-4`}>
      {/* Header com call-to-action */}
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center">
                <Crown className="w-5 h-5 mr-2 text-amber-600" />
                Consultoria Especializada
              </CardTitle>
              <CardDescription className="text-base">
                Transforme sua análise em um plano de ação concreto
              </CardDescription>
            </div>
            
            <Button 
              size="lg"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleStartChat}
            >
              Falar Agora
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Benefícios da consultoria */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="font-semibold">Análise Personalizada</h3>
                <p className="text-sm text-gray-600">
                  Revisão detalhada dos seus resultados com especialista
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="font-semibold">Plano de Ação</h3>
                <p className="text-sm text-gray-600">
                  Cronograma detalhado com próximos passos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
              <div>
                <h3 className="font-semibold">Mitigação de Riscos</h3>
                <p className="text-sm text-gray-600">
                  Estratégias para superar obstáculos identificados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contexto específico para VisaMatch */}
      {visaMatchResults && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sua Análise VisaMatch</CardTitle>
            <CardDescription>
              Contexto que será compartilhado com o especialista
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Estratégia Recomendada:</span>
              <Badge className="bg-blue-100 text-blue-800">
                {visaMatchResults.recommended_strategy}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Probabilidade de Sucesso:</span>
              <Badge 
                className={
                  visaMatchResults.probability_score > 70 
                    ? 'bg-green-100 text-green-800'
                    : visaMatchResults.probability_score > 40
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }
              >
                {visaMatchResults.probability_score}%
              </Badge>
            </div>
            
            {visaMatchResults.risk_factors.length > 0 && (
              <div>
                <span className="font-medium">Principais Desafios:</span>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                  {visaMatchResults.risk_factors.slice(0, 3).map((risk, index) => (
                    <li key={index}>{risk}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  return chatMode === 'quick' ? renderQuickChatCard() : renderDetailedIntegration();
}

// Componente para integração na página do VisaMatch
export function VisaMatchChatIntegration({ 
  visaMatchResults, 
  className = '' 
}: { 
  visaMatchResults: any; 
  className?: string; 
}) {
  return (
    <ChatIntegration
      visaMatchResults={visaMatchResults}
      chatTopic={`Consultoria sobre ${visaMatchResults?.recommended_strategy || 'estratégia de visto'}`}
      priority={visaMatchResults?.probability_score < 50 ? 'high' : 'medium'}
      className={className}
    />
  );
}

// Componente para integração na página do Criador de Sonhos
export function DreamsChatIntegration({ 
  dreamsContext, 
  className = '' 
}: { 
  dreamsContext: any; 
  className?: string; 
}) {
  return (
    <ChatIntegration
      dreamsContext={dreamsContext}
      chatTopic="Orientação sobre plano familiar de imigração"
      priority="medium"
      className={className}
    />
  );
}

export default ChatIntegration;
