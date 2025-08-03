import { supabase } from '@/integrations/supabase/client';

export interface ToolUsage {
  id: string;
  user_id: string;
  tool_name: string;
  tool_display_name: string;
  first_used_at: string;
  last_used_at: string;
  usage_count: number;
  total_time_spent: number;
  status: 'not_started' | 'in_progress' | 'completed';
  completion_percentage: number;
  tool_data: any;
  results_generated: number;
  last_result_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ToolUsageStats {
  total_tools: number;
  used_tools: number;
  completed_tools: number;
  in_progress_tools: number;
  total_usage_time: number;
  most_used_tool: string;
  completion_rate: number;
}

class ToolUsageService {
  // Obter todas as ferramentas do usuário
  async getUserToolUsage(userId: string): Promise<ToolUsage[]> {
    try {
      const { data, error } = await supabase
        .from('user_tool_usage')
        .select('*')
        .eq('user_id', userId)
        .order('last_used_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user tool usage:', error);
      throw error;
    }
  }

  // Obter ferramentas utilizadas (com uso > 0)
  async getUsedTools(userId: string): Promise<ToolUsage[]> {
    try {
      const { data, error } = await supabase
        .from('user_tool_usage')
        .select('*')
        .eq('user_id', userId)
        .gt('usage_count', 0)
        .order('last_used_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching used tools:', error);
      throw error;
    }
  }

  // Obter ferramentas não utilizadas
  async getUnusedTools(userId: string): Promise<ToolUsage[]> {
    try {
      const { data, error } = await supabase
        .from('user_tool_usage')
        .select('*')
        .eq('user_id', userId)
        .eq('usage_count', 0)
        .order('tool_display_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching unused tools:', error);
      throw error;
    }
  }

  // Registrar uso de ferramenta
  async trackToolUsage(
    userId: string, 
    toolName: string, 
    timeSpent: number = 0,
    additionalData: any = {}
  ): Promise<void> {
    try {
      // Primeiro, verificar se já existe registro
      const { data: existing } = await supabase
        .from('user_tool_usage')
        .select('*')
        .eq('user_id', userId)
        .eq('tool_name', toolName)
        .single();

      if (existing) {
        // Atualizar registro existente
        const { error } = await supabase
          .from('user_tool_usage')
          .update({
            last_used_at: new Date().toISOString(),
            usage_count: existing.usage_count + 1,
            total_time_spent: existing.total_time_spent + timeSpent,
            status: 'in_progress',
            tool_data: { ...existing.tool_data, ...additionalData }
          })
          .eq('user_id', userId)
          .eq('tool_name', toolName);

        if (error) throw error;
      } else {
        // Criar novo registro
        const toolDisplayNames: Record<string, string> = {
          'dreams': 'Criador de Sonhos',
          'visa_match': 'VisaMatch',
          'specialist_chat': 'Chat com Especialista',
          'pdf_generator': 'Gerador de PDF',
          'family_planner': 'FamilyPlanner',
          'get_opportunity': 'GetOpportunity',
          'project_usa': 'ProjectUSA',
          'service_way': 'ServiceWay',
          'calcway': 'CalcWay',
          'interview_simulator': 'Simulador de Entrevista'
        };

        const { error } = await supabase
          .from('user_tool_usage')
          .insert({
            user_id: userId,
            tool_name: toolName,
            tool_display_name: toolDisplayNames[toolName] || toolName,
            usage_count: 1,
            total_time_spent: timeSpent,
            status: 'in_progress',
            tool_data: additionalData
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error tracking tool usage:', error);
      throw error;
    }
  }

  // Marcar ferramenta como completa
  async markToolCompleted(
    userId: string, 
    toolName: string, 
    completionPercentage: number = 100
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_tool_usage')
        .update({
          status: 'completed',
          completion_percentage: completionPercentage,
          last_used_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('tool_name', toolName);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking tool as completed:', error);
      throw error;
    }
  }

  // Registrar resultado gerado
  async trackResultGenerated(userId: string, toolName: string): Promise<void> {
    try {
      const { data: existing } = await supabase
        .from('user_tool_usage')
        .select('results_generated')
        .eq('user_id', userId)
        .eq('tool_name', toolName)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('user_tool_usage')
          .update({
            results_generated: existing.results_generated + 1,
            last_result_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('tool_name', toolName);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error tracking result generated:', error);
      throw error;
    }
  }

  // Obter estatísticas do usuário
  async getUserStats(userId: string): Promise<ToolUsageStats> {
    try {
      const tools = await this.getUserToolUsage(userId);
      
      const usedTools = tools.filter(tool => tool.usage_count > 0);
      const completedTools = tools.filter(tool => tool.status === 'completed');
      const inProgressTools = tools.filter(tool => tool.status === 'in_progress');
      
      const totalUsageTime = tools.reduce((sum, tool) => sum + tool.total_time_spent, 0);
      
      const mostUsedTool = usedTools.length > 0 
        ? usedTools.reduce((prev, current) => 
            prev.usage_count > current.usage_count ? prev : current
          ).tool_display_name
        : '';

      const completionRate = tools.length > 0 
        ? Math.round((completedTools.length / tools.length) * 100)
        : 0;

      return {
        total_tools: tools.length,
        used_tools: usedTools.length,
        completed_tools: completedTools.length,
        in_progress_tools: inProgressTools.length,
        total_usage_time: totalUsageTime,
        most_used_tool: mostUsedTool,
        completion_rate: completionRate
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  // Inicializar ferramentas para novo usuário
  async initializeUserTools(userId: string): Promise<void> {
    try {
      const tools = [
        { name: 'dreams', display: 'Criador de Sonhos' },
        { name: 'visa_match', display: 'VisaMatch' },
        { name: 'specialist_chat', display: 'Chat com Especialista' },
        { name: 'pdf_generator', display: 'Gerador de PDF' },
        { name: 'family_planner', display: 'FamilyPlanner' },
        { name: 'get_opportunity', display: 'GetOpportunity' },
        { name: 'project_usa', display: 'ProjectUSA' },
        { name: 'service_way', display: 'ServiceWay' },
        { name: 'calcway', display: 'CalcWay' },
        { name: 'interview_simulator', display: 'Simulador de Entrevista' }
      ];

      const toolsToInsert = tools.map(tool => ({
        user_id: userId,
        tool_name: tool.name,
        tool_display_name: tool.display,
        status: 'not_started' as const,
        usage_count: 0,
        completion_percentage: 0
      }));

      const { error } = await supabase
        .from('user_tool_usage')
        .upsert(toolsToInsert, { 
          onConflict: 'user_id,tool_name',
          ignoreDuplicates: true 
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error initializing user tools:', error);
      throw error;
    }
  }
}

export const toolUsageService = new ToolUsageService();
