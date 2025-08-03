import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Info,
  Loader2
} from 'lucide-react';
import { useTableCheck } from '../hooks/useTableCheck';

const SystemDiagnostics: React.FC = () => {
  const { 
    tablesStatus, 
    isLoading, 
    tableExists, 
    tableChecked, 
    recheckTable, 
    checkAllTables, 
    stats 
  } = useTableCheck();

  const getStatusIcon = (tableName: keyof typeof tablesStatus) => {
    if (!tableChecked(tableName)) {
      return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
    }
    
    return tableExists(tableName) 
      ? <CheckCircle className="h-4 w-4 text-green-500" />
      : <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (tableName: keyof typeof tablesStatus) => {
    if (!tableChecked(tableName)) {
      return <Badge variant="secondary">Verificando...</Badge>;
    }
    
    return tableExists(tableName)
      ? <Badge className="bg-green-100 text-green-800">Disponível</Badge>
      : <Badge variant="destructive">Não encontrada</Badge>;
  };

  const tableDescriptions = {
    user_contexts: 'Contextos de usuário para personalização e IA',
    user_profiles: 'Perfis completos dos usuários',
    user_tool_usage: 'Estatísticas de uso das ferramentas',
    dreams_submissions: 'Submissões do Criador de Sonhos',
    visamatch_analyses: 'Análises do VisaMatch',
    chat_messages: 'Mensagens do chat com especialista',
    generated_pdfs: 'PDFs gerados pelo sistema'
  };

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Diagnóstico do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-500">Total de Tabelas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.existing}</div>
              <div className="text-sm text-gray-500">Disponíveis</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.missing}</div>
              <div className="text-sm text-gray-500">Ausentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.checked}</div>
              <div className="text-sm text-gray-500">Verificadas</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {stats.missing === 0 ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-700 font-medium">Sistema funcionando corretamente</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <span className="text-yellow-700 font-medium">
                    {stats.missing} tabela(s) precisam ser criadas
                  </span>
                </>
              )}
            </div>

            <Button
              onClick={checkAllTables}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Verificar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detalhes das Tabelas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status das Tabelas do Banco</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(tablesStatus).map(([tableName, status]) => (
              <div 
                key={tableName}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(tableName as keyof typeof tablesStatus)}
                  <div>
                    <div className="font-medium text-gray-900">{tableName}</div>
                    <div className="text-sm text-gray-600">
                      {tableDescriptions[tableName as keyof typeof tableDescriptions]}
                    </div>
                    {status.error && (
                      <div className="text-xs text-red-600 mt-1">
                        {status.error}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(tableName as keyof typeof tablesStatus)}
                  
                  <Button
                    onClick={() => recheckTable(tableName as keyof typeof tablesStatus)}
                    variant="ghost"
                    size="sm"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ações Recomendadas */}
      {stats.missing > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Ações Recomendadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Tabelas ausentes detectadas</p>
                  <p>
                    Execute as migrações do Supabase para criar as tabelas necessárias.
                    Isso resolverá os erros 404 no console e habilitará todas as funcionalidades.
                  </p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-white rounded border">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Comando para executar migrações:
                </p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                  npx supabase db push
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações Técnicas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações Técnicas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-900 mb-2">Configurações do Cliente</div>
              <ul className="space-y-1 text-gray-600">
                <li>• Storage Key: lifeway-supabase-auth-token</li>
                <li>• Persist Session: Habilitado</li>
                <li>• Auto Refresh: Habilitado</li>
                <li>• Detect Session URL: Habilitado</li>
              </ul>
            </div>
            
            <div>
              <div className="font-medium text-gray-900 mb-2">Políticas de Segurança</div>
              <ul className="space-y-1 text-gray-600">
                <li>• Row Level Security: Habilitado</li>
                <li>• Políticas por usuário: Implementadas</li>
                <li>• Acesso restrito: Por user_id</li>
                <li>• Triggers: Configurados</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemDiagnostics;
