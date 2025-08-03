import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, 
  TrendingUp, 
  Award, 
  DollarSign, 
  Building2,
  Target,
  CheckCircle,
  Clock,
  ArrowRight,
  Users,
  Lightbulb,
  BarChart3,
  ArrowLeft,
  Home
} from 'lucide-react';

const GetOpportunityInfo = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Briefcase className="w-12 h-12 text-green-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Get Opportunity</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore cenários profissionais e empreendedores, descobrindo caminhos realistas 
            nos EUA com base em suas habilidades, experiência e perfil único
          </p>
          <Badge className="mt-4 bg-green-100 text-green-800 border-green-200">
            🚧 Em Desenvolvimento
          </Badge>
        </div>

        {/* Objetivo Principal */}
        <Card className="mb-8 border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-green-600" />
              Objetivo Principal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              Analisar seu perfil profissional completo e mapear oportunidades reais de carreira 
              e empreendedorismo nos Estados Unidos, considerando demandas regionais, 
              compatibilidade de habilidades e potencial de crescimento.
            </p>
          </CardContent>
        </Card>

        {/* Como Funciona */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                Análise de Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center">
                <Briefcase className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Habilidades e experiência profissional</span>
              </div>
              <div className="flex items-center">
                <Award className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Formação e certificações</span>
              </div>
              <div className="flex items-center">
                <Building2 className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Perfil empreendedor</span>
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Análise de currículo/LinkedIn</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Oportunidades Mapeadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center">
                <BarChart3 className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Ocupações em demanda por região</span>
              </div>
              <div className="flex items-center">
                <Target className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Compatibilidade com setores econômicos</span>
              </div>
              <div className="flex items-center">
                <Lightbulb className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Ideias de pequenos negócios</span>
              </div>
              <div className="flex items-center">
                <Award className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Caminhos de certificação</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recursos Principais */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recursos Principais</CardTitle>
            <CardDescription>
              Descubra seu potencial profissional nos EUA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <BarChart3 className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Análise de Mercado</h3>
                <p className="text-sm text-gray-600">
                  Demanda por região e setor econômico
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Target className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Compatibilidade</h3>
                <p className="text-sm text-gray-600">
                  Score de adequação às oportunidades
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Lightbulb className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Empreendedorismo</h3>
                <p className="text-sm text-gray-600">
                  Ideias de negócios personalizadas
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Award className="w-8 h-8 text-orange-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Certificações</h3>
                <p className="text-sm text-gray-600">
                  Caminhos para qualificação profissional
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exemplo de Análise */}
        <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle>Exemplo de Análise</CardTitle>
            <CardDescription>
              Veja como a ferramenta funciona na prática
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-green-700 mb-2">🎯 Oportunidades Identificadas</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Desenvolvedor de Software - Austin, TX (95% compatibilidade)</li>
                  <li>• Consultor em TI - Miami, FL (88% compatibilidade)</li>
                  <li>• Startup de E-commerce - Orlando, FL (Capital necessário: $15k)</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-blue-700 mb-2">📈 Certificações Recomendadas</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• AWS Cloud Practitioner (3 meses)</li>
                  <li>• Project Management Professional - PMP (6 meses)</li>
                  <li>• Google Analytics Certified (1 mês)</li>
                </ul>
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
                <span className="text-sm">Backend de análise implementado</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-sm">Integração com dados de mercado</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-amber-500 mr-2" />
                <span className="text-sm">Interface de usuário em desenvolvimento</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-amber-500 mr-2" />
                <span className="text-sm">Algoritmo de matching em refinamento</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="bg-green-600 hover:bg-green-700"
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

export default GetOpportunityInfo;
