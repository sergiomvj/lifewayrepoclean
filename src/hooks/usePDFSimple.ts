import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUserContext } from '@/hooks/useUserContext';
import { CriadorSonhosFormData } from '@/types/forms';
import { useNotifications } from '@/hooks/useNotifications';

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

export const usePDFSimple = () => {
  const { context: user } = useUserContext();
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

  // Mutation para gerar PDF (simulado por enquanto)
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
        setGenerationProgress(20);
        const accessControl = await checkPDFAccess(user.user_id);
        
        if (!accessControl.canAccessPDF) {
          throw new Error('Acesso ao PDF não autorizado. Upgrade para PRO necessário.');
        }

        // Simular geração de PDF
        setGenerationProgress(50);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setGenerationProgress(80);
        
        // Determinar template baseado no tipo de usuário
        const finalTemplate = accessControl.userType === 'PRO' ? template : 'standard';
        
        // Salvar no histórico
        const { error: historyError } = await supabase
          .from('pdf_generations')
          .insert({
            user_id: user.user_id,
            template: finalTemplate,
            file_size: 1024000, // 1MB simulado
            page_count: finalTemplate === 'premium' ? 7 : 6,
            form_data: formData,
            ai_analysis: aiAnalysis,
            selected_images: [],
            created_at: new Date().toISOString()
          });

        if (historyError) {
          console.warn('Erro ao salvar histórico:', historyError);
        }

        setGenerationProgress(100);

        // Notificar conquista
        await notifyAchievementUnlocked('Primeiro Documento', 'pdf_generation');

        return {
          success: true,
          downloadUrl: '#', // URL simulada
          accessControl,
          metadata: {
            generatedAt: new Date(),
            template: finalTemplate,
            pageCount: finalTemplate === 'premium' ? 7 : 6,
            fileSize: 1024000
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
        
        refetchHistory();
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
      
      refetchAccess();
    },
    onError: (error) => {
      console.error('Erro no upgrade:', error);
      toast.error('Erro no upgrade', {
        description: 'Não foi possível processar o upgrade. Tente novamente.'
      });
    }
  });

  // Função para download do PDF (simulada)
  const downloadPDF = useCallback((url: string, filename?: string) => {
    // Por enquanto, apenas abre uma nova aba
    window.open(url, '_blank');
    toast.info('Download simulado', {
      description: 'Em produção, o PDF seria baixado automaticamente.'
    });
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
    
    // Dados
    pdfAccess,
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
    isInFreePeriod
  };
};

export default usePDFSimple;
