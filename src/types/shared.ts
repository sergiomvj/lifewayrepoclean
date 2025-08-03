// Shared types for LifeWay Immigration Tools Integration
// This file consolidates common types between Criador de Sonhos, VisaMatch, and UserContext

import { 
  CriadorSonhosFormData, 
  VisaMatchFormData, 
  CriadorSonhosResponse, 
  VisaMatchResponse,
  FamilyComposition,
  ChildInfo,
  DependentInfo
} from './forms';
import { UserContext, UserProfile, ImmigrationGoals, CurrentSituation } from './userContext';

// ===== CORE SHARED TYPES =====

// Unified User Profile (consolidates data from both tools)
export interface UnifiedUserProfile {
  // Basic Information
  id: string;
  name: string;
  age: number;
  email?: string;
  phone?: string;
  
  // Location
  current_country: string;
  current_city?: string;
  current_state?: string;
  
  // Professional
  profession: string;
  industry?: string;
  experience_years: number;
  current_employer?: string;
  annual_income?: number;
  skills: string[];
  certifications: string[];
  
  // Education
  education_level: 'high_school' | 'bachelor' | 'master' | 'phd' | 'professional' | 'other';
  education_details?: string;
  
  // Languages
  languages: LanguageProficiency[];
  english_level: 'basic' | 'intermediate' | 'advanced' | 'native';
  
  // Personal
  marital_status: 'single' | 'married' | 'divorced' | 'widowed';
  family_composition: FamilyComposition;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface LanguageProficiency {
  language: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'native';
  certifications?: string[];
  years_speaking?: number;
}

// Unified Immigration Goals (consolidates objectives from both tools)
export interface UnifiedImmigrationGoals {
  // Primary Objectives
  primary_objective: string;
  secondary_objectives: string[];
  
  // Category and Type
  category: 'trabalho' | 'estudo' | 'investimento' | 'familia' | 'aposentadoria' | 'outro';
  visa_types_interested: string[];
  
  // Timeline and Priority
  timeline: string;
  timeline_flexibility: 'rigid' | 'flexible' | 'very_flexible';
  priority: 'baixa' | 'media' | 'alta';
  
  // Location Preferences
  preferred_states: string[];
  preferred_cities: string[];
  location_flexibility: 'specific_city' | 'specific_state' | 'region' | 'anywhere';
  
  // Motivation and Success Criteria
  motivation: string;
  success_criteria: string[];
  lifestyle_priorities: string[];
  career_goals: string[];
  
  // Family Considerations
  family_goals: FamilyGoals;
}

export interface FamilyGoals {
  spouse_work_preference: boolean;
  children_education_priority: 'public' | 'private' | 'homeschool' | 'flexible';
  family_integration_importance: 'high' | 'medium' | 'low';
  cultural_preservation: string[];
}

// Unified Financial Situation
export interface UnifiedFinancialSituation {
  // Income
  annual_income: number;
  income_currency: string;
  income_stability: 'stable' | 'variable' | 'uncertain';
  additional_income_sources: IncomeSource[];
  
  // Assets
  liquid_assets: number;
  real_estate_value: number;
  investments_value: number;
  other_assets: Asset[];
  
  // Liabilities
  debt_obligations: number;
  monthly_expenses: number;
  financial_dependents: number;
  
  // Immigration Investment Capacity
  available_for_immigration: number;
  investment_capacity: number;
  emergency_fund: number;
  
  // Risk Assessment
  financial_risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
  income_replacement_needed: boolean;
}

export interface IncomeSource {
  type: 'salary' | 'business' | 'investments' | 'rental' | 'freelance' | 'other';
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'annually';
  stability: 'guaranteed' | 'likely' | 'uncertain';
}

export interface Asset {
  type: 'property' | 'vehicle' | 'business' | 'investment' | 'other';
  description: string;
  estimated_value: number;
  liquidity: 'high' | 'medium' | 'low';
}

// ===== INTEGRATION TYPES =====

// Consolidated Analysis Result (combines Dreams + VisaMatch)
export interface ConsolidatedAnalysis {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  
  // Source Data
  dreams_data?: CriadorSonhosFormData;
  visamatch_data?: VisaMatchFormData;
  user_context: UserContext;
  
  // Analysis Results
  dreams_analysis?: CriadorSonhosResponse;
  visa_analysis?: VisaMatchResponse;
  
  // Consolidated Insights
  consolidated_insights: ConsolidatedInsights;
  
  // Recommendations
  integrated_recommendations: IntegratedRecommendation[];
  
  // Scoring
  overall_score: OverallScore;
  
  // Status
  analysis_status: 'draft' | 'partial' | 'complete' | 'reviewed';
  specialist_reviewed: boolean;
  specialist_notes?: string;
}

export interface ConsolidatedInsights {
  // Profile Analysis
  profile_strengths: string[];
  profile_challenges: string[];
  profile_uniqueness: string[];
  
  // Goal Alignment
  dreams_visa_alignment: number; // 0-100%
  alignment_analysis: string;
  potential_conflicts: string[];
  
  // Feasibility Assessment
  overall_feasibility: number; // 0-100%
  timeline_realism: 'realistic' | 'optimistic' | 'challenging';
  resource_adequacy: 'sufficient' | 'adequate' | 'insufficient';
  
  // Risk Assessment
  major_risks: RiskFactor[];
  mitigation_strategies: string[];
  
  // Opportunity Identification
  hidden_opportunities: string[];
  alternative_paths: string[];
  leverage_points: string[];
}

export interface RiskFactor {
  category: 'financial' | 'legal' | 'personal' | 'professional' | 'timing';
  risk: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: 'unlikely' | 'possible' | 'likely' | 'certain';
  impact: string;
  mitigation: string[];
}

export interface IntegratedRecommendation {
  id: string;
  type: 'immediate' | 'short_term' | 'long_term' | 'contingency';
  category: 'preparation' | 'application' | 'financial' | 'personal' | 'professional';
  
  title: string;
  description: string;
  rationale: string;
  
  // Implementation
  action_steps: ActionStep[];
  timeline: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  
  // Dependencies
  prerequisites: string[];
  dependencies: string[];
  
  // Resources
  estimated_cost: number;
  required_time: string;
  required_resources: string[];
  
  // Tracking
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
  progress_percentage: number;
  completion_date?: string;
  
  // Source
  source_tool: 'dreams' | 'visamatch' | 'integrated' | 'specialist';
  confidence_level: number; // 0-100%
}

export interface ActionStep {
  id: string;
  step_number: number;
  title: string;
  description: string;
  estimated_duration: string;
  required_resources: string[];
  completion_criteria: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  notes?: string;
}

export interface OverallScore {
  // Component Scores
  dreams_score: number;
  visa_feasibility_score: number;
  financial_readiness_score: number;
  preparation_score: number;
  timeline_score: number;
  
  // Composite Scores
  overall_readiness: number; // 0-100%
  success_probability: number; // 0-100%
  
  // Scoring Details
  score_breakdown: ScoreBreakdown[];
  improvement_areas: ImprovementArea[];
  
  // Benchmarking
  percentile_ranking: number; // compared to similar profiles
  similar_success_rate: number;
}

export interface ScoreBreakdown {
  category: string;
  current_score: number;
  max_possible: number;
  weight: number;
  contributing_factors: string[];
  improvement_potential: number;
}

export interface ImprovementArea {
  area: string;
  current_score: number;
  target_score: number;
  impact_on_overall: number;
  recommended_actions: string[];
  estimated_timeline: string;
}

// ===== SPECIALIST INTEGRATION TYPES =====

// Enhanced Specialist Context (integrates with UserContext)
export interface EnhancedSpecialistContext {
  // Session Information
  session_id: string;
  user_id: string;
  specialist_id: string;
  session_type: 'consultation' | 'review' | 'follow_up' | 'emergency';
  
  // Context Data
  user_context: UserContext;
  consolidated_analysis?: ConsolidatedAnalysis;
  
  // Session State
  session_status: 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  
  // Conversation
  messages: SpecialistMessage[];
  session_notes: SpecialistSessionNote[];
  
  // Outcomes
  session_outcomes: SessionOutcome[];
  follow_up_required: boolean;
  next_session_recommended?: string;
  
