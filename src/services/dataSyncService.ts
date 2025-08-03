import { supabase } from '@/integrations/supabase/client';
import { contextService, SpecialistContextData } from './contextService';

export interface SyncableData {
  // Dados do Criador de Sonhos
  dreams_data?: {
    family_profile: any;
    immigration_goals: any;
    dreams_analysis: any;
    transformation_scenarios: any[];
    timeline_phases: any[];
    family_vision: string;
    ai_recommendations: any;
    completion_date: string;
  };
  
  // Dados do VisaMatch
  visamatch_data?: {
    analysis_results: any;
    recommended_strategy: string;
    probability_score: number;
    risk_factors: string[];
    opportunities: string[];
    detailed_analysis: any;
    completion_date: string;
  };
  
  // Dados do Chat com Especialista
  specialist_data?: {
    session_summaries: any[];
    recommendations: string[];
    action_items: string[];
    follow_up_notes: string;
    consultation_outcomes: any;
    specialist_ratings: number[];
  };
  
  // Dados do PDF
  pdf_data?: {
    generated_pdfs: any[];
    access_history: any[];
    download_count: number;
    last_generated: string;
  };
  
  // Metadados de sincronização
  sync_metadata: {
    last_sync: string;
    sync_version: number;
    data_integrity_hash: string;
    sync_conflicts: any[];
    auto_sync_enabled: boolean;
  };
}

export interface DataSyncRule {
  source_tool: 'dreams' | 'visamatch' | 'specialist' | 'pdf';
  target_tool: 'dreams' | 'visamatch' | 'specialist' | 'pdf';
  data_mapping: Record<string, string>;
  sync_trigger: 'immediate' | 'on_completion' | 'manual' | 'scheduled';
  validation_rules: {
    required_fields?: string[];
    data_transformations?: Record<string, (data: any) => any>;
    conflict_resolution?: 'source_wins' | 'target_wins' | 'merge' | 'manual';
  };
  conditions?: {
    user_subscription?: 'free' | 'pro';
    completion_status?: boolean;
    time_constraints?: {
      min_interval_minutes?: number;
      max_age_hours?: number;
    };
  };
}

class DataSyncService {
  private syncRules: DataSyncRule[] = [
    // Dreams → VisaMatch
    {
      source_tool: 'dreams',
      target_tool: 'visamatch',
      data_mapping: {
        'family_profile': 'user_profile',
        'immigration_goals': 'immigration_objectives',
        'dreams_analysis': 'context_analysis',
        'family_vision': 'family_aspirations'
      },
      sync_trigger: 'on_completion',
      validation_rules: {
        required_fields: ['family_profile', 'immigration_goals'],
        conflict_resolution: 'source_wins'
      }
    },
    
    // VisaMatch → Specialist
    {
      source_tool: 'visamatch',
      target_tool: 'specialist',
      data_mapping: {
        'analysis_results': 'visamatch_context',
        'recommended_strategy': 'primary_strategy',
        'probability_score': 'success_probability',
        'risk_factors': 'identified_risks',
        'opportunities': 'available_opportunities'
      },
      sync_trigger: 'on_completion',
      validation_rules: {
        required_fields: ['analysis_results', 'recommended_strategy'],
        conflict_resolution: 'merge'
      }
    },
    
    // Dreams → PDF
    {
      source_tool: 'dreams',
      target_tool: 'pdf',
      data_mapping: {
        'dreams_analysis': 'pdf_content_base',
        'transformation_scenarios': 'scenario_data',
        'family_profile': 'personalization_data'
      },
      sync_trigger: 'immediate',
      validation_rules: {
        required_fields: ['dreams_analysis'],
        conflict_resolution: 'source_wins'
      }
    },
    
    // Specialist → Dreams (feedback loop)
    {
      source_tool: 'specialist',
      target_tool: 'dreams',
      data_mapping: {
        'recommendations': 'specialist_insights',
        'action_items': 'recommended_actions'
      },
      sync_trigger: 'on_completion',
      validation_rules: {
        conflict_resolution: 'merge'
      }
    }
  ];

