import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Settings, Monitor, TestTube, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import OpenAIMonitor from '@/components/OpenAIMonitor';
import { openaiService } from '@/services/openaiService';

const AdminOpenAI = () => {
  const [config, setConfig] = useState({
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,
    temperature: 0.7
  });
  const [testMessage, setTestMessage] = useState('Olá, você pode me ajudar com informações sobre vistos americanos?');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTestingChat, setIsTestingChat] = useState(false);
  const [isTestingVisa, setIsTestingVisa] = useState(false);
  const [isTestingDream, setIsTestingDream] = useState(false);
  const { toast } = useToast();

  const handleConfigUpdate = () => {
    openaiService.updateConfig(config);
    toast({
      title: "Configuração atualizada",
      description: "As novas configurações foram aplicadas com sucesso.",
    });
  };

  const testChatResponse = async () => {
    setIsTestingChat(true);
    setTestResult(null);
    
    try {
      const response = await openaiService.generateChatResponse(testMessage, [], {
        onRetry: (attempt, error) => {
          toast({
            title: `Tentativa ${attempt}`,
            description: "Testando resposta do chat...",
          });
        }
      });
      
      setTestResult(response);
      toast({
        title: "Teste concluído",
        description: "Resposta do chat gerada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: "Falha ao gerar resposta do chat.",
        variant: "destructive"
      });
    } finally {
      setIsTestingChat(false);
    }
  };

  const testVisaRecommendations = async () => {
    setIsTestingVisa(true);
    setTestResult(null);
    
    const mockProfile = {
      purpose: 'work',
      education: 'bachelor',
      experience: '3-5',
      jobOffer: 'yes',
      investment: 'low',
      timeline: '1year'
    };
    
    try {
      const recommendations = await openaiService.generateVisaRecommendations(mockProfile, {
        onRetry: (attempt, error) => {
          toast({
            title: `Tentativa ${attempt}`,
            description: "Testando recomendações de visto...",
          });
        }
      });
      
      setTestResult(JSON.stringify(recommendations, null, 2));
      toast({
        title: "Teste concluído",
        description: "Recomendações de visto geradas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: "Falha ao gerar recomendações de visto.",
        variant: "destructive"
      });
    } finally {
      setIsTestingVisa(false);
    }
  };

  const testDreamActionPlan = async () => {
    setIsTestingDream(true);
    setTestResult(null);
    
    const mockGoal = {
      nome: 'João Silva',
      idade: '35',
      profissao: 'Engenheiro de Software',
      experiencia: '10 anos',
      objetivo_principal: 'Trabalhar nos EUA como desenvolvedor',
      categoria: 'trabalho',
      timeline: '1 ano',
      prioridade: 'alta',
      situacao_atual: 'Trabalho no Brasil, tenho experiência internacional',
      recursos_disponiveis: 'Economias de $50,000',
      obstaculos: 'Não tenho oferta de trabalho ainda',
      detalhes_especificos: 'Especialista em React e Node.js',
      motivacao: 'Crescimento profissional e melhor qualidade de vida'
    };
    
    try {
      const actionPlan = await openaiService.generateDreamActionPlan(mockGoal, {
        onRetry: (attempt, error) => {
          toast({
            title: `Tentativa ${attempt}`,
            description: "Testando plano de ação...",
          });
        }
      });
      
      setTestResult(actionPlan);
      toast({
        title: "Teste concluído",
        description: "Plano de ação gerado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: "Falha ao gerar plano de ação.",
        variant: "destructive"
      });
    } finally {
      setIsTestingDream(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Administração OpenAI
          </h1>
          <p className="text-xl text-gray-600">
            Monitore e configure o serviço de inteligência artificial
          </p>
        </div>

        <Tabs defaultValue="monitor" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monitor" className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Monitor
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configuração
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              Testes
            </TabsTrigger>
          </TabsList>

          {/* Monitor Tab */}
          <TabsContent value="monitor">
            <OpenAIMonitor />
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configurações do Serviço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="timeout">Timeout (ms)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      value={config.timeout}
                      onChange={(e) => setConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                      min="5000"
                      max="120000"
                      step="1000"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Tempo limite para requisições (5s - 120s)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="maxRetries">Máximo de Tentativas</Label>
                    <Input
                      id="maxRetries"
                      type="number"
                      value={config.maxRetries}
                      onChange={(e) => setConfig(prev => ({ ...prev, maxRetries: parseInt(e.target.value) }))}
                      min="1"
                      max="10"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Número máximo de tentativas em caso de falha
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="retryDelay">Delay entre Tentativas (ms)</Label>
                    <Input
                      id="retryDelay"
                      type="number"
                      value={config.retryDelay}
                      onChange={(e) => setConfig(prev => ({ ...prev, retryDelay: parseInt(e.target.value) }))}
                      min="100"
                      max="10000"
                      step="100"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Tempo de espera entre tentativas (com backoff exponencial)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="temperature">Temperature</Label>
                    <Input
                      id="temperature"
                      type="number"
                      value={config.temperature}
                      onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                      min="0"
                      max="2"
                      step="0.1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Criatividade das respostas (0 = determinística, 2 = muito criativa)
                    </p>
                  </div>
                </div>

                <Button onClick={handleConfigUpdate} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Tab */}
          <TabsContent value="test">
            <div className="space-y-6">
              {/* Chat Response Test */}
              <Card>
                <CardHeader>
                  <CardTitle>Teste de Resposta do Chat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="testMessage">Mensagem de Teste</Label>
                    <Input
                      id="testMessage"
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      placeholder="Digite uma mensagem para testar..."
                    />
                  </div>
                  <Button 
                    onClick={testChatResponse} 
                    disabled={isTestingChat}
                    className="w-full"
                  >
                    {isTestingChat ? 'Testando...' : 'Testar Chat Response'}
                  </Button>
                </CardContent>
              </Card>

              {/* Visa Recommendations Test */}
              <Card>
                <CardHeader>
                  <CardTitle>Teste de Recomendações de Visto</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={testVisaRecommendations} 
                    disabled={isTestingVisa}
                    className="w-full"
                  >
                    {isTestingVisa ? 'Testando...' : 'Testar Recomendações de Visto'}
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    Usa um perfil de exemplo para testar as recomendações
                  </p>
                </CardContent>
              </Card>

              {/* Dream Action Plan Test */}
              <Card>
                <CardHeader>
                  <CardTitle>Teste de Plano de Ação</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={testDreamActionPlan} 
                    disabled={isTestingDream}
                    className="w-full"
                  >
                    {isTestingDream ? 'Testando...' : 'Testar Plano de Ação'}
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    Usa um objetivo de exemplo para testar a geração de planos
                  </p>
                </CardContent>
              </Card>

              {/* Test Results */}
              {testResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>Resultado do Teste</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">
                        {testResult}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default AdminOpenAI;
