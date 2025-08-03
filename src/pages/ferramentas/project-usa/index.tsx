import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Rocket, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign, 
  FileText,
  Target,
  Clock,
  ArrowRight,
  Users,

  BarChart3,
  Bell,
  Home,
  ArrowLeft,
  MapPinned
} from 'lucide-react';

const ProjectUSAInfo = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Rocket className="w-12 h-12 text-purple-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Project USA</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Seu gerente de projeto digital para a mudança definitiva para os Estados Unidos. 
            Planejamento avançado, timeline interativa e acompanhamento completo
          </p>
          <Badge className="mt-4 bg-purple-100 text-purple-800 border-purple-200">
            🚧 Em Desenvolvimento
          </Badge>
        </div>

        {/* Objetivo Principal */}
        <Card className="mb-8 border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-purple-600" />
              Objetivo Principal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              Atuar como um gerente de projeto digital completo, organizando todas as etapas 
              da sua mudança para os EUA em uma timeline interativa com prazos, custos, 
              alertas e acompanhamento de progresso por fases.
            </p>
          </CardContent>
        </Card>

        {/* Como Funciona */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                Integração Inteligente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Dados do VisaMatch</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Análise do FamilyPlanner</span>
              </div>
              <div className="flex items-center">
                <Home className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Perfil familiar completo</span>
              </div>
              <div className="flex items-center">
                <BarChart3 className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Dados de todas as ferramentas</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-purple-600" />
                Gerenciamento Completo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Timeline interativa</span>
              </div>
              <div className="flex items-center">
                <Bell className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Alertas e prazos críticos</span>
              </div>
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Simulação de custos</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Checklist personalizável</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recursos Principais */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recursos Principais</CardTitle>
            <CardDescription>
              Tudo que você precisa para gerenciar sua mudança
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Timeline Interativa</h3>
                <p className="text-sm text-gray-600">
                  Todas as etapas organizadas cronologicamente
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Fases Organizadas</h3>
                <p className="text-sm text-gray-600">
                  Legal, educacional, profissional, habitacional
                </p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <Bell className="w-8 h-8 text-red-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Alertas Críticos</h3>
                <p className="text-sm text-gray-600">
                  Prazos importantes e lembretes automáticos
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Simulação de Custos</h3>
                <p className="text-sm text-gray-600">
                  Orçamento detalhado por etapa
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exemplo de Timeline */}
        <Card className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle>Exemplo de Timeline</CardTitle>
            <CardDescription>
              Veja como o projeto é organizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-green-700">Fase Legal (Meses 1-6)</h4>
                  <p className="text-sm text-gray-600">Documentação, traduções, petição de visto</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Concluído</Badge>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-700">Fase Educacional (Meses 4-8)</h4>
                  <p className="text-sm text-gray-600">Pesquisa de escolas, aplicações, testes</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-700">Fase Habitacional (Meses 10-12)</h4>
                  <p className="text-sm text-gray-600">Busca por moradia, contratos, mudança</p>
                </div>
                <Badge className="bg-gray-100 text-gray-800">Pendente</Badge>
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
                <span className="text-sm">Backend de consolidação implementado</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-sm">Estrutura de dados de projeto</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-amber-500 mr-2" />
                <span className="text-sm">Interface de timeline em desenvolvimento</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-amber-500 mr-2" />
                <span className="text-sm">Sistema de alertas em implementação</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => navigate('/visamatch')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Usar VisaMatch Primeiro
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectUSAInfo;
