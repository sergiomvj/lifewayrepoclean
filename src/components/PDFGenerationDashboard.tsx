import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Crown, 
  Clock, 
  Image, 
  Settings,
  Zap,
  CheckCircle,
  AlertCircle,
  Star,
  Calendar,
  FileCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserContext } from '@/hooks/useUserContext';
import { usePDFSimple } from '@/hooks/usePDFSimple';
import { CriadorSonhosFormData } from '@/types/forms';

interface PDFGenerationDashboardProps {
  variant?: 'full' | 'compact' | 'widget';
  formData?: CriadorSonhosFormData;
  aiAnalysis?: string;
}

const PDFGenerationDashboard: React.FC<PDFGenerationDashboardProps> = ({
  variant = 'full',
  formData,
  aiAnalysis
}) => {
  const { context: user } = useUserContext();
  const {
    isGenerating,
    generationProgress,
    isLoadingAccess,
    pdfAccess,
    pdfHistory,
    generatePDF,
    upgradeToPRO,
    downloadPDF,
    isGeneratingPDF,
    isUpgrading,
    getAccessStatusMessage,
    canGeneratePDF,
    isPremiumUser,
    isInFreePeriod
  } = usePDFSimple();

  const [selectedTemplate, setSelectedTemplate] = useState<'standard' | 'premium'>('standard');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // Widget compacto
  if (variant === 'widget') {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm">PDF Generator</CardTitle>
            </div>
            {isPremiumUser() && (
              <Badge variant="secondary" className="text-xs">
                <Crown className="h-3 w-3 mr-1" />
                PRO
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              {getAccessStatusMessage()}
            </div>
            
            {isGenerating && (
              <div className="space-y-2">
                <Progress value={generationProgress} className="h-2" />
                <div className="text-xs text-center text-muted-foreground">
                  Gerando PDF... {generationProgress}%
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => formData && aiAnalysis && generatePDF({ formData, aiAnalysis, template: selectedTemplate })}
                disabled={!canGeneratePDF() || !formData || !aiAnalysis || isGeneratingPDF}
                className="flex-1"
              >
                <FileText className="h-3 w-3 mr-1" />
                Gerar
              </Button>
              
              {!canGeneratePDF() && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => upgradeToPRO()}
                  disabled={isUpgrading}
                >
                  <Crown className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {pdfHistory.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {pdfHistory.length} PDF{pdfHistory.length > 1 ? 's' : ''} gerado{pdfHistory.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Versão compacta
  if (variant === 'compact') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Gerador de PDF</h3>
            {isPremiumUser() && (
              <Badge variant="secondary">
                <Crown className="h-3 w-3 mr-1" />
                PRO
              </Badge>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            {getAccessStatusMessage()}
          </div>
        </div>

        {!canGeneratePDF() && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {pdfAccess?.upgradeRequired 
                ? 'Período gratuito expirado. Faça upgrade para PRO para continuar gerando PDFs.'
                : 'Verificando acesso ao gerador de PDF...'
              }
            </AlertDescription>
          </Alert>
        )}

        {isGenerating && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Gerando PDF...</span>
                  <span className="text-sm text-muted-foreground">{generationProgress}%</span>
                </div>
                <Progress value={generationProgress} />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button
            onClick={() => formData && aiAnalysis && generatePDF({ formData, aiAnalysis, template: selectedTemplate })}
            disabled={!canGeneratePDF() || !formData || !aiAnalysis || isGeneratingPDF}
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-2" />
            Gerar PDF {selectedTemplate === 'premium' ? 'Premium' : 'Padrão'}
          </Button>
          
          {!canGeneratePDF() && (
            <Button
              variant="outline"
              onClick={() => upgradeToPRO()}
              disabled={isUpgrading}
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade PRO
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Versão completa
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">Gerador de PDF</h2>
            <p className="text-muted-foreground">
              Crie relatórios personalizados da sua jornada
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={isPremiumUser() ? "default" : "secondary"}>
            {isPremiumUser() ? (
              <>
                <Crown className="h-3 w-3 mr-1" />
                PRO
              </>
            ) : (
              <>
                <Clock className="h-3 w-3 mr-1" />
                FREE
              </>
            )}
          </Badge>
          
          <div className="text-sm text-muted-foreground">
            {getAccessStatusMessage()}
          </div>
        </div>
      </div>

      {!canGeneratePDF() && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {pdfAccess?.upgradeRequired 
                ? 'Período gratuito expirado. Faça upgrade para PRO para continuar gerando PDFs.'
                : 'Verificando acesso ao gerador de PDF...'
              }
            </span>
            {pdfAccess?.upgradeRequired && (
              <Button
                size="sm"
                onClick={() => upgradeToPRO()}
                disabled={isUpgrading}
              >
                <Crown className="h-3 w-3 mr-1" />
                Upgrade PRO
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="generator" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generator">
            <Zap className="h-4 w-4 mr-2" />
            Gerador
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Settings className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="history">
            <Calendar className="h-4 w-4 mr-2" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="images">
            <Image className="h-4 w-4 mr-2" />
            Imagens
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-4">
          {isGenerating && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 animate-pulse text-blue-600" />
                  Gerando PDF...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progresso</span>
                    <span className="text-sm text-muted-foreground">{generationProgress}%</span>
                  </div>
                  <Progress value={generationProgress} className="h-3" />
                  <div className="text-xs text-muted-foreground text-center">
                    {generationProgress < 20 && 'Verificando acesso...'}
                    {generationProgress >= 20 && generationProgress < 40 && 'Selecionando imagens...'}
                    {generationProgress >= 40 && generationProgress < 70 && 'Gerando conteúdo...'}
                    {generationProgress >= 70 && generationProgress < 90 && 'Salvando histórico...'}
                    {generationProgress >= 90 && 'Finalizando...'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Template Padrão</CardTitle>
                <CardDescription>
                  Relatório completo com análise básica
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">6 páginas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Imagens de família</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Análise básica</span>
                  </div>
                  
                  <Button
                    className="w-full"
                    onClick={() => {
                      setSelectedTemplate('standard');
                      formData && aiAnalysis && generatePDF({ formData, aiAnalysis, template: 'standard' });
                    }}
                    disabled={!canGeneratePDF() || !formData || !aiAnalysis || isGeneratingPDF}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar Padrão
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className={isPremiumUser() ? '' : 'opacity-60'}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Template Premium
                      <Crown className="h-4 w-4 text-yellow-600" />
                    </CardTitle>
                    <CardDescription>
                      Relatório avançado com recursos extras
                    </CardDescription>
                  </div>
                  {!isPremiumUser() && (
                    <Badge variant="outline">PRO</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">7 páginas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Imagens premium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Análise detalhada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">Próximos passos</span>
                  </div>
                  
                  {isPremiumUser() ? (
                    <Button
                      className="w-full"
                      onClick={() => {
                        setSelectedTemplate('premium');
                        formData && aiAnalysis && generatePDF({ formData, aiAnalysis, template: 'premium' });
                      }}
                      disabled={!canGeneratePDF() || !formData || !aiAnalysis || isGeneratingPDF}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Gerar Premium
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => upgradeToPRO()}
                      disabled={isUpgrading}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade para PRO
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Template</CardTitle>
              <CardDescription>
                Personalize a aparência do seu PDF
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Template Selecionado</label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant={selectedTemplate === 'standard' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTemplate('standard')}
                    >
                      Padrão
                    </Button>
                    <Button
                      variant={selectedTemplate === 'premium' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTemplate('premium')}
                      disabled={!isPremiumUser()}
                    >
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {selectedTemplate === 'standard' 
                    ? 'Template padrão com 6 páginas e recursos básicos.'
                    : 'Template premium com 7 páginas e recursos avançados.'
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de PDFs</CardTitle>
              <CardDescription>
                Seus relatórios gerados anteriormente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pdfHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum PDF gerado ainda</p>
                  <p className="text-sm">Gere seu primeiro relatório personalizado!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pdfHistory.map((pdf, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileCheck className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium">
                            Relatório {pdf.template === 'premium' ? 'Premium' : 'Padrão'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(pdf.created_at).toLocaleDateString('pt-BR')} • 
                            {pdf.page_count} páginas • 
                            {(pdf.file_size / 1024 / 1024).toFixed(1)} MB
                          </div>
                        </div>
                      </div>
                      
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        Baixar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Imagens Disponíveis</CardTitle>
              <CardDescription>
                Imagens que podem ser incluídas no seu PDF
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Imagens serão carregadas automaticamente</p>
                <p className="text-sm">Sistema de imagens em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PDFGenerationDashboard;
