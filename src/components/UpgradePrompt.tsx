import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Crown, 
  CheckCircle, 
  Sparkles, 
  ArrowRight,
  FileText,
  MessageSquare,
  BarChart3,
  Calendar,
  Shield,
  Zap,
  Users,
  Star
} from 'lucide-react';

interface UpgradePromptProps {
  trigger?: 'pdf_access' | 'chat_limit' | 'analysis_limit' | 'general';
  onClose?: () => void;
  onUpgrade?: (plan: string) => void;
  className?: string;
}

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  period: string;
  discount?: string;
  popular?: boolean;
  features: string[];
  cta: string;
}

export function UpgradePrompt({ 
  trigger = 'general',
  onClose,
  onUpgrade,
  className = ''
}: UpgradePromptProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  // Mensagens contextuais baseadas no trigger
  const getTriggerMessage = () => {
    switch (trigger) {
      case 'pdf_access':
        return {
          title: 'Acesso ao PDF Expirado',
          description: 'O período gratuito de 60 dias terminou. Faça upgrade para continuar baixando seu PDF personalizado.',
          urgency: 'high'
        };
      case 'chat_limit':
        return {
          title: 'Limite de Chat Atingido',
          description: 'Você atingiu o limite de 30 minutos de chat gratuito. Upgrade para chat ilimitado com especialistas.',
          urgency: 'medium'
        };
      case 'analysis_limit':
        return {
          title: 'Análises Avançadas Bloqueadas',
          description: 'Desbloqueie análises detalhadas do VisaMatch e relatórios personalizados.',
          urgency: 'medium'
        };
      default:
        return {
          title: 'Desbloqueie Todo o Potencial',
          description: 'Acelere sua jornada de imigração com recursos premium e suporte especializado.',
          urgency: 'low'
        };
    }
  };

  const triggerMessage = getTriggerMessage();

  // Planos de preços
  const pricingPlans: PricingPlan[] = [
    {
      id: 'monthly',
      name: 'Mensal',
      price: 'R$ 97',
      period: '/mês',
      features: [
        'PDF ilimitado do Criador de Sonhos',
        'Análises avançadas do VisaMatch',
        'Chat ilimitado com especialistas',
        'Relatórios mensais personalizados',
        'Suporte prioritário 24/7',
        'Atualizações de mudanças legais'
      ],
      cta: 'Começar Agora'
    },
    {
      id: 'annual',
      name: 'Anual',
      price: 'R$ 997',
      originalPrice: 'R$ 1.164',
      period: '/ano',
      discount: '2 meses grátis',
      popular: true,
      features: [
        'Tudo do plano mensal',
        '2 meses grátis (economia de R$ 194)',
        'Consultoria VIP trimestral',
        'Acesso antecipado a novos recursos',
        'Relatório anual de progresso',
        'Garantia de 30 dias'
      ],
      cta: 'Melhor Oferta'
    },
    {
      id: 'lifetime',
      name: 'Vitalício',
      price: 'R$ 2.997',
      period: 'pagamento único',
      discount: 'Economia de 70%',
      features: [
        'Acesso vitalício a todos os recursos',
        'Todas as atualizações futuras incluídas',
        'Consultoria VIP semestral',
        'Acesso beta a novos produtos',
        'Suporte premium dedicado',
        'Garantia vitalícia'
      ],
      cta: 'Investimento Único'
    }
  ];

  // Benefícios por categoria
  const benefitCategories = [
    {
      icon: FileText,
      title: 'Relatórios Premium',
      benefits: [
        'PDF ilimitado com layout premium',
        'Imagens HD selecionadas por IA',
        'Análises detalhadas personalizadas',
        'Templates exclusivos'
      ]
    },
    {
      icon: MessageSquare,
      title: 'Suporte Especializado',
      benefits: [
        'Chat ilimitado com especialistas',
        'Consultoria personalizada',
        'Resposta prioritária em 2h',
        'Acompanhamento de progresso'
      ]
    },
    {
      icon: BarChart3,
      title: 'Análises Avançadas',
      benefits: [
        'VisaMatch com IA avançada',
        'Múltiplas estratégias de visto',
        'Análise de probabilidade detalhada',
        'Comparação de cenários'
      ]
    },
    {
      icon: Calendar,
      title: 'Acompanhamento',
      benefits: [
        'Timeline personalizada',
        'Lembretes automáticos',
        'Marcos de progresso',
        'Relatórios mensais'
      ]
    }
  ];

  const handleUpgrade = async (planId: string) => {
    setIsProcessing(true);
    
    try {
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (onUpgrade) {
        onUpgrade(planId);
      } else {
        // Redirecionar para checkout
        window.location.href = `/checkout?plan=${planId}&trigger=${trigger}`;
      }
    } catch (error) {
      console.error('Erro no upgrade:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`${className} max-w-6xl mx-auto`}>
      {/* Header contextual */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className={`p-3 rounded-full ${
            triggerMessage.urgency === 'high' ? 'bg-red-100' :
            triggerMessage.urgency === 'medium' ? 'bg-amber-100' : 'bg-blue-100'
          }`}>
            <Crown className={`w-8 h-8 ${
              triggerMessage.urgency === 'high' ? 'text-red-600' :
              triggerMessage.urgency === 'medium' ? 'text-amber-600' : 'text-blue-600'
            }`} />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {triggerMessage.title}
        </h1>
        
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {triggerMessage.description}
        </p>

        {/* Oferta especial */}
        {trigger === 'pdf_access' && (
          <Alert className="mt-4 border-green-200 bg-green-50 max-w-md mx-auto">
            <Sparkles className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              <strong>Oferta especial:</strong> 20% de desconto no primeiro mês para você!
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Benefícios por categoria */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {benefitCategories.map((category, index) => (
          <Card key={index} className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <category.icon className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">{category.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {category.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Planos de preços */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Escolha Seu Plano
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {pricingPlans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative ${
                plan.popular 
                  ? 'border-blue-500 shadow-lg scale-105' 
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-3 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}
              
              {plan.discount && (
                <div className="absolute -top-2 -right-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {plan.discount}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-2">
                  <div className="flex items-baseline justify-center space-x-1">
                    <span className="text-3xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  {plan.originalPrice && (
                    <div className="text-sm text-gray-500 line-through">
                      {plan.originalPrice}
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isProcessing}
                  className={`w-full ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                  size="lg"
                >
                  {isProcessing ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>{plan.cta}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Garantias e segurança */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center space-y-2">
            <Shield className="w-8 h-8 text-green-600" />
            <h3 className="font-semibold">Garantia de 30 dias</h3>
            <p className="text-sm text-gray-600">
              Não ficou satisfeito? Devolvemos 100% do seu dinheiro
            </p>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <Zap className="w-8 h-8 text-blue-600" />
            <h3 className="font-semibold">Ativação Imediata</h3>
            <p className="text-sm text-gray-600">
              Acesso instantâneo a todos os recursos premium
            </p>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <Users className="w-8 h-8 text-purple-600" />
            <h3 className="font-semibold">Suporte Especializado</h3>
            <p className="text-sm text-gray-600">
              Equipe de especialistas em imigração disponível 24/7
            </p>
          </div>
        </div>
      </div>

      {/* Depoimentos */}
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold mb-6">O que nossos clientes dizem</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "O PDF do Criador de Sonhos me ajudou a visualizar minha jornada. 
                Em 8 meses consegui meu visto H-1B!"
              </p>
              <div className="text-sm text-gray-600">
                <strong>Maria Silva</strong> - Engenheira de Software
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "O chat com especialistas foi fundamental. Recebi orientação 
                personalizada que fez toda a diferença."
              </p>
              <div className="text-sm text-gray-600">
                <strong>João Santos</strong> - Médico
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer com botão de fechar */}
      {onClose && (
        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            Continuar com plano gratuito
          </Button>
        </div>
      )}
    </div>
  );
}

export default UpgradePrompt;
