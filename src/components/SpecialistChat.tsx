import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Star,
  Phone,
  Video,
  Paperclip,
  MoreVertical,
  Crown,
  Loader2
} from 'lucide-react';
import { 
  specialistChatService, 
  ChatMessage, 
  ChatSession, 
  SpecialistAvailability, 
  QueuePosition 
} from '@/services/specialistChatService';
import { useUserContext } from '@/hooks/useUserContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SpecialistChatProps {
  topic?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  onClose?: () => void;
  className?: string;
}

type ChatState = 'idle' | 'connecting' | 'waiting' | 'active' | 'completed' | 'error';

export function SpecialistChat({ 
  topic = 'Consulta geral',
  priority = 'medium',
  onClose,
  className = ''
}: SpecialistChatProps) {
  const { userContext } = useUserContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Estado principal
  const [chatState, setChatState] = useState<ChatState>('idle');
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [queuePosition, setQueuePosition] = useState<QueuePosition | null>(null);
  const [availableSpecialists, setAvailableSpecialists] = useState<SpecialistAvailability[]>([]);
  
  // Estado da interface
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  
  // Carregar especialistas disponíveis
  useEffect(() => {
    loadAvailableSpecialists();
  }, []);

  // Configurar handlers de mensagem
  useEffect(() => {
    const handleMessage = (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    };

    const handleStatusChange = (status: string) => {
      setChatState(status as ChatState);
    };

    specialistChatService.onMessage(handleMessage);
    specialistChatService.onStatusChange(handleStatusChange);

    return () => {
      specialistChatService.removeMessageHandler(handleMessage);
      specialistChatService.removeStatusHandler(handleStatusChange);
    };
  }, []);

  // Auto-scroll para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAvailableSpecialists = async () => {
    try {
      const specialists = await specialistChatService.getAvailableSpecialists();
      setAvailableSpecialists(specialists);
    } catch (error) {
      console.error('Erro ao carregar especialistas:', error);
    }
  };

  const startChat = async () => {
    if (!userContext?.user_id) {
      setError('Usuário não autenticado');
      return;
    }

    try {
      setChatState('connecting');
      setError(null);

      const { session, queuePosition: position } = await specialistChatService.startChatSession(
        userContext.user_id,
        topic,
        priority
      );

      setCurrentSession(session);
      setQueuePosition(position);
      setChatState('waiting');

      // Carregar mensagens existentes se houver
      const existingMessages = await specialistChatService.getSessionMessages(session.id);
      setMessages(existingMessages);

    } catch (error) {
      console.error('Erro ao iniciar chat:', error);
      setError('Falha ao conectar com especialista');
      setChatState('error');
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !currentSession) return;

    try {
      const message = await specialistChatService.sendMessage(
        currentSession.id,
        messageInput.trim()
      );

      setMessageInput('');
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setError('Falha ao enviar mensagem');
    }
  };

  const endChat = async () => {
    if (!currentSession) return;

    try {
      await specialistChatService.endChatSession(
        currentSession.id,
        rating > 0 ? rating : undefined,
        feedback.trim() || undefined
      );

      setChatState('completed');
    } catch (error) {
      console.error('Erro ao finalizar chat:', error);
      setError('Erro ao finalizar sessão');
    }
  };

  const cancelChat = async () => {
    if (!currentSession) return;

    try {
      await specialistChatService.cancelChatSession(currentSession.id);
      setChatState('idle');
      setCurrentSession(null);
      setMessages([]);
      setQueuePosition(null);
    } catch (error) {
      console.error('Erro ao cancelar chat:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Renderizar diferentes estados
  const renderIdleState = () => (
    <Card className={`${className} max-w-2xl mx-auto`}>
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <CardTitle className="text-2xl">Chat com Especialista</CardTitle>
        <CardDescription>
          Conecte-se com nossos especialistas em imigração para orientação personalizada
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Especialistas disponíveis */}
        {availableSpecialists.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Especialistas Disponíveis</h3>
            <div className="grid gap-3">
              {availableSpecialists.slice(0, 3).map(specialist => (
                <div key={specialist.specialist_id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Avatar>
                    <AvatarImage src={`/avatars/${specialist.specialist_id}.jpg`} />
                    <AvatarFallback>{specialist.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{specialist.name}</span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 ${i < specialist.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {specialist.specialties.join(', ')}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant={specialist.status === 'available' ? 'default' : 'secondary'}>
                      {specialist.status === 'available' ? 'Disponível' : 'Ocupado'}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      ~{specialist.average_response_time}min resposta
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botão para iniciar chat */}
        <div className="text-center">
          <Button 
            onClick={startChat}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Iniciar Conversa
          </Button>
          
          <p className="text-sm text-gray-600 mt-2">
            Tempo médio de espera: 2-5 minutos
          </p>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderWaitingState = () => (
    <Card className={`${className} max-w-2xl mx-auto`}>
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-amber-100 rounded-full">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
        </div>
        <CardTitle>Aguardando Especialista</CardTitle>
        <CardDescription>
          Você está na fila. Um especialista se conectará em breve.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {queuePosition && (
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold text-amber-600">
              Posição {queuePosition.position}
            </div>
            <div className="text-sm text-gray-600">
              {queuePosition.ahead_of_you} pessoas à sua frente
            </div>
            <div className="text-sm text-gray-600">
              Tempo estimado: {queuePosition.estimated_wait_time} minutos
            </div>
          </div>
        )}

        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Conectando...</span>
        </div>

        <div className="flex justify-center space-x-2">
          <Button variant="outline" onClick={cancelChat}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderActiveChat = () => (
    <Card className={`${className} max-w-4xl mx-auto h-[600px] flex flex-col`}>
      {/* Header do chat */}
      <CardHeader className="border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback>ES</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">Especialista Conectado</CardTitle>
              <CardDescription>
                {currentSession?.specialist_id ? 'Ativo' : 'Conectando...'}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Online
            </Badge>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Área de mensagens */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={message.id || index}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.sender === 'specialist'
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              <div className="text-sm">{message.content}</div>
              <div className={`text-xs mt-1 ${
                message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
              }`}>
                {formatDistanceToNow(new Date(message.timestamp), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input de mensagem */}
      <div className="border-t p-4 flex-shrink-0">
        <div className="flex space-x-2">
          <Textarea
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1 min-h-[40px] max-h-[120px]"
            rows={1}
          />
          <div className="flex flex-col space-y-1">
            <Button 
              onClick={sendMessage}
              disabled={!messageInput.trim()}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Paperclip className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-2">
          <div className="text-xs text-gray-500">
            Pressione Enter para enviar, Shift+Enter para nova linha
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={endChat}
            className="text-red-600 hover:text-red-700"
          >
            Finalizar Chat
          </Button>
        </div>
      </div>
    </Card>
  );

  const renderCompletedState = () => (
    <Card className={`${className} max-w-2xl mx-auto`}>
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-green-100 rounded-full">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <CardTitle>Chat Finalizado</CardTitle>
        <CardDescription>
          Obrigado por usar nosso serviço de chat especializado
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Avaliação */}
        <div>
          <h3 className="font-semibold mb-2">Como foi sua experiência?</h3>
          <div className="flex justify-center space-x-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="focus:outline-none"
              >
                <Star 
                  className={`w-6 h-6 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                />
              </button>
            ))}
          </div>
          
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Deixe seu feedback (opcional)"
            className="w-full"
            rows={3}
          />
        </div>

        <div className="flex justify-center space-x-2">
          <Button onClick={() => setChatState('idle')}>
            Novo Chat
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Renderizar baseado no estado
  switch (chatState) {
    case 'idle':
      return renderIdleState();
    case 'connecting':
    case 'waiting':
      return renderWaitingState();
    case 'active':
      return renderActiveChat();
    case 'completed':
      return renderCompletedState();
    case 'error':
      return renderIdleState(); // Mostra tela inicial com erro
    default:
      return renderIdleState();
  }
}

export default SpecialistChat;
