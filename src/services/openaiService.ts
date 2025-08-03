import OpenAI from 'openai';
import { cacheService } from './cacheService';

// Configuration interface
interface OpenAIConfig {
  apiKey: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  model: string;
  temperature: number;
}

// Request options interface
interface RequestOptions {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
  onSuccess?: (response: any, duration: number) => void;
  onError?: (error: Error, attempts: number) => void;
}

// Logging interface
interface LogEntry {
  timestamp: Date;
  operation: string;
  duration: number;
  success: boolean;
  error?: string;
  retryAttempt?: number;
  requestId: string;
}

class OpenAIService {
  private client: OpenAI;
  private config: OpenAIConfig;
  private logs: LogEntry[] = [];

  constructor(config?: Partial<OpenAIConfig>) {
    // DEBUG: Verificar se a variável está sendo carregada
    console.log('🔍 DEBUG OpenAI - Variáveis de ambiente:', {
      VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY ? 'PRESENTE' : 'AUSENTE',
      VITE_OPENAI_API_KEY_LENGTH: import.meta.env.VITE_OPENAI_API_KEY?.length || 0,
      VITE_OPENAI_API_KEY_START: import.meta.env.VITE_OPENAI_API_KEY?.substring(0, 20) || 'N/A',
      ALL_VITE_VARS: Object.keys(import.meta.env).filter(key => key.includes('OPENAI'))
    });
    
    this.config = {
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
      timeout: 30000, // 30 seconds
      maxRetries: 3,
      retryDelay: 1000, // 1 second
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      ...config
    };
    
    // DEBUG: Verificar configuração final
    console.log('🔍 DEBUG OpenAI - Configuração final:', {
      hasApiKey: !!this.config.apiKey,
      apiKeyLength: this.config.apiKey.length,
      apiKeyStart: this.config.apiKey.substring(0, 20)
    });

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      dangerouslyAllowBrowser: true // Para uso no frontend - em produção, mover para backend
    });
  }

  // Generate unique request ID for tracking
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Log request details
  private log(entry: Omit<LogEntry, 'timestamp'>): void {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date()
    };
    
    this.logs.push(logEntry);
    
    // Keep only last 100 logs to prevent memory issues
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }

    // Console logging for development
    if (import.meta.env.DEV) {
      console.log(`[OpenAI Service] ${entry.operation}:`, {
        success: entry.success,
        duration: `${entry.duration}ms`,
        error: entry.error,
        retryAttempt: entry.retryAttempt,
        requestId: entry.requestId
      });
    }
  }

  // Sleep utility for retry delays
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Enhanced request wrapper with retry logic and timeout
  private async makeRequest<T>(
    operation: string,
    requestFn: () => Promise<T>,
    options: RequestOptions = {}
  ): Promise<T> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    const maxRetries = options.maxRetries ?? this.config.maxRetries;
    const retryDelay = options.retryDelay ?? this.config.retryDelay;
    const timeout = options.timeout ?? this.config.timeout;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Request timeout after ${timeout}ms`));
          }, timeout);
        });

        // Race between request and timeout
        const result = await Promise.race([
          requestFn(),
          timeoutPromise
        ]);

        const duration = Date.now() - startTime;

        // Log successful request
        this.log({
          operation,
          duration,
          success: true,
          requestId,
          retryAttempt: attempt > 1 ? attempt : undefined
        });

        // Call success callback
        options.onSuccess?.(result, duration);

        return result;
      } catch (error) {
        lastError = error as Error;
        const duration = Date.now() - startTime;

        // Log failed attempt
        this.log({
          operation,
          duration,
          success: false,
          error: lastError.message,
          requestId,
          retryAttempt: attempt
        });

        // If this is the last attempt, don't retry
        if (attempt > maxRetries) {
          break;
        }

        // Call retry callback
        options.onRetry?.(attempt, lastError);

        // Wait before retrying with exponential backoff
        const delay = retryDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }

    // Call error callback
    options.onError?.(lastError!, maxRetries + 1);

    throw lastError;
  }

  // Generate chat response with enhanced error handling and caching
  async generateChatResponse(
    message: string,
    conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = [],
    options: RequestOptions = {}
  ): Promise<string> {
    // Create cache key data
    const cacheData = {
      message,
      conversationHistory,
      model: this.config.model,
      temperature: this.config.temperature
    };

    // Try to get from cache first
    const cachedResponse = await cacheService.get('chat', cacheData);
    if (cachedResponse) {
      console.log('[OpenAI Service] Using cached chat response');
      return cachedResponse;
    }
    const systemPrompt = `Você é um especialista em imigração americana com mais de 15 anos de experiência. Você ajuda brasileiros que desejam imigrar para os Estados Unidos.

DIRETRIZES:
- Seja preciso, profissional e empático
- Forneça informações atualizadas sobre vistos e processos de imigração
- Sempre mencione que cada caso é único e recomende consulta com advogado especializado
- Use linguagem clara e acessível
- Seja específico sobre custos, prazos e requisitos quando possível
- Mantenha foco em imigração para os EUA

TIPOS DE VISTO PRINCIPAIS:
- H1-B: Trabalhadores especializados
- L-1: Transferência interna de empresa
- O-1: Habilidades extraordinárias
- E-2: Investidor de tratado
- EB-5: Investidor (Green Card)
- F-1: Estudante
- K-1: Noivo(a) de cidadão americano

