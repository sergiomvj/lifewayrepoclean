import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataSyncService, SyncableData } from '@/services/dataSyncService';
import { useUserContext } from './useUserContext';
import { useUnifiedFlow } from './useUnifiedFlow';

interface UseDataSyncOptions {
  autoSync?: boolean;
  syncOnMount?: boolean;
  enableRealtime?: boolean;
  conflictResolution?: 'source_wins' | 'target_wins' | 'merge' | 'manual';
}

interface UseDataSyncReturn {
  // Estado de sincronização
  syncStatus: {
    last_sync: string | null;
    sync_health: 'healthy' | 'warning' | 'error';
    pending_conflicts: number;
    tools_synced: string[];
  } | null;
  
  // Estado de carregamento
  isSyncing: boolean;
  isLoadingSyncStatus: boolean;
  
  // Ações de sincronização
  syncDreamsData: (data: any) => Promise<void>;
  syncVisaMatchData: (data: any) => Promise<void>;
  syncSpecialistData: (data: any) => Promise<void>;
  forceSyncAll: () => Promise<void>;
  
  // Utilitários
  refreshSyncStatus: () => void;
  clearSyncErrors: () => void;
  
  // Estado de erro
  syncError: string | null;
  conflicts: any[];
}

export function useDataSync(options: UseDataSyncOptions = {}): UseDataSyncReturn {
  const {
    autoSync = true,
    syncOnMount = true,
    enableRealtime = true,
    conflictResolution = 'merge'
  } = options;
  
  const { userContext } = useUserContext();
  const { currentStep, markActionCompleted } = useUnifiedFlow();
  const queryClient = useQueryClient();
  
  // Estados locais
  const [syncError, setSyncError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Query para status de sincronização
  const {
    data: syncStatus,
    isLoading: isLoadingSyncStatus,
    refetch: refreshSyncStatus
  } = useQuery({
    queryKey: ['sync-status', userContext?.user_id],
    queryFn: async () => {
      if (!userContext?.user_id) return null;
      return dataSyncService.getSyncStatus(userContext.user_id);
    },
    enabled: !!userContext?.user_id,
    refetchInterval: enableRealtime ? 30000 : false, // 30 segundos se realtime ativo
    staleTime: 15000 // 15 segundos
  });

  // Mutation para sincronização do Dreams
  const syncDreamsMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!userContext?.user_id) {
        throw new Error('Usuário não autenticado');
      }
      
      setIsSyncing(true);
      return dataSyncService.onDreamsCompleted(userContext.user_id, data);
    },
    onSuccess: async () => {
      setSyncError(null);
      
      // Marcar ação como completada no fluxo
      await markActionCompleted('dreams_data_synced');
      
      // Atualizar cache de status
      refreshSyncStatus();
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: ['visamatch-data', userContext?.user_id]
      });
    },
    onError: (error: Error) => {
      setSyncError(`Erro na sincronização do Dreams: ${error.message}`);
    },
    onSettled: () => {
      setIsSyncing(false);
    }
  });

  // Mutation para sincronização do VisaMatch
  const syncVisaMatchMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!userContext?.user_id) {
        throw new Error('Usuário não autenticado');
      }
      
      setIsSyncing(true);
      return dataSyncService.onVisaMatchCompleted(userContext.user_id, data);
    },
    onSuccess: async () => {
      setSyncError(null);
      
      // Marcar ação como completada no fluxo
      await markActionCompleted('visamatch_data_synced');
      
      // Atualizar cache de status
      refreshSyncStatus();
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: ['specialist-context', userContext?.user_id]
      });
    },
    onError: (error: Error) => {
      setSyncError(`Erro na sincronização do VisaMatch: ${error.message}`);
    },
    onSettled: () => {
      setIsSyncing(false);
    }
  });

  // Mutation para sincronização do Chat Especialista
  const syncSpecialistMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!userContext?.user_id) {
        throw new Error('Usuário não autenticado');
      }
      
      setIsSyncing(true);
      return dataSyncService.onSpecialistChatCompleted(userContext.user_id, data);
    },
    onSuccess: async () => {
      setSyncError(null);
      
      // Marcar ação como completada no fluxo
      await markActionCompleted('specialist_data_synced');
      
      // Atualizar cache de status
      refreshSyncStatus();
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: ['action-plan', userContext?.user_id]
      });
    },
    onError: (error: Error) => {
      setSyncError(`Erro na sincronização do Chat: ${error.message}`);
    },
    onSettled: () => {
      setIsSyncing(false);
    }
  });

  // Mutation para sincronização forçada de todos os dados
  const forceSyncMutation = useMutation({
    mutationFn: async () => {
      if (!userContext?.user_id) {
        throw new Error('Usuário não autenticado');
      }
      
      setIsSyncing(true);
      return dataSyncService.forceSyncAll(userContext.user_id);
    },
    onSuccess: (results) => {
      setSyncError(null);
      
      // Processar resultados e conflitos
      const allConflicts = Object.values(results)
        .filter(result => result && result.conflicts)
        .flatMap(result => result.conflicts);
      
      setConflicts(allConflicts);
      
      // Atualizar cache
      refreshSyncStatus();
      
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return ['dreams-data', 'visamatch-data', 'specialist-context', 'pdf-data'].includes(key);
        }
      });
    },
    onError: (error: Error) => {
      setSyncError(`Erro na sincronização geral: ${error.message}`);
    },
    onSettled: () => {
      setIsSyncing(false);
    }
  });

  // Auto-sincronização baseada no passo atual do fluxo
  useEffect(() => {
    if (!autoSync || !userContext?.user_id) return;

    // Configurar listeners para mudanças nos dados das ferramentas
    const handleDataChange = async (toolName: string, data: any) => {
      try {
        switch (toolName) {
          case 'dreams':
            if (data.is_completed) {
              await syncDreamsMutation.mutateAsync(data);
            }
            break;
          case 'visamatch':
            if (data.analysis_completed) {
              await syncVisaMatchMutation.mutateAsync(data);
            }
            break;
          case 'specialist':
            if (data.session_completed) {
              await syncSpecialistMutation.mutateAsync(data);
            }
            break;
        }
      } catch (error) {
        console.error(`Erro na auto-sincronização de ${toolName}:`, error);
      }
    };

    // Implementar listeners baseados no Supabase Realtime se necessário
    // Por enquanto, usar polling baseado no passo atual
    
  }, [autoSync, userContext?.user_id, currentStep]);

  // Sincronização inicial ao montar o componente
  useEffect(() => {
    if (syncOnMount && userContext?.user_id && !isLoadingSyncStatus) {
      // Verificar se há dados desatualizados que precisam ser sincronizados
      const checkAndSyncStaleData = async () => {
        try {
          const status = await dataSyncService.getSyncStatus(userContext.user_id);
          
          // Se não houve sincronização recente, fazer sync forçado
          if (!status.last_sync || 
              (new Date().getTime() - new Date(status.last_sync).getTime()) > 24 * 60 * 60 * 1000) {
            await forceSyncMutation.mutateAsync();
          }
        } catch (error) {
          console.error('Erro na verificação de dados obsoletos:', error);
        }
      };

      checkAndSyncStaleData();
    }
  }, [syncOnMount, userContext?.user_id, isLoadingSyncStatus]);

  // Monitorar conflitos e notificar usuário
  useEffect(() => {
    if (syncStatus?.pending_conflicts > 0) {
      // Implementar notificação de conflitos pendentes
      console.warn(`${syncStatus.pending_conflicts} conflitos de sincronização pendentes`);
    }
  }, [syncStatus?.pending_conflicts]);

  // Ações expostas
  const syncDreamsData = useCallback(async (data: any) => {
    await syncDreamsMutation.mutateAsync(data);
  }, [syncDreamsMutation]);

  const syncVisaMatchData = useCallback(async (data: any) => {
    await syncVisaMatchMutation.mutateAsync(data);
  }, [syncVisaMatchMutation]);

  const syncSpecialistData = useCallback(async (data: any) => {
    await syncSpecialistMutation.mutateAsync(data);
  }, [syncSpecialistMutation]);

  const forceSyncAll = useCallback(async () => {
    await forceSyncMutation.mutateAsync();
  }, [forceSyncMutation]);

  const clearSyncErrors = useCallback(() => {
    setSyncError(null);
    setConflicts([]);
  }, []);

  return {
    // Estado de sincronização
    syncStatus,
    
    // Estado de carregamento
    isSyncing: isSyncing || syncDreamsMutation.isPending || syncVisaMatchMutation.isPending || 
               syncSpecialistMutation.isPending || forceSyncMutation.isPending,
    isLoadingSyncStatus,
    
    // Ações de sincronização
    syncDreamsData,
    syncVisaMatchData,
    syncSpecialistData,
    forceSyncAll,
    
    // Utilitários
    refreshSyncStatus,
    clearSyncErrors,
    
    // Estado de erro
    syncError,
    conflicts
  };
}

