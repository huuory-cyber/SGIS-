import { useState, useEffect, type FormEvent } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, getRecords, getStations, getAgents, createStation } from '../lib/supabase';
import {
  Users, PlusCircle, BarChart3, Activity, MapPin, ShieldAlert, LogOut,
  Menu, Clock, Building, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SocialRecord, Station, Agent } from '../types';
import EnhancedForm from '../components/EnhancedForm';
import RecordsTable from '../components/RecordsTable';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ProviderDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'stations' | 'form'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [records, setRecords] = useState<SocialRecord[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showStationForm, setShowStationForm] = useState(false);
  const [isSubmittingStation, setIsSubmittingStation] = useState(false);

  useEffect(() => {
    loadData();
    
    // Real-time subscription for new records
    const channel = supabase
      .channel('social_records_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'social_records',
        filter: `provider_id=eq.${user?.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setRecords(prev => [payload.new as SocialRecord, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setRecords(prev => prev.map(r => r.id === payload.new.id ? payload.new as SocialRecord : r));
        } else if (payload.eventType === 'DELETE') {
          setRecords(prev => prev.filter(r => r.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    
    try {
      const [recordsData, stationsData, agentsData] = await Promise.all([
        getRecords(user.id),
        getStations(user.id),
        getAgents(user.id),
      ]);
      setRecords(recordsData as SocialRecord[]);
      setStations(stationsData as Station[]);
      setAgents(agentsData as Agent[]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleCreateStation = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSubmittingStation(true);
    const formData = new FormData(e.currentTarget);

    try {
      await createStation({
        name: formData.get('name') as string,
        address: formData.get('address') as string || undefined,
        neighborhood: formData.get('neighborhood') as string,
        locality: formData.get('locality') as string,
        provider_id: user.id,
      });

      setShowStationForm(false);
      (e.target as HTMLFormElement).reset();
      await loadData();
    } catch (error) {
      console.error('Failed to create station:', error);
      alert('Erro ao criar posto. Tente novamente.');
    } finally {
      setIsSubmittingStation(false);
    }
  };

  const stats = {
    total: records.length,
    disability: records.filter(r => r.has_disability).length,
    unemployed: records.filter(r => r.employment_status === 'Desempregado').length,
    critical: records.filter(r => r.situation === 'Crítica').length,
    today: records.filter(r => format(parseISO(r.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length,
    stations: stations.length,
    agents: agents.length,
  };

  const chartData = records.reduce((acc: any[], r) => {
    const date = format(parseISO(r.created_at), 'dd/MM');
    const existing = acc.find(a => a.date === date);
    if (existing) existing.count++;
    else acc.push({ date, count: 1 });
    return acc;
  }, []).slice(-7);

  const situationData = [
    { name: 'Crítica', value: stats.critical, color: '#ef4444' },
    { name: 'Moderada', value: records.filter(r => r.situation === 'Moderada').length, color: '#f97316' },
    { name: 'Estável', value: records.filter(r => r.situation === 'Estável').length, color: '#10b981' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Building size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SGIS Impact</h1>
              <p className="text-xs text-slate-400">Painel do Provedor</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <button 
              onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                activeTab === 'overview' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <BarChart3 size={20} />
              <span className="font-medium">Visão Geral</span>
            </button>
            <button 
              onClick={() => { setActiveTab('records'); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                activeTab === 'records' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Activity size={20} />
              <span className="font-medium">Registros</span>
            </button>
            <button 
              onClick={() => { setActiveTab('stations'); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                activeTab === 'stations' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <MapPin size={20} />
              <span className="font-medium">Meus Postos</span>
            </button>
            <button 
              onClick={() => { setActiveTab('form'); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                activeTab === 'form' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <PlusCircle size={20} />
              <span className="font-medium">Novo Registro</span>
            </button>
          </nav>

          <div className="pt-6 border-t border-slate-800">
            <div className="flex items-center gap-3 px-4 py-3 text-slate-400">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold text-white">
                {user?.full_name?.charAt(0) || 'P'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user?.full_name || 'Provedor'}</p>
                <p className="text-xs truncate text-emerald-400">Provedor de Serviços</p>
              </div>
              <button onClick={handleSignOut} className="hover:text-white transition-colors">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-500">
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-slate-800 capitalize">
              {activeTab === 'overview' ? 'Visão Geral' : 
               activeTab === 'records' ? 'Registros de Atendimento' :
               activeTab === 'stations' ? 'Meus Postos' : 'Novo Registro'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-slate-600 text-sm">
              <Clock size={16} />
              <span>{format(new Date(), 'HH:mm')}</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Atendimentos', value: stats.total, icon: Users, color: 'emerald' },
                    { label: 'Situação Crítica', value: stats.critical, icon: ShieldAlert, color: 'red' },
                    { label: 'Desempregados', value: stats.unemployed, icon: Activity, color: 'orange' },
                    { label: 'Postos Ativos', value: stats.stations, icon: MapPin, color: 'blue' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        stat.color === 'emerald' && "bg-emerald-50 text-emerald-500",
                        stat.color === 'red' && "bg-red-50 text-red-500",
                        stat.color === 'orange' && "bg-orange-50 text-orange-500",
                        stat.color === 'blue' && "bg-blue-50 text-blue-500",
                      )}>
                        <stat.icon size={20} />
                      </div>
                      <p className="text-2xl font-bold text-slate-900 mt-4">{stat.value}</p>
                      <p className="text-sm text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Tendência (7 dias)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#f8fafc' }}
                          />
                          <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Situação dos Casos</h3>
                    <div className="h-64 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={situationData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {situationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'records' && (
              <motion.div 
                key="records"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <RecordsTable
                  records={records}
                  isAdmin={false}
                  onRecordUpdated={loadData}
                  onRecordDeleted={loadData}
                />
              </motion.div>
            )}

            {activeTab === 'stations' && (
              <motion.div
                key="stations"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Create Station Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowStationForm(true)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-all flex items-center gap-2"
                  >
                    <PlusCircle size={18} />
                    Novo Posto
                  </button>
                </div>

                {/* Create Station Form */}
                {showStationForm && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-bold text-slate-900">Cadastrar Novo Posto</h4>
                      <button
                        onClick={() => setShowStationForm(false)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <form onSubmit={handleCreateStation} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Nome do Posto *</label>
                          <input
                            name="name"
                            type="text"
                            required
                            disabled={isSubmittingStation}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all disabled:opacity-50"
                            placeholder="Ex: CRAS Central"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Bairro *</label>
                          <input
                            name="neighborhood"
                            type="text"
                            required
                            disabled={isSubmittingStation}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all disabled:opacity-50"
                            placeholder="Ex: Centro"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Localidade *</label>
                          <input
                            name="locality"
                            type="text"
                            required
                            disabled={isSubmittingStation}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all disabled:opacity-50"
                            placeholder="Ex: Zona 1"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Endereço</label>
                          <input
                            name="address"
                            type="text"
                            disabled={isSubmittingStation}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all disabled:opacity-50"
                            placeholder="Rua, número, referência..."
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-4">
                        <button
                          type="submit"
                          disabled={isSubmittingStation}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          {isSubmittingStation ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <PlusCircle size={18} />
                              Criar Posto
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowStationForm(false)}
                          disabled={isSubmittingStation}
                          className="px-6 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Stations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stations.map((station) => (
                    <div key={station.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
                        <MapPin size={24} />
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
                      </div>
                    </div>
                  ))}
                  {stations.length === 0 && !showStationForm && (
                    <div className="col-span-full bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                      <MapPin size={48} className="mx-auto text-slate-300 mb-4" />
                      <h4 className="text-lg font-semibold text-slate-700 mb-2">Nenhum posto cadastrado</h4>
                      <p className="text-sm text-slate-500 mb-6">Comece criando seu primeiro posto de atendimento</p>
                      <button
                        onClick={() => setShowStationForm(true)}
                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-all inline-flex items-center gap-2"
                      >
                        <PlusCircle size={18} />
                        Criar Primeiro Posto
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'form' && (
              <motion.div 
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <EnhancedForm onSubmit={loadData} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
