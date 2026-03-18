import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'motion/react';
import {
  Users, ShieldAlert, Activity, PlusCircle, Phone, Mail,
  Building2, GraduationCap, DollarSign, Calendar, User
} from 'lucide-react';
import { format, differenceInYears, parseISO } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { createRecord, getStations, getAgents, uploadImages } from '../lib/supabase';
import { Station, Agent, FormValues, Gender, EducationLevel, EmploymentStatus, DisabilityType, Situation } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { ImageUpload } from './ImageUpload';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const enhancedRecordSchema = z.object({
  // Personal Information
  name: z.string().min(3, "Nome muito curto"),
  birthDate: z.string().min(1, "Data de nascimento obrigatória"),
  gender: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  
  // Location
  neighborhood: z.string().min(1, "Bairro obrigatório"),
  locality: z.string().min(1, "Localidade obrigatória"),
  address: z.string().optional(),
  
  // Family & Social Context
  familySize: z.number().min(0).optional(),
  dependents: z.number().min(0).optional(),
  educationLevel: z.string().optional(),
  monthlyIncome: z.number().min(0).optional(),
  
  // Disability & Health
  hasDisability: z.boolean(),
  disabilityType: z.string().optional(),
  healthCondition: z.string().optional(),
  situation: z.enum(['Crítica', 'Moderada', 'Estável'], { message: "Situação obrigatória" }),
  socialHistory: z.string().optional(),
  
  // Employment & Action
  employmentStatus: z.string().min(1, "Status de emprego obrigatório"),
  helpNeeded: z.string().min(1, "Tipo de ajuda obrigatório"),
  referral: z.string().min(1, "Encaminhamento obrigatório"),
  
  // System - Optional for admin, required for providers
  agentId: z.string().optional(),
  agentName: z.string().optional(),
  stationId: z.string().optional(),
  adminNotes: z.string().optional(),
});

interface EnhancedFormProps {
  onSubmit?: () => void;
}