// Hook específico para sincronização automática baseada em eventos
export function useAutoSync(toolName: 'dreams' | 'visamatch' | 'specialist') {
  const { syncDreamsData, syncVisaMatchData, syncSpecialistData } = useDataSync({
    autoSync: true,
    enableRealtime: true
  });

  const syncData = useCallback(async (data: any) => {
    switch (toolName) {
      case 'dreams':
        await syncDreamsData(data);
        break;
      case 'visamatch':
        await syncVisaMatchData(data);
        break;
      case 'specialist':
        await syncSpecialistData(data);
        break;
    }
  }, [toolName, syncDreamsData, syncVisaMatchData, syncSpecialistData]);

  return { syncData };
}

// Hook para monitoramento de conflitos
export function useSyncConflicts() {
  const { conflicts, syncStatus, clearSyncErrors } = useDataSync();
  const [resolvedConflicts, setResolvedConflicts] = useState<string[]>([]);

  const resolveConflict = useCallback(async (conflictId: string, resolution: any) => {
    try {
      // Implementar resolução de conflito
      // await dataSyncService.resolveConflict(conflictId, resolution);
      
      setResolvedConflicts(prev => [...prev, conflictId]);
    } catch (error) {
      console.error('Erro ao resolver conflito:', error);
    }
  }, []);

  const pendingConflicts = conflicts.filter(
    conflict => !resolvedConflicts.includes(conflict.id)
  );

  return {
    pendingConflicts,
    totalConflicts: syncStatus?.pending_conflicts || 0,
    resolveConflict,
    clearAllConflicts: clearSyncErrors
  };
}

