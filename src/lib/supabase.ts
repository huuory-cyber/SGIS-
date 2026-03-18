import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'provider' | 'agent';
  station_id?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Station {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  locality: string;
  provider_id: string;
  created_at: string;
}

export interface Agent {
  id: string;
  name: string;
  badge_number: string;
  station_id: string;
  provider_id: string;
  is_active: boolean;
  created_at: string;
}

export interface SocialRecord {
  id: string;
  // Personal Info
  name: string;
  birth_date: string;
  age: number;
  gender?: string;
  phone?: string;
  email?: string;
  
  // Location
  neighborhood: string;
  locality: string;
  address?: string;
  
  // Family & Social
  family_size?: number;
  dependents?: number;
  education_level?: string;
  monthly_income?: number;
  
  // Disability & Health
  has_disability: boolean;
  disability_type?: string;
  health_condition?: string;
  situation: 'Crítica' | 'Moderada' | 'Estável';
  social_history?: string;
  
  // Employment & Action
  employment_status: string;
  help_needed: string;
  referral: string;
  
  // System
  agent_id: string;
  station_id: string;
  provider_id: string;
  created_at: string;
  updated_at: string;
}

// Auth helpers
export async function signUp(email: string, password: string, fullName: string, role: 'provider' | 'agent') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
      }
    }
  });

  if (error) throw error;

  // Criar perfil manualmente (não depende do trigger)
  if (data.user) {
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          role: role,
          is_active: false,
          approval_status: 'pending_approval',
        });

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
        // Se o perfil já existe, não é um erro fatal
        if (!profileError.message.includes('duplicate')) {
          throw profileError;
        }
      }
    } catch (insertError) {
      console.error('Erro ao inserir perfil:', insertError);
      // Continuar mesmo se o perfil já existir
    }
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  return { ...data, profile };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { user, profile };
}

// Records CRUD
export async function getRecords(providerId?: string) {
  let query = supabase
    .from('social_records')
    .select('*')
    .order('created_at', { ascending: false });

  if (providerId) {
    query = query.eq('provider_id', providerId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createRecord(record: Partial<SocialRecord>) {
  const { data, error } = await supabase
    .from('social_records')
    .insert(record)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRecord(id: string, record: Partial<SocialRecord>) {
  const { data, error } = await supabase
    .from('social_records')
    .update(record)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRecord(id: string) {
  const { error } = await supabase
    .from('social_records')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Providers management
export async function getProviders() {
  console.log('Buscando provedores...');
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'provider')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar provedores:', error);
    throw error;
  }
  console.log('Provedores encontrados:', data?.length);
  data?.forEach(p => {
    console.log(`- ${p.full_name} (${p.email}): status=${p.approval_status}, active=${p.is_active}`);
  });
  return data;
}

export async function approveProvider(userId: string, adminId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({
      is_active: true,
      approval_status: 'approved',
      approved_by: adminId,
      approved_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) throw error;
  
  // Fetch the updated profile separately
  const { data, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (fetchError) throw fetchError;
  return data;
}

export async function rejectProvider(userId: string, reason: string, adminId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({
      is_active: false,
      approval_status: 'rejected',
      rejection_reason: reason,
      approved_by: adminId,
      approved_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) throw error;
  
  // Fetch the updated profile separately
  const { data, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (fetchError) throw fetchError;
  return data;
}

export async function deactivateProvider(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('id', userId);

  if (error) throw error;
}

export async function reactivateProvider(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: true })
    .eq('id', userId);

  if (error) throw error;
  
  // Fetch the updated profile separately
  const { data, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (fetchError) throw fetchError;
  return data;
}

// Create provider directly (admin only) - creates provider as already approved
export async function createProviderDirectly(email: string, password: string, fullName: string, adminId: string) {
  // Create auth user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'provider',
      }
    }
  });

  if (error) throw error;

  // Create profile with approved status
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email: data.user.email!,
        full_name: fullName,
        role: 'provider',
        is_active: true,
        approval_status: 'approved',
        approved_by: adminId,
        approved_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError);
      throw profileError;
    }
  }

  return data;
}

// Stations management
export async function getStations(providerId?: string) {
  let query = supabase
    .from('stations')
    .select('*')
    .order('name', { ascending: true });

  if (providerId) {
    query = query.eq('provider_id', providerId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createStation(station: Partial<Station>) {
  const { data, error } = await supabase
    .from('stations')
    .insert(station)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Agents management
export async function getAgents(providerId?: string) {
  let query = supabase
    .from('agents')
    .select('*')
    .order('name', { ascending: true });

  if (providerId) {
    query = query.eq('provider_id', providerId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createAgent(agent: Partial<Agent>) {
  const { data, error } = await supabase
    .from('agents')
    .insert(agent)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Image upload helpers
export async function uploadImages(files: File[], providerId?: string): Promise<string[]> {
  const imageUrls: string[] = [];
  
  for (const file of files) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = providerId ? `${providerId}/${fileName}` : `${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('social-records-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('social-records-images')
      .getPublicUrl(filePath);
    
    imageUrls.push(publicUrl);
  }
  
  return imageUrls;
}
