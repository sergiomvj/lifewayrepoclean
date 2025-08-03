import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PersonalizedDashboard from '@/components/PersonalizedDashboard';
import UserContextManager from '@/components/UserContextManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, BarChart3, Lock, User, Heart, Target, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Componente para os cards das ferramentas principais
interface ToolsCardsProps {
  currentUser: any;
}

const ToolsCards: React.FC<ToolsCardsProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [hasProfile, setHasProfile] = useState<boolean>(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  // Verificar se o usuário tem perfil completo
  useEffect(() => {
    const checkUserProfile = async () => {
      if (!currentUser?.id) {
        setHasProfile(false);
        setIsCheckingProfile(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao verificar perfil:', error);
          setHasProfile(false);
        } else {
          const profileExists = !!data;
          setHasProfile(profileExists);
          console.log('✅ Perfil encontrado:', profileExists);
        }
      } catch (error) {
        console.error('Erro na verificação do perfil:', error);
        setHasProfile(false);
      } finally {
        setIsCheckingProfile(false);
      }
    };

    checkUserProfile();
  }, [currentUser]);

  // Definição das 3 ferramentas principais
  const mainTools = [
    {
      id: 'dreams',
      name: 'Criador de Sonhos',
      description: 'Visualize e planeje sua nova vida nos EUA com sua família',
      icon: Heart,
      route: '/dreams',
      color: 'bg-pink-500',
      lightColor: 'bg-pink-50',
      textColor: 'text-pink-600'
    },
    {
      id: 'visa_match',
      name: 'VisaMatch',
      description: 'Descubra qual visto americano é ideal para seu perfil',
      icon: Target,
      route: '/visa-match',
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      id: 'specialist_chat',
      name: 'Chat com Especialista',
      description: 'Converse com especialistas em imigração americana',
      icon: MessageCircle,
      route: '/chat',
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      textColor: 'text-green-600'
    }
  ];

  const handleToolClick = (tool: any) => {
    if (!hasProfile) {
      // Redirecionar para criação de perfil se não tiver perfil completo
      navigate('/profile');
      return;
    }
    
    // Navegar para a ferramenta se tiver perfil completo
    navigate(tool.route);
  };

  if (isCheckingProfile) {
    return (
      <div className="mt-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-1">
      <div className="mb-1">
        <h2 className="text-base font-bold text-gray-900 mb-0">
          Ferramentas Principais
        </h2>
        <p className="text-xs text-gray-600">
          {hasProfile 
            ? 'Acesse suas ferramentas de imigração favoritas'
            : 'Complete seu perfil para desbloquear todas as ferramentas'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
        {mainTools.map((tool) => {
          const IconComponent = tool.icon;
          const isDisabled = !hasProfile;
          
          return (
            <Card 
              key={tool.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isDisabled 
                  ? 'opacity-50 hover:opacity-60' 
                  : 'hover:scale-105'
              }`}
              onClick={() => handleToolClick(tool)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    isDisabled ? 'bg-gray-100' : tool.lightColor
                  }`}>
                    <IconComponent className={`h-5 w-5 ${
                      isDisabled ? 'text-gray-400' : tool.textColor
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold text-base mb-1 ${
                      isDisabled ? 'text-gray-400' : 'text-gray-900'
                    }`}>
                      {tool.name}
                    </h3>
                    <p className={`text-xs mb-3 ${
                      isDisabled ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {tool.description}
                    </p>
                    <div className="flex items-center justify-between">
                      {isDisabled ? (
                        <span className="text-xs text-gray-400 font-medium">
                          Complete seu perfil
                        </span>
                      ) : (
                        <span className={`text-xs font-medium ${tool.textColor}`}>
                          Clique para acessar
                        </span>
                      )}
                      <ArrowRight className={`h-4 w-4 ${
                        isDisabled ? 'text-gray-300' : tool.textColor
                      }`} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!hasProfile && (
        <div className="mt-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Complete seu perfil</strong> para desbloquear todas as ferramentas e ter uma experiência personalizada.
              <Button 
                variant="link" 
                className="p-0 ml-2 h-auto text-sm"
                onClick={() => navigate('/profile')}
              >
                Criar perfil agora →
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar autenticação obrigatória
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            title: "Acesso restrito",
            description: "Você precisa fazer login para acessar o My LifeWay.",
            variant: "destructive"
          });
          navigate('/profile');
          return;
        }
        
        setCurrentUser(user);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        navigate('/profile');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate, toast]);

  // Tela de carregamento
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Tela de bloqueio para usuários não autenticados
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="text-center">
            <CardContent className="p-12">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Lock className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Acesso Restrito ao My LifeWay
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Para acessar seu dashboard personalizado, você precisa fazer login ou criar uma conta.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => navigate('/profile')} className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Fazer Login / Cadastrar
                </Button>
                <Button variant="outline" onClick={() => navigate('/')}>
                  Voltar ao Início
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-2 py-2">
        {/* Header */}
        <div className="mb-1">
          <h1 className="text-lg font-bold text-gray-900 mb-0">
            Bem-vindo ao My LifeWay! 👋
          </h1>
          <p className="text-xs text-gray-600">
            Acompanhe seu progresso na jornada de imigração para os EUA
          </p>
        </div>

        {/* CONTAINER COMPACTO - TODO O DASHBOARD */}
        <div style={{padding: '5px', margin: '0px', backgroundColor: '#f8f9fa', border: '1px solid #e9ecef'}}>
          
          {/* Dashboard Personalizado */}
          <div style={{marginBottom: '5px'}}>
            <PersonalizedDashboard />
          </div>
          
          {/* Cards das Ferramentas Principais */}
          <div style={{marginBottom: '5px'}}>
            <ToolsCards currentUser={currentUser} />
          </div>
          
          {/* Informações Adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-2" style={{gap: '5px'}}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Como usar o Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Visão Geral</p>
                  <p className="text-xs text-gray-600">Veja seu progresso geral e estatísticas principais</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Progresso</p>
                  <p className="text-xs text-gray-600">Acompanhe seu avanço em cada etapa da jornada</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Conquistas</p>
                  <p className="text-xs text-gray-600">Desbloqueie achievements conforme avança</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">4</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Dados</p>
                  <p className="text-xs text-gray-600">Gerencie a sincronização entre suas ferramentas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Próximos Passos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                <p className="font-medium text-green-800 text-sm">✓ Dashboard Integrado</p>
                <p className="text-xs text-green-600">Seu dashboard está funcionando perfeitamente!</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-medium text-blue-800 text-sm">🚀 Ferramentas Disponíveis</p>
                <p className="text-xs text-blue-600">Criador de Sonhos, VisaMatch, Chat com Especialista</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg border border-purple-200">
                <p className="font-medium text-purple-800 text-sm">📊 Analytics Ativos</p>
                <p className="text-xs text-purple-600">Seus dados estão sendo sincronizados automaticamente</p>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