export default function EnhancedForm({ onSubmit }: EnhancedFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<any>({
    resolver: zodResolver(enhancedRecordSchema),
    defaultValues: {
      hasDisability: false,
      situation: 'Estável',
      employmentStatus: 'Desempregado',
    }
  });

  const hasDisability = watch('hasDisability');
  const selectedStationId = watch('stationId');
  const [images, setImages] = useState<File[]>([]);

  // Load stations when component mounts
  useEffect(() => {
    const loadStations = async () => {
      console.log('Carregando postos para usuário:', user?.role, user?.id);
      try {
        if (user?.role === 'admin') {
          const stationsData = await getStations();
          console.log('Postos carregados (admin):', stationsData);
          setStations(stationsData);
        } else if (user?.role === 'provider') {
          const stationsData = await getStations(user.id);
          console.log('Postos carregados (provider):', stationsData);
          setStations(stationsData);
        }
      } catch (error) {
        console.error('Erro ao carregar postos:', error);
      }
    };
    loadStations();
  }, [user?.role, user?.id]);

  // Load agents when station changes
  useEffect(() => {
    const loadAgents = async () => {
      console.log('Carregando agentes para posto:', selectedStationId);
      try {
        if (selectedStationId) {
          // Filter agents by station
          const agentsData = await getAgents();
          const filteredAgents = agentsData.filter(a => a.station_id === selectedStationId);
          console.log('Agentes filtrados:', filteredAgents);
          setAgents(filteredAgents);
        } else {
          setAgents([]);
        }
      } catch (error) {
        console.error('Erro ao carregar agentes:', error);
      }
    };
    loadAgents();
  }, [selectedStationId]);

  const onFormSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const age = differenceInYears(new Date(), parseISO(data.birthDate));
      
      // Upload images if any
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages(images, user?.id);
      }
      
      // Build payload based on user role
      const payload: any = {
        name: data.name,
        birth_date: data.birthDate,
        age,
        gender: data.gender,
        phone: data.phone,
        email: data.email || undefined,
        neighborhood: data.neighborhood,
        locality: data.locality,
        address: data.address,
        family_size: data.familySize,
        dependents: data.dependents,
        education_level: data.educationLevel,
        monthly_income: data.monthlyIncome,
        has_disability: data.hasDisability,
        disability_type: data.disabilityType,
        health_condition: data.healthCondition,
        situation: data.situation,
        social_history: data.socialHistory,
        employment_status: data.employmentStatus,
        help_needed: data.helpNeeded,
        referral: data.referral,
        image_urls: imageUrls,
        image_count: imageUrls.length,
      };

      // Add role-specific fields
      if (user?.role === 'admin') {
        // Admin: Set admin as provider, no station/agent required
        payload.provider_id = user.id;
        payload.admin_notes = data.adminNotes;
        // Don't set agent_id and station_id for admin (they are nullable)
      } else {
        // Provider: Must have station and agent
        payload.provider_id = user?.id || '';
        payload.station_id = data.stationId;
        
        // Handle agent selection - either from dropdown or manual input
        if (data.agentId) {
          // Agent selected from dropdown
          payload.agent_id = data.agentId;
        } else if (data.agentName) {
          // Agent name entered manually - store in admin_notes for now
          // In the future, you might want to create the agent automatically
          payload.admin_notes = `Agente responsável (manual): ${data.agentName}`;
        }
      }

      await createRecord(payload);
      reset();
      setImages([]);
      onSubmit?.();
    } catch (error) {
      console.error('Failed to submit record:', error);
      alert('Erro ao salvar registro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">Formulário de Assistência Social</h3>
          <p className="text-sm text-slate-500">Preencha todos os campos obrigatórios para o registro.</p>
        </div>
        
        <form onSubmit={handleSubmit(onFormSubmit)} className="p-8 space-y-8">
          {/* Identificação Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-blue-600 font-semibold mb-4">
              <Users size={18} />
              <span>Identificação do Cidadão</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo *</label>
                <input 
                  {...register('name')}
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all",
                    errors.name ? "border-red-300" : "border-slate-200"
                  )}
                  placeholder="Ex: João Silva"
                />
                {errors.name && <p className="text-xs text-red-500">{String(errors.name.message)}</p>}
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Data de Nascimento *</label>
                <input 
                  type="date"
                  {...register('birthDate')}
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all",
                    errors.birthDate ? "border-red-300" : "border-slate-200"
                  )}
                />
                {errors.birthDate && <p className="text-xs text-red-500">{String(errors.birthDate.message)}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Gênero</label>
                <select 
                  {...register('gender')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                >
                  <option value="">Selecione...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                  <option value="Prefiro não dizer">Prefiro não dizer</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    {...register('phone')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="+258 84 123 4567"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="email"
                    {...register('email')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="email@exemplo.com"
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500">{String(errors.email.message)}</p>}
              </div>
            </div>
          </section>

          {/* Location Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold mb-4">
              <Building2 size={18} />
              <span>Localização</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Bairro *</label>
                <input 
                  {...register('neighborhood')}
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all",
                    errors.neighborhood ? "border-red-300" : "border-slate-200"
                  )}
                  placeholder="Ex: Centro"
                />
                {errors.neighborhood && <p className="text-xs text-red-500">{String(errors.neighborhood.message)}</p>}
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Localidade *</label>
                <input 
                  {...register('locality')}
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all",
                    errors.locality ? "border-red-300" : "border-slate-200"
                  )}
                  placeholder="Ex: Posto 1"
                />
                {errors.locality && <p className="text-xs text-red-500">{String(errors.locality.message)}</p>}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Endereço Completo</label>
                <input 
                  {...register('address')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="Rua, número, referência..."
                />
              </div>
            </div>
          </section>

          {/* Family & Social Context */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-purple-600 font-semibold mb-4">
              <Users size={18} />
              <span>Contexto Familiar e Social</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Tamanho da Família</label>
                <input 
                  type="number"
                  {...register('familySize', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="Número de pessoas na casa"
                  min="0"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Dependentes</label>
                <input 
                  type="number"
                  {...register('dependents', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="Crianças ou idosos dependentes"
                  min="0"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Escolaridade</label>
                <select 
                  {...register('educationLevel')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                >
                  <option value="">Selecione...</option>
                  <option value="Sem escolaridade">Sem escolaridade</option>
                  <option value="Ensino Fundamental">Ensino Fundamental</option>
                  <option value="Ensino Médio">Ensino Médio</option>
                  <option value="Ensino Superior">Ensino Superior</option>
                  <option value="Pós-graduação">Pós-graduação</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Renda Mensal (MT)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="number"
                    {...register('monthlyIncome', { valueAsNumber: true })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Vulnerabilidade Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold mb-4">
              <ShieldAlert size={18} />
              <span>Vulnerabilidade e Saúde</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <input 
                  type="checkbox"
                  {...register('hasDisability')}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-slate-700">Possui algum tipo de deficiência (PCD)?</label>
              </div>
              
              {hasDisability && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Deficiência</label>
                      <select 
                        {...register('disabilityType')}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      >
                        <option value="">Selecione...</option>
                        <option value="Física">Física</option>
                        <option value="Visual">Visual</option>
                        <option value="Auditiva">Auditiva</option>
                        <option value="Intelectual">Intelectual</option>
                        <option value="Múltipla">Múltipla</option>
                        <option value="Outra">Outra</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Condição de Saúde</label>
                      <input 
                        {...register('healthCondition')}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        placeholder="Descreva condições relevantes..."
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Situação Atual *</label>
                  <select 
                    {...register('situation')}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all",
                      errors.situation ? "border-red-300" : "border-slate-200"
                    )}
                  >
                    <option value="Estável">Estável</option>
                    <option value="Moderada">Moderada</option>
                    <option value="Crítica">Crítica (Urgente)</option>
                  </select>
                  {errors.situation && <p className="text-xs text-red-500">{String(errors.situation.message)}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status de Emprego *</label>
                  <select 
                    {...register('employmentStatus')}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all",
                      errors.employmentStatus ? "border-red-300" : "border-slate-200"
                    )}
                  >
                    <option value="Desempregado">Desempregado</option>
                    <option value="Empregado">Empregado</option>
                    <option value="Autônomo">Autônomo</option>
                    <option value="Aposentado">Aposentado</option>
                    <option value="Estudante">Estudante</option>
                  </select>
                  {errors.employmentStatus && <p className="text-xs text-red-500">{String(errors.employmentStatus.message)}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">História Social (Resumo)</label>
                <textarea 
                  {...register('socialHistory')}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                  placeholder="Descreva brevemente o contexto familiar e social..."
                />
              </div>
            </div>
          </section>

          {/* Action Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-orange-600 font-semibold mb-4">
              <Activity size={18} />
              <span>Ação e Encaminhamento</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Ajuda Necessária *</label>
                <input 
                  {...register('helpNeeded')}
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all",
                    errors.helpNeeded ? "border-red-300" : "border-slate-200"
                  )}
                  placeholder="Ex: Cesta Básica, Auxílio Financeiro..."
                />
                {errors.helpNeeded && <p className="text-xs text-red-500">{String(errors.helpNeeded.message)}</p>}
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Encaminhamento *</label>
                <input 
                  {...register('referral')}
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all",
                    errors.referral ? "border-red-300" : "border-slate-200"
                  )}
                  placeholder="Ex: CRAS Central, CREAS..."
                />
                {errors.referral && <p className="text-xs text-red-500">{String(errors.referral.message)}</p>}
              </div>
            </div>
          </section>

          {/* Images Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-purple-600 font-semibold mb-4">
              <Calendar size={18} />
              <span>Imagens e Documentos</span>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Anexar Imagens (Opcional)</label>
              <ImageUpload
                images={images}
                onImagesChange={setImages}
                maxImages={3}
                maxSizeMB={5}
              />
              <p className="text-xs text-slate-400 mt-1">
                Você pode anexar até 3 imagens (máx. 5MB cada)
              </p>
            </div>
          </section>

          {/* System Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-600 font-semibold mb-4">
              <Calendar size={18} />
              <span>Informações do Sistema</span>
            </div>
            
            {user?.role === 'admin' ? (
              // Admin: Simple form without station/agent selection
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert size={16} className="text-blue-600" />
                    <p className="text-sm font-medium text-blue-900">
                      Registro como Administrador
                    </p>
                  </div>
                  <p className="text-xs text-blue-700">
                    Você está preenchendo este formulário como administrador. O registro será associado diretamente à sua conta.
                  </p>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Observações (Opcional)</label>
                  <textarea
                    {...register('adminNotes')}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                    placeholder="Adicione observações adicionais sobre este registro..."
                  />
                </div>
              </div>
            ) : (
              // Provider: Must select station and agent
              <div className="space-y-4">
                {/* Provider Info */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={16} className="text-emerald-600" />
                    <p className="text-sm font-medium text-emerald-900">
                      Provedor Responsável
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-800">
                    {user?.full_name || 'Provedor'}
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Você está fazendo este registro como: {user?.email}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Posto de Atendimento *</label>
                    <select
                      {...register('stationId', { required: user?.role === 'provider' ? 'Posto obrigatório' : false })}
                      className={cn(
                        "w-full px-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all",
                        errors.stationId ? "border-red-300" : "border-slate-200"
                      )}
                    >
                      <option value="">Selecione...</option>
                      {stations.map(station => (
                        <option key={station.id} value={station.id}>
                          {station.name} - {station.locality}
                        </option>
                      ))}
                    </select>
                    {errors.stationId && <p className="text-xs text-red-500">{String(errors.stationId.message)}</p>}
                    {stations.length === 0 && user?.role === 'provider' && (
                      <p className="text-xs text-amber-600 mt-1">
                        Você não tem postos atribuídos. Contacte o administrador ou crie um posto na aba "Postos".
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Agente Responsável *</label>
                    {selectedStationId && agents.length > 0 ? (
                      // Show dropdown if agents exist
                      <select
                        {...register('agentId', { required: user?.role === 'provider' ? 'Agente obrigatório' : false })}
                        className={cn(
                          "w-full px-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all",
                          errors.agentId ? "border-red-300" : "border-slate-200"
                        )}
                      >
                        <option value="">Selecione...</option>
                        {agents.map(agent => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name} ({agent.badge_number})
                          </option>
                        ))}
                      </select>
                    ) : (
                      // Show text input if no agents exist
                      <input
                        {...register('agentName', {
                          required: selectedStationId && agents.length === 0 ? 'Nome do agente obrigatório' : false
                        })}
                        type="text"
                        className={cn(
                          "w-full px-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all",
                          errors.agentName ? "border-red-300" : "border-slate-200"
                        )}
                        placeholder="Digite o nome do agente responsável..."
                      />
                    )}
                    {errors.agentId && <p className="text-xs text-red-500">{String(errors.agentId.message)}</p>}
                    {errors.agentName && <p className="text-xs text-red-500">{String(errors.agentName.message)}</p>}
                    {selectedStationId && agents.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        Nenhum agente cadastrado. Digite o nome do agente responsável ou cadastre agentes em "Postos".
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          <div className="pt-6">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <PlusCircle size={20} />
                  Finalizar Registro de Atendimento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
