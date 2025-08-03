import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Handshake, 
  Home, 
  Truck, 
  Calculator, 
  GraduationCap, 
  Star,
  Target,
  CheckCircle,
  Clock,
  ArrowRight,
  Users,
  Shield,
  Award,
  MapPin,
  ArrowLeft
} from 'lucide-react';

const ServiceWayInfo = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Handshake className="w-12 h-12 text-orange-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">ServiceWay</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Marketplace de serviços especializados para sua mudança. Conecte-se com 
            profissionais qualificados em imóveis, mudanças, contabilidade e educação
          </p>
          <Badge className="mt-4 bg-orange-100 text-orange-800 border-orange-200">
            🚧 Em Desenvolvimento
          </Badge>
        </div>

        {/* Objetivo Principal */}
        <Card className="mb-8 border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-orange-600" />
              Objetivo Principal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              Criar conexões diretas com profissionais especializados em mudanças internacionais, 
              oferecendo um marketplace seguro e qualificado para todos os serviços necessários 
              na sua jornada para os Estados Unidos.
            </p>
          </CardContent>
        </Card>

        {/* Serviços Disponíveis */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Serviços Especializados</CardTitle>
            <CardDescription>
              Profissionais qualificados para cada etapa da sua mudança
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Home className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Imobiliário</h3>
                <p className="text-sm text-gray-600">
                  Corretores especializados em clientes internacionais
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Truck className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Mudanças</h3>
                <p className="text-sm text-gray-600">
                  Empresas de mudança internacional
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Calculator className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Contabilidade</h3>
                <p className="text-sm text-gray-600">
                  Contadores especializados em imigração
                </p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <GraduationCap className="w-8 h-8 text-red-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Educação</h3>
                <p className="text-sm text-gray-600">
                  Escolas de inglês e cursos preparatórios
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
                Para Você
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Profissionais pré-qualificados</span>
              </div>
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Avaliações e reviews reais</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Serviços por localização</span>
              </div>
              <div className="flex items-center">
                <Handshake className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Conexão direta e segura</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-5 h-5 mr-2 text-orange-600" />
                Para Profissionais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Acesso a leads qualificados</span>
              </div>
              <div className="flex items-center">
                <Target className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Clientes pré-interessados</span>
              </div>
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Planos de visibilidade</span>
              </div>
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Plataforma confiável</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Planos de Parceria */}
        <Card className="mb-8 bg-gradient-to-r from-orange-50 to-red-50">
          <CardHeader>
            <CardTitle>Planos de Parceria</CardTitle>
            <CardDescription>
              Diferentes níveis de visibilidade para profissionais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                <h3 className="font-bold text-lg mb-2">Free</h3>
                <p className="text-gray-600 text-sm mb-4">Listagem básica</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Perfil básico
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Contato direto
                  </li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg border-2 border-orange-300">
                <h3 className="font-bold text-lg mb-2 text-orange-600">Pro</h3>
                <p className="text-gray-600 text-sm mb-4">Destaque moderado</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Tudo do Free
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Badge "Pro"
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Prioridade nas buscas
                  </li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg border-2 border-red-300">
                <h3 className="font-bold text-lg mb-2 text-red-600">Premium</h3>
                <p className="text-gray-600 text-sm mb-4">Máxima visibilidade</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Tudo do Pro
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Destaque especial
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Leads exclusivos
                  </li>
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
                <span className="text-sm">Estrutura de banco de dados</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-sm">Sistema de parceiros</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-amber-500 mr-2" />
                <span className="text-sm">Interface de marketplace</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-amber-500 mr-2" />
                <span className="text-sm">Sistema de leads e avaliações</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="bg-orange-600 hover:bg-orange-700"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => navigate('/destinos')}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Explorar Destinos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceWayInfo;
