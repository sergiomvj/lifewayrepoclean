import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CreateProfile from '@/components/CreateProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Edit, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Globe, 
  Target,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Settings,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useUserContext } from '@/hooks/useUserContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useUserContext();
  const { 
    profile, 
    isLoading, 
    hasProfile, 
    createProfile, 
    updateProfile, 
    deleteProfile,
    refreshProfile,
    isCreating,
    isUpdating
  } = useProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Verificar estado de autenticação do Supabase diretamente
  useEffect(() => {
    const getAuthUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setAuthUser(currentUser);
        
        // Se não há usuário autenticado, redirecionar para login
        if (!currentUser) {
          navigate('/login');
          return;
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        navigate('/login');
      } finally {
        setAuthLoading(false);
      }
    };

    getAuthUser();

    // Escutar mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthUser(session?.user || null);
      setAuthLoading(false);
      
      // Se usuário fez logout, redirecionar para login
      if (!session?.user) {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Mostrar loading enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não há usuário autenticado, não renderizar nada (já redirecionou)
  if (!authUser && !user) {
    return null;
  }

  const handleProfileCreated = (newProfile: any) => {
    setShowCreateForm(false);
    refreshProfile();
  };

  const handleDeleteProfile = async () => {
    if (window.confirm('Tem certeza que deseja excluir seu perfil? Esta ação não pode ser desfeita.')) {
      try {
        await deleteProfile();
      } catch (error) {
        console.error('Erro ao excluir perfil:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Carregando perfil...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Se não tem perfil, mostrar opção de criar
  if (!hasProfile || showCreateForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <CreateProfile 
            onComplete={handleProfileCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
              <p className="text-gray-600">Gerencie suas informações pessoais e objetivos</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={refreshProfile}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="personal">Pessoal</TabsTrigger>
            <TabsTrigger value="goals">Objetivos</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Resumo do Perfil */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Resumo do Perfil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{profile?.name}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Profissão</p>
                    <p className="font-medium">{profile?.profession}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Localização</p>
                    <p className="font-medium">
                      {profile?.current_city && `${profile.current_city}, `}{profile?.current_country}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Educação</p>
                    <Badge variant="outline">
                      {profile?.education_level === 'high_school' && 'Ensino Médio'}
                      {profile?.education_level === 'bachelor' && 'Graduação'}
                      {profile?.education_level === 'master' && 'Mestrado'}
                      {profile?.education_level === 'phd' && 'Doutorado'}
                      {profile?.education_level === 'professional' && 'Profissionalizante'}
                      {profile?.education_level === 'other' && 'Outro'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Inglês</p>
                    <Badge variant="outline">
                      {profile?.english_level === 'basic' && 'Básico'}
                      {profile?.english_level === 'intermediate' && 'Intermediário'}
                      {profile?.english_level === 'advanced' && 'Avançado'}
                      {profile?.english_level === 'native' && 'Nativo'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Objetivo Principal</p>
                    <p className="font-medium">{profile?.immigration_goals?.primary_objective}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status do Progresso */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    Objetivos de Imigração
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Categoria:</span>
                    <Badge>
                      {profile?.immigration_goals?.category === 'trabalho' && 'Trabalho'}
                      {profile?.immigration_goals?.category === 'estudo' && 'Estudo'}
                      {profile?.immigration_goals?.category === 'investimento' && 'Investimento'}
                      {profile?.immigration_goals?.category === 'familia' && 'Família'}
                      {profile?.immigration_goals?.category === 'aposentadoria' && 'Aposentadoria'}
                      {profile?.immigration_goals?.category === 'outros' && 'Outros'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Timeline:</span>
                    <span className="text-sm font-medium">{profile?.immigration_goals?.timeline}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Prioridade:</span>
                    <Badge variant={
                      profile?.immigration_goals?.priority === 'alta' ? 'destructive' :
                      profile?.immigration_goals?.priority === 'media' ? 'default' : 'secondary'
                    }>
                      {profile?.immigration_goals?.priority === 'alta' && 'Alta'}
                      {profile?.immigration_goals?.priority === 'media' && 'Média'}
                      {profile?.immigration_goals?.priority === 'baixa' && 'Baixa'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                    Situação Financeira
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Status:</span>
                    <Badge variant="outline">
                      {profile?.current_situation?.employment_status === 'employed' && 'Empregado'}
                      {profile?.current_situation?.employment_status === 'unemployed' && 'Desempregado'}
                      {profile?.current_situation?.employment_status === 'self_employed' && 'Autônomo'}
                      {profile?.current_situation?.employment_status === 'student' && 'Estudante'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Fundos Disponíveis:</span>
                    <span className="text-sm font-medium">
                      {profile?.current_situation?.available_funds?.toLocaleString()} {profile?.current_situation?.available_funds_currency}
                    </span>
                  </div>
                  {profile?.current_situation?.current_salary && (
                    <div className="flex justify-between">
                      <span className="text-sm">Salário Atual:</span>
                      <span className="text-sm font-medium">
                        {profile.current_situation.current_salary.toLocaleString()} {profile?.current_situation?.current_salary_currency}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Nome Completo</Label>
                      <p className="font-medium">{profile?.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Idade</Label>
                      <p className="font-medium">{profile?.age || 'Não informado'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Profissão</Label>
                      <p className="font-medium">{profile?.profession}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Anos de Experiência</Label>
                      <p className="font-medium">{profile?.experience_years || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Estado Civil</Label>
                      <p className="font-medium">
                        {profile?.marital_status === 'single' && 'Solteiro(a)'}
                        {profile?.marital_status === 'married' && 'Casado(a)'}
                        {profile?.marital_status === 'divorced' && 'Divorciado(a)'}
                        {profile?.marital_status === 'widowed' && 'Viúvo(a)'}
                        {!profile?.marital_status && 'Não informado'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Filhos</Label>
                      <p className="font-medium">{profile?.children_count || 0}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">País Atual</Label>
                      <p className="font-medium">{profile?.current_country}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Cidade Atual</Label>
                      <p className="font-medium">{profile?.current_city || 'Não informado'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Objetivos de Imigração</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Objetivo Principal</Label>
                  <p className="font-medium">{profile?.immigration_goals?.primary_objective}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Motivação</Label>
                  <p className="text-sm leading-relaxed">{profile?.immigration_goals?.motivation}</p>
                </div>
                {profile?.immigration_goals?.target_states && profile.immigration_goals.target_states.length > 0 && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Estados de Interesse</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {profile.immigration_goals.target_states.map((state, index) => (
                        <Badge key={index} variant="outline">{state}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {profile?.immigration_goals?.specific_cities && profile.immigration_goals.specific_cities.length > 0 && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Cidades Específicas</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {profile.immigration_goals.specific_cities.map((city, index) => (
                        <Badge key={index} variant="outline">{city}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações do Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Editar Perfil</h4>
                    <p className="text-sm text-muted-foreground">Atualize suas informações pessoais e objetivos</p>
                  </div>
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg border-red-200">
                  <div>
                    <h4 className="font-medium text-red-700">Excluir Perfil</h4>
                    <p className="text-sm text-red-600">Esta ação não pode ser desfeita</p>
                  </div>
                  <Button variant="destructive" onClick={handleDeleteProfile}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Seu perfil foi criado em {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : 'data desconhecida'} 
                    {profile?.updated_at && profile.updated_at !== profile.created_at && 
                      ` e atualizado pela última vez em ${new Date(profile.updated_at).toLocaleDateString('pt-BR')}`
                    }.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

// Componente Label simples (caso não exista)
const Label: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <label className={className}>{children}</label>
);

export default Profile;
