import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  TestTube, 
  User, 
  Bell, 
  Shield, 
  Database,
  Zap,
  FileText,
  Brain,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ToolTester from '../components/ToolTester';
import SystemDiagnostics from '@/components/SystemDiagnostics';

const Configuracoes: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('geral');

  // Verificar autenticação usando a mesma lógica do Dashboard
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acesso Restrito
          </h2>
          <p className="text-gray-600">
            Você precisa estar logado para acessar as configurações.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          </div>
          <p className="text-gray-600">
            Gerencie suas preferências, teste ferramentas e configure sua conta
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="geral" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="sistema" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Sistema
            </TabsTrigger>
            <TabsTrigger value="testes" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Testes
            </TabsTrigger>
            <TabsTrigger value="perfil" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="notificacoes" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
          </TabsList>

          {/* Aba Geral */}
          <TabsContent value="geral" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações da Conta */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Informações da Conta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{currentUser?.id || 'Não disponível'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">ID do Usuário</label>
                    <p className="text-xs text-gray-500 font-mono">{currentUser?.id || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Tipo de Conta</label>
                    <Badge variant="secondary">
                      FREE
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Estatísticas do Sistema */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-green-600" />
                    Status do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Banco de Dados</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Online
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">API OpenAI</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Conectado
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Geração PDF</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Disponível
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba Sistema */}
          <TabsContent value="sistema" className="space-y-6">
            <SystemDiagnostics />
          </TabsContent>

          {/* Aba Testes */}
          <TabsContent value="testes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5 text-purple-600" />
                  Ferramenta de Testes das Ferramentas
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Teste o funcionamento completo das ferramentas: formulários, banco de dados, 
                  integração OpenAI e geração de PDF.
                </p>
              </CardHeader>
              <CardContent>
                <ToolTester />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Perfil */}
          <TabsContent value="perfil" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Configurações do Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Configurações de perfil serão implementadas em breve.
                </p>
                <Button variant="outline" disabled>
                  Editar Perfil
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Notificações */}
          <TabsContent value="notificacoes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-yellow-600" />
                  Configurações de Notificações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Configurações de notificações serão implementadas em breve.
                </p>
                <Button variant="outline" disabled>
                  Configurar Notificações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Configuracoes;