  /**
   * Sincroniza dados entre ferramentas baseado nas regras
   */
  async syncData(
    userId: string, 
    sourceTool: DataSyncRule['source_tool'], 
    sourceData: any,
    options: {
      force?: boolean;
      validate?: boolean;
      create_backup?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    synced_tools: string[];
    conflicts: any[];
    errors: string[];
  }> {
    const { force = false, validate = true, create_backup = true } = options;
    
    try {
      // Criar backup se solicitado
      if (create_backup) {
        await this.createDataBackup(userId, sourceTool, sourceData);
      }

      const applicableRules = this.syncRules.filter(rule => rule.source_tool === sourceTool);
      const syncResults = {
        success: true,
        synced_tools: [] as string[],
        conflicts: [] as any[],
        errors: [] as string[]
      };

      for (const rule of applicableRules) {
        try {
          // Verificar condições da regra
          const canSync = await this.checkSyncConditions(userId, rule, sourceData);
          if (!canSync && !force) {
            continue;
          }

          // Executar sincronização
          const syncResult = await this.executeSyncRule(userId, rule, sourceData, validate);
          
          if (syncResult.success) {
            syncResults.synced_tools.push(rule.target_tool);
            syncResults.conflicts.push(...syncResult.conflicts);
          } else {
            syncResults.errors.push(...syncResult.errors);
          }
        } catch (error) {
          console.error(`Erro na sincronização ${sourceTool} → ${rule.target_tool}:`, error);
          syncResults.errors.push(`Failed to sync to ${rule.target_tool}: ${error.message}`);
        }
      }

      // Atualizar metadados de sincronização
      await this.updateSyncMetadata(userId, sourceTool, syncResults);

      // Verificar integridade dos dados
      if (validate) {
        await this.validateDataIntegrity(userId);
      }

      return syncResults;
    } catch (error) {
      console.error('Erro geral na sincronização:', error);
      return {
        success: false,
        synced_tools: [],
        conflicts: [],
        errors: [error.message]
      };
    }
  }

  /**
   * Executa uma regra de sincronização específica
   */
  private async executeSyncRule(
    userId: string,
    rule: DataSyncRule,
    sourceData: any,
    validate: boolean
  ): Promise<{
    success: boolean;
    conflicts: any[];
    errors: string[];
  }> {
    try {
      // Buscar dados atuais do target
      const currentTargetData = await this.getToolData(userId, rule.target_tool);
      
      // Mapear dados usando as regras de mapeamento
      const mappedData = this.mapData(sourceData, rule.data_mapping);
      
      // Aplicar transformações se definidas
      const transformedData = await this.applyDataTransformations(
        mappedData, 
        rule.validation_rules.data_transformations
      );

      // Detectar conflitos
      const conflicts = this.detectConflicts(currentTargetData, transformedData);
      
      // Resolver conflitos baseado na estratégia
      const resolvedData = await this.resolveConflicts(
        currentTargetData,
        transformedData,
        conflicts,
        rule.validation_rules.conflict_resolution || 'merge'
      );

      // Validar dados se solicitado
      if (validate && rule.validation_rules.required_fields) {
        const validationErrors = this.validateRequiredFields(
          resolvedData, 
          rule.validation_rules.required_fields
        );
        
        if (validationErrors.length > 0) {
          return {
            success: false,
            conflicts,
            errors: validationErrors
          };
        }
      }

      // Salvar dados sincronizados
      await this.saveToolData(userId, rule.target_tool, resolvedData);

      // Disparar eventos de sincronização
      await this.triggerSyncEvents(userId, rule.source_tool, rule.target_tool, resolvedData);

      return {
        success: true,
        conflicts,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        conflicts: [],
        errors: [error.message]
      };
    }
  }

  /**
   * Mapeia dados baseado nas regras de mapeamento
   */
  private mapData(sourceData: any, mapping: Record<string, string>): any {
    const mappedData: any = {};
    
    for (const [sourceField, targetField] of Object.entries(mapping)) {
      const value = this.getNestedValue(sourceData, sourceField);
      if (value !== undefined) {
        this.setNestedValue(mappedData, targetField, value);
      }
    }
    
    return mappedData;
  }

  /**
   * Aplica transformações de dados
   */
  private async applyDataTransformations(
    data: any, 
    transformations?: Record<string, (data: any) => any>
  ): Promise<any> {
    if (!transformations) return data;
    
    const transformedData = { ...data };
    
    for (const [field, transformer] of Object.entries(transformations)) {
      const value = this.getNestedValue(transformedData, field);
      if (value !== undefined) {
        const transformedValue = await transformer(value);
        this.setNestedValue(transformedData, field, transformedValue);
      }
    }
    
    return transformedData;
  }

  /**
   * Detecta conflitos entre dados atuais e novos
   */
  private detectConflicts(currentData: any, newData: any): any[] {
    const conflicts: any[] = [];
    
    const checkConflicts = (current: any, incoming: any, path: string = '') => {
      for (const key in incoming) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (current && current[key] !== undefined && current[key] !== incoming[key]) {
          // Verificar se é realmente um conflito (não apenas atualização)
          if (typeof current[key] === 'object' && typeof incoming[key] === 'object') {
            checkConflicts(current[key], incoming[key], currentPath);
          } else {
            conflicts.push({
              field: currentPath,
              current_value: current[key],
              incoming_value: incoming[key],
              conflict_type: 'value_mismatch'
            });
          }
        }
      }
    };
    
    checkConflicts(currentData, newData);
    return conflicts;
  }

