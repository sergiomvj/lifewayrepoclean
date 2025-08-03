import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { pdfGenerationService, PDFAccessControl, PDFGenerationOptions } from '@/services/pdfGenerationService';
import { CriadorSonhosFormData } from '@/types/forms';
import { useUserContext } from '@/hooks/useUserContext';

interface UsePDFGenerationProps {
  formData?: CriadorSonhosFormData;
  aiAnalysis?: string;
  autoCheckAccess?: boolean;
}

interface PDFGenerationState {
  isGenerating: boolean;
  progress: number;
  currentStep: string;
  message: string;
  error: string | null;
  generatedUrl: string | null;
}

interface UsePDFGenerationReturn {
  // Estado
  accessControl: PDFAccessControl | null;
  generationState: PDFGenerationState;
  
  // Ações
  generatePDF: () => Promise<void>;
  checkAccess: () => Promise<void>;
  clearError: () => void;
  resetState: () => void;
  
  // Status
  canAccessPDF: boolean;
  isFreePeriod: boolean;
  isPROUser: boolean;
  needsUpgrade: boolean;
  daysRemaining: number | null;
  
  // Loading states
  isCheckingAccess: boolean;
  isGenerating: boolean;
}

export function usePDFGeneration({
  formData,
  aiAnalysis,
  autoCheckAccess = true
}: UsePDFGenerationProps = {}): UsePDFGenerationReturn {
  
  const { context: user } = useUserContext();
  
  // Estado local
  const [generationState, setGenerationState] = useState<PDFGenerationState>({
    isGenerating: false,
    progress: 0,
    currentStep: '',
    message: '',
    error: null,
    generatedUrl: null
  });

  // Query para verificar acesso ao PDF
  const {
    data: accessControl,
    isLoading: isCheckingAccess,
    refetch: refetchAccess,
    error: accessError
  } = useQuery({
    queryKey: ['pdf-access', user?.user_id],
    queryFn: async () => {
      if (!user?.user_id) {
        throw new Error('User ID não disponível');
      }
      return await pdfGenerationService.checkPDFAccess(user.user_id);
    },
    enabled: !!user?.user_id && autoCheckAccess,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });

  // Mutation para gerar PDF
  const generatePDFMutation = useMutation({
    mutationFn: async (options: PDFGenerationOptions) => {
      return await pdfGenerationService.generateDreamsPDF(options);
    },
    onMutate: () => {
      setGenerationState(prev => ({
        ...prev,
        isGenerating: true,
        progress: 0,
        currentStep: 'Iniciando...',
        message: 'Preparando geração do PDF',
        error: null,
        generatedUrl: null
      }));
    },
    onSuccess: (pdfBlob) => {
      // Criar URL para o blob
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      setGenerationState(prev => ({
        ...prev,
        isGenerating: false,
        progress: 100,
        currentStep: 'Concluído!',
        message: 'PDF gerado com sucesso',
        generatedUrl: pdfUrl
      }));

      // Auto-download
      if (formData?.nome) {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `criador-de-sonhos-${formData.nome.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
    onError: (error: Error) => {
      setGenerationState(prev => ({
        ...prev,
        isGenerating: false,
        progress: 0,
        currentStep: '',
        message: '',
        error: error.message || 'Erro desconhecido na geração do PDF'
      }));
    }
  });

  // Função para atualizar progresso durante a geração
  const updateProgress = useCallback((step: string, progress: number, message: string) => {
    setGenerationState(prev => ({
      ...prev,
      currentStep: step,
      progress,
      message
    }));
  }, []);

  // Função principal para gerar PDF
  const generatePDF = useCallback(async () => {
    try {
      // Validações
      if (!user?.user_id) {
        throw new Error('Usuário não autenticado');
      }

      if (!formData) {
        throw new Error('Dados do formulário não disponíveis');
      }

      if (!aiAnalysis) {
        throw new Error('Análise de IA não disponível');
      }

      if (!accessControl?.canAccessPDF) {
        throw new Error('Acesso ao PDF não autorizado. Upgrade para PRO necessário.');
      }

      // Etapa 1: Seleção de imagens
      updateProgress('Selecionando imagens...', 20, 'Escolhendo imagens familiares baseadas no seu perfil');
      const selectedImages = await pdfGenerationService.selectFamilyImages(formData);

      // Etapa 2: Estruturação do conteúdo
      updateProgress('Estruturando conteúdo...', 40, 'Organizando análise e criando layout personalizado');

      // Etapa 3: Geração do PDF
      updateProgress('Gerando PDF...', 70, 'Criando seu relatório visual elegante');

      // Executar mutation
      await generatePDFMutation.mutateAsync({
        formData,
        aiAnalysis,
        userProfile: {
          id: 'user-profile-id',
          name: formData?.nome || 'Usuário',
          profession: formData?.profissao || '',
          education_level: 'high_school',
          english_level: 'basic',
          current_country: 'Brasil',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        selectedImages,
        template: accessControl.userType === 'PRO' ? 'premium' : 'standard'
      });

    } catch (error) {
      console.error('Erro na geração do PDF:', error);
      setGenerationState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    }
  }, [user, formData, aiAnalysis, accessControl, generatePDFMutation, updateProgress]);

  // Função para verificar acesso manualmente
  const checkAccess = useCallback(async () => {
    await refetchAccess();
  }, [refetchAccess]);

  // Função para limpar erro
  const clearError = useCallback(() => {
    setGenerationState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  // Função para resetar estado
  const resetState = useCallback(() => {
    setGenerationState({
      isGenerating: false,
      progress: 0,
      currentStep: '',
      message: '',
      error: null,
      generatedUrl: null
    });
  }, []);

  // Computed values
  const canAccessPDF = accessControl?.canAccessPDF ?? false;
  const isFreePeriod = accessControl?.daysRemaining !== undefined;
  const isPROUser = accessControl?.userType === 'PRO';
  const needsUpgrade = accessControl?.upgradeRequired ?? false;
  const daysRemaining = accessControl?.daysRemaining ?? null;

  // Efeito para tratar erros de acesso
  useEffect(() => {
    if (accessError) {
      setGenerationState(prev => ({
        ...prev,
        error: 'Erro ao verificar permissões de acesso'
      }));
    }
  }, [accessError]);

  // Cleanup de URLs quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (generationState.generatedUrl) {
        URL.revokeObjectURL(generationState.generatedUrl);
      }
    };
  }, [generationState.generatedUrl]);

  return {
    // Estado
    accessControl,
    generationState,
    
    // Ações
    generatePDF,
    checkAccess,
    clearError,
    resetState,
    
    // Status
    canAccessPDF,
    isFreePeriod,
    isPROUser,
    needsUpgrade,
    daysRemaining,
    
    // Loading states
    isCheckingAccess,
    isGenerating: generationState.isGenerating
  };
}

// Hook simplificado para apenas verificar acesso
export function usePDFAccess(userId?: string) {
  return useQuery({
    queryKey: ['pdf-access', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID não disponível');
      }
      return await pdfGenerationService.checkPDFAccess(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });
}

// Hook para estatísticas de uso do PDF
export function usePDFStats(userId?: string) {
  return useQuery({
    queryKey: ['pdf-stats', userId],
    queryFn: async () => {
      // Implementar busca de estatísticas de uso
      return {
        totalDownloads: 0,
        lastDownload: null,
        favoriteTemplate: 'standard',
        averageGenerationTime: 0
      };
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000 // 10 minutos
  });
}

export type { PDFGenerationState, UsePDFGenerationReturn };