// Hook para status de sincronização em tempo real
export function useSyncStatus() {
  const { syncStatus, refreshSyncStatus, isSyncing } = useDataSync({
    enableRealtime: true
  });

  const getSyncHealthColor = useCallback(() => {
    switch (syncStatus?.sync_health) {
      case 'healthy': return 'green';
      case 'warning': return 'yellow';
      case 'error': return 'red';
      default: return 'gray';
    }
  }, [syncStatus?.sync_health]);

  const getSyncHealthMessage = useCallback(() => {
    switch (syncStatus?.sync_health) {
      case 'healthy': return 'Todos os dados estão sincronizados';
      case 'warning': return `${syncStatus.pending_conflicts} conflitos pendentes`;
      case 'error': return 'Erro na sincronização de dados';
      default: return 'Status desconhecido';
    }
  }, [syncStatus]);

  const getLastSyncText = useCallback(() => {
    if (!syncStatus?.last_sync) return 'Nunca sincronizado';
    
    const lastSync = new Date(syncStatus.last_sync);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Agora mesmo';
    if (diffMinutes < 60) return `${diffMinutes} minutos atrás`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} horas atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} dias atrás`;
  }, [syncStatus?.last_sync]);

  return {
    syncStatus,
    isSyncing,
    healthColor: getSyncHealthColor(),
    healthMessage: getSyncHealthMessage(),
    lastSyncText: getLastSyncText(),
    refreshStatus: refreshSyncStatus
  };
}
