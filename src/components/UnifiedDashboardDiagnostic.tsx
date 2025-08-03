import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle } from 'lucide-react';

// Vamos testar os hooks um por vez
import { useUserContext } from '@/hooks/useUserContext';
import { useUnifiedFlow } from '@/hooks/useUnifiedFlow';

const UnifiedDashboardDiagnostic = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [diagnosticStep, setDiagnosticStep] = useState(1);
  const [errors, setErrors] = useState<string[]>([]);

  console.log('UnifiedDashboardDiagnostic: Iniciando diagnóstico, step:', diagnosticStep);

  // Step 1: Testar useUserContext
  let userContextData = null;
  let userContextError = null;
  
  try {
    if (diagnosticStep >= 1) {
      userContextData = useUserContext();
      console.log('Step 1 - useUserContext:', userContextData ? 'OK' : 'NULL');
    }
  } catch (error) {
    userContextError = error;
    console.error('Step 1 - useUserContext ERROR:', error);
    setErrors(prev => [...prev, `useUserContext: ${error}`]);
  }

  // Step 2: Testar useUnifiedFlow
  let unifiedFlowData = null;
  let unifiedFlowError = null;
  
  try {
    if (diagnosticStep >= 2) {
      unifiedFlowData = useUnifiedFlow();
      console.log('Step 2 - useUnifiedFlow:', unifiedFlowData ? 'OK' : 'NULL');
    }
  } catch (error) {
    unifiedFlowError = error;
    console.error('Step 2 - useUnifiedFlow ERROR:', error);
    setErrors(prev => [...prev, `useUnifiedFlow: ${error}`]);
  }

  const nextStep = () => {
    setDiagnosticStep(prev => prev + 1);
  };

  const resetDiagnostic = () => {
    setDiagnosticStep(1);
    setErrors([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Diagnóstico</h2>
          <p className="text-gray-600">Testando hooks um por vez - Step {diagnosticStep}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={nextStep} variant="outline">
            Próximo Step
          </Button>
          <Button onClick={resetDiagnostic} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Erros encontrados:</strong>
            <ul className="mt-2 list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Diagnóstico</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status dos Hooks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className={`p-4 rounded-lg border ${diagnosticStep >= 1 ? (userContextError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200') : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Step 1: useUserContext</span>
                    <span className={`text-sm ${diagnosticStep >= 1 ? (userContextError ? 'text-red-600' : 'text-green-600') : 'text-gray-500'}`}>
                      {diagnosticStep >= 1 ? (userContextError ? 'ERRO' : 'OK') : 'Não testado'}
                    </span>
                  </div>
                  {diagnosticStep >= 1 && userContextData && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p>User ID: {userContextData.user?.user_id || 'N/A'}</p>
                      <p>Loading: {userContextData.isLoading ? 'Sim' : 'Não'}</p>
                    </div>
                  )}
                  {userContextError && (
                    <div className="mt-2 text-sm text-red-600">
                      Erro: {userContextError.toString()}
                    </div>
                  )}
                </div>

                <div className={`p-4 rounded-lg border ${diagnosticStep >= 2 ? (unifiedFlowError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200') : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Step 2: useUnifiedFlow</span>
                    <span className={`text-sm ${diagnosticStep >= 2 ? (unifiedFlowError ? 'text-red-600' : 'text-green-600') : 'text-gray-500'}`}>
                      {diagnosticStep >= 2 ? (unifiedFlowError ? 'ERRO' : 'OK') : 'Aguardando'}
                    </span>
                  </div>
                  {diagnosticStep >= 2 && unifiedFlowData && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Current Step: {unifiedFlowData.currentStep || 'N/A'}</p>
                      <p>Progress: {unifiedFlowData.totalProgress || 0}%</p>
                    </div>
                  )}
                  {unifiedFlowError && (
                    <div className="mt-2 text-sm text-red-600">
                      Erro: {unifiedFlowError.toString()}
                    </div>
                  )}
                </div>

                <div className={`p-4 rounded-lg border ${diagnosticStep >= 3 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Step 3: useGamification</span>
                    <span className="text-sm text-gray-500">
                      {diagnosticStep >= 3 ? 'Testando...' : 'Aguardando'}
                    </span>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${diagnosticStep >= 4 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Step 4: Outros hooks</span>
                    <span className="text-sm text-gray-500">
                      {diagnosticStep >= 4 ? 'Testando...' : 'Aguardando'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resultados do Diagnóstico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Step Atual: {diagnosticStep}</h4>
                  <p className="text-sm text-gray-600">
                    {diagnosticStep === 1 && "Testando useUserContext..."}
                    {diagnosticStep === 2 && "useUserContext OK, testando useUnifiedFlow..."}
                    {diagnosticStep === 3 && "Testando useGamification..."}
                    {diagnosticStep >= 4 && "Testando hooks restantes..."}
                  </p>
                </div>

                {userContextData && (
                  <div>
                    <h4 className="font-medium mb-2">Dados do useUserContext:</h4>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify({
                        hasUser: !!userContextData.user,
                        userId: userContextData.user?.user_id,
                        isLoading: userContextData.isLoading,
                        error: userContextData.error
                      }, null, 2)}
                    </pre>
                  </div>
                )}

                {unifiedFlowData && (
                  <div>
                    <h4 className="font-medium mb-2">Dados do useUnifiedFlow:</h4>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify({
                        currentStep: unifiedFlowData.currentStep,
                        totalProgress: unifiedFlowData.totalProgress,
                        isLoading: unifiedFlowData.isLoading,
                        hasError: !!unifiedFlowData.error
                      }, null, 2)}
                    </pre>
                  </div>
                )}

                {errors.length === 0 && diagnosticStep > 1 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800">✅ Todos os hooks testados até agora estão funcionando!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedDashboardDiagnostic;
