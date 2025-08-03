import { io, Socket } from 'socket.io-client';
import { contextService, SpecialistContextData } from './contextService';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  session_id: string;
  sender_id: string;                              // ✅ ADICIONADO: sender_id obrigatório
  sender: 'user' | 'specialist' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    type?: 'text' | 'file' | 'link' | 'suggestion';
    attachments?: string[];
    suggestions?: string[];
  };
}

interface ChatSession {
  id: string;
  user_id: string;
  specialist_id?: string;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  topic: string;
  context_data: SpecialistContextData;
  created_at: string;
  started_at?: string;
  ended_at?: string;
  duration_minutes?: number;
  satisfaction_rating?: number;
  user_feedback?: string;
  specialist_notes?: string;
}

interface SpecialistAvailability {
  specialist_id: string;
  name: string;
  specialties: string[];
  status: 'available' | 'busy' | 'offline';
  current_queue_size: number;
  average_response_time: number;
  rating: number;
  languages: string[];
}

interface QueuePosition {
  position: number;
  estimated_wait_time: number;
  ahead_of_you: number;
}

class SpecialistChatService {
  private socket: Socket | null = null;
  private currentSession: ChatSession | null = null;
  private messageHandlers: ((message: ChatMessage) => void)[] = [];
  private statusHandlers: ((status: string) => void)[] = [];

  constructor() {
    this.initializeSocket();
  }

