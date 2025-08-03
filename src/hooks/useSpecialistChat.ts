import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  specialistChatService, 
  ChatMessage, 
  ChatSession, 
  SpecialistAvailability, 
  QueuePosition 
} from '@/services/specialistChatService';
import { useUserContext } from './useUserContext';

interface UseSpecialistChatOptions {
  topic?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  autoConnect?: boolean;
}

interface UseSpecialistChatReturn {
  // Estado do chat
  chatState: 'idle' | 'connecting' | 'waiting' | 'active' | 'completed' | 'error';
  currentSession: ChatSession | null;
  messages: ChatMessage[];
  queuePosition: QueuePosition | null;
  
  // Especialistas
  availableSpecialists: SpecialistAvailability[];
  isLoadingSpecialists: boolean;
  
  // Ações
  startChat: () => Promise<void>;
  sendMessage: (content: string, metadata?: ChatMessage['metadata']) => Promise<void>;
  endChat: (rating?: number, feedback?: string) => Promise<void>;
  cancelChat: () => Promise<void>;
  
  // Estado da UI
  isConnecting: boolean;
  isTyping: boolean;
  error: string | null;
  
  // Utilitários
  clearError: () => void;
  refreshSpecialists: () => void;
}

export function useSpecialistChat(options: UseSpecialistChatOptions = {}): UseSpecialistChatReturn {
  const { 
    topic = 'Consulta geral',
    priority = 'medium',
    autoConnect = false
  } = options;
  
  const { userContext } = useUserContext();
  const queryClient = useQueryClient();
  
  // Estados locais
  const [chatState, setChatState] = useState<'idle' | 'connecting' | 'waiting' | 'active' | 'completed' | 'error'>('idle');
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [queuePosition, setQueuePosition] = useState<QueuePosition | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Query para especialistas disponíveis
  const {
    data: availableSpecialists = [],
    isLoading: isLoadingSpecialists,
    refetch: refreshSpecialists
  } = useQuery({
    queryKey: ['specialists', 'available'],
    queryFn: () => specialistChatService.getAvailableSpecialists(),
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    staleTime: 15000 // Considerar dados obsoletos após 15 segundos
  });

  // Mutation para iniciar chat
  const startChatMutation = useMutation({
    mutationFn: async () => {
      if (!userContext?.user_id) {
        throw new Error('Usuário não autenticado');
      }
      
      return specialistChatService.startChatSession(
        userContext.user_id,
        topic,
        priority
      );
    },
    onMutate: () => {
      setChatState('connecting');
      setError(null);
    },
    onSuccess: ({ session, queuePosition: position }) => {
      setCurrentSession(session);
      setQueuePosition(position);
      setChatState('waiting');
      
      // Carregar mensagens existentes
      loadSessionMessages(session.id);
    },
    onError: (error: Error) => {
      console.error('Erro ao iniciar chat:', error);
      setError(error.message || 'Falha ao conectar com especialista');
      setChatState('error');
    }
  });

  // Mutation para enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, metadata }: { content: string; metadata?: ChatMessage['metadata'] }) => {
      if (!currentSession) {
        throw new Error('Sessão não encontrada');
      }
      
      return specialistChatService.sendMessage(currentSession.id, content, metadata);
    },
    onSuccess: (message) => {
      setMessages(prev => [...prev, message]);
      
      // Invalidar cache de mensagens
      queryClient.invalidateQueries({
        queryKey: ['chat-messages', currentSession?.id]
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao enviar mensagem:', error);
      setError('Falha ao enviar mensagem');
    }
  });

  // Mutation para finalizar chat
  const endChatMutation = useMutation({
    mutationFn: async ({ rating, feedback }: { rating?: number; feedback?: string }) => {
      if (!currentSession) {
        throw new Error('Sessão não encontrada');
      }
      
      return specialistChatService.endChatSession(currentSession.id, rating, feedback);
    },
    onSuccess: () => {
      setChatState('completed');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: ['chat-sessions']
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao finalizar chat:', error);
      setError('Erro ao finalizar sessão');
    }
  });

  // Mutation para cancelar chat
  const cancelChatMutation = useMutation({
    mutationFn: async () => {
      if (!currentSession) {
        throw new Error('Sessão não encontrada');
      }
      
      return specialistChatService.cancelChatSession(currentSession.id);
    },
    onSuccess: () => {
      resetChatState();
    },
    onError: (error: Error) => {
      console.error('Erro ao cancelar chat:', error);
      setError('Erro ao cancelar sessão');
    }
  });

  // Carregar mensagens da sessão
  const loadSessionMessages = useCallback(async (sessionId: string) => {
    try {
      const sessionMessages = await specialistChatService.getSessionMessages(sessionId);
      setMessages(sessionMessages);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  }, []);

  // Resetar estado do chat
  const resetChatState = useCallback(() => {
    setChatState('idle');
    setCurrentSession(null);
    setMessages([]);
    setQueuePosition(null);
    setError(null);
  }, []);

  // Configurar handlers de eventos do serviço
  useEffect(() => {
    const handleMessage = (message: ChatMessage) => {
      setMessages(prev => {
        // Evitar duplicatas
        const exists = prev.some(m => m.id === message.id);
        if (exists) return prev;
        
        return [...prev, message];
      });
    };

    const handleStatusChange = (status: string) => {
      setChatState(status as any);
      
      // Se o chat ficou ativo, atualizar sessão
      if (status === 'active' && currentSession) {
        setCurrentSession(prev => prev ? {
          ...prev,
          status: 'active',
          started_at: new Date().toISOString()
        } : null);
      }
    };

    const handleTypingIndicator = (isTyping: boolean) => {
      setIsTyping(isTyping);
    };

    // Registrar handlers
    specialistChatService.onMessage(handleMessage);
    specialistChatService.onStatusChange(handleStatusChange);

    return () => {
      // Limpar handlers
      specialistChatService.removeMessageHandler(handleMessage);
      specialistChatService.removeStatusHandler(handleStatusChange);
    };
  }, [currentSession]);

  // Auto-conectar se solicitado
  useEffect(() => {
    if (autoConnect && chatState === 'idle' && userContext?.user_id) {
      startChatMutation.mutate();
    }
  }, [autoConnect, chatState, userContext?.user_id]);

  // Monitorar posição na fila
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (chatState === 'waiting' && currentSession) {
      interval = setInterval(async () => {
        try {
          const position = await specialistChatService.getQueuePosition(currentSession.id);
          setQueuePosition(position);
        } catch (error) {
          console.error('Erro ao verificar posição na fila:', error);
        }
      }, 10000); // Verificar a cada 10 segundos
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [chatState, currentSession]);

  // Limpar recursos ao desmontar
  useEffect(() => {
    return () => {
      if (currentSession && (chatState === 'waiting' || chatState === 'active')) {
        // Cancelar sessão ativa ao sair
        specialistChatService.cancelChatSession(currentSession.id).catch(console.error);
      }
    };
  }, []);

  // Ações expostas
  const startChat = useCallback(async () => {
    await startChatMutation.mutateAsync();
  }, [startChatMutation]);

  const sendMessage = useCallback(async (content: string, metadata?: ChatMessage['metadata']) => {
    await sendMessageMutation.mutateAsync({ content, metadata });
  }, [sendMessageMutation]);

  const endChat = useCallback(async (rating?: number, feedback?: string) => {
    await endChatMutation.mutateAsync({ rating, feedback });
  }, [endChatMutation]);

  const cancelChat = useCallback(async () => {
    await cancelChatMutation.mutateAsync();
  }, [cancelChatMutation]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estado do chat
    chatState,
    currentSession,
    messages,
    queuePosition,
    
    // Especialistas
    availableSpecialists,
    isLoadingSpecialists,
    
    // Ações
    startChat,
    sendMessage,
    endChat,
    cancelChat,
    
    // Estado da UI
    isConnecting: startChatMutation.isPending,
    isTyping,
    error,
    
    // Utilitários
    clearError,
    refreshSpecialists: () => refreshSpecialists()
  };
}

// Hook para histórico de sessões do usuário
export function useChatHistory(userId?: string) {
  return useQuery({
    queryKey: ['chat-sessions', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // Implementar busca de histórico no Supabase
      // Por enquanto retorna array vazio
      return [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000 // 5 minutos
  });
}

// Hook para estatísticas do chat
export function useChatStats(userId?: string) {
  return useQuery({
    queryKey: ['chat-stats', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      // Implementar busca de estatísticas
      return {
        total_sessions: 0,
        total_messages: 0,
        average_rating: 0,
        total_duration_minutes: 0,
        last_session_date: null
      };
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000 // 10 minutos
  });
}
