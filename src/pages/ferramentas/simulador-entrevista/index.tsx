import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Mic, 
  Brain, 
  Award, 
  FileText, 
  Target,
  CheckCircle,
  Clock,
  ArrowRight,
  Users,
  Zap,
  BookOpen,
  TrendingUp,
  Play
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SimuladorEntrevistaInfo = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <MessageCircle className="w-12 h-12 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Simulador de Entrevista</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Simulação realista da entrevista no consulado americano com perguntas personalizadas, 
            avaliação inteligente e feedback construtivo para maximizar suas chances de aprovação
          </p>
          <Badge className="mt-4 bg-indigo-100 text-indigo-800 border-indigo-200">
            🚧 Em Desenvolvimento
          </Badge>
        </div>

        {/* Objetivo Principal */}
        <Card className="mb-8 border-l-4 border-l-indigo-500">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-indigo-600" />
              Objetivo Principal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              Preparar você para a entrevista no consulado americano através de simulações realistas, 
              com perguntas personalizadas baseadas no seu perfil e tipo de visto, oferecendo 
              feedback construtivo e dicas práticas para aumentar suas chances de aprovação.
            </p>
          </CardContent>
        </Card>

        {/* Como Funciona */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="w-5 h-5 mr-2 text-blue-600" />
                IA Personalizada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Análise do seu perfil completo</span>
              </div>
              <div className="flex items-center">
                <Target className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Perguntas por tipo de visto</span>
              </div>
              <div className="flex items-center">
                <Zap className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Cenários realistas</span>
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Avaliação em tempo real</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-5 h-5 mr-2 text-indigo-600" />
                Feedback Inteligente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center">
                <MessageCircle className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Análise das suas respostas</span>
              </div>
              <div className="flex items-center">
                <BookOpen className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Dicas de melhoria</span>
              </div>
              <div className="flex items-center">
                <Mic className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Suporte a texto e áudio</span>
              </div>
              <div className="flex items-center">
                <Award className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Score de preparação</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modos de Simulação */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Modos de Simulação</CardTitle>
            <CardDescription>
              Diferentes níveis de preparação para sua entrevista
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border">
                <div className="flex items-center mb-4">
                  <BookOpen className="w-8 h-8 text-green-600 mr-3" />
                  <h3 className="font-bold text-lg text-green-700">Modo Treino</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Perguntas básicas por categoria
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Feedback imediato
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Dicas e orientações
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Sem limite de tempo
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-lg border">
                <div className="flex items-center mb-4">
                  <Zap className="w-8 h-8 text-red-600 mr-3" />
                  <h3 className="font-bold text-lg text-red-700">Modo Desafio</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-red-500 mr-2" />
                    Simulação completa da entrevista
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-red-500 mr-2" />
                    Perguntas complexas e específicas
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-red-500 mr-2" />
                    Tempo limitado por resposta
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-red-500 mr-2" />
                    Avaliação final detalhada
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exemplo de Simulação */}
        <Card className="mb-8 bg-gradient-to-r from-indigo-50 to-blue-50">
          <CardHeader>
            <CardTitle>Exemplo de Simulação</CardTitle>
            <CardDescription>
              Veja como funciona na prática
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border-l-4 border-l-blue-500">
                <h4 className="font-semibold text-blue-700 mb-2">🎯 Pergunta Personalizada</h4>
                <p className="text-sm text-gray-700 italic mb-2">
                  "Vejo que você é desenvolvedor de software e quer trabalhar em Austin, Texas. 
                  Por que especificamente Austin e não outras cidades com mercado de tecnologia?"
                </p>
                <Badge className="bg-blue-100 text-blue-800 text-xs">Baseada no seu perfil</Badge>
              </div>
              <div className="bg-white p-4 rounded-lg border-l-4 border-l-green-500">
                <h4 className="font-semibold text-green-700 mb-2">✅ Feedback Inteligente</h4>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Pontos Fortes:</strong> Demonstrou conhecimento específico sobre o mercado de Austin<br/>
                  <strong>Melhoria:</strong> Mencione conexões específicas com empresas ou universidades locais
                </p>
                <Badge className="bg-green-100 text-green-800 text-xs">Score: 8.5/10</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status de Desenvolvimento */}
        <Card className="mb-8 bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-800">Status de Desenvolvimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-sm">Backend de IA implementado</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-sm">Sistema de perguntas personalizadas</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-amber-500 mr-2" />
                <span className="text-sm">Interface de chat/áudio em desenvolvimento</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-amber-500 mr-2" />
                <span className="text-sm">Sistema de avaliação em refinamento</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => navigate('/visa-match')}
          >
            <Play className="w-4 h-4 mr-2" />
            Usar VisaMatch Primeiro
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimuladorEntrevistaInfo;
