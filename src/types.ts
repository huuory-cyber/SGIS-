// User & Authentication Types
export type UserRole = 'admin' | 'provider' | 'agent';
export type ApprovalStatus = 'pending_approval' | 'approved' | 'rejected';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  station_id?: string;
  phone?: string;
  is_active: boolean;
  approval_status: ApprovalStatus;
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Station Types
export interface Station {
  id: string;
  name: string;
  address?: string;
  neighborhood: string;
  locality: string;
  provider_id: string;
  created_at: string;
}

// Agent Types
export interface Agent {
  id: string;
  name: string;
  badge_number: string;
  station_id: string;
  provider_id: string;
  is_active: boolean;
  created_at: string;
}

// Social Record Types (Enhanced)
export type Gender = 'Masculino' | 'Feminino' | 'Outro' | 'Prefiro não dizer';
export type EducationLevel = 'Sem escolaridade' | 'Ensino Fundamental' | 'Ensino Médio' | 'Ensino Superior' | 'Pós-graduação';
export type EmploymentStatus = 'Empregado' | 'Desempregado' | 'Autônomo' | 'Aposentado' | 'Estudante';
export type DisabilityType = 'Física' | 'Visual' | 'Auditiva' | 'Intelectual' | 'Múltipla' | 'Outra';
export type Situation = 'Crítica' | 'Moderada' | 'Estável';

export interface SocialRecord {
  id: string;
  
  // Personal Information
  name: string;
  birth_date: string;
  age: number;
  gender?: Gender;
  phone?: string;
  email?: string;
  
  // Location
  neighborhood: string;
  locality: string;
  address?: string;
  
  // Family & Social Context
  family_size?: number;
  dependents?: number;
  education_level?: EducationLevel;
  monthly_income?: number;
  
  // Disability & Health
  has_disability: boolean;
  disability_type?: DisabilityType;
  health_condition?: string;
  situation: Situation;
  social_history?: string;
  
  // Employment & Action
  employment_status: EmploymentStatus;
  help_needed: string;
  referral: string;
  
  // Image Storage
  image_urls: string[];
  image_count: number;
  
  // System fields
  agent_id: string;
  station_id: string;
  provider_id: string;
  sync_status: 'pending' | 'synced' | 'conflict';
  offline_created: boolean;
  created_at: string;
  updated_at: string;
}

export type NewSocialRecord = Omit<SocialRecord, 'id' | 'created_at' | 'updated_at'>;

// Form Types
export interface FormValues {
  // Personal Information
  name: string;
  birthDate: string;
  gender?: Gender;
  phone?: string;
  email?: string;
  
  // Location
  neighborhood: string;
  locality: string;
  address?: string;
  
  // Family & Social Context
  familySize?: number;
  dependents?: number;
  educationLevel?: EducationLevel;
  monthlyIncome?: number;
  
  // Disability & Health
  hasDisability: boolean;
  disabilityType?: DisabilityType;
  healthCondition?: string;
  situation: Situation;
  socialHistory?: string;
  
  // Employment & Action
  employmentStatus: EmploymentStatus;
  helpNeeded: string;
  referral: string;
  
  // System - Optional for admin, required for providers
  agentId?: string;
  stationId?: string;
  adminNotes?: string;
}

// Registration Types
export interface ProviderRegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  organizationName: string;
}

export interface StationFormData {
  name: string;
  address?: string;
  neighborhood: string;
  locality: string;
}

export interface AgentFormData {
  name: string;
  badgeNumber: string;
  stationId: string;
}

// Dashboard Stats
export interface DashboardStats {
  total: number;
  disability: number;
  unemployed: number;
  critical: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

// Chart Data Types
export interface ChartDataPoint {
  date: string;
  count: number;
}

export interface SituationDistribution {
  name: string;
  value: number;
  color: string;
}

// Legacy types for backward compatibility
export interface Record {
  id: number;
  name: string;
  birthDate: string;
  age: number;
  neighborhood: string;
  locality: string;
  hasDisability: boolean;
  disabilityType?: string;
  situation: string;
  socialHistory?: string;
  employmentStatus: string;
  helpNeeded: string;
  referral: string;
  agentId: string;
  stationId: string;
  timestamp: string;
}

export type NewRecord = Omit<Record, 'id' | 'timestamp'>;
