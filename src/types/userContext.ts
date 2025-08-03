// User Context Schema for AI Specialist Integration
// This defines the standardized JSON structure for user data

import { CriadorSonhosFormData } from './forms';

// Core user profile information
export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  age?: number;
  profession: string;
  experience_years?: number;
  education_level: 'high_school' | 'bachelor' | 'master' | 'phd' | 'professional' | 'other';
  english_level: 'basic' | 'intermediate' | 'advanced' | 'native';
  current_country: string;
  current_city?: string;
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed';
  children_count?: number;
  created_at: string;
  updated_at: string;
}

// Immigration goals and objectives
export interface ImmigrationGoals {
  primary_objective: string;
  category: 'trabalho' | 'estudo' | 'investimento' | 'familia' | 'aposentadoria' | 'outros';
  timeline: string;
  priority: 'baixa' | 'media' | 'alta';
  target_states?: string[];
  specific_cities?: string[];
  motivation: string;
  success_criteria?: string[];
}

// Current situation assessment
export interface CurrentSituation {
  employment_status: 'employed' | 'unemployed' | 'self_employed' | 'student';
  current_salary?: number;
  current_salary_currency?: string;
  available_funds: number;
  available_funds_currency: string;
  obstacles: string[];
  strengths: string[];
  previous_visa_attempts?: VisaAttempt[];
  us_connections?: USConnection[];
}

// Previous visa attempts
export interface VisaAttempt {
  visa_type: string;
  application_date: string;
  status: 'approved' | 'denied' | 'pending' | 'withdrawn';
  denial_reason?: string;
  lessons_learned?: string;
}

// US connections (family, friends, employers)
export interface USConnection {
  type: 'family' | 'friend' | 'employer' | 'business' | 'educational';
  name: string;
  relationship: string;
  location?: string;
  status: 'citizen' | 'permanent_resident' | 'temporary_visa' | 'other';
  can_sponsor: boolean;
  contact_info?: string;
}

// Dream goals from Criador de Sonhos
export interface DreamGoal {
  id: string;
  form_data: CriadorSonhosFormData;
  action_plan?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'paused';
  score?: number;
  milestones?: Milestone[];
  created_at: string;
  updated_at: string;
}

// Milestones for tracking progress
export interface Milestone {
  id: string;
  title: string;
  description: string;
  target_date: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  completion_date?: string;
  notes?: string;
}

// Visa analysis results from VisaMatch
export interface VisaAnalysis {
  id: string;
  analysis_date: string;
  user_profile_snapshot: any; // Snapshot of user profile at analysis time
  recommendations: VisaRecommendation[];
  top_recommendation: VisaRecommendation;
  analysis_notes?: string;
  specialist_reviewed: boolean;
  specialist_notes?: string;
}

// Individual visa recommendation
export interface VisaRecommendation {
  visa_type: string;
  visa_name: string;
  match_percentage: number;
  feasibility_score: number;
  timeline: string;
  estimated_cost: string;
  requirements: string[];
  pros: string[];
  cons: string[];
  next_steps: string[];
  success_probability: number;
  specialist_rating?: number;
  specialist_comments?: string;
}

// Specialist interaction history
export interface SpecialistInteraction {
  id: string;
  specialist_id: string;
  specialist_name: string;
  interaction_type: 'chat' | 'consultation' | 'review' | 'follow_up';
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  topics_discussed: string[];
  recommendations_given: string[];
  action_items: ActionItem[];
  satisfaction_rating?: number;
  user_feedback?: string;
  specialist_notes?: string;
  follow_up_scheduled?: string;
}

// Action items from specialist interactions
export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to: 'user' | 'specialist' | 'system';
  completion_date?: string;
  completion_notes?: string;
}

// Progress tracking and analytics
export interface ProgressTracking {
  overall_progress_percentage: number;
  goals_completed: number;
  goals_total: number;
  milestones_completed: number;
  milestones_total: number;
  days_since_start: number;
  estimated_days_remaining?: number;
  current_phase: string;
  next_recommended_action: string;
  blockers: string[];
  recent_achievements: string[];
}

// AI insights and recommendations
export interface AIInsights {
  last_analysis_date: string;
  confidence_score: number;
  key_insights: string[];
  risk_factors: string[];
  opportunities: string[];
  recommended_focus_areas: string[];
  predicted_timeline: string;
  success_probability: number;
  alternative_strategies: string[];
}

// Complete user context structure
export interface UserContext {
  // Metadata
  context_id: string;
  user_id: string;
  version: number;
  created_at: string;
  updated_at: string;
  last_accessed: string;
  
  // Core data sections
  profile: UserProfile;
  immigration_goals: ImmigrationGoals;
  current_situation: CurrentSituation;
  dream_goals: DreamGoal[];
  visa_analyses: VisaAnalysis[];
  specialist_interactions: SpecialistInteraction[];
  progress_tracking: ProgressTracking;
  ai_insights: AIInsights;
  
  // Additional metadata
  data_completeness_score: number;
  last_specialist_review?: string;
  next_review_due?: string;
  privacy_settings: PrivacySettings;
  tags: string[];
  notes: string[];
}

// Privacy and data sharing settings
export interface PrivacySettings {
  share_with_specialists: boolean;
  share_analytics: boolean;
  allow_ai_analysis: boolean;
  data_retention_days: number;
  anonymize_data: boolean;
  export_allowed: boolean;
}

// Context update operations
export interface ContextUpdate {
  operation: 'create' | 'update' | 'append' | 'delete';
  section: keyof UserContext;
  data: any;
  timestamp: string;
  source: 'user' | 'system' | 'specialist' | 'ai';
  reason?: string;
}

// Context query parameters for AI
export interface ContextQuery {
  user_id: string;
  sections?: (keyof UserContext)[];
  include_history?: boolean;
  include_analytics?: boolean;
  format?: 'full' | 'summary' | 'minimal';
  purpose: 'specialist_chat' | 'ai_analysis' | 'report_generation' | 'export';
}

// Context response for AI consumption
export interface ContextResponse {
  context: UserContext | Partial<UserContext>;
  summary: string;
  key_points: string[];
  recommendations: string[];
  missing_data: string[];
  data_quality_score: number;
  last_updated: string;
}

// Validation schema for context data
export interface ContextValidation {
  is_valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  completeness_score: number;
  required_fields_missing: string[];
  suggested_improvements: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion: string;
}

// Types are re-exported through shared.ts to avoid conflicts
// Remove duplicate exports to prevent TS2484 errors

// JSON Schema constants for validation
export const USER_CONTEXT_SCHEMA_VERSION = '1.0.0';
export const REQUIRED_SECTIONS = ['profile', 'immigration_goals', 'current_situation'] as const;
export const OPTIONAL_SECTIONS = ['dream_goals', 'visa_analyses', 'specialist_interactions', 'progress_tracking', 'ai_insights'] as const;