  // Quality Assurance
  user_satisfaction_rating?: number;
  specialist_confidence_rating?: number;
  session_quality_metrics: QualityMetrics;
}

export interface SpecialistMessage {
  id: string;
  sender: 'user' | 'specialist' | 'system';
  message: string;
  timestamp: string;
  message_type: 'text' | 'document' | 'recommendation' | 'question' | 'clarification';
  attachments?: MessageAttachment[];
  references?: ContextReference[];
}

export interface MessageAttachment {
  id: string;
  type: 'pdf' | 'image' | 'document' | 'link';
  url: string;
  name: string;
  description?: string;
}

export interface ContextReference {
  type: 'dreams_data' | 'visa_analysis' | 'user_profile' | 'recommendation' | 'external';
  reference_id: string;
  description: string;
}

export interface SpecialistSessionNote {
  id: string;
  timestamp: string;
  category: 'observation' | 'concern' | 'opportunity' | 'recommendation' | 'follow_up';
  note: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action_required: boolean;
  tags: string[];
}

export interface SessionOutcome {
  type: 'decision' | 'action_item' | 'clarification' | 'referral' | 'schedule';
  description: string;
  responsible_party: 'user' | 'specialist' | 'both';
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface QualityMetrics {
  response_time_avg: number; // seconds
  user_engagement_score: number; // 0-100%
  issue_resolution_rate: number; // 0-100%
  information_completeness: number; // 0-100%
  specialist_preparation_score: number; // 0-100%
}

// ===== DATA TRANSFORMATION TYPES =====

// Mappers for converting between different data formats
export interface DataMapper<TSource, TTarget> {
  map(source: TSource): TTarget;
  reverse?(target: TTarget): TSource;
  validate?(data: TSource | TTarget): boolean;
}

// Specific mappers
export type DreamsToContextMapper = DataMapper<CriadorSonhosFormData, Partial<UserContext>>;
export type VisaMatchToContextMapper = DataMapper<VisaMatchFormData, Partial<UserContext>>;
export type ContextToUnifiedProfileMapper = DataMapper<UserContext, UnifiedUserProfile>;

// ===== WORKFLOW TYPES =====

// Integration Workflow States
export interface IntegrationWorkflow {
  id: string;
  user_id: string;
  workflow_type: 'dreams_first' | 'visa_first' | 'parallel' | 'specialist_guided';
  
  // Current State
  current_step: WorkflowStep;
  completed_steps: WorkflowStep[];
  remaining_steps: WorkflowStep[];
  
  // Progress
  overall_progress: number; // 0-100%
  estimated_completion: string;
  
  // Data Collection Status
  dreams_completed: boolean;
  visa_analysis_completed: boolean;
  context_validated: boolean;
  specialist_consulted: boolean;
  
  // Workflow Control
  auto_advance: boolean;
  user_preferences: WorkflowPreferences;
  
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  id: string;
  step_name: string;
  step_type: 'data_collection' | 'analysis' | 'review' | 'consultation' | 'decision';
  description: string;
  estimated_duration: string;
  prerequisites: string[];
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'blocked';
  completion_percentage: number;
  started_at?: string;
  completed_at?: string;
}

export interface WorkflowPreferences {
  preferred_pace: 'slow' | 'normal' | 'fast';
  notification_frequency: 'minimal' | 'normal' | 'frequent';
  specialist_interaction: 'as_needed' | 'regular' | 'intensive';
  data_sharing_level: 'basic' | 'detailed' | 'comprehensive';
}

// ===== EXPORT TYPES =====

export type {
  // Re-export commonly used types from forms.ts
  CriadorSonhosFormData,
  VisaMatchFormData,
  CriadorSonhosResponse,
  VisaMatchResponse,
  FamilyComposition,
  ChildInfo,
  DependentInfo
} from './forms';

export type {
  // Re-export commonly used types from userContext.ts
  UserContext,
  UserProfile,
  ImmigrationGoals,
  CurrentSituation,
  ContextUpdate,
  ContextResponse
} from './userContext';

// Type guards for runtime type checking
export const isUnifiedUserProfile = (obj: any): obj is UnifiedUserProfile => {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string' && typeof obj.age === 'number';
};

export const isConsolidatedAnalysis = (obj: any): obj is ConsolidatedAnalysis => {
  return obj && typeof obj.id === 'string' && typeof obj.user_id === 'string' && obj.consolidated_insights;
};

export const isIntegratedRecommendation = (obj: any): obj is IntegratedRecommendation => {
  return obj && typeof obj.id === 'string' && typeof obj.title === 'string' && Array.isArray(obj.action_steps);
};

// Utility types for common operations
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Constants for shared enums and defaults
export const PRIORITY_LEVELS = ['baixa', 'media', 'alta'] as const;
export const TIMELINE_FLEXIBILITY = ['rigid', 'flexible', 'very_flexible'] as const;
export const ANALYSIS_STATUS = ['draft', 'partial', 'complete', 'reviewed'] as const;
export const WORKFLOW_TYPES = ['dreams_first', 'visa_first', 'parallel', 'specialist_guided'] as const;
