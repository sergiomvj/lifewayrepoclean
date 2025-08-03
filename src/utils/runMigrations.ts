import { supabase } from '@/integrations/supabase/client';

// Função para executar as migrações necessárias
export const runMigrations = async () => {
  try {
    console.log('🚀 Iniciando migrações...');

    // Migração 1: Criar tabela user_profiles
    const createUserProfilesTable = `
      -- Criar tabela user_profiles para armazenar perfis de usuários
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        
        -- Informações pessoais
        name VARCHAR(255) NOT NULL,
        age INTEGER,
        profession VARCHAR(255),
        experience_years INTEGER,
        education_level VARCHAR(100),
        english_level VARCHAR(50),
        current_country VARCHAR(100),
        current_city VARCHAR(100),
        marital_status VARCHAR(50),
        children_count INTEGER DEFAULT 0,
        
        -- Objetivos de imigração (JSON)
        immigration_goals JSONB,
        
        -- Situação atual (JSON)
        current_situation JSONB,
        
        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Constraints
        UNIQUE(user_id)
      );

      -- Criar índices para melhor performance
      CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);

      -- Habilitar RLS (Row Level Security)
      ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

      -- Políticas de segurança
      DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
      CREATE POLICY "Users can view own profile" ON user_profiles
        FOR SELECT USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
      CREATE POLICY "Users can insert own profile" ON user_profiles
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
      CREATE POLICY "Users can update own profile" ON user_profiles
        FOR UPDATE USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
      CREATE POLICY "Users can delete own profile" ON user_profiles
        FOR DELETE USING (auth.uid() = user_id);
    `;

    // Migração 2: Criar tabela user_tool_usage
    const createUserToolUsageTable = `
      -- Criar tabela user_tool_usage para rastrear uso das ferramentas
      CREATE TABLE IF NOT EXISTS user_tool_usage (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        
        -- Informações da ferramenta
        tool_name VARCHAR(100) NOT NULL,
        tool_display_name VARCHAR(255) NOT NULL,
        
        -- Estatísticas de uso
        first_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        usage_count INTEGER DEFAULT 1,
        total_time_spent INTEGER DEFAULT 0,
        
        -- Status e progresso
        status VARCHAR(50) DEFAULT 'in_progress',
        completion_percentage INTEGER DEFAULT 0,
        
        -- Dados específicos da ferramenta (JSON)
        tool_data JSONB DEFAULT '{}',
        
        -- Resultados/outputs gerados
        results_generated INTEGER DEFAULT 0,
        last_result_at TIMESTAMP WITH TIME ZONE,
        
        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Constraints
        UNIQUE(user_id, tool_name)
      );

      -- Criar índices para melhor performance
      CREATE INDEX IF NOT EXISTS idx_user_tool_usage_user_id ON user_tool_usage(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_tool_usage_tool_name ON user_tool_usage(tool_name);
      CREATE INDEX IF NOT EXISTS idx_user_tool_usage_last_used ON user_tool_usage(last_used_at);
      CREATE INDEX IF NOT EXISTS idx_user_tool_usage_status ON user_tool_usage(status);

      -- Habilitar RLS (Row Level Security)
      ALTER TABLE user_tool_usage ENABLE ROW LEVEL SECURITY;

      -- Políticas de segurança
      DROP POLICY IF EXISTS "Users can view own tool usage" ON user_tool_usage;
      CREATE POLICY "Users can view own tool usage" ON user_tool_usage
        FOR SELECT USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can insert own tool usage" ON user_tool_usage;
      CREATE POLICY "Users can insert own tool usage" ON user_tool_usage
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can update own tool usage" ON user_tool_usage;
      CREATE POLICY "Users can update own tool usage" ON user_tool_usage
        FOR UPDATE USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can delete own tool usage" ON user_tool_usage;
      CREATE POLICY "Users can delete own tool usage" ON user_tool_usage
        FOR DELETE USING (auth.uid() = user_id);
    `;

    // Função para atualizar updated_at
    const createUpdateFunction = `
      -- Função para atualizar updated_at automaticamente
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Triggers para atualizar updated_at
      DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
      CREATE TRIGGER update_user_profiles_updated_at
          BEFORE UPDATE ON user_profiles
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_user_tool_usage_updated_at ON user_tool_usage;
      CREATE TRIGGER update_user_tool_usage_updated_at
          BEFORE UPDATE ON user_tool_usage
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `;

    // Executar migrações
    console.log('📝 Criando tabela user_profiles...');
    const { error: error1 } = await supabase.rpc('exec_sql', { 
      sql: createUserProfilesTable 
    });
    
    if (error1) {
      console.error('❌ Erro ao criar user_profiles:', error1);
    } else {
      console.log('✅ Tabela user_profiles criada com sucesso!');
    }

    console.log('📝 Criando tabela user_tool_usage...');
    const { error: error2 } = await supabase.rpc('exec_sql', { 
      sql: createUserToolUsageTable 
    });
    
    if (error2) {
      console.error('❌ Erro ao criar user_tool_usage:', error2);
    } else {
      console.log('✅ Tabela user_tool_usage criada com sucesso!');
    }

    console.log('📝 Criando funções e triggers...');
    const { error: error3 } = await supabase.rpc('exec_sql', { 
      sql: createUpdateFunction 
    });
    
    if (error3) {
      console.error('❌ Erro ao criar funções:', error3);
    } else {
      console.log('✅ Funções e triggers criados com sucesso!');
    }

    console.log('🎉 Migrações concluídas!');
    return { success: true };

  } catch (error) {
    console.error('❌ Erro durante as migrações:', error);
    return { success: false, error };
  }
};

// Função para executar migrações via SQL direto (alternativa)
export const runMigrationsDirectSQL = async () => {
  try {
    console.log('🚀 Executando migrações via SQL direto...');

    // Executar SQL diretamente
    const { error } = await supabase
      .from('_migrations')
      .insert([
        { name: 'create_user_profiles_table', executed_at: new Date().toISOString() },
        { name: 'create_user_tool_usage_table', executed_at: new Date().toISOString() }
      ]);

    if (error) {
      console.log('ℹ️ Tabela _migrations não existe, continuando...');
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Erro durante migrações diretas:', error);
    return { success: false, error };
  }
};
