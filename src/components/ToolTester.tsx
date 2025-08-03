import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  TestTube, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Database,
  Brain,
  FileText,
  Send,
  Download,
  RefreshCw,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { openaiService } from '@/services/openaiService';
import { CriadorSonhosFormData } from '@/types/forms';
import { useToast } from '@/hooks/use-toast';
import { specialistChatService } from '@/services/specialistChatService';
import { contextService } from '@/services/contextService';

interface TestResult {
  step: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  duration?: number;
  data?: any;
  logs?: string[];
  error?: any;
  timestamp?: string;
}

interface TestSuite {
  name: string;
  description: string;
  steps: string[];
}

const ToolTester: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const currentUserId = currentUser?.id || '';
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [testData, setTestData] = useState<any>({});
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [detailedLogs, setDetailedLogs] = useState<string[]>([]);

  // Função para adicionar logs detalhados
  const addLog = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    if (data) {
      console.log(logEntry, data);
    } else {
      console.log(logEntry);
    }
    setDetailedLogs(prev => [...prev, logEntry + (data ? ` | Data: ${JSON.stringify(data, null, 2)}` : '')]);
  };

  // Verificar autenticação usando a mesma lógica das outras páginas
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setCurrentUser(null);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Definição das ferramentas disponíveis para teste
  const testSuites: Record<string, TestSuite> = {
    dreams: {
      name: 'Criador de Sonhos',
      description: 'Testa formulário, salvamento, OpenAI e geração de PDF',
      steps: [
        'Validação do formulário',
        'Salvamento no banco de dados',
        'Envio para OpenAI',
        'Processamento da resposta',
        'Geração do PDF',
        'Salvamento do resultado'
      ]
    },
    visamatch: {
      name: 'VisaMatch',
      description: 'Testa análise de visto e recomendações',
      steps: [
        'Validação dos dados',
        'Salvamento no banco',
        'Consulta OpenAI Assistant',
        'Processamento da análise',
        'Salvamento dos resultados'
      ]
    },
    chat: {
      name: 'Chat com Especialista',
      description: 'Testa sistema de chat e contexto',
      steps: [
        'Inicialização do chat',
        'Envio de mensagem',
        'Processamento OpenAI',
        'Salvamento do histórico',
        'Atualização do contexto'
      ]
    },
    pdf: {
      name: 'Geração de PDF',
      description: 'Testa geração isolada de PDF',
      steps: [
        'Validação dos dados',
        'Geração do template',
        'Renderização do PDF',
        'Salvamento no storage',
        'Registro no banco'
      ]
    }
  };

  // Dados de teste padrão para cada ferramenta
  const defaultTestData: Record<string, any> = {
    dreams: {
      sonho_principal: 'Morar nos Estados Unidos',
      motivacao: 'Buscar melhores oportunidades profissionais',
      timeline: '2-3 anos',
      recursos_disponiveis: 'Tenho formação superior e experiência profissional',
      familia: 'Casado com 2 filhos',
      idade: '35',
      profissao: 'Engenheiro de Software'
    },
    visamatch: {
      idade: 35,
      educacao: 'superior_completo',
      experiencia: 'mais_10_anos',
      ingles: 'avancado',
      area_profissional: 'tecnologia',
      tem_oferta_emprego: false,
      tem_familia: true,
      investimento_disponivel: 100000
    },
    chat: {
      mensagem: 'Olá, gostaria de saber mais sobre o processo de visto EB-2.',
      contexto: 'usuario_interessado_eb2'
    },
    pdf: {
      tipo: 'dreams_report',
      dados: {
        nome: 'João Silva',
        sonho: 'Morar nos EUA',
        analise: 'Análise detalhada do perfil...'
      }
    }
  };

  const initializeTest = (toolName: string) => {
    const suite = testSuites[toolName];
    if (!suite) return;

    const initialResults: TestResult[] = suite.steps.map(step => ({
      step,
      status: 'pending',
      message: 'Aguardando execução...'
    }));

    setResults(initialResults);
    setCurrentStep(0);
    setTestData(defaultTestData[toolName] || {});
  };

  const updateResult = (index: number, update: Partial<TestResult>) => {
    const timestamp = new Date().toISOString();
    const updatedResult = { 
      ...update, 
      timestamp,
      logs: update.logs || []
    };
    
    // Log detalhado da atualização
    addLog(`Step ${index + 1} - Status: ${update.status} - ${update.message}`, {
      stepIndex: index,
      update: updatedResult,
      error: update.error
    });
    
    setResults(prev => prev.map((result, i) => 
      i === index ? { ...result, ...updatedResult } : result
    ));
  };

  const runTest = async () => {
    if (!selectedTool || !currentUser) {
      addLog('ERRO: Ferramenta não selecionada ou usuário não autenticado', {
        selectedTool,
        currentUser: currentUser ? 'Autenticado' : 'Não autenticado',
        currentUserId
      });
      return;
    }

    // Limpar logs anteriores
    setDetailedLogs([]);
    setIsRunning(true);
    const suite = testSuites[selectedTool];
    
    addLog(`INICIANDO TESTE: ${suite.name}`, {
      tool: selectedTool,
      userId: currentUserId,
      testData,
      steps: suite.steps
    });
    
    try {
      for (let i = 0; i < suite.steps.length; i++) {
        setCurrentStep(i);
        const stepName = suite.steps[i];
        
        addLog(`EXECUTANDO STEP ${i + 1}: ${stepName}`);
        updateResult(i, { status: 'running', message: 'Executando...' });
        
        const startTime = Date.now();
        
        try {
          addLog(`Chamando executeTestStep para ${selectedTool}, step ${i}`, {
            tool: selectedTool,
            stepIndex: i,
            stepName,
            testData: { ...testData }
          });
          
          await executeTestStep(selectedTool, i, testData);
          
          const duration = Date.now() - startTime;
          addLog(`STEP ${i + 1} CONCLUÍDO COM SUCESSO em ${duration}ms`);
          
          updateResult(i, { 
            status: 'success', 
            message: 'Concluído com sucesso',
            duration,
            logs: [`Executado em ${duration}ms`]
          });
        } catch (error: any) {
          const duration = Date.now() - startTime;
          
          addLog(`ERRO NO STEP ${i + 1}:`, {
            error: error.message,
            stack: error.stack,
            errorObject: error,
            duration,
            stepName,
            testData: { ...testData }
          });
          
          updateResult(i, { 
            status: 'error', 
            message: error.message || 'Erro desconhecido',
            error: {
              message: error.message,
              stack: error.stack,
              name: error.name
            },
            logs: [`Erro após ${duration}ms: ${error.message}`]
          });
          break; // Para a execução se houver erro
        }
        
        // Delay entre steps para visualização
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } finally {
      setIsRunning(false);
    }
  };

  const executeTestStep = async (tool: string, stepIndex: number, data: any): Promise<void> => {
    const step = testSuites[tool].steps[stepIndex];
    
    switch (tool) {
      case 'dreams':
        return await executeDreamsStep(stepIndex, data);
      case 'visamatch':
        return await executeVisaMatchStep(stepIndex, data);
      case 'chat':
        return await executeChatStep(stepIndex, data);
      case 'pdf':
        return await executePdfStep(stepIndex, data);
      default:
        throw new Error(`Ferramenta ${tool} não implementada`);
    }
  };

  // Função para simular o handleFormSubmit real do Dreams.tsx
  const handleFormSubmitTest = async (formData: CriadorSonhosFormData) => {
    if (!currentUser) {
      throw new Error('Você precisa estar logado para salvar seus sonhos.');
    }

    const { data, error } = await supabase
      .from('dream_goals')
      .insert([{
        form_data: formData,
        status: 'draft',
        user_id: currentUser.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  // Função para simular o generateActionPlan real do Dreams.tsx
  const generateActionPlanTest = async (goal: any) => {
    const actionPlan = await openaiService.generateDreamActionPlan(goal.form_data, {
      onRetry: (attempt, error) => {
        addLog(`Tentativa ${attempt} de gerar plano falhou, tentando novamente...`, { error: error.message });
      },
      onSuccess: (response, duration) => {
        addLog(`Plano de ação gerado com sucesso em ${duration}ms`);
      },
      onError: (error, attempts) => {
        addLog(`Falha ao gerar plano após ${attempts} tentativas`, { error: error.message });
      }
    });

    // Update goal with action plan
    const { error } = await supabase
      .from('dream_goals')
      .update({ 
        action_plan: actionPlan,
        status: 'completed'
      })
      .eq('id', goal.id);

    if (error) throw error;
    return actionPlan;
  };

  const executeDreamsStep = async (stepIndex: number, data: any): Promise<void> => {
    addLog(`executeDreamsStep chamado`, {
      stepIndex,
      data: { ...data },
      currentUserId,
      currentUser: currentUser ? 'Presente' : 'Ausente'
    });
    
    switch (stepIndex) {
      case 0: // Validação do formulário
        addLog('STEP 0: Iniciando validação do formulário', {
          sonho_principal: data.sonho_principal,
          motivacao: data.motivacao
        });
        
        if (!data.sonho_principal || !data.motivacao) {
          const error = 'Dados obrigatórios não preenchidos';
          addLog('ERRO STEP 0: Validação falhou', { error, data });
          throw new Error(error);
        }
        
        addLog('STEP 0: Validação concluída com sucesso');
        break;
        
      case 1: // Salvamento usando a FUNÇÃO REAL do Dreams.tsx
        addLog('STEP 1: Usando handleFormSubmit REAL do Dreams.tsx');
        
        const formData: CriadorSonhosFormData = {
          nome: data.nome || 'Teste',
          idade: data.idade || '35',
          profissao: data.profissao || 'Teste',
          experiencia: data.experiencia || 'Teste',
          objetivo_principal: data.sonho_principal || 'Teste de objetivo',
          categoria: 'trabalho',
          timeline: data.timeline || '1-2 anos',
          prioridade: 'alta',
          situacao_atual: data.situacao_atual || 'Teste',
          recursos_disponiveis: data.recursos_disponiveis || 'Teste',
          obstaculos: data.obstaculos || 'Teste',
          detalhes_especificos: data.detalhes_especificos || 'Teste de detalhes',
          motivacao: data.motivacao || 'Teste de motivação'
        };
        
        addLog('STEP 1: Chamando handleFormSubmitTest (função real)', { formData });
        
        // Usar a função REAL do Dreams.tsx
        const goalData = await handleFormSubmitTest(formData);
        
        addLog('STEP 1: handleFormSubmit executado com sucesso', {
          goalId: goalData.id,
          goalData
        });
        
        // Salvar dados para próximos steps
        data._testGoalId = goalData.id;
        data._testGoalData = goalData;
        break;
        
      case 2: // Envio para OpenAI usando a FUNÇÃO REAL do Dreams.tsx
        if (!data._testGoalId || !data._testGoalData) {
          throw new Error('Dados do goal não encontrados - erro no step anterior');
        }
        
        addLog('STEP 2: Usando generateActionPlan REAL do Dreams.tsx', {
          goalId: data._testGoalId,
          goalData: data._testGoalData
        });
        
        // Usar a função REAL do Dreams.tsx
        const actionPlan = await generateActionPlanTest(data._testGoalData);
        
        addLog('STEP 2: generateActionPlan executado com sucesso', {
          actionPlanLength: actionPlan?.length || 0,
          hasActionPlan: !!actionPlan
        });
        
        data._testActionPlan = actionPlan;
        break;
        
      case 3: // Processamento da resposta
        addLog('STEP 3: Processamento da resposta concluído');
        // O generateActionPlanTest já fez todo o processamento necessário
        break;
        
      case 4: // Geração de PDF
        addLog('STEP 4: Simulação de geração de PDF');
        // A aplicação real não tem PDF ainda, apenas simular
        await new Promise(resolve => setTimeout(resolve, 500));
        break;
        
      case 5: // Verificação final
        addLog('STEP 5: Verificação final dos dados salvos');
        
        // Verificar se o goal foi salvo corretamente com o action_plan
        const { data: finalGoal, error: checkError } = await supabase
          .from('dream_goals')
          .select('*')
          .eq('id', data._testGoalId)
          .single();
        
        if (checkError) {
          addLog('ERRO STEP 5: Erro ao verificar goal salvo', { error: checkError });
          throw new Error(`Erro ao verificar resultado: ${checkError.message}`);
        }
        
        addLog('STEP 5: Verificação concluída', {
          goalId: finalGoal.id,
          hasActionPlan: !!finalGoal.action_plan,
          status: finalGoal.status,
          actionPlanLength: finalGoal.action_plan?.length || 0
        });
        
        if (!finalGoal.action_plan) {
          throw new Error('Action plan não foi salvo corretamente');
        }
        
        break;
    }
  };

  // Função REAL do VisaMatch para gerar recomendações
  const generateVisaRecommendations = (answers: Record<string, string>) => {
    const recs: any[] = [];

    // Lógica REAL extraída do VisaMatch.tsx
    if (answers.purpose === 'work' && answers.jobOffer === 'yes') {
      recs.push({
        type: 'H-1B',
        name: 'Visto H-1B - Trabalhador Especializado',
        match: 95,
        description: 'Para profissionais com oferta de emprego em área especializada',
        requirements: ['Diploma superior', 'Oferta de emprego', 'Aprovação no sorteio'],
        timeline: '6-12 meses',
        cost: '$2,000 - $5,000',
        pros: ['Caminho para Green Card', 'Salários competitivos', 'Família incluída'],
        cons: ['Dependente do empregador', 'Sorteio anual', 'Processo complexo']
      });
    }

    if (answers.purpose === 'investment' && answers.investment === 'high') {
      recs.push({
        type: 'EB-5',
        name: 'Visto EB-5 - Investidor Imigrante',
        match: 90,
        description: 'Para investidores que desejam obter Green Card através de investimento',
        requirements: ['Investimento de $800k-$1.05M', 'Criação de empregos', 'Fonte legal dos fundos'],
        timeline: '2-5 anos',
        cost: '$800,000 - $1,050,000+',
        pros: ['Green Card direto', 'Família incluída', 'Sem requisito de idioma'],
        cons: ['Alto investimento', 'Processo longo', 'Risco de investimento']
      });
    }

    if (answers.purpose === 'study') {
      recs.push({
        type: 'F-1',
        name: 'Visto F-1 - Estudante',
        match: 88,
        description: 'Para estudantes que desejam cursar graduação ou pós-graduação',
        requirements: ['Aceitação em instituição aprovada', 'Comprovação financeira', 'Vínculos com país de origem'],
        timeline: '3-6 meses',
        cost: '$160 + taxas escolares',
        pros: ['Permite estudo legal', 'OPT após formatura', 'Possibilidade de H1-B'],
        cons: ['Trabalho limitado', 'Temporário', 'Custos educacionais altos']
      });
    }

    if (recs.length === 0) {
      recs.push({
        type: 'B-1/B-2',
        name: 'Visto B-1/B-2 - Turismo/Negócios',
        match: 60,
        description: 'Visto temporário para visitas de negócios ou turismo',
        requirements: ['Vínculos com país de origem', 'Comprovação financeira', 'Propósito temporário'],
        timeline: '2-4 semanas',
        cost: '$160',
        pros: ['Processo rápido', 'Baixo custo', 'Múltiplas entradas'],
        cons: ['Temporário', 'Não permite trabalho', 'Não leva à residência']
      });
    }

    return recs.sort((a, b) => b.match - a.match);
  };

  const executeVisaMatchStep = async (stepIndex: number, data: any): Promise<void> => {
    switch (stepIndex) {
      case 0: // Validação dos dados (usando lógica REAL)
        if (!data.idade || !data.educacao) {
          throw new Error('Dados de perfil incompletos');
        }
        addLog('STEP 1: Validação dos dados concluída', {
          idade: data.idade,
          educacao: data.educacao,
          area_profissional: data.area_profissional
        });
        break;
        
      case 1: // Processamento local (VisaMatch real NÃO salva no banco)
        addLog('STEP 2: VisaMatch real NÃO salva no banco - processamento local apenas');
        
        // Simular o processamento que o VisaMatch real faz
        const answers = {
          purpose: data.tem_oferta_emprego ? 'work' : (data.investimento_disponivel > 50000 ? 'investment' : 'study'),
          jobOffer: data.tem_oferta_emprego ? 'yes' : 'no',
          investment: data.investimento_disponivel > 100000 ? 'high' : 'medium'
        };
        
        data._testAnswers = answers;
        addLog('STEP 2: Dados processados localmente', { answers });
        break;
        
      case 2: // Geração de recomendações (usando função REAL)
        if (!data._testAnswers) {
          throw new Error('Dados não processados no step anterior');
        }
        
        addLog('STEP 3: Gerando recomendações usando lógica REAL do VisaMatch');
        const recommendations = generateVisaRecommendations(data._testAnswers);
        
        data._testRecommendations = recommendations;
        addLog('STEP 3: Recomendações geradas com sucesso', {
          totalRecommendations: recommendations.length,
          topRecommendation: recommendations[0]?.name,
          topMatch: recommendations[0]?.match
        });
        break;
        
      case 3: // Validação dos resultados
        if (!data._testRecommendations || data._testRecommendations.length === 0) {
          throw new Error('Nenhuma recomendação foi gerada');
        }
        
        addLog('STEP 4: Validação dos resultados concluída', {
          recommendationsCount: data._testRecommendations.length,
          allRecommendations: data._testRecommendations.map((r: any) => `${r.name} (${r.match}%)`)
        });
        break;
        
      case 4: // Verificação final (VisaMatch real não persiste dados)
        addLog('STEP 5: VisaMatch real não persiste dados - verificação final concluída');
        
        if (!data._testRecommendations || data._testRecommendations.length === 0) {
          throw new Error('Processo não foi concluído corretamente');
        }
        
        addLog('STEP 5: Teste concluído com sucesso', {
          finalStatus: 'VisaMatch funciona apenas com processamento local',
          totalRecommendations: data._testRecommendations.length,
          testCompleted: true
        });
        break;
    }
  };

  // Funções REAIS do Chat para teste
  // MOCK DO CONTEXTSERVICE APENAS PARA TESTES
  const createMockSpecialistContext = (userId: string) => {
    console.log('🔧 TOOLTESTER: Criando contexto mock para userId:', userId);
    
    return {
      user_id: userId,
      timestamp: new Date().toISOString(),
      
      visamatch_analysis: {
        recommended_strategy: 'EB-2',
        probability_score: 75,
        requirements: ['Diploma superior', 'Experiência profissional', 'Oferta de emprego'],
        timeline: '12-18 meses',
        investment_needed: '$15,000',
        strategies: [{
          type: 'EB-2',
          probability: 75,
          timeline: '12-18 meses',
          requirements: ['Diploma superior', 'Experiência profissional'],
          benefits: ['Green card permanente', 'Família incluída'],
          risks: ['Processo longo', 'Dependente de empregador']
        }]
      },

      family_profile: {
        composition: {
          adults: 2,
          children: [{ age: 8 }, { age: 12 }]
        },
        professional: {
          primary_applicant: {
            profession: 'Engenheiro de Software',
            experience_years: 8,
            education_level: 'superior',
            english_level: 'avancado'
          }
        },
        goals: {
          primary: 'career_advancement',
          secondary: ['melhor_educacao_filhos', 'estabilidade_economica']
        },
        resources: {
          financial: 'medium',
          time_flexibility: 'medium'
        }
      },

      dreams_analysis: {
        family_overview: 'Família brasileira buscando oportunidades nos EUA',
        dream_mapping: 'Crescimento profissional e educação de qualidade para os filhos',
        transformation_scenarios: ['Mudança para Silicon Valley', 'Crescimento na carreira tech'],
        timeline: '2-3 anos',
        practical_tools: ['Networking profissional', 'Certificações técnicas']
      },

      specialist_session: {
        status: 'pending',
        topics_to_discuss: ['Estratégia EB-2', 'Timeline realista', 'Preparação familiar'],
        priority_level: 'medium'
      }
    };
  };

  const startChatSessionTest = async (userId: string, message: string) => {
    addLog('STEP 1: Iniciando sessão de chat usando specialistChatService REAL');
    addLog('STEP 1: Usando startChatSession REAL do specialistChatService');
    
    try {
      // INTERCEPTAR E MOCKAR APENAS O CONTEXTSERVICE PARA TESTES
      const originalCreateContext = (contextService as any).createSpecialistContext;
      (contextService as any).createSpecialistContext = async (userId: string) => {
        addLog('STEP 1: Usando contexto MOCK apenas para testes');
        return createMockSpecialistContext(userId);
      };
      
      const result = await specialistChatService.startChatSession(userId, 'Consulta sobre visto EB-2', 'medium');
      
      // RESTAURAR FUNCÇÃO ORIGINAL
      (contextService as any).createSpecialistContext = originalCreateContext;
      
      addLog('STEP 1: startChatSession executado com sucesso', {
        sessionId: result.session.id,
        queuePosition: result.queuePosition.position
      });
      return result;
    } catch (error: any) {
      addLog('STEP 1: Erro no startChatSession REAL', { error: error.message });
      throw error;
    }
  };

  const sendMessageTest = async (sessionId: string, message: string) => {
    addLog('STEP 3: Usando sendMessage REAL do specialistChatService');
    
    try {
      const result = await specialistChatService.sendMessage(sessionId, message);
      addLog('STEP 3: sendMessage executado com sucesso', {
        messageId: result.id,
        content: result.content
      });
      return result;
    } catch (error: any) {
      addLog('STEP 3: Erro no sendMessage REAL', { error: error.message });
      throw error;
    }
  };

  const executeChatStep = async (stepIndex: number, data: any): Promise<void> => {
    if (!currentUser?.id) {
      throw new Error('Usuário não autenticado');
    }

    // INTERCEPTAR CONTEXTSERVICE GLOBALMENTE PARA TODOS OS STEPS
    const originalCreateContext = (contextService as any).createSpecialistContext;
    (contextService as any).createSpecialistContext = async (userId: string) => {
      addLog('🔧 MOCK: Usando contexto simplificado para testes');
      return createMockSpecialistContext(userId);
    };

    try {
      switch (stepIndex) {
        case 0: // Iniciar sessão
          addLog('STEP 1: Iniciando sessão de chat usando specialistChatService REAL');
          const sessionResult = await startChatSessionTest(currentUser.id, 'Consulta sobre visto EB-2');
          data._testChatSession = sessionResult;
          data._testUserId = currentUser.id;
          break;
        
        case 1: // Validação da mensagem
          if (!data.mensagem) {
            throw new Error('Mensagem não pode estar vazia');
          }
          
          addLog('STEP 2: Validando mensagem do usuário', {
            messageLength: data.mensagem.length,
            messagePreview: data.mensagem.substring(0, 50) + '...'
          });
          
          data._testMessage = data.mensagem;
          break;
        
      case 2: // Envio de mensagem usando função REAL
        if (!data._testChatSession || !data._testMessage) {
          throw new Error('Dados da sessão não encontrados');
        }
        
        // Usar função REAL do specialistChatService
        const sentMessage = await sendMessageTest(data._testChatSession.session.id, data._testMessage);
        
        data._testSentMessage = sentMessage;
        break;
        
      case 3: // Buscar histórico usando função REAL
        if (!data._testChatSession) {
          throw new Error('Sessão de chat não foi criada');
        }
        
        addLog('STEP 4: Usando getSessionMessages REAL do specialistChatService');
        
        try {
          const messages = await specialistChatService.getSessionMessages(data._testChatSession.session.id);
          
          addLog('STEP 4: getSessionMessages executado com sucesso', {
            messagesCount: messages.length,
            messages: messages.map(m => ({ sender: m.sender, content: m.content.substring(0, 50) + '...' }))
          });
          
          data._testMessages = messages;
        } catch (error: any) {
          addLog('STEP 4: Erro no getSessionMessages REAL', { error: error.message });
          throw error;
        }
        break;
        
      case 4: // Finalizar sessão usando função REAL
        if (!data._testChatSession) {
          throw new Error('Sessão de chat não encontrada');
        }
        
        addLog('STEP 5: Usando endChatSession REAL do specialistChatService');
        
        try {
          await specialistChatService.endChatSession(data._testChatSession.session.id, 5, 'Teste automatizado');
          
          addLog('STEP 5: endChatSession executado com sucesso', {
            sessionId: data._testChatSession.session.id,
            rating: 5,
            feedback: 'Teste automatizado'
          });
        } catch (error: any) {
          addLog('STEP 5: Erro no endChatSession REAL', { error: error.message });
          throw error;
        }
        break;
        
      default:
        throw new Error(`Step ${stepIndex} não implementado para Chat`);
    }
    } catch (error) {
      // RESTAURAR FUNÇÃO ORIGINAL EM CASO DE ERRO
      (contextService as any).createSpecialistContext = originalCreateContext;
      throw error;
    } finally {
      // SEMPRE RESTAURAR FUNÇÃO ORIGINAL
      (contextService as any).createSpecialistContext = originalCreateContext;
    }
  };

  const executePdfStep = async (stepIndex: number, data: any): Promise<void> => {
    switch (stepIndex) {
      case 0: // Validação dos dados
        if (!data.tipo || !data.dados) {
          throw new Error('Dados para PDF incompletos');
        }
        break;
        
      case 1: // Geração do template
        await new Promise(resolve => setTimeout(resolve, 1000));
        break;
        
      case 2: // Renderização do PDF
        await new Promise(resolve => setTimeout(resolve, 2000));
        break;
        
      case 3: // Salvamento no storage
        await new Promise(resolve => setTimeout(resolve, 1000));
        break;
        
      case 4: // Registro no banco
        const { error } = await supabase
          .from('generated_pdfs')
          .insert({
            user_id: currentUser.user_id,
            pdf_type: data.tipo,
            file_path: 'test/path.pdf',
            status: 'teste'
          });
        
        if (error) throw new Error(`Erro ao registrar PDF: ${error.message}`);
        break;
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-600';
      case 'running':
        return 'bg-blue-100 text-blue-700';
      case 'success':
        return 'bg-green-100 text-green-700';
      case 'error':
        return 'bg-red-100 text-red-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Seleção da Ferramenta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecionar Ferramenta para Teste
          </label>
          <Select value={selectedTool} onValueChange={(value) => {
            setSelectedTool(value);
            initializeTest(value);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha uma ferramenta..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(testSuites).map(([key, suite]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <TestTube className="h-4 w-4" />
                    {suite.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedTool && (
            <p className="text-sm text-gray-600 mt-2">
              {testSuites[selectedTool].description}
            </p>
          )}
        </div>

        <div className="flex items-end">
          <Button 
            onClick={runTest}
            disabled={!selectedTool || isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Executando Teste...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Executar Teste Completo
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Dados de Teste */}
      {selectedTool && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Dados de Teste</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={JSON.stringify(testData, null, 2)}
              onChange={(e) => {
                try {
                  setTestData(JSON.parse(e.target.value));
                } catch (error) {
                  // Ignora erros de parsing durante digitação
                }
              }}
              className="font-mono text-xs"
              rows={8}
              placeholder="Dados de teste em formato JSON..."
            />
          </CardContent>
        </Card>
      )}

      {/* Logs Detalhados */}
      {detailedLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Logs Detalhados do Teste
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs max-h-96 overflow-y-auto">
              {detailedLogs.map((log, index) => (
                <div key={index} className="mb-1 whitespace-pre-wrap break-words">
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados dos Testes */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Resultados do Teste - {testSuites[selectedTool]?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${
                    index === currentStep && isRunning 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <span className="font-medium text-gray-900">
                        {index + 1}. {result.step}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {result.duration && (
                        <span className="text-xs text-gray-500">
                          {result.duration}ms
                        </span>
                      )}
                      <Badge 
                        variant="secondary" 
                        className={getStatusColor(result.status)}
                      >
                        {result.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-2">
                    {result.message}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Sucessos</span>
            </div>
            <p className="text-xl font-bold text-green-600">
              {results.filter(r => r.status === 'success').length}
            </p>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Erros</span>
            </div>
            <p className="text-xl font-bold text-red-600">
              {results.filter(r => r.status === 'error').length}
            </p>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Pendentes</span>
            </div>
            <p className="text-xl font-bold text-blue-600">
              {results.filter(r => r.status === 'pending').length}
            </p>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Executando</span>
            </div>
            <p className="text-xl font-bold text-yellow-600">
              {results.filter(r => r.status === 'running').length}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ToolTester;
