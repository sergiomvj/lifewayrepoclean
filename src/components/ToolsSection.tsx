import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Clock, Users, Heart, Calculator, Briefcase, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const ToolsSection = () => {
  const ferramentasDisponiveis = [
    {
      titulo: "Criador de Sonhos",
      descricao: "Defina seus objetivos e trace o caminho ideal para alcançá-los",
      icone: Heart,
      link: "/dreams",
      cor: "text-red-500"
    },
    {
      titulo: "VisaMatch",
      descricao: "Análise inteligente para descobrir o visto ideal para seu perfil",
      icone: CheckCircle,
      link: "/visamatch",
      cor: "text-green-500"
    },
    {
      titulo: "Especialista de Plantão",
      descricao: "Chat com nossa IA especializada em imigração americana",
      icone: MessageCircle,
      link: "/especialista",
      cor: "text-blue-500"
    }
  ];

  const ferramentasFuturas = [
    { titulo: "GetOpportunity", icone: Briefcase, link: "/ferramentas/get-opportunity" },
    { titulo: "FamilyPlanner", icone: Users, link: "/ferramentas/family-planner" },
    { titulo: "CalcWay", icone: Calculator, link: "/ferramentas/calcway" },
    { titulo: "ServiceWay", icone: CheckCircle, link: "/ferramentas/service-way" },
    { titulo: "Simulador de Entrevista", icone: MessageCircle, link: "/ferramentas/simulador-entrevista" },
    { titulo: "ProjectUSA", icone: ArrowRight, link: "/ferramentas/project-usa" }
  ];

  return (
    <section id="ferramentas" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Ferramentas Disponíveis */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ferramentas Disponíveis
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Utilize nossas ferramentas especializadas para planejar sua jornada para os Estados Unidos
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {ferramentasDisponiveis.map((ferramenta, index) => {
            const IconComponent = ferramenta.icone;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center ${ferramenta.cor}`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-xl">{ferramenta.titulo}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {ferramenta.descricao}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button asChild className="w-full">
                    <Link to={ferramenta.link}>
                      Usar Ferramenta
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Ferramentas Futuras */}
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Próximas Ferramentas
          </h3>
          <p className="text-gray-600 mb-8">
            Estamos desenvolvendo ainda mais ferramentas para facilitar sua jornada
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {ferramentasFuturas.map((ferramenta, index) => {
            const IconComponent = ferramenta.icone;
            return (
              <Link key={index} to={ferramenta.link} className="group">
                <div className="text-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer">
                  <IconComponent className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <p className="text-sm font-medium text-gray-600 group-hover:text-blue-700">{ferramenta.titulo}</p>
                  <Badge variant="secondary" className="mt-2 group-hover:bg-blue-100">
                    <Clock className="w-3 h-3 mr-1" />
                    Ver detalhes
                  </Badge>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ToolsSection;
