import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  FileText, 
  Crown, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { pdfGenerationService, PDFAccessControl } from '@/services/pdfGenerationService';
import { CriadorSonhosFormData } from '@/types/forms';
import { useUserContext } from '@/hooks/useUserContext';

interface PDFGeneratorProps {
  formData: CriadorSonhosFormData;
  aiAnalysis: string;
  onUpgradePrompt?: () => void;
  className?: string;
}

interface GenerationProgress {
  step: string;
  progress: number;
  message: string;
}

export function PDFGenerator({ 
  formData, 
  aiAnalysis, 
  onUpgradePrompt,
  className = '' 
}: PDFGeneratorProps) {
  const { userContext, isLoading: userLoading } = useUserContext();
  const [accessControl, setAccessControl] = useState<PDFAccessControl | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    step: '',
    progress: 0,
    message: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);

  // Verificar acesso ao PDF quando o componente carrega
  useEffect(() => {
    if (userContext?.user_id && !userLoading) {
      checkPDFAccess();
    }
  }, [userContext?.user_id, userLoading]);

  const checkPDFAccess = async () => {
    try {
      if (!userContext?.user_id) return;
      
      const access = await pdfGenerationService.checkPDFAccess(userContext.user_id);
      setAccessControl(access);
    } catch (error) {
      console.error('Erro ao verificar acesso ao PDF:', error);
      setError('Erro ao verificar permissões de acesso');
    }
  };

  const generatePDF = async () => {
    if (!accessControl?.canAccessPDF) {
      if (onUpgradePrompt) {
        onUpgradePrompt();
      }
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationProgress({ step: 'Iniciando...', progress: 0, message: 'Preparando geração do PDF' });

    try {
      // Etapa 1: Seleção de imagens
      setGenerationProgress({ 
        step: 'Selecionando imagens...', 
        progress: 20, 
        message: 'Escolhendo imagens familiares baseadas no seu perfil' 
      });
      
      const selectedImages = await pdfGenerationService.selectFamilyImages(formData);

      // Etapa 2: Estruturação do conteúdo
      setGenerationProgress({ 
        step: 'Estruturando conteúdo...', 
        progress: 40, 
        message: 'Organizando análise e criando layout personalizado' 
      });

      // Etapa 3: Geração do PDF
      setGenerationProgress({ 
        step: 'Gerando PDF...', 
        progress: 70, 
        message: 'Criando seu relatório visual elegante' 
      });

      const pdfBlob = await pdfGenerationService.generateDreamsPDF({
        formData,
        aiAnalysis,
        userProfile: userContext!.profile,
        selectedImages,
        template: accessControl.userType === 'PRO' ? 'premium' : 'standard'
      });

      // Etapa 4: Finalização
      setGenerationProgress({ 
        step: 'Finalizando...', 
        progress: 90, 
        message: 'Preparando download' 
      });

      // Criar URL para download
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setGeneratedPdfUrl(pdfUrl);

      setGenerationProgress({ 
        step: 'Concluído!', 
        progress: 100, 
        message: 'PDF gerado com sucesso' 
      });

      // Auto-download
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `criador-de-sonhos-${formData.family_name || 'familia'}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Erro na geração do PDF:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido na geração do PDF');
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        setGenerationProgress({ step: '', progress: 0, message: '' });
      }, 3000);
    }
  };

  const handleUpgrade = () => {
    if (onUpgradePrompt) {
      onUpgradePrompt();
    } else {
      // Redirecionar para página de upgrade
      window.location.href = '/upgrade-to-pro';
    }
  };

  // Loading state
  if (userLoading || !accessControl) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Verificando acesso...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Período gratuito ativo
  if (accessControl.canAccessPDF && accessControl.daysRemaining !== undefined) {
    return (
      <Card className={`${className} border-green-200 bg-green-50`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-green-600" />
              <CardTitle className="text-green-800">PDF do Criador de Sonhos</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Clock className="w-3 h-3 mr-1" />
              {accessControl.daysRemaining} dias restantes
            </Badge>
          </div>
          <CardDescription className="text-green-700">
            Baixe seu relatório personalizado gratuitamente durante o período promocional
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Progresso de geração */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-700">{generationProgress.step}</span>
                <span className="text-green-600">{generationProgress.progress}%</span>
              </div>
              <Progress value={generationProgress.progress} className="h-2" />
              <p className="text-xs text-green-600">{generationProgress.message}</p>
            </div>
          )}

          {/* Erro */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {/* Botão de geração */}
          <div className="flex flex-col space-y-3">
            <Button 
              onClick={generatePDF}
              disabled={isGenerating}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isGenerating ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Gerando PDF...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Baixar PDF Gratuito</span>
                </div>
              )}
            </Button>

            {/* Aviso sobre fim do período gratuito */}
            <Alert className="border-amber-200 bg-amber-50">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                <strong>Período promocional:</strong> Após {accessControl.daysRemaining} dias, 
                o PDF estará disponível apenas para usuários PRO.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Usuário PRO
  if (accessControl.canAccessPDF && accessControl.userType === 'PRO') {
    return (
      <Card className={`${className} border-blue-200 bg-blue-50`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-blue-800">PDF Premium</CardTitle>
            </div>
            <Badge className="bg-blue-600 text-white">
              <Crown className="w-3 h-3 mr-1" />
              PRO
            </Badge>
          </div>
          <CardDescription className="text-blue-700">
            Acesso ilimitado ao seu relatório personalizado com recursos premium
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Recursos PRO */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center space-x-2 text-blue-700">
              <CheckCircle className="w-4 h-4" />
              <span>Layout Premium</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-700">
              <CheckCircle className="w-4 h-4" />
              <span>Imagens HD</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-700">
              <CheckCircle className="w-4 h-4" />
              <span>Análise Avançada</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-700">
              <CheckCircle className="w-4 h-4" />
              <span>Downloads Ilimitados</span>
            </div>
          </div>

          {/* Progresso de geração */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700">{generationProgress.step}</span>
                <span className="text-blue-600">{generationProgress.progress}%</span>
              </div>
              <Progress value={generationProgress.progress} className="h-2" />
              <p className="text-xs text-blue-600">{generationProgress.message}</p>
            </div>
          )}

          {/* Erro */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {/* Botão de geração */}
          <Button 
            onClick={generatePDF}
            disabled={isGenerating}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {isGenerating ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Gerando PDF Premium...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Crown className="w-4 h-4" />
                <span>Baixar PDF Premium</span>
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Upgrade necessário
  return (
    <Card className={`${className} border-amber-200 bg-amber-50`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-amber-600" />
            <CardTitle className="text-amber-800">PDF do Criador de Sonhos</CardTitle>
          </div>
          <Badge variant="outline" className="border-amber-300 text-amber-700">
            Upgrade Necessário
          </Badge>
        </div>
        <CardDescription className="text-amber-700">
          O período gratuito expirou. Faça upgrade para PRO para continuar acessando seu PDF personalizado.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Benefícios do upgrade */}
        <div className="space-y-2">
          <h4 className="font-medium text-amber-800">Com o PRO você terá:</h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center space-x-2 text-amber-700">
              <CheckCircle className="w-4 h-4" />
              <span>PDF ilimitado do Criador de Sonhos</span>
            </div>
            <div className="flex items-center space-x-2 text-amber-700">
              <CheckCircle className="w-4 h-4" />
              <span>Análises avançadas do VisaMatch</span>
            </div>
            <div className="flex items-center space-x-2 text-amber-700">
              <CheckCircle className="w-4 h-4" />
              <span>Chat ilimitado com especialistas</span>
            </div>
            <div className="flex items-center space-x-2 text-amber-700">
              <CheckCircle className="w-4 h-4" />
              <span>Relatórios mensais personalizados</span>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col space-y-2">
          <Button 
            onClick={handleUpgrade}
            className="w-full bg-amber-600 hover:bg-amber-700"
            size="lg"
          >
            <div className="flex items-center space-x-2">
              <Crown className="w-4 h-4" />
              <span>Fazer Upgrade para PRO</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Button>
          
          <p className="text-xs text-amber-600 text-center">
            A partir de R$ 97/mês • Cancele quando quiser
          </p>
        </div>

        {/* Call-to-action adicional */}
        <Alert className="border-blue-200 bg-blue-50">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            <strong>Oferta especial:</strong> 20% de desconto no primeiro mês para novos usuários PRO!
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export default PDFGenerator;