  /**
   * Resolve conflitos baseado na estratégia definida
   */
  private async resolveConflicts(
    currentData: any,
    newData: any,
    conflicts: any[],
    strategy: DataSyncRule['validation_rules']['conflict_resolution']
  ): Promise<any> {
    if (conflicts.length === 0) {
      return { ...currentData, ...newData };
    }

    switch (strategy) {
      case 'source_wins':
        return { ...currentData, ...newData };
        
      case 'target_wins':
        return currentData;
        
      case 'merge':
        return this.mergeData(currentData, newData);
        
      case 'manual':
        // Salvar conflitos para resolução manual
        await this.saveConflictsForManualResolution(conflicts);
        return currentData; // Manter dados atuais até resolução manual
        
      default:
        return this.mergeData(currentData, newData);
    }
  }

  /**
   * Merge inteligente de dados
   */
  private mergeData(current: any, incoming: any): any {
    const merged = { ...current };
    
    for (const key in incoming) {
      if (incoming[key] !== undefined) {
        if (Array.isArray(incoming[key]) && Array.isArray(current[key])) {
          // Merge arrays removendo duplicatas
          merged[key] = [...new Set([...current[key], ...incoming[key]])];
        } else if (typeof incoming[key] === 'object' && typeof current[key] === 'object') {
          // Merge recursivo para objetos
          merged[key] = this.mergeData(current[key], incoming[key]);
        } else {
          // Para valores primitivos, usar o mais recente (incoming)
          merged[key] = incoming[key];
        }
      }
    }
    
    return merged;
  }

  /**
   * Busca dados de uma ferramenta específica
   */
  private async getToolData(userId: string, tool: string): Promise<any> {
    try {
      const tableName = this.getTableNameForTool(tool);
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data || {};
    } catch (error) {
      console.error(`Erro ao buscar dados de ${tool}:`, error);
      return {};
    }
  }

