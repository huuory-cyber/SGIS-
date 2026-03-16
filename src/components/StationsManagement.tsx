import { useState, type FormEvent } from 'react';
import { MapPin, Plus, Edit, Trash2, Building2, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { createStation } from '../lib/supabase';
import { Station, UserProfile, StationFormData } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StationsManagementProps {
  stations: Station[];
  providers: UserProfile[];
  onRefresh: () => void;
}

export default function StationsManagement({ stations, providers, onRefresh }: StationsManagementProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeProviders = providers.filter(p => p.is_active && p.role === 'provider');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data: StationFormData = {
      name: formData.get('name') as string,
      address: formData.get('address') as string || undefined,
      neighborhood: formData.get('neighborhood') as string,
      locality: formData.get('locality') as string,
    };

    const providerId = formData.get('provider_id') as string;

    try {
      await createStation({
        ...data,
        provider_id: providerId,
      });
      setIsFormOpen(false);
      onRefresh();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Failed to create station:', error);
      alert('Erro ao criar posto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Postos de Atendimento</h3>
          <p className="text-sm text-slate-500">Gerencie os postos de atendimento do sistema</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-all"
        >
          <Plus size={18} />
          Novo Posto
        </button>
      </div>

      {/* Add Station Form */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-bold text-slate-900">Novo Posto de Atendimento</h4>
            <button
              onClick={() => setIsFormOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Nome do Posto *</label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="Ex: CRAS Central"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Provedor Responsável *</label>
                <select
                  name="provider_id"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                >
                  <option value="">Selecione...</option>
                  {activeProviders.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Bairro *</label>
                <input
                  name="neighborhood"
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="Ex: Centro"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Localidade *</label>
                <input
                  name="locality"
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="Ex: Zona 1"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Endereço</label>
                <input
                  name="address"
                  type="text"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="Rua, número, referência..."
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Criar Posto
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-6 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stations.map((station) => {
          const provider = providers.find(p => p.id === station.provider_id);
          return (
            <div key={station.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                  <MapPin size={24} />
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <Edit size={16} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h4 className="text-lg font-bold text-slate-900 mb-2">{station.name}</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin size={14} className="text-slate-400" />
                  <span>{station.neighborhood}, {station.locality}</span>
                </div>
                
                {station.address && (
                  <div className="text-slate-500 text-xs truncate">
                    {station.address}
                  </div>
                )}

                {provider && (
                  <div className="flex items-center gap-2 text-slate-600 pt-2 border-t border-slate-100">
                    <Building2 size={14} className="text-slate-400" />
                    <span className="text-xs">{provider.full_name}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <Calendar size={12} className="text-slate-400" />
                  <span>{format(parseISO(station.created_at), 'dd/MM/yyyy')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {stations.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <MapPin size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhum posto cadastrado</h3>
          <p className="text-sm text-slate-500 mb-6">Comece adicionando um posto de atendimento ao sistema.</p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-all"
          >
            <Plus size={18} />
            Adicionar Posto
          </button>
        </div>
      )}
    </div>
  );
}
