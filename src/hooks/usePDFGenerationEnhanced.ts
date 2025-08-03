import React, { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import { supabase } from '@/integrations/supabase/client';
import { useUserContext } from '@/hooks/useUserContext';
import { CriadorSonhosFormData } from '@/types/forms';
import { useNotifications } from '@/hooks/useNotifications';
import PDFTemplate from '@/components/PDFTemplate';

interface PDFAccessControl {
  launchDate: Date;
  freePeriodDays: number;
  userType: 'FREE' | 'PRO';
  canAccessPDF: boolean;
  daysRemaining?: number;
  upgradeRequired?: boolean;
}

interface PDFGenerationResult {
  success: boolean;
  pdfBlob?: Blob;
  downloadUrl?: string;
  error?: string;
  accessControl: PDFAccessControl;
  metadata: {
    generatedAt: Date;
    template: string;
    pageCount: number;
    fileSize: number;
  };
}

interface FamilyImage {
  id: string;
  filename: string;
  category: 'family' | 'lifestyle' | 'destination';
  tags: string[];
  url: string;
}

export const usePDFGenerationEnhanced = () => {
  const { context: user } = useUserContext();
  const queryClient = useQueryClient();
  const { notifyAchievementUnlocked } = useNotifications();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const LAUNCH_DATE = new Date('2025-08-01');
  const FREE_PERIOD_DAYS = 60;

  // Query para verificar acesso ao PDF
  const {
    data: pdfAccess,
    isLoading: isLoadingAccess,
    refetch: refetchAccess
  } = useQuery({
    queryKey: ['pdf-access', user?.user_id],
    queryFn: async () => {
      if (!user?.user_id) return null;
      return await checkPDFAccess(user.user_id);
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!user?.user_id
  });

  // Query para obter imagens de família
  const {
    data: familyImages = [],
    isLoading: isLoadingImages
  } = useQuery({
    queryKey: ['family-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .storage
        .from('images')
        .list('family', {
          limit: 20,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) throw error;

      return data?.map((file): FamilyImage => ({
        id: file.id || file.name,
        filename: file.name,
        category: 'family',
        tags: [],
        url: supabase.storage.from('images').getPublicUrl(`family/${file.name}`).data.publicUrl
      })) || [];
    },
    staleTime: 30 * 60 * 1000 // 30 minutos
  });

  // Query para histórico de PDFs gerados
  const {
    data: pdfHistory = [],
    refetch: refetchHistory
  } = useQuery({
    queryKey: ['pdf-history', user?.user_id],
    queryFn: async () => {
      if (!user?.user_id) return [];
      
      const { data, error } = await supabase
        .from('pdf_generations')
        .select('*')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.user_id,
    staleTime: 2 * 60 * 1000
  });

  // Verificar acesso ao PDF
  const checkPDFAccess = async (userId: string): Promise<PDFAccessControl> => {
    try {
      const { data: userData, error } = await supabase
        .from('profiles')
        .select('subscription_type, created_at')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const currentDate = new Date();
      const daysSinceLaunch = Math.floor(
        (currentDate.getTime() - LAUNCH_DATE.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Período gratuito (60 dias)
      if (daysSinceLaunch <= FREE_PERIOD_DAYS) {
        return {
          launchDate: LAUNCH_DATE,
          freePeriodDays: FREE_PERIOD_DAYS,
          userType: userData?.subscription_type || 'FREE',
          canAccessPDF: true,
          daysRemaining: FREE_PERIOD_DAYS - daysSinceLaunch
        };
      }

      // Após período gratuito - apenas PRO
      if (userData?.subscription_type === 'PRO') {
        return {
          launchDate: LAUNCH_DATE,
          freePeriodDays: FREE_PERIOD_DAYS,
          userType: 'PRO',
          canAccessPDF: true
        };
      }

      // Usuário FREE após período gratuito
      return {
        launchDate: LAUNCH_DATE,
        freePeriodDays: FREE_PERIOD_DAYS,
        userType: 'FREE',
        canAccessPDF: false,
        upgradeRequired: true
      };
    } catch (error) {
      console.error('Erro ao verificar acesso ao PDF:', error);
      throw new Error('Falha na verificação de acesso ao PDF');
    }
  };

  // Selecionar imagens baseadas no perfil
  const selectImagesForProfile = useCallback((
    formData: CriadorSonhosFormData,
    availableImages: FamilyImage[]
  ): string[] => {
    // Algoritmo simples de seleção baseado no perfil
    const selectedImages: string[] = [];
    
    // Sempre incluir uma imagem principal
    if (availableImages.length > 0) {
      selectedImages.push(availableImages[0].url);
    }
    
    // Adicionar mais imagens baseadas no contexto
    const additionalImages = availableImages
      .slice(1, 5)
      .map(img => img.url);
    
    selectedImages.push(...additionalImages);
    
    return selectedImages;
  }, []);

  // Mutation para gerar PDF
  const generatePDFMutation = useMutation({
    mutationFn: async ({
      formData,
      aiAnalysis,
      template = 'standard'
    }: {
      formData: CriadorSonhosFormData;
      aiAnalysis: string;
      template?: 'standard' | 'premium';
    }): Promise<PDFGenerationResult> => {
      if (!user) throw new Error('Usuário não autenticado');

      setIsGenerating(true);
      setGenerationProgress(0);

      try {
        // Verificar acesso
        setGenerationProgress(10);
        const accessControl = await checkPDFAccess(user.user_id);
        
        if (!accessControl.canAccessPDF) {
          throw new Error('Acesso ao PDF não autorizado. Upgrade para PRO necessário.');
        }

        // Selecionar imagens
        setGenerationProgress(20);
        const selectedImages = selectImagesForProfile(formData, familyImages);

        // Determinar template baseado no tipo de usuário
        const finalTemplate = accessControl.userType === 'PRO' ? template : 'standard';
        const watermark = accessControl.userType === 'FREE' && accessControl.daysRemaining && accessControl.daysRemaining <= 7;

        // Gerar PDF
        setGenerationProgress(40);
        const pdfBlob = await pdf(
          React.createElement(PDFTemplate, {
            formData,
            aiAnalysis,
            userProfile: user,
            selectedImages,
            template: finalTemplate,
            watermark
          })
        ).toBlob();

        setGenerationProgress(70);

        // Salvar no histórico
        const { error: historyError } = await supabase
          .from('pdf_generations')
          .insert({
            user_id: user.user_id,
            template: finalTemplate,
            file_size: pdfBlob.size,
            page_count: finalTemplate === 'premium' ? 7 : 6,
            form_data: formData,
            ai_analysis: aiAnalysis,
            selected_images: selectedImages,
            created_at: new Date().toISOString()
          });

        if (historyError) {
          console.warn('Erro ao salvar histórico:', historyError);
        }

        setGenerationProgress(90);

        // Notificar conquista
        await notifyAchievementUnlocked('Primeiro Documento', 'pdf_generation');

        setGenerationProgress(100);

        return {
          success: true,
          pdfBlob,
          downloadUrl: URL.createObjectURL(pdfBlob),
          accessControl,
          metadata: {
            generatedAt: new Date(),
            template: finalTemplate,
            pageCount: finalTemplate === 'premium' ? 7 : 6,
            fileSize: pdfBlob.size
          }
        };
      } catch (error) {
        console.error('Erro na geração do PDF:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          accessControl: pdfAccess || {
            launchDate: LAUNCH_DATE,
            freePeriodDays: FREE_PERIOD_DAYS,
            userType: 'FREE',
            canAccessPDF: false
          },
          metadata: {
            generatedAt: new Date(),
            template: 'standard',
            pageCount: 0,
            fileSize: 0
          }
        };
      } finally {
        setIsGenerating(false);
        setGenerationProgress(0);
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success('PDF gerado com sucesso!', {
          description: 'Seu relatório personalizado está pronto para download.'
        });
        
        // Invalidar queries relacionadas
        queryClient.invalidateQueries({ queryKey: ['pdf-history', user?.user_id] });
      } else {
        toast.error('Erro ao gerar PDF', {
          description: result.error || 'Tente novamente em alguns instantes.'
        });
      }
    },
    onError: (error) => {
      console.error('Erro na mutation de PDF:', error);
      toast.error('Erro ao gerar PDF', {
        description: 'Ocorreu um erro inesperado. Tente novamente.'
      });
    }
  });

  // Mutation para upgrade para PRO
  const upgradeToPROmutation = useMutation({
    mutationFn: async () => {
      if (!user?.user_id) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_type: 'PRO' })
        .eq('id', user.user_id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Upgrade realizado com sucesso!', {
        description: 'Agora você tem acesso completo aos PDFs premium.'
      });
      
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['pdf-access', user?.user_id] });
      refetchAccess();
    },
    onError: (error) => {
      console.error('Erro no upgrade:', error);
      toast.error('Erro no upgrade', {
        description: 'Não foi possível processar o upgrade. Tente novamente.'
      });
    }
  });

  // Função para download do PDF
  const downloadPDF = useCallback((blob: Blob, filename?: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `lifeway-dreams-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // Utilitários
  const getAccessStatusMessage = () => {
    if (!pdfAccess) return 'Verificando acesso...';
    
    if (pdfAccess.canAccessPDF) {
      if (pdfAccess.daysRemaining !== undefined) {
        return `Acesso gratuito por mais ${pdfAccess.daysRemaining} dias`;
      }
      return 'Acesso completo (PRO)';
    }
    
    return 'Upgrade para PRO necessário';
  };

  const canGeneratePDF = () => {
    return pdfAccess?.canAccessPDF || false;
  };

  const isPremiumUser = () => {
    return pdfAccess?.userType === 'PRO';
  };

  const isInFreePeriod = () => {
    return pdfAccess?.daysRemaining !== undefined && pdfAccess.daysRemaining > 0;
  };

  return {
    // Estados
    isGenerating,
    generationProgress,
    isLoadingAccess,
    isLoadingImages,
    
    // Dados
    pdfAccess,
    familyImages,
    pdfHistory,
    
    // Ações
    generatePDF: generatePDFMutation.mutate,
    upgradeToPRO: upgradeToPROmutation.mutate,
    downloadPDF,
    refetchAccess,
    refetchHistory,
    
    // Estados das mutations
    isGeneratingPDF: generatePDFMutation.isPending,
    isUpgrading: upgradeToPROmutation.isPending,
    
    // Utilitários
    getAccessStatusMessage,
    canGeneratePDF,
    isPremiumUser,
    isInFreePeriod,
    selectImagesForProfile
  };
};

export default usePDFGenerationEnhanced;