  /**
   * Inicializa conexão WebSocket
   */
  private initializeSocket() {
    // Corrigir para Vite (import.meta.env) e adicionar fallback seguro
    const websocketUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3001';
    
    this.socket = io(websocketUrl, {
      transports: ['websocket'],
      autoConnect: false
    });

    this.socket.on('connect', () => {
      console.log('Conectado ao servidor de chat');
    });

    this.socket.on('message', (message: ChatMessage) => {
      this.messageHandlers.forEach(handler => handler(message));
    });

    this.socket.on('session_status', (status: string) => {
      this.statusHandlers.forEach(handler => handler(status));
    });

    this.socket.on('specialist_joined', (specialistData: any) => {
      if (this.currentSession) {
        this.currentSession.specialist_id = specialistData.id;
        this.currentSession.status = 'active';
        this.currentSession.started_at = new Date().toISOString();
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado do servidor de chat');
    });
  }

  /**
   * Inicia uma nova sessão de chat
   */
  async startChatSession(
    userId: string, 
    topic: string = 'Consulta geral',
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<{ session: ChatSession; queuePosition: QueuePosition }> {
    try {
      // Preparar contexto do usuário
      const contextData = await contextService.createSpecialistContext(userId);
      
      // Criar sessão no banco de dados
      const { data: sessionData, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          status: 'waiting',
          priority,
          topic,
          context_data: contextData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      this.currentSession = sessionData;

      // Conectar ao WebSocket
      if (!this.socket?.connected) {
        this.socket?.connect();
      }

      // Entrar na fila
      const queuePosition = await this.joinQueue(sessionData.id, priority);

      // Notificar especialistas disponíveis
      await this.notifyAvailableSpecialists(contextData, priority);

      return {
        session: sessionData,
        queuePosition
      };
    } catch (error) {
      console.error('Erro ao iniciar sessão de chat:', error);
      throw new Error('Falha ao iniciar chat com especialista');
    }
  }

  /**
   * Envia mensagem no chat
   */
  async sendMessage(
    sessionId: string, 
    content: string, 
    metadata?: ChatMessage['metadata']
  ): Promise<ChatMessage> {
    try {
      // Obter userId da sessão atual
      const userId = this.currentSession?.user_id;
      if (!userId) {
        throw new Error('Usuário não identificado na sessão atual');
      }

      console.log('📤 SENDMESSAGE: Enviando mensagem para sessionId:', sessionId, 'userId:', userId);

      const message: Omit<ChatMessage, 'id'> = {
        session_id: sessionId,
        sender_id: userId,        // ✅ CORRIGIDO: Adicionar sender_id
        sender: 'user',
        content,
        timestamp: new Date().toISOString(),
        metadata
      };

      console.log('📤 SENDMESSAGE: Objeto message:', message);

      // Salvar no banco de dados
      const { data, error } = await supabase
        .from('chat_messages')
        .insert(message)
        .select()
        .single();

      if (error) {
        console.error('❌ SENDMESSAGE: Erro no Supabase:', error);
        throw error;
      }

      console.log('✅ SENDMESSAGE: Mensagem salva com sucesso:', data);

      // Enviar via WebSocket
      this.socket?.emit('send_message', data);

      // Analisar mensagem para sugestões automáticas
      await this.analyzeMessageForSuggestions(data);

      return data;
    } catch (error) {
      console.error('❌ SENDMESSAGE: Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  /**
   * Busca histórico de mensagens da sessão
   */
  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return [];
    }
  }

  /**
   * Finaliza sessão de chat
   */
  async endChatSession(
    sessionId: string,
    rating?: number,
    feedback?: string
  ): Promise<void> {
    try {
      const endTime = new Date().toISOString();
      const session = await this.getSession(sessionId);
      
      const durationMinutes = session?.started_at 
        ? Math.round((new Date(endTime).getTime() - new Date(session.started_at).getTime()) / 60000)
        : 0;

      // Atualizar sessão
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          status: 'completed',
          ended_at: endTime,
          duration_minutes: durationMinutes,
          satisfaction_rating: rating,
          user_feedback: feedback
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Gerar resumo da sessão
      await this.generateSessionSummary(sessionId);

      // Desconectar WebSocket
      this.socket?.emit('leave_session', sessionId);
      
      this.currentSession = null;
    } catch (error) {
      console.error('Erro ao finalizar sessão:', error);
      throw error;
    }
  }

  /**
   * Busca especialistas disponíveis
   */
  async getAvailableSpecialists(): Promise<SpecialistAvailability[]> {
    try {
      const { data, error } = await supabase
        .from('specialists')
        .select(`
          id,
          name,
          specialties,
          status,
          current_queue_size,
          average_response_time,
          rating,
          languages
        `)
        .eq('status', 'available')
        .order('rating', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar especialistas:', error);
      return [];
    }
  }

  /**
   * Verifica posição na fila
   */
  async getQueuePosition(sessionId: string): Promise<QueuePosition> {
    try {
      const { data, error } = await supabase
        .rpc('get_queue_position', { session_id: sessionId });

      if (error) throw error;

      return {
        position: data.position || 0,
        estimated_wait_time: data.estimated_wait_time || 0,
        ahead_of_you: data.ahead_of_you || 0
      };
    } catch (error) {
      console.error('Erro ao verificar posição na fila:', error);
      return { position: 0, estimated_wait_time: 0, ahead_of_you: 0 };
    }
  }

  /**
   * Cancela sessão de chat
   */
  async cancelChatSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          status: 'cancelled',
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      this.socket?.emit('cancel_session', sessionId);
      this.currentSession = null;
    } catch (error) {
      console.error('Erro ao cancelar sessão:', error);
      throw error;
    }
  }

  /**
   * Handlers para eventos
   */
  onMessage(handler: (message: ChatMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  onStatusChange(handler: (status: string) => void): void {
    this.statusHandlers.push(handler);
  }

  removeMessageHandler(handler: (message: ChatMessage) => void): void {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  removeStatusHandler(handler: (status: string) => void): void {
    this.statusHandlers = this.statusHandlers.filter(h => h !== handler);
  }

  /**
   * Métodos auxiliares privados
   */
  private async joinQueue(sessionId: string, priority: string): Promise<QueuePosition> {
    // Implementar lógica de fila baseada em prioridade
    this.socket?.emit('join_queue', { sessionId, priority });
    
    return this.getQueuePosition(sessionId);
  }

  private async notifyAvailableSpecialists(
    contextData: SpecialistContextData, 
    priority: string
  ): Promise<void> {
    // Notificar especialistas baseado na especialidade necessária
    const requiredSpecialties = this.determineRequiredSpecialties(contextData);
    
    this.socket?.emit('notify_specialists', {
      specialties: requiredSpecialties,
      priority,
      context: {
        visa_type: contextData.visamatch_analysis.recommended_strategy,
        probability: contextData.visamatch_analysis.probability_score,
        family_size: contextData.family_profile.composition.adults + 
                    contextData.family_profile.composition.children.length
      }
    });
  }

  private determineRequiredSpecialties(contextData: SpecialistContextData): string[] {
    const specialties = ['immigration_general'];
    
    const visaType = contextData.visamatch_analysis.recommended_strategy;
    
    if (visaType.includes('H-1B') || visaType.includes('L-1')) {
      specialties.push('work_visas');
    }
    
    if (visaType.includes('EB-')) {
      specialties.push('green_card');
    }
    
    if (visaType.includes('EB-5')) {
      specialties.push('investment_visas');
    }
    
    if (contextData.family_profile.composition.children.length > 0) {
      specialties.push('family_immigration');
    }
    
    return specialties;
  }

  private async analyzeMessageForSuggestions(message: ChatMessage): Promise<void> {
    // Analisar mensagem e gerar sugestões automáticas para o especialista
    const suggestions = await this.generateSpecialistSuggestions(message.content);
    
    if (suggestions.length > 0) {
      this.socket?.emit('specialist_suggestions', {
        session_id: message.session_id,
        suggestions
      });
    }
  }

  private async generateSpecialistSuggestions(messageContent: string): Promise<string[]> {
    const suggestions = [];
    
    // Análise simples baseada em palavras-chave
    if (messageContent.toLowerCase().includes('documento')) {
      suggestions.push('Fornecer checklist de documentos necessários');
      suggestions.push('Explicar processo de apostilamento');
    }
    
    if (messageContent.toLowerCase().includes('tempo') || messageContent.toLowerCase().includes('prazo')) {
      suggestions.push('Mostrar timeline detalhada do processo');
      suggestions.push('Explicar fatores que podem acelerar/atrasar');
    }
    
    if (messageContent.toLowerCase().includes('custo') || messageContent.toLowerCase().includes('preço')) {
      suggestions.push('Detalhar custos do processo');
      suggestions.push('Sugerir formas de otimizar investimento');
    }
    
    return suggestions;
  }

  private async generateSessionSummary(sessionId: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      const messages = await this.getSessionMessages(sessionId);
      
      if (!session || messages.length === 0) return;

      // Gerar resumo automático
      const summary = {
        session_id: sessionId,
        total_messages: messages.length,
        duration_minutes: session.duration_minutes || 0,
        topics_discussed: this.extractTopicsFromMessages(messages),
        action_items: this.extractActionItems(messages),
        specialist_recommendations: this.extractRecommendations(messages),
        follow_up_needed: this.determineFollowUpNeeded(messages),
        created_at: new Date().toISOString()
      };

      // Salvar resumo
      const { error } = await supabase
        .from('chat_session_summaries')
        .insert(summary);

      if (error) {
        console.error('Erro ao salvar resumo da sessão:', error);
      }
    } catch (error) {
      console.error('Erro ao gerar resumo da sessão:', error);
    }
  }

  private async getSession(sessionId: string): Promise<ChatSession | null> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Erro ao buscar sessão:', error);
      return null;
    }

    return data;
  }

  private extractTopicsFromMessages(messages: ChatMessage[]): string[] {
    // Implementar extração de tópicos usando NLP simples
    const topics = new Set<string>();
    
    messages.forEach(message => {
      if (message.sender === 'user') {
        // Análise simples de tópicos
        if (message.content.toLowerCase().includes('visto')) topics.add('Tipos de visto');
        if (message.content.toLowerCase().includes('documento')) topics.add('Documentação');
        if (message.content.toLowerCase().includes('entrevista')) topics.add('Preparação para entrevista');
        if (message.content.toLowerCase().includes('trabalho')) topics.add('Oportunidades de trabalho');
      }
    });
    
    return Array.from(topics);
  }

  private extractActionItems(messages: ChatMessage[]): string[] {
    // Extrair itens de ação das mensagens do especialista
    const actionItems: string[] = [];
    
    messages.forEach(message => {
      if (message.sender === 'specialist') {
        // Procurar por padrões de ação
        const actionPatterns = [
          /você deve(.*?)(?=\.|$)/gi,
          /recomendo que(.*?)(?=\.|$)/gi,
          /próximo passo(.*?)(?=\.|$)/gi,
          /é importante(.*?)(?=\.|$)/gi
        ];
        
        actionPatterns.forEach(pattern => {
          const matches = message.content.match(pattern);
          if (matches) {
            actionItems.push(...matches.map(match => match.trim()));
          }
        });
      }
    });
    
    return actionItems;
  }

  private extractRecommendations(messages: ChatMessage[]): string[] {
    // Extrair recomendações específicas do especialista
    return messages
      .filter(m => m.sender === 'specialist')
      .map(m => m.content)
      .filter(content => 
        content.toLowerCase().includes('recomendo') || 
        content.toLowerCase().includes('sugiro') ||
        content.toLowerCase().includes('aconselho')
      );
  }

  private determineFollowUpNeeded(messages: ChatMessage[]): boolean {
    // Determinar se follow-up é necessário baseado no conteúdo
    const lastMessages = messages.slice(-3);
    
    return lastMessages.some(message => 
      message.content.toLowerCase().includes('acompanhar') ||
      message.content.toLowerCase().includes('próxima semana') ||
      message.content.toLowerCase().includes('follow-up') ||
      message.content.toLowerCase().includes('retorno')
    );
  }

  /**
   * Cleanup ao destruir o serviço
   */
  destroy(): void {
    this.socket?.disconnect();
    this.messageHandlers = [];
    this.statusHandlers = [];
    this.currentSession = null;
  }
}

export const specialistChatService = new SpecialistChatService();
export type { 
  ChatMessage, 
  ChatSession, 
  SpecialistAvailability, 
  QueuePosition 
};
