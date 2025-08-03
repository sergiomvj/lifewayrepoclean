import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TableStatus {
  exists: boolean;
  checked: boolean;
  error?: string;
}

interface TablesStatus {
  user_contexts: TableStatus;
  user_profiles: TableStatus;
  user_tool_usage: TableStatus;
  dream_goals: TableStatus;
  dreams_submissions: TableStatus;
  visamatch_analyses: TableStatus;
  chat_sessions: TableStatus;
  chat_messages: TableStatus;
  generated_pdfs: TableStatus;
}

/**
 * Hook para verificar se as tabelas necessárias existem no banco
 * Evita erros 404 ao tentar acessar tabelas inexistentes
 */
export const useTableCheck = () => {
  const [tablesStatus, setTablesStatus] = useState<TablesStatus>({
    user_contexts: { exists: false, checked: false },
    user_profiles: { exists: false, checked: false },
    user_tool_usage: { exists: false, checked: false },
    dream_goals: { exists: false, checked: false },
    dreams_submissions: { exists: false, checked: false },
    visamatch_analyses: { exists: false, checked: false },
    chat_sessions: { exists: false, checked: false },
    chat_messages: { exists: false, checked: false },
    generated_pdfs: { exists: false, checked: false },
  });

  const [isLoading, setIsLoading] = useState(true);

  const checkTableExists = async (tableName: string): Promise<boolean> => {
    try {
      // Tentar fazer uma query simples para verificar se a tabela existe
      const { error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .limit(1);

      // Se não há erro, a tabela existe
      if (!error) return true;

      // Se o erro é 404 ou relacionado à tabela não existir
      if (error.code === 'PGRST106' || error.message.includes('does not exist')) {
        return false;
      }

      // Para outros erros (como permissões), assumir que a tabela existe
      return true;
    } catch (error) {
      console.warn(`Erro ao verificar tabela ${tableName}:`, error);
      return false;
    }
  };

  const checkAllTables = async () => {
    setIsLoading(true);
    
    const tableNames = Object.keys(tablesStatus) as (keyof TablesStatus)[];
    const results: Partial<TablesStatus> = {};

    for (const tableName of tableNames) {
      try {
        const exists = await checkTableExists(tableName);
        results[tableName] = {
          exists,
          checked: true,
          error: exists ? undefined : `Tabela ${tableName} não existe`
        };
      } catch (error: any) {
        results[tableName] = {
          exists: false,
          checked: true,
          error: error.message || `Erro ao verificar ${tableName}`
        };
      }
    }

    setTablesStatus(results as TablesStatus);
    setIsLoading(false);
  };

  useEffect(() => {
    checkAllTables();
  }, []);

  // Função para verificar se uma tabela específica existe
  const tableExists = (tableName: keyof TablesStatus): boolean => {
    return tablesStatus[tableName]?.exists || false;
  };

  // Função para verificar se uma tabela foi verificada
  const tableChecked = (tableName: keyof TablesStatus): boolean => {
    return tablesStatus[tableName]?.checked || false;
  };

  // Função para recarregar verificação de uma tabela específica
  const recheckTable = async (tableName: keyof TablesStatus) => {
    const exists = await checkTableExists(tableName);
    setTablesStatus(prev => ({
      ...prev,
      [tableName]: {
        exists,
        checked: true,
        error: exists ? undefined : `Tabela ${tableName} não existe`
      }
    }));
  };

  // Estatísticas das tabelas
  const stats = {
    total: Object.keys(tablesStatus).length,
    existing: Object.values(tablesStatus).filter(status => status.exists).length,
    missing: Object.values(tablesStatus).filter(status => status.checked && !status.exists).length,
    checked: Object.values(tablesStatus).filter(status => status.checked).length
  };

  return {
    tablesStatus,
    isLoading,
    tableExists,
    tableChecked,
    recheckTable,
    checkAllTables,
    stats
  };
};

export default useTableCheck;
