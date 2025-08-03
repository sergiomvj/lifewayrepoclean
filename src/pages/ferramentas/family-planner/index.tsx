import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  Plane, 
  Home,
  GraduationCap,
  Building2,
  ArrowRight,
  Clock,
  Target,
  ArrowLeft
} from 'lucide-react';

const FamilyPlannerInfo = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Users className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Family Planner</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Crie roteiros personalizados de viagem com foco em turismo, prospecção e avaliação real 
            de possíveis locais para viver, estudar e trabalhar nos EUA
          </p>
          <Badge className="mt-4 bg-blue-100 text-blue-800 border-blue-200">
            🚧 Em Desenvolvimento
          </Badge>
        </div>

        {/* Objetivo Principal */}
        <Card className="mb-8 border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Objetivo Principal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              Transformar informações familiares em um itinerário sob medida, combinando turismo 
              inteligente com prospecção estratégica para avaliar realmente onde sua família 
              pode prosperar nos Estados Unidos.
            </p>
          </CardContent>
        </Card>

        {/* Como Funciona */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-green-600" />
                Entrada de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Perfil familiar completo</span>
              </div>
              <div className="flex items-center">
                <GraduationCap className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Necessidades educacionais</span>
              </div>
              <div className="flex items-center">
                <Building2 className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Objetivos profissionais</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Cidades de interesse</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
                Saída Inteligente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Sugestões de cidades personalizadas</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Roteiro otimizado de viagem</span>
              </div>
              <div className="flex items-center">
                <Home className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Locais recomendados para visita</span>
              </div>
              <div className="flex items-center">
                <Plane className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Simulador de viagem de prospecção</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recursos Principais */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recursos Principais</CardTitle>
            <CardDescription>
              O que torna o Family Planner único
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Sugestões Inteligentes</h3>
                <p className="text-sm text-gray-600">
                  Cidades recomendadas com base no perfil familiar completo
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Calendar className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Roteiro Otimizado</h3>
                <p className="text-sm text-gray-600">
                  Tempo, deslocamento e prioridades calculados automaticamente
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Checklist Completo</h3>
                <p className="text-sm text-gray-600">
                  Lista de prospecção personalizada por cidade
                </p>
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
                <span className="text-sm">Estrutura de dados implementada</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-sm">Integração com base de cidades</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-amber-500 mr-2" />
                <span className="text-sm">Interface de usuário em desenvolvimento</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-amber-500 mr-2" />
                <span className="text-sm">Algoritmo de IA em refinamento</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700"
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

export default FamilyPlannerInfo;
