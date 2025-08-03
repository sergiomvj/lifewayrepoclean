import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, ArrowRight, RotateCcw, FileText, Clock, DollarSign, Users, Lock, User } from "lucide-react";
import { openaiService } from "@/services/openaiService";
import { useUserContext } from '@/hooks/useUserContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Question {
  id: string;
  question: string;
  options: { value: string; label: string; }[];
}

interface VisaRecommendation {
  type: string;
  name: string;
  match: number;
  description: string;
  requirements: string[];
  timeline: string;
  cost: string;
  pros: string[];
  cons: string[];
}

const VisaMatch = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [recommendations, setRecommendations] = useState<VisaRecommendation[]>([]);
  const { user, isLoading } = useUserContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Obter usuário autenticado do Supabase
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setCurrentUser(authUser);
    };
    getCurrentUser();
  }, []);

  // Verificação de autenticação obrigatória
  useEffect(() => {
    if (!isLoading && !currentUser) {
      toast({
        title: "Acesso restrito",
        description: "Você precisa estar logado para usar o VisaMatch. Faça login ou cadastre-se para continuar.",
        variant: "destructive"
      });
      navigate('/profile');
      return;
    }
  }, [currentUser, isLoading, navigate, toast]);

  const questions: Question[] = [
    {
      id: 'purpose',
      question: 'Qual é o seu principal objetivo nos EUA?',
      options: [
        { value: 'work', label: 'Trabalhar' },
        { value: 'study', label: 'Estudar' },
        { value: 'invest', label: 'Investir/Empreender' },
        { value: 'family', label: 'Reunificação Familiar' },
        { value: 'visit', label: 'Visitar/Turismo' }
      ]
    },
    {
      id: 'education',
      question: 'Qual é o seu nível de educação?',
      options: [
        { value: 'highschool', label: 'Ensino Médio' },
        { value: 'bachelor', label: 'Graduação' },
        { value: 'master', label: 'Mestrado' },
        { value: 'phd', label: 'Doutorado' },
        { value: 'professional', label: 'Certificação Profissional' }
      ]
    },
    {
      id: 'experience',
      question: 'Quantos anos de experiência profissional você tem?',
      options: [
        { value: '0-2', label: '0-2 anos' },
        { value: '3-5', label: '3-5 anos' },
        { value: '6-10', label: '6-10 anos' },
        { value: '10+', label: 'Mais de 10 anos' }
      ]
    },
    {
      id: 'jobOffer',
      question: 'Você tem uma oferta de trabalho nos EUA?',
      options: [
        { value: 'yes', label: 'Sim, já tenho' },
        { value: 'process', label: 'Estou em processo' },
        { value: 'no', label: 'Não tenho' }
      ]
    },
    {
      id: 'investment',
      question: 'Qual é sua capacidade de investimento?',
      options: [
        { value: 'low', label: 'Até $50,000' },
        { value: 'medium', label: '$50,000 - $500,000' },
        { value: 'high', label: '$500,000 - $1,000,000' },
        { value: 'very-high', label: 'Mais de $1,000,000' }
      ]
    },
    {
      id: 'timeline',
      question: 'Qual é seu prazo desejado para imigrar?',
      options: [
        { value: 'immediate', label: 'Imediatamente' },
        { value: '6months', label: '6 meses' },
        { value: '1year', label: '1 ano' },
        { value: '2years', label: '2+ anos' }
      ]
    }
  ];

  const handleAnswer = (value: string) => {
    const currentQuestion = questions[currentStep];
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const nextStep = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateRecommendations();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateRecommendations = async () => {
    try {
      // Use enhanced OpenAI service with retry logic and better error handling
      const aiRecommendations = await openaiService.generateVisaRecommendations(answers, {
        onRetry: (attempt, error) => {
          console.log(`Tentativa ${attempt} falhou, tentando novamente...`, error.message);
        },
        onSuccess: (response, duration) => {
          console.log(`Recomendações geradas com sucesso em ${duration}ms`);
        },
        onError: (error, attempts) => {
          console.error(`Falha após ${attempts} tentativas:`, error.message);
        }
      });
      
      if (aiRecommendations && Array.isArray(aiRecommendations)) {
        setRecommendations(aiRecommendations.sort((a, b) => b.match - a.match));
        setShowResults(true);
        return;
      }
    } catch (error) {
      console.error('Erro ao gerar recomendações com IA:', error);
    }

    // Fallback para lógica local
    const recs: VisaRecommendation[] = [];

    // Lógica de recomendação baseada nas respostas
    if (answers.purpose === 'work' && answers.jobOffer === 'yes') {
      recs.push({
        type: 'H1-B',
        name: 'Visto H1-B - Trabalhador Especializado',
        match: 95,
        description: 'Ideal para profissionais com oferta de trabalho em área especializada',
        requirements: ['Diploma universitário', 'Oferta de trabalho', 'Empresa patrocinadora'],
        timeline: '6-12 meses',
        cost: '$3,000 - $5,000',
        pros: ['Permite trabalho legal', 'Caminho para Green Card', 'Família pode acompanhar'],
        cons: ['Dependente do empregador', 'Processo competitivo', 'Limitações de mudança de emprego']
      });
    }

    if (answers.purpose === 'invest' && (answers.investment === 'high' || answers.investment === 'very-high')) {
      recs.push({
        type: 'EB-5',
        name: 'Visto EB-5 - Investidor',
        match: 90,
        description: 'Para investidores com capital substancial para criar empregos nos EUA',
        requirements: ['Investimento mínimo $800,000', 'Criar 10 empregos', 'Projeto aprovado'],
        timeline: '2-3 anos',
        cost: '$800,000 - $1,050,000+',
        pros: ['Green Card direto', 'Família incluída', 'Liberdade de residência'],
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

    if (answers.purpose === 'work' && answers.jobOffer === 'no' && answers.investment === 'medium') {
      recs.push({
        type: 'E-2',
        name: 'Visto E-2 - Investidor de Tratado',
        match: 75,
        description: 'Para investidores de países com tratado comercial com os EUA',
        requirements: ['Nacionalidade de país com tratado', 'Investimento substancial', 'Negócio ativo'],
        timeline: '3-6 meses',
        cost: '$50,000 - $200,000+',
        pros: ['Renovável indefinidamente', 'Família incluída', 'Flexibilidade de negócio'],
        cons: ['Dependente do negócio', 'Não leva ao Green Card', 'Requer nacionalidade específica']
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

    setRecommendations(recs.sort((a, b) => b.match - a.match));
    setShowResults(true);
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResults(false);
    setRecommendations([]);
  };

  const progress = ((currentStep + 1) / questions.length) * 100;

  // Tela de bloqueio para usuários não autenticados
  if (!currentUser && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cinza-claro to-white flex items-center justify-center">
        <div className="max-w-md mx-auto p-8">
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <Lock className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-baskerville text-petroleo mb-2">
                Acesso Restrito
              </CardTitle>
              <p className="text-gray-600">
                Você precisa estar logado para usar o VisaMatch.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                Faça login ou cadastre-se para descobrir o visto ideal para seu perfil.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => navigate('/profile')} 
                  className="bg-petroleo hover:bg-petroleo/90 flex-1"
                >
                  <User className="w-4 h-4 mr-2" />
                  Entrar/Cadastrar
                </Button>
                <Button 
                  onClick={() => navigate('/')} 
                  variant="outline" 
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Início
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cinza-claro to-white">
        <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <Link to="/" className="flex items-center space-x-2">
              <ArrowLeft className="w-5 h-5 text-petroleo" />
              <span className="text-petroleo font-figtree font-medium">Voltar</span>
            </Link>
          </div>
        </header>
        
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
              <h1 className="text-4xl font-baskerville font-bold text-petroleo">
                Suas Recomendações
              </h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto mb-6">
              Baseado no seu perfil, encontramos {recommendations.length} opção(ões) de visto que podem ser adequadas para você.
            </p>
            <Button onClick={resetQuiz} variant="outline" className="mb-8">
              <RotateCcw className="w-4 h-4 mr-2" />
              Refazer Análise
            </Button>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {recommendations.map((rec, index) => (
              <Card key={rec.type} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-petroleo to-petroleo/80 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">{rec.name}</CardTitle>
                      <p className="text-white/90">{rec.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{rec.match}%</div>
                      <div className="text-sm text-white/80">Compatibilidade</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-petroleo" />
                      <div>
                        <div className="font-semibold">Timeline</div>
                        <div className="text-gray-600">{rec.timeline}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-petroleo" />
                      <div>
                        <div className="font-semibold">Custo Estimado</div>
                        <div className="text-gray-600">{rec.cost}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-petroleo" />
                      <div>
                        <div className="font-semibold">Tipo</div>
                        <div className="text-gray-600">{rec.type}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-petroleo mb-3">Requisitos Principais</h4>
                      <ul className="space-y-2">
                        {rec.requirements.map((req, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-green-600 mb-2">Vantagens</h4>
                        <ul className="space-y-1">
                          {rec.pros.map((pro, i) => (
                            <li key={i} className="text-sm text-gray-600">• {pro}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-orange-600 mb-2">Considerações</h4>
                        <ul className="space-y-1">
                          {rec.cons.map((con, i) => (
                            <li key={i} className="text-sm text-gray-600">• {con}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-petroleo mb-4">
                  Próximos Passos
                </h3>
                <p className="text-gray-600 mb-4">
                  Esta análise é uma orientação inicial. Recomendamos consultar um advogado de imigração 
                  especializado para uma avaliação detalhada do seu caso específico.
                </p>
                <div className="flex justify-center space-x-4">
                  <Button asChild className="bg-petroleo hover:bg-petroleo/90">
                    <Link to="/especialista">
                      <Users className="w-4 h-4 mr-2" />
                      Falar com Especialista
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/dreams">
                      Criar Plano de Ação
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cinza-claro to-white">
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="flex items-center space-x-2">
            <ArrowLeft className="w-5 h-5 text-petroleo" />
            <span className="text-petroleo font-figtree font-medium">Voltar</span>
          </Link>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
            <h1 className="text-4xl font-baskerville font-bold text-petroleo">
              VisaMatch
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Análise inteligente para descobrir o visto ideal para seu perfil. 
            Responda algumas perguntas e receba recomendações personalizadas.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                Pergunta {currentStep + 1} de {questions.length}
              </span>
              <span className="text-sm text-gray-600">
                {Math.round(progress)}% completo
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {questions[currentStep].question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={answers[questions[currentStep].id] || ''} 
                onValueChange={handleAnswer}
                className="space-y-4"
              >
                {questions[currentStep].options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="flex justify-between mt-8">
                <Button 
                  onClick={prevStep} 
                  disabled={currentStep === 0}
                  variant="outline"
                >
                  Anterior
                </Button>
                <Button 
                  onClick={nextStep}
                  disabled={!answers[questions[currentStep].id]}
                  className="bg-petroleo hover:bg-petroleo/90"
                >
                  {currentStep === questions.length - 1 ? (
                    <>
                      Ver Resultados
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Próxima
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VisaMatch;