import { Brain, Search, MessageSquare, Calculator, Users, BarChart3, MapPinned, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Ferramentas principais disponíveis
const availableTools = [
  {
    id: 'criador-sonhos',
    icon: Brain,
    title: 'Criador de Sonhos',
    description: 'Defina seus objetivos e trace o caminho ideal para sua jornada de imigração',
    bgColor: 'bg-gradient-to-br from-red-500 to-pink-600',
    textColor: 'text-white',
    iconColor: 'text-pink-200',
    available: true,
    link: '/dreams',
    category: 'Planejamento'
  },
  {
    id: 'visa-match',
    icon: Search,
    title: 'VisaMatch',
    description: 'Análise inteligente para descobrir o visto ideal para seu perfil',
    bgColor: 'bg-gradient-to-br from-green-500 to-emerald-600',
    textColor: 'text-white',
    iconColor: 'text-green-200',
    available: true,
    link: '/visamatch',
    category: 'Análise'
  },
  {
    id: 'especialista',
    icon: MessageSquare,
    title: 'Especialista de Plantão',
    description: 'Chat com nossa IA especializada em imigração americana',
    bgColor: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    textColor: 'text-white',
    iconColor: 'text-blue-200',
    available: true,
    link: '/especialista',
    category: 'Consultoria'
  }
];

// Ferramentas em desenvolvimento
const upcomingTools = [
  {
    id: 'get-opportunity',
    icon: BarChart3,
    title: 'GetOpportunity',
    description: 'Analise oportunidades de trabalho baseadas no seu perfil',
    bgColor: 'bg-gradient-to-br from-purple-500 to-violet-600',
    textColor: 'text-white',
    iconColor: 'text-purple-200',
    available: false,
    category: 'Oportunidades',
    link: '/ferramentas/get-opportunity'
  },
  {
    id: 'family-planner',
    icon: Users,
    title: 'Family Planner',
    description: 'Planeje a mudança de toda sua família de forma organizada',
    bgColor: 'bg-gradient-to-br from-orange-500 to-red-600',
    textColor: 'text-white',
    iconColor: 'text-orange-200',
    available: false,
    category: 'Família',
    link: '/ferramentas/family-planner'
  },
  {
    id: 'calc-way',
    icon: Calculator,
    title: 'CalcWay',
    description: 'Calculadora completa de custos para sua mudança',
    bgColor: 'bg-gradient-to-br from-teal-500 to-cyan-600',
    textColor: 'text-white',
    iconColor: 'text-teal-200',
    available: false,
    category: 'Financeiro',
    link: '/ferramentas/calcway'
  },
  {
    id: 'project-usa',
    icon: MapPinned,
    title: 'ProjectUSA',
    description: 'Gerenciamento completo do seu projeto de mudança',
    bgColor: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    textColor: 'text-white',
    iconColor: 'text-blue-200',
    available: false,
    category: 'Planejamento',
    link: '/ferramentas/project-usa'
  },
  {
    id: 'service-way',
    icon: Users,
    title: 'ServiceWay',
    description: 'Marketplace de profissionais especializados em imigração',
    bgColor: 'bg-gradient-to-br from-green-500 to-emerald-600',
    textColor: 'text-white',
    iconColor: 'text-green-200',
    available: false,
    category: 'Serviços',
    link: '/ferramentas/service-way'
  },
  {
    id: 'simulador-entrevista',
    icon: MessageSquare,
    title: 'Simulador de Entrevista',
    description: 'Prepare-se para a entrevista no consulado americano',
    bgColor: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    textColor: 'text-white',
    iconColor: 'text-indigo-200',
    available: false,
    category: 'Preparação',
    link: '/ferramentas/simulador-entrevista'
  }
];

export default function ToolsShowcase() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-cinza-claro">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-baskerville font-bold text-petroleo mb-4">
            Ferramentas Inteligentes
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-figtree">
            Transforme seu sonho americano em realidade com nossas ferramentas especializadas em imigração
          </p>
        </div>

        {/* Ferramentas Disponíveis */}
        <div className="mb-16">
          <div className="flex items-center justify-center mb-8">
            <Badge className="bg-green-100 text-green-800 px-4 py-2 text-sm font-medium">
              ✅ Disponível Agora
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {availableTools.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <Link key={tool.id} to={tool.link} className="group">
                  <Card className="h-full hover:shadow-xl transition-all duration-300 group-hover:scale-105 border-0 overflow-hidden">
                    <CardContent className="p-0">
                      <div className={`${tool.bgColor} p-8 text-center relative overflow-hidden`}>
                        {/* Background decoration */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute top-4 right-4 w-16 h-16 border border-white rounded-full"></div>
                          <div className="absolute bottom-4 left-4 w-12 h-12 border border-white rounded-full"></div>
                        </div>
                        
                        <div className="relative z-10">
                          <div className="mb-4">
                            <IconComponent className={`w-12 h-12 ${tool.iconColor} mx-auto`} />
                          </div>
                          
                          <h3 className={`text-xl font-baskerville font-bold ${tool.textColor} mb-2`}>
                            {tool.title}
                          </h3>
                          
                          <Badge className="bg-white/20 text-white border-0 mb-4">
                            {tool.category}
                          </Badge>
                          
                          <p className={`${tool.textColor} opacity-90 font-figtree text-sm leading-relaxed`}>
                            {tool.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-6 bg-white">
                        <div className="flex items-center justify-between">
                          <span className="text-petroleo font-medium font-figtree">
                            Usar Ferramenta
                          </span>
                          <div className="w-6 h-6 bg-petroleo rounded-full flex items-center justify-center group-hover:bg-lilas transition-colors">
                            <span className="text-white text-xs">→</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Ferramentas em Desenvolvimento */}
        <div>
          <div className="flex items-center justify-center mb-8">
            <Badge className="bg-orange-100 text-orange-800 px-4 py-2 text-sm font-medium">
              <Clock className="w-4 h-4 mr-2" />
              Em Desenvolvimento
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {upcomingTools.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <Link key={tool.id} to={tool.link} className="group">
                  <Card className="h-full border-2 border-dashed border-gray-300 opacity-75 group-hover:opacity-100 transition-opacity">
                    <CardContent className="p-0">
                      <div className={`${tool.bgColor} p-8 text-center relative overflow-hidden opacity-60 group-hover:opacity-80 transition-opacity`}>
                        {/* Background decoration */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute top-4 right-4 w-16 h-16 border border-white rounded-full"></div>
                          <div className="absolute bottom-4 left-4 w-12 h-12 border border-white rounded-full"></div>
                        </div>
                        
                        <div className="relative z-10">
                          <div className="mb-4">
                            <IconComponent className={`w-12 h-12 ${tool.iconColor} mx-auto`} />
                          </div>
                          
                          <h3 className={`text-xl font-baskerville font-bold ${tool.textColor} mb-2`}>
                            {tool.title}
                          </h3>
                          
                          <Badge className="bg-white/20 text-white border-0 mb-4">
                            {tool.category}
                          </Badge>
                          
                          <p className={`${tool.textColor} opacity-90 font-figtree text-sm leading-relaxed`}>
                            {tool.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-6 bg-gray-50 group-hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-center">
                          <span className="text-gray-600 font-medium font-figtree text-sm group-hover:text-gray-800">
                            Ver detalhes
                          </span>
                          <div className="w-4 h-4 ml-2 text-gray-400 group-hover:text-gray-600 transition-colors">
                            →
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-petroleo to-petroleo/80 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-baskerville font-bold mb-4">
              Pronto para começar sua jornada?
            </h3>
            <p className="text-lg opacity-90 mb-6 font-figtree">
              Use nossas ferramentas gratuitas e descubra o melhor caminho para realizar seu sonho americano
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/dreams"
                className="bg-white text-petroleo px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors font-figtree"
              >
                Começar com Criador de Sonhos
              </Link>
              <Link
                to="/visamatch"
                className="bg-lilas text-white px-8 py-3 rounded-lg font-medium hover:bg-lilas/90 transition-colors font-figtree"
              >
                Descobrir Meu Visto Ideal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