Responda de forma concisa mas completa, sempre em português brasileiro.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory,
      { role: 'user' as const, content: message }
    ];

    return this.makeRequest(
      'generateChatResponse',
      async () => {
        const completion = await this.client.chat.completions.create({
          model: this.config.model,
          messages: messages,
          max_tokens: 500,
          temperature: this.config.temperature,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response from OpenAI');
        }

        // Cache the response
        await cacheService.set('chat', cacheData, content);

        return content;
      },
      {
        ...options,
        onError: (error, attempts) => {
          console.error(`Failed to generate chat response after ${attempts} attempts:`, error);
          options.onError?.(error, attempts);
        }
      }
    );
  }

  // Generate visa recommendations with enhanced error handling and caching
  async generateVisaRecommendations(
    userProfile: Record<string, any>,
    options: RequestOptions = {}
  ): Promise<any[]> {
    // Create cache key data
    const cacheData = {
      userProfile,
      model: this.config.model,
      temperature: 0.3
    };

    // Try to get from cache first
    const cachedResponse = await cacheService.get('visa_recommendations', cacheData);
    if (cachedResponse) {
      console.log('[OpenAI Service] Using cached visa recommendations');
      return cachedResponse;
    }
    const prompt = `Com base no perfil do usuário, recomende os melhores tipos de visto americano:

Perfil:
- Objetivo: ${userProfile.purpose}
- Educação: ${userProfile.education}
- Experiência: ${userProfile.experience}
- Oferta de trabalho: ${userProfile.jobOffer}
- Capacidade de investimento: ${userProfile.investment}
- Prazo desejado: ${userProfile.timeline}

Forneça uma análise detalhada em formato JSON com os 3 melhores vistos, incluindo:
- type: código do visto
- name: nome completo
- match: percentual de compatibilidade (0-100)
- description: descrição breve
- requirements: array de requisitos principais
- timeline: prazo estimado
- cost: faixa de custo
- pros: array de vantagens
- cons: array de desvantagens

Responda apenas com o JSON válido, sem texto adicional.`;

    return this.makeRequest(
      'generateVisaRecommendations',
      async () => {
        const completion = await this.client.chat.completions.create({
          model: this.config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500,
          temperature: 0.3,
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) {
          throw new Error('Empty response from OpenAI');
        }

        try {
          // Clean response to ensure valid JSON
          const cleanedResponse = response.trim().replace(/```json\n?|\n?```/g, '');
          const parsed = JSON.parse(cleanedResponse);
          
          // Validate response structure
          if (!Array.isArray(parsed)) {
            throw new Error('Response is not an array');
          }

          // Validate each recommendation has required fields
          for (const rec of parsed) {
            if (!rec.type || !rec.name || typeof rec.match !== 'number') {
              throw new Error('Invalid recommendation structure');
            }
          }

          // Cache the successful response
          await cacheService.set('visa_recommendations', cacheData, parsed);
          
          return parsed;
        } catch (parseError) {
          throw new Error(`Failed to parse JSON response: ${parseError.message}`);
        }
      },
      {
        ...options,
        onError: (error, attempts) => {
          console.error(`Failed to generate visa recommendations after ${attempts} attempts:`, error);
          options.onError?.(error, attempts);
        }
      }
    );
  }

  // Generate dream action plan with enhanced error handling and caching
  async generateDreamActionPlan(
    goal: Record<string, any>,
    options: RequestOptions = {}
  ): Promise<string> {
    // Create cache key data
    const cacheData = {
      goal,
      model: this.config.model,
      temperature: 0.5
    };

    // Try to get from cache first
    const cachedResponse = await cacheService.get('dream_action_plan', cacheData);
    if (cachedResponse) {
      console.log('[OpenAI Service] Using cached dream action plan');
      return cachedResponse;
    }
    const prompt = `Crie um plano de ação detalhado para ajudar ${goal.nome} a alcançar seu objetivo de imigração para os EUA.

Perfil:
- Nome: ${goal.nome}
- Idade: ${goal.idade}
- Profissão: ${goal.profissao}
- Experiência: ${goal.experiencia}

Objetivo:
- Objetivo principal: ${goal.objetivo_principal}
- Categoria: ${goal.categoria}
- Timeline: ${goal.timeline}
- Prioridade: ${goal.prioridade}

Situação atual:
- ${goal.situacao_atual}
- Recursos disponíveis: ${goal.recursos_disponiveis}
- Obstáculos: ${goal.obstaculos}

Detalhes:
- ${goal.detalhes_especificos}
- Motivação: ${goal.motivacao}

Crie um plano de ação em etapas numeradas, específico e prático, com prazos realistas.`;

    return this.makeRequest(
      'generateDreamActionPlan',
      async () => {
        const completion = await this.client.chat.completions.create({
          model: this.config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.5,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response from OpenAI');
        }

        // Cache the response
        await cacheService.set('dream_action_plan', cacheData, content);

        return content;
      },
      {
        ...options,
        onError: (error, attempts) => {
          console.error(`Failed to generate dream action plan after ${attempts} attempts:`, error);
          options.onError?.(error, attempts);
        }
      }
    );
  }

  // Get service statistics
  getStats() {
    const totalRequests = this.logs.length;
    const successfulRequests = this.logs.filter(log => log.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const averageDuration = totalRequests > 0 
      ? this.logs.reduce((sum, log) => sum + log.duration, 0) / totalRequests 
      : 0;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      averageDuration: Math.round(averageDuration),
      recentLogs: this.logs.slice(-10) // Last 10 logs
    };
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }

  // Update configuration
  updateConfig(newConfig: Partial<OpenAIConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Create singleton instance
export const openaiService = new OpenAIService();

// Export for backward compatibility
export const generateChatResponse = (
  message: string,
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = []
) => openaiService.generateChatResponse(message, conversationHistory);

export const generateVisaRecommendations = (userProfile: Record<string, any>) => 
  openaiService.generateVisaRecommendations(userProfile);

export const generateDreamActionPlan = (goal: Record<string, any>) => 
  openaiService.generateDreamActionPlan(goal);

export default openaiService;
