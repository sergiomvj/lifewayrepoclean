import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Para uso no frontend - em produção, mover para backend
});

export const generateChatResponse = async (message: string, conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = []) => {
  try {
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || 'Desculpe, não consegui processar sua pergunta. Tente novamente.';
  } catch (error) {
    console.error('Erro ao gerar resposta:', error);
    return 'Desculpe, estou com dificuldades técnicas no momento. Tente novamente em alguns instantes.';
  }
};

export const generateVisaRecommendations = async (userProfile: any) => {
  try {
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

Responda apenas com o JSON válido.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content;
    if (response) {
      try {
        return JSON.parse(response);
      } catch {
        // Fallback para sistema atual se JSON inválido
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error('Erro ao gerar recomendações:', error);
    return null;
  }
};

export const generateDreamActionPlan = async (goal: any) => {
  try {
    const prompt = `Crie um plano de ação detalhado para o seguinte objetivo de imigração:

Objetivo: ${goal.title}
Descrição: ${goal.description}
Categoria: ${goal.category}
Prioridade: ${goal.priority}
Prazo: ${goal.timeline}

Forneça um plano estruturado com:
1. Passos específicos e práticos
2. Ordem cronológica
3. Recursos necessários
4. Possíveis obstáculos e soluções
5. Marcos importantes

Responda em português brasileiro de forma clara e organizada.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.5,
    });

    return completion.choices[0]?.message?.content || 'Não foi possível gerar o plano de ação.';
  } catch (error) {
    console.error('Erro ao gerar plano de ação:', error);
    return 'Erro ao gerar plano de ação. Tente novamente.';
  }
};