  /**
   * Salva dados de uma ferramenta específica
   */
  private async saveToolData(userId: string, tool: string, data: any): Promise<void> {
    try {
      const tableName = this.getTableNameForTool(tool);
      
      const { error } = await supabase
        .from(tableName)
        .upsert({
          user_id: userId,
          ...data,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error(`Erro ao salvar dados de ${tool}:`, error);
      throw error;
    }
  }

  /**
   * Mapeia ferramentas para nomes de tabelas
   */
  private getTableNameForTool(tool: string): string {
    const toolTableMap: Record<string, string> = {
      'dreams': 'multistep_forms',
      'visamatch': 'prospects',
      'specialist': 'chat_sessions',
      'pdf': 'pdf_generations'
    };
    
    return toolTableMap[tool] || 'user_data_sync';
  }

  /**
   * Verifica condições para sincronização
   */
  private async checkSyncConditions(
    userId: string, 
    rule: DataSyncRule, 
    sourceData: any
  ): Promise<boolean> {
    try {
      // Verificar condições de assinatura
      if (rule.conditions?.user_subscription) {
        const userSubscription = await this.getUserSubscription(userId);
        if (userSubscription !== rule.conditions.user_subscription) {
          return false;
        }
      }

      // Verificar status de conclusão
      if (rule.conditions?.completion_status !== undefined) {
        const isCompleted = sourceData.is_completed || false;
        if (isCompleted !== rule.conditions.completion_status) {
          return false;
        }
      }

      // Verificar restrições de tempo
      if (rule.conditions?.time_constraints) {
        const lastSync = await this.getLastSyncTime(userId, rule.source_tool, rule.target_tool);
        const now = new Date();
        
        if (rule.conditions.time_constraints.min_interval_minutes) {
          const minInterval = rule.conditions.time_constraints.min_interval_minutes * 60 * 1000;
          if (lastSync && (now.getTime() - lastSync.getTime()) < minInterval) {
            return false;
          }
        }
        
        if (rule.conditions.time_constraints.max_age_hours) {
          const maxAge = rule.conditions.time_constraints.max_age_hours * 60 * 60 * 1000;
          const dataAge = sourceData.updated_at ? 
            now.getTime() - new Date(sourceData.updated_at).getTime() : 0;
          if (dataAge > maxAge) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Erro ao verificar condições de sincronização:', error);
      return false;
    }
  }

  /**
   * Utilitários para manipulação de dados aninhados
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Validação de campos obrigatórios
   */
  private validateRequiredFields(data: any, requiredFields: string[]): string[] {
    const errors: string[] = [];
    
    for (const field of requiredFields) {
      const value = this.getNestedValue(data, field);
      if (value === undefined || value === null || value === '') {
        errors.push(`Campo obrigatório ausente: ${field}`);
      }
    }
    
    return errors;
  }

  /**
   * Métodos auxiliares
   */
  private async createDataBackup(userId: string, tool: string, data: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('data_sync_backups')
        .insert({
          user_id: userId,
          tool_name: tool,
          backup_data: data,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao criar backup:', error);
    }
  }

  private async updateSyncMetadata(userId: string, tool: string, syncResult: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('data_sync_metadata')
        .upsert({
          user_id: userId,
          tool_name: tool,
          last_sync: new Date().toISOString(),
          sync_result: syncResult,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar metadados de sincronização:', error);
    }
  }

  private async validateDataIntegrity(userId: string): Promise<void> {
    // Implementar validação de integridade dos dados
    // Verificar consistência entre ferramentas
  }

  private async triggerSyncEvents(
    userId: string, 
    sourceTool: string, 
    targetTool: string, 
    data: any
  ): Promise<void> {
    // Disparar eventos para notificar outros sistemas sobre a sincronização
    console.log(`Sync event: ${sourceTool} → ${targetTool} for user ${userId}`);
  }

  private async getUserSubscription(userId: string): Promise<'free' | 'pro'> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) return 'free';
      return data?.role === 'pro' ? 'pro' : 'free';
    } catch (error) {
      return 'free';
    }
  }

  private async getLastSyncTime(
    userId: string, 
    sourceTool: string, 
    targetTool: string
  ): Promise<Date | null> {
    try {
      const { data, error } = await supabase
        .from('data_sync_metadata')
        .select('last_sync')
        .eq('user_id', userId)
        .eq('tool_name', sourceTool)
        .single();

      if (error || !data) return null;
      return new Date(data.last_sync);
    } catch (error) {
      return null;
    }
  }

  private async saveConflictsForManualResolution(conflicts: any[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('data_sync_conflicts')
        .insert(conflicts.map(conflict => ({
          ...conflict,
          status: 'pending',
          created_at: new Date().toISOString()
        })));

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao salvar conflitos:', error);
    }
  }

  /**
   * APIs públicas para uso nos componentes
   */

  /**
   * Sincronização automática quando Dreams é completado
   */
  async onDreamsCompleted(userId: string, dreamsData: any): Promise<void> {
    await this.syncData(userId, 'dreams', dreamsData, { validate: true });
  }

  /**
   * Sincronização automática quando VisaMatch é completado
   */
  async onVisaMatchCompleted(userId: string, visaMatchData: any): Promise<void> {
    await this.syncData(userId, 'visamatch', visaMatchData, { validate: true });
  }

  /**
   * Sincronização automática quando Chat com Especialista termina
   */
  async onSpecialistChatCompleted(userId: string, chatData: any): Promise<void> {
    await this.syncData(userId, 'specialist', chatData, { validate: true });
  }

  /**
   * Sincronização manual forçada
   */
  async forceSyncAll(userId: string): Promise<any> {
    const results = {
      dreams: null,
      visamatch: null,
      specialist: null,
      pdf: null
    };

    // Buscar dados de todas as ferramentas
    for (const tool of ['dreams', 'visamatch', 'specialist', 'pdf'] as const) {
      try {
        const toolData = await this.getToolData(userId, tool);
        if (toolData && Object.keys(toolData).length > 0) {
          results[tool] = await this.syncData(userId, tool, toolData, { 
            force: true, 
            validate: false 
          });
        }
      } catch (error) {
        console.error(`Erro na sincronização forçada de ${tool}:`, error);
      }
    }

    return results;
  }

  /**
   * Obter status de sincronização
   */
  async getSyncStatus(userId: string): Promise<{
    last_sync: string | null;
    sync_health: 'healthy' | 'warning' | 'error';
    pending_conflicts: number;
    tools_synced: string[];
  }> {
    try {
      const { data: metadata } = await supabase
        .from('data_sync_metadata')
        .select('*')
        .eq('user_id', userId);

      const { data: conflicts } = await supabase
        .from('data_sync_conflicts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending');

      const lastSync = metadata?.length > 0 ? 
        Math.max(...metadata.map(m => new Date(m.last_sync).getTime())) : null;

      return {
        last_sync: lastSync ? new Date(lastSync).toISOString() : null,
        sync_health: conflicts?.length > 0 ? 'warning' : 'healthy',
        pending_conflicts: conflicts?.length || 0,
        tools_synced: metadata?.map(m => m.tool_name) || []
      };
    } catch (error) {
      return {
        last_sync: null,
        sync_health: 'error',
        pending_conflicts: 0,
        tools_synced: []
      };
    }
  }
}

export const dataSyncService = new DataSyncService();
export default dataSyncService;
