import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AutoSaveConfig, SaveState } from '@/types/forms';
import { useToast } from '@/hooks/use-toast';

interface UseFormPersistenceProps<T> {
  formData: T;
  config: AutoSaveConfig;
  tableName: string;
  userId?: string;
  recordId?: string;
}

export function useFormPersistence<T extends Record<string, any>>({
  formData,
  config,
  tableName,
  userId,
  recordId
}: UseFormPersistenceProps<T>) {
  const [saveState, setSaveState] = useState<SaveState>({
    last_saved: null,
    is_saving: false,
    has_unsaved_changes: false
  });
  
  const { toast } = useToast();

  // Local Storage Key
  const getStorageKey = useCallback(() => {
    return `${config.key_prefix}_${tableName}_${userId || 'anonymous'}`;
  }, [config.key_prefix, tableName, userId]);

  // Save to localStorage
  const saveToLocalStorage = useCallback((data: T) => {
    try {
      const storageData = {
        data,
        timestamp: new Date().toISOString(),
        userId
      };
      localStorage.setItem(getStorageKey(), JSON.stringify(storageData));
      return true;
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
      return false;
    }
  }, [getStorageKey, userId]);

  // Load from localStorage
  const loadFromLocalStorage = useCallback((): T | null => {
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (stored) {
        const parsedData = JSON.parse(stored);
        return parsedData.data;
      }
      return null;
    } catch (error) {
      console.error('Erro ao carregar do localStorage:', error);
      return null;
    }
  }, [getStorageKey]);

  // Save to Supabase
  const saveToSupabase = useCallback(async (data: T): Promise<boolean> => {
    if (!userId) return false;

    try {
      setSaveState(prev => ({ ...prev, is_saving: true }));

      const saveData = {
        ...data,
        user_id: userId,
        updated_at: new Date().toISOString()
      };

      let result;
      if (recordId) {
        // Update existing record
        result = await supabase
          .from(tableName)
          .update(saveData)
          .eq('id', recordId)
          .eq('user_id', userId);
      } else {
        // Insert new record
        result = await supabase
          .from(tableName)
          .insert([{
            ...saveData,
            created_at: new Date().toISOString()
          }]);
      }

      if (result.error) {
        throw result.error;
      }

      setSaveState(prev => ({
        ...prev,
        last_saved: new Date(),
        has_unsaved_changes: false
      }));

      return true;
    } catch (error) {
      console.error('Erro ao salvar no Supabase:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar automaticamente. Seus dados estão seguros localmente."
      });
      return false;
    } finally {
      setSaveState(prev => ({ ...prev, is_saving: false }));
    }
  }, [userId, recordId, tableName, toast]);

  // Auto-save function
  const autoSave = useCallback(async () => {
    if (!config.enabled || !saveState.has_unsaved_changes) return;

    let success = false;

    if (config.storage === 'supabase' && userId) {
      success = await saveToSupabase(formData);
    }

    // Always save to localStorage as backup
    if (config.storage === 'localStorage' || !success) {
      success = saveToLocalStorage(formData);
    }

    if (success && config.storage === 'localStorage') {
      setSaveState(prev => ({
        ...prev,
        last_saved: new Date(),
        has_unsaved_changes: false
      }));
    }
  }, [config, saveState.has_unsaved_changes, userId, formData, saveToSupabase, saveToLocalStorage]);

  // Manual save function
  const saveNow = useCallback(async (): Promise<boolean> => {
    let success = false;

    if (config.storage === 'supabase' && userId) {
      success = await saveToSupabase(formData);
    } else {
      success = saveToLocalStorage(formData);
      if (success) {
        setSaveState(prev => ({
          ...prev,
          last_saved: new Date(),
          has_unsaved_changes: false
        }));
      }
    }

    if (success) {
      toast({
        title: "Dados salvos",
        description: "Suas informações foram salvas com sucesso.",
      });
    }

    return success;
  }, [config.storage, userId, formData, saveToSupabase, saveToLocalStorage, toast]);

  // Load saved data
  const loadSavedData = useCallback((): T | null => {
    return loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  // Clear saved data
  const clearSavedData = useCallback(() => {
    localStorage.removeItem(getStorageKey());
    setSaveState({
      last_saved: null,
      is_saving: false,
      has_unsaved_changes: false
    });
  }, [getStorageKey]);

  // Track changes
  useEffect(() => {
    setSaveState(prev => ({ ...prev, has_unsaved_changes: true }));
  }, [formData]);

  // Auto-save interval
  useEffect(() => {
    if (!config.enabled) return;

    const interval = setInterval(autoSave, config.interval);
    return () => clearInterval(interval);
  }, [config.enabled, config.interval, autoSave]);

  // Format last saved time
  const formatLastSaved = useCallback(() => {
    if (!saveState.last_saved) return '';
    
    const now = new Date();
    const diff = Math.floor((now.getTime() - saveState.last_saved.getTime()) / 1000);
    
    if (diff < 60) return 'Salvo agora';
    if (diff < 3600) return `Salvo há ${Math.floor(diff / 60)} min`;
    return `Salvo há ${Math.floor(diff / 3600)}h`;
  }, [saveState.last_saved]);

  return {
    saveState,
    saveNow,
    loadSavedData,
    clearSavedData,
    formatLastSaved,
    autoSave
  };
}

export default useFormPersistence;
