import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  DollarSign, 
  PieChart, 
  TrendingUp, 
  FileText, 
  Target,
  CheckCircle,
  Clock,
  ArrowRight,
  Users,
  Home,
  Plane,
  GraduationCap,
  Building2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CalcwayInfo = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Calculator className="w-12 h-12 text-emerald-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Calcway</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Calculadora inteligente de custos para seu projeto de mudança para os EUA. 
            Planejamento financeiro detalhado com estimativas precisas e cenários personalizados
          </p>
          <Badge className="mt-4 bg-emerald-100 text-emerald-800 border-emerald-200">
            🚧 Em Desenvolvimento
          </Badge>
        </div>

        {/* Objetivo Principal */}
        <Card className="mb-8 border-l-4 border-l-emerald-500">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-emerald-600" />
              Objetivo Principal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              Fornecer uma calculadora abrangente e inteligente que estima todos os custos 
              envolvidos no seu projeto de mudança para os Estados Unidos, desde documentação 
              até estabelecimento inicial, com cenários otimistas, realistas e conservadores.
            </p>
          </CardContent>
        </Card>

        {/* Categorias de Custos */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Categorias de Custos</CardTitle>
            <CardDescription>
              Análise completa de todas as despesas envolvidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <FileText className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Documentação</h3>
                <p className="text-sm text-gray-600">
                  Vistos, traduções, apostilamentos, taxas consulares
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Plane className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Viagem</h3>
                <p className="text-sm text-gray-600">
                  Passagens, hospedagem, transporte, seguro viagem
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Home className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Habitação</h3>
                <p className="text-sm text-gray-600">
                  Depósito, aluguel inicial, móveis, utilidades
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <GraduationCap className="w-8 h-8 text-orange-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Educação</h3>
                <p className="text-sm text-gray-600">
                  Escolas, cursos de inglês, materiais, uniformes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Como Funciona */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Entrada Personalizada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Composição familiar</span>
              </div>
              <div className="flex items-center">
                <Building2 className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Tipo de visto desejado</span>
              </div>
              <div className="flex items-center">
                <Home className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Cidade de destino</span>
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Padrão de vida desejado</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-emerald-600" />
                Análise Inteligente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center">
                <Calculator className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Cálculos baseados em dados reais</span>
              </div>
              <div className="flex items-center">
                <PieChart className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">3 cenários (otimista, realista, conservador)</span>
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Timeline de gastos</span>
              </div>
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Relatório detalhado</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recursos Principais */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recursos Principais</CardTitle>
            <CardDescription>
              Ferramentas avançadas para planejamento financeiro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <Calculator className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Cálculos Precisos</h3>
                <p className="text-sm text-gray-600">
                  Estimativas baseadas em dados atualizados do mercado
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <PieChart className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Múltiplos Cenários</h3>
                <p className="text-sm text-gray-600">
                  Planejamento otimista, realista e conservador
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Timeline Financeira</h3>
                <p className="text-sm text-gray-600">
                  Cronograma de gastos mês a mês
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exemplo de Cálculo */}
        <Card className="mb-8 bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardHeader>
            <CardTitle>Exemplo de Cálculo</CardTitle>
            <CardDescription>
              Família de 4 pessoas - Visto EB-5 - Orlando, FL
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-green-700 mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Cenário Otimista
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Documentação:</span>
                    <span className="font-semibold">$8,500</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Viagem:</span>
                    <span className="font-semibold">$4,200</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estabelecimento:</span>
                    <span className="font-semibold">$15,000</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-bold text-green-700">
                    <span>Total:</span>
                    <span>$27,700</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                <h4 className="font-semibold text-blue-700 mb-3 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Cenário Realista
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Documentação:</span>
                    <span className="font-semibold">$12,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Viagem:</span>
                    <span className="font-semibold">$6,500</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estabelecimento:</span>
                    <span className="font-semibold">$22,000</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-bold text-blue-700">
                    <span>Total:</span>
                    <span>$40,500</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-red-700 mb-3 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Cenário Conservador
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Documentação:</span>
                    <span className="font-semibold">$15,500</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Viagem:</span>
                    <span className="font-semibold">$8,800</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estabelecimento:</span>
                    <span className="font-semibold">$30,000</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-bold text-red-700">
                    <span>Total:</span>
                    <span>$54,300</span>
                  </div>
                </div>
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
                <Clock className="w-5 h-5 text-amber-500 mr-2" />
                <span className="text-sm">Pesquisa de dados de custos em andamento</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-amber-500 mr-2" />
                <span className="text-sm">Algoritmos de cálculo em desenvolvimento</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-amber-500 mr-2" />
                <span className="text-sm">Interface de calculadora em design</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-amber-500 mr-2" />
                <span className="text-sm">Sistema de relatórios em planejamento</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => navigate('/profile')}
          >
            <Users className="w-4 h-4 mr-2" />
            Completar Perfil
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CalcwayInfo;
