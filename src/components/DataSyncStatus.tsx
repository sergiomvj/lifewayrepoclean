import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Database, 
  Zap,
  Settings,
  Info,
  AlertCircle,
  Loader2,
  ArrowRightLeft,
  Star,
  Target,
  MessageSquare,
  FileText
} from 'lucide-react';
import { useDataSync, useSyncStatus, useSyncConflicts } from '@/hooks/useDataSync';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DataSyncStatusProps {
  variant?: 'full' | 'compact' | 'indicator';
  showControls?: boolean;
  showConflicts?: boolean;
  className?: string;
}

export function DataSyncStatus({
  variant = 'compact',
  showControls = true,
  showConflicts = true,
  className = ''
}: DataSyncStatusProps) {
  const {
    syncStatus,
    isSyncing,
    syncError,
    forceSyncAll,
    clearSyncErrors
  } = useDataSync();

  const {
    healthColor,
    healthMessage,
    lastSyncText,
    refreshStatus
  } = useSyncStatus();

  const {
    pendingConflicts,
    totalConflicts,
    resolveConflict,
    clearAllConflicts
  } = useSyncConflicts();

  const [showDetails, setShowDetails] = useState(false);

  // Mapeamento de ferramentas para ícones e nomes
  const toolConfig = {
    dreams: { icon: <Star className="w-4 h-4" />, name: 'Criador de Sonhos' },
    visamatch: { icon: <Target className="w-4 h-4" />, name: 'VisaMatch' },
    specialist: { icon: <MessageSquare className="w-4 h-4" />, name: 'Chat Especialista' },
    pdf: { icon: <FileText className="w-4 h-4" />, name: 'PDF Generator' }
  };

  const getHealthIcon = () => {
    switch (syncStatus?.sync_health) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderIndicatorView = () => (
    <div className={`flex items-center space-x-2 ${className}`}>
      {isSyncing ? (
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
      ) : (
        getHealthIcon()
      )}
      
      <span className="text-sm text-gray-600">
        {isSyncing ? 'Sincronizando...' : lastSyncText}
      </span>
      
      {totalConflicts > 0 && (
        <Badge variant="destructive" className="text-xs">
          {totalConflicts}
        </Badge>
      )}
    </div>
  );

  const renderCompactView = () => (
    <Card className={`${className} border-gray-200`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {isSyncing ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              ) : (
                getHealthIcon()
              )}
              
              <div>
                <div className="font-medium text-sm">
                  {isSyncing ? 'Sincronizando dados...' : 'Sincronização'}
                </div>
                <div className="text-xs text-gray-600">
                  {healthMessage}
                </div>
              </div>
            </div>
            
            {syncStatus && (
              <div className="flex items-center space-x-1">
                {syncStatus.tools_synced.map(tool => (
                  <div
                    key={tool}
                    className="p-1 bg-green-100 rounded"
                    title={toolConfig[tool]?.name || tool}
                  >
                    {toolConfig[tool]?.icon || <Database className="w-3 h-3" />}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {totalConflicts > 0 && (
              <Badge variant="destructive" className="text-xs">
                {totalConflicts} conflitos
              </Badge>
            )}
            
            {showControls && (
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshStatus}
                disabled={isSyncing}
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
        
        {syncError && (
          <Alert className="mt-3 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {syncError}
              <Button 
                variant="link" 
                size="sm" 
                onClick={clearSyncErrors}
                className="ml-2 text-red-600 p-0 h-auto"
              >
                Dispensar
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderFullView = () => (
    <div className={`${className} space-y-4`}>
      {/* Header principal */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ArrowRightLeft className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Sincronização de Dados</CardTitle>
                <CardDescription className="text-base">
                  Status da integração entre suas ferramentas
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {getHealthIcon()}
              <Badge 
                className={`${
                  healthColor === 'green' ? 'bg-green-100 text-green-800' :
                  healthColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  healthColor === 'red' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {syncStatus?.sync_health || 'Desconhecido'}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Status detalhado */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Informações gerais */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Info className="w-5 h-5 mr-2" />
              Status Geral
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Última sincronização:</span>
              <span className="font-medium">{lastSyncText}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Ferramentas sincronizadas:</span>
              <span className="font-medium">{syncStatus?.tools_synced.length || 0}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status de saúde:</span>
              <div className="flex items-center space-x-1">
                {getHealthIcon()}
                <span className="font-medium">{healthMessage}</span>
              </div>
            </div>
            
            {isSyncing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sincronizando...</span>
                  <span>Em progresso</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ferramentas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Ferramentas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(toolConfig).map(([toolKey, config]) => {
                const isSynced = syncStatus?.tools_synced.includes(toolKey);
                
                return (
                  <div key={toolKey} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1 rounded ${isSynced ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {config.icon}
                      </div>
                      <span className="text-sm">{config.name}</span>
                    </div>
                    
                    <Badge 
                      variant={isSynced ? 'default' : 'secondary'}
                      className={isSynced ? 'bg-green-100 text-green-800' : ''}
                    >
                      {isSynced ? 'Sincronizado' : 'Pendente'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conflitos */}
      {showConflicts && totalConflicts > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-yellow-800">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Conflitos de Sincronização
            </CardTitle>
            <CardDescription>
              {totalConflicts} conflitos precisam ser resolvidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingConflicts.slice(0, 3).map((conflict, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <div className="font-medium text-sm">{conflict.field}</div>
                    <div className="text-xs text-gray-600">
                      Conflito entre: {conflict.current_value} ↔ {conflict.incoming_value}
                    </div>
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => resolveConflict(conflict.id, 'merge')}
                  >
                    Resolver
                  </Button>
                </div>
              ))}
              
              {totalConflicts > 3 && (
                <div className="text-center">
                  <Button variant="link" onClick={() => setShowDetails(true)}>
                    Ver todos os {totalConflicts} conflitos
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controles */}
      {showControls && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Controle manual da sincronização
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={refreshStatus}
                  disabled={isSyncing}
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                
                <Button 
                  size="sm"
                  onClick={forceSyncAll}
                  disabled={isSyncing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  Sincronizar Tudo
                </Button>
                
                {totalConflicts > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearAllConflicts}
                  >
                    Limpar Conflitos
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Erro geral */}
      {syncError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {syncError}
            <Button 
              variant="link" 
              size="sm" 
              onClick={clearSyncErrors}
              className="ml-2 text-red-600 p-0 h-auto"
            >
              Dispensar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Dialog para detalhes de conflitos */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Conflitos de Sincronização</DialogTitle>
            <DialogDescription>
              Resolva os conflitos para manter seus dados consistentes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {pendingConflicts.map((conflict, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{conflict.field}</span>
                      <Badge variant="outline">{conflict.conflict_type}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-700">Valor Atual:</div>
                        <div className="p-2 bg-gray-50 rounded border">
                          {JSON.stringify(conflict.current_value)}
                        </div>
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-700">Novo Valor:</div>
                        <div className="p-2 bg-blue-50 rounded border">
                          {JSON.stringify(conflict.incoming_value)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => resolveConflict(conflict.id, 'target_wins')}
                      >
                        Manter Atual
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => resolveConflict(conflict.id, 'source_wins')}
                      >
                        Usar Novo
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => resolveConflict(conflict.id, 'merge')}
                      >
                        Mesclar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Renderizar baseado na variante
  switch (variant) {
    case 'indicator':
      return renderIndicatorView();
    case 'compact':
      return renderCompactView();
    case 'full':
    default:
      return renderFullView();
  }
}

export default DataSyncStatus;
