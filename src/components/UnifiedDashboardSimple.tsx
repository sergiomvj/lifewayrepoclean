import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  Clock, 
  Star, 
  Trophy, 
  Download, 
  Share2, 
  RefreshCw,
  Calendar,
  Target,
  Zap,
  Crown,
  Medal,
  Gift,
  Award,
  CheckCircle,
  BarChart3,
  MessageSquare,
  FileText,
  Settings,
  Bell
} from 'lucide-react';

const UnifiedDashboardSimple = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  console.log('UnifiedDashboardSimple: Renderizando...');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Simplificado</h2>
          <p className="text-gray-600">Versão de teste para identificar problemas</p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="progress">Progresso</TabsTrigger>
          <TabsTrigger value="achievements">Conquistas</TabsTrigger>
          <TabsTrigger value="data">Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Progresso Geral</p>
                    <p className="text-2xl font-bold">75%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Trophy className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Conquistas</p>
                    <p className="text-2xl font-bold">12</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">PDFs Gerados</p>
                    <p className="text-2xl font-bold">3</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Chat Sessions</p>
                    <p className="text-2xl font-bold">5</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                  <Target className="h-6 w-6" />
                  Dreams
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                  <Users className="h-6 w-6" />
                  VisaMatch
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                  <MessageSquare className="h-6 w-6" />
                  Chat
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                  <FileText className="h-6 w-6" />
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Progresso da Jornada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Dreams Criados</span>
                  <span className="text-sm text-muted-foreground">8/10</span>
                </div>
                <Progress value={80} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">VisaMatch Análises</span>
                  <span className="text-sm text-muted-foreground">5/5</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Chat Sessions</span>
                  <span className="text-sm text-muted-foreground">3/5</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Suas Conquistas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <h4 className="font-medium">Primeiro Sonho</h4>
                    <p className="text-sm text-gray-600">Criou seu primeiro dream</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Award className="h-8 w-8 text-blue-600" />
                  <div>
                    <h4 className="font-medium">Explorador</h4>
                    <p className="text-sm text-gray-600">Usou todas as ferramentas</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status dos Dados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Sincronização</span>
                  <Badge variant="outline" className="text-green-600">Atualizado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Backup</span>
                  <Badge variant="outline" className="text-blue-600">Completo</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Última atualização</span>
                  <span className="text-sm text-muted-foreground">Agora</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedDashboardSimple;
