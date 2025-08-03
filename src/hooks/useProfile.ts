import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserContext } from '@/hooks/useUserContext';

export interface UserProfile {
  id?: string;
  user_id: string;
  name: string;
  age?: number;
  profession: string;
  experience_years?: number;
  education_level: 'high_school' | 'bachelor' | 'master' | 'phd' | 'professional' | 'other';
  english_level: 'basic' | 'intermediate' | 'advanced' | 'native';
  current_country: string;
  current_city?: string;
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed';
  children_count?: number;
  immigration_goals: {
    primary_objective: string;
    category: 'trabalho' | 'estudo' | 'investimento' | 'familia' | 'aposentadoria' | 'outros';
    timeline: string;
    priority: 'baixa' | 'media' | 'alta';
    target_states?: string[];
    specific_cities?: string[];
    motivation: string;
    success_criteria?: string[];
  };
  current_situation: {
    employment_status: 'employed' | 'unemployed' | 'self_employed' | 'student';
    current_salary?: number;
    current_salary_currency?: string;
    available_funds: number;
    available_funds_currency: string;
    obstacles: string[];
    strengths: string[];
    us_connections?: string[];
    previous_visa_attempts?: string[];
  };
  created_at?: string;
  updated_at?: string;
}

export interface UseProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  error: Error | null;
  hasProfile: boolean;
  createProfile: (profileData: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>) => Promise<UserProfile>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<UserProfile>;
  deleteProfile: () => Promise<void>;
  refreshProfile: () => void;
}

export const useProfile = (): UseProfileReturn => {
  const { user } = useUserContext();
  const queryClient = useQueryClient();

  // Query para buscar o perfil do usuário
  const {
    data: profile,
    isLoading,
    error,
    refetch: refreshProfile
  } = useQuery({
    queryKey: ['user-profile', user?.user_id],
    queryFn: async () => {
      if (!user?.user_id) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.user_id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Perfil não encontrado
          return null;
        }
        throw error;
      }

      return data as UserProfile;
    },
    enabled: !!user?.user_id,
    gcTime: 1000 * 60 * 5, // 5 minutos
    staleTime: 1000 * 60 * 2 // 2 minutos
  });

  // Mutation para criar perfil
  const createProfileMutation = useMutation({
    mutationFn: async (profileData: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user-profile', user?.user_id], data);
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    }
  });

  // Mutation para atualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<UserProfile>) => {
      if (!user?.user_id || !profile?.id) {
        throw new Error('Usuário ou perfil não encontrado');
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user-profile', user?.user_id], data);
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    }
  });

  // Mutation para deletar perfil
  const deleteProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user?.user_id || !profile?.id) {
        throw new Error('Usuário ou perfil não encontrado');
      }

      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', profile.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData(['user-profile', user?.user_id], null);
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    }
  });

  return {
    profile,
    isLoading,
    isCreating: createProfileMutation.isPending,
    isUpdating: updateProfileMutation.isPending,
    error: error as Error | null,
    hasProfile: !!profile,
    createProfile: createProfileMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    deleteProfile: deleteProfileMutation.mutateAsync,
    refreshProfile
  };
};
